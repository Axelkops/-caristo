import { handleError, ok } from "@/lib/http";
import { getReport, UserError } from "@/lib/services/reports";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await getReport(id);
    if (!r) throw new UserError("Rapport introuvable.", 404);
    return ok({ status: r.status, score: r.score, error: r.error ?? undefined });
  } catch (e) { return handleError(e); }
}
