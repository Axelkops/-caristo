import type { Fuel, KnownIssue, MaintenanceItem, MaintenanceSchedule, OfficialHistory, Vehicle } from "./types";
import { vehicleAgeYears } from "./known-issues";

interface Rule {
  label: string;
  rule: string;
  everyKm?: number;
  everyMonths?: number;
  fuels?: Fuel[];
  costMin: number;
  costMax: number;
  /** mots-clés pour reconnaître une facture du carnet */
  keywords: string[];
}

const RULES: Rule[] = [
  { label: "Vidange huile + filtres", rule: "15 000 km ou 1 an", everyKm: 15000, everyMonths: 12, fuels: ["diesel", "essence", "hybride", "hybride_rechargeable", "gpl", "autre"], costMin: 150, costMax: 300, keywords: ["vidange", "révision", "revision", "huile"] },
  { label: "Filtre habitacle", rule: "30 000 km ou 2 ans", everyKm: 30000, everyMonths: 24, costMin: 40, costMax: 90, keywords: ["habitacle", "pollen"] },
  { label: "Liquide de frein", rule: "2 ans", everyMonths: 24, costMin: 60, costMax: 120, keywords: ["liquide de frein", "purge"] },
  { label: "Plaquettes avant", rule: "Selon usure, ≈ 50 000 km", everyKm: 50000, costMin: 120, costMax: 250, keywords: ["plaquettes av", "plaquettes avant", "freins avant"] },
  { label: "Plaquettes et disques arrière", rule: "Selon usure, ≈ 70 000 km", everyKm: 70000, costMin: 200, costMax: 400, keywords: ["plaquettes ar", "plaquettes arrière", "disques ar", "freins arrière"] },
  { label: "Pneus", rule: "Selon usure, ≈ 40 000 km", everyKm: 40000, costMin: 300, costMax: 700, keywords: ["pneu"] },
  { label: "Courroie de distribution", rule: "120 000 km ou 6 ans", everyKm: 120000, everyMonths: 72, fuels: ["diesel", "essence", "hybride", "hybride_rechargeable", "gpl"], costMin: 600, costMax: 1200, keywords: ["distribution", "courroie"] },
  { label: "Courroie d'accessoires", rule: "90 000 km", everyKm: 90000, fuels: ["diesel", "essence", "hybride", "gpl"], costMin: 120, costMax: 250, keywords: ["accessoire"] },
  { label: "Vidange boîte automatique", rule: "60 000 km", everyKm: 60000, costMin: 250, costMax: 450, keywords: ["boîte", "boite", "bva", "dsg", "eat"] },
  { label: "Liquide de refroidissement", rule: "5 ans", everyMonths: 60, fuels: ["diesel", "essence", "hybride", "hybride_rechargeable", "gpl"], costMin: 80, costMax: 160, keywords: ["refroidissement"] },
  { label: "Bougies d'allumage", rule: "60 000 km", everyKm: 60000, fuels: ["essence", "hybride", "hybride_rechargeable", "gpl"], costMin: 100, costMax: 250, keywords: ["bougie"] },
  { label: "Amortisseurs", rule: "≈ 120 000 km", everyKm: 120000, costMin: 400, costMax: 900, keywords: ["amortisseur"] },
  { label: "Batterie 12 V", rule: "5 à 7 ans", everyMonths: 72, costMin: 100, costMax: 250, keywords: ["batterie 12", "batterie"] },
  { label: "Contrôle technique", rule: "2 ans (4 ans pour le 1er)", everyMonths: 24, costMin: 75, costMax: 95, keywords: ["contrôle technique", "controle technique"] },
];

export interface MaintenanceInput {
  vehicle: Vehicle;
  mileage?: number;
  history: OfficialHistory;
  knownIssues: KnownIssue[];
  /** factures du carnet : libellé, date, km */
  entries?: { label: string; date: string; mileage?: number }[];
  now?: Date;
}

function monthsBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / (30.44 * 24 * 3600 * 1000);
}

