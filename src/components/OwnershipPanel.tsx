"use client";
import { useEffect, useState } from "react";
import type { Ownership } from "@/lib/engine/types";

/*
 * Budget et infos pratiques : ce que le véhicule coûtera en plus du prix d'achat, et ce qu'il faut savoir avant de signer.
 * Composant client pour le choix de la région (carte grise), mémorisé dans le navigateur.
 */

type Tone = "ok" | "warn" | "bad" | "neutral" | "info";
const C: Record<Tone, string> = { ok: "#34D399", warn: "#FBBF24", bad: "#F87171", neutral: "#8E9AAF", info: "#60A5FA" };
const INSET = { background: "rgba(7,15,31,0.55)", border: "1px solid rgba(147,197,253,0.12)" } as const;
const eur = (n: number, dec = false) => `${n.toLocaleString("fr-FR", dec ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 })} €`;
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
/** Couleurs officielles des vignettes Crit'Air. */
export const CRITAIR_COLOR: Record<string, { bg: string; fg: string }> = { "0": { bg: "#22A559", fg: "#fff" }, "1": { bg: "#8E44AD", fg: "#fff" }, "2": { bg: "#F4C430", fg: "#1a1a1a" }, "3": { bg: "#EE7B22", fg: "#fff" }, "4": { bg: "#8B1E2D", fg: "#fff" }, "5": { bg: "#5E6670", fg: "#fff" }, "Non classé": { bg: "#2A3242", fg: "#C8D0DC" } };

const Led = ({ tone, size = 8 }: { tone: Tone; size?: number }) => <span aria-hidden="true" className="inline-block rounded-full shrink-0" style={{ width: size, height: size, background: C[tone], boxShadow: tone === "neutral" ? "none" : `0 0 ${size * 1.4}px ${C[tone]}` }} />;

