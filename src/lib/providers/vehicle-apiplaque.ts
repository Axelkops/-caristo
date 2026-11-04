import type { Fuel, Gearbox, Vehicle } from "../engine/types";
import type { IdentifyInput, VehicleProvider } from "./index";
import { decodeVinBasic } from "./vin-decoder";
import { cached } from "./cache";

/**
 * Adaptateur apiplaqueimmatriculation.com (documentation du 04/11/2026) :
 *   POST https://api.apiplaqueimmatriculation.com/plaque?immatriculation=AA-123-BC&token=...&pays=FR
 *   POST https://api.apiplaqueimmatriculation.com/vin?vin=VF1...&token=...
 * Réponse : { data: { erreur, immat, pays, marque, modele, version, date1erCir_us, energie, energieNGC,
 *   genreVCG, puisFisc, puisFiscReelCH, puisFiscReelKW, boite_vitesse (A/M/S/V/X), ccm, co2, vin, couleur,
 *   carrosserie, nr_passagers, code_moteur, ... }, "api-version", message, code_erreur }
 * Pays acceptés : FR, ES, UK, DE, IT, PT, NL.
 * La lecture est tolérante : si un champ change de nom, le véhicule est quand même identifié avec ce qui existe.
 */
const DEFAULT_URL = "https://api.apiplaqueimmatriculation.com";
const SUPPORTED_COUNTRIES = new Set(["FR", "ES", "GB", "UK", "DE", "IT", "PT", "NL"]);

function pick(o: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = o[k] ?? o[k.toUpperCase()] ?? o[k.toLowerCase()];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
  }
  return undefined;
}

/** Codes énergie du fournisseur (1..19) puis libellés libres. */
const ENERGY_CODES: Record<string, Fuel> = { "1": "essence", "2": "diesel", "3": "gpl", "4": "essence", "5": "hybride", "6": "hybride_rechargeable", "7": "hybride", "8": "gpl", "9": "hybride", "10": "hybride_rechargeable", "11": "gpl", "12": "electrique", "13": "essence", "14": "hybride", "15": "hybride", "16": "gpl", "17": "hybride", "18": "hybride_rechargeable", "19": "electrique" };

export function mapFuel(raw?: string, code?: string): Fuel {
  if (code && ENERGY_CODES[code]) return ENERGY_CODES[code];
  const v = (raw ?? "").toLowerCase();
  if (!v) return "autre";
  if (v.includes("rechargeable") || v.includes("plug")) return "hybride_rechargeable";
  if (v.includes("hybr") || (v.includes("elec") && (v.includes("ess") || v.includes("gazole") || v.includes("diesel")))) return "hybride";
  if (v.includes("hydrog")) return "electrique";
  if (v.includes("elec") || v.includes("élec") || v === "el") return "electrique";
  if (v.includes("gazole") || v.includes("diesel") || v === "go") return "diesel";
  if (v.includes("gaz") || v.includes("gpl") || v.includes("gnv")) return "gpl";
  if (v.includes("essence") || v.includes("sans plomb") || v === "es" || v.includes("petrol") || v.includes("ethanol") || v.includes("bioeth")) return "essence";
  return "autre";
}

export function mapGearbox(raw?: string): Gearbox {
  const v = (raw ?? "").trim().toLowerCase();
  if (!v) return "inconnue";
  if (v === "m" || v.includes("manu")) return "manuelle";
  if (["a", "s", "v", "x"].includes(v) || v.includes("auto") || v.includes("robot") || v.includes("cvt") || v.includes("dsg") || v.includes("eat") || v.includes("séquent") || v.includes("sequent")) return "automatique";
  return "inconnue";
}

export function toIsoDate(raw?: string): string | undefined {
  if (!raw) return undefined;
  const m = raw.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  return undefined;
}

