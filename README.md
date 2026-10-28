# 7ROF BSMH

Next.js 14 + Tailwind + Supabase (Postgres, Realtime, Anonymous Auth) + Vercel.

## التشغيل
1. Supabase: أنشئ مشروعًا، ثم Authentication > Providers وفعّل **Anonymous sign-ins**.
2. SQL Editor: نفّذ `supabase/migrations/001_init.sql`.
3. انسخ `.env.example` إلى `.env.local` وضع Project URL و anon key (Settings > API). لا تستخدم `service_role` هنا أبدًا.
4. `npm install` ثم `npm run dev`.

## النشر
1. ارفع المشروع إلى GitHub (`.env.local` مستثنى تلقائيًا).
2. Vercel: Add New > Project > اختر المستودع، وأضف المتغيرات الثلاثة من `.env.example`.
3. Deploy.
