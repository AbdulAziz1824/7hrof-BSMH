import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "7ROF BSMH | لعبة الحروف الجماعية",
    short_name: "7ROF BSMH",
    description: "لعبة الحروف الجماعية بين فريقين.",
    lang: "ar", dir: "rtl",
    start_url: "/", scope: "/", display: "standalone", orientation: "portrait",
    background_color: "#0F1D2E", theme_color: "#0F1D2E",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
