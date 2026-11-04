"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ManualForm() {
  const router = useRouter();
  const [f, setF] = useState({ plate: "", make: "", model: "", version: "", fuel: "diesel", gearbox: "manuelle", firstRegistration: "", powerHp: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    if (!f.make.trim() || !f.model.trim()) return setError("Indiquez la marque et le modèle.");
    if (!f.firstRegistration.trim()) return setError("Indiquez la date de première immatriculation.");
    setLoading(true);
    try {
      const res = await fetch("/api/identify/manual", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Erreur"); return; }
      router.push(`/verification/${json.reportId}`);
    } catch { setError("Connexion impossible."); } finally { setLoading(false); }
  }
  const cls = "w-full h-12 rounded-xl border border-line bg-white px-3.5 text-[15px]";
  const lbl = "text-sm font-semibold";
  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5"><label htmlFor="m-plate" className={lbl}>Plaque <span className="font-normal text-muted">(facultatif)</span></label><input id="m-plate" placeholder="AB-123-CD" value={f.plate} onChange={set("plate")} className={`${cls} uppercase`} /></div>
        <div className="flex flex-col gap-1.5"><label htmlFor="m-date" className={lbl}>Date de 1re immatriculation (case B) *</label><input id="m-date" placeholder="JJ/MM/AAAA" inputMode="numeric" value={f.firstRegistration} onChange={set("firstRegistration")} className={cls} /></div>
        <div className="flex flex-col gap-1.5"><label htmlFor="m-make" className={lbl}>Marque (D.1) *</label><input id="m-make" placeholder="Peugeot" value={f.make} onChange={set("make")} className={cls} /></div>
        <div className="flex flex-col gap-1.5"><label htmlFor="m-model" className={lbl}>Modèle (D.3) *</label><input id="m-model" placeholder="3008" value={f.model} onChange={set("model")} className={cls} /></div>
        <div className="flex flex-col gap-1.5 sm:col-span-2"><label htmlFor="m-version" className={lbl}>Motorisation / version</label><input id="m-version" placeholder="1.5 BlueHDi 130 EAT8" value={f.version} onChange={set("version")} className={cls} /><span className="text-xs text-muted">Le plus précis possible : c&apos;est ce qui permet de trouver les pannes connues du moteur.</span></div>
        <div className="flex flex-col gap-1.5"><label htmlFor="m-fuel" className={lbl}>Énergie (P.3) *</label><select id="m-fuel" value={f.fuel} onChange={set("fuel")} className={cls}><option value="diesel">Diesel</option><option value="essence">Essence</option><option value="hybride">Hybride</option><option value="hybride_rechargeable">Hybride rechargeable</option><option value="electrique">Électrique</option><option value="gpl">GPL</option><option value="autre">Autre</option></select></div>
        <div className="flex flex-col gap-1.5"><label htmlFor="m-gearbox" className={lbl}>Boîte de vitesses *</label><select id="m-gearbox" value={f.gearbox} onChange={set("gearbox")} className={cls}><option value="manuelle">Manuelle</option><option value="automatique">Automatique</option><option value="inconnue">Je ne sais pas</option></select></div>
        <div className="flex flex-col gap-1.5"><label htmlFor="m-hp" className={lbl}>Puissance (ch) <span className="font-normal text-muted">(facultatif)</span></label><input id="m-hp" inputMode="numeric" placeholder="130" value={f.powerHp} onChange={set("powerHp")} className={cls} /></div>
      </div>
      {error && <p role="alert" className="m-0 bg-badbg text-badtext rounded-xl px-4 py-3 text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="h-14 px-7 rounded-xl bg-navy text-white font-semibold w-fit disabled:opacity-70 inline-flex items-center gap-2.5">{loading && <span className="spinner !border-t-white !border-white/30" aria-hidden="true" />}Continuer</button>
    </form>
  );
}
