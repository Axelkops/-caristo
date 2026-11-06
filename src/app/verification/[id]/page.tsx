import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getReport } from "@/lib/services/reports";
import { getSessionEmail, getUsablePacks } from "@/lib/services/auth";
import type { Vehicle } from "@/lib/engine/types";
import { ReportPaywall } from "@/components/ReportPaywall";
import { DetailsForm } from "@/components/DetailsForm";
import { Steps } from "@/components/Steps";
import Link from "next/link";

export const metadata: Metadata = { title: "Vérification" };
export const dynamic = "force-dynamic";

export default async function VerificationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ cancel?: string }> }) {
  const { id } = await params;
  const { cancel } = await searchParams;
  const r = await getReport(id);
  if (!r || !r.vehicle) notFound();
  if (["paid", "generating", "ready"].includes(r.status)) redirect(`/rapport/${id}`);
  const vehicle = r.vehicle as Vehicle;
  const email = await getSessionEmail();
  const account = email ? { email, pack: (await getUsablePacks(email))[0] ?? null } : null;
  return (
    <>
      <div className="bg-ink text-white px-4 sm:px-6 py-5"><div className="max-w-[1100px] mx-auto flex items-center justify-between gap-4 flex-wrap"><Steps current={2} /><Link href="/" className="text-sm text-muteddark no-underline">{vehicle.pending ? "Corriger la plaque" : "Ce n\u2019est pas le bon véhicule ?"}</Link></div></div>
      <div className="bg-ink px-4 sm:px-6 pt-8 pb-14" style={{ background: "radial-gradient(900px 420px at 20% -10%, rgba(37,99,235,0.25), transparent 60%), #070F1F" }}>
        <div className="max-w-[1200px] mx-auto flex flex-col gap-6">
          {cancel && <p className="m-0 bg-warnbg text-warntext rounded-xl px-4 py-3 text-sm">Paiement annulé. Vous pouvez reprendre quand vous voulez : rien n&apos;a été débité.</p>}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-start">
            <div className="lg:sticky lg:top-6"><ReportPaywall vehicle={vehicle} /></div>
            <div id="lancer" className="bg-white border border-line rounded-[24px] p-6 sm:p-8 scroll-mt-4">
              <DetailsForm reportId={id} vehicle={vehicle} defaults={{ mileage: r.mileage, email: r.email, offer: r.offer }} account={account} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
