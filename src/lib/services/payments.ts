import { isDemo } from "../providers";
import { OFFERS, type Offer } from "./pricing";

/** URL publique du site : variable d'environnement, sinon origine de la requête. */
export function siteUrl(origin?: string): string {
  return (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? origin ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Paiement simulé : en mode démonstration, ou tant que Stripe n'est pas configuré (phase de test). */
export function paymentsSimulated(): boolean {
  return isDemo() || !process.env.STRIPE_SECRET_KEY;
}

/** Crée une session de paiement et renvoie l'URL où envoyer le client. Paiement simulé : page dédiée (chemin relatif). */
export async function createCheckout(reportId: string, offer: Offer, email: string, origin?: string): Promise<{ url: string; sessionId: string | null }> {
  if (paymentsSimulated()) {
    return { url: `/paiement/demo?report=${reportId}`, sessionId: null };
  }
  const base = siteUrl(origin);
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const priceId = { single: process.env.STRIPE_PRICE_SINGLE, pack3: process.env.STRIPE_PRICE_PACK3, pack10: process.env.STRIPE_PRICE_PACK10 }[offer];
  const o = OFFERS[offer];
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [priceId ? { price: priceId, quantity: 1 } : { quantity: 1, price_data: { currency: "eur", unit_amount: o.priceCents, product_data: { name: `Caristo – ${o.label}` } } }],
    metadata: { reportId, offer },
    success_url: `${base}/rapport/${reportId}?paid=1`,
    cancel_url: `${base}/verification/${reportId}?cancel=1`,
    locale: "fr",
    allow_promotion_codes: true,
  });
  return { url: session.url ?? `${base}/rapport/${reportId}`, sessionId: session.id };
}

/** Vérifie la signature du webhook Stripe et renvoie l'événement. */
export async function parseStripeEvent(rawBody: string, signature: string) {
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");
  return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET ?? "");
}

/** Rembourse intégralement un paiement Stripe à partir de l'identifiant de la session de paiement. */
export async function refundCheckout(sessionId: string): Promise<void> {
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const pi = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!pi) throw new Error("Paiement introuvable pour le remboursement");
  await stripe.refunds.create({ payment_intent: pi, reason: "requested_by_customer" });
}
