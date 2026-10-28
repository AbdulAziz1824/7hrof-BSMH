const MAP: Record<string, string> = {
  not_authenticated: "تعذّر تسجيل الدخول. حدّث الصفحة وأعد المحاولة.",
  invalid_name: "اكتب اسمًا من حرف إلى 24 حرفًا.",
  team_required: "اختر فريقك لتشارك في اللعب.",
  invalid_team: "اختر الفريق الأخضر أو البرتقالي.",
  room_not_found: "لا توجد غرفة بهذا الرمز. تأكد منه وأعد المحاولة.",
  room_finished: "انتهت هذه المباراة ولا يمكن الانضمام إليها.",
  not_host: "المنظم وحده يستطيع بدء المباراة.",
  already_started: "بدأت هذه المباراة بالفعل.",
  need_both_teams: "يلزم وجود لاعب واحد على الأقل في كل فريق للبدء.",
  not_playing: "المباراة ليست جارية الآن.",
  not_player: "أنت لا تلعب في أي فريق، فلا يمكنك الضغط.",
  cell_taken: "هذه الخلية محسومة بالفعل.",
  nothing_to_judge: "لا توجد إجابة للحكم عليها الآن.",
  manual_mode: "هذا النمط بدون أزرار سرعة.",
  bad_cell: "خلية غير صالحة.",
  room_full: "الغرفة ممتلئة (الحد الأقصى 40 لاعبًا).",
};
export function arError(e: unknown): string {
  const m = (e as { message?: string })?.message ?? "";
  if (/PGRST202|Could not find the function|schema cache/i.test(m)) return "قاعدة البيانات تحتاج تحديثًا: نفّذ ملف SQL الأخير (005_rect_board.sql) في Supabase.";
  for (const k of Object.keys(MAP)) if (m.includes(k)) return MAP[k];
  return "حدث خطأ غير متوقع. أعد المحاولة بعد قليل.";
}
