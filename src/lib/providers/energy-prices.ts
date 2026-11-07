import { ENERGY_PRICES_FALLBACK } from "../data/ownership";
import type { EnergyPrices } from "../engine/ownership";
import { cached } from "./cache";

/**
 * Prix moyens nationaux des carburants, à partir des données ouvertes du ministère de l'Économie
 * (flux instantané des stations-service, Licence Ouverte). Mis en cache 12 h.
 * En cas d'échec ou de valeur aberrante, le barème de secours est utilisé.
 */
const URL = "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records?select=avg(gazole_prix)%20as%20gazole,avg(e10_prix)%20as%20e10,avg(gplc_prix)%20as%20gpl,avg(e85_prix)%20as%20e85&limit=1";

const ok = (n: unknown, lo: number, hi: number): n is number => typeof n === "number" && Number.isFinite(n) && n >= lo && n <= hi;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

export async function fetchEnergyPrices(): Promise<EnergyPrices> {
  if (process.env.DEMO_MODE === "true" || process.env.ENERGY_PRICES === "off") return ENERGY_PRICES_FALLBACK;
  try {
    return await cached("energy-prices:v1", 12 * 3600, async () => {
      const res = await fetch(URL, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { results?: Record<string, unknown>[] };
      const row = json.results?.[0] ?? {};
      const f = ENERGY_PRICES_FALLBACK;
      const p: EnergyPrices = {
        gazole: ok(row.gazole, 0.8, 4) ? r3(row.gazole) : f.gazole,
        e10: ok(row.e10, 0.8, 4) ? r3(row.e10) : f.e10,
        gpl: ok(row.gpl, 0.4, 3) ? r3(row.gpl) : f.gpl,
        e85: ok(row.e85, 0.4, 3) ? r3(row.e85) : f.e85,
        electricity: f.electricity,
        date: new Date().toISOString().slice(0, 10),
      };
      if (p.gazole === f.gazole && p.e10 === f.e10) throw new Error("réponse inattendue");
      return p;
    });
  } catch {
    return ENERGY_PRICES_FALLBACK;
  }
}
