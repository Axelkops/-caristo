/**
 * Données publiques utilisées pour le budget et les infos pratiques du rapport.
 * Chaque bloc indique sa source et sa date : à mettre à jour quand les barèmes changent.
 */

/** Taxe régionale par cheval fiscal (barèmes 2026, mis à jour au 1er avril 2026). Sources : eplaque.fr, joinsteer.com. */
export const CARTE_GRISE_UPDATED = "avril 2026";
/** Taxe fixe de gestion (Y.4, 11 €) + redevance d'acheminement (Y.5, 2,76 €). */
export const CARTE_GRISE_FIXED = 13.76;
export const REGIONS: { name: string; perCv: number; /** part de la taxe régionale due par un véhicule électrique */ evShare: number; overseas?: boolean }[] = [
  { name: "Auvergne-Rhône-Alpes", perCv: 43, evShare: 1 },
  { name: "Bourgogne-Franche-Comté", perCv: 60, evShare: 1 },
  { name: "Bretagne", perCv: 60, evShare: 1 },
  { name: "Centre-Val de Loire", perCv: 60, evShare: 1 },
  { name: "Corse", perCv: 53, evShare: 1 },
  { name: "Grand Est", perCv: 60, evShare: 1 },
  { name: "Hauts-de-France", perCv: 43, evShare: 0.5 },
  { name: "Île-de-France", perCv: 68.95, evShare: 1 },
  { name: "Normandie", perCv: 60, evShare: 1 },
  { name: "Nouvelle-Aquitaine", perCv: 58, evShare: 1 },
  { name: "Occitanie", perCv: 59.5, evShare: 1 },
  { name: "Pays de la Loire", perCv: 51, evShare: 1 },
  { name: "Provence-Alpes-Côte d'Azur", perCv: 60, evShare: 1 },
  { name: "Guadeloupe", perCv: 41, evShare: 1, overseas: true },
  { name: "Guyane", perCv: 42.5, evShare: 1, overseas: true },
  { name: "La Réunion", perCv: 60, evShare: 1, overseas: true },
  { name: "Martinique", perCv: 53, evShare: 1, overseas: true },
  { name: "Mayotte", perCv: 30, evShare: 1, overseas: true },
];

/** Restrictions de circulation par vignette (ZFE). Situation de novembre 2026 : ZFE maintenues après la censure du Conseil constitutionnel (21 mai 2026). */
export const ZFE_UPDATED = "novembre 2026";
export const ZFE_BY_CRITAIR: Record<string, { tone: "ok" | "warn" | "bad"; text: string }> = {
  "0": { tone: "ok", text: "Accès à toutes les zones à faibles émissions (ZFE), sans restriction." },
  "1": { tone: "ok", text: "Accès à toutes les zones à faibles émissions (ZFE), sans restriction." },
  "2": { tone: "ok", text: "Aucune restriction dans les zones à faibles émissions (ZFE) aujourd'hui." },
  "3": { tone: "warn", text: "Interdit dans la zone à faibles émissions de Lyon, et dans celle du Grand Paris en semaine de 8 h à 20 h (amendes prévues à partir de 2027). D'autres villes peuvent suivre." },
  "4": { tone: "bad", text: "Interdit dans les zones à faibles émissions actives : Grand Paris, Lyon, Grenoble, Rouen… Vérifiez les règles de votre ville avant d'acheter." },
  "5": { tone: "bad", text: "Interdit dans la plupart des zones à faibles émissions : Grand Paris, Lyon, Grenoble, Rouen, Marseille, Strasbourg… Vérifiez les règles de votre ville avant d'acheter." },
  "Non classé": { tone: "bad", text: "Pas de vignette possible : interdit dans toutes les zones à faibles émissions actives. Vérifiez les règles de votre ville avant d'acheter." },
};

/** Prix de secours si la source ouverte ne répond pas. Moyennes nationales du 5 novembre 2026 (prix-carburant.eu) et Tarif Bleu EDF option Base au 1er août 2026. */
export const ENERGY_PRICES_FALLBACK = { gazole: 2.23, e10: 2.06, gpl: 1.07, e85: 0.9, electricity: 0.2, date: "2026-11-05" };

/** Kilométrage annuel moyen d'une voiture en France (CCFA, données 2024). */
export const ANNUAL_KM = { ensemble: 11620, diesel: 13180, essence: 10060, electrique: 13510 };

/**
 * Écart entre consommation réelle et homologuée.
 * WLTP (voitures récentes) : +23,7 % en essence, +18,1 % en diesel (Commission européenne, données embarquées, mars 2024).
 * NEDC (avant 2020) : environ +39 % pour les voitures vendues entre 2015 et 2017 (ICCT, From laboratory to road), moins pour les plus anciennes.
 */
export function realWorldFactor(fuel: "essence" | "diesel" | "gpl", year: number): number {
  if (year >= 2020) return fuel === "diesel" ? 1.18 : 1.24;
  if (year >= 2014) return 1.38;
  if (year >= 2010) return 1.3;
  return 1.2;
}

/** Consommation électrique moyenne à la prise, pertes de recharge comprises (kWh/100 km), par gabarit. */
export const EV_KWH_PER_100 = { petite: 15, compacte: 17, familiale: 19, grande: 21 };

/** Prix moyen d'un contrôle technique (2026) : environ 78 € pour une thermique, 95 à 150 € pour une électrique ou hybride. */
export const CT_PRICE = { thermique: 80, electrique: 110 };

/**
 * Garantie constructeur d'origine habituelle (véhicules récents). Sources : capcar.fr (janvier 2026), linkar-app.com.
 * km : limite kilométrique (undefined = illimité). Les marques absentes : 2 ans, kilométrage illimité.
 */
export const WARRANTY_BY_MAKE: Record<string, { years: number; km?: number; extra?: string; uncertain?: boolean }> = {
  kia: { years: 7, km: 150000 },
  hyundai: { years: 5 },
  mg: { years: 7, km: 150000 },
  toyota: { years: 3, km: 100000, extra: "Prolongeable jusqu'à 10 ans si le véhicule est entretenu chaque année dans le réseau Toyota." },
  lexus: { years: 3, km: 100000, extra: "Prolongeable jusqu'à 10 ans si le véhicule est entretenu chaque année dans le réseau Lexus." },
  dacia: { years: 3, km: 100000 },
  honda: { years: 3, km: 100000 },
  mazda: { years: 3, km: 100000 },
  suzuki: { years: 3, km: 100000 },
  nissan: { years: 3, km: 100000 },
  mitsubishi: { years: 5, km: 100000 },
  "land rover": { years: 3, km: 100000 },
  alpine: { years: 3, km: 100000 },
  tesla: { years: 4, km: 80000 },
  bmw: { years: 2, uncertain: true },
  volvo: { years: 2, uncertain: true },
};
export const STELLANTIS_MAKES = ["peugeot", "citroen", "ds", "opel", "fiat", "alfa romeo", "jeep", "lancia", "abarth"];
