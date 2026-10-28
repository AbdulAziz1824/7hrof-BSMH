import Link from "next/link";
import Logo from "./Logo";

export default function Shell({ title, children, wide = false }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <main className={`mx-auto px-5 pb-16 ${wide ? "max-w-4xl" : "max-w-xl"}`}>
      <header className="py-6"><Link href="/" aria-label="الصفحة الرئيسية"><Logo size={36} /></Link></header>
      <h1 className="rise font-display text-4xl md:text-5xl">{title}</h1>
      <div className="mt-6">{children}</div>
    </main>
  );
}
