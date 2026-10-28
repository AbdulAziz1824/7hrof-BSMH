export default function Logo({ size = 44 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-3" dir="ltr">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" width={size} height={size} alt="شعار 7ROF BSMH" style={{ width: size, height: size }} />
      <span className="font-display text-2xl leading-none tracking-wide">7ROF <span className="text-team-orange">BSMH</span></span>
    </span>
  );
}
