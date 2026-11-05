import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getSessionEmail } from "@/lib/services/auth";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };
export const dynamic = "force-dynamic";

function safeNext(v?: string): string {
  return v && v.startsWith("/") && !v.startsWith("//") ? v : "/mes-rapports";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; email?: string }> }) {
  const { next, email } = await searchParams;
  if (await getSessionEmail()) redirect(safeNext(next));
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 py-14 flex flex-col items-center gap-6">
      <LoginForm next={safeNext(next)} initialEmail={email ?? ""} />
      <p className="m-0 text-sm text-muted text-center max-w-md">Votre espace est créé automatiquement avec le premier rapport acheté : il suffit de vous connecter avec la même adresse e-mail.</p>
    </div>
  );
}
