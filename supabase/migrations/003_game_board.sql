-- 7ROF BSMH | التحديث 0.4: لوحة اللعب (الحروف، الأسبقية، الحكم، الفوز)
-- نفّذ هذا الملف في Supabase > SQL Editor (بعد 001 و 002).
-- القواعد: الأخضر يربط الصف الأعلى بالأسفل، والبرتقالي يربط العمود الأيسر بالأيمن.

alter table public.rooms
  add column if not exists letters text[] not null default '{}',
  add column if not exists owners text[] not null default '{}',   -- '' أو green أو orange لكل خلية
  add column if not exists active_cell int,
  add column if not exists buzz_user uuid,
  add column if not exists buzz_team text,
  add column if not exists locked_team text,
  add column if not exists winner text;

-- هل يتصل الفريق بين طرفيه؟ (لوحة سداسية: الجيران (0,±1) (1,0) (1,-1) (-1,0) (-1,1))
create or replace function public.hex_connected(o text[], n int, team text) returns boolean
language plpgsql immutable as $$
declare
  seen boolean[] := array_fill(false, array[n * n]);
  stack int[] := '{}'; cur int; r int; c int; nr int; nc int;
  dr int[] := array[0, 0, 1, 1, -1, -1];
  dc int[] := array[-1, 1, 0, -1, 0, 1];
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
      nr := r + dr[k]; nc := c + dc[k];
      if nr >= 0 and nr < n and nc >= 0 and nc < n
         and not seen[nr * n + nc + 1] and o[nr * n + nc + 1] = team then
        seen[nr * n + nc + 1] := true; stack := stack || (nr * n + nc);
      end if;
    end loop;
  end loop;
  return false;
end $$;

create or replace function public.hex_winner(o text[], n int) returns text
language sql immutable as $$
  select case when public.hex_connected(o, n, 'green') then 'green'
              when public.hex_connected(o, n, 'orange') then 'orange' end;
$$;

-- يتحقق أن المستدعي هو المنظم وأن المباراة جارية، ويقفل صف الغرفة
create or replace function public._host_room(p_room uuid) returns rooms
language plpgsql security definer set search_path = public as $$
declare r rooms;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into r from rooms where id = p_room for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_user_id <> auth.uid() then raise exception 'not_host'; end if;
  if r.status <> 'playing' then raise exception 'not_playing'; end if;
  return r;
end $$;

-- بدء المباراة: توزيع الحروف عشوائيًا على اللوحة
create or replace function public.start_game(p_room uuid) returns json
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); r rooms; g int; o int; picked text[];
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select * into r from rooms where id = p_room for update;
  if not found then raise exception 'room_not_found'; end if;
  if r.host_user_id <> uid then raise exception 'not_host'; end if;
  if r.status <> 'waiting' then raise exception 'already_started'; end if;
  select count(*) filter (where team = 'green'), count(*) filter (where team = 'orange')
    into g, o from players where room_id = r.id;
  if g < 1 or o < 1 then raise exception 'need_both_teams'; end if;

  select array_agg(l) into picked from (
    select l from unnest(regexp_split_to_array('ابتثجحخدذرزسشصضطظعغفقكلمنهوي', '')) l
    order by random() limit r.board_size * r.board_size) t;

  update rooms set status = 'playing', letters = picked,
    owners = array_fill(''::text, array[r.board_size * r.board_size]),
    active_cell = null, buzz_user = null, buzz_team = null, locked_team = null, winner = null
  where id = r.id;
  return json_build_object('status', 'playing');
end $$;

-- المنظم يفتح خلية للسؤال
create or replace function public.pick_cell(p_room uuid, p_cell int) returns void
language plpgsql security definer set search_path = public as $$
declare r rooms;
begin
  r := public._host_room(p_room);
  if p_cell < 0 or p_cell >= r.board_size * r.board_size then raise exception 'bad_cell'; end if;
  if r.owners[p_cell + 1] <> '' then raise exception 'cell_taken'; end if;
  update rooms set active_cell = p_cell, buzz_user = null, buzz_team = null, locked_team = null where id = r.id;
end $$;

-- اللاعب يضغط زر السرعة: أول ضغطة تُسجَّل فقط (القفل على مستوى الصف)
create or replace function public.buzz(p_room uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid(); t text; hit uuid;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  select team into t from players where room_id = p_room and user_id = uid;
  if t is null then raise exception 'not_player'; end if;
  update rooms set buzz_user = uid, buzz_team = t
   where id = p_room and status = 'playing' and active_cell is not null
     and buzz_user is null and locked_team is distinct from t
  returning buzz_user into hit;
  return hit is not null;
end $$;

-- المنظم يحكم على إجابة أسرع لاعب
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
      winner = w, status = case when w is not null then 'finished' else status end where id = r.id;
  elsif r.locked_team is not null then   -- أخطأ الفريقان: تُغلق الخلية
    update rooms set active_cell = null, buzz_user = null, buzz_team = null, locked_team = null where id = r.id;
  else                                    -- أخطأ الفريق: الفرصة للفريق الآخر
    update rooms set buzz_user = null, buzz_team = null, locked_team = r.buzz_team where id = r.id;
  end if;
end $$;

-- المنظم يعطي الخلية لفريق مباشرة (أو يفرّغها بقيمة فارغة)
create or replace function public.assign_cell(p_room uuid, p_cell int, p_team text) returns void
language plpgsql security definer set search_path = public as $$
declare r rooms; o text[]; w text;
begin
  r := public._host_room(p_room);
  if p_cell < 0 or p_cell >= r.board_size * r.board_size then raise exception 'bad_cell'; end if;
  if p_team not in ('green', 'orange', '') then raise exception 'invalid_team'; end if;
  o := r.owners; o[p_cell + 1] := p_team;
  w := public.hex_winner(o, r.board_size);
  update rooms set owners = o, active_cell = null, buzz_user = null, buzz_team = null, locked_team = null,
    winner = w, status = case when w is not null then 'finished' else status end where id = r.id;
end $$;

create or replace function public.skip_cell(p_room uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r rooms;
begin
  r := public._host_room(p_room);
  update rooms set active_cell = null, buzz_user = null, buzz_team = null, locked_team = null where id = r.id;
end $$;

revoke all on function public.hex_connected(text[], int, text) from public, anon, authenticated;
revoke all on function public.hex_winner(text[], int) from public, anon, authenticated;
revoke all on function public._host_room(uuid) from public, anon, authenticated;
revoke all on function public.start_game(uuid) from public, anon;
revoke all on function public.pick_cell(uuid, int) from public, anon;
revoke all on function public.buzz(uuid) from public, anon;
revoke all on function public.judge(uuid, boolean) from public, anon;
revoke all on function public.assign_cell(uuid, int, text) from public, anon;
revoke all on function public.skip_cell(uuid) from public, anon;
grant execute on function public.start_game(uuid) to authenticated;
grant execute on function public.pick_cell(uuid, int) to authenticated;
grant execute on function public.buzz(uuid) to authenticated;
grant execute on function public.judge(uuid, boolean) to authenticated;
grant execute on function public.assign_cell(uuid, int, text) to authenticated;
grant execute on function public.skip_cell(uuid) to authenticated;
