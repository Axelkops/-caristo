import type { ListingAnalysis, Vehicle } from "../engine/types";
import type { ListingProvider } from "./index";
import { estimateValuation } from "../engine/valuation";

export const mockListingProvider: ListingProvider = {
  name: "mock",
  async analyze(url: string, vehicle: Vehicle, mileage?: number): Promise<ListingAnalysis> {
    const val = estimateValuation(vehicle, mileage);
    const asking = Math.round((val.high + 500) / 50) * 50;
    const declared = mileage ?? 100000;
    const claims: ListingAnalysis["claims"] = [
      { text: `Prix de l'annonce : ${asking.toLocaleString("fr-FR")} €`, status: asking > val.high ? "warning" : "ok", detail: asking > val.high ? `Le prix est ${(asking - val.high).toLocaleString("fr-FR")} € au-dessus de la cote estimée : demander ce qui le justifie.` : undefined },
      { text: `Kilométrage annoncé : ${declared.toLocaleString("fr-FR")} km`, status: "ok" },
      { text: "« Jamais accidentée »", status: "ok", detail: "Aucun sinistre expertisé dans l'historique officiel." },
    ];
    if (vehicle.imported) claims.push({ text: "Import non mentionné", status: "warning", detail: "L'annonce ne précise pas que le véhicule a été immatriculé à l'étranger avant la France. Demander pourquoi." });
    return { available: true, url, askingPrice: asking, declaredMileage: declared, claims };
  },
};
