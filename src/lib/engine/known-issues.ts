import { GENERIC_ISSUES, ISSUE_FAMILIES } from "../data/known-issues";
import type { KnownIssue, Vehicle } from "./types";

function norm(s: string | undefined): string {
  return (s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function vehicleAgeYears(vehicle: Vehicle, now = new Date()): number {
  if (!vehicle.firstRegistration) return 0;
  const d = new Date(vehicle.firstRegistration);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.max(0, (now.getTime() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

/** Retourne les pannes connues pour ce véhicule, classées par gravité puis par pertinence. */
export function findKnownIssues(vehicle: Vehicle, mileage: number | undefined, now = new Date()): KnownIssue[] {
  const hay = norm(`${vehicle.make} ${vehicle.model} ${vehicle.version ?? ""} ${vehicle.engineCode ?? ""} ${vehicle.bodyType ?? ""}`);
  const make = norm(vehicle.make);
  const age = vehicleAgeYears(vehicle, now);
  const km = mileage ?? 0;
  const out: KnownIssue[] = [];
  const seen = new Set<string>();

  for (const fam of ISSUE_FAMILIES) {
    const makeOk = fam.makes.length === 0 || fam.makes.some((m) => make.includes(norm(m)));
    const fuelOk = !fam.fuel || fam.fuel.includes(vehicle.fuel);
    const kwOk = fam.keywords.some((k) => hay.includes(norm(k)));
    const year = vehicle.firstRegistration ? Number(vehicle.firstRegistration.slice(0, 4)) : undefined;
    const yearOk = !fam.years || year === undefined || ((fam.years.from === undefined || year >= fam.years.from) && (fam.years.to === undefined || year <= fam.years.to));
    if (!(makeOk && fuelOk && kwOk && yearOk)) continue;
    for (const issue of fam.issues) {
      if (seen.has(issue.id)) continue;
      seen.add(issue.id);
      out.push(withZone(issue, km, age));
    }
  }

  for (const g of GENERIC_ISSUES) {
    if (g.fuel && !g.fuel.includes(vehicle.fuel)) continue;
    if (g.minKm && km < g.minKm) continue;
    if (g.minYears && age < g.minYears) continue;
    // ne pas doublonner un thème déjà couvert par une fiche précise
    const theme = g.issue.title.toLowerCase().split(" ")[0];
    if (out.some((o) => o.title.toLowerCase().startsWith(theme))) continue;
    if (seen.has(g.issue.id)) continue;
    seen.add(g.issue.id);
    out.push(withZone(g.issue, km, age));
  }

  const rank = { high: 0, medium: 1, low: 2, info: 3 };
  return out.sort((a, b) => {
    if (a.inZone !== b.inZone) return a.inZone ? -1 : 1;
    return rank[a.severity] - rank[b.severity];
  });
}

function withZone(issue: Omit<KnownIssue, "applies" | "inZone">, km: number, age: number): KnownIssue {
  const kmZone = issue.fromKm !== undefined ? km >= issue.fromKm : false;
  const ageZone = issue.fromYears !== undefined ? age >= issue.fromYears : false;
  const noThreshold = issue.fromKm === undefined && issue.fromYears === undefined;
  return { ...issue, applies: true, inZone: noThreshold ? issue.severity !== "info" : kmZone || ageZone };
}
