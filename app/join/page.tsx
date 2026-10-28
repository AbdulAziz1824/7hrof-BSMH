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
              className={`rounded-2xl py-4 text-lg font-bold text-white transition ${c} ${team === v ? "ring-4 ring-ink/40" : "opacity-45"}`}>{t}</button>
          ))}
        </div>
      </fieldset>
      {error && <p role="alert" className="mt-5 rounded-xl bg-team-orange/15 p-3 text-team-orange">{error}</p>}
      <button disabled={busy} className="mt-8 w-full rounded-2xl bg-team-orange px-6 py-4 text-lg font-bold text-white disabled:opacity-50">
        {busy ? "جارٍ الانضمام…" : "الانضمام إلى الغرفة"}
      </button>
    </form>
  );
}

export default function JoinRoom() {
  return <Shell title="الانضمام إلى غرفة"><Suspense><JoinForm /></Suspense></Shell>;
}
