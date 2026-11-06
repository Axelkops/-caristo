import type { Vehicle } from "@/lib/engine/types";
import { OFFERS, formatEuros } from "@/lib/services/pricing";

/*
 * Écran avant paiement : la plaque est valide (format vérifié, aucune requête payante),
 * le rapport est présenté comme prêt à être lancé, avec tout ce qu'il contient, verrouillé.
 */

const Ico = ({ d }: { d: string }) => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
);
const Lock = () => (
  <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
);

const ITEMS: { d: string; t: string; s: string; cg?: boolean; w: number }[] = [
  { d: '<path d="M3 13l2-5a2 2 0 0 1 2-1h10a2 2 0 0 1 2 1l2 5v5H3z"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="16.5" cy="16.5" r="1.5"/>', t: "Identification", s: "Marque, modèle, motorisation, puissance", w: 62 },
  { d: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', t: "Kilométrage", s: "Relevés officiels, alerte si le compteur a reculé", cg: true, w: 48 },
  { d: '<path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7z"/><path d="M9 12l2 2 4-4"/>', t: "Gage, opposition, vol", s: "Ce qui peut bloquer la vente", cg: true, w: 40 },
  { d: '<path d="M12 3l9 16H3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="0.6"/>', t: "Sinistres", s: "Accidents déclarés, réparations expertisées", cg: true, w: 44 },
  { d: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4L15 12l-3-3z"/>', t: "Pannes connues du modèle", s: "Avec le coût de réparation", w: 56 },
  { d: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', t: "Entretien à prévoir", s: "Quand le faire, et combien ça coûte", w: 52 },
  { d: '<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>', t: "Points à vérifier", s: "Côté vendeur et côté acheteur", w: 46 },
  { d: '<path d="M4 19V5M4 19h16"/><path d="M7 15l4-5 3 3 5-7"/>', t: "Cote estimée", s: "Comparée au prix de l'annonce", w: 58 },
  { d: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>', t: "Rappels constructeur", s: "Campagnes de rappel du modèle", w: 36 },
];

export function ReportPaywall({ vehicle }: { vehicle: Vehicle }) {
  const fr = vehicle.country === "FR";
  const id = vehicle.plate ?? vehicle.vin ?? "";
  const known = !vehicle.pending && vehicle.make;
  const items = fr ? ITEMS : ITEMS.filter((i) => !i.cg);
  return (
    <section className="rounded-[24px] text-white overflow-hidden relative" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))", border: "1px solid rgba(147,197,253,0.16)", boxShadow: "0 0 0 1px rgba(59,130,246,0.12), 0 30px 80px rgba(0,0,0,0.45), 0 0 70px rgba(37,99,235,0.15)" }} data-testid="report-paywall">
      <div className="p-6 sm:p-7 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {vehicle.plate ? (
            <span className="inline-flex items-stretch rounded-md overflow-hidden border border-[#C9D3E3]" style={{ boxShadow: "0 6px 18px rgba(0,0,0,0.4)" }} aria-label={`Immatriculation ${id}`}>
              <span className="bg-[#0B3BB0] text-white text-[10px] font-bold px-1.5 flex flex-col items-center justify-end pb-1 gap-1"><span className="w-2 h-2 rounded-full border-[1.5px] border-[#FFD400]" />F</span>
              <span className="bg-[#F5F7FA] text-[#111318] display font-bold text-[20px] tracking-[2.5px] px-3 py-1">{id}</span>
            </span>
          ) : <span className="display text-[17px] font-bold tracking-[1.5px]">VIN {id}</span>}
          <span className="inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-full" style={{ color: "#34D399", background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.35)" }}>
            <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
            {vehicle.plate ? "Plaque valide" : "VIN valide"} · prêt à lancer
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="m-0 text-[28px] sm:text-[34px] leading-[1.08] font-bold text-balance">{known ? `Le rapport complet de votre ${vehicle.make} ${vehicle.model}` : "Votre rapport complet est prêt à être lancé"}</h1>
          {known && <span className="text-[14px] font-semibold text-[#C8D0DC]">{[`${vehicle.make} ${vehicle.model}${vehicle.version ? ` ${vehicle.version}` : ""}`, vehicle.firstRegistration?.slice(0, 4)].filter(Boolean).join(" · ")}</span>}
          <p className="m-0 text-[15px] leading-relaxed text-[#AEB6C4] max-w-[52ch]">Avant de payer des milliers d&apos;euros, sachez exactement ce que vous achetez : ce qui est arrivé à ce véhicule, ce qui va lui arriver, et ce que ça va coûter.</p>
        </div>

        <ul className="m-0 p-0 list-none flex flex-col rounded-2xl overflow-hidden" style={{ background: "rgba(7,15,31,0.55)", border: "1px solid rgba(147,197,253,0.12)" }}>
          {items.map((it, i) => (
            <li key={it.t} className={`grid grid-cols-[34px_1fr_auto] items-center gap-3 px-4 py-3 ${i ? "border-t border-white/[0.06]" : ""}`}>
              <span className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[#93C5FD]" style={{ background: "rgba(96,165,250,0.1)" }}><Ico d={it.d} /></span>
              <span className="flex flex-col min-w-0">
                <span className="text-[14px] font-semibold flex items-center gap-2 flex-wrap">{it.t}{it.cg && <span className="text-[10px] font-semibold uppercase tracking-wider text-[#93C5FD]">avec la carte grise</span>}</span>
                <span className="text-[12.5px] text-[#8E9AAF] leading-snug">{it.s}</span>
              </span>
              <span className="flex items-center gap-2 text-[#5B6779]">
                <span aria-hidden="true" className="hidden min-[420px]:block h-2.5 rounded-full bg-white/25" style={{ width: it.w, filter: "blur(3px)" }} />
                <Lock />
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap gap-x-5 gap-y-2 text-[12.5px] text-[#C8D0DC]">
          {["Prêt en moins d'une minute", "Remboursé si aucun véhicule ne correspond", "Paiement sécurisé", "PDF et lien de partage"].map((g) => (
            <span key={g} className="inline-flex items-center gap-1.5"><svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>{g}</span>
          ))}
        </div>
        <a href="#lancer" className="lg:hidden flex items-center justify-center gap-2 bg-accent text-white no-underline rounded-xl py-3.5 text-[15px] font-semibold" style={{ boxShadow: "0 10px 30px rgba(37,99,235,0.45)" }} data-testid="paywall-cta">
          <Lock />Débloquer le rapport · {formatEuros(OFFERS.single.priceCents)}
        </a>
        <p className="m-0 text-[12px] text-[#8E9AAF]">Rapport unique {formatEuros(OFFERS.single.priceCents)}, ou {formatEuros(OFFERS.pack3.perReportCents)} le rapport avec le pack de {OFFERS.pack3.credits}.{fr ? "" : " Véhicule immatriculé hors de France : l'historique officiel n'est pas disponible."}</p>
      </div>
    </section>
  );
}
