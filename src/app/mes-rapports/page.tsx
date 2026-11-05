import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAllPacks, getReportsForEmail, getSessionEmail } from "@/lib/services/auth";
import { OFFERS, type Offer } from "@/lib/services/pricing";
import type { ReportData, Vehicle } from "@/lib/engine/types";
import { LogoutButton } from "@/components/LogoutButton";
import { CarIcon } from "@/components/Logo";

export const metadata: Metadata = { title: "Mes rapports", robots: { index: false } };
export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; cls: string }> = {
  ready: { label: "Prêt", cls: "bg-okbg text-oktext" },
  paid: { label: "En préparation", cls: "bg-[#EFF6FF] text-[#1D4ED8]" },
  generating: { label: "En préparation", cls: "bg-[#EFF6FF] text-[#1D4ED8]" },
  failed: { label: "Incident, contactez-nous", cls: "bg-badbg text-badtext" },
};

export default async function MyReportsPage() {
  const email = await getSessionEmail();
  if (!email) redirect("/connexion?next=/mes-rapports");
  const [reports, packs] = await Promise.all([getReportsForEmail(email), getAllPacks(email)]);
  const usable = packs.filter((p) => !p.expired && p.remaining > 0);

  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-10 flex flex-col gap-8">
      <header className="flex flex-wrap justify-between items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="m-0 text-[32px] sm:text-[40px] leading-tight font-bold">Mes rapports</h1>
          <span className="text-sm text-muted">Connecté avec {email}</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/#top" className="bg-accent text-ink px-4 py-2.5 rounded-[10px] font-semibold led no-underline text-sm">Nouveau rapport</Link>
          <LogoutButton />
        </div>
      </header>

      {/* Packs */}
      {packs.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="m-0 text-xl font-bold">Mes packs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {packs.map((p) => {
              const active = !p.expired && p.remaining > 0;
              return (
                <div key={p.id} data-testid="pack-card" className={`rounded-2xl border p-5 flex justify-between items-center gap-4 ${active ? "bg-navy text-white border-navy" : "bg-white border-line text-muted"}`}>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold">{OFFERS[p.offer as Offer]?.label ?? p.offer}</span>
                    <span className={`text-[13px] ${active ? "text-muteddark" : ""}`}>{p.expired ? "Expiré" : `Valable jusqu'au ${new Date(p.expiresAt).toLocaleDateString("fr-FR")}`}{active && " · le crédit est utilisé automatiquement au prochain rapport"}</span>
                  </div>
                  <span className="display text-[28px] font-bold whitespace-nowrap">{p.remaining} <span className="text-sm font-medium opacity-80">/ {p.total} restant{p.remaining > 1 ? "s" : ""}</span></span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Rapports */}
      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-xl font-bold">Mes rapports{reports.length ? ` (${reports.length})` : ""}</h2>
        {reports.length === 0 ? (
          <div className="bg-white border border-line rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
            <span className="w-14 h-14 rounded-2xl bg-ink flex items-center justify-center"><CarIcon stroke="var(--accent)" size={28} /></span>
            <p className="m-0 text-[#4B5563] max-w-md">Aucun rapport pour cette adresse. {usable.length ? "Votre pack est prêt : lancez votre premier rapport." : "Lancez votre premier rapport depuis la page d'accueil."}</p>
            <Link href="/#top" className="bg-navy text-white px-5 py-3 rounded-xl font-semibold no-underline">Vérifier un véhicule</Link>
          </div>
        ) : (
          <ul className="m-0 p-0 list-none flex flex-col gap-3">
            {reports.map((r) => {
              const v = r.vehicle as Vehicle;
              const rep = r.report as ReportData | null;
              const st = STATUS[r.status] ?? STATUS.paid;
              return (
                <li key={r.id} data-testid="report-row" className="bg-white border border-line rounded-2xl p-5 flex flex-wrap items-center gap-4 justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="w-12 h-12 rounded-xl bg-ink flex items-center justify-center shrink-0"><CarIcon stroke="var(--accent)" size={24} /></span>
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-bold truncate">{v.make} {v.model}{v.version ? ` ${v.version}` : ""}</span>
                      <span className="text-[13px] text-muted flex flex-wrap gap-x-3">{v.plate && <span className="font-semibold tracking-wider text-fg">{v.plate}</span>}<span>{r.createdAt.toLocaleDateString("fr-FR")}</span>{r.mileage ? <span>{r.mileage.toLocaleString("fr-FR")} km</span> : null}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {rep && <span className="text-sm font-semibold">Confiance {rep.scorePercent} %</span>}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                    <Link href={`/rapport/${r.id}`} className="bg-navy text-white px-4 py-2.5 rounded-[10px] text-sm font-semibold no-underline">Voir</Link>
                    {r.status === "ready" && <a href={`/api/reports/${r.id}/pdf`} className="border border-line bg-white px-4 py-2.5 rounded-[10px] text-sm font-semibold no-underline text-fg">PDF</a>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
