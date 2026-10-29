const dev = process.env.NODE_ENV !== "production";
const sb = process.env.NEXT_PUBLIC_SUPABASE_URL;
const sbHttp = sb ?? "https://*.supabase.co";
const sbWs = sb ? sb.replace(/^http/, "ws") : "wss://*.supabase.co";

// سياسة أمان المحتوى: لا نسمح إلا بموارد الموقع نفسه والاتصال بـ Supabase
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,   // Next يحتاج inline لإقلاع الصفحة
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${sbHttp} ${sbWs}${dev ? " ws://localhost:* http://localhost:*" : ""}`,
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
export default {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: csp },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      ],
    }];
  },
};
