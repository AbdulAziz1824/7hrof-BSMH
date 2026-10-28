# 7ROF BSMH

Next.js 14 + Tailwind + Supabase (Postgres, Realtime, Anonymous Auth) + Vercel.

## التشغيل
1. Supabase: أنشئ مشروعًا، ثم Authentication > Providers وفعّل **Anonymous sign-ins**.
2. SQL Editor: نفّذ ملفات `supabase/migrations/` بالترتيب: 001 ثم 002 ثم 003 ثم **004_end_round.sql** (زر إنهاء الجولة، جديد في V 0.6).
3. انسخ `.env.example` إلى `.env.local` وضع Project URL و anon key (Settings > API). لا تستخدم `service_role` هنا أبدًا.
4. `npm install` ثم `npm run dev`.

## النشر
1. ارفع المشروع إلى GitHub (`.env.local` مستثنى تلقائيًا).
2. Vercel: Add New > Project > اختر المستودع، وأضف المتغيرات الثلاثة من `.env.example`.
3. Deploy.

## الأصوات
`public/sounds/win.mp3` صوت الفوز (يعمل ثم يعود اللاعبون للرئيسية بعد 13 ثانية). النقرة والنفحة تُولَّد في المتصفح من `lib/sound.ts`.
