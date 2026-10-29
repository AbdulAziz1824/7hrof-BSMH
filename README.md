# 7ROF BSMH

Next.js 14 + Tailwind + Supabase (Postgres, Realtime, Anonymous Auth) + Vercel.

## التشغيل
1. Supabase: أنشئ مشروعًا، ثم Authentication > Providers وفعّل **Anonymous sign-ins**.
2. SQL Editor: نفّذ ملفات `supabase/migrations/` بالترتيب: 001 ثم 002 ثم 003 ثم **005_rect_board.sql** (اللوحة المستطيلة + إنهاء الجولة + أنماط اللعب الثلاثة، ويشمل 004). بدون 005 لن يعمل إنهاء الجولة. ثم **006_timer.sql** (مؤقت السؤال) ثم **007_rounds_leave.sql** (عدد الجولات وخروج اللاعب).
3. انسخ `.env.example` إلى `.env.local` وضع Project URL و anon key (Settings > API). لا تستخدم `service_role` هنا أبدًا.
4. `npm install` (يثبّت `qrcode.react` للباركود) ثم `npm run dev`.

## النشر
1. ارفع المشروع إلى GitHub (`.env.local` مستثنى تلقائيًا).
2. Vercel: Add New > Project > اختر المستودع، وأضف المتغيرات الثلاثة من `.env.example`.
3. Deploy.

## الأصوات
النقرة والنفحة تُولَّد في المتصفح من `lib/sound.ts` (بدون ملفات صوتية).
