export function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ["Véhicule", "Informations", "Rapport"];
  return (
    <div className="flex items-center gap-2 text-[13px] font-semibold text-muteddark flex-wrap" aria-label="Étapes">
      {steps.map((s, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const done = n < current, active = n === current;
        return (
          <span key={s} className="flex items-center gap-2">
            <span className={`flex items-center gap-2 ${active ? "text-white" : ""}`}>
              <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${done ? "bg-emerald-400 text-ink" : active ? "bg-accent text-ink" : "border-2 border-white/40"}`}>{done ? "✓" : n}</span>{s}
            </span>
            {i < steps.length - 1 && <span aria-hidden="true" className="w-8 h-0.5 bg-white/25" />}
          </span>
        );
      })}
    </div>
  );
}
