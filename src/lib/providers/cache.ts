import { eq } from "drizzle-orm";
import { getDb, schema } from "../db";

/** Cache simple en base (clé → JSON) pour limiter les appels fournisseurs payants. */
export async function cached<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const db = await getDb();
  const now = new Date();
  const row = await db.select().from(schema.providerCache).where(eq(schema.providerCache.key, key)).limit(1);
  if (row[0] && row[0].expiresAt > now) return row[0].value as T;
  const value = await fn();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  await db
    .insert(schema.providerCache)
    .values({ key, value: value as object, expiresAt })
    .onConflictDoUpdate({ target: schema.providerCache.key, set: { value: value as object, expiresAt } });
  return value;
}
