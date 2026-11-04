import { z } from "zod";
import { clientIp, handleError, ok, rateLimit } from "@/lib/http";
import { identifyAndCreate, UserError } from "@/lib/services/reports";

const Body = z.object({ input: z.string().min(1).max(40), kind: z.enum(["plate", "vin"]).optional(), country: z.string().length(2).optional() });

export async function POST(req: Request) {
  try {
    if (!rateLimit(`identify:${clientIp(req)}`, 30)) throw new UserError("Trop de tentatives. Patientez une minute.", 429);
    const body = Body.safeParse(await req.json().catch(() => ({})));
    if (!body.success) throw new UserError("Saisie invalide.");
    const r = await identifyAndCreate(body.data);
    return ok(r);
  } catch (e) { return handleError(e); }
}
