"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STEPS = ["Fiche technique", "Historique officiel", "Rappels constructeur", "Pannes connues du modèle", "Cote du marché", "Échéancier d'entretien", "Questions au vendeur"];

export function ReportProgress({ reportId, initialStatus }: { reportId: string; initialStatus: string }) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | undefined>();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/reports/${reportId}/status`, { cache: "no-store" });
        const json = await res.json();
        if (!active) return;
        setStatus(json.status);
        setError(json.error);
        setTick((t) => t + 1);
        if (json.status === "ready") { clearInterval(timer); router.refresh(); }
        if (json.status === "failed") clearInterval(timer);
      } catch { /* on réessaie au tick suivant */ }
    }, 1500);
    return () => { active = false; clearInterval(timer); };
  }, [reportId, router]);

  const done = Math.min(STEPS.length, Math.floor(tick * 1.4) + 1);
  if (status === "failed") {
    return (
      <div className="bg-badbg border border-red-200 rounded-2xl p-6 flex flex-col gap-2">
        <span className="font-semibold text-badtext">La génération a échoué.</span>
        <span className="text-sm text-badtext">{error ?? "Erreur inconnue."} Si le problème persiste, contactez-nous : vous serez remboursé.</span>
      </div>
    );
  }
  if (status === "awaiting_payment" || status === "identified") {
    return <div className="bg-warnbg border border-[#FDD9A8] rounded-2xl p-6 text-sm text-warntext">Le paiement n&apos;a pas encore été confirmé. Si vous venez de payer, patientez quelques secondes : cette page se met à jour toute seule.</div>;
  }
  return (
    <div className="bg-white border border-line rounded-[20px] p-6 sm:p-8 flex flex-col gap-5">
      <div className="flex items-center gap-3"><span className="spinner" aria-hidden="true" /><span className="display text-xl font-bold">Vérification en cours…</span></div>
      <div className="h-2.5 bg-[#DCE3EE] rounded-full overflow-hidden"><div className="h-full bg-navy rounded-full transition-all" style={{ width: `${Math.round((done / STEPS.length) * 100)}%` }} /></div>
      <ul className="m-0 p-0 list-none grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-2.5">
            {i < done ? <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg> : <span className="spinner" aria-hidden="true" />}
            <span className={i < done ? "" : "text-muted"}>{s}</span>
          </li>
        ))}
      </ul>
      <p className="m-0 text-xs text-muted">Quelques secondes. Vous recevrez aussi le rapport par e-mail.</p>
    </div>
  );
}
