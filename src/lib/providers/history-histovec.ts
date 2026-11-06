import { randomUUID } from "node:crypto";
import type { Claim, Inspection, MileageReading, OfficialHistory } from "../engine/types";
import type { HistoryInput, HistoryProvider } from "./index";

/*
 * Historique officiel via HistoVec (ministère de l'Intérieur, service public gratuit).
 *
 * L'interrogation se fait « par données » : les informations de la carte grise saisies par le client
 * (titulaire, immatriculation, numéro de formule) sont envoyées telles quelles à HistoVec, qui ne
 * répond que si elles correspondent exactement au certificat d'immatriculation en cours.
 * Aucune société privée n'intervient. Si le service refuse ou ne reconnaît pas les données,
 * le rapport indique simplement que l'historique officiel n'est pas disponible.
 *
 * Réponse exploitée : situation administrative (gages, oppositions, saisies, suspensions),
 * état (vol, nombre de titulaires, procédures VE), import, et contrôles techniques (date, nature,
 * résultat, kilométrage relevé).
 */

const DEFAULT_URL = "https://histovec.interieur.gouv.fr/histovec/api/v1";
const TIMEOUT_MS = 20_000;
const SIV_PLATE = /^[A-Z]{2}-?\d{3}-?[A-Z]{2}$/;
const COMPANY_WORDS = /\b(SARL|SAS|SASU|EURL|SA|SCI|SNC|SCP|SELARL|GIE|ASSOCIATION|SOCIETE|SOCIÉTÉ|STE|ETS|ENTREPRISE|GARAGE|AUTO(MOBILE)?S?|LOCATION|LEASING|LEASE|RENT|BANQUE|CREDIT|CRÉDIT|FINANCE|ARVAL|ALD|AYVENS|LEASYS|DIAC|CGI|MAIRIE|COMMUNE|CONSEIL|DEPARTEMENT|DÉPARTEMENT|REGION|RÉGION|HOPITAL|HÔPITAL|FRANCE|GROUPE?)\b/i;

export interface HistovecCT { date?: string; nature?: string; nature_libelle?: string; resultat?: string; resultat_libelle?: string; km?: number | string }
export interface HistovecResponse {
  vehicule?: {
    date_mise_a_jour?: string;
    certificat_immatriculation?: { date_premiere_immatriculation?: string; etat?: { duplicata?: boolean; annule?: boolean; perdu?: boolean; vole?: boolean } };
    etat?: {
      nombre_de_titulaires?: number | string;
      vole?: boolean;
      procedures_ve?: { date_derniere_procedure_ve?: string; date_fin_derniere_procedure_ve?: string; apte_a_circuler?: boolean; nombre_de_procedures_ve?: number | string; procedure_ve_en_cours?: boolean };
    };
    historique?: { date?: string; type?: string; date_annulation?: string }[];
    import_en_france?: { vehicule_importe_depuis_etranger?: boolean; date_import?: string; date_premiere_immatriculation_etranger?: string };
    situation_administrative?: {
      declarations_valant_saisie?: { date?: string; nom_personne_morale?: string }[];
      gages?: { date?: string; nom_creancier?: string }[];
      opposition?: { oves?: { date?: string }[]; oveis?: { date?: string }[]; otcis?: { date?: string }[]; otcis_pv?: { date?: string }[] };
      suspensions?: { date?: string; motif?: string; remise_du_titre?: string; retrait_du_titre?: string }[];
    };
  };
  controles_techniques?: { date_mise_a_jour?: string; historique?: HistovecCT[]; donnee_disponible?: boolean; erreur?: string };
}

const unavailable = (reason: string): OfficialHistory => ({ available: false, reason, inspections: [], mileageReadings: [], claims: [] });

/** Date HistoVec (ISO, ISO+heure ou JJ/MM/AAAA) → AAAA-MM-JJ, ou undefined. */
export function toIsoDate(raw: unknown): string | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;
  const v = raw.trim();
  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return undefined;
}

