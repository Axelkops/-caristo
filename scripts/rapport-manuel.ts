/**
 * Génère un rapport Caristo pour un véhicule décrit en JSON (sans fournisseur), et l'enregistre comme prêt.
 * Usage : DATABASE_URL=file:./data/dev npx tsx scripts/rapport-manuel.ts vehicule.json 42000
 */
import fs from "node:fs";
import { customAlphabet } from "nanoid";
import { getDb, schema } from "../src/lib/db";
import { buildReport } from "../src/lib/engine/report";
import type { Vehicle } from "../src/lib/engine/types";

const nanoid = customAlphabet("0123456789abcdefghijkmnpqrstuvwxyz", 14);
async function main() {
  const vehicle = JSON.parse(fs.readFileSync(process.argv[2], "utf8")) as Vehicle;
  const mileage = Number(process.argv[3] ?? 0) || undefined;
  const db = await getDb();
  const id = nanoid();
  const report = buildReport({ id, reference: `CAR-${new Date().getFullYear()}-${id.slice(-6).toUpperCase()}`, vehicle, mileage, history: { available: false, reason: "Historique officiel non encore branché (phase test).", inspections: [], mileageReadings: [], claims: [] }, recalls: [], listing: { available: false, claims: [] } });
  await db.insert(schema.reports).values({ id, shareToken: nanoid(), status: "ready", inputKind: "plate", inputValue: vehicle.plate ?? "MANUEL", country: vehicle.country, mileage: mileage ?? null, vehicle, report, score: report.score, paidAt: new Date(), readyAt: new Date(), email: "test@caristo.local" });
  console.log(id);
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
