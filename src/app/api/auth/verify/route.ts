import { z } from "zod";
import { clientIp, handleError, ok, rateLimit } from "@/lib/http";
import { verifyLoginCode } from "@/lib/services/auth";
import { UserError } from "@/lib/services/reports";

const Body = z.object({ email: z.string().max(200), code: z.string().max(12) });

export async function POST(req: Request) {
  try {
    if (!rateLimit(`verify:${clientIp(req)}`, 30, 10 * 60_000)) throw new UserError("Trop d'essais. Réessayez dans quelques minutes.", 429);
    const body = Body.safeParse(await req.json().catch(() => ({})));
    if (!body.success) throw new UserError("Saisie invalide.");
    return ok(await verifyLoginCode(body.data.email, body.data.code));
  } catch (e) { return handleError(e); }
}
