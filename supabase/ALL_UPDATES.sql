-- 7ROF BSMH | ملف شامل: يجمع 005 و006 و007 و008 بالترتيب. نفّذه كاملًا مرة واحدة في Supabase > SQL Editor.
-- بعد 001 و002 و003. آمن إن نُفّذ أكثر من مرة (create or replace / if not exists).

-- ================= 005_rect_board =================
-- 7ROF BSMH | التحديث 0.8: لوحة مستطيلة + إنهاء الجولة + أنماط اللعب الثلاثة
-- نفّذ هذا الملف كاملًا في Supabase > SQL Editor (بعد 001 و 002 و 003). آمن إن نُفّذ أكثر من مرة.
--
-- الجيران في اللوحة المستطيلة (الأعمدة الفردية تنزل نصف خلية):
--   كل خلية: فوق وتحت. العمود الزوجي: (r-1,c±1) و (r,c±1). العمود الفردي: (r,c±1) و (r+1,c±1).
-- الأخضر يربط الصف الأعلى بالأسفل، والبرتقالي يربط العمود الأيسر بالأيمن.
-- الأنماط: board_buzzer (لوحة + أزرار)، buzzer_only (أزرار للاعبين بلا لوحة)، board_manual (لوحة فقط بيد المنظم، بلا لاعبين).

create or replace function public.hex_connected(o text[], n int, team text) returns boolean
language plpgsql immutable as $$
declare
  seen boolean[] := array_fill(false, array[n * n]);
  stack int[] := '{}'; cur int; r int; c int; nr int; nc int;
  dc int[] := array[0, 0, -1, -1, 1, 1];
  dr_even int[] := array[-1, 1, -1, 0, -1, 0];
  dr_odd int[] := array[-1, 1, 0, 1, 0, 1];
begin
  for i in 0..n - 1 loop
    cur := case when team = 'green' then i else i * n end;
    if o[cur + 1] = team then stack := stack || cur; seen[cur + 1] := true; end if;
  end loop;
  while coalesce(array_length(stack, 1), 0) > 0 loop
    cur := stack[array_length(stack, 1)];
    stack := stack[1:array_length(stack, 1) - 1];
    r := cur / n; c := cur % n;
    if (team = 'green' and r = n - 1) or (team = 'orange' and c = n - 1) then return true; end if;
    for k in 1..6 loop
      nr := r + case when c % 2 = 0 then dr_even[k] else dr_odd[k] end;
      nc := c + dc[k];
      if nr >= 0 and nr < n and nc >= 0 and nc < n
         and not seen[nr * n + nc + 1] and o[nr * n + nc + 1] = team then
        seen[nr * n + nc + 1] := true; stack := stack || (nr * n + nc);
      end if;
    end loop;
  end loop;
  return false;
end $$;

revoke all on function public.hex_connected(text[], int, text) from public, anon, authenticated;

