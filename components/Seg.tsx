"use client";
export default function Seg<T extends string | number>({ label, value, onChange, options }: {
  label: string; value: T; onChange: (v: T) => void; options: [T, string][];
}) {
  return (
    <fieldset className="mt-5">
      <legend className="mb-2 font-medium">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([v, text]) => (
          <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
            className={`rounded-xl border-2 px-4 py-2.5 transition ${value === v ? "btn-gold border-transparent" : "border-[#DCC98F]/60 bg-surface"}`}>
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
