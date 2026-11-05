import { z } from "zod";
import { clientIp, handleError, ok, rateLimit } from "@/lib/http";
import { requestLoginCode } from "@/lib/services/auth";
import { UserError } from "@/lib/services/reports";

const Body = z.object({ email: z.string().max(200) });

export async function POST(req: Request) {
  try {
    if (!rateLimit(`auth:${clientIp(req)}`, 10, 10 * 60_000)) throw new UserError("Trop de demandes. Réessayez dans quelques minutes.", 429);
    const body = Body.safeParse(await req.json().catch(() => ({})));
    if (!body.success) throw new UserError("Adresse e-mail invalide.");
    return ok(await requestLoginCode(body.data.email));
  } catch (e) { return handleError(e); }
}
