-- 7ROF BSMH | التحديث 0.3: زر بدء المباراة
-- نفّذ هذا الملف في Supabase > SQL Editor (بعد 001_init.sql).

create or replace function public.start_game(p_room uuid) returns json
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  r rooms; g int; o int;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into r from rooms where id = p_room;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_user_id <> uid then raise exception 'not_host'; end if;
  if r.status <> 'waiting' then raise exception 'already_started'; end if;

  select count(*) filter (where team = 'green'), count(*) filter (where team = 'orange')
    into g, o from players where room_id = r.id;
  if g < 1 or o < 1 then raise exception 'need_both_teams'; end if;

  update rooms set status = 'playing' where id = r.id;
  return json_build_object('status', 'playing');
end $$;

revoke all on function public.start_game(uuid) from public, anon;
grant execute on function public.start_game(uuid) to authenticated;