/** Estime le rythme annuel à partir des relevés officiels, sinon de l'âge et du kilométrage. */
export function estimateAnnualKm(vehicle: Vehicle, mileage: number | undefined, history: OfficialHistory, now = new Date()): number {
  const r = [...history.mileageReadings].sort((a, b) => a.date.localeCompare(b.date));
  if (r.length >= 2) {
    const first = r[0], last = r[r.length - 1];
    const months = monthsBetween(new Date(first.date), new Date(last.date));
    if (months >= 6 && last.mileage > first.mileage) return Math.round(((last.mileage - first.mileage) / months) * 12);
  }
  const age = vehicleAgeYears(vehicle, now);
  if (mileage && age >= 0.5) return Math.round(mileage / age);
  return 15000;
}

const MONTHS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
export function fmtMonthYear(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : `${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`;
}
function fmtMonths(m: number): string {
  if (m < 1) return "moins d'un mois";
  if (m < 23) return `${Math.round(m)} mois`;
  const y = Math.round(m / 12);
  return `${y} an${y > 1 ? "s" : ""}`;
}

/** Échéance en clair : ce qui arrive en premier (kilométrage ou date), puis la précision absolue. */
export function describeWhen(a: { status: MaintenanceItem["status"]; beltDue?: boolean; dueKm?: number; dueDate?: string; kmToDue?: number; monthsToDate?: number; monthsByKm?: number; unknown: boolean }): { when: string; whenDetail?: string } {
  if (a.beltDue) return { when: "Maintenant", whenDetail: "Sans facture, à faire dès l'achat" };
  if (a.status === "todo") {
    const over = a.kmToDue !== undefined && a.kmToDue < 0 ? `dépassée de ${fmtKm(-a.kmToDue)}` : a.monthsToDate !== undefined && a.monthsToDate < 0 ? `dépassée de ${fmtMonths(-a.monthsToDate)}` : undefined;
    return { when: "Maintenant", whenDetail: over ? `Échéance ${over}` : "Échéance atteinte" };
  }
  const noInvoice = a.unknown ? " · sans facture, à confirmer" : "";
  const byKm = a.kmToDue !== undefined && a.monthsByKm !== undefined && (a.monthsToDate === undefined || a.monthsByKm <= a.monthsToDate);
  if (byKm && a.dueKm !== undefined) return { when: `Dans ${fmtKm(a.kmToDue!)}`, whenDetail: `Vers ${fmtKm(a.dueKm)}${a.dueDate ? `, au plus tard ${fmtMonthYear(a.dueDate)}` : ""}${noInvoice}` };
  if (a.dueDate && a.monthsToDate !== undefined) return { when: `Dans ${fmtMonths(a.monthsToDate)}`, whenDetail: `${fmtMonthYear(a.dueDate).replace(/^./, (c) => c.toUpperCase())}${a.dueKm !== undefined ? `, ou vers ${fmtKm(a.dueKm)}` : ""}${noInvoice}` };
  if (a.status === "check") return { when: "À vérifier", whenDetail: "Aucune facture : demander au vendeur si c'est fait" };
  return { when: "À planifier" };
}

