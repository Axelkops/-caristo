import { LegalPage } from "@/components/Legal";
export const metadata = { title: "Mentions légales" };
export default function Mentions() {
  return (
    <LegalPage title="Mentions légales" updated="4 novembre 2026">
      <h2>Éditeur</h2><p>Digikom Group, EURL au capital de [capital] €, immatriculée au RCS de [ville] sous le numéro [SIREN], siège social : [adresse]. Directeur de la publication : [nom du gérant]. Contact : [e-mail de contact].</p>
      <h2>Hébergement</h2><p>[Hébergeur, adresse].</p>
      <h2>Propriété intellectuelle</h2><p>Le site, sa marque, son logo et ses contenus sont protégés. Toute reproduction sans autorisation est interdite. Les marques automobiles citées appartiennent à leurs propriétaires respectifs et ne sont mentionnées qu&apos;à titre d&apos;identification des véhicules.</p>
      <h2>Sources</h2><p>Les données restituées proviennent de sources tierces et sont présentées telles qu&apos;enregistrées à la date du rapport. Caristo est un service indépendant, sans lien avec les constructeurs ni les administrations.</p>
    </LegalPage>
  );
}
