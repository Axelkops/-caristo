import { NextResponse } from "next/server";
import { parseStripeEvent } from "@/lib/services/payments";
import { markPaid } from "@/lib/services/reports";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  let event;
  try {
    event = await parseStripeEvent(await req.text(), sig);
  } catch (e) {
    return NextResponse.json({ error: `Webhook invalide : ${e instanceof Error ? e.message : "?"}` }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { id: string; metadata?: Record<string, string>; payment_status?: string };
    const reportId = session.metadata?.reportId;
    if (reportId && session.payment_status === "paid") await markPaid(reportId, session.id);
  }
  return NextResponse.json({ received: true });
}
