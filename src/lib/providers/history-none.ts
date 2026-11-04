import type { OfficialHistory } from "../engine/types";
import type { HistoryInput, HistoryProvider } from "./index";

/**
 * Fournisseur d'historique officiel « non branché ».
 * Le rapport est produit avec tout le reste et indique clairement ce qui manque.
 * À remplacer par l'adaptateur réel (voir docs/SOURCES.md) une fois l'accès validé.
 */
export const noneHistoryProvider: HistoryProvider = {
  name: "none",
  async fetchHistory(input: HistoryInput): Promise<OfficialHistory> {
    const reason = input.vehicle.country !== "FR"
      ? "L'historique officiel n'existe que pour les véhicules immatriculés en France."
      : "Historique officiel indisponible pour le moment.";
    return { available: false, reason, inspections: [], mileageReadings: [], claims: [] };
  },
};
