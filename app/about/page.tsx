import type { Metadata } from "next";
import Link from "next/link";
import Shell from "@/components/Shell";
import { delay } from "@/lib/anim";

export const metadata: Metadata = { title: "عن الموقع" };

const POINTS = [
  ["فريقان وخلايا", "لوحة من الحروف، وفريقان أخضر وبرتقالي يتنافسان على كسب خلاياها."],
  ["مباشر وفوري", "كل شيء يتحدث لحظيًا على جوالات اللاعبين وشاشة العرض، بدون تحديث الصفحة."],
  ["أسبقية عادلة", "الخادم هو من يحدد أول ضغطة، فلا يتفوق أحد بسبب سرعة إنترنته."],
];

export default function About() {
  return (
    <Shell title="عن الموقع" wide>
      <div className="max-w-2xl space-y-4 text-lg leading-8">
        <p className="rise" style={delay(100)}><strong>7ROF BSMH</strong> لعبة حروف جماعية تلعبها مع أصدقائك أو عائلتك أو زملائك، وجهًا لوجه أو عن بُعد.</p>
        <p className="rise opacity-80" style={delay(200)}>تنقسمون إلى فريقين، وتتنافسون على خلايا لوحة من الحروف. الفريق الذي يجيب أسرع يكسب الخلية، والفريق الذي يصل بين طرفين متقابلين من اللوحة قبل خصمه يفوز.</p>
        <p className="rise opacity-80" style={delay(300)}>لا حاجة لحساب أو تسجيل: أنشئ غرفة، شارك الرمز، وابدأ اللعب خلال لحظات.</p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {POINTS.map(([t, x], i) => (
          <div key={t} className="rise lift rounded-2xl bg-surface p-6" style={delay(400 + i * 120)}>
            <h2 className="font-display text-2xl">{t}</h2>
            <p className="mt-2 leading-7 opacity-75">{x}</p>
          </div>
        ))}
      </div>

      <div className="rise mt-10 flex flex-wrap gap-3" style={delay(850)}>
        <Link href="/how-to-play" className="rounded-2xl bg-ink px-6 py-3.5 font-bold text-paper transition active:scale-95">طريقة اللعب</Link>
        <Link href="/create" className="rounded-2xl bg-team-green px-6 py-3.5 font-bold text-white transition active:scale-95">إنشاء غرفة</Link>
      </div>
    </Shell>
  );
}