const num = (raw: unknown): number | undefined => {
  if (raw === null || raw === undefined || raw === "") return undefined;
  const n = Number(String(raw).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
};

/** « DOUILLARD AXEL » → nom + prénoms, dans l'ordre de la carte grise (nom d'abord). */
export function splitHolder(holder: string, reversed = false): { nom: string; prenoms: string[] } {
  const parts = holder.trim().toUpperCase().replace(/\s+/g, " ").split(" ").filter(Boolean);
  if (parts.length <= 1) return { nom: parts[0] ?? "", prenoms: [] };
  if (reversed) return { nom: parts[parts.length - 1], prenoms: parts.slice(0, -1) };
  return { nom: parts[0], prenoms: parts.slice(1) };
}

export function looksLikeCompany(holder: string): boolean {
  return COMPANY_WORDS.test(holder) || /\d{9}/.test(holder);
}

/** Construit le corps de la requête « report_by_data » (exporté pour les tests). */
export function buildPayload(input: HistoryInput, variant: "particulier" | "particulier-inverse" | "personne-morale"): Record<string, unknown> | null {
  const plate = (input.plate ?? input.vehicle.plate ?? "").toUpperCase().replace(/\s+/g, "");
  if (!plate || !input.holderName) return null;
  const siv = SIV_PLATE.test(plate);
  const immat = siv ? plate.replace(/^([A-Z]{2})-?(\d{3})-?([A-Z]{2})$/, "$1-$2-$3") : plate;
  const titulaire = variant === "personne-morale"
    ? { personne_morale: { raison_sociale: input.holderName.trim().toUpperCase(), siren: "000000000" } }
    : { particulier: splitHolder(input.holderName, variant === "particulier-inverse") };
  const certificat: Record<string, unknown> = { titulaire, numero_immatriculation: immat };
  if (siv) {
    const formule = (input.formulaNumber ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!/^\d{2,4}[A-Z]{2}\d{5}$/.test(formule)) return null;
    certificat.numero_formule = formule;
  } else {
    // Ancienne immatriculation (FNI) : HistoVec demande la date d'émission du certificat ; à défaut, la date de 1re immatriculation.
    const d = toIsoDate(input.firstRegDate);
    if (!d) return null;
    certificat.date_emission_certificat_immatriculation = d;
  }
  return { uuid: randomUUID(), vehicule: { certificat_immatriculation: certificat }, options: { controles_techniques: true, ignore_utac_cache: false } };
}

/** Transforme la réponse HistoVec en historique Caristo (exporté pour les tests). */
export function mapResponse(data: HistovecResponse): OfficialHistory {
  const v = data.vehicule ?? {};
  const sit = v.situation_administrative ?? {};
  const opp = sit.opposition ?? {};
  const ve = v.etat?.procedures_ve ?? {};
  const ct = data.controles_techniques;

  const inspections: Inspection[] = [];
  const mileageReadings: MileageReading[] = [];
  for (const c of ct?.historique ?? []) {
    const date = toIsoDate(c.date);
    if (!date) continue;
    const nature = (c.nature ?? "").toUpperCase();
    const res = (c.resultat ?? "").toUpperCase();
    const kind: Inspection["kind"] = nature === "VTP" ? "periodique" : nature === "CV" || nature === "CVC" ? "contre_visite" : "autre";
    const result: Inspection["result"] = res === "A" || res === "AP" ? "favorable" : res === "S" || res === "SP" || res === "R" || res === "RP" ? "defavorable" : "inconnu";
    const mileage = num(c.km);
    const defects = result === "defavorable" ? (c.resultat_libelle ?? "Défaillances constatées") : result === "inconnu" && c.resultat_libelle && c.resultat_libelle !== "N/A" ? c.resultat_libelle : undefined;
    inspections.push({ date, kind, mileage, result, defects });
    if (mileage && mileage > 0) mileageReadings.push({ date, mileage, source: "controle_technique" });
  }
  inspections.sort((a, b) => a.date.localeCompare(b.date));
  mileageReadings.sort((a, b) => a.date.localeCompare(b.date));

  const claims: Claim[] = [];
  const nbVe = num(ve.nombre_de_procedures_ve) ?? 0;
  const lastVe = toIsoDate(ve.date_derniere_procedure_ve);
  if (nbVe > 0 || lastVe || ve.procedure_ve_en_cours) {
    const end = toIsoDate(ve.date_fin_derniere_procedure_ve);
    claims.push({
      date: lastVe ?? "",
      kind: ve.procedure_ve_en_cours ? "Procédure « véhicule endommagé » en cours" : "Procédure « véhicule endommagé » (VE)",
      description: [nbVe > 1 ? `${nbVe} procédures enregistrées.` : undefined, end ? `Dernière procédure levée le ${fr(end)}.` : undefined, ve.apte_a_circuler === false ? "Le véhicule est déclaré inapte à circuler." : undefined].filter(Boolean).join(" ") || undefined,
    });
  }
  for (const s of sit.suspensions ?? []) {
    const d = toIsoDate(s.date);
    claims.push({ date: d ?? "", kind: "Suspension d'immatriculation", description: s.motif ? `Motif : ${s.motif}.` : undefined });
  }
  for (const s of sit.declarations_valant_saisie ?? []) {
    const d = toIsoDate(s.date);
    claims.push({ date: d ?? "", kind: "Déclaration valant saisie", description: s.nom_personne_morale ? `Au profit de : ${s.nom_personne_morale}.` : undefined });
  }

  const oppositions = [...(opp.oves ?? []), ...(opp.oveis ?? []), ...(opp.otcis ?? []), ...(opp.otcis_pv ?? [])];
  return {
    available: true,
    ownersCount: num(v.etat?.nombre_de_titulaires),
    pledge: (sit.gages?.length ?? 0) > 0,
    opposition: oppositions.length > 0 || (sit.declarations_valant_saisie?.length ?? 0) > 0,
    stolen: Boolean(v.etat?.vole),
    damagedProcedure: Boolean(ve.procedure_ve_en_cours) || nbVe > 0,
    inspections,
    mileageReadings,
    claims,
    retrievedAt: toIsoDate(v.date_mise_a_jour) ?? new Date().toISOString().slice(0, 10),
  };
}

const fr = (iso: string) => iso.split("-").reverse().join("/");

async function callHistovec(payload: Record<string, unknown>): Promise<{ status: number; json?: HistovecResponse; text: string }> {
  const base = (process.env.HISTORY_API_URL || DEFAULT_URL).replace(/\/$/, "");
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}/report_by_data`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json", "User-Agent": "Caristo/1.0 (+https://rapportcaristo.com)" },
      body: JSON.stringify(payload),
      signal: ctl.signal,
      cache: "no-store",
    });
    const text = await res.text();
    let json: HistovecResponse | undefined;
    try { json = JSON.parse(text); } catch { json = undefined; }
    return { status: res.status, json, text };
  } finally {
    clearTimeout(timer);
  }
}

export const histovecHistoryProvider: HistoryProvider = {
  name: "histovec",
  async fetchHistory(input: HistoryInput): Promise<OfficialHistory> {
    if (input.vehicle.country !== "FR") return unavailable("L'historique officiel n'existe que pour les véhicules immatriculés en France.");
    if (!input.holderName || !(input.plate ?? input.vehicle.plate)) return unavailable("Informations de la carte grise manquantes : l'historique officiel n'a pas pu être ouvert.");

    const variants: ("particulier" | "particulier-inverse" | "personne-morale")[] = looksLikeCompany(input.holderName)
      ? ["personne-morale", "particulier", "particulier-inverse"]
      : ["particulier", "particulier-inverse", "personne-morale"];
    let notFound = false;
    for (const variant of variants) {
      const payload = buildPayload(input, variant);
      if (!payload) return unavailable("Les informations de la carte grise ne sont pas au format attendu par le service officiel (numéro de formule ou immatriculation).");
      let r: Awaited<ReturnType<typeof callHistovec>>;
      try {
        r = await callHistovec(payload);
      } catch (e) {
        const msg = e instanceof Error && e.name === "AbortError" ? "délai dépassé" : "service injoignable";
        return unavailable(`Le service officiel (HistoVec) n'a pas répondu (${msg}). L'historique pourra être demandé au vendeur.`);
      }
      if (r.status === 200 && r.json?.vehicule) {
        const h = mapResponse(r.json);
        if (r.json.controles_techniques?.donnee_disponible === false) h.reason = "Contrôles techniques momentanément indisponibles côté service officiel.";
        return h;
      }
      if (r.status === 404) { notFound = true; continue; }
      if (r.status === 400) { notFound = true; continue; }
      if (r.status === 403 || r.status === 429) return unavailable("Le service officiel (HistoVec) a refusé la consultation automatique. L'historique pourra être demandé au vendeur.");
      return unavailable(`Le service officiel (HistoVec) a répondu avec une erreur (${r.status}). L'historique pourra être demandé au vendeur.`);
    }
    return unavailable(notFound
      ? "Le service officiel ne reconnaît pas la combinaison titulaire + immatriculation + numéro de formule saisie. Vérifiez qu'elle correspond exactement à la carte grise actuelle (nom du titulaire tel qu'inscrit en C.1, formule de la carte grise en cours)."
      : "Historique officiel indisponible pour le moment.");
  },
};
