"use client";
import { useEffect, useRef, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type Platform = "ios" | "android";

const STEPS: Record<Platform, { title: string; steps: string[] }> = {
  ios: {
    title: "تثبيت على الآيفون",
    steps: [
      "افتح الموقع في متصفح Safari (التثبيت لا يعمل من المتصفحات الأخرى).",
      "اضغط زر المشاركة (المربع الذي يخرج منه سهم) أسفل الشاشة.",
      "مرّر للأسفل واختر «إضافة إلى الشاشة الرئيسية».",
      "اضغط «إضافة» في أعلى الشاشة، وسيظهر الموقع كتطبيق.",
    ],
  },
  android: {
    title: "تثبيت على الأندرويد",
    steps: [
      "افتح الموقع في متصفح Chrome.",
      "اضغط قائمة النقاط الثلاث ⋮ في أعلى المتصفح.",
      "اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».",
      "أكّد بالضغط على «تثبيت»، وسيظهر الموقع كتطبيق.",
    ],
  },
};

/** خانة «تثبيت التطبيق» بجانب «طريقة اللعب»: تفتح نافذة فيها زر للآيفون وزر للأندرويد */
export default function InstallLink() {
  const [installed, setInstalled] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Platform>("android");
  const [canPrompt, setCanPrompt] = useState(false);
  const prompt = useRef<InstallEvent | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setTab("ios");
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const before = (e: Event) => { e.preventDefault(); prompt.current = e as InstallEvent; setCanPrompt(true); };
    const done = () => { setInstalled(true); prompt.current = null; setCanPrompt(false); setOpen(false); };
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", before); window.removeEventListener("appinstalled", done); };
  }, []);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  async function installNow() {
    const p = prompt.current;
    if (!p) return;
    prompt.current = null; setCanPrompt(false);
    await p.prompt();
    const { outcome } = await p.userChoice;
    if (outcome === "accepted") { setInstalled(true); setOpen(false); }
  }

  if (installed) return null;
  const cur = STEPS[tab];
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-lg px-2.5 py-2 transition hover:text-team-orange">تثبيت التطبيق</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="inst-t" onClick={(e) => e.stopPropagation()}
            className="page-in w-full max-w-sm rounded-3xl bg-surface p-6 text-start font-normal shadow-2xl">
            <h2 id="inst-t" className="font-display text-2xl">تثبيت التطبيق على جوالك</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(["ios", "android"] as const).map((p) => (
                <button key={p} type="button" aria-pressed={tab === p} onClick={() => setTab(p)}
                  className={`btn-green rounded-xl px-4 py-3 ${tab === p ? "btn-green-on" : "opacity-60"}`}>{p === "ios" ? "الآيفون" : "الأندرويد"}</button>
              ))}
            </div>
            <h3 className="mt-5 font-bold">{cur.title}</h3>
            <ol className="mt-3 space-y-3 leading-7">
              {cur.steps.map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="btn-green flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm">{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
            {tab === "android" && canPrompt && (
              <button type="button" onClick={installNow} className="btn-green mt-5 w-full rounded-xl px-4 py-3">تثبيت الآن</button>
            )}
            <button type="button" autoFocus onClick={() => setOpen(false)} className="mt-3 w-full rounded-xl border-2 border-team-green px-4 py-3 font-bold">إغلاق</button>
          </div>
        </div>
      )}
    </>
  );
}
