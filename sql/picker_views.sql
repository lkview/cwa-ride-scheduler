create or replace view public.picker_pilots_v as
select p.id,
       coalesce(nullif(trim(concat(p.first_name,' ',p.last_name)),''), p.email, p.phone, p.id::text) as display_name
from public.people p join public.people_roles pr on pr.person_id = p.id
where pr.role::text = 'pilot';

create or replace view public.picker_emergency_contacts_v as
select p.id,
       coalesce(nullif(trim(concat(p.first_name,' ',p.last_name)),''), p.email, p.phone, p.id::text) as display_name
from public.people p join public.people_roles pr on pr.person_id = p.id
where pr.role::text = 'emergency_contact';

create or replace view public.picker_passengers_v as
select p.id,
       coalesce(nullif(trim(concat(p.first_name,' ',p.last_name)),''), p.email, p.phone, p.id::text) as display_name
from public.people p;

grant select on public.picker_pilots_v, public.picker_passengers_v, public.picker_emergency_contacts_v to anon, authenticated;