function Tile({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-5 flex flex-col gap-3 ${className}`} style={INSET}>
      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8E9AAF]">{title}</span>
      {children}
    </div>
  );
}

const PARTS: { key: "depreciation" | "energy" | "maintenance" | "registration" | "inspections"; label: string; color: string }[] = [
  { key: "depreciation", label: "Perte de valeur", color: "#3B82F6" },
  { key: "energy", label: "Carburant ou électricité", color: "#60A5FA" },
  { key: "maintenance", label: "Entretien et réparations prévues", color: "#93C5FD" },
  { key: "registration", label: "Carte grise", color: "#C4B5FD" },
  { key: "inspections", label: "Contrôles techniques", color: "#A5B4FC" },
];

export function OwnershipPanel({ o, currentValue }: { o: Ownership; currentValue?: number }) {
  const [region, setRegion] = useState("");
  useEffect(() => { try { const v = localStorage.getItem("caristo-region"); if (v) setRegion(v); } catch { /* stockage indisponible */ } }, []);
  const pick = (v: string) => { setRegion(v); try { localStorage.setItem("caristo-region", v); } catch { /* stockage indisponible */ } };
  const reg = o.registration;
  const chosen = reg?.regions.find((r) => r.name === region);
  const t = o.threeYears;
  const values = currentValue && o.futureValues ? [{ label: "Aujourd'hui", value: currentValue }, ...o.futureValues.map((f) => ({ label: `Dans ${f.years} an${f.years > 1 ? "s" : ""}`, value: f.value }))] : [];
  const vMax = Math.max(1, ...values.map((x) => x.value));
  const m = o.mileageVsAverage;
  const ca = o.critAir;

  return (
    <div className="flex flex-col gap-4" data-testid="ownership">
      {t && (
        <div className="rounded-2xl p-5 sm:p-6 flex flex-col gap-5" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(37,99,235,0.05))", border: "1px solid rgba(96,165,250,0.35)" }}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[13px] text-[#AEB6C4]">Coût réel sur 3 ans, en plus du prix d&apos;achat récupéré à la revente</span>
              <span className="display text-[38px] sm:text-[44px] font-bold leading-none text-white">≈ {eur(t.total)}</span>
            </div>
            <span className="text-[15px] font-semibold text-[#93C5FD]">soit ≈ {eur(t.perMonth)} par mois</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-white/10" role="img" aria-label="Répartition du coût sur 3 ans">
            {PARTS.filter((p) => t[p.key] > 0).map((p) => <span key={p.key} style={{ width: `${(t[p.key] / Math.max(1, t.total)) * 100}%`, background: p.color }} />)}
          </div>
          <ul className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-[14px]">
            {PARTS.map((p) => (
              <li key={p.key} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[#C8D0DC]"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />{p.label}</span>
                <span className="font-semibold text-white whitespace-nowrap">{p.key === "energy" && !t.energyIncluded ? "non estimé" : `≈ ${eur(t[p.key])}`}</span>
              </li>
            ))}
          </ul>
          <span className="text-[12px] text-[#8E9AAF]">Achat {t.purchaseBasis === "annonce" ? "au prix de l'annonce" : "à la cote moyenne"} ({eur(t.purchase)}), revente estimée {eur(t.resale)} dans 3 ans. Hors assurance, stationnement et péages.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reg && (
          <Tile title="Carte grise">
            <span className="display text-[28px] font-bold leading-none">{chosen ? eur(chosen.total, true) : `${eur(reg.min, true)} – ${eur(reg.max, true)}`}</span>
            <label className="flex flex-col gap-1.5 text-[13px] text-[#AEB6C4]">
              Votre région
              <select value={region} onChange={(e) => pick(e.target.value)} className="h-10 rounded-xl px-3 text-[14px] text-white outline-none focus:ring-2 focus:ring-[#60A5FA]" style={{ background: "rgba(7,15,31,0.8)", border: "1px solid rgba(147,197,253,0.25)" }}>
                <option value="">Choisir…</option>
                {reg.regions.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
            </label>
            <span className="text-[12px] text-[#8E9AAF] leading-snug">{reg.note}</span>
          </Tile>
        )}

        {ca && (
          <Tile title="Vignette Crit'Air">
            <div className="flex items-center gap-4">
              <span className="w-14 h-14 rounded-full flex items-center justify-center display font-bold text-[24px] shrink-0" style={{ background: CRITAIR_COLOR[ca.level]?.bg, color: CRITAIR_COLOR[ca.level]?.fg, boxShadow: "0 0 0 3px rgba(255,255,255,0.08)" }}>{ca.level === "Non classé" ? "–" : ca.level}</span>
              <span className="text-[15px] font-semibold flex items-center gap-2" style={{ color: C[ca.tone] }}><Led tone={ca.tone} />{ca.tone === "ok" ? "Circule partout" : ca.tone === "warn" ? "Restrictions dans certaines villes" : "Interdit dans plusieurs villes"}</span>
            </div>
            <span className="text-[13px] text-[#C8D0DC] leading-relaxed">{ca.zfe}</span>
            <span className="text-[12px] text-[#8E9AAF]">Zones à faibles émissions : situation de {ca.updated}.</span>
          </Tile>
        )}

        {o.energy && (
          <Tile title={o.energy.unit === "kWh" ? "Consommation et recharge" : "Consommation réelle estimée"}>
            <div className="flex items-baseline gap-2 flex-wrap"><span className="display text-[28px] font-bold leading-none">≈ {o.energy.per100.toLocaleString("fr-FR")} {o.energy.unit}</span><span className="text-[14px] text-[#AEB6C4]">aux 100 km</span></div>
            <span className="text-[15px] text-white font-semibold">≈ {eur(o.energy.annualCost)} par an</span>
            <span className="text-[12px] text-[#8E9AAF] leading-snug">Pour {o.energy.annualKm.toLocaleString("fr-FR")} km par an (moyenne française), {o.energy.energyLabel} à {o.energy.price.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 3 })} €{o.energy.unit === "kWh" ? "/kWh" : "/L"}. {o.energy.basis}</span>
          </Tile>
        )}

        {m && (
          <Tile title="Kilométrage face à la moyenne">
            <span className="display text-[28px] font-bold leading-none" style={{ color: m.verdict === "normal" ? "#E5E9F0" : m.verdict === "faible" ? C.ok : C.warn }}>{m.deltaPct > 0 ? "+" : ""}{m.deltaPct} %</span>
            <div className="flex flex-col gap-1.5">
              <div className="relative h-2 rounded-full bg-white/10">
                <span className="absolute top-1/2 -translate-y-1/2 w-[2px] h-4 bg-white/60 rounded" style={{ left: "50%" }} title="Moyenne" />
                <span className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full" style={{ left: `${Math.min(96, Math.max(4, 50 + m.deltaPct / 2))}%`, background: m.verdict === "eleve" ? C.warn : "#60A5FA", boxShadow: "0 0 0 3px #070F1F" }} />
              </div>
              <div className="flex justify-between text-[11px] text-[#8E9AAF]"><span>Peu roulé</span><span>Moyenne : {m.expected.toLocaleString("fr-FR")} km</span><span>Très roulé</span></div>
            </div>
            <span className="text-[13px] text-[#C8D0DC] leading-relaxed">{m.comment}</span>
          </Tile>
        )}

        {o.nextInspection && (
          <Tile title="Prochain contrôle technique">
            <span className="display text-[24px] font-bold leading-tight" style={{ color: o.nextInspection.overdue ? C.bad : "#E5E9F0" }}>{o.nextInspection.overdue ? "En retard" : `Avant ${fmtDate(o.nextInspection.date)}`}</span>
            <span className="text-[13px] text-[#C8D0DC] leading-relaxed">{o.nextInspection.detail}</span>
            {o.nextInspection.estimated && <span className="text-[12px] text-[#8E9AAF]">Date calculée à partir de la mise en circulation : 4 ans, puis tous les 2 ans.</span>}
          </Tile>
        )}

        {o.warranties.length > 0 && (
          <Tile title="Garanties">
            <ul className="m-0 p-0 list-none flex flex-col gap-3">
              {o.warranties.map((w) => { const tone: Tone = w.status === "active" ? "ok" : w.status === "check" ? "warn" : "neutral"; return (
                <li key={w.label} className="flex gap-3 items-start">
                  <span className="mt-1.5"><Led tone={tone} /></span>
                  <span className="flex flex-col gap-0.5"><span className="text-[14px] font-semibold">{w.label} · <span style={{ color: tone === "neutral" ? "#AEB6C4" : C[tone] }}>{w.status === "active" ? "en cours" : w.status === "check" ? "à vérifier" : "terminée"}</span></span><span className="text-[12.5px] text-[#AEB6C4] leading-snug">{w.detail}</span></span>
                </li>
              ); })}
            </ul>
          </Tile>
        )}

        {values.length > 0 && (
          <Tile title="Valeur à la revente" className="md:col-span-2 xl:col-span-3">
            <div className="grid grid-cols-4 gap-1.5 sm:gap-3 items-end h-36">
              {values.map((x, i) => (
                <div key={x.label} className="flex flex-col items-center justify-end gap-1.5 h-full min-w-0">
                  <span className="text-[11.5px] sm:text-[13px] font-semibold text-white whitespace-nowrap">{eur(x.value)}</span>
                  <div className="w-full max-w-[120px] rounded-t-lg" style={{ height: `${Math.max(8, (x.value / vMax) * 78)}%`, background: i === 0 ? "#3B82F6" : `rgba(96,165,250,${0.55 - i * 0.12})`, boxShadow: i === 0 ? "0 0 16px rgba(59,130,246,0.5)" : undefined }} />
                  <span className="text-[11px] sm:text-[12px] text-[#8E9AAF] whitespace-nowrap">{x.label}</span>
                </div>
              ))}
            </div>
            <span className="text-[12px] text-[#8E9AAF]">Estimation en roulant la moyenne française chaque année. L&apos;état, l&apos;entretien et le marché font varier le prix.</span>
          </Tile>
        )}
      </div>
    </div>
  );
}
