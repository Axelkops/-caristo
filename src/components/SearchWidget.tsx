"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SearchWidget({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [kind, setKind] = useState<"plate" | "vin">("plate");
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!value.trim()) { setError(kind === "plate" ? "Saisissez la plaque d'immatriculation." : "Saisissez le numéro VIN (17 caractères)."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/identify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input: value, kind }) });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Erreur inattendue."); return; }
      router.push(`/verification/${json.reportId}`);
    } catch {
      setError("Connexion impossible. Vérifiez votre réseau et réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`bg-white rounded-[18px] p-2 flex flex-col gap-1.5 ${compact ? "shadow-lg" : "glow-card"}`}>
      <div className="flex gap-1 px-1 pt-1" role="tablist" aria-label="Type d'identifiant">
        <button type="button" role="tab" aria-selected={kind === "plate"} onClick={() => { setKind("plate"); setError(null); }} className={`flex-1 text-center py-2 rounded-[10px] text-[13px] no-underline ${kind === "plate" ? "bg-ground text-navy font-semibold" : "text-muted font-medium"}`}>Plaque</button>
        <button type="button" role="tab" aria-selected={kind === "vin"} onClick={() => { setKind("vin"); setError(null); }} className={`flex-1 text-center py-2 rounded-[10px] text-[13px] no-underline ${kind === "vin" ? "bg-ground text-navy font-semibold" : "text-muted font-medium"}`}>Numéro VIN</button>
      </div>
      <form onSubmit={submit} className="flex flex-wrap gap-2 items-center p-1" noValidate>
        <div className="flex items-center flex-[1_1_240px] min-w-0 border-2 border-navy rounded-xl overflow-hidden bg-white">
          {kind === "plate" && <span aria-hidden="true" className="bg-[#1D4ED8] text-white text-xs font-semibold px-3 h-14 flex items-center">F</span>}
          <label htmlFor="identifier" className="sr-only">{kind === "plate" ? "Plaque d'immatriculation" : "Numéro VIN"}</label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value.toUpperCase())}
            placeholder={kind === "plate" ? "AB-123-CD" : "VF3XXXXXXXXXXXXXX"}
            maxLength={kind === "plate" ? 12 : 17}
            className={`flex-1 min-w-0 h-14 border-0 outline-0 display font-bold px-4 text-navy uppercase ${kind === "plate" ? "text-2xl tracking-[3px]" : "text-lg tracking-[1.5px]"}`}
          />
        </div>
        <button type="submit" disabled={loading} className="h-14 px-6 rounded-xl bg-navy text-white text-[15px] font-semibold inline-flex items-center gap-2.5 disabled:opacity-70">
          {loading ? <span className="spinner !border-t-white !border-white/30" aria-hidden="true" /> : null}
          {loading ? "Identification…" : "Obtenir le rapport"}
          {!loading && <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>}
        </button>
        {error && <p role="alert" className="w-full m-0 px-2 pb-1 text-sm text-badtext">{error} <Link href="/verification/manuel" className="font-semibold underline">Décrire mon véhicule</Link></p>}
      </form>
    </div>
  );
}
