import { ANNUAL_KM, CARTE_GRISE_FIXED, CARTE_GRISE_UPDATED, CT_PRICE, ENERGY_PRICES_FALLBACK, EV_KWH_PER_100, REGIONS, STELLANTIS_MAKES, WARRANTY_BY_MAKE, ZFE_BY_CRITAIR, ZFE_UPDATED, realWorldFactor } from "../data/ownership";
import { estimateNewPrice, estimateValuation } from "./valuation";
import { vehicleAgeYears } from "./known-issues";
import type { MaintenanceSchedule, OfficialHistory, Ownership, Valuation, Vehicle } from "./types";

export interface EnergyPrices { gazole: number; e10: number; gpl: number; e85: number; electricity: number; date: string }

const round = (n: number, step = 10) => Math.round(n / step) * step;
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const addYears = (iso: string, y: number) => { const d = new Date(iso); d.setFullYear(d.getFullYear() + y); return d.toISOString().slice(0, 10); };
const monthsBetween = (a: Date, b: Date) => (b.getTime() - a.getTime()) / (30.44 * 24 * 3600 * 1000);

/** Coût de la carte grise pour l'acheteur, dans chaque région. */
export function carteGriseCost(vehicle: Vehicle, now = new Date()): Ownership["registration"] {
  if (vehicle.country !== "FR" || !vehicle.fiscalPower) return undefined;
  const halved = vehicleAgeYears(vehicle, now) >= 10;
  const ev = vehicle.fuel === "electrique";
  const regions = REGIONS.map((r) => {
    const regional = vehicle.fiscalPower! * r.perCv * (halved ? 0.5 : 1) * (ev ? r.evShare : 1);
    return { name: r.name, total: Math.round((regional + CARTE_GRISE_FIXED) * 100) / 100, overseas: !!r.overseas };
  });
  const metro = regions.filter((r) => !r.overseas).map((r) => r.total);
  const notes = [`${vehicle.fiscalPower} chevaux fiscaux`];
  if (halved) notes.push("taxe régionale divisée par deux : véhicule de plus de 10 ans");
  if (ev) notes.push("électrique : réduction de moitié en Hauts-de-France seulement");
  return {
    fiscalPower: vehicle.fiscalPower,
    halved,
    regions,
    min: Math.min(...metro),
    max: Math.max(...metro),
    average: Math.round(metro.reduce((a, b) => a + b, 0) / metro.length),
    note: `${notes.join(", ")}. Barèmes régionaux de ${CARTE_GRISE_UPDATED}, frais fixes de ${CARTE_GRISE_FIXED.toLocaleString("fr-FR")} € compris.`,
  };
}

/** Vignette Crit'Air et circulation dans les zones à faibles émissions. */
export function critAirInfo(vehicle: Vehicle): Ownership["critAir"] {
  if (vehicle.country !== "FR" || !vehicle.critAir) return undefined;
  const z = ZFE_BY_CRITAIR[vehicle.critAir];
  if (!z) return undefined;
  return { level: vehicle.critAir, tone: z.tone, zfe: z.text, updated: ZFE_UPDATED };
}

function evSize(vehicle: Vehicle): keyof typeof EV_KWH_PER_100 {
  const p = estimateNewPrice({ ...vehicle, fuel: "essence", powerHp: undefined });
  return p <= 16000 ? "petite" : p <= 25000 ? "compacte" : p <= 36000 ? "familiale" : "grande";
}

