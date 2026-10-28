import type { Metadata } from "next";
import Shell from "@/components/Shell";
import { delay } from "@/lib/anim";

export const metadata: Metadata = { title: "تواصل معنا" };

const PHONE = "0551629839";
const MAIL = "Fpss1863@gmail.com";

const icon = "h-9 w-9";
const PhoneIcon = () => (
  <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
);
const MailIcon = () => (
  <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m3 8 9 6 9-6" /></svg>
);

export default function Contact() {
  return (
    <Shell title="تواصل معنا" wide>
      <p className="rise max-w-xl text-lg leading-8 opacity-80" style={delay(100)}>
        لأي استفسار أو اقتراح أو ملاحظة على اللعبة، يسعدنا سماعك.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <a href={`tel:${PHONE}`} className="rise lift block rounded-3xl bg-team-green p-7 text-white" style={delay(250)}>
          <PhoneIcon />
          <p className="mt-4 text-lg opacity-90">اتصل بنا</p>
          <p dir="ltr" className="mt-1 text-end font-display text-4xl tracking-wide">{PHONE}</p>
        </a>
        <a href={`mailto:${MAIL}`} className="rise lift block rounded-3xl bg-team-orange p-7 text-white" style={delay(400)}>
          <MailIcon />
          <p className="mt-4 text-lg opacity-90">راسلنا</p>
          <p dir="ltr" className="mt-1 break-all text-end font-display text-2xl">{MAIL}</p>
        </a>
      </div>
    </Shell>
  );
}
