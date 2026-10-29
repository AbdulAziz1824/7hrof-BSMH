"use client";
import { useEffect, useRef, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const STEPS = {
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
} as const;

export default function InstallBar() {
  const [installed, setInstalled] = useState(false);
  const [sheet, setSheet] = useState<keyof typeof STEPS | null>(null);
  const prompt = useRef<InstallEvent | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    const before = (e: Event) => { e.preventDefault(); prompt.current = e as InstallEvent; };
    const done = () => { setInstalled(true); prompt.current = null; };
    window.addEventListener("beforeinstallprompt", before);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", before); window.removeEventListener("appinstalled", done); };
  }, []);

  useEffect(() => {
    if (!sheet) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setSheet(null); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [sheet]);

  async function android() {
    const p = prompt.current;
    if (!p) { setSheet("android"); return; }     // لم يجهّز المتصفح نافذة التثبيت: نعرض الخطوات اليدوية
    prompt.current = null;
    await p.prompt();
    const { outcome } = await p.userChoice;
    if (outcome === "accepted") setInstalled(true);
  }

  if (installed) return null;
  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-sm">
        <span className="opacity-70">ثبّت الموقع على جوالك:</span>
        <button type="button" onClick={() => setSheet("ios")} className="btn-green rounded-xl px-4 py-2">الآيفون</button>
        <button type="button" onClick={android} className="btn-green rounded-xl px-4 py-2">الأندرويد</button>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-4 sm:items-center" onClick={() => setSheet(null)}>
          <div role="dialog" aria-modal="true" aria-labelledby="inst-t" onClick={(e) => e.stopPropagation()}
            className="page-in w-full max-w-sm rounded-3xl bg-surface p-6 shadow-2xl">
            <h2 id="inst-t" className="font-display text-2xl">{STEPS[sheet].title}</h2>
            <ol className="mt-4 space-y-3 leading-7">
              {STEPS[sheet].steps.map((t, i) => (
                <li key={i} className="flex gap-3">
                  <span className="btn-green flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm">{i + 1}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
            <button type="button" autoFocus onClick={() => setSheet(null)} className="btn-green mt-6 w-full rounded-xl px-4 py-3">تم</button>
          </div>
        </div>
      )}
    </>
  );
}
