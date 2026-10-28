"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Shell from "@/components/Shell";
import Seg from "@/components/Seg";
import { supabase, ensureSession } from "@/lib/supabase";
import { arError } from "@/lib/errors";

export default function CreateRoom() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [size, setSize] = useState<3 | 4 | 5>(4);
  const [rounds, setRounds] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState("board_buzzer");
  const [plays, setPlays] = useState(false);
  const [team, setTeam] = useState<"green" | "orange">("green");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await ensureSession();
      const { data, error } = await supabase.rpc("create_room", {
        p_name: name, p_board_size: size, p_rounds: rounds, p_mode: mode,
        p_host_plays: plays, p_team: plays ? team : null,
      });
      if (error) throw error;
      router.push(`/room/${data.code}`);
    } catch (err) { setError(arError(err)); setBusy(false); }
  }

  return (
    <Shell title="إنشاء غرفة">
      <form onSubmit={submit}>
        <label className="block font-medium" htmlFor="name">اسم المنظم</label>
        <input id="name" required maxLength={24} value={name} onChange={(e) => setName(e.target.value)}
          className="mt-2 w-full rounded-xl border-2 border-ink/15 bg-surface px-4 py-3 text-lg" />
        <Seg label="حجم اللوحة" value={size} onChange={setSize} options={[[3, "3×3"], [4, "4×4"], [5, "5×5"]]} />
        <Seg label="عدد الجولات" value={rounds} onChange={setRounds} options={[[1, "جولة"], [2, "جولتان"], [3, "ثلاث جولات"]]} />
        <Seg label="نمط اللعب" value={mode} onChange={setMode} options={[
          ["board_buzzer", "لوحة + أزرار سرعة"], ["buzzer_only", "أزرار سرعة فقط"], ["board_manual", "لوحة بتحكم يدوي"]]} />
        <Seg label="دور المنظم" value={plays ? "play" : "host"} onChange={(v) => setPlays(v === "play")}
          options={[["host", "إدارة فقط"], ["play", "إدارة ولعب"]]} />
        {plays && <Seg label="فريقك" value={team} onChange={setTeam} options={[["green", "الأخضر"], ["orange", "البرتقالي"]]} />}
        {error && <p role="alert" className="mt-5 rounded-xl bg-team-orange/15 p-3 text-team-orange">{error}</p>}
        <button disabled={busy} className="btn-gold mt-8 w-full rounded-2xl px-6 py-4 text-lg">
          {busy ? "جارٍ الإنشاء…" : "إنشاء الغرفة"}
        </button>
      </form>
    </Shell>
  );
}
