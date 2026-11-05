"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** Lien « Mes rapports » ou « Se connecter » selon la session (lu côté client pour garder l'accueil statique). */
export function NavAccount() {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  const pathname = usePathname();
  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json()).then((j) => { if (alive) setEmail(j.email ?? null); }).catch(() => { if (alive) setEmail(null); });
    return () => { alive = false; };
  }, [pathname]);
  return <Link href={email ? "/mes-rapports" : "/connexion"} className="text-muteddark hover:text-white no-underline">{email ? "Mes rapports" : "Se connecter"}</Link>;
}
