import Link from "next/link";
import { Logo } from "./Logo";
import { NavAccount } from "./NavAccount";

export function Nav() {
  return (
    <header className="bg-ink text-white border-b border-white/5">
      <nav className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-6 flex-wrap">
        <Logo />
        <div className="flex items-center gap-5 sm:gap-6 flex-wrap text-sm font-medium">
          <Link href="/#contenu" className="text-muteddark hover:text-white no-underline">Le rapport</Link>
          <Link href="/#pannes" className="text-muteddark hover:text-white no-underline hidden sm:inline">Pannes connues</Link>
          <Link href="/#entretien" className="text-muteddark hover:text-white no-underline hidden sm:inline">Entretien</Link>
          <Link href="/#tarifs" className="text-muteddark hover:text-white no-underline">Tarifs</Link>
          <NavAccount />
          <Link href="/#top" className="bg-accent text-ink px-4 py-2.5 rounded-[10px] font-semibold led no-underline">Vérifier un véhicule</Link>
        </div>
      </nav>
    </header>
  );
}
