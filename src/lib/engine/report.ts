import { buildChecklist } from "./checklist";
import type { KnownIssue, ListingAnalysis, OfficialHistory, Recall, ReportData, SellerQuestion, Vehicle } from "./types";
import { findKnownIssues, vehicleAgeYears } from "./known-issues";
import { buildMaintenanceSchedule, fmtDate, fmtKm } from "./maintenance";
import { estimateValuation } from "./valuation";

export interface ReportInputs {
  id: string;
  reference: string;
  vehicle: Vehicle;
  mileage?: number;
  history: OfficialHistory;
  recalls: Recall[];
  listing: ListingAnalysis;
  entries?: { label: string; date: string; mileage?: number }[];
  valuationOverride?: ReportData["valuation"];
  now?: Date;
}

/** Vérifie la cohérence du kilométrage : recul entre relevés, écart avec le kilométrage saisi. */
export function checkMileage(history: OfficialHistory, mileage: number | undefined, vehicle: Vehicle, now = new Date()): ReportData["mileageCheck"] {
  const r = [...history.mileageReadings].sort((a, b) => a.date.localeCompare(b.date));
  if (r.length === 0) {
    return { consistent: null, comment: mileage ? `Kilométrage saisi : ${fmtKm(mileage)}. Aucun relevé officiel disponible pour le comparer.` : "Aucun relevé officiel disponible." };
  }
  let rollback = false;
  for (let i = 1; i < r.length; i++) if (r[i].mileage < r[i - 1].mileage) rollback = true;
  const last = r[r.length - 1];
  const months = Math.max(1, (now.getTime() - new Date(last.date).getTime()) / (30.44 * 24 * 3600 * 1000));
  const annual = r.length >= 2 ? Math.round(((last.mileage - r[0].mileage) / Math.max(1, (new Date(last.date).getTime() - new Date(r[0].date).getTime()) / (30.44 * 24 * 3600 * 1000))) * 12) : undefined;
  if (rollback) return { consistent: false, annualKm: annual, comment: "Le kilométrage a reculé entre deux relevés officiels. C'est le signe d'un compteur modifié : à éclaircir avec le vendeur avant toute décision." };
  if (mileage !== undefined) {
    if (mileage < last.mileage) return { consistent: false, annualKm: annual, comment: `Le kilométrage saisi (${fmtKm(mileage)}) est inférieur au dernier relevé officiel (${fmtKm(last.mileage)} le ${fmtDate(last.date)}). Compteur à vérifier.` };
    const expectedMax = last.mileage + ((annual ?? 20000) / 12) * months * 2.5 + 5000;
    if (mileage > expectedMax) return { consistent: true, annualKm: annual, comment: `Le kilométrage saisi (${fmtKm(mileage)}) est très supérieur au dernier relevé (${fmtKm(last.mileage)} le ${fmtDate(last.date)}). Usage intensif récent, à confirmer.` };
    return { consistent: true, annualKm: annual, comment: `Progression régulière${annual ? `, environ ${annual.toLocaleString("fr-FR")} km par an` : ""}. Le kilométrage saisi (${fmtKm(mileage)}) est cohérent avec le dernier relevé (${fmtKm(last.mileage)} le ${fmtDate(last.date)}).` };
  }
  return { consistent: true, annualKm: annual, comment: `Progression régulière${annual ? `, environ ${annual.toLocaleString("fr-FR")} km par an` : ""}. Dernier relevé : ${fmtKm(last.mileage)} le ${fmtDate(last.date)}.` };
}

