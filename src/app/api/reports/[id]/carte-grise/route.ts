import { z } from "zod";
import { clientIp, handleError, ok, rateLimit } from "@/lib/http";
import { addCarteGrise, UserError } from "@/lib/services/reports";

const Body = z.object({
  formulaNumber: z.string().max(20),
  holderName: z.string().max(120),
  firstRegDate: z.string().max(10),
});

/** Ajout de la carte grise sur un rapport payé : consulte l'historique officiel, sans nouveau paiement. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!rateLimit(`cg:ip:${clientIp(req)}`, 10) || !rateLimit(`cg:report:${id}`, 5, 10 * 60_000)) throw new UserError("Trop de tentatives. Patientez quelques minutes.", 429);
    const body = Body.safeParse(await req.json().catch(() => ({})));
    if (!body.success) throw new UserError("Saisie invalide : renseignez les trois informations de la carte grise.");
    await addCarteGrise(id, body.data);
    return ok({ done: true });
  } catch (e) { return handleError(e); }
}
