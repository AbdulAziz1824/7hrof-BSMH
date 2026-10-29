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
