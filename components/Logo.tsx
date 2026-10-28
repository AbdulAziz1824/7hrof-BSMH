export default function Logo({ size = 44 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-3" dir="ltr">
      <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="شعار 7ROF BSMH">
        <defs><clipPath id="h"><polygon points="16,4 48,4 62,32 48,60 16,60 2,32" /></clipPath></defs>
        <g clipPath="url(#h)">
          <rect width="64" height="64" fill="rgb(var(--green))" />
          <polygon points="64,0 64,64 0,64" fill="rgb(var(--orange))" />
        </g>
        <text x="32" y="44" textAnchor="middle" fontSize="34" fontWeight="700" fill="#fff" fontFamily="var(--font-display), sans-serif">ح</text>
      </svg>
      <span className="font-display text-2xl leading-none tracking-wide">7ROF <span className="text-team-orange">BSMH</span></span>
    </span>
  );
}
