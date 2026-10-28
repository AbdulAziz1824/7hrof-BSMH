import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import { MiniBoard, StepArt } from "@/components/Illustrations";
import { delay } from "@/lib/anim";

export const metadata: Metadata = { title: "طريقة اللعب" };

const BOARD = ["o...", "...o", ".g.o", "g.o."];
const WIN = ["o.g.", ".g.o", ".g.o", "go.."];

const STEPS = [
  { t: "أنشئ غرفة", x: "المنظم يختار حجم اللوحة من 3×3 إلى 5×5، وعدد الجولات من واحدة إلى ثلاث، ونمط اللعب، ثم يحصل على رمز من 5 خانات.", art: <StepArt kind="room" /> },
  { t: "شارك الرمز وكوّنوا الفريقين", x: "أرسل الرمز أو رابط الغرفة للاعبين. كل لاعب يكتب اسمه ويختار الفريق الأخضر أو البرتقالي، والغرفة تتسع حتى 40 لاعبًا.", art: <StepArt kind="teams" /> },
  { t: "أجب قبل خصمك", x: "عند اختيار خلية يظهر سؤالها، وأول لاعب يضغط زر السرعة يحق له الإجابة. الخادم هو الحكم في الأسبقية، فلا أفضلية لأحد بسبب سرعة إنترنته.", art: <StepArt kind="buzz" /> },
  { t: "اربط الطريق وافز", x: "الإجابة الصحيحة تلوّن الخلية بلون فريقك. أول فريق يصل بين طرفين متقابلين من اللوحة بسلسلة خلايا متصلة يفوز بالجولة، ومن يكسب أكثر الجولات يفوز بالمباراة.", art: <MiniBoard map={WIN} glowCells={["02", "11", "21", "30"]} /> },
];

const MODES = [
  ["لوحة + أزرار سرعة", "اللوحة على الشاشة، وجوالات اللاعبين تتحول إلى أزرار سرعة."],
  ["أزرار سرعة فقط", "بدون لوحة، والمنافسة كلها على من يضغط أولًا."],
  ["لوحة بتحكم يدوي", "المنظم يدير اللوحة بنفسه ويحدد من يكسب كل خلية."],
];

export default function HowToPlay() {
  return (
    <Shell title="طريقة اللعب" wide>
      <p className="rise max-w-2xl text-lg leading-8 opacity-80" style={delay(100)}>
        أربع خطوات بسيطة تفصلك عن أول مباراة. هذه لوحة تجريبية تشبه ما ستراه في اللعبة:
      </p>
      <div className="rise mt-6 flex justify-center rounded-3xl bg-surface p-6" style={delay(200)}>
        <MiniBoard map={BOARD} />
      </div>

      <ol className="mt-12 space-y-6">
        {STEPS.map((s, i) => (
          <li key={s.t} className="rise lift grid items-center gap-6 rounded-3xl bg-surface p-6 md:grid-cols-2" style={delay(300 + i * 120)}>
            <div className={i % 2 ? "md:order-2" : ""}>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-team-orange font-display text-2xl text-white">{i + 1}</span>
              <h2 className="mt-3 font-display text-3xl">{s.t}</h2>
              <p className="mt-2 leading-8 opacity-80">{s.x}</p>
            </div>
            <div className="flex justify-center">{s.art}</div>
          </li>
        ))}
      </ol>

      <h2 className="rise mt-14 font-display text-3xl" style={delay(100)}>أنماط اللعب</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {MODES.map(([t, x], i) => (
          <div key={t} className="rise lift rounded-2xl bg-surface p-6" style={delay(150 + i * 120)}>
            <h3 className="font-display text-2xl">{t}</h3>
            <p className="mt-2 leading-7 opacity-75">{x}</p>
          </div>
        ))}
      </div>

      <div className="rise mt-12 text-center" style={delay(200)}>
        <Link href="/create" className="btn-gold inline-block rounded-2xl px-8 py-4 text-lg">جاهز؟ أنشئ غرفتك</Link>
      </div>
    </Shell>
  );
}
