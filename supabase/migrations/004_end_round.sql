-- 7ROF BSMH | التحديث 0.6: إنهاء الجولة من المنظم
-- نفّذ هذا الملف في Supabase > SQL Editor (بعد 003).
-- ينهي المباراة للجميع بدون فائز (winner = null)، فيعود اللاعبون للصفحة الرئيسية.

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
