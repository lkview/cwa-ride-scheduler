-- One-shot SQL pack for CWA Ride Event Scheduler
-- Safe to re-run.

-- 0) Enum for status (desired values)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'ride_status') then
    create type ride_status as enum ('Tentative','Confirmed','Completed','Canceled');
  end if;
end $$;

-- 1) Ensure ride_events.status uses ride_status enum (map legacy values)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema='public' and table_name='ride_events' and column_name='status'
  ) then
    -- Convert text/varchar to enum if needed
    if exists (
      select 1
      from information_schema.columns
      where table_schema='public' and table_name='ride_events' and column_name='status'
        and udt_name <> 'ride_status'
    ) then
      alter table public.ride_events
        alter column status type ride_status using
          case
            when status ilike 'tentative' then 'Tentative'::ride_status
            when status ilike 'confirmed' then 'Confirmed'::ride_status
            when status ilike 'completed' then 'Completed'::ride_status
            when status ilike 'canceled' or status ilike 'cancelled' then 'Canceled'::ride_status
            when status ilike 'draft' then 'Tentative'::ride_status
            else 'Tentative'::ride_status
          end;
    end if;
  else
    -- Column missing -> create with default
    alter table public.ride_events add column status ride_status not null default 'Tentative';
  end if;
end $$;

-- 2) Integrity checks / constraints (idempotent)
-- 2a) pilot != passenger check
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'pilot_not_passenger'
  ) then
    alter table public.ride_events
      add constraint pilot_not_passenger
      check (pilot_id is distinct from passenger1_id and pilot_id is distinct from passenger2_id);
  end if;
end $$;

-- 2b) Foreign keys (use NOT VALID first to avoid blocking if historic data is bad)
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'ride_events_pilot_id_fkey') then
    alter table public.ride_events
      add constraint ride_events_pilot_id_fkey foreign key (pilot_id) references public.people(id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ride_events_passenger1_id_fkey') then
    alter table public.ride_events
      add constraint ride_events_passenger1_id_fkey foreign key (passenger1_id) references public.people(id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ride_events_passenger2_id_fkey') then
    alter table public.ride_events
      add constraint ride_events_passenger2_id_fkey foreign key (passenger2_id) references public.people(id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ride_events_emergency_contact_id_fkey') then
    alter table public.ride_events
      add constraint ride_events_emergency_contact_id_fkey foreign key (emergency_contact_id) references public.people(id) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'ride_events_pickup_location_id_fkey') then
    alter table public.ride_events
      add constraint ride_events_pickup_location_id_fkey foreign key (pickup_location_id) references public.pickup_locations(id) not valid;
  end if;
end $$;

-- 3) Picker views (drop+create to avoid column-drop errors)
drop view if exists public.picker_pilots_v cascade;
drop view if exists public.picker_passengers_v cascade;
drop view if exists public.picker_emergency_contacts_v cascade;

create view public.picker_pilots_v as
select
  p.id,
  coalesce(nullif(trim(concat(p.first_name,' ',p.last_name)),''), p.email, p.phone, p.id::text) as display_name
from public.people p
join public.people_roles pr on pr.person_id = p.id
where pr.role::text = 'pilot';

create view public.picker_emergency_contacts_v as
select
  p.id,
  coalesce(nullif(trim(concat(p.first_name,' ',p.last_name)),''), p.email, p.phone, p.id::text) as display_name
from public.people p
join public.people_roles pr on pr.person_id = p.id
where pr.role::text = 'emergency_contact';

create view public.picker_passengers_v as
select
  p.id,
  coalesce(nullif(trim(concat(p.first_name,' ',p.last_name)),''), p.email, p.phone, p.id::text) as display_name
from public.people p;

grant select on public.picker_pilots_v, public.picker_passengers_v, public.picker_emergency_contacts_v to anon, authenticated;

-- 4) Summary view (drop+create) with names
drop view if exists public.ride_event_summary_v cascade;

create view public.ride_event_summary_v as
select
  re.id,
  re.date,
  re.meeting_time,
  re.status,
  re.pickup_location_id,
  pl.name as pickup_name,
  trim(coalesce(p1.first_name,'') || ' ' || coalesce(p1.last_name,''))  as pilot_name,
  trim(coalesce(pa1.first_name,'') || ' ' || coalesce(pa1.last_name,'')) as passenger1_name,
  trim(coalesce(pa2.first_name,'') || ' ' || coalesce(pa2.last_name,'')) as passenger2_name,
  trim(coalesce(ec.first_name,'') || ' ' || coalesce(ec.last_name,''))   as emergency_contact_name
from public.ride_events re
left join public.people p1  on p1.id  = re.pilot_id
left join public.people pa1 on pa1.id = re.passenger1_id
left join public.people pa2 on pa2.id = re.passenger2_id
left join public.people ec  on ec.id  = re.emergency_contact_id
left join public.pickup_locations pl on pl.id = re.pickup_location_id;

grant select on public.ride_event_summary_v to anon, authenticated;
