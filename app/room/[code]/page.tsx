"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { QRCodeSVG } from "qrcode.react";
import Shell from "@/components/Shell";
import { supabase, ensureSession } from "@/lib/supabase";
import { arError } from "@/lib/errors";
import GameBoard, { type GameRoom } from "@/components/GameBoard";

type Room = GameRoom & { code: string; total_rounds: number; mode: string };
type Player = { id: string; user_id: string; name: string; team: "green" | "orange" | null; is_host: boolean };
const MODES: Record<string, string> = { board_buzzer: "لوحة + أزرار سرعة", buzzer_only: "أزرار سرعة فقط", board_manual: "لوحة بتحكم يدوي" };

export default function WaitingRoom({ params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();
  const router = useRouter();
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [me, setMe] = useState("");
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    setOrigin(location.origin);
    let cancelled = false;
    let ch: RealtimeChannel | null = null;
    (async () => {
      try {
        const s = await ensureSession();
        setMe(s.user.id);
        const { data: r, error } = await supabase.from("rooms").select("*").eq("code", code).maybeSingle();
        if (error) throw error;
        if (!r) { router.replace(`/join?code=${code}`); return; }   // غير عضو: يمر عبر الانضمام
        if (cancelled) return;
        setRoom(r);
        const refetch = async () => {
          const { data } = await supabase.from("players").select("id,user_id,name,team,is_host")
            .eq("room_id", r.id).order("joined_at");
          if (!cancelled && data) setPlayers(data as Player[]);
        };
        ch = supabase.channel(`room:${r.id}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "players", filter: `room_id=eq.${r.id}` }, refetch)
          .on("postgres_changes", { event: "UPDATE", schema: "public", table: "rooms", filter: `id=eq.${r.id}` },
            (p) => setRoom(p.new as Room))
          .subscribe((st) => { setLive(st === "SUBSCRIBED"); if (st === "SUBSCRIBED") refetch(); }); // يعيد الجلب بعد أي انقطاع
      } catch (e) { setError(arError(e)); }
    })();
    return () => { cancelled = true; if (ch) supabase.removeChannel(ch); };
  }, [code, router]);

  const isHost = players.some((p) => p.user_id === me && p.is_host);
  const manual = room?.mode === "board_manual";
  const hasBothTeams = manual || players.some((p) => p.team === "green") && players.some((p) => p.team === "orange");

  async function start() {
    if (!room) return;
    setStarting(true); setError("");
    const { error } = await supabase.rpc("start_game", { p_room: room.id });
    if (error) setError(arError(error));
    else {
      const { data } = await supabase.from("rooms").select("*").eq("id", room.id).single();
      if (data) setRoom(data as Room);
    }
    setStarting(false);
  }

  async function refreshRoom() {
    if (!room) return;
    const { data } = await supabase.from("rooms").select("*").eq("id", room.id).single();
    if (data) setRoom(data as Room);
  }

  const link = `${origin}/join?code=${code}`;
  const col = (team: "green" | "orange", title: string, bg: string) => {
    const list = players.filter((p) => p.team === team);
    return (
      <section className={`rounded-2xl p-4 text-white ${bg}`}>
        <h2 className="font-display text-2xl">{title} <span className="opacity-80">({list.length})</span></h2>
        <ul className="mt-3 space-y-1.5">
          {list.map((p) => <li key={p.id} className="rounded-lg bg-black/15 px-3 py-1.5">{p.name}{p.user_id === me && " (أنت)"}{p.is_host && " 👑"}</li>)}
          {!list.length && <li className="opacity-80">لا يوجد لاعبون بعد</li>}
        </ul>
      </section>
    );
  };
  const spectators = players.filter((p) => !p.team);
  const viewers = manual ? spectators.filter((p) => !p.is_host) : [];

  return (
    <Shell title={!room || room.status === "waiting" ? "غرفة الانتظار" : "المباراة"}>
      {error && <p role="alert" className="rounded-xl bg-team-orange/15 p-3 text-team-orange">{error}</p>}
      {room && (
        <>
          <div className="rounded-2xl bg-surface p-5 text-center">
            <p className="opacity-70">رمز الغرفة</p>
            <p dir="ltr" className="font-display text-5xl tracking-[0.3em]">{room.code}</p>
            <button type="button" className="btn-gold mt-3 rounded-xl px-5 py-2.5"
              onClick={async () => { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              {copied ? "تم النسخ" : "نسخ رابط المشاركة"}
            </button>
            {room.status === "waiting" && origin && (
              <div className="mt-5 flex flex-col items-center gap-2">
                <div className="rounded-2xl bg-white p-3 shadow-sm" role="img" aria-label="باركود الانضمام إلى الغرفة">
                  <QRCodeSVG value={link} size={168} fgColor="#0F1D2E" bgColor="#FFFFFF" level="M" />
                </div>
                <p className="text-sm opacity-70">امسح الباركود للانضمام مباشرة</p>
              </div>
            )}
          </div>
          <p className="mt-4 text-sm opacity-75">
            {room.board_size}×{room.board_size} · {room.total_rounds} {room.total_rounds === 1 ? "جولة" : "جولات"} · {MODES[room.mode]}
          </p>
          <p role="status" className={`mt-2 text-sm ${live ? "text-team-green" : "text-team-orange"}`}>
            {live ? "متصل مباشرة" : "جارٍ إعادة الاتصال…"}
          </p>
          <div className={`mt-5 grid gap-3 sm:grid-cols-2 ${room.status === "waiting" && !manual ? "" : "hidden"}`}>
            {col("green", "الفريق الأخضر", "bg-team-green")}
            {col("orange", "الفريق البرتقالي", "bg-team-orange")}
          </div>
          {manual && room.status === "waiting" && (
            <p className="mt-4 rounded-2xl bg-surface p-4 text-center text-sm leading-7 opacity-90">
              نمط اللوحة اليدوية: المنظم وحده يدير اللوحة بدون لاعبين، ومن ينضم يشاهد اللوحة فقط.
              {viewers.length > 0 && <><br />المشاهدون: {viewers.map((p) => p.name).join("، ")}</>}
            </p>
          )}
          {!manual && spectators.length > 0 && (
            <p className="mt-4 text-sm opacity-75">المنظم (لا يلعب): {spectators.map((p) => p.name).join("، ")}</p>
          )}
          {room.status === "waiting" ? (
            isHost ? (
              <div className="mt-6">
                <button type="button" onClick={start} disabled={starting || !hasBothTeams}
                  className="btn-gold w-full rounded-2xl px-6 py-4 text-lg">
                  {starting ? "جارٍ البدء…" : "ابدأ المباراة"}
                </button>
                {!hasBothTeams && <p className="mt-2 text-center text-sm opacity-75">يلزم وجود لاعب واحد على الأقل في كل فريق للبدء.</p>}
              </div>
            ) : (
              <p role="status" className="mt-6 rounded-2xl bg-surface p-4 text-center opacity-80">بانتظار المنظم ليبدأ المباراة…</p>
            )
          ) : room.letters?.length ? (
            <GameBoard room={room} players={players} me={me} onError={setError} onRefresh={refreshRoom} mode={room.mode} />
          ) : (
            <p role="status" className="mt-6 rounded-2xl bg-surface p-4 text-center">جارٍ تجهيز اللوحة…</p>
          )}
        </>
      )}
      {!room && !error && <p>جارٍ تحميل الغرفة…</p>}
    </Shell>
  );
}
