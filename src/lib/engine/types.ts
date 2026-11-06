/** Types du moteur Caristo. Tout le rapport est construit à partir de ces structures. */
import type { Checklist } from "./checklist";

export type Fuel = "diesel" | "essence" | "hybride" | "hybride_rechargeable" | "electrique" | "gpl" | "autre";
export type Gearbox = "manuelle" | "automatique" | "inconnue";
export type VehicleCategory = "voiture" | "utilitaire" | "moto" | "collection" | "autre";

/** Fiche technique : ce que l'on sait du véhicule à partir de la plaque ou du VIN. */
export interface Vehicle {
  make: string;
  model: string;
  version?: string;
  vin?: string;
  plate?: string;
  country: string; // code ISO (FR, DE, ES...)
  firstRegistration?: string; // YYYY-MM-DD
  firstRegistrationInCountry?: string; // YYYY-MM-DD (date d'entrée dans le pays actuel)
  fuel: Fuel;
  gearbox: Gearbox;
  powerHp?: number;
  powerKw?: number;
  fiscalPower?: number;
  displacementCc?: number;
  co2?: number;
  critAir?: string;
  engineCode?: string;
  category: VehicleCategory;
  bodyType?: string;
  seats?: number;
  color?: string;
  imported?: boolean;
  /** true tant que le véhicule n'a pas été identifié chez le fournisseur (identification après paiement) */
  pending?: boolean;
}

export interface MileageReading {
  date: string; // YYYY-MM-DD
  mileage: number;
  source: "controle_technique" | "annonce" | "declaration" | "carnet";
}

export interface Inspection {
  date: string;
  kind: "periodique" | "contre_visite" | "import" | "autre";
  mileage?: number;
  result: "favorable" | "defavorable" | "contre_visite" | "inconnu";
  defects?: string;
}

export interface Claim {
  date: string;
  kind: string; // "procédure VE", "sinistre expertisé"...
  description?: string;
}

/** Historique officiel (disponible uniquement pour les véhicules immatriculés en France). */
export interface OfficialHistory {
  available: boolean;
  reason?: string; // pourquoi indisponible
  /** true quand le client n'a pas fourni la carte grise : historique non demandé (pas une panne) */
  notRequested?: boolean;
  ownersCount?: number;
  pledge?: boolean; // gage
  opposition?: boolean;
  stolen?: boolean;
  damagedProcedure?: boolean; // VE / VEI
  inspections: Inspection[];
  mileageReadings: MileageReading[];
  claims: Claim[];
  retrievedAt?: string;
}

export interface Recall {
  date: string;
  title: string;
  description?: string;
  reference?: string;
  status: "open" | "done" | "unknown";
}

export type Severity = "high" | "medium" | "low" | "info";

export interface KnownIssue {
  id: string;
  title: string; // libellé simple
  severity: Severity;
  fromKm?: number; // apparition fréquente dès
  peakKm?: number;
  fromYears?: number;
  description: string; // phrase simple
  costMin?: number;
  costMax?: number;
  whatToCheck: string;
  /** Calculé pour CE véhicule */
  applies?: boolean;
  inZone?: boolean;
}

export interface Valuation {
  low: number;
  high: number;
  mid: number;
  currency: "EUR";
  basis: string;
  askingPrice?: number;
  verdict?: "sous_la_cote" | "dans_la_cote" | "au_dessus";
  deltaToHigh?: number;
}

export interface MaintenanceItem {
  label: string;
  rule: string; // préconisation
  lastDoneLabel?: string;
  dueKm?: number;
  dueDate?: string;
  /** échéance en clair, relative au véhicule : « Dans 2 000 km », « Maintenant »… */
  when?: string;
  /** précision : « vers 120 000 km, au plus tard mars 2027 » */
  whenDetail?: string;
  /** échéance estimée en mois (négatif = dépassée), sert au tri chronologique */
  dueInMonths?: number;
  horizon: "now" | "12" | "24" | "36" | "later";
  status: "todo" | "check" | "ok" | "later";
  costMin?: number;
  costMax?: number;
}

export interface MaintenanceSchedule {
  annualKm: number;
  horizons: { key: "now" | "12" | "24" | "36"; projectedKm: number; costMin: number; costMax: number; items: string[] }[];
  items: MaintenanceItem[];
  note: string;
}

export interface ListingAnalysis {
  available: boolean;
  url?: string;
  askingPrice?: number;
  declaredMileage?: number;
  claims: { text: string; status: "ok" | "warning" | "missing"; detail?: string }[];
}

export interface SellerQuestion {
  priority: number;
  text: string;
}

export interface ReportData {
  id: string;
  reference: string; // CAR-2026-00001
  issuedAt: string;
  vehicle: Vehicle;
  mileage?: number;
  score: "A" | "B" | "C" | "D" | "E";
  /** avertissements affichés en tête du rapport (ex. plaque qui ne correspond pas à la carte grise) */
  warnings?: string[];
  /** indice de confiance 0–100 (100 = aucune alerte) */
  scorePercent: number;
  scoreLabel: string;
  scoreReasons: string[];
  history: OfficialHistory;
  mileageCheck: { consistent: boolean | null; annualKm?: number; comment: string };
  recalls: Recall[];
  knownIssues: KnownIssue[];
  valuation?: Valuation;
  maintenance: MaintenanceSchedule;
  listing: ListingAnalysis;
  questions: SellerQuestion[];
  /** points à vérifier avant l'achat, construits pour ce véhicule */
  checklist: Checklist;
  sources: { label: string; status: "ok" | "partial" | "none"; detail?: string }[];
  limits: string[];
}
