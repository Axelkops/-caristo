import { describe, expect, it } from "vitest";
import { describeWhen as describeWhen0, fmtMonthYear } from "@/lib/engine/maintenance";
const norm = (o: { when: string; whenDetail?: string }) => ({ when: o.when.replace(/[\u202F\u00A0]/g, " "), whenDetail: o.whenDetail?.replace(/[\u202F\u00A0]/g, " ") });
const describeWhen = (a: Parameters<typeof describeWhen0>[0]) => norm(describeWhen0(a));

describe("échéances d'entretien en clair", () => {
  it("privilégie ce qui arrive en premier", () => {
    expect(describeWhen({ status: "ok", dueKm: 120000, dueDate: "2027-03-12", kmToDue: 2000, monthsToDate: 4, monthsByKm: 1.2, unknown: false })).toEqual({ when: "Dans 2 000 km", whenDetail: "Vers 120 000 km, au plus tard mars 2027" });
    expect(describeWhen({ status: "ok", dueKm: 150000, dueDate: "2027-03-12", kmToDue: 32000, monthsToDate: 4, monthsByKm: 19, unknown: false })).toEqual({ when: "Dans 4 mois", whenDetail: "Mars 2027, ou vers 150 000 km" });
  });
  it("décrit le retard et l'inconnu", () => {
    expect(describeWhen({ status: "todo", dueKm: 110000, kmToDue: -8000, unknown: false })).toEqual({ when: "Maintenant", whenDetail: "Échéance dépassée de 8 000 km" });
    expect(describeWhen({ status: "check", unknown: true }).when).toBe("À vérifier");
    expect(describeWhen({ status: "check", dueKm: 120000, kmToDue: 2000, monthsByKm: 1.2, unknown: true })).toEqual({ when: "Dans 2 000 km", whenDetail: "Vers 120 000 km · à confirmer avec votre garagiste" });
    expect(describeWhen({ status: "todo", beltDue: true, unknown: true }).whenDetail).toContain("dès l'achat");
  });
  it("trie les interventions du plus urgent au plus lointain", async () => {
    const { buildMaintenanceSchedule } = await import("@/lib/engine/maintenance");
    const sched = buildMaintenanceSchedule({ vehicle: { make: "Test", model: "M", country: "FR", firstRegistration: "2019-03-12", fuel: "diesel", gearbox: "automatique", category: "voiture" }, mileage: 118000, history: { available: false, inspections: [], mileageReadings: [], claims: [] }, knownIssues: [], now: new Date("2026-11-06T12:00:00Z") });
    const months = sched.items.map((i) => i.dueInMonths ?? Infinity);
    for (let k = 1; k < months.length; k++) expect(months[k]).toBeGreaterThanOrEqual(months[k - 1]);
    expect(sched.items.every((i) => !/sans facture/i.test(i.whenDetail ?? ""))).toBe(true);
  });
  it("formate les années", () => {
    expect(describeWhen({ status: "ok", dueDate: "2029-03-12", monthsToDate: 28, unknown: false }).when).toBe("Dans 2 ans");
    expect(fmtMonthYear("2027-03-12")).toBe("mars 2027");
  });
});
