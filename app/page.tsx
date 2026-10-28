import Link from "next/link";
import Logo from "@/components/Logo";
import { delay } from "@/lib/anim";

// لوحة العرض: نفس هندسة لوحة اللعب (مستطيلة، أعمدة فردية تنزل نصف خلية)
const R = 34, HH = Math.sqrt(3) * R, N = 4, SH = 0.94;
const LETTERS = "جثتبأرذدخحضصشسزفعظطغلكنمقهوي";
const OWN: Record<string, "g" | "o"> = { "0,0": "g", "1,1": "g", "2,1": "g", "1,2": "o", "2,2": "o", "3,3": "o" };
const ctr = (r: number, c: number) => ({ x: 1.5 * R * c, y: HH * (r + (Math.abs(c) % 2 === 1 ? 0.5 : 0)) });
const pts = (cx: number, cy: number) =>
  Array.from({ length: 6 }, (_, k) => `${(cx + R * SH * Math.cos((Math.PI / 3) * k)).toFixed(1)},${(cy + R * SH * Math.sin((Math.PI / 3) * k)).toFixed(1)}`).join(" ");

const HEX: { r: number; c: number; k: "g" | "o" | "p"; ch?: string; t?: "g" | "o" }[] = [];
for (let c = 0; c < N; c++) HEX.push({ r: -1, c, k: "g" }, { r: N, c, k: "g" });
for (let r = 0; r < N; r++) HEX.push({ r, c: -1, k: "o" }, { r, c: N, k: "o" });
HEX.push({ r: N, c: N, k: "o" });
for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) HEX.push({ r, c, k: "p", ch: LETTERS[r * N + c], t: OWN[`${r},${c}`] });
const xs = HEX.flatMap(({ r, c }) => [ctr(r, c).x - R, ctr(r, c).x + R]), ys = HEX.flatMap(({ r, c }) => [ctr(r, c).y - HH / 2, ctr(r, c).y + HH / 2]);
const X0 = Math.min(...xs) - 6, Y0 = Math.min(...ys) - 6, VB = `${X0} ${Y0} ${Math.max(...xs) + 6 - X0} ${Math.max(...ys) + 6 - Y0}`;
const fill = (k: string, t?: string) => (k === "g" || t === "g" ? "rgb(var(--green))" : k === "o" || t === "o" ? "rgb(var(--orange))" : "rgb(var(--cell))");

const FEATURES = [
  ["غرف مستقلة", "كل مباراة لها رمز ورابط خاص، وتتحدث لحظيًا لجميع اللاعبين."],
  ["أسبقية عادلة", "الخادم يحسم أول ضغطة، فلا يفوز أحد بسبب سرعة إنترنته."],
  ["شاشة للتلفزيون", "اعرض اللوحة على الشاشة الكبيرة، وتحكم من الجوال."],
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 sm:px-6">
      <header className="flex items-center justify-between gap-3 py-4 sm:py-6">
        <Logo size={34} />
        <nav className="flex gap-1 text-sm font-medium sm:gap-3">
          <Link href="/how-to-play" className="rounded-lg px-2.5 py-2 transition hover:text-team-orange">طريقة اللعب</Link>
          <Link href="/about" className="rounded-lg px-2.5 py-2 transition hover:text-team-orange">عن الموقع</Link>
        </nav>
      </header>

      <section className="grid items-center gap-6 py-4 md:grid-cols-2 md:gap-10 md:py-10">
        <div className="text-center md:text-start">
          <h1 className="rise font-display text-[2.6rem] leading-[1.25] sm:text-5xl md:text-6xl" style={delay(100)}>
            حرف بحرف، <br className="hidden sm:block" /> الفريق الأسرع يربط الطريق
          </h1>
          <p className="rise mx-auto mt-4 max-w-md text-base leading-8 opacity-80 sm:text-lg md:mx-0" style={delay(250)}>
            لعبة حروف جماعية بين فريقين: أجب أولًا، اكسب الخلية، وصِل بين أطراف اللوحة قبل خصمك.
          </p>
          <div className="rise mx-auto mt-6 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row md:mt-8" style={delay(400)}>
            <Link href="/create" className="btn-gold rounded-2xl px-7 py-4 text-center text-lg sm:flex-1 md:flex-none">إنشاء غرفة</Link>
            <Link href="/join" className="btn-gold rounded-2xl px-7 py-4 text-center text-lg sm:flex-1 md:flex-none">الانضمام إلى غرفة</Link>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[19rem] sm:max-w-sm md:max-w-md" aria-hidden="true">
          <svg viewBox={VB} className="w-full" strokeLinejoin="round">
            {HEX.map(({ r, c, k, ch, t }, i) => {
              const { x, y } = ctr(r, c);
              return (
                <g key={i} className="svg-pop pop" style={delay(250 + i * 28)}>
                  <polygon points={pts(x, y)} fill={fill(k, t)} stroke="rgb(var(--ink))" strokeWidth="2.5" />
                  {ch && <text x={x} y={y + 10} textAnchor="middle" fontSize="28" fontFamily="var(--font-display), sans-serif" fill={t ? "#fff" : "rgb(var(--ink))"}>{ch}</text>}
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      <section className="grid gap-3 py-6 sm:grid-cols-3 sm:gap-4">
        {FEATURES.map(([title, text], i) => (
          <div key={title} style={delay(700 + i * 120)} className="rise lift rounded-2xl bg-surface p-5 sm:p-6">
            <h2 className="font-display text-2xl">{title}</h2>
            <p className="mt-2 leading-7 opacity-75">{text}</p>
          </div>
        ))}
      </section>

      <footer className="mt-auto flex flex-col items-center gap-3 pb-4 pt-10 text-sm opacity-75 sm:flex-row sm:gap-5">
        <Link href="/contact" className="py-1 transition hover:opacity-100 hover:underline">تواصل معنا</Link>
        <span className="sm:ms-auto">جميع الحقوق محفوظة لمؤسسة بصمة خير الوقفية</span>
      </footer>
    </main>
  );
}
