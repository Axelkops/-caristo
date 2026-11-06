import Link from "next/link";
import { SITE } from "@/lib/site";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="bg-ink text-muteddark px-4 sm:px-6 pt-14 pb-8">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-10">
        <div className="flex flex-wrap gap-10 justify-between">
          <div className="flex flex-col gap-3.5 max-w-[320px]">
            <Logo />
            <p className="m-0 text-sm leading-relaxed">Le rapport complet sur un véhicule d&apos;occasion, avant de l&apos;acheter.</p>
          </div>
          <div className="flex flex-col gap-2.5 text-sm">
            <span className="text-white font-semibold">Produit</span>
            <Link href="/#contenu" className="no-underline text-muteddark hover:text-white">Le rapport</Link>
            <Link href="/#pannes" className="no-underline text-muteddark hover:text-white">Pannes connues</Link>
            <Link href="/#verifier" className="no-underline text-muteddark hover:text-white">Points à vérifier</Link>
            <Link href="/#entretien" className="no-underline text-muteddark hover:text-white">Entretien</Link>
            <Link href="/#tarifs" className="no-underline text-muteddark hover:text-white">Tarifs</Link>
            <Link href="/mes-rapports" className="no-underline text-muteddark hover:text-white">Mes rapports</Link>
          </div>
          <div className="flex flex-col gap-2.5 text-sm">
            <span className="text-white font-semibold">Légal</span>
            <Link href="/cgv" className="no-underline text-muteddark hover:text-white">Conditions générales de vente</Link>
            <Link href="/confidentialite" className="no-underline text-muteddark hover:text-white">Politique de confidentialité</Link>
            <Link href="/mentions-legales" className="no-underline text-muteddark hover:text-white">Mentions légales</Link>
          </div>
          <div className="flex flex-col gap-2.5 text-sm">
            <span className="text-white font-semibold">Contact</span>
            <a href={`mailto:${SITE.contactEmail}`} className="select-all text-muteddark hover:text-white no-underline">{SITE.contactEmail}</a>
            <span>Réponse sous 24 h ouvrées</span>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 flex flex-wrap justify-between gap-3 text-[13px]">
          <span>© {new Date().getFullYear()} {SITE.name} · Tous droits réservés</span>
          <span>Données issues de sources tierces, restituées telles qu&apos;enregistrées à la date du rapport.</span>
        </div>
      </div>
    </footer>
  );
}