/** Consommation réelle estimée et budget énergie annuel. */
export function energyBudget(vehicle: Vehicle, prices: EnergyPrices = ENERGY_PRICES_FALLBACK): Ownership["energy"] {
  const year = vehicle.firstRegistration ? Number(vehicle.firstRegistration.slice(0, 4)) : 2015;
  if (vehicle.fuel === "electrique") {
    const per100 = EV_KWH_PER_100[evSize(vehicle)];
    const annualKm = ANNUAL_KM.electrique;
    return { unit: "kWh", per100, annualKm, price: prices.electricity, priceDate: prices.date, annualCost: round((annualKm / 100) * per100 * prices.electricity), energyLabel: "électricité, recharge à domicile", basis: "Consommation moyenne d'une électrique de ce gabarit, pertes de recharge comprises. Recharger sur bornes rapides coûte 2 à 3 fois plus cher." };
  }
  if (vehicle.fuel === "hybride_rechargeable" || !vehicle.co2) return undefined;
  const kind = vehicle.fuel === "diesel" ? "diesel" : vehicle.fuel === "gpl" ? "gpl" : "essence";
  const factor = kind === "gpl" ? 16.6 : kind === "diesel" ? 26.4 : 23.1; // g de CO2 par 0,01 L
  const per100 = Math.round(((vehicle.co2 / factor) * realWorldFactor(kind, year)) * 10) / 10;
  if (!(per100 > 2 && per100 < 25)) return undefined;
  const annualKm = kind === "diesel" ? ANNUAL_KM.diesel : vehicle.fuel === "hybride" ? ANNUAL_KM.ensemble : ANNUAL_KM.essence;
  const price = kind === "diesel" ? prices.gazole : kind === "gpl" ? prices.gpl : prices.e10;
  return { unit: "L", per100, annualKm, price, priceDate: prices.date, annualCost: round((annualKm / 100) * per100 * price), energyLabel: kind === "diesel" ? "gazole" : kind === "gpl" ? "GPL" : "SP95-E10", basis: `Calculée à partir du CO2 de la carte grise (${vehicle.co2} g/km), corrigée de l'écart moyen entre homologation et conduite réelle.` };
}

/** Garanties constructeur et batterie encore en cours, ou terminées. */
export function warranties(vehicle: Vehicle, mileage: number | undefined, now = new Date()): Ownership["warranties"] {
  if (!vehicle.firstRegistration) return [];
  const make = norm(vehicle.make);
  const age = vehicleAgeYears(vehicle, now);
  const km = mileage ?? 0;
  const out: Ownership["warranties"] = [];
  const w = Object.entries(WARRANTY_BY_MAKE).find(([k]) => make.includes(k))?.[1] ?? { years: 2 };
  const until = addYears(vehicle.firstRegistration, w.years);
  const limit = w.km ? ` ou ${w.km.toLocaleString("fr-FR")} km` : ", kilométrage illimité";
  const active = age < w.years && (!w.km || km < w.km);
  out.push({
    label: "Garantie constructeur",
    status: active ? (w.uncertain ? "check" : "active") : "ended",
    detail: active ? `En cours jusqu'au ${fmt(until)}${w.km ? `, dans la limite de ${w.km.toLocaleString("fr-FR")} km` : ""}${w.uncertain ? " (durée à confirmer : 2 ou 3 ans selon l'année)" : ""}. Elle suit le véhicule : demander le carnet d'entretien à jour.` : `Terminée : ${w.years} ans${limit} depuis la mise en circulation.${w.extra ? " " + w.extra : ""}`,
  });
  if (w.extra && active) out[0].detail += ` ${w.extra}`;
  const isStellantis = STELLANTIS_MAKES.some((m) => make.includes(m));
  if (isStellantis && Number(vehicle.firstRegistration.slice(0, 4)) >= 2024 && age < 8 && km < 160000) {
    out.push({ label: "Extension de garantie", status: "check", detail: "Les véhicules récents entretenus dans le réseau de la marque peuvent être garantis jusqu'à 8 ans ou 160 000 km. Demander au vendeur les factures d'entretien en concession." });
  }
  if (vehicle.fuel === "electrique" || vehicle.fuel === "hybride_rechargeable") {
    const bUntil = addYears(vehicle.firstRegistration, 8);
    const bActive = age < 8 && km < 160000;
    out.push({ label: "Garantie de la batterie", status: bActive ? "active" : "ended", detail: bActive ? `Habituellement 8 ans ou 160 000 km, soit jusqu'au ${fmt(bUntil)} environ : la batterie est remplacée ou réparée si sa capacité passe sous 70 %. Conditions à confirmer avec la marque.` : "Terminée (habituellement 8 ans ou 160 000 km). Demander un certificat d'état de la batterie avant d'acheter." });
  } else if (vehicle.fuel === "hybride") {
    const toyota = make.includes("toyota") || make.includes("lexus");
    out.push({ label: "Garantie du système hybride", status: toyota ? (age < 5 && km < 100000 ? "active" : "check") : "check", detail: toyota ? (age < 5 && km < 100000 ? `En cours jusqu'au ${fmt(addYears(vehicle.firstRegistration, 5))} (5 ans ou 100 000 km). Prolongeable avec un contrôle annuel du système hybride dans le réseau.` : "Garantie de base terminée (5 ans ou 100 000 km). Elle peut avoir été prolongée par un contrôle annuel dans le réseau : demander les justificatifs.") : "Durée variable selon la marque, souvent 5 à 8 ans : à confirmer avec le vendeur et la marque." });
  }
  return out;
}

