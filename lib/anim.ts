import type { CSSProperties } from "react";
/** تأخير ظهور العنصر بالمللي ثانية، ويُستخدم مع الأصناف rise و pop */
export const delay = (ms: number) => ({ "--d": `${ms}ms` } as CSSProperties);
