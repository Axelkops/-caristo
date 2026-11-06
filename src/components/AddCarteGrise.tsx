"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Ajout de la carte grise sur un rapport déjà payé : l'historique officiel s'ajoute au rapport, sans repayer. */
export function AddCarteGrise({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [f, setF] = useState({ formulaNumber: "", holderName: "", firstRegDate: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!f.formulaNumber.trim() || !f.holderName.trim() || !f.firstRegDate.trim()) { setError("Renseignez les trois informations de la carte grise."); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}/carte-grise`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error ?? "Erreur inattendue. Réessayez."); return; }
      router.refresh();
    } catch {
      setError("Connexion impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const field = "w-full h-11 rounded-xl px-3.5 text-[15px] text-white placeholder:text-[#5B6779] outline-none focus:ring-2 focus:ring-[#60A5FA]";
  const fieldStyle = { background: "rgba(7,15,31,0.7)", border: "1px solid rgba(147,197,253,0.2)" };
  return (
    <form onSubmit={submit} noValidate className="no-print rounded-2xl p-5 sm:p-6 flex flex-col gap-4" style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.3)" }} data-testid="add-carte-grise">
      <div className="flex flex-col gap-1">
        <span className="text-[16px] font-bold text-white">Ajouter la carte grise</span>
        <span className="text-[13px] text-[#AEB6C4]">L&apos;historique officiel s&apos;ajoute à ce rapport : contrôles techniques, kilométrages relevés, sinistres, gage, vol. Sans nouveau paiement.</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex flex-col gap-1.5 text-[13px] text-[#C8D0DC]" htmlFor="cg-formula">Numéro de formule
          <input id="cg-formula" placeholder="2021AB12345" autoCapitalize="characters" value={f.formulaNumber} onChange={set("formulaNumber")} className={`${field} uppercase`} style={fieldStyle} />
          <span className="text-[11.5px] text-[#8E9AAF]">En gras sous le titre, 11 caractères</span>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] text-[#C8D0DC]" htmlFor="cg-holder">Nom du titulaire
          <input id="cg-holder" placeholder="DUPONT MARIE" autoComplete="off" value={f.holderName} onChange={set("holderName")} className={field} style={fieldStyle} />
          <span className="text-[11.5px] text-[#8E9AAF]">Case C.1, tel qu&apos;écrit</span>
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] text-[#C8D0DC]" htmlFor="cg-date">Date de 1re immatriculation
          <input id="cg-date" placeholder="27/02/2020" inputMode="numeric" value={f.firstRegDate} onChange={set("firstRegDate")} className={field} style={fieldStyle} />
          <span className="text-[11.5px] text-[#8E9AAF]">Case B, JJ/MM/AAAA</span>
        </label>
      </div>
      {error && <p role="alert" className="m-0 text-[13px] text-[#F87171]">{error}</p>}
      <button type="submit" disabled={loading} className="self-start bg-accent text-white px-5 py-3 rounded-xl text-[14px] font-semibold disabled:opacity-60" style={{ boxShadow: "0 8px 24px rgba(37,99,235,0.4)" }}>
        {loading ? "Consultation en cours…" : "Ajouter l'historique officiel"}
      </button>
    </form>
  );
}
