/*
 * Sections illustrées de l'accueil : pannes connues, points à vérifier, entretien à prévoir.
 * Illustrations en SVG (aucune image externe), sobres, dans la palette du site.
 */

const Ill = ({ children }: { children: React.ReactNode }) => (
  <div className="relative h-[168px] rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: "radial-gradient(120% 90% at 50% 0%, rgba(37,99,235,0.35), rgba(10,30,63,0.6) 55%, #070F1F)", border: "1px solid rgba(147,197,253,0.14)" }}>
    {children}
  </div>
);

/** 1 · La panne : moteur avec voyant et zone de kilométrage */
function IllPanne() {
  return (
    <Ill>
      <svg viewBox="0 0 240 156" width="240" height="156" aria-hidden="true">
        <defs>
          <linearGradient id="ip-zone" x1="0" x2="1"><stop offset="0" stopColor="#FBBF24" /><stop offset="1" stopColor="#F87171" /></linearGradient>
          <filter id="ip-glow"><feGaussianBlur stdDeviation="3" /></filter>
        </defs>
        {/* bloc moteur */}
        <g stroke="#93C5FD" strokeWidth="2.2" fill="rgba(147,197,253,0.08)" strokeLinejoin="round">
          <path d="M70 46h56v10h14l10 10h14v40h-14l-10 10H84l-14-14H58V60h12z" />
          <path d="M84 36h28v10H84z" />
          <path d="M44 74h14v16H44z" />
        </g>
        <g stroke="#93C5FD" strokeWidth="2" strokeLinecap="round"><path d="M86 74h40M86 86h40M86 98h28" opacity=".5" /></g>
        {/* voyant */}
        <circle cx="168" cy="44" r="16" fill="#F87171" opacity=".35" filter="url(#ip-glow)" />
        <circle cx="168" cy="44" r="13" fill="#2A1520" stroke="#F87171" strokeWidth="2" />
        <path d="M168 37v9" stroke="#F87171" strokeWidth="2.6" strokeLinecap="round" /><circle cx="168" cy="51" r="1.6" fill="#F87171" />
        {/* jauge km */}
        <rect x="30" y="128" width="180" height="6" rx="3" fill="rgba(255,255,255,0.1)" />
        <rect x="102" y="128" width="80" height="6" rx="3" fill="url(#ip-zone)" />
        <rect x="146" y="123" width="3" height="16" rx="1.5" fill="#fff" />
        <text x="102" y="149" fill="#FBBF24" fontSize="9" fontFamily="Inter, sans-serif" fontWeight="600">dès 80 000 km</text>
      </svg>
    </Ill>
  );
}

/** 2 · Le prix de la réparation : étiquette et coût estimé */
function IllPrix() {
  return (
    <Ill>
      <svg viewBox="0 0 240 150" width="240" height="150" aria-hidden="true">
        <defs><filter id="pp-glow"><feGaussianBlur stdDeviation="6" /></filter></defs>
        <rect x="48" y="34" width="144" height="74" rx="14" fill="#60A5FA" opacity=".25" filter="url(#pp-glow)" />
        <path d="M54 40h112l24 31-24 31H54a8 8 0 0 1-8-8V48a8 8 0 0 1 8-8z" fill="#0F2347" stroke="#60A5FA" strokeWidth="2" />
        <circle cx="174" cy="71" r="5" fill="none" stroke="#60A5FA" strokeWidth="2" />
        <text x="62" y="66" fill="#93C5FD" fontSize="10" fontFamily="Inter, sans-serif" fontWeight="600" letterSpacing="1">RÉPARATION</text>
        <text x="62" y="90" fill="#F3F6FA" fontSize="21" fontFamily="Manrope, Inter, sans-serif" fontWeight="800">≈ 900 €</text>
        <g fill="rgba(147,197,253,0.18)"><rect x="70" y="120" width="44" height="6" rx="3" /><rect x="120" y="120" width="26" height="6" rx="3" /></g>
      </svg>
    </Ill>
  );
}

/** 3 · Quoi vérifier sur place : loupe et liste cochée */
function IllVerifier() {
  return (
    <Ill>
      <svg viewBox="0 0 240 150" width="240" height="150" aria-hidden="true">
        <rect x="52" y="26" width="104" height="102" rx="12" fill="#0F2347" stroke="rgba(147,197,253,0.45)" strokeWidth="1.6" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(66 ${46 + i * 26})`}>
            <rect width="14" height="14" rx="4" fill={i < 2 ? "rgba(52,211,153,0.18)" : "none"} stroke={i < 2 ? "#34D399" : "#5B6779"} strokeWidth="1.6" />
            {i < 2 && <path d="M3.5 7.5l2.6 2.6 4.8-5" stroke="#34D399" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
            <rect x="22" y="3" width={i === 1 ? 46 : 58} height="8" rx="4" fill="rgba(229,233,240,0.22)" />
          </g>
        ))}
        <circle cx="160" cy="88" r="26" fill="rgba(96,165,250,0.12)" stroke="#60A5FA" strokeWidth="3" />
        <path d="M179 107l20 20" stroke="#60A5FA" strokeWidth="6" strokeLinecap="round" />
        <circle cx="152" cy="80" r="6" fill="rgba(255,255,255,0.25)" />
      </svg>
    </Ill>
  );
}

export function PannesSection() {
  const cards = [
    { ill: <IllPanne />, n: "1", t: "La panne", s: "Les faiblesses connues de ce moteur, et le kilométrage où elles apparaissent." },
    { ill: <IllPrix />, n: "2", t: "Le prix de la réparation", s: "Un coût estimé pour chaque panne : de quoi négocier, ou renoncer." },
    { ill: <IllVerifier />, n: "3", t: "Quoi vérifier sur place", s: "Le contrôle à faire en deux minutes, avant de signer." },
  ];
  return (
    <section id="pannes" className="bg-ink text-white px-4 sm:px-6 py-20 sm:py-24">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-12">
        <div className="flex flex-col gap-3.5 max-w-[760px]">
          <span className="text-xs font-semibold text-accentsoft uppercase tracking-[1.8px]">Fonctionnalité exclusive</span>
          <h2 className="m-0 text-[32px] sm:text-[42px] leading-[1.08] font-bold">Les pannes du modèle, leur coût et quoi vérifier.</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((c) => (
            <div key={c.n} className="bg-white/[0.04] border border-white/10 rounded-[22px] p-4 flex flex-col gap-5">
              {c.ill}
              <div className="flex gap-4 items-start px-2 pb-2">
                <span className="display text-[30px] font-bold text-accent leading-none w-7 shrink-0">{c.n}</span>
                <div className="flex flex-col gap-1.5"><span className="text-lg font-semibold">{c.t}</span><span className="text-sm text-muteddark leading-relaxed">{c.s}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Aperçu volontairement partiel de la liste : deux blocs, quelques points, le reste dans le rapport. */
export function VerifierSection() {
  const sides = [
    { key: "vendeur", label: "Vendeur", title: "Côté vendeur", sub: "Les papiers à fournir avant de payer.", color: "#FBBF24", tint: "rgba(251,191,36,0.08)", edge: "rgba(251,191,36,0.35)", items: ["Carte grise au nom du vendeur", "Certificat de non-gage récent", "Contrôle technique de moins de 6 mois"], more: "et les documents propres à votre véhicule" },
    { key: "acheteur", label: "Acheteur", title: "Côté acheteur", sub: "Les questions à poser et les contrôles à faire.", color: "#60A5FA", tint: "rgba(96,165,250,0.08)", edge: "rgba(96,165,250,0.35)", items: ["Les factures d'entretien, de la première à la dernière", "Démarrage à froid, sans bruit ni fumée", "Les essais propres à sa boîte et à son moteur"], more: "et une quinzaine de points adaptés à votre véhicule" },
  ];
  return (
    <section id="verifier" className="bg-ink text-white px-4 sm:px-6 py-20 sm:py-24 border-t border-white/10">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10">
        <div className="flex flex-col gap-3.5 max-w-[760px]">
          <h2 className="m-0 text-[32px] sm:text-[42px] leading-[1.08] font-bold">Les points à vérifier, différents pour chaque véhicule.</h2>
          <p className="m-0 text-base text-muteddark leading-relaxed max-w-[62ch]">Une électrique ne se contrôle pas comme un diesel. Le rapport donne la liste faite pour le véhicule de la plaque, à cocher pendant la visite.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sides.map((sd) => (
            <div key={sd.key} className="rounded-[22px] overflow-hidden flex flex-col" style={{ border: `1px solid ${sd.edge}`, background: "rgba(255,255,255,0.03)" }}>
              <div className="flex items-center gap-3 px-6 py-5" style={{ background: sd.tint, borderBottom: `1px solid ${sd.edge}` }}>
                <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ color: sd.color, border: `1px solid ${sd.edge}`, background: sd.tint }}>
                  {sd.key === "vendeur"
                    ? <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
                    : <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>}
                </span>
                <div className="flex flex-col"><span className="text-[11px] font-bold tracking-[1.6px] uppercase" style={{ color: sd.color }}>{sd.label}</span><span className="text-[18px] font-bold leading-tight">{sd.title}</span></div>
              </div>
              <div className="flex flex-col gap-3.5 p-6">
                <p className="m-0 text-[13px] text-muteddark">{sd.sub}</p>
                <ul className="m-0 p-0 list-none flex flex-col gap-3">
                  {sd.items.map((it) => (
                    <li key={it} className="flex gap-3 items-center text-[15px]"><span aria-hidden="true" className="w-[16px] h-[16px] rounded-[5px] border shrink-0" style={{ borderColor: sd.edge }} />{it}</li>
                  ))}
                  {[0, 1].map((k) => (
                    <li key={k} aria-hidden="true" className="flex gap-3 items-center select-none" style={{ filter: "blur(4px)", opacity: 0.55 }}><span className="w-[16px] h-[16px] rounded-[5px] border shrink-0" style={{ borderColor: sd.edge }} /><span className="h-3 rounded-full bg-white/30" style={{ width: k ? "52%" : "70%" }} /></li>
                  ))}
                </ul>
                <span className="text-[13px] font-semibold" style={{ color: sd.color }}>…{sd.more}, dans le rapport.</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const Pic = ({ d }: { d: string }) => (
  <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: d }} />
);
const P = {
  belt: '<circle cx="7" cy="12" r="4"/><circle cx="17" cy="12" r="3"/><path d="M7 8l10 1M7 16l10-1"/>',
  oil: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  brake: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3"/>',
  tyre: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>',
  coolant: '<path d="M9 3h6M10 3v6l-4 9a2 2 0 0 0 2 3h8a2 2 0 0 0 2-3l-4-9V3"/><path d="M7.5 15h9"/>',
  ct: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  euro: '<path d="M17 6.5A7 7 0 1 0 17 17.5"/><path d="M4 10h9M4 14h9"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
};

export function EntretienSection() {
  const steps = [
    { when: "Maintenant", cost: "≈ 900 €", tone: "#F87171", items: [{ i: P.belt, t: "Courroie de distribution" }] },
    { when: "Dans 12 mois", cost: "≈ 1 950 €", tone: "#60A5FA", items: [{ i: P.oil, t: "Vidange, filtres, liquide de frein" }, { i: P.tyre, t: "Pneus et amortisseurs" }, { i: P.ct, t: "Vidange de boîte, contrôle technique" }] },
    { when: "Dans 24 mois", cost: "≈ 500 €", tone: "#60A5FA", items: [{ i: P.brake, t: "Plaquettes et disques" }] },
    { when: "Dans 36 mois", cost: "≈ 100 €", tone: "#60A5FA", items: [{ i: P.coolant, t: "Liquide de refroidissement" }] },
  ];
  const perks = [
    { i: P.cal, t: "Une échéance précise", s: "« Dans 2 000 km » ou « en mars 2027 » : ce qui arrive en premier." },
    { i: P.euro, t: "Un coût pour chaque intervention", s: "Estimé en garage indépendant, pour prévoir le budget avant d'acheter." },
    { i: P.bell, t: "Les rappels constructeur", s: "Les campagnes de rappel du modèle, à vérifier en concession." },
  ];
  return (
    <section id="entretien" className="px-4 sm:px-6 py-20 sm:py-24 bg-white border-b border-line">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-11">
        <div className="flex flex-col gap-3.5 max-w-[680px]">
          <h2 className="m-0 text-[32px] sm:text-[42px] leading-[1.08] font-bold">Ce qu&apos;il faudra prévoir après l&apos;achat.</h2>
          <p className="m-0 text-base text-[#4B5563] leading-relaxed">Chaque intervention à venir, quand la faire, et ce qu&apos;elle va coûter.</p>
        </div>

        <div className="rounded-[24px] bg-ink text-white p-6 sm:p-8 flex flex-col gap-6 relative overflow-hidden" style={{ boxShadow: "0 0 0 1px rgba(59,130,246,0.15), 0 30px 70px rgba(10,30,63,0.25)" }}>
          <div className="flex justify-between items-center gap-3 flex-wrap">
            <span className="display text-[17px] font-bold">Peugeot 3008 1.5 BlueHDi · 118 000 km</span>
            <span className="text-[11px] font-semibold text-accentsoft uppercase tracking-wider">Exemple</span>
          </div>
          <div className="relative">
            <div aria-hidden="true" className="hidden md:block absolute left-[12.5%] right-[12.5%] top-[15px] h-[2px]" style={{ background: "linear-gradient(90deg, #F87171, #3B82F6 30%, rgba(59,130,246,0.3))" }} />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {steps.map((st) => (
                <div key={st.when} className="flex flex-col gap-3">
                  <div className="flex md:flex-col items-center gap-3 md:gap-2">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "#070F1F", border: `2px solid ${st.tone}`, boxShadow: `0 0 14px ${st.tone}` }}><span className="w-2 h-2 rounded-full" style={{ background: st.tone }} /></span>
                    <span className="text-[14px] font-bold">{st.when}</span>
                  </div>
                  <div className="rounded-2xl p-4 flex flex-col gap-3 flex-1 bg-white/[0.04] border border-white/10">
                    <span className="display text-[24px] font-bold">{st.cost}</span>
                    <ul className="m-0 p-0 list-none flex flex-col gap-2">
                      {st.items.map((it) => <li key={it.t} className="flex items-center gap-2.5 text-[13px] text-[#C8D0DC]"><span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-accentsoft bg-accent/10"><Pic d={it.i} /></span>{it.t}</li>)}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {perks.map((p) => (
            <div key={p.t} className="bg-ground rounded-[20px] p-6 flex flex-col gap-3 items-start">
              <span className="w-12 h-12 rounded-2xl bg-navy text-white flex items-center justify-center"><Pic d={p.i} /></span>
              <span className="display text-lg font-bold">{p.t}</span>
              <span className="text-sm text-[#4B5563] leading-relaxed">{p.s}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
