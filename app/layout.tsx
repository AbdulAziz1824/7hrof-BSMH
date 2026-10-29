import type { Metadata, Viewport } from "next";
import { Lalezar, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { VERSION } from "@/lib/version";

const display = Lalezar({ subsets: ["arabic", "latin"], weight: "400", variable: "--font-display" });
const body = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "700"], variable: "--font-body" });

export const metadata: Metadata = {
  title: { default: "7ROF BSMH | لعبة الحروف الجماعية", template: "%s | 7ROF BSMH" },
  description: "العب الحروف وتحدَّ فريقًا آخر مباشرة: أنشئ غرفة، شارك الرمز، واحسم الخلايا بأسرع إجابة.",
  applicationName: "7ROF BSMH",
  appleWebApp: { capable: true, title: "7ROF BSMH", statusBarStyle: "default" },
  openGraph: { siteName: "7ROF BSMH", locale: "ar_SA", type: "website" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0F1D2E" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${display.variable} ${body.variable}`}>
      <body>
        {children}
        <p dir="ltr" className="pb-6 text-center text-xs opacity-50">{VERSION}</p>
      </body>
    </html>
  );
}
