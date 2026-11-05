import { and, desc, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { createHash, randomInt } from "node:crypto";
import { customAlphabet } from "nanoid";
import { cookies } from "next/headers";
import { getDb, schema } from "../db";
import { isDemo } from "../providers";
import { sendLoginCodeEmail } from "./email";
import { UserError } from "./reports";

/*
 * Connexion sans mot de passe : un code à 6 chiffres envoyé par e-mail, valable 10 minutes,
 * 5 essais maximum. Une fois vérifié, une session de 90 jours est posée en cookie httpOnly.
 */

const COOKIE = "caristo_session";
const CODE_TTL_MS = 10 * 60 * 1000;
const SESSION_DAYS = 90;
const MAX_ATTEMPTS = 5;
const id = customAlphabet("0123456789abcdefghijkmnpqrstuvwxyz", 14);
const token = customAlphabet("0123456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ", 40);

export function normalizeEmail(raw: string): string {
  const email = (raw ?? "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new UserError("Adresse e-mail invalide.");
  return email;
}

export function hashCode(email: string, code: string): string {
  return createHash("sha256").update(`${process.env.APP_SECRET ?? "dev"}:${email}:${code}`).digest("hex");
}

/** Étape 1 : envoie un code. En mode démo (sans e-mail réel), le code est renvoyé pour les tests. */
export async function requestLoginCode(rawEmail: string): Promise<{ sent: true; devCode?: string }> {
  const email = normalizeEmail(rawEmail);
  const db = await getDb();
  // anti-abus : pas plus d'un code par minute et 6 par heure pour une même adresse
  const recent = await db.select({ createdAt: schema.loginCodes.createdAt }).from(schema.loginCodes).where(and(eq(schema.loginCodes.email, email), gt(schema.loginCodes.createdAt, new Date(Date.now() - 3600_000)))).orderBy(desc(schema.loginCodes.createdAt));
  if (recent.length >= 6) throw new UserError("Trop de demandes pour cette adresse. Réessayez dans une heure.", 429);
  if (recent[0] && Date.now() - recent[0].createdAt.getTime() < 60_000) throw new UserError("Un code vient d'être envoyé. Vérifiez votre boîte mail (et les spams), puis réessayez dans une minute.", 429);

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(schema.loginCodes).values({ id: id(), email, codeHash: hashCode(email, code), expiresAt: new Date(Date.now() + CODE_TTL_MS) });
  const delivered = await sendLoginCodeEmail({ to: email, code });
  return { sent: true, devCode: isDemo() && !delivered ? code : undefined };
}

/** Étape 2 : vérifie le code et ouvre la session (pose le cookie). */
export async function verifyLoginCode(rawEmail: string, rawCode: string): Promise<{ email: string }> {
  const email = normalizeEmail(rawEmail);
  const code = (rawCode ?? "").replace(/\D/g, "");
  if (code.length !== 6) throw new UserError("Le code comporte 6 chiffres.");
  const db = await getDb();
  const [row] = await db.select().from(schema.loginCodes).where(and(eq(schema.loginCodes.email, email), isNull(schema.loginCodes.usedAt), gt(schema.loginCodes.expiresAt, new Date()))).orderBy(desc(schema.loginCodes.createdAt)).limit(1);
  if (!row) throw new UserError("Code expiré ou inexistant. Demandez un nouveau code.");
  if (row.attempts >= MAX_ATTEMPTS) throw new UserError("Trop d'essais. Demandez un nouveau code.");
  if (row.codeHash !== hashCode(email, code)) {
    await db.update(schema.loginCodes).set({ attempts: sql`${schema.loginCodes.attempts} + 1` }).where(eq(schema.loginCodes.id, row.id));
    throw new UserError(`Code incorrect (${MAX_ATTEMPTS - row.attempts - 1} essai${MAX_ATTEMPTS - row.attempts - 1 > 1 ? "s" : ""} restant${MAX_ATTEMPTS - row.attempts - 1 > 1 ? "s" : ""}).`);
  }
  await db.update(schema.loginCodes).set({ usedAt: new Date() }).where(eq(schema.loginCodes.id, row.id));
  const t = token();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(schema.sessions).values({ token: t, email, expiresAt });
  const jar = await cookies();
  jar.set(COOKIE, t, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: expiresAt });
  return { email };
}

/** E-mail de la session courante, ou null. */
export async function getSessionEmail(): Promise<string | null> {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (!t) return null;
  const db = await getDb();
  const [s] = await db.select().from(schema.sessions).where(and(eq(schema.sessions.token, t), gt(schema.sessions.expiresAt, new Date()))).limit(1);
  return s?.email ?? null;
}

export async function logout(): Promise<void> {
  const jar = await cookies();
  const t = jar.get(COOKIE)?.value;
  if (t) {
    const db = await getDb();
    await db.delete(schema.sessions).where(eq(schema.sessions.token, t));
  }
  jar.set(COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(0) });
}

/** Packs encore utilisables pour une adresse (crédits restants, non expirés). */
export async function getUsablePacks(email: string) {
  const db = await getDb();
  const rows = await db.select().from(schema.packs).where(and(eq(schema.packs.email, email), gt(schema.packs.expiresAt, new Date()))).orderBy(schema.packs.expiresAt);
  return rows.filter((p) => p.creditsUsed < p.creditsTotal).map((p) => ({ id: p.id, offer: p.offer, remaining: p.creditsTotal - p.creditsUsed, total: p.creditsTotal, expiresAt: p.expiresAt.toISOString() }));
}

/** Tous les packs d'une adresse (y compris épuisés ou expirés), pour l'espace « Mes rapports ». */
export async function getAllPacks(email: string) {
  const db = await getDb();
  const rows = await db.select().from(schema.packs).where(eq(schema.packs.email, email)).orderBy(desc(schema.packs.createdAt));
  return rows.map((p) => ({ id: p.id, offer: p.offer, remaining: p.creditsTotal - p.creditsUsed, total: p.creditsTotal, expiresAt: p.expiresAt.toISOString(), expired: p.expiresAt.getTime() < Date.now() }));
}

/** Rapports d'une adresse (payés, en cours ou prêts), du plus récent au plus ancien. */
export async function getReportsForEmail(email: string) {
  const db = await getDb();
  return db.select().from(schema.reports).where(and(eq(schema.reports.email, email), inArray(schema.reports.status, ["paid", "generating", "ready", "failed"]))).orderBy(desc(schema.reports.createdAt));
}

/** Nettoyage : codes expirés et sessions périmées (appelé par la tâche de nettoyage). */
export async function cleanupAuth(): Promise<void> {
  const db = await getDb();
  await db.delete(schema.loginCodes).where(sql`${schema.loginCodes.expiresAt} < now() - interval '1 day'`);
  await db.delete(schema.sessions).where(sql`${schema.sessions.expiresAt} < now()`);
}
