"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function CarnetForm({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [f, setF] = useState({ date: "", mileage: "", label: "", cost: "" });
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setOk(false); setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/entries`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Erreur"); return; }
      setOk(true); setF({ date: "", mileage: "", label: "", cost: "" }); router.refresh();
    } catch { setError("Connexion impossible."); } finally { setLoading(false); }
  }
  const cls = "h-11 rounded-lg border border-line bg-white px-3 text-sm w-full";
  return (
    <form onSubmit={submit} className="flex flex-col gap-3 no-print" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="flex flex-col gap-1"><label htmlFor="e-date" className="text-xs font-semibold">Date</label><input id="e-date" placeholder="JJ/MM/AAAA" value={f.date} onChange={set("date")} className={cls} /></div>
        <div className="flex flex-col gap-1"><label htmlFor="e-km" className="text-xs font-semibold">Kilométrage</label><input id="e-km" inputMode="numeric" placeholder="116 200" value={f.mileage} onChange={set("mileage")} className={cls} /></div>
        <div className="flex flex-col gap-1"><label htmlFor="e-label" className="text-xs font-semibold">Intervention</label><input id="e-label" placeholder="Vidange + filtres" value={f.label} onChange={set("label")} className={cls} /></div>
        <div className="flex flex-col gap-1"><label htmlFor="e-cost" className="text-xs font-semibold">Montant (€)</label><input id="e-cost" inputMode="numeric" placeholder="289" value={f.cost} onChange={set("cost")} className={cls} /></div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button type="submit" disabled={loading} className="h-11 px-5 rounded-lg bg-navy text-white text-sm font-semibold disabled:opacity-70 inline-flex items-center gap-2">{loading && <span className="spinner !border-t-white !border-white/30" aria-hidden="true" />}Ajouter au carnet</button>
        {ok && <span className="text-sm text-oktext">Ajouté. Le rapport a été mis à jour.</span>}
        {error && <span role="alert" className="text-sm text-badtext">{error}</span>}
      </div>
    </form>
  );
}
