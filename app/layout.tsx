import type { Metadata, Viewport } from "next";
import { Lalezar, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const display = Lalezar({ subsets: ["arabic", "latin"], weight: "400", variable: "--font-display" });
const body = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "700"], variable: "--font-body" });

export const metadata: Metadata = {
  title: { default: "7ROF BSMH | لعبة الحروف الجماعية", template: "%s | 7ROF BSMH" },
  description: "العب الحروف وتحدَّ فريقًا آخر مباشرة: أنشئ غرفة، شارك الرمز، واحسم الخلايا بأسرع إجابة.",
  applicationName: "7ROF BSMH",
  openGraph: { siteName: "7ROF BSMH", locale: "ar_SA", type: "website" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0F1D2E" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
