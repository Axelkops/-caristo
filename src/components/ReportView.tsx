import type { ReportData } from "@/lib/engine/types";
import { FUEL_LABEL, GEARBOX_LABEL, fmtDateFr } from "./VehicleCard";
import { fmtKm } from "@/lib/engine/maintenance";
import { ShareBox } from "./ShareBox";

/*
 * Rapport Caristo — « tableau de bord » : fond nuit, panneaux translucides, voyants LED.
 * Un seul élément fort : le cadran de risque en tête. Le reste est calme et lisible.
 */

const euros = (n?: number) => (n === undefined ? "" : `${n.toLocaleString("fr-FR")} €`);
const range = (a?: number, b?: number) => (a === undefined && b === undefined ? "" : a === b ? euros(a) : `${(a ?? 0).toLocaleString("fr-FR")} – ${(b ?? 0).toLocaleString("fr-FR")} €`);

type Tone = "ok" | "warn" | "bad" | "neutral" | "info";
const C: Record<Tone, string> = { ok: "#34D399", warn: "#FBBF24", bad: "#F87171", neutral: "#8E9AAF", info: "#60A5FA" };
const TINT: Record<Tone, string> = { ok: "rgba(52,211,153,0.10)", warn: "rgba(251,191,36,0.10)", bad: "rgba(248,113,113,0.12)", neutral: "rgba(142,154,175,0.08)", info: "rgba(96,165,250,0.10)" };
const EDGE: Record<Tone, string> = { ok: "rgba(52,211,153,0.35)", warn: "rgba(251,191,36,0.35)", bad: "rgba(248,113,113,0.4)", neutral: "rgba(142,154,175,0.25)", info: "rgba(96,165,250,0.35)" };
const INSET = { background: "rgba(7,15,31,0.55)", border: "1px solid rgba(147,197,253,0.12)" } as const;

/** Voyant LED : point lumineux coloré. */
const Led = ({ tone, size = 10 }: { tone: Tone; size?: number }) => (
  <span aria-hidden="true" className="inline-block rounded-full shrink-0" style={{ width: size, height: size, background: C[tone], boxShadow: tone === "neutral" ? "none" : `0 0 ${size * 1.4}px ${C[tone]}` }} />
);
const Tag = ({ tone, children }: { tone: Tone; children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-full whitespace-nowrap" style={{ background: TINT[tone], color: C[tone], border: `1px solid ${EDGE[tone]}` }}><Led tone={tone} size={7} />{children}</span>
);

/** Panneau de section : rail LED à gauche, titre Manrope, fond translucide. */
function Panel({ id, title, sub, tone = "info", badge, children, paper = false }: { id: string; title: string; sub?: string; tone?: Tone; badge?: React.ReactNode; children: React.ReactNode; paper?: boolean }) {
  return (
    <section id={id} className={`relative rounded-[22px] overflow-hidden scroll-mt-6 ${paper ? "bg-white text-fg" : "text-[#E5E9F0]"}`} style={paper ? undefined : { background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.02))", border: "1px solid rgba(147,197,253,0.12)" }}>
      <span aria-hidden="true" className="absolute left-0 top-7 bottom-7 w-[3px] rounded-r" style={{ background: C[tone], boxShadow: `0 0 14px ${C[tone]}` }} />
      <div className="p-6 sm:p-8 pl-8 sm:pl-10 flex flex-col gap-6">
        <header className="flex justify-between items-start gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5 min-w-0 max-w-[62ch]">
            <h2 className="m-0 text-[24px] font-bold leading-tight">{title}</h2>
            {sub && <p className={`m-0 text-[14px] leading-relaxed ${paper ? "text-muted" : "text-[#8E9AAF]"}`}>{sub}</p>}
          </div>
          {badge}
        </header>
        {children}
      </div>
    </section>
  );
}

/** Cadran de confiance : demi-anneau dégradé rouge → vert, repère lumineux fondu dans l'arc, pourcentage au centre. */
function Gauge({ percent, tone }: { percent: number; tone: Tone }) {
  const cx = 100, cy = 96, R = 78;
  const pt = (deg: number, r: number) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
  const ang = -180 + (180 * Math.max(2, Math.min(98, percent))) / 100;
  const [mx, my] = pt(ang, R);
  const [x0, y0] = pt(-180, R), [x1, y1] = pt(0, R);
  const [ex, ey] = pt(ang, R);
  return (
    <svg viewBox="0 0 200 110" width="200" height="110" aria-label={`Indice de confiance ${percent} %`} className="max-w-full h-auto">
      <defs>
        <linearGradient id="gauge-grad" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#F87171" /><stop offset="0.5" stopColor="#FBBF24" /><stop offset="1" stopColor="#34D399" /></linearGradient>
        <radialGradient id="gauge-glow"><stop offset="0" stopColor={C[tone]} stopOpacity="0.9" /><stop offset="1" stopColor={C[tone]} stopOpacity="0" /></radialGradient>
      </defs>
      <path d={`M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1}`} stroke="url(#gauge-grad)" strokeWidth="10" strokeLinecap="round" fill="none" opacity="0.22" />
      <path d={`M${x0} ${y0} A${R} ${R} 0 0 1 ${ex} ${ey}`} stroke="url(#gauge-grad)" strokeWidth="10" strokeLinecap="round" fill="none" />
      <circle cx={mx} cy={my} r="16" fill="url(#gauge-glow)" />
      <circle cx={mx} cy={my} r="6" fill="#fff" />
      <text x={cx} y={cy - 2} textAnchor="middle" fontSize="36" fontWeight="700" fill="#F3F6FA" fontFamily="Manrope, Inter, sans-serif">{percent}<tspan fontSize="18" fill="#AEB6C4"> %</tspan></text>
      <text x={x0 - 2} y={cy + 14} textAnchor="middle" fontSize="10" fontWeight="600" fill="#5B6779" fontFamily="Inter, sans-serif">0</text>
      <text x={x1 + 2} y={cy + 14} textAnchor="middle" fontSize="10" fontWeight="600" fill="#5B6779" fontFamily="Inter, sans-serif">100</text>
    </svg>
  );
}

/** Plaque d'immatriculation française. */
const Plate = ({ value }: { value: string }) => (
  <span className="inline-flex items-stretch rounded-md overflow-hidden border border-[#C9D3E3]" style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.4)" }} aria-label={`Immatriculation ${value}`}>
    <span className="bg-[#0B3BB0] text-white text-[10px] font-bold px-1.5 flex flex-col items-center justify-end pb-1 leading-none"><span className="text-[#FFD400] text-[8px] tracking-[1px] mb-1.5">✶✶✶</span>F</span>
    <span className="bg-[#F5F7FA] text-[#111318] display font-bold text-[22px] tracking-[3px] px-3 py-1.5">{value}</span>
  </span>
);

