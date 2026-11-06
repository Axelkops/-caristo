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
    expect(describeWhen({ status: "check", dueKm: 120000, kmToDue: 2000, monthsByKm: 1.2, unknown: true })).toEqual({ when: "Dans 2 000 km", whenDetail: "Vers 120 000 km · sans facture, à confirmer" });
    expect(describeWhen({ status: "todo", beltDue: true, unknown: true }).whenDetail).toContain("Sans facture");
  });
  it("formate les années", () => {
    expect(describeWhen({ status: "ok", dueDate: "2029-03-12", monthsToDate: 28, unknown: false }).when).toBe("Dans 2 ans");
    expect(fmtMonthYear("2027-03-12")).toBe("mars 2027");
  });
});
