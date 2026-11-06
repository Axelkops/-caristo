import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { parsePlate } from "@/lib/engine/identifiers";
import { buildReport } from "@/lib/engine/report";
import { mockVehicleProvider } from "@/lib/providers/vehicle-mock";
import { mockHistoryProvider } from "@/lib/providers/history-mock";
import { mockRecallsProvider } from "@/lib/providers/recalls-mock";
import { mockListingProvider } from "@/lib/providers/listing-mock";
import { renderReportPdf } from "@/lib/pdf/report-pdf";
import type { Vehicle } from "@/lib/engine/types";

async function makeReport(plateRaw: string, mileage: number, withListing = false, holder = true, patch: Partial<Vehicle> = {}) {
  const p = parsePlate(plateRaw)!;
  const vehicle = { ...(await mockVehicleProvider.identify({ kind: "plate", value: p.normalized, country: "FR" }))!, ...patch };
  const history = await mockHistoryProvider.fetchHistory({ vehicle, plate: p.normalized, holderName: holder ? "DUPONT MARIE" : undefined, formulaNumber: holder ? "2021AB12345" : undefined, firstRegDate: holder ? "2019-03-12" : undefined });
  const recalls = await mockRecallsProvider.fetchRecalls(vehicle);
  const listing = withListing ? await mockListingProvider.analyze("https://exemple.fr/annonce", vehicle, mileage) : { available: false as const, claims: [] };
  return buildReport({ id: "pdftest", reference: "CAR-2026-TEST01", vehicle, mileage, history, recalls, listing });
}

describe("PDF du rapport", () => {
  it("produit un PDF valide avec toutes les sections", async () => {
    const r = await makeReport("PQ-456-RS", 118000, true);
    const buf = await renderReportPdf(r);
    expect(buf.subarray(0, 4).toString()).toBe("%PDF");
    expect(buf.length).toBeGreaterThan(20_000);
    if (process.env.PDF_OUT) writeFileSync(process.env.PDF_OUT, buf);
  }, 60_000);

  it("tient sans historique officiel ni kilométrage", async () => {
    const r = await makeReport("AB-123-CD", 0, false, false);
    const buf = await renderReportPdf({ ...r, mileage: undefined });
    expect(buf.subarray(0, 4).toString()).toBe("%PDF");
  }, 60_000);

  it("tient pour une électrique et un vieux diesel", async () => {
    for (const [plate, km, patch] of [["EV-123-AB", 40000, { fuel: "electrique", gearbox: "automatique" }], ["GH-321-JK", 240000, { fuel: "diesel", gearbox: "manuelle", firstRegistration: "2009-05-01" }], ["CD-777-EF", 5000, { version: "1.4 TSI DSG" }]] as const) {
      const r = await makeReport(plate, km, false, true, patch as Partial<Vehicle>);
      const buf = await renderReportPdf(r);
      expect(buf.subarray(0, 4).toString(), plate).toBe("%PDF");
    }
  }, 90_000);
});
