import type { Vehicle } from "../engine/types";
import type { IdentifyInput, VehicleProvider } from "./index";
import { decodeVinBasic } from "./vin-decoder";

/**
 * Fournisseur de démonstration : renvoie des véhicules réalistes, déterminés par la plaque.
 * Permet de tester tout le parcours sans compte externe.
 */
const SAMPLES: Omit<Vehicle, "plate" | "country">[] = [
  { make: "Peugeot", model: "3008", version: "1.5 BlueHDi 130 Allure EAT8", vin: "VF3MCYHZRKS004821", firstRegistration: "2019-03-12", firstRegistrationInCountry: "2021-02-09", fuel: "diesel", gearbox: "automatique", powerHp: 131, powerKw: 96, fiscalPower: 7, displacementCc: 1499, co2: 112, critAir: "2", engineCode: "DV5RC", category: "voiture", bodyType: "SUV", seats: 5, color: "Gris", imported: true },
  { make: "Renault", model: "Clio", version: "1.5 dCi 90 Intens", vin: "VF1RJA00X61234567", firstRegistration: "2017-06-20", fuel: "diesel", gearbox: "manuelle", powerHp: 90, powerKw: 66, fiscalPower: 5, displacementCc: 1461, co2: 85, critAir: "2", engineCode: "K9K", category: "voiture", bodyType: "Berline", seats: 5, color: "Blanc", imported: false },
  { make: "Volkswagen", model: "Golf", version: "1.4 TSI 122 Confortline", vin: "WVWZZZ1KZBW123456", firstRegistration: "2011-09-05", fuel: "essence", gearbox: "manuelle", powerHp: 122, powerKw: 90, fiscalPower: 6, displacementCc: 1390, co2: 138, critAir: "1", engineCode: "CAXA", category: "voiture", bodyType: "Berline", seats: 5, color: "Noir", imported: false },
  { make: "Toyota", model: "Yaris", version: "1.5 Hybride 116 Dynamic", vin: "VNKKD3D310A123456", firstRegistration: "2021-11-18", fuel: "hybride", gearbox: "automatique", powerHp: 116, powerKw: 85, fiscalPower: 4, displacementCc: 1490, co2: 87, critAir: "1", category: "voiture", bodyType: "Citadine", seats: 5, color: "Rouge", imported: false },
  { make: "Tesla", model: "Model 3", version: "Long Range Dual Motor", vin: "5YJ3E7EB0LF123456", firstRegistration: "2020-07-01", fuel: "electrique", gearbox: "automatique", powerHp: 351, powerKw: 258, fiscalPower: 10, co2: 0, critAir: "0", category: "voiture", bodyType: "Berline", seats: 5, color: "Bleu", imported: false },
  { make: "Dacia", model: "Sandero", version: "1.0 TCe 90 Stepway", vin: "UU1DJF00X65123456", firstRegistration: "2022-04-14", fuel: "essence", gearbox: "manuelle", powerHp: 90, powerKw: 67, fiscalPower: 5, displacementCc: 999, co2: 120, critAir: "1", category: "voiture", bodyType: "Berline", seats: 5, color: "Gris", imported: false },
  { make: "BMW", model: "Série 3", version: "320d 184 Luxury", vin: "WBA3D51000F123456", firstRegistration: "2013-02-22", fuel: "diesel", gearbox: "automatique", powerHp: 184, powerKw: 135, fiscalPower: 10, displacementCc: 1995, co2: 118, critAir: "2", engineCode: "N47D20", category: "voiture", bodyType: "Berline", seats: 5, color: "Noir", imported: false },
  { make: "Citroën", model: "Berlingo", version: "1.6 BlueHDi 100 Club", vin: "VF7GJBHW6EJ123456", firstRegistration: "2016-10-03", fuel: "diesel", gearbox: "manuelle", powerHp: 100, powerKw: 73, fiscalPower: 5, displacementCc: 1560, co2: 109, critAir: "2", engineCode: "DV6FD", category: "utilitaire", bodyType: "Fourgonnette", seats: 3, color: "Blanc", imported: false },
];

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h >>> 0);
}

export const mockVehicleProvider: VehicleProvider = {
  name: "mock",
  async identify(input: IdentifyInput): Promise<Vehicle | null> {
    if (input.kind === "plate") {
      if (input.value.replace(/[^A-Z0-9]/g, "") === "ZZ999ZZ") return null; // plaque inconnue (pour les tests)
      const sample = SAMPLES[hashString(input.value) % SAMPLES.length];
      return { ...sample, plate: input.value, country: input.country };
    }
    // VIN : si un échantillon correspond, on le renvoie ; sinon décodage basique mondial
    const sample = SAMPLES.find((s) => s.vin === input.value);
    if (sample) return { ...sample, country: input.country };
    const basic = decodeVinBasic(input.value);
    if (!basic) return null;
    return { ...basic, country: input.country };
  },
};
