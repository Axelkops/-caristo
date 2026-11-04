import { and, eq, gt, sql } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { getDb, schema } from "../db";
import type { ListingAnalysis, ReportData, Vehicle } from "../engine/types";
import { buildReport } from "../engine/report";
import { parseDate, parseFormulaNumber, parseMileage, parsePlate, parseVin } from "../engine/identifiers";
import { getHistoryProvider, getListingProvider, getRecallsProvider, getVehicleProvider } from "../providers";
import { OFFERS, type Offer } from "./pricing";
import { sendReportReadyEmail } from "./email";

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

  const provider = await getVehicleProvider();
  const vehicle = await provider.identify({ kind, value: normalized, country });
  if (!vehicle) throw new UserError(kind === "plate" ? "Aucun véhicule trouvé pour cette plaque. Vérifiez la saisie ou utilisez le numéro VIN." : "Aucun véhicule trouvé pour ce VIN.", 404);

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
}

/** Étape 2 : enregistrer kilométrage, carte grise, e-mail, offre. */
export async function saveDetails(reportId: string, d: DetailsInput): Promise<{ status: string; needsPayment: boolean }> {
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
    const formula = d.formulaNumber ? parseFormulaNumber(d.formulaNumber) : null;
    const date = d.firstRegDate ? parseDate(d.firstRegDate) : null;
    const holder = (d.holderName ?? "").trim();
    if (d.formulaNumber && !formula) throw new UserError("Numéro de formule invalide : il commence par l’année (4 chiffres), puis 2 lettres et des chiffres (ex. 2021AB12345).");
    if (d.firstRegDate && !date) throw new UserError("Date de première immatriculation invalide (JJ/MM/AAAA).");
    update.formulaNumber = formula ?? null;
    update.firstRegDate = date ?? null;
    update.holderName = holder || null;
  }
  if (d.listingUrl) {
    const u = d.listingUrl.trim();
    if (!/^https?:\/\/[^\s]+$/i.test(u)) throw new UserError("Le lien de l'annonce doit commencer par http:// ou https://.");
    update.listingUrl = u;
  }

  // Pack existant ?
  if (d.packCode) {
    const code = d.packCode.trim().toUpperCase();
    const [pack] = await db.select().from(schema.packs).where(and(eq(schema.packs.code, code), gt(schema.packs.expiresAt, new Date()))).limit(1);
    if (!pack) throw new UserError("Code de pack inconnu ou expiré.");
    if (pack.creditsUsed >= pack.creditsTotal) throw new UserError("Ce pack n'a plus de crédit disponible.");
    await db.update(schema.packs).set({ creditsUsed: sql`${schema.packs.creditsUsed} + 1` }).where(eq(schema.packs.id, pack.id));
    update.packId = pack.id; update.status = "paid"; update.paidAt = new Date(); update.offer = pack.offer as Offer;
    await db.update(schema.reports).set(update).where(eq(schema.reports.id, reportId));
    void generateReport(reportId);
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
  void generateReport(reportId);
}

/** Génère le rapport complet (après paiement). Tolérant : chaque source peut échouer sans bloquer. */
export async function generateReport(reportId: string): Promise<ReportData> {
  const db = await getDb();
  const [r] = await db.select().from(schema.reports).where(eq(schema.reports.id, reportId)).limit(1);
  if (!r) throw new UserError("Rapport introuvable.", 404);
  if (r.report && r.status === "ready") return r.report as ReportData;
  await db.update(schema.reports).set({ status: "generating", updatedAt: new Date() }).where(eq(schema.reports.id, reportId));
  try {
    const vehicle = r.vehicle as Vehicle;
    const [historyP, recallsP, listingP] = await Promise.all([getHistoryProvider(), getRecallsProvider(), getListingProvider()]);
    const [history, recalls, listing] = await Promise.all([
      historyP.fetchHistory({ vehicle, plate: r.inputKind === "plate" ? r.inputValue : vehicle.plate, holderName: r.holderName ?? undefined, formulaNumber: r.formulaNumber ?? undefined, firstRegDate: r.firstRegDate ?? undefined }).catch((e: Error) => ({ available: false, reason: `Historique officiel indisponible (${e.message}).`, inspections: [], mileageReadings: [], claims: [] })),
      recallsP.fetchRecalls(vehicle).catch(() => []),
      r.listingUrl ? listingP.analyze(r.listingUrl, vehicle, r.mileage ?? undefined).catch((): ListingAnalysis => ({ available: false, url: r.listingUrl!, claims: [] })) : Promise.resolve<ListingAnalysis>({ available: false, claims: [] }),
    ]);
    const entries = await db.select().from(schema.maintenanceEntries).where(eq(schema.maintenanceEntries.reportId, reportId));
    const reference = `CAR-${new Date().getFullYear()}-${r.id.slice(-6).toUpperCase()}`;
    const report = buildReport({ id: r.id, reference, vehicle, mileage: r.mileage ?? undefined, history, recalls, listing, entries: entries.map((e) => ({ label: e.label, date: e.date, mileage: e.mileage ?? undefined })) });
    await db.update(schema.reports).set({ report, score: report.score, status: "ready", readyAt: new Date(), updatedAt: new Date(), error: null }).where(eq(schema.reports.id, reportId));
    const [pack] = r.packId ? await db.select().from(schema.packs).where(eq(schema.packs.id, r.packId)).limit(1) : [];
    if (r.email) void sendReportReadyEmail({ to: r.email, reportId: r.id, shareToken: r.shareToken, reference, vehicle, packCode: pack && pack.creditsUsed === 1 ? pack.code : undefined, packCredits: pack ? pack.creditsTotal - pack.creditsUsed : undefined }).catch(() => undefined);
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
