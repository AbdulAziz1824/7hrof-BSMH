"use client";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { arError } from "@/lib/errors";

export type GameRoom = {
  id: string; board_size: number; status: string; letters: string[]; owners: string[];
  active_cell: number | null; buzz_user: string | null; buzz_team: string | null; locked_team: string | null; winner: string | null;
};
type P = { user_id: string; name: string; team: "green" | "orange" | null; is_host: boolean };
const TEAM: Record<string, string> = { green: "الأخضر", orange: "البرتقالي" };
const G = "rgb(var(--green))", O = "rgb(var(--orange))";
const btn = "rounded-xl px-4 py-2.5 font-bold text-white transition active:scale-95";

export default function GameBoard({ room, players, me, onError }: { room: GameRoom; players: P[]; me: string; onError: (m: string) => void }) {
  const n = room.board_size, w = 60, h = 66, s = 63, dy = 55, sh = 29;
  const letters = room.letters ?? [], owners = room.owners ?? [];
  const isHost = players.some((p) => p.user_id === me && p.is_host);
  const myTeam = players.find((p) => p.user_id === me)?.team ?? null;
  const act = room.active_cell, finished = room.status === "finished";
  const buzzer = players.find((p) => p.user_id === room.buzz_user);

  async function call(fn: string, args: Record<string, unknown> = {}) {
    onError("");
    const { error } = await supabase.rpc(fn, { p_room: room.id, ...args });
    if (error) onError(arError(error));
  }

  const pts = [[.25, .04], [.75, .04], [1, .5], [.75, .96], [.25, .96], [0, .5]].map(([x, y]) => `${x * w},${y * h}`).join(" ");
  const W = 12 + (n - 1) * (s + sh) + w, H = 12 + (n - 1) * dy + h;
  const rows = Array.from({ length: n }, (_, r) => r);
  const left = rows.map((r) => `${6 + r * sh - 6},${6 + r * dy + h / 2}`).join(" ");
  const right = rows.map((r) => `${6 + (n - 1) * s + r * sh + w + 6},${6 + r * dy + h / 2}`).join(" ");
  const edge = { strokeWidth: 5, strokeLinecap: "round" as const, fill: "none" };

  return (
    <div className="mt-4">
      <svg viewBox={`-10 -6 ${W + 20} ${H + 12}`} role="img" aria-label="لوحة اللعب" className="w-full">
        <polyline points={`6,0 ${6 + (n - 1) * s + w},0`} stroke={G} {...edge} />
        <polyline points={`${6 + (n - 1) * sh},${H} ${6 + (n - 1) * (s + sh) + w},${H}`} stroke={G} {...edge} />
        <polyline points={left} stroke={O} {...edge} />
        <polyline points={right} stroke={O} {...edge} />
        {letters.map((ch, i) => {
          const r = Math.floor(i / n), c = i % n, o = owners[i];
          const open = isHost && !finished && !o;
          return (
            <g key={i} transform={`translate(${6 + c * s + r * sh} ${6 + r * dy})`} onClick={() => open && call("pick_cell", { p_cell: i })} style={{ cursor: open ? "pointer" : "default" }}>
              <polygon points={pts} fill={o === "green" ? G : o === "orange" ? O : "rgb(var(--ink) / 0.12)"}
                stroke={act === i ? "rgb(var(--ink))" : "none"} strokeWidth="4" className={act === i ? "glow" : ""} />
              <text x={w / 2} y={h / 2 + 9} textAnchor="middle" fontSize="26" fontFamily="var(--font-display), sans-serif"
                fill={o ? "#fff" : "rgb(var(--ink))"} style={{ pointerEvents: "none" }}>{ch}</text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-center text-sm opacity-70">
        <span className="text-team-green">الأخضر: الأعلى ↔ الأسفل</span> · <span className="text-team-orange">البرتقالي: اليسار ↔ اليمين</span>
      </p>

      <div className="mt-4 rounded-2xl bg-surface p-5 text-center" role="status">
        {finished ? (
          <>
            <h2 className="font-display text-3xl" style={{ color: room.winner === "green" ? G : O }}>فاز الفريق {TEAM[room.winner ?? ""]}!</h2>
            <Link href="/" className="mt-4 inline-block rounded-xl bg-ink px-5 py-2.5 font-medium text-paper">العودة للرئيسية</Link>
          </>
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
              <button type="button" onClick={() => call("buzz")}
                className="mt-4 h-28 w-28 rounded-full bg-team-orange font-display text-3xl text-white shadow-lg shadow-team-orange/40 transition active:scale-90">اضغط!</button>
            )}
            {myTeam && room.locked_team === myTeam && !room.buzz_user && <p className="mt-3 text-team-orange">فريقك أخطأ، الفرصة للفريق الآخر.</p>}
          </>
        )}
      </div>

      {isHost && !finished && act !== null && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {buzzer && (<>
            <button type="button" onClick={() => call("judge", { p_correct: true })} className={`${btn} bg-team-green`}>إجابة صحيحة</button>
            <button type="button" onClick={() => call("judge", { p_correct: false })} className={`${btn} bg-ink text-paper`}>إجابة خاطئة</button>
          </>)}
          <button type="button" onClick={() => call("assign_cell", { p_cell: act, p_team: "green" })} className={`${btn} bg-team-green/80`}>للأخضر</button>
          <button type="button" onClick={() => call("assign_cell", { p_cell: act, p_team: "orange" })} className={`${btn} bg-team-orange/80`}>للبرتقالي</button>
          <button type="button" onClick={() => call("skip_cell")} className={`${btn} bg-ink/60 text-paper`}>تخطي</button>
        </div>
      )}
    </div>
  );
}
