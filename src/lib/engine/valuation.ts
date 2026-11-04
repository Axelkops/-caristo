import type { Valuation, Vehicle } from "./types";
import { vehicleAgeYears } from "./known-issues";

/**
 * Estimation de cote par modèle statistique Caristo (prix neuf typique × décote âge/kilométrage).
 * Utilisée quand aucun fournisseur de cote n'est branché. Toujours présentée comme une estimation.
 */

const SEGMENTS: { keys: string[]; newPrice: number }[] = [
  { keys: ["108", "c1", "aygo", "up!", "up ", "twingo", "spring", "picanto", "i10", "mii", "citigo", "ka+", "ignis", "500 ", "panda"], newPrice: 15000 },
  { keys: ["208", "2008", "c3", "clio", "sandero", "logan", "polo", "ibiza", "fabia", "fiesta", "yaris", "i20", "rio", "corsa", "swift", "micra", "jazz", "mazda2", "a1", "mini", "ds3", "captur", "juke", "puma", "stonic", "kona", "arona", "kamiq", "t-cross", "crossland", "c3 aircross", "mokka", "c-hr"], newPrice: 24000 },
  { keys: ["308", "3008", "c4", "megane", "mégane", "golf", "leon", "octavia", "focus", "corolla", "auris", "i30", "ceed", "astra", "civic", "mazda3", "a3", "série 1", "serie 1", "1 series", "classe a", "a-class", "qashqai", "kadjar", "tiguan", "ateca", "karoq", "kuga", "rav4", "tucson", "sportage", "grandland", "cx-5", "3008", "5008", "c5 aircross", "scenic", "scénic", "touran", "arkana", "austral", "ds4", "ds7", "model 3", "id.3", "e-208", "e-2008", "zoe", "mégane e-tech", "leaf", "ioniq"], newPrice: 34000 },
  { keys: ["508", "talisman", "passat", "superb", "mondeo", "camry", "insignia", "a4", "série 3", "serie 3", "3 series", "classe c", "c-class", "x1", "x2", "q3", "glb", "gla", "xc40", "cx-60", "model y", "id.4", "enyaq", "bz4x", "ariya"], newPrice: 45000 },
  { keys: ["a6", "série 5", "serie 5", "5 series", "classe e", "e-class", "x3", "q5", "glc", "xc60", "model s", "model x", "ix", "eqc", "cayenne", "macan", "range", "discovery", "x5", "q7", "gle", "xc90", "touareg"], newPrice: 65000 },
  { keys: ["kangoo", "berlingo", "partner", "caddy", "doblo", "combo", "expert", "jumpy", "vivaro", "trafic", "transit custom", "vito", "transporter", "master", "jumper", "boxer", "ducato", "sprinter", "crafter", "movano"], newPrice: 32000 },
];

export function estimateNewPrice(vehicle: Vehicle): number {
  const hay = `${vehicle.model} ${vehicle.version ?? ""}`.toLowerCase();
  for (const s of SEGMENTS) if (s.keys.some((k) => hay.includes(k))) return adjustByPower(s.newPrice, vehicle);
  const make = vehicle.make.toLowerCase();
  if (["audi", "bmw", "mercedes", "mercedes-benz", "volvo", "lexus", "tesla", "land rover", "jaguar", "porsche"].some((m) => make.includes(m))) return adjustByPower(48000, vehicle);
  if (vehicle.category === "utilitaire") return adjustByPower(32000, vehicle);
  return adjustByPower(28000, vehicle);
}

function adjustByPower(base0: number, v: Vehicle): number {
  // une électrique coûte nettement plus cher neuve que la version thermique du même modèle
  const base = v.fuel === "electrique" && !v.make.toLowerCase().includes("tesla") ? Math.round(base0 * 1.35) : v.fuel === "hybride_rechargeable" ? Math.round(base0 * 1.2) : base0;
  if (!v.powerHp) return base;
  if (v.powerHp >= 300) return Math.round(base * 1.5);
  if (v.powerHp >= 200) return Math.round(base * 1.25);
  if (v.powerHp >= 150) return Math.round(base * 1.1);
  if (v.powerHp <= 75) return Math.round(base * 0.9);
  return base;
}

export function estimateValuation(vehicle: Vehicle, mileage: number | undefined, askingPrice?: number, now = new Date()): Valuation {
  const newPrice = estimateNewPrice(vehicle);
  const age = vehicleAgeYears(vehicle, now);
  const km = mileage ?? Math.round(age * 15000);
  // décote âge : -18 % la 1re année puis -11 %/an, plancher 8 %
  let factor = Math.pow(0.89, Math.max(0, age - 1)) * (age >= 1 ? 0.82 : 1 - 0.18 * age);
  // ajustement kilométrage par rapport à 15 000 km/an
  const expectedKm = Math.max(1, age) * 15000;
  const kmRatio = km / expectedKm;
  factor *= kmRatio > 1 ? Math.max(0.6, 1 - (kmRatio - 1) * 0.25) : Math.min(1.15, 1 + (1 - kmRatio) * 0.12);
  if (vehicle.fuel === "electrique" && age > 4) factor *= 0.9;
  if (vehicle.fuel === "diesel" && age > 8) factor *= 0.95;
  factor = Math.max(0.06, factor);
  const mid = Math.round((newPrice * factor) / 50) * 50;
  const low = Math.round((mid * 0.94) / 50) * 50;
  const high = Math.round((mid * 1.06) / 50) * 50;
  const v: Valuation = { low, high, mid, currency: "EUR", basis: "Estimation à partir du prix neuf typique du modèle, de l'âge et du kilométrage. L'état réel, les options et la région font varier le prix." };
  if (askingPrice) {
    v.askingPrice = askingPrice;
    v.deltaToHigh = askingPrice - high;
    v.verdict = askingPrice < low ? "sous_la_cote" : askingPrice > high ? "au_dessus" : "dans_la_cote";
  }
  return v;
}
