import { delay } from "@/lib/anim";

const G = "rgb(var(--green))", O = "rgb(var(--orange))", INK = "rgb(var(--ink))";
const FONT = "var(--font-display), sans-serif";
const LETTERS = ["ابتث", "جحخد", "رسشص", "طعغف"];

/** لوحة حروف مصغّرة بنفس شكل لوحة اللعب (مستطيلة، أعمدة فردية تنزل نصف خلية). g = أخضر، o = برتقالي، . = فارغة */
const R = 34, HH = Math.sqrt(3) * R;
const ctr = (r: number, c: number) => ({ x: 1.5 * R * c, y: HH * (r + (Math.abs(c) % 2 === 1 ? 0.5 : 0)) });
const hex = (cx: number, cy: number) =>
  Array.from({ length: 6 }, (_, k) => `${(cx + R * 0.94 * Math.cos((Math.PI / 3) * k)).toFixed(1)},${(cy + R * 0.94 * Math.sin((Math.PI / 3) * k)).toFixed(1)}`).join(" ");

export function MiniBoard({ map, glowCells = [] }: { map: string[]; glowCells?: string[] }) {
  const n = map.length;
  const cells: { r: number; c: number; k: "g" | "o" | "p" }[] = [];
  for (let c = 0; c < n; c++) cells.push({ r: -1, c, k: "g" }, { r: n, c, k: "g" });
  for (let r = 0; r < n; r++) cells.push({ r, c: -1, k: "o" }, { r, c: n, k: "o" });
  if (n % 2 === 0) cells.push({ r: n, c: n, k: "o" });
  map.forEach((row, r) => [...row].forEach((_, c) => cells.push({ r, c, k: "p" })));
  const xs = cells.flatMap(({ r, c }) => [ctr(r, c).x - R, ctr(r, c).x + R]), ys = cells.flatMap(({ r, c }) => [ctr(r, c).y - HH / 2, ctr(r, c).y + HH / 2]);
  const x0 = Math.min(...xs) - 6, y0 = Math.min(...ys) - 6;
  return (
    <svg viewBox={`${x0} ${y0} ${Math.max(...xs) + 6 - x0} ${Math.max(...ys) + 6 - y0}`} role="img" aria-label="لوحة حروف بخلايا سداسية ملونة" className="w-full max-w-xs" strokeLinejoin="round">
      {cells.map(({ r, c, k }, i) => {
        const { x, y } = ctr(r, c);
        const t = k === "p" ? map[r][c] : k === "g" ? "g" : "o";
        const fill = t === "g" ? G : t === "o" ? O : "rgb(var(--cell))";
        const glow = k === "p" && glowCells.includes(`${r}${c}`);
        return (
          <g key={i} className={`pop svg-pop ${glow ? "glow" : ""}`} style={delay(k === "p" ? (r * 4 + c) * 50 : 0)}>
            <polygon points={hex(x, y)} fill={fill} stroke={INK} strokeWidth={glow ? 4 : 2.5} />
            {k === "p" && <text x={x} y={y + 10} textAnchor="middle" fontSize="28" fill={t === "." ? INK : "#fff"} fontFamily={FONT}>{LETTERS[r][c]}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export function StepArt({ kind }: { kind: "room" | "teams" | "buzz" }) {
  const common = { viewBox: "0 0 240 170", role: "img", className: "w-full max-w-xs" } as const;
  if (kind === "room") return (
    <svg {...common} aria-label="بطاقة غرفة تعرض رمزًا من خمس خانات">
      <rect x="20" y="20" width="200" height="130" rx="22" fill="rgb(var(--surface))" stroke="rgb(var(--ink) / 0.15)" strokeWidth="2" />
      <text x="120" y="55" textAnchor="middle" fontSize="15" fill={INK} opacity=".65" fontFamily="var(--font-body), sans-serif">رمز الغرفة</text>
      {[..."K7M2P"].map((ch, i) => (
        <g key={i} className="pop svg-pop" style={delay(150 + i * 110)}>
          <rect x={34 + i * 36} y="70" width="30" height="42" rx="8" fill={i % 2 ? O : G} />
          <text x={49 + i * 36} y="100" textAnchor="middle" fontSize="26" fill="#fff" fontFamily={FONT}>{ch}</text>
        </g>
      ))}
      <rect x="62" y="123" width="116" height="16" rx="8" fill={INK} opacity=".12" />
    </svg>
  );
  if (kind === "teams") return (
    <svg {...common} aria-label="فريقان أخضر وبرتقالي بلاعبين">
      {[[16, G], [128, O]].map(([x, c], k) => (
        <g key={k}>
          <rect x={x as number} y="18" width="96" height="134" rx="20" fill={c as string} />
          {[0, 1, 2].map((i) => (
            <g key={i} className="pop svg-pop" style={delay(200 + k * 150 + i * 120)}>
              <circle cx={(x as number) + 26} cy={56 + i * 38} r="12" fill="#fff" opacity=".95" />
              <rect x={(x as number) + 46} y={50 + i * 38} width="38" height="12" rx="6" fill="#fff" opacity=".6" />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
  return (
    <svg {...common} aria-label="زر سرعة يُضغط للإجابة أولًا">
      <polygon points="75,22 135,22 165,85 135,148 75,148 45,85" fill={G} className="pop svg-pop" style={delay(100)} />
      <text x="105" y="102" textAnchor="middle" fontSize="54" fill="#fff" fontFamily={FONT}>ج</text>
      <g className="pop svg-pop" style={delay(450)}>
        <circle cx="190" cy="120" r="30" fill={O} className="glow" />
        <text x="190" y="128" textAnchor="middle" fontSize="22" fill="#fff" fontFamily={FONT}>أنا!</text>
      </g>
    </svg>
  );
}
