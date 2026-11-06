import { LegalPage } from "@/components/Legal";
import { COMPANY, HOST, SITE } from "@/lib/site";

export const metadata = { title: "Politique de confidentialité" };

const TOC = [
  ["1", "Responsable du traitement"], ["2", "Données traitées"], ["3", "Finalités et bases légales"], ["4", "Destinataires et sous-traitants"],
  ["5", "Transferts hors Union européenne"], ["6", "Durées de conservation"], ["7", "Vos droits"], ["8", "Cookies"], ["9", "Sécurité"], ["10", "Mineurs"], ["11", "Modifications"],
].map(([n, l]) => ({ id: `pc-${n}`, label: `${n}. ${l}` }));

export default function Confidentialite() {
  const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;
  return (
    <LegalPage title="Politique de confidentialité" updated={SITE.legalUpdated} intro={`Cette politique explique quelles données ${SITE.name} traite, pourquoi, combien de temps, et comment exercer vos droits (règlement européen 2016/679 « RGPD » et loi Informatique et Libertés).`} toc={TOC}>
      <div className="bg-white border border-line rounded-2xl px-5 py-4 flex flex-col gap-2">
        <strong>L&apos;essentiel</strong>
        <ul>
          <li>Nous ne demandons que ce qui sert à produire votre rapport : la plaque ou le VIN, le kilométrage, votre e-mail, trois informations de la carte grise (pour un véhicule immatriculé en France) et, si vous le souhaitez, le prix de l&apos;annonce.</li>
          <li>Les informations de la carte grise servent uniquement à consulter l&apos;historique officiel et sont effacées 30 jours après la production du rapport.</li>
          <li>Pas de mot de passe : votre espace fonctionne avec un code envoyé par e-mail.</li>
          <li>Aucune revente de données, aucune publicité, aucun cookie de suivi.</li>
          <li>Vos rapports sont conservés 12 mois, puis supprimés.</li>
        </ul>
      </div>

      <h2 id="pc-1">1. Responsable du traitement</h2>
      <p>{COMPANY.name}, {COMPANY.formShort}, {COMPANY.rcs} n° {COMPANY.siren}, éditrice du service {SITE.name}. Contact pour toute question sur vos données : {mail}.</p>

      <h2 id="pc-2">2. Données traitées</h2>
      <div className="overflow-x-auto -mx-1 px-1"><table className="min-w-[520px]">
        <thead><tr><th>Catégorie</th><th>Données</th><th>Origine</th></tr></thead>
        <tbody>
          <tr><td>Véhicule</td><td>Plaque d&apos;immatriculation ou VIN, kilométrage saisi, prix de l&apos;annonce (facultatif), fiche technique obtenue</td><td>Vous, puis nos fournisseurs de données</td></tr>
          <tr><td>Carte grise (véhicule immatriculé en France)</td><td>Numéro de formule, nom du titulaire, date de première immatriculation</td><td>Vous</td></tr>
          <tr><td>Contact et compte</td><td>Adresse e-mail, codes de connexion (stockés sous forme hachée), sessions</td><td>Vous</td></tr>
          <tr><td>Commande</td><td>Offre choisie, montant, date, référence de paiement. Les données de carte ne transitent jamais par {SITE.name}.</td><td>Vous et Stripe</td></tr>
          <tr><td>Rapport</td><td>Le contenu du rapport produit et son lien de partage</td><td>Produit par {SITE.name}</td></tr>
          <tr><td>Techniques</td><td>Adresse IP, type de navigateur, journaux de sécurité (limitation des abus)</td><td>Votre navigateur</td></tr>
        </tbody>
      </table></div>
      <p>Le nom du titulaire de la carte grise peut concerner une autre personne que vous (le vendeur). Vous ne devez le saisir que s&apos;il vous a été communiqué par cette personne ; il n&apos;est utilisé que pour la consultation de l&apos;historique officiel et n&apos;apparaît pas dans le rapport.</p>

      <h2 id="pc-3">3. Finalités et bases légales</h2>
      <div className="overflow-x-auto -mx-1 px-1"><table className="min-w-[520px]">
        <thead><tr><th>Finalité</th><th>Base légale</th></tr></thead>
        <tbody>
          <tr><td>Identifier le véhicule, produire et livrer le rapport, gérer les packs et l&apos;espace « Mes rapports »</td><td>Exécution du contrat</td></tr>
          <tr><td>Envoyer les e-mails du service (rapport prêt, codes de connexion)</td><td>Exécution du contrat</td></tr>
          <tr><td>Encaisser le paiement, établir les factures, tenir la comptabilité</td><td>Obligation légale</td></tr>
          <tr><td>Sécuriser le service, limiter les tentatives d&apos;accès et les abus</td><td>Intérêt légitime</td></tr>
          <tr><td>Répondre aux demandes et réclamations</td><td>Exécution du contrat et intérêt légitime</td></tr>
        </tbody>
      </table></div>
      <p>Aucune décision produisant des effets juridiques à votre égard n&apos;est prise de manière entièrement automatisée. L&apos;indice de confiance et les mentions du rapport sont des indicateurs d&apos;information ; leur appréciation vous appartient. Nous n&apos;envoyons aucune communication commerciale sans votre accord préalable.</p>

      <h2 id="pc-4">4. Destinataires et sous-traitants</h2>
      <ul>
        <li><strong>Hébergement</strong> : {HOST.name}, {HOST.note}.</li>
        <li><strong>Fournisseurs de données véhicule</strong> : ils reçoivent la plaque ou le VIN, uniquement pour identifier le véhicule.</li>
        <li><strong>Historique officiel</strong> : le service public HistoVec (ministère de l&apos;Intérieur) reçoit la plaque et les informations de la carte grise, uniquement pour répondre à la consultation.</li>
        <li><strong>Paiement</strong> : Stripe (données de paiement, traitées sous sa propre responsabilité).</li>
        <li><strong>E-mails</strong> : notre prestataire d&apos;envoi reçoit votre adresse et le contenu des e-mails du service.</li>
        <li><strong>Autorités</strong> : uniquement sur réquisition légale.</li>
      </ul>
      <p>Aucune donnée n&apos;est vendue ni cédée à des fins commerciales. Les sous-traitants sont liés par contrat aux obligations du RGPD.</p>

      <h2 id="pc-5">5. Transferts hors Union européenne</h2>
      <p>Le site et sa base de données sont hébergés en France. Certains prestataires (paiement, envoi d&apos;e-mails) peuvent traiter des données aux États-Unis ; ces transferts sont encadrés par le cadre de protection des données UE–États-Unis ou par les clauses contractuelles types de la Commission européenne.</p>

      <h2 id="pc-6">6. Durées de conservation</h2>
      <div className="overflow-x-auto -mx-1 px-1"><table className="min-w-[520px]">
        <thead><tr><th>Données</th><th>Durée</th></tr></thead>
        <tbody>
          <tr><td>Rapport, lien de partage, kilométrage et fiche véhicule</td><td>12 mois après la production du rapport</td></tr>
          <tr><td>Informations de la carte grise</td><td>30 jours après la production du rapport</td></tr>
          <tr><td>Commande non finalisée (véhicule identifié sans paiement)</td><td>7 jours</td></tr>
          <tr><td>Adresse e-mail et espace « Mes rapports »</td><td>12 mois après la dernière commande ou l&apos;expiration du dernier pack</td></tr>
          <tr><td>Codes de connexion</td><td>24 heures</td></tr>
          <tr><td>Sessions « Mes rapports »</td><td>90 jours</td></tr>
          <tr><td>Journaux techniques</td><td>12 mois</td></tr>
          <tr><td>Données de facturation</td><td>10 ans (obligation comptable)</td></tr>
        </tbody>
      </table></div>

      <h2 id="pc-7">7. Vos droits</h2>
      <p>Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de limitation, de portabilité et d&apos;opposition, ainsi que du droit de définir des directives sur le sort de vos données après votre décès. Pour les exercer, écrivez à {mail} depuis l&apos;adresse e-mail utilisée pour vos commandes (ou joignez un justificatif). Nous répondons sous un mois. Vous pouvez aussi introduire une réclamation auprès de la CNIL (cnil.fr).</p>

      <h2 id="pc-8">8. Cookies</h2>
      <p>{SITE.name} n&apos;utilise qu&apos;un cookie strictement nécessaire : le cookie de session de l&apos;espace « Mes rapports » (90 jours, supprimé à la déconnexion). Aucun cookie publicitaire, de mesure d&apos;audience ou de réseau social n&apos;est déposé ; aucun bandeau de consentement n&apos;est donc nécessaire.</p>

      <h2 id="pc-9">9. Sécurité</h2>
      <p>Les échanges sont chiffrés (HTTPS). Les codes de connexion sont stockés sous forme hachée, limités à 5 essais et expirent après 10 minutes. Les données de carte bancaire sont traitées exclusivement par Stripe. L&apos;accès au serveur est restreint et la base de données est sauvegardée quotidiennement.</p>

      <h2 id="pc-10">10. Mineurs</h2>
      <p>Le service s&apos;adresse à des personnes majeures. Aucune commande ne doit être passée par un mineur.</p>

      <h2 id="pc-11">11. Modifications</h2>
      <p>Cette politique peut être mise à jour ; la date figure en haut de la page. En cas de changement important, les utilisateurs disposant d&apos;un espace actif en sont informés par e-mail.</p>
    </LegalPage>
  );
}
