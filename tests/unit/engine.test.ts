import { describe, expect, it } from "vitest";
import type { OfficialHistory, Vehicle } from "@/lib/engine/types";
import { findKnownIssues } from "@/lib/engine/known-issues";
import { buildMaintenanceSchedule, estimateAnnualKm } from "@/lib/engine/maintenance";
import { estimateValuation } from "@/lib/engine/valuation";
import { buildReport, checkMileage, computeScore } from "@/lib/engine/report";

const NOW = new Date("2026-11-04T10:00:00Z");
const p3008: Vehicle = { make: "Peugeot", model: "3008", version: "1.5 BlueHDi 130 Allure EAT8", country: "FR", firstRegistration: "2019-03-12", firstRegistrationInCountry: "2021-02-09", fuel: "diesel", gearbox: "automatique", powerHp: 131, category: "voiture", imported: true, plate: "AB-123-CD" };
const tesla: Vehicle = { make: "Tesla", model: "Model 3", version: "Long Range", country: "FR", firstRegistration: "2020-07-01", fuel: "electrique", gearbox: "automatique", powerHp: 351, category: "voiture" };
const emptyHistory: OfficialHistory = { available: false, reason: "test", inspections: [], mileageReadings: [], claims: [] };
const history: OfficialHistory = {
  available: true, ownersCount: 2, pledge: false, opposition: false, stolen: false, damagedProcedure: false, claims: [],
  inspections: [
    { date: "2021-03-09", kind: "import", mileage: 38410, result: "favorable" },
    { date: "2023-04-03", kind: "periodique", mileage: 84950, result: "defavorable", defects: "1 majeure" },
    { date: "2025-05-12", kind: "periodique", mileage: 112300, result: "favorable" },
  ],
  mileageReadings: [
    { date: "2021-03-09", mileage: 38410, source: "controle_technique" },
    { date: "2023-04-03", mileage: 84950, source: "controle_technique" },
    { date: "2025-05-12", mileage: 112300, source: "controle_technique" },
  ],
};

describe("pannes connues", () => {
  it("trouve la distribution du 1.5 BlueHDi et la met en zone à 118 000 km", () => {
    const issues = findKnownIssues(p3008, 118000, NOW);
    const belt = issues.find((i) => i.id === "dv5-belt");
    expect(belt).toBeDefined();
    expect(belt?.inZone).toBe(true);
    expect(issues[0].id).toBe("dv5-belt"); // priorité : haute gravité en zone
    expect(issues.some((i) => i.id === "eat-oil")).toBe(true); // boîte EAT8
  });
  it("ne met pas en zone une voiture neuve", () => {
    const issues = findKnownIssues({ ...p3008, firstRegistration: "2026-01-10", imported: false }, 8000, NOW);
    expect(issues.find((i) => i.id === "dv5-belt")?.inZone).toBe(false);
  });
  it("gère une électrique sans pannes diesel", () => {
    const issues = findKnownIssues(tesla, 60000, NOW);
    expect(issues.some((i) => i.id.includes("dpf") || i.id.includes("egr"))).toBe(false);
    expect(issues.some((i) => i.id === "tesla-susp")).toBe(true);
  });
  it("retombe sur les règles génériques pour un modèle inconnu", () => {
    const issues = findKnownIssues({ make: "Lada", model: "Niva", country: "FR", firstRegistration: "2012-01-01", fuel: "essence", gearbox: "manuelle", category: "voiture" }, 150000, NOW);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.id === "gen-clutch")).toBe(true);
  });
});

describe("kilométrage", () => {
  it("calcule le rythme annuel d'après les relevés", () => {
    const annual = estimateAnnualKm(p3008, 118000, history, NOW);
    expect(annual).toBeGreaterThan(15000);
    expect(annual).toBeLessThan(22000);
  });
  it("détecte un recul de compteur", () => {
    const h = { ...history, mileageReadings: [...history.mileageReadings, { date: "2026-01-01", mileage: 90000, source: "controle_technique" as const }] };
    expect(checkMileage(h, 95000, p3008, NOW).consistent).toBe(false);
  });
  it("détecte un kilométrage saisi inférieur au dernier relevé", () => {
    expect(checkMileage(history, 100000, p3008, NOW).consistent).toBe(false);
  });
  it("valide un kilométrage cohérent", () => {
    expect(checkMileage(history, 118000, p3008, NOW).consistent).toBe(true);
  });
});

