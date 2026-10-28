import Link from "next/link";
import Logo from "@/components/Logo";

const ROWS = [
  [["أ", ""], ["ب", "g"], ["ت", ""], ["ث", "o"]],
  [["ج", "g"], ["ح", "g"], ["خ", "o"], ["د", ""]],
  [["ر", ""], ["س", "g"], ["ش", "o"], ["ص", "o"]],
  [["ط", "o"], ["ع", ""], ["غ", "g"], ["ف", ""]],
];
const cell = (t: string) =>
  t === "g" ? "bg-team-green text-white" : t === "o" ? "bg-team-orange text-white" : "bg-surface text-ink";

const FEATURES = [
  ["غرف مستقلة", "كل مباراة لها رمز ورابط خاص، وتتحدث لحظيًا لجميع اللاعبين."],
  ["أسبقية عادلة", "الخادم يحسم أول ضغطة، فلا يفوز أحد بسبب سرعة إنترنته."],
  ["شاشة للتلفزيون", "اعرض اللوحة على الشاشة الكبيرة، وتحكم من الجوال."],
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-16">
      <header className="flex items-center justify-between py-6">
        <Logo />
        <nav className="flex gap-5 text-sm font-medium">
          <Link href="/how-to-play" className="hover:underline">طريقة اللعب</Link>
          <Link href="/about" className="hover:underline">عن الموقع</Link>
        </nav>
      </header>

      <section className="grid items-center gap-10 py-10 md:grid-cols-2">
        <div>
          <h1 className="font-display text-5xl leading-tight md:text-6xl">
            حرف بحرف، <br /> الفريق الأسرع يربط الطريق
          </h1>
          <p className="mt-5 max-w-md text-lg leading-8 opacity-80">
            لعبة حروف جماعية بين فريقين: أجب أولًا، اكسب الخلية، وصِل بين أطراف اللوحة قبل خصمك.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/create" className="rounded-2xl bg-team-green px-7 py-4 text-lg font-bold text-white shadow-lg shadow-team-green/30 transition active:scale-95">إنشاء غرفة</Link>
            <Link href="/join" className="rounded-2xl bg-team-orange px-7 py-4 text-lg font-bold text-white shadow-lg shadow-team-orange/30 transition active:scale-95">الانضمام إلى غرفة</Link>
          </div>
        </div>

        <div className="flex justify-center" aria-hidden="true">
          <div className="flex flex-col">
            {ROWS.map((row, i) => (
              <div key={i} className="flex gap-1" style={{ marginInlineStart: i * 36, marginTop: i ? -14 : 0 }}>
                {row.map(([ch, t]) => (
                  <div key={ch} className={`hex flex h-[84px] w-[76px] items-center justify-center font-display text-3xl ${cell(t)}`}>{ch}</div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {FEATURES.map(([title, text]) => (
          <div key={title} className="rounded-2xl bg-surface p-6">
            <h2 className="font-display text-2xl">{title}</h2>
            <p className="mt-2 leading-7 opacity-75">{text}</p>
          </div>
        ))}
      </section>

      <footer className="mt-14 flex flex-wrap gap-5 text-sm opacity-70">
        <Link href="/privacy">سياسة الخصوصية</Link>
        <Link href="/terms">شروط الاستخدام</Link>
        <Link href="/contact">تواصل معنا</Link>
      </footer>
    </main>
  );
}
