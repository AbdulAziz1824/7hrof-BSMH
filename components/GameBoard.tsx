"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { arError } from "@/lib/errors";
import { playClick, playWhoosh } from "@/lib/sound";

export type GameRoom = {
  id: string; board_size: number; status: string; letters: string[]; owners: string[];
  active_cell: number | null; buzz_user: string | null; buzz_team: string | null; locked_team: string | null; winner: string | null;
};
type P = { user_id: string; name: string; team: "green" | "orange" | null; is_host: boolean };
const TEAM: Record<string, string> = { green: "الأخضر", orange: "البرتقالي" };
const G = "rgb(var(--green))", O = "rgb(var(--orange))", INK = "rgb(var(--ink))";
const btn = "btn-gold rounded-xl px-4 py-2.5";
const dot = (c: string) => <span className={`ms-2 inline-block h-3.5 w-3.5 rounded-full border-2 border-[#2B1F00]/60 align-middle ${c}`} />;
const WIN_REDIRECT_MS = 13000;   // بعد الفوز: العودة للرئيسية
const END_REDIRECT_MS = 3000;    // بعد إنهاء المنظم للجولة

// هندسة الخلايا السداسية (قمة مسطحة) بلوحة مستطيلة ثابتة: الأعمدة الفردية تنزل نصف خلية
const R = 34, HH = Math.sqrt(3) * R, PAD = 8, SHRINK = 0.94;
const hexPts = (cx: number, cy: number) =>
  Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 3) * k;
    return `${(cx + R * SHRINK * Math.cos(a)).toFixed(1)},${(cy + R * SHRINK * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
const center = (r: number, c: number) => ({ x: 1.5 * R * c, y: HH * (r + (Math.abs(c) % 2 === 1 ? 0.5 : 0)) });

export default function GameBoard({ room, players, me, onError, onRefresh }: { room: GameRoom; players: P[]; me: string; onError: (m: string) => void; onRefresh?: () => void }) {
  const router = useRouter();
  const n = room.board_size;
  const letters = room.letters ?? [], owners = room.owners ?? [];
  const isHost = players.some((p) => p.user_id === me && p.is_host);
  const myTeam = players.find((p) => p.user_id === me)?.team ?? null;
  const act = room.active_cell, finished = room.status === "finished";
  const buzzer = players.find((p) => p.user_id === room.buzz_user);
  const canBuzz = !!myTeam && !finished && act !== null && !room.buzz_user && room.locked_team !== myTeam;

  const [confirmEnd, setConfirmEnd] = useState(false);
  const [left, setLeft] = useState(0);
  const [err, setErr] = useState("");
  const sawLive = useRef(!finished);           // هل رأينا المباراة جارية أثناء وجودنا؟ (لا نعيد الصوت عند تحديث الصفحة)
  const celebrate = finished && sawLive.current;
  const ended = finished && !room.winner;

  async function call(fn: string, args: Record<string, unknown> = {}) {
    onError(""); setErr("");
    const { error } = await supabase.rpc(fn, { p_room: room.id, ...args });
    if (error) { const m = arError(error); onError(m); setErr(m); }
    else onRefresh?.();   // لا ننتظر الاتصال المباشر: نجلب الحالة فورًا
    return !error;
  }

  // ===== زر السرعة: يستجيب لحظة اللمس (وليس عند الرفع) ويمنع التكرار =====
  const pressed = useRef(false);
  const [pressedUi, setPressedUi] = useState(false);
  useEffect(() => { pressed.current = false; setPressedUi(false); }, [act, room.buzz_user, room.locked_team]);
  function fire() {
    if (!canBuzz || pressed.current) return;
    pressed.current = true; setPressedUi(true); playClick();
    supabase.rpc("buzz", { p_room: room.id }).then(({ data, error }) => {
      if (error) onError(arError(error));
      if (error || data === false) { pressed.current = false; setPressedUi(false); }
    });
  }
  const fireRef = useRef(fire); fireRef.current = fire;
  useEffect(() => {   // مسطرة المسافة على الحاسب
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.code !== "Space" || e.repeat || (t && /INPUT|TEXTAREA|SELECT|BUTTON/.test(t.tagName))) return;
      e.preventDefault(); fireRef.current();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // ===== الفوز: عودة للرئيسية بعد 13 ثانية. إنهاء الجولة: عودة بعد 3 ثوانٍ =====
  useEffect(() => {
    if (!finished || !sawLive.current) return;
    const ms = ended ? END_REDIRECT_MS : WIN_REDIRECT_MS;
    setLeft(Math.round(ms / 1000));
    const tick = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    const go = setTimeout(() => router.push("/"), ms);
    return () => { clearInterval(tick); clearTimeout(go); };
  }, [finished, ended, router]);
  useEffect(() => { if (confirmEnd && finished) setConfirmEnd(false); }, [confirmEnd, finished]);

  // ===== اللوحة =====
  const geo = useMemo(() => {
    const cells: { r: number; c: number; kind: "play" | "green" | "orange" }[] = [];
    for (let c = 0; c < n; c++) { cells.push({ r: -1, c, kind: "green" }, { r: n, c, kind: "green" }); }
    for (let r = 0; r < n; r++) { cells.push({ r, c: -1, kind: "orange" }, { r, c: n, kind: "orange" }); }
    if (n % 2 === 0) cells.push({ r: n, c: n, kind: "orange" });   // العمود الأيمن غير منزاح: خلية إضافية لإكمال الحافة
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) cells.push({ r, c, kind: "play" });
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const { r, c } of cells) {
      const { x, y } = center(r, c);
      x0 = Math.min(x0, x - R); x1 = Math.max(x1, x + R); y0 = Math.min(y0, y - HH / 2); y1 = Math.max(y1, y + HH / 2);
    }
    return { cells, vb: `${x0 - PAD} ${y0 - PAD} ${x1 - x0 + 2 * PAD} ${y1 - y0 + 2 * PAD}` };
  }, [n]);

  const playCells = geo.cells.filter((x) => x.kind === "play");
  const order = [...playCells.filter((x) => x.r * n + x.c !== act), ...playCells.filter((x) => x.r * n + x.c === act)];   // الخلية النشطة فوق الجميع

  return (
    <div className="mt-4">
      <svg viewBox={geo.vb} role="img" aria-label="لوحة اللعب" className="board mx-auto w-full max-w-md" strokeLinejoin="round">
        {geo.cells.filter((x) => x.kind !== "play").map(({ r, c, kind }) => {
          const { x, y } = center(r, c);
          return <polygon key={`e${r}_${c}`} points={hexPts(x, y)} fill={kind === "green" ? G : O} stroke={INK} strokeWidth="2.5" />;
        })}
        {order.map(({ r, c }) => {
          const i = r * n + c, ch = letters[i] ?? "", o = owners[i], { x, y } = center(r, c);
          const open = isHost && !finished && !o;
          const pick = () => { if (open) void call("pick_cell", { p_cell: i }); };
          return (
            <g key={i} className={`hexc ${open ? "open" : ""}`} style={{ cursor: open ? "pointer" : "default" }}
              role={open ? "button" : undefined} tabIndex={open ? 0 : undefined} aria-label={open ? `اختر الحرف ${ch}` : undefined}
              onPointerEnter={(e) => { if (e.pointerType === "mouse" && !finished && !o) playWhoosh(); }}
              onPointerDown={() => { if (!finished) playClick(); }}
              onClick={pick}
              onKeyDown={(e) => { if (open && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); pick(); } }}>
              <polygon points={hexPts(x, y)} fill={o === "green" ? G : o === "orange" ? O : "rgb(var(--cell))"}
                stroke={INK} strokeWidth={act === i ? 5 : 2.5} className={act === i ? "glow" : ""} />
              <text x={x} y={y + 10} textAnchor="middle" fontSize="28" fontFamily="var(--font-display), sans-serif"
                fill={o ? "#fff" : INK} style={{ pointerEvents: "none" }}>{ch}</text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-center text-sm opacity-70">
        <span className="text-team-green">الأخضر: الأعلى ↔ الأسفل</span> · <span className="text-team-orange">البرتقالي: اليسار ↔ اليمين</span>
      </p>

      <div className="mt-4 rounded-2xl bg-surface p-5 text-center" role="status">
        {finished ? (
          ended ? (
            <>
              <h2 className="font-display text-3xl">أنهى المنظم الجولة</h2>
              {celebrate && <p className="mt-2 opacity-80">سيتم إرجاعك للصفحة الرئيسية خلال {left} ثوانٍ…</p>}
            </>
          ) : (
            <>
              <h2 className="font-display text-3xl" style={{ color: room.winner === "green" ? G : O }}>فاز الفريق {TEAM[room.winner ?? ""]}!</h2>
              {celebrate && <p className="mt-2 opacity-80">العودة للرئيسية خلال {left} ثانية…</p>}
            </>
          )
        ) : act === null ? (
          <p>{isHost ? "اختر خلية من اللوحة لتبدأ السؤال." : "بانتظار المنظم ليختار خلية…"}</p>
        ) : (
          <>
            <p className="text-lg">الحرف: <span className="font-display text-3xl">{letters[act]}</span></p>
            <p className="mt-1 opacity-80">
              {buzzer ? `أسرع ضغطة: ${buzzer.name} (الفريق ${TEAM[room.buzz_team ?? ""]})` : "بانتظار أسرع ضغطة…"}
              {!buzzer && room.locked_team && ` — الفريق ${TEAM[room.locked_team]} أخطأ`}
            </p>
            {myTeam && !room.buzz_user && room.locked_team !== myTeam && (
              <button type="button" disabled={pressedUi}
                onPointerDown={(e) => { if (e.pointerType === "mouse" && e.button !== 0) return; fire(); }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fire(); } }}
                className="btn-gold buzz-btn mt-4 h-28 w-28 rounded-full font-display text-3xl">
                {pressedUi ? "…" : "اضغط!"}
              </button>
            )}
            {myTeam && !room.buzz_user && room.locked_team !== myTeam && <p className="mt-2 hidden text-xs opacity-60 md:block">أو اضغط مسطرة المسافة</p>}
            {myTeam && room.locked_team === myTeam && !room.buzz_user && <p className="mt-3 text-team-orange">فريقك أخطأ، الفرصة للفريق الآخر.</p>}
          </>
        )}
        {finished && !celebrate && (
          <Link href="/" className="btn-gold mt-4 inline-block rounded-xl px-5 py-2.5">العودة للرئيسية</Link>
        )}
      </div>

      {isHost && !finished && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {act !== null && (<>
            {buzzer && (<>
              <button type="button" onClick={() => call("judge", { p_correct: true })} className={btn}>إجابة صحيحة</button>
              <button type="button" onClick={() => call("judge", { p_correct: false })} className={btn}>إجابة خاطئة</button>
            </>)}
            <button type="button" onClick={() => call("assign_cell", { p_cell: act, p_team: "green" })} className={btn}>للأخضر{dot("bg-team-green")}</button>
            <button type="button" onClick={() => call("assign_cell", { p_cell: act, p_team: "orange" })} className={btn}>للبرتقالي{dot("bg-team-orange")}</button>
            <button type="button" onClick={() => call("skip_cell")} className={btn}>تخطي</button>
          </>)}
          <button type="button" onClick={() => setConfirmEnd(true)} className={btn}>إنهاء الجولة</button>
        </div>
      )}

      {err && <p role="alert" className="mt-3 rounded-xl bg-team-orange/15 p-3 text-center text-team-orange">{err}</p>}

      {confirmEnd && !finished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-5" onClick={() => setConfirmEnd(false)}
          onKeyDown={(e) => { if (e.key === "Escape") setConfirmEnd(false); }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="end-t" aria-describedby="end-d"
            className="page-in w-full max-w-sm rounded-3xl bg-surface p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h2 id="end-t" className="font-display text-2xl">إنهاء الجولة؟</h2>
            <p id="end-d" className="mt-2 leading-7 opacity-80">ستتوقف المباراة عند جميع اللاعبين ويعودون إلى الصفحة الرئيسية.</p>
            <div className="mt-5 flex gap-3">
              <button type="button" autoFocus onClick={() => setConfirmEnd(false)} className="flex-1 rounded-xl border-2 border-[#D9A520] px-4 py-3 font-bold">إلغاء</button>
              <button type="button" onClick={async () => { setConfirmEnd(false); const ok = await call("end_round"); if (ok) router.push("/"); }}
                className="btn-gold flex-1 rounded-xl px-4 py-3">نعم، أنهِ الجولة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