function num(v?: string): number | undefined {
  if (!v) return undefined;
  const m = String(v).replace(",", ".").match(/[\d.]+/);
  if (!m) return undefined;
  const n = Number(m[0]);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function category(genreCode?: string, genreLabel?: string): Vehicle["category"] {
  const g = (genreLabel ?? "").toUpperCase();
  const c = genreCode ?? "";
  if (["2", "4", "19"].includes(c) || g.startsWith("CTTE") || g.startsWith("CAM") || g === "VU") return "utilitaire";
  if (c === "5" || g.startsWith("MT") || g === "MOTO") return "moto";
  return "voiture";
}

/** Transforme la réponse brute du fournisseur en véhicule Caristo. Exporté pour les tests. */
export function mapApiPlaqueVehicle(raw: Record<string, unknown>, input: IdentifyInput): Vehicle | null {
  const data = ((raw.data ?? raw.result ?? raw) as Record<string, unknown>) ?? {};
  const erreur = pick(data, "erreur");
  if (erreur) return null;
  const make = pick(data, "marque", "AWN_marque", "make");
  const model = pick(data, "modele", "AWN_modele", "model");
  if (!make || !model) return null;
  const firstReg = toIsoDate(pick(data, "date1erCir_us", "date1erCir_fr", "AWN_date_mise_en_circulation", "date_premiere_immatriculation"));
  const firstRegFr = toIsoDate(pick(data, "date_immat_france", "AWN_date_1er_cer", "date_premiere_immatriculation_fr"));
  const imported = !!(firstReg && firstRegFr && firstRegFr > firstReg && (new Date(firstRegFr).getTime() - new Date(firstReg).getTime()) / 86400000 > 60);
  const country = (pick(data, "pays") ?? input.country).toUpperCase().replace("UK", "GB");
  const version = pick(data, "version", "AWN_version", "sra_commercial");
  const plate = input.kind === "plate" ? input.value : pick(data, "immat", "AWN_immat", "immatriculation");
  return {
    make: titleCase(make),
    model,
    version,
    vin: pick(data, "vin", "AWN_VIN"),
    plate,
    country,
    firstRegistration: firstReg,
    firstRegistrationInCountry: firstRegFr,
    fuel: mapFuel(pick(data, "energieNGC", "type_moteur", "AWN_energie", "energie_libelle"), pick(data, "energie")),
    gearbox: mapGearbox(pick(data, "boite_vitesse", "AWN_type_boite_vites", "boite")),
    powerHp: num(pick(data, "puisFiscReelCH", "AWN_puissance_chevaux", "puissance_ch")),
    powerKw: num(pick(data, "puisFiscReelKW", "AWN_puissance_KW", "puissance_kw")),
    fiscalPower: num(pick(data, "puisFisc", "AWN_puissance_fiscale")),
    displacementCc: num(pick(data, "ccm", "AWN_cylindree", "cylindree")),
    co2: num(pick(data, "co2", "AWN_emission_co_2")),
    critAir: critAir(mapFuel(pick(data, "energieNGC"), pick(data, "energie")), firstReg),
    engineCode: pick(data, "code_moteur", "AWN_code_moteur"),
    category: category(pick(data, "genreVCG"), pick(data, "genreVCGNGC", "AWN_genre")),
    bodyType: pick(data, "carrosserie", "carrosserieCG", "AWN_carrosserie"),
    seats: num(pick(data, "nr_passagers", "AWN_nbr_places")),
    color: pick(data, "couleur", "AWN_couleur"),
    imported,
  };
}

function titleCase(s: string): string {
  if (s.length <= 3) return s.toUpperCase();
  return s.toLowerCase().replace(/(^|[\s-])([a-zà-ÿ])/g, (m) => m.toUpperCase());
}

/** Vignette Crit'Air déduite de l'énergie et de la date de première immatriculation (règles officielles). */
export function critAir(fuel: Fuel, firstReg?: string): string | undefined {
  if (!firstReg) return undefined;
  const y = Number(firstReg.slice(0, 4)), md = firstReg.slice(5);
  const afterJan2011 = y > 2011 || (y === 2011 && md >= "01-01");
  if (fuel === "electrique") return "0";
  if (fuel === "hybride_rechargeable" || fuel === "gpl") return "1";
  if (fuel === "essence" || fuel === "hybride") {
    if (afterJan2011) return "1";
    if (y >= 2006) return "2";
    if (y >= 1997) return "3";
    return "Non classé";
  }
  if (fuel === "diesel") {
    if (y > 2011 || (y === 2011 && md >= "01-01")) return "2";
    if (y >= 2006) return "3";
    if (y >= 2001) return "4";
    if (y >= 1997) return "5";
    return "Non classé";
  }
  return undefined;
}

export const apiPlaqueProvider: VehicleProvider = {
  name: "apiplaque",
  async identify(input: IdentifyInput): Promise<Vehicle | null> {
    const key = process.env.PLATE_API_KEY;
    const base = (process.env.PLATE_API_URL || DEFAULT_URL).replace(/\/$/, "");
    if (!key) throw new Error("PLATE_API_KEY manquante");
    const country = input.country === "GB" ? "UK" : input.country;
    if (input.kind === "plate" && !SUPPORTED_COUNTRIES.has(input.country)) return null;
    const cacheKey = `vehicle:${input.kind}:${input.country}:${input.value}`;
    return cached(cacheKey, 24 * 3600, async () => {
      const url = input.kind === "plate"
        ? `${base}/plaque?immatriculation=${encodeURIComponent(input.value)}&token=${encodeURIComponent(key)}&pays=${encodeURIComponent(country)}`
        : `${base}/vin?vin=${encodeURIComponent(input.value)}&token=${encodeURIComponent(key)}`;
      const res = await fetch(url, { method: "POST", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
      if (res.status === 404) return input.kind === "vin" ? decodeFallback(input) : null;
      if (res.status === 401 || res.status === 403) throw new Error("Clé du fournisseur de plaques refusée");
      if (res.status === 402 || res.status === 429) throw new Error("Crédit du fournisseur de plaques épuisé");
      if (!res.ok) throw new Error(`Fournisseur plaque : HTTP ${res.status}`);
      const json = (await res.json()) as Record<string, unknown>;
      const code = Number(json.code_erreur ?? 200);
      if (code === 404) return input.kind === "vin" ? decodeFallback(input) : null;
      if (code >= 400) throw new Error(`Fournisseur plaque : ${String(json.message ?? code)}`);
      return mapApiPlaqueVehicle(json, input) ?? (input.kind === "vin" ? decodeFallback(input) : null);
    });
  },
};

function decodeFallback(input: IdentifyInput): Vehicle | null {
  const b = decodeVinBasic(input.value);
  return b ? { ...b, country: input.country } : null;
}
