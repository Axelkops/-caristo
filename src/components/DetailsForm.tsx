"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Vehicle } from "@/lib/engine/types";
import { OFFERS, formatEuros, type Offer } from "@/lib/services/pricing";

export function DetailsForm({ reportId, vehicle, defaults }: { reportId: string; vehicle: Vehicle; defaults?: { mileage?: number | null; email?: string | null; offer?: string | null } }) {
  const router = useRouter();
  const isFr = vehicle.country === "FR";
  const [form, setForm] = useState({
    mileage: defaults?.mileage ? String(defaults.mileage) : "",
    holderName: "",
    formulaNumber: "",
    firstRegDate: "",
    listingUrl: "",
    email: defaults?.email ?? "",
    offer: (defaults?.offer as Offer) ?? "single",
    packCode: "",
  });
  const [usePack, setUsePack] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.mileage.trim()) return setError("Indiquez le kilométrage actuel.");
    if (!form.email.trim()) return setError("Indiquez votre e-mail : le rapport vous y sera envoyé.");
    setLoading(true);
    try {
      const body = { ...form, packCode: usePack ? form.packCode : undefined };
      const res = await fetch(`/api/reports/${reportId}/details`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Erreur inattendue."); return; }
      if (json.next.startsWith("http")) window.location.href = json.next; else router.push(json.next);
    } catch {
      setError("Connexion impossible. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  const fieldCls = "w-full h-12 rounded-xl border border-line bg-white px-3.5 text-[15px] focus:border-navy";
  const labelCls = "text-sm font-semibold text-fg";
  const help = "text-xs text-muted";

  return (
    <form onSubmit={submit} className="flex flex-col gap-7" noValidate>
      <fieldset className="border-0 p-0 m-0 flex flex-col gap-4">
        <legend className="display text-xl font-bold mb-1">Le véhicule</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="mileage" className={labelCls}>Kilométrage actuel *</label>
            <input id="mileage" inputMode="numeric" placeholder="118 000" value={form.mileage} onChange={set("mileage")} className={fieldCls} required />
            <span className={help}>Celui du compteur, ou celui de l&apos;annonce si vous êtes acheteur.</span>
          </div>
        </div>
      </fieldset>

      {isFr ? (
        <fieldset className="border-0 p-0 m-0 flex flex-col gap-4">
          <legend className="display text-xl font-bold mb-1">La carte grise</legend>
          <p className="m-0 text-sm text-[#4B5563]">Trois informations ouvrent l&apos;historique officiel (contrôles techniques, kilométrages, sinistres, situation administrative). Acheteur : demandez une photo de la carte grise au vendeur.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="formulaNumber" className={labelCls}>Numéro de formule</label>
              <input id="formulaNumber" placeholder="2021AB12345" autoCapitalize="characters" value={form.formulaNumber} onChange={set("formulaNumber")} className={`${fieldCls} uppercase`} />
              <span className={help}>En bas à droite de la carte grise.</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="holderName" className={labelCls}>Nom du titulaire</label>
              <input id="holderName" placeholder="Nom Prénom ou société" autoComplete="off" value={form.holderName} onChange={set("holderName")} className={fieldCls} />
              <span className={help}>Case C.1.</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="firstRegDate" className={labelCls}>Date de 1re immatriculation</label>
              <input id="firstRegDate" placeholder="JJ/MM/AAAA" inputMode="numeric" value={form.firstRegDate} onChange={set("firstRegDate")} className={fieldCls} />
              <span className={help}>Case B.</span>
            </div>
          </div>
          <p className="m-0 text-xs text-muted">Sans ces informations, le rapport est produit avec tout le reste et indique clairement les sections non renseignées.</p>
        </fieldset>
      ) : (
        <div className="bg-warnbg border border-[#FDD9A8] rounded-xl px-4 py-3 text-sm text-warntext">Véhicule immatriculé hors de France : le rapport contiendra la fiche technique, les pannes connues, la cote et l&apos;échéancier. L&apos;historique officiel (contrôles techniques, sinistres, gage) n&apos;est disponible que pour les véhicules immatriculés en France.</div>
      )}

      <fieldset className="border-0 p-0 m-0 flex flex-col gap-4">
        <legend className="display text-xl font-bold mb-1">Votre rapport</legend>
        <div className="flex flex-col gap-1.5 max-w-md">
          <label htmlFor="email" className={labelCls}>Votre e-mail *</label>
          <input id="email" type="email" inputMode="email" autoComplete="email" placeholder="vous@exemple.fr" value={form.email} onChange={set("email")} className={fieldCls} required />
          <span className={help}>Le rapport et le lien de partage vous y seront envoyés.</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={usePack} onChange={(e) => setUsePack(e.target.checked)} />J&apos;ai déjà un code de pack</label>
          {usePack && <input aria-label="Code de pack" placeholder="ABCD123456" value={form.packCode} onChange={set("packCode")} className="h-10 rounded-lg border border-line px-3 uppercase tracking-wider text-sm" />}
        </div>

        {!usePack && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3" role="radiogroup" aria-label="Offre">
            {(Object.keys(OFFERS) as Offer[]).map((k) => {
              const o = OFFERS[k];
              const active = form.offer === k;
              return (
                <label key={k} className={`cursor-pointer rounded-2xl border p-4 flex flex-col gap-1.5 ${active ? "border-navy bg-navy text-white" : "border-line bg-white"}`}>
                  <input type="radio" name="offer" value={k} checked={active} onChange={() => setForm({ ...form, offer: k })} className="sr-only" />
                  <span className="flex justify-between items-center gap-2"><span className={`text-sm font-medium ${active ? "text-muteddark" : "text-muted"}`}>{o.label}</span>{k === "pack3" && <span className="text-[11px] font-semibold text-ink bg-accent px-2 py-0.5 rounded-full">Le plus choisi</span>}</span>
                  <span className="display text-2xl font-bold">{formatEuros(o.priceCents)}</span>
                  <span className={`text-xs ${active ? "text-accentsoft" : "text-muted"}`}>{o.credits > 1 ? `${formatEuros(o.perReportCents)} le rapport · valable ${o.validityMonths} mois` : "Paiement unique"}</span>
                </label>
              );
            })}
          </div>
        )}
      </fieldset>

      {error && <p role="alert" className="m-0 bg-badbg text-badtext rounded-xl px-4 py-3 text-sm">{error}</p>}

      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={loading} className="h-14 px-7 rounded-xl bg-accent text-ink font-semibold text-[15px] led disabled:opacity-70 inline-flex items-center gap-2.5">
          {loading && <span className="spinner" aria-hidden="true" />}
          {usePack ? "Utiliser un crédit et lancer le rapport" : `Payer ${formatEuros(OFFERS[form.offer].priceCents)} et lancer le rapport`}
        </button>
        <span className="text-xs text-muted">Paiement sécurisé. Remboursement automatique si aucune donnée n&apos;est trouvée.</span>
      </div>
    </form>
  );
}
