import type { Recall, Vehicle } from "../engine/types";
import type { RecallsProvider } from "./index";
import { cached } from "./cache";

/**
 * Rappels constructeur via la base publique RappelConso (DGCCRF, licence ouverte), API Opendatasoft.
 * Les identifiants de jeu de données évoluent : on en essaie plusieurs, et on dégrade proprement.
 */
const BASE = process.env.RAPPELCONSO_API_URL ?? "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets";
const DATASETS = (process.env.RAPPELCONSO_DATASETS ?? "rappelconso-v2-gtin,rappelconso0").split(",");

function norm(s: string): string { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").trim(); }

export function mapRappelConsoRecord(r: Record<string, unknown>): Recall | null {
  const title = String(r["noms_des_modeles_ou_references"] ?? r["modeles_ou_references"] ?? r["libelle"] ?? r["nom_de_la_marque_du_produit"] ?? "Rappel constructeur");
  const date = String(r["date_de_publication"] ?? r["date_publication"] ?? "").slice(0, 10);
  if (!date) return null;
  return {
    date,
    title: String(r["motif_du_rappel"] ?? r["motif"] ?? title).slice(0, 160),
    description: [r["risques_encourus_par_le_consommateur"], r["conduites_a_tenir_par_le_consommateur"]].filter(Boolean).map(String).join(" ").slice(0, 400) || undefined,
    reference: r["numero_de_fiche"] ? String(r["numero_de_fiche"]) : undefined,
    status: "unknown",
  };
}

export const rappelConsoProvider: RecallsProvider = {
  name: "rappelconso",
  async fetchRecalls(vehicle: Vehicle): Promise<Recall[]> {
    const make = norm(vehicle.make);
    const model = norm(vehicle.model).split(" ")[0];
    const key = `recalls:${make}:${model}`;
    return cached(key, 7 * 24 * 3600, async () => {
      for (const ds of DATASETS) {
        try {
          const where = `search(nom_de_la_marque_du_produit, "${make}") AND search(noms_des_modeles_ou_references, "${model}")`;
          const url = `${BASE}/${ds.trim()}/records?where=${encodeURIComponent(where)}&limit=50&order_by=date_de_publication desc`;
          const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(10000) });
          if (!res.ok) continue;
          const json = (await res.json()) as { results?: Record<string, unknown>[] };
          const recs = (json.results ?? []).map(mapRappelConsoRecord).filter((x): x is Recall => !!x);
          // ne garder que la catégorie automobile si elle est renseignée
          return recs.filter((x) => x.title.length > 0).slice(0, 20);
        } catch {
          continue;
        }
      }
      return [];
    });
  },
};
