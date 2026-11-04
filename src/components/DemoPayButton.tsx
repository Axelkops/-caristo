"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function DemoPayButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function pay() {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/demo/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reportId }) });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Erreur"); return; }
      router.push(json.next);
    } catch { setError("Connexion impossible."); } finally { setLoading(false); }
  }
  return (
    <div className="flex flex-col gap-3">
      <button onClick={pay} disabled={loading} className="h-14 rounded-xl bg-accent text-ink font-semibold led disabled:opacity-70 inline-flex items-center justify-center gap-2.5">{loading && <span className="spinner" aria-hidden="true" />}Payer (simulation)</button>
      {error && <p role="alert" className="m-0 text-sm text-badtext">{error}</p>}
    </div>
  );
}