describe("échéancier", () => {
  it("met la distribution « maintenant » sans facture et au-delà de 5 ans", () => {
    const issues = findKnownIssues(p3008, 118000, NOW);
    const s = buildMaintenanceSchedule({ vehicle: p3008, mileage: 118000, history, knownIssues: issues, now: NOW });
    const belt = s.items.find((i) => i.label === "Courroie de distribution");
    expect(belt?.horizon).toBe("now");
    expect(belt?.status).toBe("todo");
    expect(s.horizons.map((h) => h.key)).toEqual(["now", "12", "24", "36"]);
    expect(s.horizons[3].projectedKm).toBeGreaterThan(s.horizons[1].projectedKm);
  });
  it("prend en compte une facture du carnet", () => {
    const issues = findKnownIssues(p3008, 118000, NOW);
    const s = buildMaintenanceSchedule({ vehicle: p3008, mileage: 118000, history, knownIssues: issues, now: NOW, entries: [{ label: "Courroie de distribution + pompe à eau", date: "2026-02-01", mileage: 115000 }] });
    const belt = s.items.find((i) => i.label === "Courroie de distribution");
    expect(belt?.status).not.toBe("todo");
    expect(belt?.lastDoneLabel).toContain("01/02/2026");
  });
  it("n'inclut ni vidange ni bougies pour une électrique", () => {
    const s = buildMaintenanceSchedule({ vehicle: tesla, mileage: 60000, history: emptyHistory, knownIssues: [], now: NOW });
    expect(s.items.some((i) => i.label.startsWith("Vidange huile"))).toBe(false);
    expect(s.items.some((i) => i.label.startsWith("Bougies"))).toBe(false);
    expect(s.items.some((i) => i.label === "Contrôle technique")).toBe(true);
  });
});

describe("cote", () => {
  it("décote avec l'âge et le kilométrage", () => {
    const a = estimateValuation(p3008, 60000, undefined, NOW);
    const b = estimateValuation(p3008, 180000, undefined, NOW);
    expect(a.mid).toBeGreaterThan(b.mid);
    expect(a.low).toBeLessThan(a.high);
  });
  it("compare au prix demandé", () => {
    const v = estimateValuation(p3008, 118000, 40000, NOW);
    expect(v.verdict).toBe("au_dessus");
    expect(v.deltaToHigh).toBeGreaterThan(0);
  });
});

describe("rapport complet", () => {
  it("construit un rapport cohérent", () => {
    const r = buildReport({ id: "x", reference: "CAR-2026-TEST", vehicle: p3008, mileage: 118000, history, recalls: [], listing: { available: false, claims: [] }, now: NOW });
    expect(["A", "B", "C", "D", "E"]).toContain(r.score);
    expect(r.questions.length).toBeGreaterThan(0);
    expect(r.questions[0].text.toLowerCase()).toContain("courroie");
    expect(r.limits.some((l) => l.includes("entrée en France"))).toBe(true);
    expect(r.sources.find((s) => s.label.startsWith("Historique"))?.status).toBe("ok");
  });
  it("dégrade le score pour un véhicule volé ou gagé", () => {
    const stolen = computeScore({ history: { ...history, stolen: true }, mileageCheck: { consistent: true, comment: "" }, knownIssues: [], recalls: [], listing: { available: false, claims: [] }, vehicle: p3008 });
    expect(stolen.score).toBe("E");
    const pledged = computeScore({ history: { ...history, pledge: true }, mileageCheck: { consistent: true, comment: "" }, knownIssues: [], recalls: [], listing: { available: false, claims: [] }, vehicle: { ...p3008, imported: false } });
    expect(["D", "E"]).toContain(pledged.score);
  });
  it("reste utilisable sans historique officiel", () => {
    const r = buildReport({ id: "y", reference: "CAR-2026-NOH", vehicle: tesla, mileage: 60000, history: emptyHistory, recalls: [], listing: { available: false, claims: [] }, now: NOW });
    expect(r.history.available).toBe(false);
    expect(r.questions.some((q) => q.text.includes("historique officiel"))).toBe(true);
    expect(r.maintenance.items.length).toBeGreaterThan(0);
  });
});

