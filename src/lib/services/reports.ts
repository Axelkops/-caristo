import { and, eq, gt, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { getDb, schema } from "../db";
import type { ListingAnalysis, ReportData, Vehicle } from "../engine/types";
import { buildReport } from "../engine/report";
import { parseDate, parseFormulaNumber, parseMileage, parsePlate, parseVin } from "../engine/identifiers";
import { getHistoryProvider, getListingProvider, getRecallsProvider, getVehicleProvider, identifyAfterPayment, plateCountrySupported } from "../providers";
import { decodeVinBasic } from "../providers/vin-decoder";
import { OFFERS, type Offer } from "./pricing";
import { sendAdminAlert, sendReportReadyEmail, sendVehicleNotFoundEmail } from "./email";
import { refundCheckout } from "./payments";

const nanoid = customAlphabet("0123456789abcdefghijkmnpqrstuvwxyz", 14);
const packCode = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 10);

export class UserError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export interface IdentifyResult {
  reportId: string;
  vehicle: Vehicle;
  inputKind: "plate" | "vin";
  inputValue: string;
  country: string;
  historyPossible: boolean;
}

/** Étape 1 : identifier le véhicule et créer un rapport brouillon. */
export async function identifyAndCreate(raw: { input: string; kind?: "plate" | "vin"; country?: string }): Promise<IdentifyResult> {
  const value = (raw.input ?? "").trim();
  if (!value) throw new UserError("Saisissez une plaque ou un numéro VIN.");
  let kind: "plate" | "vin" = raw.kind ?? "plate";
  let normalized = "";
  let country = (raw.country ?? "FR").toUpperCase();

  const vin = parseVin(value);
  if (kind === "vin" || (vin && value.replace(/[^A-Z0-9a-z]/g, "").length === 17 && !parsePlate(value, country))) {
    if (!vin) throw new UserError("Le numéro VIN doit faire 17 caractères (lettres et chiffres).");
    if (!vin.valid) throw new UserError("Ce VIN contient des caractères interdits (I, O ou Q). Vérifiez la saisie.");
    kind = "vin"; normalized = vin.vin;
  } else {
    const p = parsePlate(value, country);
    if (!p) throw new UserError("Plaque non reconnue. Exemple France : AB-123-CD. Vous pouvez aussi saisir le numéro VIN.");
    kind = "plate"; normalized = p.normalized; country = p.country;
  }

  let vehicle: Vehicle | null;
  if (identifyAfterPayment()) {
    // L'identification chez le fournisseur est payante : elle n'a lieu qu'après le paiement.
    if (kind === "plate" && !(await plateCountrySupported(country))) throw new UserError("Les plaques de ce pays ne sont pas reconnues automatiquement. Utilisez le numéro VIN (case E de la carte grise) ou décrivez le véhicule vous-même.", 422);
    const basic = kind === "vin" ? decodeVinBasic(normalized) : null;
    vehicle = { make: basic?.make ?? "", model: basic?.model ?? "", vin: kind === "vin" ? normalized : undefined, plate: kind === "plate" ? normalized : undefined, country, fuel: "autre", gearbox: "inconnue", category: "voiture", imported: false, pending: true };
  } else {
    const provider = await getVehicleProvider();
    vehicle = await provider.identify({ kind, value: normalized, country });
    if (!vehicle) throw new UserError(kind === "plate" ? "Aucun véhicule trouvé pour cette plaque. Vérifiez la saisie ou utilisez le numéro VIN." : "Aucun véhicule trouvé pour ce VIN.", 404);
  }

  const db = await getDb();
  const id = nanoid();
  await db.insert(schema.reports).values({ id, shareToken: nanoid(), status: "identified", inputKind: kind, inputValue: normalized, country, vehicle });
  return { reportId: id, vehicle, inputKind: kind, inputValue: normalized, country, historyPossible: country === "FR" };
}

export interface DetailsInput {
  mileage: string | number;
  holderName?: string;
  formulaNumber?: string;
  firstRegDate?: string;
  listingUrl?: string;
  email: string;
  offer: Offer;
  packCode?: string;
  /** true = utiliser un crédit du pack rattaché au compte connecté (accountEmail) */
  useAccountPack?: boolean;
}

