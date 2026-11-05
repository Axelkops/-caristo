import { LegalPage } from "@/components/Legal";
import { COMPANY, HOST, SITE } from "@/lib/site";

export const metadata = { title: "Mentions légales" };

export default function Mentions() {
  return (
    <LegalPage title="Mentions légales" updated={SITE.legalUpdated} intro="Informations prévues par la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique.">
      <h2>Éditeur du site</h2>
      <ul>
        <li><strong>Service</strong> : {SITE.name}, site {SITE.domain}</li>
        <li><strong>Société</strong> : {COMPANY.name}, {COMPANY.form}, au capital de {COMPANY.capital}</li>
        <li><strong>Immatriculation</strong> : {COMPANY.rcs} n° {COMPANY.siren}</li>
        <li><strong>N° de TVA intracommunautaire</strong> : {COMPANY.vat}</li>
        <li><strong>Siège</strong> : {COMPANY.city} ; l&apos;adresse postale complète est communiquée sur simple demande par e-mail</li>
        <li><strong>Directeur de la publication</strong> : {COMPANY.manager}, gérant</li>
        <li><strong>Contact</strong> : <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> (réponse sous 24 h ouvrées)</li>
      </ul>

      <h2>Hébergement</h2>
      <p>{HOST.name}, {HOST.address} ; {HOST.note}. Les données sont stockées sur un serveur dédié situé en France.</p>

      <h2>Propriété intellectuelle</h2>
      <p>Le site, son nom, son logo, ses textes, ses visuels, sa base de pannes connues et ses rapports sont la propriété de {COMPANY.name} ou font l&apos;objet d&apos;une licence. Toute reproduction, représentation ou extraction, totale ou partielle, sans autorisation écrite est interdite. Les marques et modèles automobiles cités appartiennent à leurs propriétaires respectifs et ne sont mentionnés qu&apos;à titre d&apos;identification des véhicules.</p>

      <h2>Nature du service et sources</h2>
      <p>{SITE.name} est un service d&apos;information indépendant, sans lien avec les constructeurs automobiles, les administrations ni les organismes de contrôle. Les données restituées proviennent de sources tierces et sont présentées telles qu&apos;enregistrées à la date d&apos;émission du rapport. Un rapport ne constitue ni une expertise, ni un diagnostic, ni une garantie sur l&apos;état d&apos;un véhicule.</p>

      <h2>Signaler un contenu ou une erreur</h2>
      <p>Pour signaler une erreur dans un rapport, un contenu illicite ou un usage abusif du service, écrivez à <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a> en précisant la référence du rapport concerné.</p>

      <h2>Données personnelles et cookies</h2>
      <p>Le traitement des données personnelles et l&apos;usage des cookies sont décrits dans la <a href="/confidentialite">politique de confidentialité</a>.</p>
    </LegalPage>
  );
}
