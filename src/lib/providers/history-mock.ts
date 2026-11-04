import type { Inspection, MileageReading, OfficialHistory } from "../engine/types";
import type { HistoryInput, HistoryProvider } from "./index";
import { hashString } from "./vehicle-mock";

/**
 * Historique officiel de démonstration : cohérent avec le véhicule (âge, kilométrage), avec
 * quelques scénarios (contre-visite, sinistre, recul de compteur) choisis selon la plaque.
 */
export const mockHistoryProvider: HistoryProvider = {
  name: "mock",
  async fetchHistory(input: HistoryInput): Promise<OfficialHistory> {
    const v = input.vehicle;
    if (v.country !== "FR") {
      return { available: false, reason: "L'historique officiel n'existe que pour les véhicules immatriculés en France.", inspections: [], mileageReadings: [], claims: [] };
    }
    if (!input.formulaNumber || !input.holderName || !input.firstRegDate) {
      return { available: false, reason: "Informations de la carte grise manquantes : l'historique officiel n'a pas pu être ouvert.", inspections: [], mileageReadings: [], claims: [] };
    }
    const seed = hashString(input.plate ?? v.vin ?? "x");
    const scenario = seed % 7; // 0..6
    const first = new Date(v.firstRegistrationInCountry ?? v.firstRegistration ?? "2018-01-01");
    const now = new Date();
    const years = Math.max(0, (now.getTime() - first.getTime()) / (365.25 * 86400000));
    const annual = 12000 + (seed % 9000);
    const inspections: Inspection[] = [];
    const readings: MileageReading[] = [];
    // 1er CT à 4 ans puis tous les 2 ans (véhicule importé : CT à l'import)
    const firstReg = new Date(v.firstRegistration ?? first);
    const ageAtEntry = (first.getTime() - firstReg.getTime()) / (365.25 * 86400000);
    let kmAtEntry = Math.round(ageAtEntry * annual);
    if (v.imported && ageAtEntry > 0.5) {
      inspections.push({ date: iso(first), kind: "import", mileage: kmAtEntry, result: "favorable" });
      readings.push({ date: iso(first), mileage: kmAtEntry, source: "controle_technique" });
    } else kmAtEntry = 0;
    let t = new Date(firstReg);
    t.setFullYear(t.getFullYear() + 4);
    let n = 0;
    while (t < now) {
      if (t > first) {
        const ageY = (t.getTime() - firstReg.getTime()) / (365.25 * 86400000);
        let km = Math.round(ageY * annual + ((seed >> n) % 1500));
        if (scenario === 5 && n === 1) km = Math.max(1000, km - 30000); // recul de compteur
        const defavorable = scenario === 1 && n === 1;
        inspections.push({ date: iso(t), kind: "periodique", mileage: km, result: defavorable ? "defavorable" : "favorable", defects: defavorable ? "1 défaillance majeure (freinage arrière)" : n % 2 ? "2 défaillances mineures (éclairage, usure pneu)" : "Aucune" });
        readings.push({ date: iso(t), mileage: km, source: "controle_technique" });
        if (defavorable) {
          const cv = new Date(t); cv.setDate(cv.getDate() + 15);
          inspections.push({ date: iso(cv), kind: "contre_visite", mileage: km + 150, result: "favorable", defects: "Aucune" });
          readings.push({ date: iso(cv), mileage: km + 150, source: "controle_technique" });
        }
        n++;
      }
      t = new Date(t); t.setFullYear(t.getFullYear() + 2);
    }
    const claims = scenario === 2 ? [{ date: iso(addYears(first, Math.min(2, years / 2))), kind: "Sinistre expertisé", description: "Réparation contrôlée par un expert (choc avant)." }] : [];
    return {
      available: true,
      ownersCount: 1 + (seed % 3),
      pledge: scenario === 3,
      opposition: false,
      stolen: false,
      damagedProcedure: scenario === 2,
      inspections,
      mileageReadings: readings,
      claims,
      retrievedAt: now.toISOString(),
    };
  },
};

function iso(d: Date): string { return d.toISOString().slice(0, 10); }
function addYears(d: Date, y: number): Date { const r = new Date(d); r.setMonth(r.getMonth() + Math.round(y * 12)); return r; }
