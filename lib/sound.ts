/** أصوات اللعبة: النقرة والنفحة مولّدة بالمتصفح (بدون ملفات)، وصوت الفوز ملف mp3. */
let ctx: AudioContext | null = null;
let win: HTMLAudioElement | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noise(c: AudioContext, dur: number) {
  const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  return src;
}

/** نقرة قصيرة وواضحة */
export function playClick() {
  const c = ac(); if (!c) return;
  const t = c.currentTime;
  const o = c.createOscillator(), g = c.createGain();
  o.type = "triangle";
  o.frequency.setValueAtTime(900, t);
  o.frequency.exponentialRampToValueAtTime(380, t + 0.07);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.35, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  o.connect(g).connect(c.destination);
  o.start(t); o.stop(t + 0.1);
}

/** نفحة هواء ناعمة عند المرور فوق خلية */
export function playWhoosh() {
  const c = ac(); if (!c) return;
  const t = c.currentTime, dur = 0.16;
  const n = noise(c, dur), f = c.createBiquadFilter(), g = c.createGain();
  f.type = "bandpass"; f.Q.value = 0.9;
  f.frequency.setValueAtTime(500, t);
  f.frequency.exponentialRampToValueAtTime(2600, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  n.connect(f).connect(g).connect(c.destination);
  n.start(t); n.stop(t + dur);
}

export function playWin(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  win ??= new Audio("/sounds/win.mp3");
  win.currentTime = 0;
  return win.play().catch(() => undefined);   // قد يمنعه المتصفح إن لم يتفاعل المستخدم مع الصفحة
}

/** يخفض صوت الفوز تدريجيًا خلال المدة المحددة ثم يوقفه */
export function fadeOutWin(ms = 1000) {
  const a = win; if (!a) return;
  const steps = 20, start = a.volume;
  let i = 0;
  const id = setInterval(() => {
    i++; a.volume = Math.max(0, start * (1 - i / steps));
    if (i >= steps) { clearInterval(id); a.pause(); a.currentTime = 0; a.volume = start; }
  }, ms / steps);
}

export function stopWin() {
  if (win) { win.pause(); win.currentTime = 0; win.volume = 1; }
}
