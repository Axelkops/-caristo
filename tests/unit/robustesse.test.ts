import { describe, expect, it } from "vitest";
import { buildReport } from "@/lib/engine/report";
import { mockVehicleProvider } from "@/lib/providers/vehicle-mock";
import { mockHistoryProvider } from "@/lib/providers/history-mock";
import { mockRecallsProvider } from "@/lib/providers/recalls-mock";
import { mockListingProvider } from "@/lib/providers/listing-mock";
import { parsePlate } from "@/lib/engine/identifiers";
import type { ReportData } from "@/lib/engine/types";

const LETTERS = "ABCDEFGHJKLMNPRSTVWXYZ";
function plate(i: number): string {
  const a = LETTERS[i % 22] + LETTERS[Math.floor(i / 22) % 22];
  const n = String(100 + (i * 37) % 900);
  const b = LETTERS[Math.floor(i / 7) % 22] + LETTERS[Math.floor(i / 3) % 22];
  return `${a}-${n}-${b}`;
}

function assertInvariants(r: ReportData, label: string) {
  expect(["A", "B", "C", "D", "E"], label).toContain(r.score);
  expect(r.scoreReasons.length, label).toBeGreaterThan(0);
  expect(r.questions.length, label).toBeGreaterThan(0);
  expect(r.questions.length, label).toBeLessThanOrEqual(8);
  expect(r.maintenance.horizons.map((h) => h.key), label).toEqual(["now", "12", "24", "36"]);
  for (let i = 1; i < r.maintenance.horizons.length; i++) expect(r.maintenance.horizons[i].projectedKm, label).toBeGreaterThanOrEqual(r.maintenance.horizons[i - 1].projectedKm);
  for (const h of r.maintenance.horizons) { expect(h.costMin, label).toBeGreaterThanOrEqual(0); expect(h.costMax, label).toBeGreaterThanOrEqual(h.costMin); }
  for (const m of r.maintenance.items) { expect(Number.isFinite(m.dueKm ?? 0), label).toBe(true); if (m.dueDate) expect(m.dueDate, label).toMatch(/^\d{4}-\d{2}-\d{2}$/); }
  if (r.valuation) { expect(r.valuation.low, label).toBeLessThanOrEqual(r.valuation.mid); expect(r.valuation.mid, label).toBeLessThanOrEqual(r.valuation.high); expect(r.valuation.low, label).toBeGreaterThan(0); }
  for (const i of r.knownIssues) { expect(i.title.length, label).toBeGreaterThan(3); expect(typeof i.inZone, label).toBe("boolean"); if (i.costMin !== undefined && i.costMax !== undefined) expect(i.costMax, label).toBeGreaterThanOrEqual(i.costMin); }
  const ids = r.knownIssues.map((i) => i.id);
  expect(new Set(ids).size, label).toBe(ids.length);
  expect(r.sources.length, label).toBeGreaterThanOrEqual(5);
  expect(JSON.stringify(r), label).not.toContain("NaN");
  expect(JSON.stringify(r), label).not.toContain("undefined km");
}

describe("robustesse : des milliers de véhicules", () => {
  it("génère un rapport cohérent pour 2 000 plaques et 5 kilométrages chacune", async () => {
    let count = 0;
    for (let i = 0; i < 2000; i++) {
      const p = parsePlate(plate(i));
      expect(p, plate(i)).not.toBeNull();
      const vehicle = await mockVehicleProvider.identify({ kind: "plate", value: p!.normalized, country: "FR" });
      expect(vehicle).not.toBeNull();
      for (const mileage of [5000, 60000, 118000, 190000, 310000]) {
        const history = await mockHistoryProvider.fetchHistory({ vehicle: vehicle!, plate: p!.normalized, holderName: "X", formulaNumber: "2021AB12345", firstRegDate: "2019-03-12" });
        const recalls = await mockRecallsProvider.fetchRecalls(vehicle!);
        const listing = i % 3 === 0 ? await mockListingProvider.analyze("https://exemple.fr/a", vehicle!, mileage) : { available: false as const, claims: [] };
        const r = buildReport({ id: `t${i}`, reference: `CAR-T-${i}`, vehicle: vehicle!, mileage, history, recalls, listing });
        assertInvariants(r, `${plate(i)} @${mileage}`);
        count++;
      }
    }
    expect(count).toBe(10000);
  }, 120_000);

  it("reste cohérent sans carte grise, hors France, et avec des dates extrêmes", async () => {
    const base = (await mockVehicleProvider.identify({ kind: "plate", value: "AB-123-CD", country: "FR" }))!;
    const cases = [
      { ...base, country: "DE" },
      { ...base, firstRegistration: "1995-01-01", firstRegistrationInCountry: undefined, imported: false },
      { ...base, firstRegistration: new Date().toISOString().slice(0, 10), imported: false },
      { ...base, firstRegistration: undefined, firstRegistrationInCountry: undefined },
      { ...base, fuel: "electrique" as const, gearbox: "automatique" as const },
      { ...base, fuel: "autre" as const, gearbox: "inconnue" as const, powerHp: undefined, version: undefined },
    ];
    for (const v of cases) {
      for (const mileage of [undefined, 0, 999999]) {
        const history = await mockHistoryProvider.fetchHistory({ vehicle: v });
        const r = buildReport({ id: "z", reference: "CAR-Z", vehicle: v, mileage, history, recalls: [], listing: { available: false, claims: [] } });
        assertInvariants(r, `${v.country} ${v.fuel} ${v.firstRegistration} @${mileage}`);
      }
    }
  });
});
