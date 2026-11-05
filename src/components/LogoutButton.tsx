"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  return (
    <button type="button" disabled={loading} onClick={async () => { setLoading(true); await fetch("/api/auth/logout", { method: "POST" }); router.push("/"); router.refresh(); }} className="text-sm font-semibold text-muted bg-transparent border border-line rounded-lg px-3 py-2 cursor-pointer hover:text-fg disabled:opacity-60">Se déconnecter</button>
  );
}