import { checkMileage as checkMileage2 } from "@/lib/engine/report";
describe("kilométrage saisi arrondi", () => {
  const veh = { make: "T", model: "M", country: "FR", fuel: "diesel", gearbox: "manuelle", category: "voiture" } as const;
  const hist = { available: true, inspections: [], claims: [], mileageReadings: [{ date: "2023-03-12", mileage: 78424, source: "controle_technique" as const }, { date: "2025-03-12", mileage: 118215, source: "controle_technique" as const }] };
  it("accepte un écart d'arrondi sous le dernier relevé", () => {
    expect(checkMileage2(hist, 118000, veh, new Date("2026-11-06")).consistent).toBe(true);
  });
  it("signale un compteur nettement inférieur au dernier relevé", () => {
    expect(checkMileage2(hist, 110000, veh, new Date("2026-11-06")).consistent).toBe(false);
  });
});


import { parseCarteGrise } from "@/lib/services/reports";
describe("carte grise facultative", () => {
  it("accepte trois champs vides, refuse une saisie partielle", () => {
    expect(parseCarteGrise({})).toBeNull();
    expect(parseCarteGrise({ formulaNumber: " ", holderName: "", firstRegDate: "" })).toBeNull();
    expect(() => parseCarteGrise({ formulaNumber: "2021AB12345" })).toThrow(/trois informations/);
    expect(parseCarteGrise({ formulaNumber: "2021 ab 12345", holderName: "Dupont Jean", firstRegDate: "12/03/2019" })).toEqual({ formulaNumber: "2021AB12345", holderName: "Dupont Jean", firstRegDate: "2019-03-12" });
  });
  it("ne pénalise pas l'indice quand l'historique n'a pas été demandé", () => {
    const vehicle = { make: "T", model: "M", country: "FR", fuel: "essence", gearbox: "manuelle", category: "voiture" } as const;
    const base = { mileageCheck: { consistent: null, comment: "" }, knownIssues: [], recalls: [], listing: { available: false, claims: [] }, vehicle };
    const notReq = computeScore({ ...base, history: { available: false, notRequested: true, inspections: [], mileageReadings: [], claims: [] } });
    const failed = computeScore({ ...base, history: { available: false, inspections: [], mileageReadings: [], claims: [] } });
    expect(notReq.percent).toBe(100);
    expect(failed.percent).toBe(85);
    expect(notReq.reasons.join(" ")).toContain("carte grise");
  });
});

describe("correspondance des fiches de pannes", async () => {
  const { modelMatches } = await import("@/lib/engine/known-issues");
  it("distingue les modèles proches", () => {
    expect(modelMatches("208", ["208"])).toBe(true);
    expect(modelMatches("2008", ["208"])).toBe(false);
    expect(modelMatches("C3 AIRCROSS", ["c3"])).toBe(false);
    expect(modelMatches("C3 Picasso", ["c3"])).toBe(false);
    expect(modelMatches("C3 II", ["c3"])).toBe(true);
    expect(modelMatches("Grand Scénic", ["scenic"])).toBe(false);
    expect(modelMatches("Grand Scénic", ["grand scenic"])).toBe(true);
    expect(modelMatches("308 SW", ["308"])).toBe(true);
    expect(modelMatches("Yaris Cross", ["yaris"])).toBe(false);
    expect(modelMatches("Série 1", ["serie 1"])).toBe(true);
  });
});
