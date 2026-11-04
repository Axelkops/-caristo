import type { Vehicle } from "../engine/types";
import { parseVin } from "../engine/identifiers";

/**
 * Décodage VIN basique, mondial, sans fournisseur : constructeur (WMI) et année modèle.
 * Sert de repli quand aucun fournisseur ne reconnaît le véhicule : le rapport est alors partiel.
 */
const WMI: Record<string, { make: string; country: string }> = {
  VF1: { make: "Renault", country: "FR" }, VF3: { make: "Peugeot", country: "FR" }, VF7: { make: "Citroën", country: "FR" }, VR1: { make: "DS", country: "FR" }, VR3: { make: "Peugeot", country: "FR" }, VR7: { make: "Citroën", country: "FR" }, VF6: { make: "Renault Trucks", country: "FR" }, UU1: { make: "Dacia", country: "RO" }, VNK: { make: "Toyota", country: "FR" }, VNV: { make: "Nissan", country: "FR" }, VXK: { make: "Opel", country: "FR" },
  WVW: { make: "Volkswagen", country: "DE" }, WVG: { make: "Volkswagen", country: "DE" }, WV1: { make: "Volkswagen", country: "DE" }, WV2: { make: "Volkswagen", country: "DE" }, WAU: { make: "Audi", country: "DE" }, WA1: { make: "Audi", country: "DE" }, WBA: { make: "BMW", country: "DE" }, WBS: { make: "BMW", country: "DE" }, WBY: { make: "BMW", country: "DE" }, WMW: { make: "Mini", country: "DE" }, WDD: { make: "Mercedes-Benz", country: "DE" }, WDB: { make: "Mercedes-Benz", country: "DE" }, WDC: { make: "Mercedes-Benz", country: "DE" }, WDF: { make: "Mercedes-Benz", country: "DE" }, W1K: { make: "Mercedes-Benz", country: "DE" }, W1N: { make: "Mercedes-Benz", country: "DE" }, WP0: { make: "Porsche", country: "DE" }, WP1: { make: "Porsche", country: "DE" }, W0L: { make: "Opel", country: "DE" }, W0V: { make: "Opel", country: "DE" }, WF0: { make: "Ford", country: "DE" }, WME: { make: "Smart", country: "DE" },
  VSS: { make: "SEAT", country: "ES" }, VSK: { make: "Nissan", country: "ES" }, VS7: { make: "Citroën", country: "ES" }, VS5: { make: "Renault", country: "ES" },
  TMB: { make: "Škoda", country: "CZ" }, TMA: { make: "Hyundai", country: "CZ" }, TRU: { make: "Audi", country: "HU" },
  ZFA: { make: "Fiat", country: "IT" }, ZFF: { make: "Ferrari", country: "IT" }, ZAR: { make: "Alfa Romeo", country: "IT" }, ZLA: { make: "Lancia", country: "IT" }, ZCF: { make: "Iveco", country: "IT" },
  SAL: { make: "Land Rover", country: "GB" }, SAJ: { make: "Jaguar", country: "GB" }, SB1: { make: "Toyota", country: "GB" }, SHH: { make: "Honda", country: "GB" }, SJN: { make: "Nissan", country: "GB" }, WF1: { make: "Ford", country: "GB" },
  YV1: { make: "Volvo", country: "SE" }, YS3: { make: "Saab", country: "SE" }, XTA: { make: "Lada", country: "RU" },
  JTD: { make: "Toyota", country: "JP" }, JT1: { make: "Toyota", country: "JP" }, JTE: { make: "Toyota", country: "JP" }, JHM: { make: "Honda", country: "JP" }, JMZ: { make: "Mazda", country: "JP" }, JN1: { make: "Nissan", country: "JP" }, JF1: { make: "Subaru", country: "JP" }, JS1: { make: "Suzuki", country: "JP" }, JMB: { make: "Mitsubishi", country: "JP" }, JTH: { make: "Lexus", country: "JP" },
  KMH: { make: "Hyundai", country: "KR" }, KNA: { make: "Kia", country: "KR" }, KNM: { make: "Renault Samsung", country: "KR" },
  "5YJ": { make: "Tesla", country: "US" }, "7SA": { make: "Tesla", country: "US" }, LRW: { make: "Tesla", country: "CN" }, XP7: { make: "Tesla", country: "DE" }, "1FA": { make: "Ford", country: "US" }, "1G1": { make: "Chevrolet", country: "US" }, "1HG": { make: "Honda", country: "US" }, "2HG": { make: "Honda", country: "CA" }, "3VW": { make: "Volkswagen", country: "MX" }, "4T1": { make: "Toyota", country: "US" }, "5N1": { make: "Nissan", country: "US" },
  LSG: { make: "SAIC", country: "CN" }, LVS: { make: "Ford", country: "CN" }, LB3: { make: "Geely", country: "CN" }, LGX: { make: "BYD", country: "CN" }, L6T: { make: "Geely", country: "CN" }, LVV: { make: "Chery", country: "CN" }, LMG: { make: "MG", country: "CN" },
  MA3: { make: "Suzuki", country: "IN" }, MAL: { make: "Hyundai", country: "IN" }, NLH: { make: "Hyundai", country: "TR" }, NM0: { make: "Ford", country: "TR" }, VNE: { make: "Iveco", country: "FR" },
};

export function decodeVinBasic(vin: string): Omit<Vehicle, "country"> | null {
  const p = parseVin(vin);
  if (!p || !p.valid) return null;
  const entry = WMI[p.wmi] ?? WMI[p.wmi.slice(0, 2) + "*"];
  const make = entry?.make ?? `Constructeur ${p.wmi}`;
  const year = p.modelYear;
  return {
    make,
    model: "Modèle à préciser",
    version: undefined,
    vin: p.vin,
    firstRegistration: year ? `${year}-01-01` : undefined,
    fuel: "autre",
    gearbox: "inconnue",
    category: "voiture",
  };
}

export const VIN_ORIGIN_COUNTRY = (wmi: string): string | undefined => WMI[wmi]?.country;
