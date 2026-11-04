import type { Recall, Vehicle } from "../engine/types";
import type { RecallsProvider } from "./index";
import { hashString } from "./vehicle-mock";

export const mockRecallsProvider: RecallsProvider = {
  name: "mock",
  async fetchRecalls(vehicle: Vehicle): Promise<Recall[]> {
    const seed = hashString(`${vehicle.make}${vehicle.model}${vehicle.vin ?? ""}`);
    const out: Recall[] = [];
    if (vehicle.fuel === "diesel" && seed % 2 === 0) out.push({ date: "2022-06-14", title: "Réservoir AdBlue : risque de fuite", description: "Remplacement du réservoir d'additif.", reference: "R-2022-0614", status: "done" });
    if (seed % 5 === 0) out.push({ date: "2024-03-02", title: "Logiciel de freinage : mise à jour", description: "Mise à jour à faire en concession, gratuite.", reference: "R-2024-0302", status: "open" });
    if (vehicle.fuel === "electrique" && seed % 3 === 0) out.push({ date: "2023-11-20", title: "Ceintures de sécurité : contrôle de fixation", status: "unknown" });
    return out;
  },
};
