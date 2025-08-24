create or replace view public.ride_event_summary_v as
select
  re.id,
  re.date,
  re.meeting_time,
  re.status,
  re.pickup_location_id,
  pl.name as pickup_name,
  trim(coalesce(p1.first_name,'') || ' ' || coalesce(p1.last_name,'')) as pilot_name,
  trim(coalesce(pa1.first_name,'') || ' ' || coalesce(pa1.last_name,'')) as passenger1_name,
  trim(coalesce(pa2.first_name,'') || ' ' || coalesce(pa2.last_name,'')) as passenger2_name,
  trim(coalesce(ec.first_name,'') || ' ' || coalesce(ec.last_name,'')) as emergency_contact_name
from public.ride_events re
left join public.people p1 on p1.id = re.pilot_id
left join public.people pa1 on pa1.id = re.passenger1_id
left join public.people pa2 on pa2.id = re.passenger2_id
left join public.people ec on ec.id = re.emergency_contact_id
left join public.pickup_locations pl on pl.id = re.pickup_location_id;

grant select on public.ride_event_summary_v to anon, authenticated;