export function ReportView({ report, reportId, shareToken, readonly = false, pack }: { report: ReportData; reportId: string; shareToken?: string; readonly?: boolean; pack?: { code: string; remaining: number; expiresAt: string } }) {
  const r = report;
  const v = r.vehicle;
  const h = r.history;
  const issued = new Date(r.issuedAt);
  const readings = [...h.mileageReadings].sort((a, b) => a.date.localeCompare(b.date));
  const maxKm = Math.max(1, ...readings.map((x) => x.mileage));
  const inZoneHigh = r.knownIssues.filter((i) => i.severity === "high" && i.inZone);
  const inZone = r.knownIssues.filter((i) => i.inZone);
  const scoreTone: Tone = r.score <= "B" ? "ok" : r.score === "C" ? "warn" : "bad";
  const openRecalls = r.recalls.filter((x) => x.status === "open");

  const lights: { label: string; value: string; tone: Tone; sub?: string }[] = [
    { label: "Kilométrage", value: r.mileageCheck.consistent === false ? "Incohérent" : r.mileageCheck.consistent ? "Cohérent" : "Non vérifiable", tone: r.mileageCheck.consistent === false ? "bad" : r.mileageCheck.consistent ? "ok" : "neutral", sub: readings.length ? `${readings.length} relevés officiels` : r.mileage ? `${fmtKm(r.mileage)} saisis` : undefined },
    { label: "Gage, opposition, vol", value: !h.available ? "Non vérifié" : h.stolen ? "Déclaré volé" : h.opposition ? "Opposition" : h.pledge ? "Gage inscrit" : "Rien à signaler", tone: !h.available ? "neutral" : h.stolen || h.opposition ? "bad" : h.pledge ? "warn" : "ok" },
    { label: "Sinistres", value: !h.available ? "Non vérifié" : h.claims.length || h.damagedProcedure ? `${h.claims.length || 1} enregistré(s)` : "Aucun enregistré", tone: !h.available ? "neutral" : h.claims.length || h.damagedProcedure ? "warn" : "ok" },
    { label: "Pannes connues", value: inZoneHigh.length ? `${inZoneHigh.length} à vérifier en priorité` : inZone.length ? `${inZone.length} points à contrôler` : "Rien de notable", tone: inZoneHigh.length ? "bad" : inZone.length ? "warn" : "ok" },
    { label: "Origine", value: v.imported ? "Importé" : v.country === "FR" ? "France depuis l'origine" : `Immatriculé : ${v.country}`, tone: v.imported ? "warn" : "ok", sub: v.imported && v.firstRegistrationInCountry ? `En France depuis ${fmtDateFr(v.firstRegistrationInCountry)}` : undefined },
    { label: "Prix et cote", value: r.valuation?.verdict === "au_dessus" ? `${euros(r.valuation.deltaToHigh)} au-dessus` : r.valuation?.verdict === "sous_la_cote" ? "Sous la cote" : r.valuation?.verdict === "dans_la_cote" ? "Dans la cote" : range(r.valuation?.low, r.valuation?.high), tone: r.valuation?.verdict === "au_dessus" ? "warn" : r.valuation?.verdict ? "ok" : "info", sub: r.valuation?.askingPrice ? `Annonce : ${euros(r.valuation.askingPrice)}` : "Cote estimée" },
  ];

  const nav = [["apercu", "Vue d'ensemble"], ["pannes", "Pannes connues"], ["echeancier", "Entretien"], ["historique", "Historique"], ["rappels", "Rappels"], ["cote", "Cote et prix"]];
  const specs = [FUEL_LABEL[v.fuel], GEARBOX_LABEL[v.gearbox], v.powerHp ? `${v.powerHp} ch` : "", v.firstRegistration ? `Mise en circulation ${fmtDateFr(v.firstRegistration)}` : "", r.mileage !== undefined ? fmtKm(r.mileage) : "", v.critAir ? `Crit'Air ${v.critAir}` : ""].filter(Boolean);

  return (
    <div className="flex flex-col text-[#E5E9F0]" style={{ background: "radial-gradient(1200px 500px at 20% -10%, rgba(37,99,235,0.28), transparent 60%), radial-gradient(900px 400px at 100% 10%, rgba(59,130,246,0.12), transparent 60%), #070F1F" }}>
      {/* ===== Tableau de bord ===== */}
      <section className="px-4 sm:px-6 pt-10 pb-8">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div className="flex flex-col gap-5 min-w-0">
              <span className="text-[13px] text-[#8E9AAF]">Rapport {r.reference}, établi le {issued.toLocaleDateString("fr-FR")}</span>
              <div className="flex flex-col gap-2">
                <h1 className="m-0 text-[36px] sm:text-[52px] leading-[1.02] font-bold">{v.make} {v.model}</h1>
                {v.version && <span className="text-[17px] text-[#AEB6C4]">{v.version}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {v.plate && <Plate value={v.plate} />}
                {v.vin && <span className="text-[12px] text-[#8E9AAF] tracking-[1.5px]">VIN {v.vin}</span>}
              </div>
              <ul className="m-0 p-0 list-none flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-[#C8D0DC]">{specs.map((c) => <li key={c} className="flex items-center gap-2"><Led tone="info" size={6} />{c}</li>)}</ul>
            </div>
            <div className="justify-self-center lg:justify-self-end rounded-[24px] px-6 pt-5 pb-5 flex flex-col items-center gap-1 w-full max-w-[280px]" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))", border: "1px solid rgba(147,197,253,0.14)", boxShadow: "0 24px 60px rgba(0,0,0,0.45)" }}>
              <span className="text-[12px] text-[#8E9AAF]">Indice de confiance</span>
              <Gauge percent={r.scorePercent} tone={scoreTone} />
              <span className="text-[16px] font-bold leading-tight text-center" style={{ color: C[scoreTone] }}>{r.scoreLabel}</span>
              <span className="text-[12px] text-[#8E9AAF] text-center leading-snug max-w-[28ch]">{r.scoreReasons[0]}</span>
            </div>
          </div>

          {/* Voyants */}
          <div id="apercu" className="scroll-mt-6 flex flex-col gap-4">
            <h2 className="m-0 text-[15px] font-semibold text-[#8E9AAF]">Vue d&apos;ensemble</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
              {lights.map((l) => (
                <div key={l.label} className="rounded-2xl p-4 flex flex-col gap-3 min-h-[118px]" style={{ background: TINT[l.tone], border: `1px solid ${EDGE[l.tone]}` }}>
                  <div className="flex items-center justify-between gap-2"><span className="text-[12px] text-[#AEB6C4] leading-tight">{l.label}</span><Led tone={l.tone} /></div>
                  <span className="text-[16px] font-bold leading-tight" style={{ color: l.tone === "neutral" ? "#C8D0DC" : C[l.tone] }}>{l.value}</span>
                  {l.sub && <span className="text-[12px] text-[#8E9AAF] -mt-1.5">{l.sub}</span>}
                </div>
              ))}
            </div>
            {r.scoreReasons.length > 1 && <ul className="m-0 pl-5 text-[14px] text-[#AEB6C4] flex flex-col gap-1">{r.scoreReasons.slice(1).map((x) => <li key={x}>{x}</li>)}</ul>}
          </div>

          <nav className="flex gap-1.5 overflow-x-auto pb-1 no-print -mx-1 px-1 border-t border-white/10 pt-5" aria-label="Sommaire du rapport">
            {nav.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="shrink-0 text-[13px] font-medium text-[#C8D0DC] hover:text-white hover:bg-white/10 px-3.5 py-2 rounded-full no-underline flex items-center gap-2">{label}{id === "pannes" && inZoneHigh.length > 0 && <Led tone="bad" size={7} />}</a>
            ))}
          </nav>
        </div>
      </section>

      <div className="px-4 sm:px-6 pb-14">
        <div className="max-w-[1200px] mx-auto flex flex-col gap-6">

          {/* ===== Pannes connues ===== */}
          <Panel id="pannes" title="Pannes connues du modèle" sub="Faiblesses fréquentes sur ce modèle, pas un diagnostic de ce véhicule : à contrôler sur place." tone={inZoneHigh.length ? "bad" : inZone.length ? "warn" : "ok"} badge={<Tag tone={inZoneHigh.length ? "bad" : inZone.length ? "warn" : "ok"}>{inZoneHigh.length ? `${inZoneHigh.length} à vérifier en priorité` : `${r.knownIssues.length} points`}</Tag>}>
            {r.knownIssues.length === 0 ? <p className="m-0 text-[15px] text-[#AEB6C4]">Aucune faiblesse particulière répertoriée pour ce modèle.</p> : (
              <div className="flex flex-col divide-y divide-white/10 rounded-2xl overflow-hidden" style={INSET}>
                {r.knownIssues.map((i) => {
                  const tone: Tone = i.severity === "high" && i.inZone ? "bad" : i.inZone ? "warn" : i.severity === "info" ? "info" : "neutral";
                  const span = i.peakKm ? i.peakKm * 1.3 : undefined;
                  const pct = span && r.mileage ? Math.min(100, Math.round((r.mileage / span) * 100)) : undefined;
                  return (
                    <details key={i.id} className="group">
                      <summary className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03]">
                        <Led tone={tone} />
                        <span className="flex-1 font-semibold text-[15px] leading-snug">{i.title}</span>
                        <span className="hidden sm:inline text-[12px] text-[#8E9AAF] whitespace-nowrap">{tone === "bad" ? "Priorité" : tone === "warn" ? "Fréquent à ce stade" : tone === "info" ? "Bon à savoir" : "Pas encore concerné"}</span>
                        <span className="hidden sm:inline text-[13px] text-[#C8D0DC] whitespace-nowrap min-w-[90px] text-right">{i.costMin || i.costMax ? range(i.costMin, i.costMax) : "Sans frais"}</span>
                        <svg aria-hidden="true" className="chev transition-transform shrink-0 text-[#8E9AAF]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                      </summary>
                      <div className="px-5 pb-5 pl-[52px] flex flex-col gap-3.5">
                        {pct !== undefined && i.fromKm !== undefined && span && (
                          <div className="flex flex-col gap-1.5 max-w-[520px]">
                            <div className="relative h-1.5 rounded-full bg-white/10">
                              <div className="absolute h-full rounded-full" style={{ left: `${Math.round((i.fromKm / span) * 100)}%`, width: `${Math.round(((i.peakKm! - i.fromKm) / span) * 100)}%`, background: C[tone], boxShadow: `0 0 10px ${C[tone]}` }} />
                              <div className="absolute -top-[5px] w-[3px] h-4 rounded bg-white" style={{ left: `${pct}%` }} title="Ce véhicule" />
                            </div>
                            <div className="flex justify-between text-[11px] text-[#8E9AAF]"><span>Dès {fmtKm(i.fromKm)}</span><span className="text-[#E5E9F0] font-semibold">Ce véhicule : {fmtKm(r.mileage!)}</span><span>Pic {fmtKm(i.peakKm!)}</span></div>
                          </div>
                        )}
                        <p className="m-0 text-[14px] leading-relaxed text-[#C8D0DC] max-w-[75ch]">{i.description}</p>
                        <span className="sm:hidden text-[13px] text-[#AEB6C4]">{i.costMin || i.costMax ? <>Réparation : <strong className="text-[#E5E9F0]">{range(i.costMin, i.costMax)}</strong></> : "Vérification sans frais"}</span>
                        <div className="rounded-xl px-4 py-3 leading-relaxed text-[13px] max-w-[75ch]" style={{ background: "rgba(96,165,250,0.08)", border: "1px solid rgba(96,165,250,0.2)" }}><span className="text-[#93C5FD] font-semibold">Quoi vérifier</span><span className="text-[#C8D0DC]"> — {i.whatToCheck}</span></div>
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </Panel>

          {/* ===== Entretien ===== */}
          <Panel id="echeancier" title="Entretien à prévoir" sub={`Préconisations constructeur, kilométrage et âge. Rythme estimé : ${r.maintenance.annualKm.toLocaleString("fr-FR")} km par an.`} tone="info">
            <div className="relative">
              <div aria-hidden="true" className="hidden lg:block absolute left-[12.5%] right-[12.5%] top-[13px] h-[2px]" style={{ background: "linear-gradient(90deg, #3B82F6, rgba(59,130,246,0.25))" }} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {r.maintenance.horizons.map((hz) => {
                  const its = r.maintenance.items.filter((m) => m.horizon === hz.key);
                  const urgent = hz.key === "now" && its.some((m) => m.status === "todo");
                  const tone: Tone = urgent ? "bad" : its.length ? (hz.key === "now" ? "warn" : "info") : "ok";
                  return (
                    <div key={hz.key} className="flex flex-col items-stretch gap-3">
                      <div className="flex flex-col items-center gap-2">
                        <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: "#070F1F", border: `2px solid ${C[tone]}`, boxShadow: `0 0 12px ${C[tone]}` }}><Led tone={tone} size={8} /></span>
                        <span className="text-[14px] font-bold">{hz.key === "now" ? "Maintenant" : `Dans ${hz.key} mois`}</span>
                        {hz.key !== "now" && <span className="text-[12px] text-[#8E9AAF] -mt-1.5">≈ {fmtKm(hz.projectedKm)}</span>}
                      </div>
                      <div className="rounded-2xl p-4 flex flex-col gap-2.5 flex-1" style={{ background: INSET.background, border: `1px solid ${EDGE[tone]}` }}>
                        <span className="display text-[22px] font-bold" style={{ color: its.length ? "#E5E9F0" : C.ok }}>{its.length ? `≈ ${range(hz.costMin, hz.costMax)}` : hz.key === "now" ? "Rien d'urgent" : "Rien de prévu"}</span>
                        {its.length > 0 && <ul className="m-0 p-0 list-none flex flex-col gap-1.5 text-[13px] text-[#C8D0DC]">{its.map((m) => <li key={m.label} className="flex items-center gap-2"><Led tone={m.status === "todo" ? "bad" : m.status === "check" ? "warn" : "ok"} size={7} />{m.label}</li>)}</ul>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <details className="group">
              <summary className="text-[14px] font-semibold text-[#93C5FD] flex items-center gap-2 w-fit">Voir le détail par intervention <svg aria-hidden="true" className="chev transition-transform" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg></summary>
              <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse text-[14px] min-w-[640px]">
                  <thead><tr className="text-left text-[#8E9AAF] text-[12px]">{["Intervention", "Préconisation", "Prochaine échéance", "Coût estimé"].map((t) => <th key={t} className="px-3 py-2.5 border-b border-white/10 font-semibold">{t}</th>)}</tr></thead>
                  <tbody>{r.maintenance.items.map((m) => (
                    <tr key={m.label}><td className="px-3 py-3 border-b border-white/5 font-semibold">{m.label}</td><td className="px-3 py-3 border-b border-white/5 text-[#AEB6C4]">{m.rule}</td><td className="px-3 py-3 border-b border-white/5">{m.horizon === "now" ? "Maintenant" : [m.dueKm ? fmtKm(m.dueKm) : "", m.dueDate ? fmtDateFr(m.dueDate) : ""].filter(Boolean).join(", ") || "—"}</td><td className="px-3 py-3 border-b border-white/5 text-[#AEB6C4]">{range(m.costMin, m.costMax)}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            </details>
            <p className="m-0 text-[13px] text-[#8E9AAF] max-w-[80ch]">{r.maintenance.note}</p>
          </Panel>

          {/* ===== Historique officiel ===== */}
          <Panel id="historique" title="Historique officiel" sub="Contrôles techniques, kilométrages relevés, sinistres, situation administrative, propriétaires." tone={h.available ? "ok" : "neutral"} badge={<Tag tone={h.available ? "ok" : "neutral"}>{h.available ? `Consulté le ${h.retrievedAt ? new Date(h.retrievedAt).toLocaleDateString("fr-FR") : ""}` : "Non disponible"}</Tag>}>
            {!h.available ? (
              <div className="rounded-2xl p-5 flex flex-col gap-1.5 text-[14px] text-[#AEB6C4] max-w-[80ch]" style={{ background: INSET.background, border: "1px solid rgba(142,154,175,0.2)" }}>
                <span className="font-semibold text-[#E5E9F0]">{h.reason}</span>
                <span>Le reste du rapport est produit avec la fiche technique, la base Caristo, la cote et l&apos;annonce. Demandez au vendeur le dernier procès-verbal de contrôle technique et le certificat de situation administrative.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {([["Gage", h.pledge ? "Inscrit" : "Aucun", h.pledge ? "warn" : "ok"], ["Opposition", h.opposition ? "Inscrite" : "Aucune", h.opposition ? "bad" : "ok"], ["Déclaration de vol", h.stolen ? "Oui" : "Non", h.stolen ? "bad" : "ok"], ["Propriétaires en France", String(h.ownersCount ?? "—"), "neutral"]] as [string, string, Tone][]).map(([l, val, t]) => (
                    <div key={l} className="rounded-xl p-3.5 flex flex-col gap-1.5" style={{ background: TINT[t], border: `1px solid ${EDGE[t]}` }}><div className="flex justify-between items-center"><span className="text-[12px] text-[#AEB6C4]">{l}</span><Led tone={t} size={8} /></div><span className="font-bold" style={{ color: t === "neutral" ? "#E5E9F0" : C[t] }}>{val}</span></div>
                  ))}
                </div>
                {readings.length > 0 && (
                  <div className="flex flex-wrap gap-6 items-end">
                    <div className="flex-[1_1_320px] min-w-0 flex flex-col gap-2">
                      <span className="text-[12px] text-[#AEB6C4]">Kilométrage relevé aux contrôles techniques</span>
                      <div className="flex items-end gap-3 h-36">{readings.map((x, i) => <div key={x.date + i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end min-w-0"><span className="text-[12px] font-semibold">{x.mileage.toLocaleString("fr-FR")}</span><div className="w-full rounded-t-md" style={{ height: `${Math.max(6, (x.mileage / maxKm) * 90)}%`, background: i === readings.length - 1 ? "#3B82F6" : "rgba(147,197,253,0.25)", boxShadow: i === readings.length - 1 ? "0 0 16px rgba(59,130,246,0.6)" : undefined }} /></div>)}</div>
                      <div className="flex justify-between text-[12px] text-[#8E9AAF]">{readings.map((x, i) => <span key={i}>{x.date.slice(5, 7)}/{x.date.slice(0, 4)}</span>)}</div>
                    </div>
                    <div className="flex-[1_1_240px] rounded-2xl p-4 text-[14px] leading-relaxed" style={{ background: TINT[r.mileageCheck.consistent === false ? "bad" : "ok"], border: `1px solid ${EDGE[r.mileageCheck.consistent === false ? "bad" : "ok"]}`, color: C[r.mileageCheck.consistent === false ? "bad" : "ok"] }}>{r.mileageCheck.comment}</div>
                  </div>
                )}
                {(() => { const t: Tone = h.claims.length || h.damagedProcedure ? "warn" : "ok"; return (
                  <div className="rounded-2xl p-4 flex gap-3.5 items-start" style={{ background: TINT[t], border: `1px solid ${EDGE[t]}` }}>
                    <Led tone={t} />
                    <div className="flex flex-col gap-1 text-[14px]">
                      <span className="font-bold" style={{ color: C[t] }}>{t === "warn" ? "Sinistres enregistrés" : "Aucun sinistre expertisé ni procédure « véhicule endommagé »"}</span>
                      {h.damagedProcedure && <span>Procédure « véhicule endommagé » enregistrée.</span>}
                      {h.claims.map((c, i) => <span key={i}><strong>{fmtDateFr(c.date)}</strong>, {c.kind}{c.description ? ` : ${c.description}` : ""}</span>)}
                      <span className="text-[12px] text-[#AEB6C4]">Une réparation payée sans assureur ne figure dans aucune base.</span>
                    </div>
                  </div>
                ); })()}
                {h.inspections.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-[14px] min-w-[560px]">
                      <thead><tr className="text-left text-[#8E9AAF] text-[12px]">{["Contrôle technique", "Type", "Kilométrage", "Résultat", "Défaillances"].map((t) => <th key={t} className="px-3 py-2.5 border-b border-white/10 font-semibold">{t}</th>)}</tr></thead>
                      <tbody>{[...h.inspections].sort((a, b) => b.date.localeCompare(a.date)).map((i, k) => (
                        <tr key={k}><td className="px-3 py-3 border-b border-white/5 font-semibold">{fmtDateFr(i.date)}</td><td className="px-3 py-3 border-b border-white/5">{{ periodique: "Périodique", contre_visite: "Contre-visite", import: "Entrée en France", autre: "Autre" }[i.kind]}</td><td className="px-3 py-3 border-b border-white/5">{i.mileage ? fmtKm(i.mileage) : "—"}</td><td className="px-3 py-3 border-b border-white/5"><Tag tone={i.result === "favorable" ? "ok" : i.result === "inconnu" ? "neutral" : "warn"}>{{ favorable: "Favorable", defavorable: "Défavorable", contre_visite: "Contre-visite", inconnu: "—" }[i.result]}</Tag></td><td className="px-3 py-3 border-b border-white/5 text-[#AEB6C4]">{i.defects ?? "—"}</td></tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                <div className="rounded-2xl p-4 flex gap-3.5 items-start text-[14px]" style={{ background: TINT[v.imported ? "warn" : "neutral"], border: `1px solid ${EDGE[v.imported ? "warn" : "neutral"]}` }}>
                  <Led tone={v.imported ? "warn" : "ok"} />
                  <span>{v.imported ? <>Première immatriculation à l&apos;étranger le <strong>{fmtDateFr(v.firstRegistration)}</strong>{v.firstRegistrationInCountry ? <>, entrée en France le <strong>{fmtDateFr(v.firstRegistrationInCountry)}</strong></> : null}. La période à l&apos;étranger n&apos;est pas couverte : demandez le carnet d&apos;entretien et les documents d&apos;import.</> : <>Immatriculé en France depuis l&apos;origine ({fmtDateFr(v.firstRegistration) || "date inconnue"}).</>}</span>
                </div>
              </div>
            )}
          </Panel>

          {/* ===== Rappels ===== */}
          <Panel id="rappels" title="Rappels constructeur" tone={openRecalls.length ? "warn" : "ok"} badge={<Tag tone={openRecalls.length ? "warn" : "ok"}>{openRecalls.length ? `${openRecalls.length} à faire` : r.recalls.length ? `${r.recalls.length} trouvés` : "Aucun rappel trouvé"}</Tag>}>
            {r.recalls.length ? <ul className="m-0 p-0 list-none flex flex-col gap-2.5">{r.recalls.map((x, i) => <li key={i} className="flex justify-between gap-3 items-start rounded-xl px-4 py-3" style={INSET}><div className="flex flex-col gap-0.5"><span className="font-semibold">{x.title}</span>{x.description && <span className="text-[13px] text-[#AEB6C4]">{x.description}</span>}<span className="text-[12px] text-[#8E9AAF]">{fmtDateFr(x.date)}{x.reference ? `, ${x.reference}` : ""}</span></div><Tag tone={x.status === "done" ? "ok" : x.status === "open" ? "warn" : "neutral"}>{x.status === "done" ? "Fait" : x.status === "open" ? "À faire" : "À vérifier"}</Tag></li>)}</ul> : <p className="m-0 text-[15px] text-[#AEB6C4]">Aucun rappel constructeur trouvé pour ce modèle.</p>}
            <p className="m-0 text-[13px] text-[#8E9AAF]">Un rappel est gratuit en concession. Vérifiez avec le VIN qu&apos;il a bien été fait.</p>
          </Panel>

          {/* ===== Cote ===== */}
          {r.valuation && (
            <Panel id="cote" title="Cote et prix" tone={r.valuation.verdict === "au_dessus" ? "warn" : "info"} badge={<Tag tone={r.valuation.verdict === "au_dessus" ? "warn" : r.valuation.verdict ? "ok" : "info"}>{r.valuation.verdict === "au_dessus" ? "Au-dessus de la cote" : r.valuation.verdict === "sous_la_cote" ? "Sous la cote" : r.valuation.verdict === "dans_la_cote" ? "Dans la cote" : "Estimation"}</Tag>}>
              <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 items-center">
                <div className="flex flex-col gap-7">
                  <span className="display text-[40px] sm:text-[48px] font-bold leading-none">{range(r.valuation.low, r.valuation.high)}</span>
                  <div className="relative pt-7 pb-8">
                    {/* bornes de la fourchette */}
                    <span className="absolute top-0 -translate-x-1/2 text-[12px] font-semibold text-[#93C5FD]" style={{ left: "28%" }}>{euros(r.valuation.low)}</span>
                    <span className="absolute top-0 -translate-x-1/2 text-[12px] font-semibold text-[#93C5FD]" style={{ left: "72%" }}>{euros(r.valuation.high)}</span>
                    {/* échelle */}
                    <div className="relative h-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                      <div className="absolute h-full rounded-full" style={{ left: "28%", width: "44%", background: "linear-gradient(90deg, #2563EB, #60A5FA)" }} />
                      {[28, 72].map((x) => <span key={x} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white" style={{ left: `${x}%`, boxShadow: "0 0 0 3px #070F1F" }} />)}
                      <span className="absolute -top-2 -translate-x-1/2 w-[2px] h-6 rounded" style={{ left: "50%", background: "rgba(255,255,255,0.55)" }} />
                      {r.valuation.askingPrice && <span className="absolute -top-3 -translate-x-1/2 w-[3px] h-8 rounded" style={{ left: `${Math.min(97, Math.max(3, 28 + ((r.valuation.askingPrice - r.valuation.low) / Math.max(1, r.valuation.high - r.valuation.low)) * 44))}%`, background: C.warn }} title="Prix demandé" />}
                    </div>
                    <span className="absolute bottom-0 -translate-x-1/2 text-[12px] text-[#AEB6C4] whitespace-nowrap" style={{ left: "50%" }}>Cote moyenne {euros(r.valuation.mid)}</span>
                    <span className="absolute bottom-0 left-0 text-[11px] text-[#5B6779]">{euros(Math.round(r.valuation.low * 0.9))}</span>
                    <span className="absolute bottom-0 right-0 text-[11px] text-[#5B6779]">{euros(Math.round(r.valuation.high * 1.1))}</span>
                  </div>
                </div>
                <div className="text-[15px] leading-relaxed text-[#C8D0DC] max-w-[50ch]">
                  {r.valuation.askingPrice ? <p className="m-0">Prix demandé : <strong className="text-white">{euros(r.valuation.askingPrice)}</strong>, {r.valuation.verdict === "au_dessus" ? `soit ${euros(r.valuation.deltaToHigh)} au-dessus du haut de la fourchette. Marge de négociation plausible.` : r.valuation.verdict === "sous_la_cote" ? "sous la fourchette : vérifier pourquoi (état, sinistre, urgence)." : "dans la fourchette."}</p> : null}
                  <p className="mt-2 mb-0 text-[13px] text-[#8E9AAF]">{r.valuation.basis}</p>
                </div>
              </div>
            </Panel>
          )}

          {/* ===== Annonce ===== */}
          {r.listing.available && <Panel id="annonce" title="Annonce" tone={r.listing.available ? (r.listing.claims.some((c) => c.status === "warning") ? "warn" : "ok") : "neutral"} badge={<Tag tone={r.listing.available ? (r.listing.claims.some((c) => c.status === "warning") ? "warn" : "ok") : "neutral"}>{r.listing.available ? "Lue automatiquement" : "Aucune annonce"}</Tag>}>
            {r.listing.claims.length ? <ul className="m-0 p-0 list-none grid grid-cols-1 md:grid-cols-2 gap-2.5">{r.listing.claims.map((c, i) => { const t: Tone = c.status === "warning" ? "warn" : c.status === "missing" ? "neutral" : "ok"; return <li key={i} className="rounded-xl px-4 py-3 flex gap-3 items-start" style={{ background: TINT[t], border: `1px solid ${EDGE[t]}` }}><span className="mt-1.5"><Led tone={t} size={8} /></span><div className="flex flex-col gap-0.5"><span className="font-semibold" style={{ color: t === "neutral" ? "#E5E9F0" : C[t] }}>{c.text}</span>{c.detail && <span className="text-[13px] text-[#AEB6C4]">{c.detail}</span>}</div></li>; })}</ul> : <p className="m-0 text-[15px] text-[#AEB6C4] max-w-[70ch]">Aucun lien d&apos;annonce fourni. Avec le lien, Caristo compare prix et kilométrage annoncés aux données réelles.</p>}
            {r.listing.url && <a href={r.listing.url} target="_blank" rel="noopener noreferrer" className="text-[14px] text-[#93C5FD] break-all">{r.listing.url}</a>}
          </Panel>}

          <p className="m-0 text-[12px] text-[#5B6779] max-w-[90ch] px-2">Ce rapport restitue les données enregistrées sur ce véhicule à la date d&apos;émission. Les pannes connues sont des faiblesses fréquentes du modèle, pas un diagnostic de ce véhicule. La cote est une estimation. Il ne constitue ni une expertise ni une garantie sur l&apos;état mécanique du véhicule.</p>

          {!readonly && pack && (
            <div className="rounded-2xl px-6 py-5 flex flex-wrap gap-3 items-center justify-between no-print" style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.35)" }} data-testid="pack-box">
              <div className="flex flex-col gap-1"><span className="font-bold">Votre pack</span><span className="text-[13px] text-[#AEB6C4]">{pack.remaining} rapport{pack.remaining > 1 ? "s" : ""} restant{pack.remaining > 1 ? "s" : ""}, valable jusqu&apos;au {new Date(pack.expiresAt).toLocaleDateString("fr-FR")}. Saisissez ce code lors de votre prochain rapport.</span></div>
              <span className="display text-2xl font-bold tracking-[3px] select-all bg-white/10 px-4 py-2 rounded-xl" data-testid="pack-code">{pack.code}</span>
            </div>
          )}
          {!readonly && shareToken && <ShareBox reportId={reportId} shareToken={shareToken} reference={r.reference} />}
        </div>
      </div>
    </div>
  );
}
