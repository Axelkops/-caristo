"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Connexion sans mot de passe : e-mail → code à 6 chiffres reçu par e-mail → session.
 */
export function LoginForm({ next = "/mes-rapports", initialEmail = "" }: { next?: string; initialEmail?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  async function post(url: string, body: unknown) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error ?? "Erreur inattendue.");
    return json;
  }

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null); setInfo(null);
    if (!email.trim()) return setError("Indiquez votre adresse e-mail.");
    setLoading(true);
    try {
      const json = await post("/api/auth/request-code", { email });
      setStep("code");
      setCode("");
      setInfo(json.devCode ? `Mode démonstration : votre code est ${json.devCode}.` : json.emailConfigured === false ? "Phase de test : l'envoi d'e-mails n'est pas encore activé sur ce site." : `Code envoyé à ${email.trim().toLowerCase()}. Pensez à vérifier les spams.`);
      setTimeout(() => codeRef.current?.focus(), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible. Réessayez.");
    } finally { setLoading(false); }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.replace(/\D/g, "").length !== 6) return setError("Saisissez les 6 chiffres du code.");
    setLoading(true);
    try {
      await post("/api/auth/verify", { email, code });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connexion impossible. Réessayez.");
    } finally { setLoading(false); }
  }

  const field = "w-full h-12 rounded-xl border border-line bg-white px-3.5 text-[15px] focus:border-navy";

  return (
    <div className="bg-white border border-line rounded-[20px] p-6 sm:p-8 flex flex-col gap-6 max-w-md w-full">
      {step === "email" ? (
        <form onSubmit={sendCode} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-2xl font-bold">Mes rapports</h1>
            <p className="m-0 text-sm text-[#4B5563]">Saisissez l&apos;adresse e-mail utilisée pour vos rapports. Vous recevrez un code à 6 chiffres : pas de mot de passe à retenir.</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-email" className="text-sm font-semibold">Votre e-mail</label>
            <input id="login-email" type="email" inputMode="email" autoComplete="email" placeholder="vous@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} className={field} autoFocus />
          </div>
          {error && <p role="alert" className="m-0 bg-badbg text-badtext rounded-xl px-4 py-3 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="h-12 px-6 rounded-xl bg-navy text-white font-semibold text-[15px] disabled:opacity-70 inline-flex items-center justify-center gap-2.5">{loading && <span className="spinner !border-t-white !border-white/30" aria-hidden="true" />}Recevoir mon code</button>
        </form>
      ) : (
        <form onSubmit={verify} className="flex flex-col gap-5" noValidate>
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 text-2xl font-bold">Entrez votre code</h1>
            <p className="m-0 text-sm text-[#4B5563]">{info}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="login-code" className="text-sm font-semibold">Code à 6 chiffres</label>
            <input ref={codeRef} id="login-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} placeholder="123456" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} className={`${field} display text-[26px] tracking-[8px] text-center h-14`} />
            <span className="text-xs text-muted">Valable 10 minutes.</span>
          </div>
          {error && <p role="alert" className="m-0 bg-badbg text-badtext rounded-xl px-4 py-3 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="h-12 px-6 rounded-xl bg-navy text-white font-semibold text-[15px] disabled:opacity-70 inline-flex items-center justify-center gap-2.5">{loading && <span className="spinner !border-t-white !border-white/30" aria-hidden="true" />}Me connecter</button>
          <div className="flex justify-between text-sm">
            <button type="button" onClick={() => { setStep("email"); setError(null); }} className="text-muted bg-transparent border-0 p-0 cursor-pointer">Changer d&apos;adresse</button>
            <button type="button" onClick={() => sendCode()} disabled={loading} className="text-navy font-semibold bg-transparent border-0 p-0 cursor-pointer">Renvoyer un code</button>
          </div>
        </form>
      )}
    </div>
  );
}