export function computeScore(args: { history: OfficialHistory; mileageCheck: ReportData["mileageCheck"]; knownIssues: KnownIssue[]; recalls: Recall[]; valuation?: ReportData["valuation"]; listing: ListingAnalysis; vehicle: Vehicle }): { score: ReportData["score"]; percent: number; label: string; reasons: string[] } {
  let points = 0;
  const reasons: string[] = [];
  const h = args.history;
  if (h.available) {
    if (h.stolen) { points += 100; reasons.push("Véhicule déclaré volé."); }
    if (h.pledge) { points += 40; reasons.push("Un gage est inscrit : la vente peut être bloquée."); }
    if (h.opposition) { points += 40; reasons.push("Une opposition est inscrite : la vente est bloquée."); }
    if (h.damagedProcedure) { points += 35; reasons.push("Procédure « véhicule endommagé » enregistrée."); }
    if (h.claims.length > 0) { points += 15 * Math.min(3, h.claims.length); reasons.push(`${h.claims.length} sinistre${h.claims.length > 1 ? "s" : ""} expertisé${h.claims.length > 1 ? "s" : ""}.`); }
    const counterVisits = h.inspections.filter((i) => i.result === "defavorable" || i.result === "contre_visite").length;
    if (counterVisits >= 2) { points += 10; reasons.push(`${counterVisits} contrôles techniques défavorables.`); }
  } else {
    points += 15;
    reasons.push("Historique officiel non disponible : une partie des vérifications manque.");
  }
  if (args.mileageCheck.consistent === false) { points += 50; reasons.push("Kilométrage incohérent."); }
  const highInZone = args.knownIssues.filter((i) => i.severity === "high" && i.inZone);
  if (highInZone.length) { points += 20; reasons.push(`${highInZone.length} point${highInZone.length > 1 ? "s" : ""} à vérifier en priorité (${highInZone.map((i) => i.title.toLowerCase()).join(", ")}).`); }
  const openRecalls = args.recalls.filter((r) => r.status === "open");
  if (openRecalls.length) { points += 10; reasons.push(`${openRecalls.length} rappel${openRecalls.length > 1 ? "s" : ""} constructeur ouvert${openRecalls.length > 1 ? "s" : ""}.`); }
  if (args.valuation?.verdict === "au_dessus") { points += 5; reasons.push("Prix demandé au-dessus de la cote."); }
  const warn = args.listing.claims.filter((c) => c.status === "warning").length;
  if (warn) { points += 5 * warn; reasons.push("L'annonce contient des affirmations à vérifier."); }
  if (args.vehicle.imported) { points += 5; reasons.push("Véhicule importé : les premières années ne sont pas couvertes par l'historique français."); }

  const score: ReportData["score"] = points >= 60 ? "E" : points >= 40 ? "D" : points >= 25 ? "C" : points >= 10 ? "B" : "A";
  const labels: Record<ReportData["score"], string> = { A: "Risque très faible", B: "Risque faible", C: "Risque modéré", D: "Risque élevé", E: "À éviter sans vérification approfondie" };
  if (reasons.length === 0) reasons.push("Aucune alerte dans les données disponibles.");
  // indice de confiance : 100 % sans aucune alerte, chaque alerte retire des points
  const percent = Math.max(0, Math.min(100, 100 - points));
  return { score, percent, label: labels[score], reasons };
}

