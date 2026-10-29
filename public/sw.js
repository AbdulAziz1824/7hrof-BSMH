// عامل خدمة بسيط: يكفي ليتعرف المتصفح على الموقع كتطبيق قابل للتثبيت (بدون تخزين مؤقت).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
