import Link from "next/link";
import { SearchWidget } from "@/components/SearchWidget";
import { OFFERS, formatEuros } from "@/lib/services/pricing";

const Check = ({ color = "var(--accent)" }: { color?: string }) => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" className="shrink-0"><path d="M20 6L9 17l-5-5" /></svg>
);
const Cross = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" className="shrink-0"><path d="M6 6l12 12M18 6L6 18" /></svg>
);
const Icon = ({ d }: { d: string }) => (
  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
);

const CONTENT = [
  { d: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>', t: "Historique officiel", s: "Propriétaires, contrôles techniques, situation administrative." },
  { d: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', t: "Kilométrage", s: "Chaque relevé, et l'alerte si le compteur a reculé." },
  { d: '<path d="M12 3l9 16H3z"/><path d="M12 10v4"/><circle cx="12" cy="17" r="0.6"/>', t: "Sinistres", s: "Accidents déclarés et réparations contrôlées par expert." },
  { d: '<path d="M12 3l8 4v5c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V7z"/><path d="M9 12l2 2 4-4"/>', t: "Gage, opposition, vol", s: "Ce qui empêche une vente, vérifié avant de payer." },
  { d: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4L15 12l-3-3z"/>', t: "Pannes connues du modèle", s: "Les faiblesses de ce modèle, avec le coût et quoi vérifier." },
  { d: '<path d="M4 19V5M4 19h16"/><path d="M7 15l4-5 3 3 5-7"/>', t: "Cote du marché", s: "Une fourchette de prix réaliste pour ce véhicule." },
  { d: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', t: "Échéancier d'entretien", s: "Ce qu'il faudra faire à 12, 24 et 36 mois, et combien." },
  { d: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>', t: "Rappels constructeur", s: "Les rappels du modèle, à faire vérifier gratuitement en concession." },
];

const FEATURES = ["Historique, kilométrage, sinistres", "Pannes connues du modèle", "Cote du marché", "Échéancier d'entretien 12, 24, 36 mois", "Rappels constructeur", "Remboursé si vide"];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section id="top" className="text-white px-4 sm:px-6 pt-16 sm:pt-20 pb-20 sm:pb-24" style={{ background: "linear-gradient(180deg, #070F1F 0%, #0A1E3F 100%)" }}>
        <div className="max-w-[1200px] mx-auto flex flex-wrap gap-12 items-center">
          <div className="flex-[1_1_480px] min-w-0 flex flex-col gap-7">
            <h1 className="m-0 text-[40px] sm:text-[58px] leading-[1.04] font-bold">Sachez tout de ce véhicule avant de le payer.</h1>
            <p className="m-0 text-lg sm:text-[19px] leading-relaxed text-muteddark max-w-[520px]">Historique, kilométrage, sinistres, pannes connues et cote. Le rapport complet en moins d&apos;une minute.</p>
            <SearchWidget />
          </div>
          <div className="flex-[1_1_400px] min-w-0 flex justify-center">
            <HeroExample />
          </div>
        </div>
      </section>

      {/* CONTENU */}
      <section id="contenu" className="px-4 sm:px-6 py-20 sm:py-24">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-11">
          <div className="flex flex-col gap-3.5 max-w-[680px]">
            <span className="text-xs font-semibold text-[#1D4ED8] uppercase tracking-[1.8px]">Le rapport</span>
            <h2 className="m-0 text-[32px] sm:text-[42px] leading-[1.08] font-bold">Le contenu du rapport.</h2>
          </div>
          <div className="bg-white border border-line rounded-3xl px-4 sm:px-8 py-3 grid grid-cols-1 md:grid-cols-2 gap-x-12">
            {CONTENT.map((c, i) => (
              <div key={c.t} className={`flex gap-5 items-center py-5 px-2 ${i < CONTENT.length - 2 ? "border-b border-line" : "md:border-b-0 border-b border-line last:border-b-0"}`}>
                <span className="w-12 h-12 rounded-[14px] bg-ink flex items-center justify-center shrink-0"><Icon d={c.d} /></span>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="display text-[19px] font-bold">{c.t}</span>
                  <span className="text-sm text-muted leading-relaxed">{c.s}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-5">
            <h3 className="m-0 text-2xl font-bold">Tous les types de véhicules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                ["Électrique", "Batterie, garantie, rappels logiciels.", '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'],
                ["Hybride", "Batterie haute tension, double motorisation.", '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>'],
                ["Collection", "Authenticité, numéros concordants.", '<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.3 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>'],
                ["Utilitaire", "Charge utile, usage professionnel.", '<rect x="2" y="7" width="13" height="10" rx="1.5"/><path d="M15 10h4l3 3v4h-7z"/><circle cx="7" cy="18" r="1.8"/><circle cx="18" cy="18" r="1.8"/>'],
              ].map(([t, s, d]) => (
                <div key={t} className="bg-white border border-line rounded-[18px] p-5 flex flex-col gap-3">
                  <span className="w-11 h-11 rounded-xl bg-ground flex items-center justify-center"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0A1E3F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} /></span>
                  <span className="font-semibold">{t}</span>
                  <span className="text-[13px] text-muted leading-relaxed">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PANNES */}
      <section id="pannes" className="bg-ink text-white px-4 sm:px-6 py-20 sm:py-24">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-12">
          <div className="flex flex-col gap-3.5 max-w-[760px]">
            <span className="text-xs font-semibold text-accentsoft uppercase tracking-[1.8px]">Fonctionnalité exclusive</span>
            <h2 className="m-0 text-[32px] sm:text-[42px] leading-[1.08] font-bold">Toutes les pannes connues de ce modèle.</h2>
          </div>
          <div className="flex flex-wrap gap-8 items-stretch">
            <div className="flex-[1_1_420px] min-w-0 bg-navy2 border border-accent/30 rounded-[20px] p-6 flex flex-col gap-3.5" style={{ boxShadow: "0 0 60px rgba(37,99,235,0.2)" }}>
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <span className="display text-[17px] font-bold">Peugeot 3008 1.5 BlueHDi · 2019 · 118 000 km</span>
                <span className="text-[11px] font-semibold text-accentsoft uppercase tracking-wider">Exemple</span>
              </div>
              <div className="border border-red-500/40 bg-red-500/10 rounded-[14px] p-4 flex flex-col gap-2.5">
                <div className="flex justify-between gap-2.5 items-center"><span className="font-semibold">Courroie de distribution</span><span className="text-[11px] font-semibold bg-bad px-2.5 py-1 rounded-full">À vérifier en priorité</span></div>
                <div className="relative h-2 bg-white/10 rounded"><div className="absolute left-0 w-[72%] h-full bg-red-500 rounded" style={{ boxShadow: "0 0 10px #EF4444" }} /><div className="absolute left-[58%] -top-1 w-[3px] h-4 bg-white rounded" /></div>
                <div className="flex justify-between text-xs text-red-300"><span>Panne possible dès 80 000 km</span><span>Ce véhicule : 118 000 km</span></div>
                <div className="grid grid-cols-2 gap-2 text-[13px]"><span className="px-2.5 py-2 rounded-lg bg-white/10"><strong className="font-semibold">Coût :</strong> 900 – 1 400 €</span><span className="px-2.5 py-2 rounded-lg bg-white/10"><strong className="font-semibold">À faire :</strong> demander la facture</span></div>
              </div>
              {[["Vanne antipollution", "Fréquent · 350 – 600 €", "text-amber-300"], ["Boîte automatique", "Occasionnel · mise à jour", "text-muteddark"], ["Réservoir AdBlue", "Rappel déjà fait", "text-emerald-400"]].map(([a, b, c]) => (
                <div key={a} className="border border-white/10 rounded-[14px] px-4 py-3.5 flex justify-between items-center gap-2.5"><span className="text-sm">{a}</span><span className={`text-xs font-semibold ${c}`}>{b}</span></div>
              ))}
            </div>
            <div className="flex-[1_1_320px] min-w-0 grid gap-3.5">
              {[["1", "La panne", "Et à quel kilométrage elle arrive sur ce modèle."], ["2", "Le prix de la réparation", "Pour négocier, ou renoncer."], ["3", "Quoi vérifier sur place", "En 2 minutes, avant de signer."]].map(([n, t, s]) => (
                <div key={n} className="bg-white/5 border border-white/10 rounded-[18px] p-6 flex gap-4 items-center">
                  <span className="display text-[34px] font-bold text-accent w-12 shrink-0">{n}</span>
                  <div className="flex flex-col gap-1"><span className="text-lg font-semibold">{t}</span><span className="text-sm text-muteddark">{s}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ENTRETIEN */}
      <section id="entretien" className="px-4 sm:px-6 py-20 sm:py-24 bg-white border-b border-line">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-11">
          <div className="flex flex-col gap-3.5 max-w-[680px]">
            <span className="text-xs font-semibold text-[#1D4ED8] uppercase tracking-[1.8px]">Inclus dans le rapport</span>
            <h2 className="m-0 text-[32px] sm:text-[42px] leading-[1.08] font-bold">Ce qu&apos;il faudra prévoir après l&apos;achat.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-ground rounded-[20px] p-7 flex flex-col gap-4 items-start">
              <span className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center"><svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg></span>
              <span className="display text-xl font-bold">Échéancier 12, 24, 36 mois</span>
              <span className="text-sm text-[#4B5563] leading-relaxed">Ce qu&apos;il faudra faire, quand, et combien ça coûte.</span>
            </div>
            <div className="bg-ground rounded-[20px] p-7 flex flex-col gap-4 items-start">
              <span className="w-14 h-14 rounded-2xl bg-navy flex items-center justify-center"><svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg></span>
              <span className="display text-xl font-bold">Rappels constructeur</span>
              <span className="text-sm text-[#4B5563] leading-relaxed">Les rappels connus du modèle, à faire vérifier gratuitement en concession avec le VIN.</span>
            </div>
          </div>
        </div>
      </section>

      {/* POURQUOI */}
      <section id="pourquoi" className="px-4 sm:px-6 py-20 sm:py-24">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-12">
          <div className="flex flex-col gap-3.5 max-w-[760px]">
            <span className="text-xs font-semibold text-[#1D4ED8] uppercase tracking-[1.8px]">Pourquoi Caristo</span>
            <h2 className="m-0 text-[32px] sm:text-[42px] leading-[1.08] font-bold">Plus complet. Moins cher.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            <div className="bg-white border border-line rounded-3xl p-8 flex flex-col gap-5">
              <div className="flex flex-col gap-1"><span className="text-xs font-semibold text-muted uppercase tracking-[1.5px]">Rapports classiques</span><span className="display text-[40px] font-bold text-muted">≈ 32 €</span></div>
              <ul className="m-0 p-0 list-none flex flex-col gap-3.5 text-[15px] text-[#4B5563]">
                {FEATURES.map((f, i) => <li key={f} className={`flex gap-3 items-center ${i ? "text-gray-400" : ""}`}>{i ? <Cross /> : <Check color="#6B7280" />}{f}</li>)}
              </ul>
            </div>
            <div className="bg-ink text-white rounded-3xl p-8 flex flex-col gap-5 led-strong">
              <div className="flex flex-col gap-1"><span className="text-xs font-semibold text-accentsoft uppercase tracking-[1.5px]">Caristo</span><span className="display text-[40px] font-bold">{formatEuros(OFFERS.single.priceCents)}</span></div>
              <ul className="m-0 p-0 list-none flex flex-col gap-3.5 text-[15px]">
                {FEATURES.map((f) => <li key={f} className="flex gap-3 items-center"><Check />{f}</li>)}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section id="tarifs" className="bg-ink text-white px-4 sm:px-6 py-20 sm:py-24">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-12">
          <h2 className="m-0 text-[32px] sm:text-[42px] leading-[1.08] font-bold">Tarifs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            <PriceCard offer="single" items={["Rapport complet", "Pannes connues et échéancier", "Cote et rappels constructeur", "PDF + lien de partage"]} />
            <PriceCard offer="pack3" highlight items={["Tout le rapport unique, ×3", "Comparateur côte à côte", "Argumentaire de négociation", "Valable 12 mois"]} />
            <PriceCard offer="pack10" items={["Tout le pack 3, ×10", "Pour les gros acheteurs et les pros", "Valable 24 mois"]} />
          </div>
          <p className="m-0 text-[13px] text-[#7C8798] text-center">Paiement sécurisé par carte, Apple Pay ou Google Pay. Remboursement automatique si aucune donnée n&apos;est trouvée.</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-4 sm:px-6 py-20 sm:py-24">
        <div className="max-w-[900px] mx-auto flex flex-col gap-9">
          <h2 className="m-0 text-[32px] sm:text-[42px] leading-[1.08] font-bold">Questions fréquentes</h2>
          <div className="flex flex-col gap-3">
            {[
              ["De quoi ai-je besoin pour faire un rapport ?", "La plaque, le kilométrage et trois informations de la carte grise : le numéro de formule, le nom du titulaire et la date de première immatriculation. Si vous êtes acheteur, demandez une photo de la carte grise au vendeur."],
              ["Comment savez-vous quoi vérifier sur ce véhicule précisément ?", "La plaque nous donne le modèle et le moteur exacts. Nous croisons avec le kilométrage, l'âge et notre base de pannes connues par modèle."],
              ["Que se passe-t-il si aucune donnée n'est trouvée ?", "Vous êtes remboursé automatiquement."],
              ["Le rapport garantit-il que le véhicule est sain ?", "Non. Il vous dit ce qui est enregistré sur ce véhicule et quoi vérifier sur place. Il ne remplace pas un essai ni un passage en garage."],
              ["Et pour un véhicule immatriculé hors de France ?", "Le rapport contient la fiche technique, les pannes connues, la cote et l'échéancier. L'historique officiel (contrôles techniques, sinistres, gage) n'existe que pour les véhicules immatriculés en France : le rapport l'indique clairement."],
              ["Mes données personnelles sont-elles conservées ?", "Seulement votre e-mail et l'immatriculation, le temps de la livraison et du suivi du rapport, conformément au RGPD."],
            ].map(([q, a], i) => (
              <details key={q} open={i === 0} className="bg-white border border-line rounded-2xl px-6 py-5">
                <summary className="font-semibold flex justify-between items-center gap-3">{q}<svg aria-hidden="true" className="chev shrink-0 transition-transform" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg></summary>
                <p className="mt-3.5 mb-0 text-[15px] leading-relaxed text-[#4B5563]">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function PriceCard({ offer, highlight = false, items }: { offer: keyof typeof OFFERS; highlight?: boolean; items: string[] }) {
  const o = OFFERS[offer];
  return (
    <div className={`${highlight ? "bg-navy border border-accent/50 md:-translate-y-3.5" : "bg-navy2 border border-white/10"} rounded-[22px] p-8 flex flex-col gap-4`} style={highlight ? { boxShadow: "0 0 80px rgba(37,99,235,0.35), 0 30px 60px rgba(0,0,0,0.4)" } : undefined}>
      <div className="flex justify-between items-center gap-2.5"><span className="text-sm font-medium text-muteddark">{o.label}</span>{highlight && <span className="text-[11px] font-semibold text-ink bg-accent px-2.5 py-1 rounded-full led">Le plus choisi</span>}</div>
      <div className="flex items-baseline gap-1.5 flex-wrap"><span className="display text-[50px] font-bold leading-none">{(o.priceCents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</span><span className="text-lg text-muteddark">€</span>{o.credits > 1 && <span className="text-[13px] text-accentsoft ml-2">{formatEuros(o.perReportCents)} le rapport</span>}</div>
      <ul className="m-0 p-0 list-none flex flex-col gap-2.5 text-sm text-[#D5DCE8]">{items.map((i) => <li key={i} className="flex gap-2.5"><Check />{i}</li>)}</ul>
      <Link href="/#top" className={`mt-auto text-center py-3.5 rounded-xl font-semibold no-underline ${highlight ? "bg-accent text-ink led" : "border border-white/20 text-white"}`}>{highlight ? "Prendre le pack" : "Choisir"}</Link>
    </div>
  );
}

function HeroExample() {
  return (
    <div className="w-full max-w-[480px] bg-navy2 text-white border border-accent/35 rounded-[22px] p-6 flex flex-col gap-4 relative" style={{ boxShadow: "0 0 0 1px rgba(59,130,246,0.15), 0 0 70px rgba(37,99,235,0.3), 0 30px 70px rgba(0,0,0,0.45)" }}>
      <span className="absolute -top-3 right-5 bg-accent text-ink text-[11px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-full led">Exemple de rapport</span>
      <div className="flex justify-between items-start gap-3">
        <div className="flex flex-col gap-1"><span className="display text-[21px] font-bold">Peugeot 3008 1.5 BlueHDi</span><span className="text-[13px] text-muteddark">AB-123-CD · 2019 · 118 000 km · Diesel · Boîte auto</span></div>
        <div className="flex flex-col items-center gap-1"><span className="w-14 h-14 rounded-full border-[5px] border-emerald-500 flex items-center justify-center display text-[22px] font-bold text-emerald-400" style={{ boxShadow: "0 0 18px rgba(16,185,129,0.4)" }}>B</span><span className="text-[11px] font-semibold text-emerald-400">Risque faible</span></div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[["Kilométrage", "Cohérent", "text-emerald-400"], ["Sinistres", "Aucun", "text-emerald-400"], ["Gage / vol", "Aucun", "text-emerald-400"], ["Origine", "Importée", "text-amber-300"]].map(([a, b, c]) => (
          <div key={a} className="bg-white/5 rounded-xl px-2 py-2.5 flex flex-col gap-1 items-center text-center"><span className="text-[10px] text-[#7C8798] uppercase tracking-wider">{a}</span><span className={`text-[13px] font-semibold ${c}`}>{b}</span></div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[11px] text-[#7C8798]"><span className="uppercase tracking-wider">Kilométrage relevé</span><span>4 contrôles · aucun recul</span></div>
        <div className="flex items-end gap-1.5 h-11">{[34, 54, 76].map((h) => <div key={h} className="flex-1 bg-white/10 rounded-t" style={{ height: `${h}%` }} />)}<div className="flex-1 bg-accent rounded-t h-full" style={{ boxShadow: "0 0 12px rgba(59,130,246,0.6)" }} /></div>
        <div className="flex justify-between text-[10px] text-[#7C8798]"><span>38 410</span><span>61 200</span><span>84 950</span><span className="text-accentsoft font-semibold">112 300 km</span></div>
      </div>
      <div className="border-t border-white/10 pt-3 flex flex-col gap-2">
        <span className="text-[10px] font-semibold text-[#7C8798] uppercase tracking-wider">À vérifier sur ce véhicule</span>
        <div className="flex items-center gap-2.5 bg-red-500/10 rounded-[10px] px-3 py-2"><span className="dot bg-red-500" style={{ boxShadow: "0 0 10px #EF4444" }} /><span className="text-[13px] flex-1">Courroie de distribution</span><span className="text-xs font-semibold text-red-300">900 – 1 400 €</span></div>
        <div className="flex items-center gap-2.5 bg-white/5 rounded-[10px] px-3 py-2"><span className="dot bg-amber-400" /><span className="text-[13px] flex-1">Vanne antipollution</span><span className="text-xs text-muteddark">350 – 600 €</span></div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-accent/10 border border-accent/30 rounded-xl px-3 py-2.5 flex flex-col gap-0.5"><span className="text-[10px] text-accentsoft uppercase tracking-wider">Cote du marché</span><span className="text-[15px] font-bold">16 200 – 17 400 €</span><span className="text-[11px] text-amber-300">Annonce : 17 900 €, au-dessus</span></div>
        <div className="bg-accent/10 border border-accent/30 rounded-xl px-3 py-2.5 flex flex-col gap-0.5"><span className="text-[10px] text-accentsoft uppercase tracking-wider">Entretien 12 mois</span><span className="text-[15px] font-bold">≈ 400 – 550 €</span><span className="text-[11px] text-muteddark">Vidange, filtres, contrôle</span></div>
      </div>
    </div>
  );
}
