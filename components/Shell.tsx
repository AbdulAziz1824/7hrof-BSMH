import Link from "next/link";
import Logo from "./Logo";

export default function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-xl px-5 pb-16">
      <header className="py-6"><Link href="/" aria-label="الصفحة الرئيسية"><Logo size={36} /></Link></header>
      <h1 className="font-display text-4xl">{title}</h1>
      <div className="mt-6">{children}</div>
    </main>
  );
}
