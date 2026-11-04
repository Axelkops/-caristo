import { notFound, redirect } from "next/navigation";
import { getReport } from "@/lib/services/reports";
import { isDemo } from "@/lib/providers";
import { OFFERS, formatEuros, type Offer } from "@/lib/services/pricing";
import { DemoPayButton } from "@/components/DemoPayButton";

export const dynamic = "force-dynamic";

export default async function DemoPayment({ searchParams }: { searchParams: Promise<{ report?: string }> }) {
  const { report } = await searchParams;
  if (!isDemo() || !report) notFound();
  const r = await getReport(report);
  if (!r) notFound();
  if (r.status !== "awaiting_payment") redirect(`/rapport/${report}`);
  const o = OFFERS[r.offer as Offer];
  return (
    <div className="max-w-[560px] mx-auto px-4 sm:px-6 py-16 flex flex-col gap-6">
      <div className="bg-white border border-line rounded-[20px] p-8 flex flex-col gap-5">
        <span className="text-xs font-semibold text-warntext bg-warnbg px-2.5 py-1 rounded-full w-fit">Mode démonstration · aucun débit réel</span>
        <h1 className="m-0 text-3xl font-bold">Paiement</h1>
        <div className="flex justify-between items-center border border-line rounded-xl px-4 py-3"><span className="font-medium">Caristo · {o.label}</span><span className="display text-xl font-bold">{formatEuros(o.priceCents)}</span></div>
        <p className="m-0 text-sm text-muted">En production, cet écran est remplacé par la page de paiement sécurisée Stripe (carte, Apple Pay, Google Pay).</p>
        <DemoPayButton reportId={report} />
      </div>
    </div>
  );
}
