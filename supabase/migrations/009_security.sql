-- 7ROF BSMH | التحديث 1.1: تحسينات أمنية
-- نفّذ هذا الملف في Supabase > SQL Editor (بعد 008). آمن إن نُفّذ أكثر من مرة.
-- 1) تنظيف الأسماء من محارف التحكم وحيل اتجاه النص (RTL override) التي تُستخدم لانتحال الأسماء.
-- 2) حد أقصى لعدد الغرف النشطة لكل منظم (3 خلال 12 ساعة) لمنع إغراق قاعدة البيانات.

create or replace function public.create_room(
  p_name text, p_board_size int, p_rounds int, p_mode text, p_host_plays boolean, p_team text default null
) returns json
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text; new_room rooms;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  p_name := btrim(regexp_replace(coalesce(p_name, ''), '[\u0001-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]', '', 'g'));
  if char_length(p_name) not between 1 and 24 then raise exception 'invalid_name'; end if;
  if p_host_plays and p_team is distinct from 'green' and p_team is distinct from 'orange' then raise exception 'team_required'; end if;
  if (select count(*) from rooms where host_user_id = uid and status <> 'finished'
        and created_at > now() - interval '12 hours') >= 3 then raise exception 'too_many_rooms'; end if;

  loop
    new_code := '';
    for i in 1..5 loop
      new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from rooms where code = new_code);
  end loop;

  insert into rooms (code, host_user_id, board_size, total_rounds, mode, host_plays)
  values (new_code, uid, p_board_size, p_rounds, p_mode, p_host_plays) returning * into new_room;

  insert into players (room_id, user_id, name, team, is_host)
  values (new_room.id, uid, p_name, case when p_host_plays then p_team end, true);

  return json_build_object('room_id', new_room.id, 'code', new_room.code);
end $$;

create or replace function public.join_room(p_code text, p_name text, p_team text) returns json
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r rooms; t text;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  p_name := btrim(regexp_replace(coalesce(p_name, ''), '[\u0001-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2066-\u2069]', '', 'g'));
  if char_length(p_name) not between 1 and 24 then raise exception 'invalid_name'; end if;

  select * into r from rooms where code = upper(btrim(coalesce(p_code, '')));
  if not found then raise exception 'room_not_found'; end if;

  if r.mode = 'board_manual' then t := null;
  else
    if p_team is distinct from 'green' and p_team is distinct from 'orange' then raise exception 'invalid_team'; end if;
    t := p_team;
  end if;

  if exists (select 1 from players where room_id = r.id and user_id = uid) then
    update players set name = p_name where room_id = r.id and user_id = uid and is_host = false;
  else
    if r.status = 'finished' then raise exception 'room_finished'; end if;
    if (select count(*) from players where room_id = r.id) >= 40 then raise exception 'room_full'; end if;
    insert into players (room_id, user_id, name, team) values (r.id, uid, p_name, t);
  end if;
  return json_build_object('room_id', r.id, 'code', r.code);
end $$;

-- ضمان الصلاحيات: الدوال الداخلية مغلقة، والعامة للمستخدمين المسجلين (بمن فيهم الزوار المجهولون) فقط
revoke all on function public.create_room(text,int,int,text,boolean,text) from public, anon;
revoke all on function public.join_room(text,text,text) from public, anon;
grant execute on function public.create_room(text,int,int,text,boolean,text) to authenticated;
grant execute on function public.join_room(text,text,text) to authenticated;
revoke all on function public.server_now() from public, anon;
grant execute on function public.server_now() to authenticated;

notify pgrst, 'reload schema';
