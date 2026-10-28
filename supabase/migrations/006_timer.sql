-- 7ROF BSMH | التحديث 0.9: مؤقت السؤال
-- نفّذ هذا الملف في Supabase > SQL Editor (بعد 005). آمن إن نُفّذ أكثر من مرة.
-- timer_seconds = 0 يعني بدون وقت. question_ends_at يحسبه الخادم فلا تؤثر ساعة جوال اللاعب.

alter table public.rooms
  add column if not exists timer_seconds int not null default 10 check (timer_seconds between 0 and 120),
  add column if not exists question_ends_at timestamptz;

create or replace function public.server_now() returns timestamptz
language sql stable as $$ select now() $$;
grant execute on function public.server_now() to authenticated;

-- المنظم يضبط الوقت (قبل البدء أو أثناء السؤال: يعيد العدّ من جديد)
create or replace function public.set_timer(p_room uuid, p_seconds int) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r rooms;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into r from rooms where id = p_room for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_user_id <> uid then raise exception 'not_host'; end if;
  if p_seconds is null or p_seconds < 0 or p_seconds > 120 then raise exception 'bad_timer'; end if;
  update rooms set timer_seconds = p_seconds,
    question_ends_at = case
      when status = 'playing' and active_cell is not null and buzz_user is null
        then case when p_seconds > 0 then now() + make_interval(secs => p_seconds) end
      else question_ends_at end
  where id = r.id;
end $$;
revoke all on function public.set_timer(uuid, int) from public, anon;
grant execute on function public.set_timer(uuid, int) to authenticated;

-- فتح خلية: يبدأ المؤقت
create or replace function public.pick_cell(p_room uuid, p_cell int) returns void
language plpgsql security definer set search_path = public as $$
declare r rooms;
begin
  r := public._host_room(p_room);
  if p_cell < 0 or p_cell >= r.board_size * r.board_size then raise exception 'bad_cell'; end if;
  if r.mode <> 'board_manual' and r.owners[p_cell + 1] <> '' then raise exception 'cell_taken'; end if;
  update rooms set active_cell = p_cell, buzz_user = null, buzz_team = null, locked_team = null,
    question_ends_at = case when r.timer_seconds > 0 then now() + make_interval(secs => r.timer_seconds) end
  where id = r.id;
end $$;

-- الضغط: يُرفض بعد انتهاء الوقت (الخادم هو الحكم)، وأول ضغطة توقف المؤقت
create or replace function public.buzz(p_room uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t text; hit uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select team into t from players where room_id = p_room and user_id = uid;
  if t is null then raise exception 'not_player'; end if;
  update rooms set buzz_user = uid, buzz_team = t, question_ends_at = null
   where id = p_room and status = 'playing' and active_cell is not null and mode <> 'board_manual'
     and buzz_user is null and locked_team is distinct from t
     and (question_ends_at is null or question_ends_at > now())
  returning buzz_user into hit;
  return hit is not null;
end $$;

-- الحكم: عند خطأ أول فريق يبدأ المؤقت من جديد للفريق الآخر
create or replace function public.judge(p_room uuid, p_correct boolean) returns void
language plpgsql security definer set search_path = public as $$
declare r rooms; o text[]; w text;
begin
  r := public._host_room(p_room);
  if r.active_cell is null or r.buzz_user is null then raise exception 'nothing_to_judge'; end if;
  if p_correct then
    o := r.owners; o[r.active_cell + 1] := r.buzz_team;
    w := public.hex_winner(o, r.board_size);
    update rooms set owners = o, active_cell = null, buzz_user = null, buzz_team = null, locked_team = null,
      question_ends_at = null, winner = w, status = case when w is not null then 'finished' else status end where id = r.id;
  elsif r.locked_team is not null then
    update rooms set active_cell = null, buzz_user = null, buzz_team = null, locked_team = null, question_ends_at = null where id = r.id;
  else
    update rooms set buzz_user = null, buzz_team = null, locked_team = r.buzz_team,
      question_ends_at = case when r.timer_seconds > 0 then now() + make_interval(secs => r.timer_seconds) end
    where id = r.id;
  end if;
end $$;

notify pgrst, 'reload schema';
