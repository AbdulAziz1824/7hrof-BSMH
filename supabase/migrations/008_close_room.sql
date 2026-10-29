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
