import { NextResponse } from "next/server";
import { getReport, UserError } from "@/lib/services/reports";
import type { ReportData } from "@/lib/engine/types";
import { handleError } from "@/lib/http";
import { renderReportPdf } from "@/lib/pdf/report-pdf";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const r = await getReport(id);
    if (!r || r.status !== "ready" || !r.report) throw new UserError("Rapport introuvable ou non finalisé.", 404);
    const report = r.report as ReportData;
    const buf = await renderReportPdf(report);
    return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="caristo-${report.reference}.pdf"`, "Cache-Control": "private, no-store" } });
  } catch (e) { return handleError(e); }
}