-- إنهاء الجولة من المنظم (ينهي المباراة للجميع بدون فائز)
create or replace function public.end_round(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r rooms;
begin
  r := public._host_room(p_room);
  update rooms set status = 'finished', winner = null,
    active_cell = null, buzz_user = null, buzz_team = null, locked_team = null
  where id = r.id;
end $$;

revoke all on function public.end_round(uuid) from public, anon;
grant execute on function public.end_round(uuid) to authenticated;

-- بدء المباراة: النمط اليدوي لا يحتاج فريقين من اللاعبين
create or replace function public.start_game(p_room uuid) returns json
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r rooms; g int; o int; picked text[];
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into r from rooms where id = p_room for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_user_id <> uid then raise exception 'not_host'; end if;
  if r.status <> 'waiting' then raise exception 'already_started'; end if;
  if r.mode <> 'board_manual' then
    select count(*) filter (where team = 'green'), count(*) filter (where team = 'orange')
      into g, o from players where room_id = r.id;
    if g < 1 or o < 1 then raise exception 'need_both_teams'; end if;
  end if;

  select array_agg(l) into picked from (
    select l from unnest(regexp_split_to_array('ابتثجحخدذرزسشصضطظعغفقكلمنهوي', '')) l
    order by random() limit r.board_size * r.board_size) t;

  update rooms set status = 'playing', letters = picked,
    owners = array_fill(''::text, array[r.board_size * r.board_size]),
    active_cell = null, buzz_user = null, buzz_team = null, locked_team = null, winner = null
  where id = r.id;
  return json_build_object('status', 'playing');
end $$;

-- المنظم يفتح خلية (في النمط اليدوي يستطيع فتح خلية محسومة لتغييرها)
create or replace function public.pick_cell(p_room uuid, p_cell int) returns void
language plpgsql security definer set search_path = public as $$
declare r rooms;
begin
  r := public._host_room(p_room);
  if p_cell < 0 or p_cell >= r.board_size * r.board_size then raise exception 'bad_cell'; end if;
  if r.mode <> 'board_manual' and r.owners[p_cell + 1] <> '' then raise exception 'cell_taken'; end if;
  update rooms set active_cell = p_cell, buzz_user = null, buzz_team = null, locked_team = null where id = r.id;
end $$;

-- زر السرعة: غير متاح في النمط اليدوي
create or replace function public.buzz(p_room uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t text; hit uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select team into t from players where room_id = p_room and user_id = uid;
  if t is null then raise exception 'not_player'; end if;
  update rooms set buzz_user = uid, buzz_team = t
   where id = p_room and status = 'playing' and active_cell is not null and mode <> 'board_manual'
     and buzz_user is null and locked_team is distinct from t
  returning buzz_user into hit;
  return hit is not null;
end $$;

-- الانضمام: في النمط اليدوي يدخل الجميع كمشاهدين بلا فريق
create or replace function public.join_room(p_code text, p_name text, p_team text) returns json
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r rooms; t text;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  p_name := btrim(coalesce(p_name, ''));
  if char_length(p_name) not between 1 and 24 then raise exception 'invalid_name'; end if;

  select * into r from rooms where code = upper(btrim(p_code));
  if not found then raise exception 'room_not_found'; end if;

  if r.mode = 'board_manual' then t := null;
  else
    if p_team not in ('green','orange') then raise exception 'invalid_team'; end if;
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

-- يجعل Supabase يتعرف على الدوال الجديدة فورًا
notify pgrst, 'reload schema';

-- ================= 006_timer =================
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

-- ================= 007_rounds_leave =================
-- 7ROF BSMH | التحديث 1.0: عدد الجولات + خروج اللاعب
-- نفّذ هذا الملف في Supabase > SQL Editor (بعد 006). آمن إن نُفّذ أكثر من مرة.
-- الجولات: يفوز بالمباراة من يسبق إلى أغلبية الجولات (جولة: 1 | جولتان: 2 | ثلاث: 2)،
-- وعند انتهاء كل الجولات بنتيجة متساوية تكون النتيجة تعادل (winner = 'tie').
-- بعد كل جولة لا تنتهي بها المباراة تبدأ جولة جديدة بحروف جديدة تلقائيًا.

alter table public.rooms
  add column if not exists green_wins int not null default 0,
  add column if not exists orange_wins int not null default 0,
  add column if not exists last_round_winner text;

create or replace function public._pick_letters(n int) returns text[]
language sql volatile as $$
  select array_agg(l) from (
    select l from unnest(regexp_split_to_array('ابتثجحخدذرزسشصضطظعغفقكلمنهوي', '')) l
    order by random() limit n * n) t;
$$;
revoke all on function public._pick_letters(int) from public, anon, authenticated;

-- يطبّق ملكية الخلايا الجديدة ويحسم الجولة/المباراة إن وُجد رابح
create or replace function public._apply_cells(r rooms, o text[]) returns void
language plpgsql security definer set search_path = public as $$
declare w text; gw int; ow int;
begin
  w := public.hex_winner(o, r.board_size);
  if w is null then
    update rooms set owners = o, active_cell = null, buzz_user = null, buzz_team = null,
      locked_team = null, question_ends_at = null where id = r.id;
    return;
  end if;
  gw := r.green_wins + case when w = 'green' then 1 else 0 end;
  ow := r.orange_wins + case when w = 'orange' then 1 else 0 end;
  if gw * 2 > r.total_rounds or ow * 2 > r.total_rounds or r.current_round >= r.total_rounds then
    update rooms set owners = o, green_wins = gw, orange_wins = ow, last_round_winner = w,
      winner = case when gw > ow then 'green' when ow > gw then 'orange' else 'tie' end,
      status = 'finished', active_cell = null, buzz_user = null, buzz_team = null,
      locked_team = null, question_ends_at = null where id = r.id;
  else
    update rooms set letters = public._pick_letters(r.board_size),
      owners = array_fill(''::text, array[r.board_size * r.board_size]),
      green_wins = gw, orange_wins = ow, last_round_winner = w, current_round = r.current_round + 1,
      active_cell = null, buzz_user = null, buzz_team = null, locked_team = null, question_ends_at = null
    where id = r.id;
  end if;
end $$;
revoke all on function public._apply_cells(rooms, text[]) from public, anon, authenticated;

create or replace function public.start_game(p_room uuid) returns json
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r rooms; g int; o int;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into r from rooms where id = p_room for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_user_id <> uid then raise exception 'not_host'; end if;
  if r.status <> 'waiting' then raise exception 'already_started'; end if;
  if r.mode <> 'board_manual' then
    select count(*) filter (where team = 'green'), count(*) filter (where team = 'orange')
      into g, o from players where room_id = r.id;
    if g < 1 or o < 1 then raise exception 'need_both_teams'; end if;
  end if;
  update rooms set status = 'playing', letters = public._pick_letters(r.board_size),
    owners = array_fill(''::text, array[r.board_size * r.board_size]),
    current_round = 1, green_wins = 0, orange_wins = 0, last_round_winner = null,
    active_cell = null, buzz_user = null, buzz_team = null, locked_team = null, question_ends_at = null, winner = null
  where id = r.id;
  return json_build_object('status', 'playing');
end $$;

create or replace function public.judge(p_room uuid, p_correct boolean) returns void
language plpgsql security definer set search_path = public as $$
declare r rooms; o text[];
begin
  r := public._host_room(p_room);
  if r.active_cell is null or r.buzz_user is null then raise exception 'nothing_to_judge'; end if;
  if p_correct then
    o := r.owners; o[r.active_cell + 1] := r.buzz_team;
    perform public._apply_cells(r, o);
  elsif r.locked_team is not null then
    update rooms set active_cell = null, buzz_user = null, buzz_team = null, locked_team = null, question_ends_at = null where id = r.id;
  else
    update rooms set buzz_user = null, buzz_team = null, locked_team = r.buzz_team,
      question_ends_at = case when r.timer_seconds > 0 then now() + make_interval(secs => r.timer_seconds) end
    where id = r.id;
  end if;
end $$;

create or replace function public.assign_cell(p_room uuid, p_cell int, p_team text) returns void
language plpgsql security definer set search_path = public as $$
declare r rooms; o text[];
begin
  r := public._host_room(p_room);
  if p_cell < 0 or p_cell >= r.board_size * r.board_size then raise exception 'bad_cell'; end if;
  if p_team not in ('green', 'orange', '') then raise exception 'invalid_team'; end if;
  o := r.owners; o[p_cell + 1] := p_team;
  perform public._apply_cells(r, o);
end $$;

-- خروج اللاعب من الغرفة (المنظم لا يُحذف)
create or replace function public.leave_room(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  update rooms set buzz_user = null, buzz_team = null where id = p_room and buzz_user = uid;
  delete from players where room_id = p_room and user_id = uid and is_host = false;
end $$;
revoke all on function public.leave_room(uuid) from public, anon;
grant execute on function public.leave_room(uuid) to authenticated;

notify pgrst, 'reload schema';

-- ================= 008_close_room =================
-- 7ROF BSMH | التحديث 1.1: خروج المنظم يغلق الغرفة عند الجميع فورًا
-- نفّذ هذا الملف في Supabase > SQL Editor (بعد 007). آمن إن نُفّذ أكثر من مرة.
create or replace function public.close_room(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  update rooms set status = 'finished', winner = null, active_cell = null,
    buzz_user = null, buzz_team = null, locked_team = null, question_ends_at = null
  where id = p_room and host_user_id = uid and status <> 'finished';
end $$;
revoke all on function public.close_room(uuid) from public, anon;
grant execute on function public.close_room(uuid) to authenticated;

notify pgrst, 'reload schema';