export function buildMaintenanceSchedule(input: MaintenanceInput): MaintenanceSchedule {
  const now = input.now ?? new Date();
  const { vehicle, history } = input;
  const km = input.mileage ?? history.mileageReadings.at(-1)?.mileage ?? 0;
  const annualKm = Math.max(3000, estimateAnnualKm(vehicle, input.mileage, history, now));
  const age = vehicleAgeYears(vehicle, now);
  const isEv = vehicle.fuel === "electrique";
  const entries = input.entries ?? [];
  const lastInspection = [...history.inspections].sort((a, b) => a.date.localeCompare(b.date)).at(-1);

  const items: MaintenanceItem[] = [];
  for (const rule of RULES) {
    if (rule.fuels && !rule.fuels.includes(vehicle.fuel)) continue;
    if (isEv && ["Courroie d'accessoires", "Bougies d'allumage", "Vidange boîte automatique"].includes(rule.label)) continue;
    if (rule.label === "Vidange boîte automatique" && vehicle.gearbox !== "automatique") continue;

    // dernière fois connue
    let last: { date?: string; mileage?: number; label: string } | undefined;
    const match = entries
      .filter((e) => rule.keywords.some((k) => e.label.toLowerCase().includes(k)))
      .sort((a, b) => a.date.localeCompare(b.date))
      .at(-1);
    if (match) last = { date: match.date, mileage: match.mileage, label: `${fmtDate(match.date)}${match.mileage ? ` · ${fmtKm(match.mileage)}` : ""}` };
    if (rule.label === "Contrôle technique" && lastInspection) last = { date: lastInspection.date, mileage: lastInspection.mileage, label: fmtDate(lastInspection.date) };

    // prochaine échéance
    const unknown = !last && (rule.everyKm !== undefined || rule.everyMonths !== undefined);
    let dueKm: number | undefined;
    let dueDate: string | undefined;
    if (rule.everyKm) {
      // sans facture : on suppose l'entretien suivi et on vise le prochain multiple de l'intervalle
      dueKm = last ? (last.mileage ?? 0) + rule.everyKm : (Math.floor(km / rule.everyKm) + 1) * rule.everyKm;
    }
    if (rule.everyMonths) {
      const base = last?.date ? new Date(last.date) : vehicle.firstRegistration ? new Date(vehicle.firstRegistration) : now;
      const first = rule.label === "Contrôle technique" && !last ? 48 : rule.everyMonths;
      const d = new Date(base);
      d.setMonth(d.getMonth() + first);
      if (!last) while (d < now) d.setMonth(d.getMonth() + rule.everyMonths); // prochain passage à venir
      dueDate = d.toISOString().slice(0, 10);
    }
    const belt = rule.label === "Courroie de distribution" ? input.knownIssues.find((i) => i.title.toLowerCase().includes("courroie de distribution")) : undefined;
    const beltDue = !!belt && !last && ((belt.fromKm !== undefined && km >= belt.fromKm) || (belt.fromYears !== undefined && age >= belt.fromYears) || age >= 6 || km >= 120000);

    const monthsToDate = dueDate ? monthsBetween(now, new Date(dueDate)) : undefined;
    const kmToDue = dueKm !== undefined ? dueKm - km : undefined;
    const monthsByKm = kmToDue !== undefined ? (kmToDue / annualKm) * 12 : undefined;
    const monthsLeft = Math.min(monthsToDate ?? Infinity, monthsByKm ?? Infinity);

    let horizon: MaintenanceItem["horizon"];
    let status: MaintenanceItem["status"];
    if (beltDue) { horizon = "now"; status = "todo"; dueKm = undefined; dueDate = undefined; }
    else if (monthsLeft <= 0) { horizon = "now"; status = unknown ? "check" : "todo"; }
    else if (monthsLeft <= 12) { horizon = "12"; status = unknown ? "check" : "ok"; }
    else if (monthsLeft <= 24) { horizon = "24"; status = "ok"; }
    else if (monthsLeft <= 36) { horizon = "36"; status = "ok"; }
    else { horizon = "later"; status = "later"; }

    const { when, whenDetail } = describeWhen({ status, beltDue, dueKm, dueDate, kmToDue, monthsToDate, monthsByKm, unknown });
    items.push({ label: rule.label, rule: rule.rule, lastDoneLabel: last?.label ?? (unknown ? "Inconnu" : undefined), dueKm, dueDate, when, whenDetail, horizon, status, costMin: rule.costMin, costMax: rule.costMax });
  }

  const horizons = (["now", "12", "24", "36"] as const).map((key) => {
    const months = key === "now" ? 0 : Number(key);
    const its = items.filter((i) => i.horizon === key);
    return {
      key,
      projectedKm: Math.round(km + (annualKm * months) / 12),
      costMin: its.reduce((s, i) => s + (i.costMin ?? 0), 0),
      costMax: its.reduce((s, i) => s + (i.costMax ?? 0), 0),
      items: its.map((i) => i.label),
    };
  });

  return {
    annualKm,
    horizons,
    items,
    note: "Coûts indicatifs en garage indépendant. L'usage réel peut décaler les échéances.",
  };
}

/** Coût « environ » : milieu de la fourchette, arrondi (à 50 € au-delà de 100 €, à 10 € en dessous). */
export function approxCost(min?: number, max?: number): number | undefined {
  if (min === undefined && max === undefined) return undefined;
  const mid = ((min ?? max ?? 0) + (max ?? min ?? 0)) / 2;
  const step = mid >= 100 ? 50 : 10;
  return Math.round(mid / step) * step;
}

export function fmtKm(n: number): string {
  return `${n.toLocaleString("fr-FR")} km`;
}
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return d && m ? `${d}/${m}/${y}` : iso;
}