export function buildQuestions(args: { history: OfficialHistory; knownIssues: KnownIssue[]; maintenance: ReturnType<typeof buildMaintenanceSchedule>; valuation?: ReportData["valuation"]; listing: ListingAnalysis; vehicle: Vehicle; mileageCheck: ReportData["mileageCheck"] }): SellerQuestion[] {
  const q: SellerQuestion[] = [];
  let p = 1;
  if (args.mileageCheck.consistent === false) q.push({ priority: p++, text: "Pourquoi le kilométrage ne correspond-il pas aux relevés officiels ? Demander les factures d'entretien avec le kilométrage." });
  for (const i of args.knownIssues.filter((i) => i.severity === "high" && i.inZone).slice(0, 2)) {
    q.push({ priority: p++, text: `${i.title} : ${i.whatToCheck}${i.costMin ? ` Sans preuve, prévoir ${i.costMin} – ${i.costMax} € et négocier d'autant.` : ""}` });
  }
  for (const m of args.maintenance.items.filter((m) => m.status === "todo" && m.horizon === "now").slice(0, 2)) {
    if (!q.some((x) => x.text.toLowerCase().includes(m.label.toLowerCase()))) q.push({ priority: p++, text: `${m.label} : a-t-elle été faite ? Demander la facture.` });
  }
  if (args.vehicle.imported) q.push({ priority: p++, text: "Le véhicule a été immatriculé à l'étranger avant la France. Demander le carnet d'entretien de cette période, le quitus fiscal et le certificat de conformité." });
  const cv = args.history.inspections.filter((i) => i.result === "defavorable" || i.result === "contre_visite");
  if (cv.length) q.push({ priority: p++, text: `Contrôle technique défavorable le ${fmtDate(cv[cv.length - 1].date)} : quelle réparation a été faite ? Facture ?` });
  if (args.valuation?.verdict === "au_dessus" && args.valuation.deltaToHigh) q.push({ priority: p++, text: `Le prix est ${args.valuation.deltaToHigh.toLocaleString("fr-FR")} € au-dessus de la cote : qu'est-ce qui le justifie (options, pneus neufs, révision récente) ?` });
  for (const c of args.listing.claims.filter((c) => c.status === "warning")) {
    const text = c.detail ?? c.text;
    const dup = q.some((x) => x.text.toLowerCase().includes("au-dessus de la cote") && text.toLowerCase().includes("au-dessus de la cote"));
    if (!dup) q.push({ priority: p++, text });
  }
  if (!args.history.available) q.push({ priority: p++, text: "L'historique officiel n'a pas pu être consulté : demander le dernier procès-verbal de contrôle technique et le certificat de situation administrative." });
  if (q.length === 0) q.push({ priority: 1, text: "Demander le carnet d'entretien et les dernières factures : rien d'anormal dans les données, reste à confirmer l'état réel." });
  return q.slice(0, 8);
}

export function buildReport(input: ReportInputs): ReportData {
  const now = input.now ?? new Date();
  const { vehicle, history } = input;
  const mileage = input.mileage ?? history.mileageReadings.at(-1)?.mileage;
  const knownIssues = findKnownIssues(vehicle, mileage, now);
  const mileageCheck = checkMileage(history, input.mileage, vehicle, now);
  const valuation = input.valuationOverride ?? estimateValuation(vehicle, mileage, input.listing.askingPrice, now);
  const maintenance = buildMaintenanceSchedule({ vehicle, mileage, history, knownIssues, entries: input.entries, now });
  const sc = computeScore({ history, mileageCheck, knownIssues, recalls: input.recalls, valuation, listing: input.listing, vehicle });
  const questions = buildQuestions({ history, knownIssues, maintenance, valuation, listing: input.listing, vehicle, mileageCheck });
  const checklist = buildChecklist({ vehicle, mileage, history, knownIssues, recalls: input.recalls, now });

  const sources: ReportData["sources"] = [
    { label: "Fiche technique", status: "ok" },
    { label: "Historique officiel (contrôles techniques, kilométrage, sinistres, situation administrative)", status: history.available ? "ok" : "none", detail: history.available ? undefined : history.reason },
    { label: "Rappels constructeur", status: "ok", detail: input.recalls.length ? `${input.recalls.length} rappel(s) trouvé(s)` : "Aucun rappel trouvé" },
    { label: "Pannes connues du modèle", status: knownIssues.length ? "ok" : "partial", detail: `${knownIssues.length} point(s)` },
    { label: "Cote du marché", status: "ok", detail: "estimation" },
    { label: "Annonce", status: input.listing.available ? "ok" : "none", detail: input.listing.available ? undefined : "Aucun lien d'annonce fourni" },
  ];

  const limits = [
    "Les pannes connues sont des faiblesses fréquentes du modèle, pas un diagnostic de ce véhicule : à contrôler sur place.",
    "L'historique officiel ne contient qu'un relevé de kilométrage par contrôle technique : rien entre deux visites.",
    "La cote est une estimation : l'état réel, les options et la région font varier le prix.",
    "Une réparation payée sans assureur ne figure dans aucune base.",
  ];
  if (vehicle.imported) limits.push(`Les données avant l'entrée en France${vehicle.firstRegistrationInCountry ? ` (${fmtDate(vehicle.firstRegistrationInCountry)})` : ""} ne sont pas couvertes.`);
  if (vehicleAgeYears(vehicle, now) < 4 && history.available && history.inspections.length === 0) limits.push("Véhicule de moins de 4 ans : aucun contrôle technique n'est encore obligatoire.");

  return {
    id: input.id,
    reference: input.reference,
    issuedAt: now.toISOString(),
    vehicle,
    mileage,
    score: sc.score,
    scorePercent: sc.percent,
    scoreLabel: sc.label,
    scoreReasons: sc.reasons,
    history,
    mileageCheck,
    recalls: input.recalls,
    knownIssues,
    valuation,
    maintenance,
    listing: input.listing,
    questions,
    checklist,
    sources,
    limits,
  };
}
