import { handleError, ok } from "@/lib/http";
import { paymentsSimulated } from "@/lib/services/payments";
import { markPaid, UserError } from "@/lib/services/reports";

/** Paiement simulé : mode démonstration, ou Stripe non configuré. */
export async function POST(req: Request) {
  try {
    if (!paymentsSimulated()) throw new UserError("Paiement de démonstration désactivé.", 403);
    const { reportId } = (await req.json().catch(() => ({}))) as { reportId?: string };
    if (!reportId) throw new UserError("Rapport manquant.");
    await markPaid(reportId, null);
    return ok({ next: `/rapport/${reportId}` });
  } catch (e) { return handleError(e); }
}
