import { NextResponse } from "next/server";
import { and, inArray, lt, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

/**
 * Nettoyage périodique (à appeler chaque nuit, ex. via Vercel Cron) :
 * - efface les informations de carte grise 30 jours après la génération du rapport ;
 * - supprime les brouillons jamais payés après 7 jours ;
 * - supprime les rapports et liens de partage après 12 mois ;
 * - purge le cache fournisseurs expiré.
 * Protégé par CRON_SECRET (en-tête Authorization: Bearer <secret>).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const db = await getDb();
  const now = Date.now();
  const d30 = new Date(now - 30 * 86400000);
  const d7 = new Date(now - 7 * 86400000);
  const d365 = new Date(now - 365 * 86400000);
  const wiped = await db.update(schema.reports).set({ holderName: null, formulaNumber: null, firstRegDate: null }).where(and(lt(schema.reports.readyAt, d30), sql`${schema.reports.formulaNumber} is not null`)).returning();
  const drafts = await db.delete(schema.reports).where(and(inArray(schema.reports.status, ["draft", "identified", "awaiting_payment"]), lt(schema.reports.createdAt, d7))).returning();
  const expired = await db.delete(schema.reports).where(lt(schema.reports.readyAt, d365)).returning();
  const cache = await db.delete(schema.providerCache).where(lt(schema.providerCache.expiresAt, new Date())).returning();
  return NextResponse.json({ wipedCarteGrise: wiped.length, deletedDrafts: drafts.length, deletedExpired: expired.length, cacheEntries: cache.length });
}