/** Kilométrage du véhicule comparé à la moyenne française pour son âge et son énergie. */
export function mileageVsAverage(vehicle: Vehicle, mileage: number | undefined, now = new Date()): Ownership["mileageVsAverage"] {
  const age = vehicleAgeYears(vehicle, now);
  if (!mileage || age < 1) return undefined;
  const perYear = vehicle.fuel === "diesel" ? ANNUAL_KM.diesel : vehicle.fuel === "electrique" ? ANNUAL_KM.electrique : vehicle.fuel === "essence" ? ANNUAL_KM.essence : ANNUAL_KM.ensemble;
  const expected = round(age * perYear, 1000);
  const deltaPct = Math.round(((mileage - expected) / expected) * 100);
  const verdict = deltaPct <= -30 ? "faible" : deltaPct >= 30 ? "eleve" : "normal";
  const fuelWord = vehicle.fuel === "diesel" ? "un diesel" : vehicle.fuel === "electrique" ? "une électrique" : vehicle.fuel === "essence" ? "une essence" : "une voiture";
  const comment = verdict === "faible" ? `Nettement moins que la moyenne pour ${fuelWord} de cet âge. C'est un atout, à condition que l'historique le confirme. Un véhicule qui roule peu en ville s'use aussi : batterie, freins, filtre à particules.` : verdict === "eleve" ? `Nettement plus que la moyenne pour ${fuelWord} de cet âge. Usure à surveiller (embrayage, trains roulants), mais de longs trajets sur route usent moins qu'un usage urbain.` : `Dans la moyenne pour ${fuelWord} de cet âge.`;
  return { expected, actual: mileage, deltaPct, verdict, perYear, comment };
}

/** Prochain contrôle technique : 4 ans après la mise en circulation, puis tous les 2 ans. */
export function nextInspection(vehicle: Vehicle, history: OfficialHistory, now = new Date()): Ownership["nextInspection"] {
  if (vehicle.country !== "FR" || !vehicle.firstRegistration || vehicle.category === "moto") return undefined;
  const age = vehicleAgeYears(vehicle, now);
  const last = [...history.inspections].filter((i) => i.kind === "periodique" || i.kind === "contre_visite").sort((a, b) => b.date.localeCompare(a.date))[0];
  let due: string;
  if (last) due = addYears(last.date, 2);
  else if (age < 4) due = addYears(vehicle.firstRegistration, 4);
  else { let d = addYears(vehicle.firstRegistration, 4); while (new Date(d) < now) d = addYears(d, 2); due = d; }
  const overdue = new Date(due) < now;
  const sale = age >= 4 ? (last ? (monthsBetween(new Date(last.date), now) > 6 ? `Le dernier contrôle date de plus de 6 mois : le vendeur doit en fournir un de moins de 6 mois pour vendre.` : "Le dernier contrôle a moins de 6 mois : il est valable pour la vente.") : "Pour vendre un véhicule de plus de 4 ans, le vendeur doit fournir un contrôle technique de moins de 6 mois.") : "Pas de contrôle obligatoire pour vendre un véhicule de moins de 4 ans.";
  return { date: due, overdue, estimated: !last, detail: sale };
}

