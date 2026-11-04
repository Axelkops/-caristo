import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";

type Db = import("drizzle-orm/pglite").PgliteDatabase<typeof schema> | import("drizzle-orm/postgres-js").PostgresJsDatabase<typeof schema>;

declare global {
  var __caristoDb: Promise<Db> | undefined;
}

const MIGRATIONS = path.join(process.cwd(), "drizzle");

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL ?? "";
  if (url.startsWith("postgres")) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const postgres = (await import("postgres")).default;
    const client = postgres(url, { max: 5, prepare: false });
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder: MIGRATIONS });
    return db;
  }
  // Local / demo: PGlite (Postgres in-process, no native binary)
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const dir = url.startsWith("file:") ? url.slice(5) : path.join(process.cwd(), "data", "pglite");
  if (dir !== ":memory:") fs.mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir === ":memory:" ? undefined : dir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: MIGRATIONS });
  return db;
}

/** Connexion unique (réutilisée entre requêtes). */
export function getDb(): Promise<Db> {
  if (!globalThis.__caristoDb) globalThis.__caristoDb = connect();
  return globalThis.__caristoDb;
}

export { schema };
