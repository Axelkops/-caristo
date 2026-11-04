import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getReportByToken } from "@/lib/services/reports";
import type { ReportData } from "@/lib/engine/types";
import { ReportView } from "@/components/ReportView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rapport partagé", robots: { index: false } };

export default async function SharedReport({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const r = await getReportByToken(token);
  if (!r || r.status !== "ready" || !r.report) notFound();
  const expired = r.readyAt && Date.now() - new Date(r.readyAt).getTime() > 365 * 86400000;
  if (expired) notFound();
  return <ReportView report={r.report as ReportData} reportId={r.id} readonly />;
}