/** Étape 2 : enregistrer kilométrage, carte grise, e-mail, offre. */
export async function saveDetails(reportId: string, d: DetailsInput, accountEmail?: string | null): Promise<{ status: string; needsPayment: boolean }> {
  const db = await getDb();
  const [r] = await db.select().from(schema.reports).where(eq(schema.reports.id, reportId)).limit(1);
  if (!r) throw new UserError("Rapport introuvable.", 404);
  if (r.status !== "identified" && r.status !== "awaiting_payment" && r.status !== "draft") throw new UserError("Ce rapport est déjà en cours ou terminé.", 409);
  const mileage = parseMileage(d.mileage);
  if (mileage === null) throw new UserError("Kilométrage invalide.");
  const email = (d.email ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new UserError("Adresse e-mail invalide.");
  if (!OFFERS[d.offer]) throw new UserError("Offre inconnue.");

  const update: Partial<typeof schema.reports.$inferInsert> = { mileage, email, offer: d.offer, updatedAt: new Date() };
  const v = r.vehicle as Vehicle;
  if (v.country === "FR") {
    const holder = (d.holderName ?? "").trim();
    if (!d.formulaNumber?.trim() || !holder || !d.firstRegDate?.trim()) throw new UserError("Les trois informations de la carte grise sont nécessaires pour produire le rapport.");
    const formula = parseFormulaNumber(d.formulaNumber);
    const date = parseDate(d.firstRegDate);
    if (!formula) throw new UserError("Numéro de formule invalide : il commence par l’année (4 chiffres), puis 2 lettres et des chiffres (ex. 2021AB12345).");
    if (!date) throw new UserError("Date de première immatriculation invalide (JJ/MM/AAAA).");
    if (holder.length < 2) throw new UserError("Indiquez le nom du titulaire tel qu'il figure sur la carte grise (case C.1).");
    update.formulaNumber = formula;
    update.firstRegDate = date;
    update.holderName = holder;
  }
  if (d.listingUrl) {
    const u = d.listingUrl.trim();
    if (!/^https?:\/\/[^\s]+$/i.test(u)) throw new UserError("Le lien de l'annonce doit commencer par http:// ou https://.");
    update.listingUrl = u;
  }

  // Pack existant : via le compte connecté, ou (secours) via un code
  if (d.useAccountPack || d.packCode) {
    let pack: typeof schema.packs.$inferSelect | undefined;
    if (d.useAccountPack) {
      if (!accountEmail) throw new UserError("Connectez-vous à votre espace pour utiliser votre pack.", 401);
      const rows = await db.select().from(schema.packs).where(and(eq(schema.packs.email, accountEmail), gt(schema.packs.expiresAt, new Date()))).orderBy(schema.packs.expiresAt);
      pack = rows.find((p) => p.creditsUsed < p.creditsTotal);
      if (!pack) throw new UserError("Votre pack n'a plus de crédit disponible (ou a expiré).");
      update.email = accountEmail;
    } else {
      const code = (d.packCode ?? "").trim().toUpperCase();
      [pack] = await db.select().from(schema.packs).where(and(eq(schema.packs.code, code), gt(schema.packs.expiresAt, new Date()))).limit(1);
      if (!pack) throw new UserError("Code de pack inconnu ou expiré.");
      if (pack.creditsUsed >= pack.creditsTotal) throw new UserError("Ce pack n'a plus de crédit disponible.");
    }
    await db.update(schema.packs).set({ creditsUsed: sql`${schema.packs.creditsUsed} + 1` }).where(eq(schema.packs.id, pack.id));
    update.packId = pack.id; update.status = "paid"; update.paidAt = new Date(); update.offer = pack.offer as Offer;
    await db.update(schema.reports).set(update).where(eq(schema.reports.id, reportId));
    void generateReport(reportId).catch(() => undefined);
    return { status: "paid", needsPayment: false };
  }
  update.status = "awaiting_payment";
  await db.update(schema.reports).set(update).where(eq(schema.reports.id, reportId));
  return { status: "awaiting_payment", needsPayment: true };
}

/** Marque le rapport payé (webhook Stripe ou mode démo) et crée le pack si besoin. */
export async function markPaid(reportId: string, stripeSessionId: string | null): Promise<void> {
  const db = await getDb();
  const [r] = await db.select().from(schema.reports).where(eq(schema.reports.id, reportId)).limit(1);
  if (!r) throw new UserError("Rapport introuvable.", 404);
  if (r.status === "paid" || r.status === "generating" || r.status === "ready") return; // idempotent
  let packId: string | null = null;
  const offer = r.offer as Offer;
  if (offer !== "single") {
    const o = OFFERS[offer];
    const expiresAt = new Date(); expiresAt.setMonth(expiresAt.getMonth() + o.validityMonths);
    packId = nanoid();
    await db.insert(schema.packs).values({ id: packId, code: packCode(), email: r.email ?? "", offer, creditsTotal: o.credits, creditsUsed: 1, stripeSessionId: stripeSessionId ? `${stripeSessionId}:pack` : null, expiresAt });
  }
  await db.update(schema.reports).set({ status: "paid", paidAt: new Date(), stripeSessionId: stripeSessionId ?? null, packId, updatedAt: new Date() }).where(eq(schema.reports.id, reportId));
  void generateReport(reportId).catch(() => undefined);
}

/** Génère le rapport complet (après paiement). Tolérant : chaque source peut échouer sans bloquer. */
export async function generateReport(reportId: string): Promise<ReportData> {
  const db = await getDb();
  const [r] = await db.select().from(schema.reports).where(eq(schema.reports.id, reportId)).limit(1);
  if (!r) throw new UserError("Rapport introuvable.", 404);
  if (r.report && r.status === "ready") return r.report as ReportData;
  await db.update(schema.reports).set({ status: "generating", updatedAt: new Date() }).where(eq(schema.reports.id, reportId));
  // Identification payante, faite seulement maintenant que le rapport est payé
  let vehicle = r.vehicle as Vehicle;
  if (vehicle.pending) {
    let found: Vehicle | null;
    try {
      const provider = await getVehicleProvider();
      found = await provider.identify({ kind: r.inputKind as "plate" | "vin", value: r.inputValue, country: r.country });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      await db.update(schema.reports).set({ status: "failed", error: "L'identification du véhicule est momentanément indisponible. Notre équipe a été prévenue et relance votre rapport : vous recevrez un e-mail.", updatedAt: new Date() }).where(eq(schema.reports.id, reportId));
      void sendAdminAlert("Identification impossible", `Rapport ${reportId} (${r.inputValue}) payé mais non identifié : ${msg}\nRelancer après correction : le rapport reste en statut « failed ».`).catch(() => undefined);
      throw e;
    }
    if (!found || found.pending) {
      await refundNotFound(r);
      return Promise.reject(new UserError("Aucun véhicule ne correspond à cette plaque.", 404));
    }
    vehicle = { ...found, pending: undefined };
    await db.update(schema.reports).set({ vehicle }).where(eq(schema.reports.id, reportId));
  }
  try {
    const [historyP, recallsP, listingP] = await Promise.all([getHistoryProvider(), getRecallsProvider(), getListingProvider()]);
    const [history, recalls, listing] = await Promise.all([
      historyP.fetchHistory({ vehicle, plate: r.inputKind === "plate" ? r.inputValue : vehicle.plate, holderName: r.holderName ?? undefined, formulaNumber: r.formulaNumber ?? undefined, firstRegDate: r.firstRegDate ?? undefined }).catch((e: Error) => ({ available: false, reason: `Historique officiel indisponible (${e.message}).`, inspections: [], mileageReadings: [], claims: [] })),
      recallsP.fetchRecalls(vehicle).catch(() => []),
      r.listingUrl ? listingP.analyze(r.listingUrl, vehicle, r.mileage ?? undefined).catch((): ListingAnalysis => ({ available: false, url: r.listingUrl!, claims: [] })) : Promise.resolve<ListingAnalysis>({ available: false, claims: [] }),
    ]);
    const entries = await db.select().from(schema.maintenanceEntries).where(eq(schema.maintenanceEntries.reportId, reportId));
    const reference = `CAR-${new Date().getFullYear()}-${r.id.slice(-6).toUpperCase()}`;
    const report = buildReport({ id: r.id, reference, vehicle, mileage: r.mileage ?? undefined, history, recalls, listing, entries: entries.map((e) => ({ label: e.label, date: e.date, mileage: e.mileage ?? undefined })) });
    if (r.firstRegDate && vehicle.firstRegistration && r.firstRegDate !== vehicle.firstRegistration) {
      const fr = (d: string) => d.split("-").reverse().join("/");
      report.warnings = [`La date de 1re immatriculation saisie (${fr(r.firstRegDate)}) ne correspond pas à celle du véhicule trouvé pour la plaque ${vehicle.plate ?? r.inputValue} (${fr(vehicle.firstRegistration)}). Vérifiez que la plaque saisie est bien celle de la carte grise.`];
    }
    await db.update(schema.reports).set({ report, score: report.score, status: "ready", readyAt: new Date(), updatedAt: new Date(), error: null }).where(eq(schema.reports.id, reportId));
    const [pack] = r.packId ? await db.select().from(schema.packs).where(eq(schema.packs.id, r.packId)).limit(1) : [];
    if (r.email) void sendReportReadyEmail({ to: r.email, reportId: r.id, shareToken: r.shareToken, reference, vehicle, packRemaining: pack ? pack.creditsTotal - pack.creditsUsed : undefined }).catch(() => undefined);
    return report;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.update(schema.reports).set({ status: "failed", error: msg, updatedAt: new Date() }).where(eq(schema.reports.id, reportId));
    throw e;
  }
}

export async function getReport(reportId: string) {
  const db = await getDb();
  const [r] = await db.select().from(schema.reports).where(eq(schema.reports.id, reportId)).limit(1);
  return r ?? null;
}

export async function getPackForReport(packId: string | null) {
  if (!packId) return null;
  const db = await getDb();
  const [p] = await db.select().from(schema.packs).where(eq(schema.packs.id, packId)).limit(1);
  return p ?? null;
}

export async function getReportByToken(token: string) {
  const db = await getDb();
  const [r] = await db.select().from(schema.reports).where(eq(schema.reports.shareToken, token)).limit(1);
  return r ?? null;
}

/** Regénère après ajout d'une facture au carnet (l'échéancier et l'entretien prouvé changent). */
export async function regenerate(reportId: string): Promise<ReportData> {
  const db = await getDb();
  await db.update(schema.reports).set({ status: "paid", report: null }).where(eq(schema.reports.id, reportId));
  return generateReport(reportId);
}

export async function addMaintenanceEntry(reportId: string, e: { date: string; mileage?: string | number; label: string; cost?: string | number; kind?: string }) {
  const db = await getDb();
  const [r] = await db.select().from(schema.reports).where(eq(schema.reports.id, reportId)).limit(1);
  if (!r || r.status !== "ready") throw new UserError("Rapport introuvable ou non finalisé.", 404);
  const date = parseDate(e.date);
  if (!date) throw new UserError("Date invalide (JJ/MM/AAAA).");
  const label = (e.label ?? "").trim();
  if (label.length < 3) throw new UserError("Indiquez l'intervention (ex. Vidange + filtres).");
  const mileage = e.mileage !== undefined && e.mileage !== "" ? parseMileage(e.mileage) : null;
  if (e.mileage !== undefined && e.mileage !== "" && mileage === null) throw new UserError("Kilométrage invalide.");
  const cost = e.cost !== undefined && e.cost !== "" ? parseMileage(e.cost) : null;
  await db.insert(schema.maintenanceEntries).values({ id: nanoid(), reportId, date, mileage, label, cost, kind: e.kind ?? "invoice" });
  return regenerate(reportId);
}

/** Aucun véhicule pour la plaque payée : remboursement (carte) ou crédit rendu (pack), puis e-mail au client. */
async function refundNotFound(r: typeof schema.reports.$inferSelect): Promise<void> {
  const db = await getDb();
  let refundKind: "card" | "credit" | "none" = "none";
  let note = "Aucun véhicule ne correspond à cette plaque. ";
  try {
    if (r.packId && !(r.stripeSessionId && r.offer === "single")) {
      // crédit d'un pack (achat du pack ou crédit déjà acquis) : on rend le crédit
      await db.update(schema.packs).set({ creditsUsed: sql`greatest(${schema.packs.creditsUsed} - 1, 0)` }).where(eq(schema.packs.id, r.packId));
      refundKind = "credit"; note += "Le crédit a été rendu à votre pack.";
    } else if (r.stripeSessionId) {
      await refundCheckout(r.stripeSessionId);
      refundKind = "card"; note += "Votre paiement a été remboursé (5 à 10 jours selon votre banque).";
    } else {
      note += "Aucun montant n'a été débité.";
    }
  } catch (e) {
    note += "Le remboursement sera traité manuellement sous 5 jours ouvrés.";
    void sendAdminAlert("Remboursement à faire", `Rapport ${r.id} (${r.inputValue}) : véhicule introuvable, remboursement automatique impossible : ${e instanceof Error ? e.message : e}`).catch(() => undefined);
  }
  await db.update(schema.reports).set({ status: "refunded", error: note, updatedAt: new Date() }).where(eq(schema.reports.id, r.id));
  if (r.email) void sendVehicleNotFoundEmail({ to: r.email, plate: r.inputValue, refundKind }).catch(() => undefined);
}
