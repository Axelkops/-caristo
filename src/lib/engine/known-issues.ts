import { GENERIC_ISSUES, ISSUE_FAMILIES, type IssueFamily } from "../data/known-issues";
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

  const year = vehicle.firstRegistration ? Number(vehicle.firstRegistration.slice(0, 4)) : undefined;
  const titles = new Set<string>();
  const matched = ISSUE_FAMILIES.map((fam) => ({ fam, how: familyMatches(fam, vehicle, hay, make, year) })).filter((m) => m.how);
  // un moteur reconnu par son nom ou son code l'emporte sur un moteur de même cylindrée reconnu par la cylindrée seule
  const named = matched.some((m) => m.how === "keyword" && m.fam.cc);
  for (const { fam, how } of matched) {
    if (named && how === "cc") continue;
    for (const issue of fam.issues) {
      if (issue.gearbox && vehicle.gearbox !== "inconnue" && vehicle.gearbox !== issue.gearbox) continue;
      const t = norm(issue.title);
      if (seen.has(issue.id) || titles.has(t)) continue;
      seen.add(issue.id);
      titles.add(t);
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

/** Mots qui, placés après le nom d'un modèle, désignent un autre modèle (C3 Aircross n'est pas une C3). */
const OTHER_MODEL = /^(aircross|picasso|cactus|cross|crossback|crossland|spacetourer|plus|max|grand|sportsvan|c-max|s-max|x\b|xr\b|e-tech electri|electric|courier|connect|van\b|l\b)/;

/** Le véhicule correspond-il à un des modèles de la fiche ? « 208 » ne doit pas désigner une 2008, ni « c3 » une C3 Aircross. */
export function modelMatches(vehicleModel: string, models: string[]): boolean {
  const m0 = norm(vehicleModel).replace(/\s+/g, " ").trim();
  return models.some((m1) => {
    const m = norm(m1).trim();
    if (m0 === m) return true;
    if (!m0.startsWith(m + " ")) return false;
    return !OTHER_MODEL.test(m0.slice(m.length + 1));
  });
}

/** Règles de correspondance d'une fiche (voir src/lib/data/known-issues.ts). */
export function familyMatches(fam: IssueFamily, vehicle: Vehicle, hay: string, make: string, year: number | undefined): false | "keyword" | "cc" | "model" {
  if (fam.makes.length && !fam.makes.some((m) => make.includes(norm(m)))) return false;
  if (fam.fuel && !fam.fuel.includes(vehicle.fuel)) return false;
  if (fam.years && year !== undefined && ((fam.years.from !== undefined && year < fam.years.from) || (fam.years.to !== undefined && year > fam.years.to))) return false;
  if (fam.gearbox && vehicle.gearbox !== "inconnue" && vehicle.gearbox !== fam.gearbox) return false;
  if (fam.models?.length && !modelMatches(vehicle.model, fam.models)) return false;
  const kwOk = fam.keywords.some((k) => hay.includes(norm(k)));
  const cc = vehicle.displacementCc;
  const ccOk = !!fam.cc && !!cc && cc >= fam.cc[0] - 4 && cc <= fam.cc[1] + 4;
  const hpOk = !fam.powerHp || !vehicle.powerHp || (vehicle.powerHp >= fam.powerHp[0] - 1 && vehicle.powerHp <= fam.powerHp[1] + 1);
  if (kwOk && hpOk) return "keyword";
  if (ccOk && hpOk) return "cc";
  // une fiche « modèle » (sans mot-clé ni cylindrée) est identifiée par le modèle seul
  if (fam.models?.length && fam.keywords.length === 0 && !fam.cc) return "model";
  return false;
}
