import type { Metadata } from "next";
import Shell from "@/components/Shell";
import { delay } from "@/lib/anim";

export const metadata: Metadata = { title: "تواصل معنا" };

const MAIL = "Fpss1863@gmail.com";

const icon = "h-9 w-9";
const MailIcon = () => (
  <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 8 9 6 9-6" /></svg>
);

export default function Contact() {
  return (
    <Shell title="تواصل معنا" wide>
      <p className="rise max-w-xl text-lg leading-8 opacity-80" style={delay(100)}>
        لأي استفسار أو اقتراح أو ملاحظة على اللعبة، يسعدنا سماعك.
      </p>
      <div className="mt-8 grid gap-4">
        <a href={`mailto:${MAIL}`} className="rise lift block rounded-3xl bg-team-orange p-7 text-white" style={delay(250)}>
          <MailIcon />
          <p className="mt-4 text-lg opacity-90">راسلنا</p>
          <p dir="ltr" className="mt-1 break-all text-end font-display text-2xl">{MAIL}</p>
        </a>
      </div>
    </Shell>
  );
}
