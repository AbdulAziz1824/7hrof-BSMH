-- 7ROF BSMH | المرحلة 1-2: الغرف واللاعبون
-- نفّذ هذا الملف في Supabase > SQL Editor. فعّل أولًا Anonymous sign-ins من Authentication > Providers.

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_user_id uuid not null,
  board_size int not null check (board_size in (3,4,5)),
  total_rounds int not null check (total_rounds between 1 and 3),
  mode text not null check (mode in ('board_buzzer','buzzer_only','board_manual')),
  host_plays boolean not null default false,
  status text not null default 'waiting' check (status in ('waiting','playing','finished')),
  current_round int not null default 1,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null,
  name text not null check (char_length(name) between 1 and 24),
  team text check (team in ('green','orange')),   -- null = منظم لا يلعب
  is_host boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id)
);
create index on public.players (room_id);

-- القراءة لأعضاء الغرفة فقط. لا توجد سياسات كتابة: كل التعديلات عبر الدوال أدناه.
create or replace function public.is_room_member(p_room uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from players where room_id = p_room and user_id = auth.uid());
$$;

alter table public.rooms enable row level security;
alter table public.players enable row level security;
create policy rooms_read on public.rooms for select using (public.is_room_member(id));
create policy players_read on public.players for select using (public.is_room_member(room_id));

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
  p_name := btrim(coalesce(p_name, ''));
  if char_length(p_name) not between 1 and 24 then raise exception 'invalid_name'; end if;
  if p_host_plays and p_team not in ('green','orange') then raise exception 'team_required'; end if;

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
declare uid uuid := auth.uid(); r rooms;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  p_name := btrim(coalesce(p_name, ''));
  if char_length(p_name) not between 1 and 24 then raise exception 'invalid_name'; end if;
  if p_team not in ('green','orange') then raise exception 'invalid_team'; end if;

  select * into r from rooms where code = upper(btrim(p_code));
  if not found then raise exception 'room_not_found'; end if;

  if exists (select 1 from players where room_id = r.id and user_id = uid) then
    update players set name = p_name where room_id = r.id and user_id = uid and is_host = false;  -- عودة لنفس المقعد
  else
    if r.status = 'finished' then raise exception 'room_finished'; end if;
    if (select count(*) from players where room_id = r.id) >= 40 then raise exception 'room_full'; end if;
    insert into players (room_id, user_id, name, team) values (r.id, uid, p_name, p_team);
  end if;
  return json_build_object('room_id', r.id, 'code', r.code);
end $$;

revoke all on function public.create_room(text,int,int,text,boolean,text) from public, anon;
revoke all on function public.join_room(text,text,text) from public, anon;
grant execute on function public.create_room(text,int,int,text,boolean,text) to authenticated;
grant execute on function public.join_room(text,text,text) to authenticated;

alter publication supabase_realtime add table public.rooms, public.players;
