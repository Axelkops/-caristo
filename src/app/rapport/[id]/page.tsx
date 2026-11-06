import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPackForReport, getReport } from "@/lib/services/reports";
import type { ReportData, Vehicle } from "@/lib/engine/types";
import { ReportView } from "@/components/ReportView";
import { ReportProgress } from "@/components/ReportProgress";
import { VehicleCard } from "@/components/VehicleCard";
import { Steps } from "@/components/Steps";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const r = await getReport(id);
  const v = r?.vehicle as Vehicle | undefined;
  return { title: v ? `Rapport ${v.make} ${v.model}` : "Rapport", robots: { index: false } };
}

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await getReport(id);
  if (!r || !r.vehicle) notFound();
  if (r.status === "identified" || r.status === "draft") redirect(`/verification/${id}`);
  if (r.status === "ready" && r.report) {
    const pack = await getPackForReport(r.packId);
    return <ReportView report={r.report as ReportData} reportId={r.id} shareToken={r.shareToken} pack={pack ? { remaining: pack.creditsTotal - pack.creditsUsed, expiresAt: pack.expiresAt.toISOString() } : undefined} />;
  }
  return (
    <>
      <div className="bg-ink text-white px-4 sm:px-6 py-5"><div className="max-w-[1100px] mx-auto"><Steps current={3} /></div></div>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 flex flex-col gap-7">
        <VehicleCard vehicle={r.vehicle as Vehicle} badge="Véhicule identifié" />
        <ReportProgress reportId={id} initialStatus={r.status} initialError={r.error ?? undefined} />
      </div>
    </>
  );
}
