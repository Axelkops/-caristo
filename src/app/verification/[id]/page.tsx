import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getReport } from "@/lib/services/reports";
import type { Vehicle } from "@/lib/engine/types";
import { VehicleCard } from "@/components/VehicleCard";
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
  return (
    <>
      <div className="bg-ink text-white px-4 sm:px-6 py-5"><div className="max-w-[1100px] mx-auto flex items-center justify-between gap-4 flex-wrap"><Steps current={2} /><Link href="/" className="text-sm text-muteddark no-underline">Ce n&apos;est pas le bon véhicule ?</Link></div></div>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 flex flex-col gap-7">
        {cancel && <p className="m-0 bg-warnbg text-warntext rounded-xl px-4 py-3 text-sm">Paiement annulé. Vous pouvez reprendre quand vous voulez : rien n&apos;a été débité.</p>}
        <VehicleCard vehicle={vehicle} badge="Véhicule identifié" />
        <div className="bg-white border border-line rounded-[20px] p-6 sm:p-8">
          <DetailsForm reportId={id} vehicle={vehicle} defaults={{ mileage: r.mileage, email: r.email, offer: r.offer }} />
        </div>
      </div>
    </>
  );
}
