import { describe, expect, it } from "vitest";
import { buildOwnership, carteGriseCost, critAirInfo, energyBudget, mileageVsAverage, nextInspection, warranties } from "@/lib/engine/ownership";
import type { MaintenanceSchedule, OfficialHistory, Vehicle } from "@/lib/engine/types";

const now = new Date("2026-11-07T12:00:00Z");
const base: Vehicle = { make: "Peugeot", model: "208", version: "1.2 PureTech 110", country: "FR", firstRegistration: "2019-03-12", fuel: "essence", gearbox: "manuelle", category: "voiture", fiscalPower: 6, co2: 104, critAir: "1" };
const noHist: OfficialHistory = { available: false, inspections: [], mileageReadings: [], claims: [] };
const maint: MaintenanceSchedule = { annualKm: 12000, horizons: [{ key: "now", projectedKm: 0, costMin: 200, costMax: 300, items: [] }, { key: "12", projectedKm: 0, costMin: 600, costMax: 800, items: [] }, { key: "24", projectedKm: 0, costMin: 200, costMax: 300, items: [] }, { key: "36", projectedKm: 0, costMin: 0, costMax: 0, items: [] }], items: [], note: "" };

describe("budget et infos pratiques", () => {
  it("carte grise : chevaux × tarif régional + 13,76 €, moitié au-delà de 10 ans", () => {
    const cg = carteGriseCost(base, now)!;
    expect(cg.regions.find((r) => r.name === "Bretagne")!.total).toBe(6 * 60 + 13.76);
    expect(cg.regions.find((r) => r.name === "Île-de-France")!.total).toBeCloseTo(6 * 68.95 + 13.76, 2);
    expect(cg.min).toBe(6 * 43 + 13.76);
    const old = carteGriseCost({ ...base, firstRegistration: "2014-01-01" }, now)!;
    expect(old.halved).toBe(true);
    expect(old.regions.find((r) => r.name === "Bretagne")!.total).toBe(3 * 60 + 13.76);
    const ev = carteGriseCost({ ...base, fuel: "electrique", fiscalPower: 4 }, now)!;
    expect(ev.regions.find((r) => r.name === "Hauts-de-France")!.total).toBe(2 * 43 + 13.76);
    expect(carteGriseCost({ ...base, fiscalPower: undefined }, now)).toBeUndefined();
  });
  it("Crit'Air et zones à faibles émissions", () => {
    expect(critAirInfo(base)!.tone).toBe("ok");
    expect(critAirInfo({ ...base, critAir: "3" })!.zfe).toContain("Lyon");
    expect(critAirInfo({ ...base, critAir: "4" })!.tone).toBe("bad");
  });
  it("consommation réelle : CO2 converti puis corrigé, budget annuel", () => {
    const e = energyBudget(base, { gazole: 2, e10: 2, gpl: 1, e85: 0.9, electricity: 0.2, date: "2026-11-05" })!;
    expect(e.unit).toBe("L");
    expect(e.per100).toBeCloseTo((104 / 23.1) * 1.38, 1);
    expect(e.annualCost).toBe(Math.round(((10060 / 100) * e.per100 * 2) / 10) * 10);
    const d = energyBudget({ ...base, fuel: "diesel", co2: 120, firstRegistration: "2021-05-01" })!;
    expect(d.per100).toBeCloseTo((120 / 26.4) * 1.18, 1);
    const ev = energyBudget({ ...base, fuel: "electrique", model: "e-208", co2: 0 })!;
    expect(ev.unit).toBe("kWh");
    expect(energyBudget({ ...base, fuel: "hybride_rechargeable" })).toBeUndefined();
  });
  it("garanties : marque, kilométrage et batterie", () => {
    expect(warranties(base, 60000, now)[0].status).toBe("ended");
    const kia = warranties({ ...base, make: "Kia", firstRegistration: "2021-01-10" }, 60000, now);
    expect(kia[0].status).toBe("active");
    expect(kia[0].detail).toContain("2028");
    expect(warranties({ ...base, make: "Kia", firstRegistration: "2021-01-10" }, 160000, now)[0].status).toBe("ended");
    const ev = warranties({ ...base, fuel: "electrique", firstRegistration: "2020-02-27" }, 40000, now);
    expect(ev.find((w) => w.label.includes("batterie"))!.status).toBe("active");
  });
  it("kilométrage comparé à la moyenne", () => {
    expect(mileageVsAverage(base, 30000, now)!.verdict).toBe("faible");
    expect(mileageVsAverage(base, 110000, now)!.verdict).toBe("eleve");
    expect(mileageVsAverage({ ...base, fuel: "diesel" }, 100000, now)!.verdict).toBe("normal");
  });
  it("prochain contrôle technique", () => {
    expect(nextInspection(base, noHist, now)!.date).toBe("2027-03-12");
    const h: OfficialHistory = { ...noHist, available: true, inspections: [{ date: "2025-02-01", kind: "periodique", result: "favorable" }] };
    const n = nextInspection(base, h, now)!;
    expect(n.date).toBe("2027-02-01");
    expect(n.detail).toContain("plus de 6 mois");
    expect(nextInspection({ ...base, firstRegistration: "2024-06-01" }, noHist, now)!.detail).toContain("moins de 4 ans");
  });
  it("valeur future décroissante et coût sur 3 ans cohérent", () => {
    const o = buildOwnership({ vehicle: base, mileage: 60000, history: noHist, valuation: { low: 11000, high: 12400, mid: 11700, currency: "EUR", basis: "" }, maintenance: maint, now });
    const v = o.futureValues!.map((x) => x.value);
    expect(v[0]).toBeGreaterThan(v[1]);
    expect(v[1]).toBeGreaterThan(v[2]);
    const t = o.threeYears!;
    expect(t.purchase).toBe(11700);
    expect(t.resale).toBe(v[2]);
    expect(t.maintenance).toBe(1200);
    expect(t.total).toBe(Math.round((t.depreciation + t.energy + t.maintenance + t.registration + t.inspections) / 50) * 50);
    expect(t.inspections).toBe(160);
  });
});
