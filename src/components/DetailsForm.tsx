"use client";

import { CarteGriseGuide } from "./CarteGriseGuide";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Vehicle } from "@/lib/engine/types";
import { OFFERS, formatEuros, type Offer } from "@/lib/services/pricing";

export interface AccountInfo {
  email: string;
  pack: { offer: string; remaining: number; total: number; expiresAt: string } | null;
}

export function DetailsForm({ reportId, vehicle, defaults, account }: { reportId: string; vehicle: Vehicle; defaults?: { mileage?: number | null; email?: string | null; offer?: string | null }; account?: AccountInfo | null }) {
  const router = useRouter();
  const isFr = vehicle.country === "FR";
  const [form, setForm] = useState({
    mileage: defaults?.mileage ? String(defaults.mileage) : "",
    holderName: "",
    formulaNumber: "",
    firstRegDate: "",
    listingUrl: "",
    email: account?.email ?? defaults?.email ?? "",
    offer: (defaults?.offer as Offer) ?? "single",
    packCode: "",
  });
  const [buyInstead, setBuyInstead] = useState(false);
  const usePack = !!account?.pack && !buyInstead;
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
      const body = { ...form, packCode: undefined, useAccountPack: usePack };
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
          <p className="m-0 text-sm text-[#4B5563]">Trois informations de la carte grise ouvrent l&apos;historique officiel (contrôles techniques, kilométrages, sinistres, situation administrative). Acheteur : demandez une photo de la carte grise au vendeur. Le schéma montre où les trouver.</p>
          <CarteGriseGuide />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="formulaNumber" className={labelCls}>Numéro de formule</label>
              <input id="formulaNumber" placeholder="2021AB12345" autoCapitalize="characters" value={form.formulaNumber} onChange={set("formulaNumber")} className={`${fieldCls} uppercase`} />
              <span className={help}>Repère 1 : en gras sous le titre, 11 caractères (année + 2 lettres + 5 chiffres).</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="holderName" className={labelCls}>Nom du titulaire</label>
              <input id="holderName" placeholder="DUPONT MARIE" autoComplete="off" value={form.holderName} onChange={set("holderName")} className={fieldCls} />
              <span className={help}>Repère 2 : case C.1, tel qu&apos;écrit sur la carte grise.</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="firstRegDate" className={labelCls}>Date de 1re immatriculation</label>
              <input id="firstRegDate" placeholder="27/02/2020" inputMode="numeric" value={form.firstRegDate} onChange={set("firstRegDate")} className={fieldCls} />
              <span className={help}>Repère 3 : case B, sous la plaque d&apos;immatriculation.</span>
            </div>
          </div>
          <p className="m-0 text-xs text-muted">Sans ces informations, le rapport est produit avec tout le reste et indique clairement les sections non renseignées.</p>
        </fieldset>
      ) : (
        <div className="bg-warnbg border border-[#FDD9A8] rounded-xl px-4 py-3 text-sm text-warntext">Véhicule immatriculé hors de France : le rapport contiendra la fiche technique, les pannes connues, la cote et l&apos;échéancier. L&apos;historique officiel (contrôles techniques, sinistres, gage) n&apos;est disponible que pour les véhicules immatriculés en France.</div>
      )}

      <fieldset className="border-0 p-0 m-0 flex flex-col gap-4">
        <legend className="display text-xl font-bold mb-1">Votre rapport</legend>
        {account ? (
          <div className="flex flex-col gap-1.5 max-w-md">
            <span className={labelCls}>Votre e-mail</span>
            <div className={`${fieldCls} flex items-center justify-between gap-3 bg-ground`}><span className="truncate">{account.email}</span><span className="text-xs text-oktext font-semibold whitespace-nowrap">Connecté</span></div>
            <span className={help}>Le rapport sera rangé dans votre espace « Mes rapports ».</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 max-w-md">
            <label htmlFor="email" className={labelCls}>Votre e-mail *</label>
            <input id="email" type="email" inputMode="email" autoComplete="email" placeholder="vous@exemple.fr" value={form.email} onChange={set("email")} className={fieldCls} required />
            <span className={help}>Le rapport vous y sera envoyé et restera disponible dans votre espace « Mes rapports ». <Link href={`/connexion?next=/verification/${reportId}`} className="text-navy font-semibold">Déjà un pack ? Connectez-vous</Link>.</span>
          </div>
        )}

        {account?.pack && (
          <div data-testid="account-pack" className={`rounded-2xl border p-4 flex flex-wrap justify-between items-center gap-3 ${usePack ? "bg-okbg border-emerald-200" : "bg-ground border-line"}`}>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold">{OFFERS[account.pack.offer as Offer]?.label ?? "Votre pack"} : {account.pack.remaining} rapport{account.pack.remaining > 1 ? "s" : ""} restant{account.pack.remaining > 1 ? "s" : ""}</span>
              <span className="text-[13px] text-[#4B5563]">{usePack ? "Ce rapport utilisera un crédit, sans paiement." : "Vous avez choisi d'acheter un nouveau rapport à la place."} Valable jusqu&apos;au {new Date(account.pack.expiresAt).toLocaleDateString("fr-FR")}.</span>
            </div>
            <button type="button" onClick={() => setBuyInstead(!buyInstead)} className="text-sm font-semibold text-navy bg-transparent border border-line rounded-lg px-3 py-2 cursor-pointer">{usePack ? "Acheter à la place" : "Utiliser mon pack"}</button>
          </div>
        )}

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
        <span className="text-xs text-muted max-w-[46ch]">Paiement sécurisé. Remboursé si le rapport ne peut pas être produit. En validant, vous acceptez les <Link href="/cgv" className="text-navy">conditions générales</Link> et demandez la production immédiate du rapport.</span>
      </div>
    </form>
  );
}
