import { handleError, ok } from "@/lib/http";
import { isDemo } from "@/lib/providers";
import { markPaid, UserError } from "@/lib/services/reports";

/** Paiement simulé : uniquement en mode démonstration. */
export async function POST(req: Request) {
  try {
    if (!isDemo()) throw new UserError("Paiement de démonstration désactivé.", 403);
    const { reportId } = (await req.json().catch(() => ({}))) as { reportId?: string };
    if (!reportId) throw new UserError("Rapport manquant.");
    await markPaid(reportId, null);
    return ok({ next: `/rapport/${reportId}` });
  } catch (e) { return handleError(e); }
}
