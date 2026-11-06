"use client";
import { useState } from "react";

export function ShareBox({ reportId, shareToken, reference }: { reportId: string; shareToken: string; reference: string }) {
  const [copied, setCopied] = useState(false);
  const base = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL ?? "");
  const link = `${base}/r/${shareToken}`;
  async function copy() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { window.prompt("Copiez le lien :", link); }
  }
  return (
    <div className="bg-white text-fg border border-line rounded-2xl px-6 py-5 flex flex-wrap gap-3 items-center justify-between no-print">
      <div className="flex flex-col gap-1 min-w-0"><span className="font-bold">Partager ce rapport</span><span className="text-[13px] text-muted">Envoyez ce lien à qui vous voulez (vendeur, acheteur, garagiste, proche) : il ouvre le rapport en lecture seule, sans compte ni paiement, pendant 12 mois.</span><span className="text-[13px] text-navy break-all select-all">{link}</span></div>
      <div className="flex gap-2.5 flex-wrap">
        <button type="button" onClick={copy} className="px-4 py-3 rounded-[10px] border border-line bg-white text-sm font-semibold">{copied ? "Copié !" : "Copier le lien"}</button>
        <a href={`/api/reports/${reportId}/pdf`} target="_blank" rel="noopener" className="px-4 py-3 rounded-[10px] bg-navy text-white text-sm font-semibold no-underline">Télécharger le PDF</a>
        <span className="sr-only">{reference}</span>
      </div>
    </div>
  );
}
