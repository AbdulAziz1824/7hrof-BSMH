"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Shell from "@/components/Shell";
import { supabase, ensureSession } from "@/lib/supabase";
import { arError } from "@/lib/errors";

function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState((params.get("code") ?? "").toUpperCase());
  const [name, setName] = useState("");
  const [team, setTeam] = useState<"green" | "orange">("green");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await ensureSession();
      const { data, error } = await supabase.rpc("join_room", { p_code: code, p_name: name, p_team: team });
      if (error) throw error;
      router.push(`/room/${data.code}`);
    } catch (err) { setError(arError(err)); setBusy(false); }
  }

  const input = "mt-2 w-full rounded-xl border-2 border-ink/15 bg-surface px-4 py-3 text-lg";
  return (
    <form onSubmit={submit}>
      <label className="block font-medium" htmlFor="code">رمز الغرفة</label>
      <input id="code" required maxLength={5} dir="ltr" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
        className={`${input} text-center font-display text-3xl tracking-[0.3em]`} autoComplete="off" />
      <label className="mt-5 block font-medium" htmlFor="pname">اسمك</label>
      <input id="pname" required maxLength={24} value={name} onChange={(e) => setName(e.target.value)} className={input} />
      <fieldset className="mt-5">
        <legend className="mb-2 font-medium">اختر فريقك</legend>
        <div className="grid grid-cols-2 gap-3">
          {([["green", "الأخضر", "bg-team-green"], ["orange", "البرتقالي", "bg-team-orange"]] as const).map(([v, t, c]) => (
            <button key={v} type="button" aria-pressed={team === v} onClick={() => setTeam(v)}
              className={`btn-green flex items-center justify-center gap-2 rounded-2xl py-4 text-lg ${team === v ? "btn-green-on" : "opacity-60"}`}>
              <span className={`inline-block h-4 w-4 rounded-full border-2 border-white/70 ${c}`} />{t}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="mt-3 text-sm opacity-70">في غرفة «اللوحة اليدوية» تدخل كمشاهد فقط، ولا يؤثر اختيار الفريق.</p>
      {error && <p role="alert" className="mt-5 rounded-xl bg-team-orange/15 p-3 text-team-orange">{error}</p>}
      <button disabled={busy} className="btn-green mt-8 w-full rounded-2xl px-6 py-4 text-lg">
        {busy ? "جارٍ الانضمام…" : "الانضمام إلى الغرفة"}
      </button>
    </form>
  );
}

export default function JoinRoom() {
  return <Shell title="الانضمام إلى غرفة"><Suspense><JoinForm /></Suspense></Shell>;
}
