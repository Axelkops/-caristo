import { NextResponse } from "next/server";
import { UserError } from "./services/reports";

export function ok(data: unknown, init?: ResponseInit) { return NextResponse.json(data, init); }

export function handleError(e: unknown) {
  if (e instanceof UserError) return NextResponse.json({ error: e.message }, { status: e.status });
  console.error(e);
  return NextResponse.json({ error: "Une erreur est survenue. Réessayez dans un instant." }, { status: 500 });
}

/** Limite simple par IP (mémoire) : n requêtes par fenêtre. Suffisant pour un seul serveur ; en multi-instances, préférer un stockage partagé. */
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) { buckets.set(key, { count: 1, reset: now + windowMs }); return true; }
  if (b.count >= max) return false;
  b.count++;
  return true;
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "local";
}
