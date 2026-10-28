-- 7ROF BSMH | التحديث 0.7: لوحة مستطيلة ثابتة (بدون ميلان) + إنهاء الجولة
-- نفّذ هذا الملف كاملًا في Supabase > SQL Editor (بعد 003). آمن إن نفّذت 004 سابقًا.
-- الجيران في اللوحة المستطيلة (الأعمدة الفردية تنزل نصف خلية):
--   كل خلية: فوق وتحت. العمود الزوجي: (r-1,c±1) و (r,c±1). العمود الفردي: (r,c±1) و (r+1,c±1).
-- الأخضر يربط الصف الأعلى بالأسفل، والبرتقالي يربط العمود الأيسر بالأيمن.

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