/** Valeur estimée dans 1, 2 et 3 ans, en roulant la moyenne française. */
export function futureValues(vehicle: Vehicle, mileage: number | undefined, now = new Date()): Ownership["futureValues"] {
  const perYear = vehicle.fuel === "diesel" ? ANNUAL_KM.diesel : vehicle.fuel === "electrique" ? ANNUAL_KM.electrique : ANNUAL_KM.essence;
  const km = mileage ?? Math.round(vehicleAgeYears(vehicle, now) * perYear);
  return [1, 2, 3].map((n) => {
    const later = new Date(now); later.setFullYear(later.getFullYear() + n);
    return { years: n, value: estimateValuation(vehicle, km + n * perYear, undefined, later).mid };
  });
}

/** Coût total de possession sur 3 ans : perte de valeur, énergie, entretien, carte grise, contrôles techniques. Hors assurance et stationnement. */
export function threeYearCost(args: { vehicle: Vehicle; valuation?: Valuation; askingPrice?: number; maintenance: MaintenanceSchedule; registration: Ownership["registration"]; energy: Ownership["energy"]; future: Ownership["futureValues"]; inspection: Ownership["nextInspection"]; now: Date }): Ownership["threeYears"] {
  const { valuation, askingPrice, maintenance, registration, energy, future, inspection, vehicle, now } = args;
  if (!valuation || !future?.length) return undefined;
  const purchase = askingPrice ?? valuation.mid;
  const resale = future[future.length - 1].value;
  const depreciation = Math.max(0, purchase - resale);
  const energyCost = energy ? energy.annualCost * 3 : 0;
  const maint = round(maintenance.horizons.reduce((s, h) => s + (h.costMin + h.costMax) / 2, 0), 50);
  const reg = registration ? Math.round(registration.average) : 0;
  let cts = 0;
  if (inspection) { let d = new Date(inspection.date); const end = new Date(now); end.setFullYear(end.getFullYear() + 3); if (d < now) d = new Date(now); while (d <= end) { cts++; d = new Date(d); d.setFullYear(d.getFullYear() + 2); } }
  const ctPrice = vehicle.fuel === "electrique" || vehicle.fuel.startsWith("hybride") ? CT_PRICE.electrique : CT_PRICE.thermique;
  const inspections = cts * ctPrice;
  const total = round(depreciation + energyCost + maint + reg + inspections, 50);
  return { purchase, purchaseBasis: askingPrice ? "annonce" : "cote", resale, depreciation, energy: energyCost, energyIncluded: !!energy, maintenance: maint, registration: reg, inspections, total, perMonth: round(total / 36, 5) };
}

export function buildOwnership(args: { vehicle: Vehicle; mileage?: number; history: OfficialHistory; valuation?: Valuation; askingPrice?: number; maintenance: MaintenanceSchedule; prices?: EnergyPrices; now?: Date }): Ownership {
  const now = args.now ?? new Date();
  const { vehicle, mileage } = args;
  const registration = carteGriseCost(vehicle, now);
  const energy = energyBudget(vehicle, args.prices);
  const future = args.valuation ? futureValues(vehicle, mileage, now) : undefined;
  const inspection = nextInspection(vehicle, args.history, now);
  return {
    registration,
    critAir: critAirInfo(vehicle),
    energy,
    warranties: warranties(vehicle, mileage, now),
    mileageVsAverage: mileageVsAverage(vehicle, mileage, now),
    nextInspection: inspection,
    futureValues: future,
    threeYears: threeYearCost({ vehicle, valuation: args.valuation, askingPrice: args.askingPrice, maintenance: args.maintenance, registration, energy, future, inspection, now }),
  };
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
