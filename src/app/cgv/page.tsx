import { LegalPage } from "@/components/Legal";
import { OFFERS, formatEuros } from "@/lib/services/pricing";
import { COMPANY, SITE } from "@/lib/site";

export const metadata = { title: "Conditions générales de vente" };

const TOC = [
  ["1", "Éditeur et champ d'application"], ["2", "Définitions"], ["3", "Le service"], ["4", "Espace « Mes rapports »"], ["5", "Commande"],
  ["6", "Prix"], ["7", "Paiement"], ["8", "Packs de rapports"], ["9", "Livraison et accès au rapport"], ["10", "Droit de rétractation"],
  ["11", "Rapport impossible à produire"], ["12", "Nature des informations et limites"], ["13", "Obligations de l'utilisateur"], ["14", "Responsabilité"],
  ["15", "Propriété intellectuelle"], ["16", "Données personnelles"], ["17", "Suspension et résiliation"], ["18", "Modification des conditions"], ["19", "Droit applicable et réclamations"],
].map(([n, l]) => ({ id: `cgv-${n}`, label: `${n}. ${l}` }));

export default function CGV() {
  const mail = <a href={`mailto:${SITE.contactEmail}`}>{SITE.contactEmail}</a>;
  return (
    <LegalPage title="Conditions générales de vente et d'utilisation" updated={SITE.legalUpdated} intro={`Les présentes conditions régissent l'utilisation du site ${SITE.domain} et l'achat des rapports ${SITE.name}. En commandant un rapport, vous les acceptez sans réserve.`} toc={TOC}>
      <h2 id="cgv-1">1. Éditeur et champ d&apos;application</h2>
      <p>Le service {SITE.name} est édité par {COMPANY.name}, {COMPANY.form}, {COMPANY.rcs} n° {COMPANY.siren} (ci-après « {SITE.name} » ou « nous »). Contact : {mail}. Les présentes conditions s&apos;appliquent à toute commande passée sur {SITE.domain}, par un consommateur ou un professionnel. Elles prévalent sur tout autre document.</p>

      <h2 id="cgv-2">2. Définitions</h2>
      <ul>
        <li><strong>Rapport</strong> : le document d&apos;information produit par {SITE.name} sur un véhicule identifié par sa plaque d&apos;immatriculation ou son numéro VIN.</li>
        <li><strong>Pack</strong> : un lot de crédits permettant de produire plusieurs rapports pendant une durée déterminée.</li>
        <li><strong>Espace « Mes rapports »</strong> : l&apos;espace personnel rattaché à l&apos;adresse e-mail de l&apos;utilisateur, où sont conservés ses rapports et ses packs.</li>
        <li><strong>Utilisateur</strong> : toute personne qui commande un rapport, qu&apos;elle soit acheteur, vendeur ou propriétaire du véhicule.</li>
      </ul>

      <h2 id="cgv-3">3. Le service</h2>
      <p>{SITE.name} fournit, contre paiement unique, un rapport d&apos;information sur un véhicule d&apos;occasion. Selon le véhicule et les informations fournies, le rapport comprend : la fiche technique, l&apos;historique officiel lorsque les trois informations de la carte grise ont été saisies et que la source est disponible (contrôles techniques, relevés de kilométrage, sinistres enregistrés, situation administrative), les pannes connues du modèle issues de la base {SITE.name}, les rappels constructeur, une estimation de cote, un échéancier d&apos;entretien à 12, 24 et 36 mois et un indice de confiance. Le rapport indique explicitement les sections pour lesquelles aucune donnée n&apos;a pu être obtenue.</p>
      <p>{SITE.name} est un service indépendant : il ne vend pas de véhicule, n&apos;intervient pas dans la transaction entre vendeur et acheteur et n&apos;est lié à aucun constructeur ni administration.</p>

      <h2 id="cgv-4">4. Espace « Mes rapports »</h2>
      <p>L&apos;espace « Mes rapports » est créé automatiquement avec la première commande et rattaché à l&apos;adresse e-mail saisie. Il n&apos;y a pas de mot de passe : la connexion se fait par un code à usage unique envoyé à cette adresse, valable 10 minutes. L&apos;utilisateur est responsable de l&apos;accès à sa boîte e-mail ; toute personne ayant accès à cette boîte peut accéder à l&apos;espace. Une session reste ouverte 90 jours sur l&apos;appareil utilisé, sauf déconnexion.</p>

      <h2 id="cgv-5">5. Commande</h2>
      <p>La commande se déroule en trois étapes : identification du véhicule (plaque ou VIN) et affichage de la fiche reconnue, que l&apos;utilisateur vérifie ; saisie du kilométrage, des informations de la carte grise (facultatives) et de l&apos;adresse e-mail, puis choix de l&apos;offre ; paiement. La commande est ferme au paiement. Le rapport est ensuite produit immédiatement. {SITE.name} se réserve le droit de refuser une commande en cas d&apos;abus manifeste ou de suspicion de fraude.</p>

      <h2 id="cgv-6">6. Prix</h2>
      <p>Les prix sont indiqués en euros, toutes taxes comprises (TVA française incluse). À la date de mise à jour des présentes : rapport unique {formatEuros(OFFERS.single.priceCents)} ; pack de {OFFERS.pack3.credits} rapports {formatEuros(OFFERS.pack3.priceCents)} ; pack de {OFFERS.pack10.credits} rapports {formatEuros(OFFERS.pack10.priceCents)}. Le prix applicable est celui affiché au moment de la commande. Une facture est disponible sur demande à {mail}.</p>

      <h2 id="cgv-7">7. Paiement</h2>
      <p>Le paiement est unique, sans abonnement. Il s&apos;effectue par carte bancaire, Apple Pay ou Google Pay via notre prestataire de paiement sécurisé (Stripe). {SITE.name} n&apos;a jamais accès aux données de carte. En cas de refus du paiement, la commande n&apos;est pas enregistrée.</p>

      <h2 id="cgv-8">8. Packs de rapports</h2>
      <ul>
        <li>Un pack donne droit à un nombre de crédits ({OFFERS.pack3.credits} ou {OFFERS.pack10.credits}), un crédit permettant de produire un rapport.</li>
        <li>Le premier rapport est produit immédiatement avec le pack ; les crédits restants sont utilisables depuis l&apos;espace « Mes rapports », pendant {OFFERS.pack3.validityMonths} mois (pack {OFFERS.pack3.credits}) ou {OFFERS.pack10.validityMonths} mois (pack {OFFERS.pack10.credits}) à compter de l&apos;achat. Les crédits non utilisés à l&apos;échéance sont perdus.</li>
        <li>Les crédits sont rattachés à l&apos;adresse e-mail de l&apos;achat ; ils ne sont ni transférables ni échangeables contre de l&apos;argent, sauf dans le cadre du droit de rétractation (article 10).</li>
        <li>Un crédit est consommé dès que la production d&apos;un rapport est lancée, y compris lorsque certaines sections du rapport restent vides (article 12), sous réserve de l&apos;article 11.</li>
      </ul>

      <h2 id="cgv-9">9. Livraison et accès au rapport</h2>
      <p>Le rapport est affiché à l&apos;écran dès sa production, en général en moins d&apos;une minute, et un e-mail contenant le lien d&apos;accès est envoyé à l&apos;adresse indiquée. Il est consultable, téléchargeable en PDF et partageable par lien pendant 12 mois à compter de sa production, depuis l&apos;espace « Mes rapports ». Passé ce délai, il est supprimé. Le lien de partage donne accès au rapport à toute personne qui le détient : l&apos;utilisateur choisit librement de le transmettre ou non.</p>

      <h2 id="cgv-10">10. Droit de rétractation</h2>
      <p>Le rapport est un contenu numérique fourni sans support matériel, dont l&apos;exécution commence immédiatement après le paiement. Conformément à l&apos;article L221-28 13° du Code de la consommation, en validant le paiement, l&apos;utilisateur demande expressément l&apos;exécution immédiate et reconnaît perdre son droit de rétractation pour le rapport produit.</p>
      <p>Pour un pack, le droit de rétractation subsiste pendant 14 jours à compter de l&apos;achat pour les crédits non utilisés : l&apos;utilisateur est remboursé du prix du pack, déduction faite des rapports déjà produits, chacun étant décompté au prix du rapport unique en vigueur. La demande se fait par e-mail à {mail}, en indiquant l&apos;adresse e-mail de l&apos;achat ; un modèle de formulaire figure en annexe. Le remboursement intervient sous 14 jours sur le moyen de paiement utilisé.</p>

      <h2 id="cgv-11">11. Rapport impossible à produire</h2>
      <p>Le véhicule est identifié avant le paiement. Si, malgré cela, aucune source ne renvoie de donnée et que le rapport ne peut pas être produit, la commande est remboursée (ou le crédit restitué) sous 5 jours ouvrés, sur simple demande à {mail} ou à l&apos;initiative de {SITE.name}.</p>

      <h2 id="cgv-12">12. Nature des informations et limites</h2>
      <ul>
        <li>Le rapport restitue les données enregistrées sur le véhicule à la date de sa production, telles que fournies par des sources tierces. {SITE.name} ne les crée pas et ne peut garantir leur exhaustivité ni leur exactitude.</li>
        <li>L&apos;historique officiel ne contient qu&apos;un relevé de kilométrage par contrôle technique ; une réparation payée sans assureur ne figure dans aucune base ; les périodes à l&apos;étranger ne sont pas couvertes.</li>
        <li>Les pannes connues décrivent des faiblesses fréquentes du modèle ; elles ne constituent pas un diagnostic du véhicule concerné.</li>
        <li>La cote et l&apos;échéancier d&apos;entretien sont des estimations indicatives. L&apos;indice de confiance est un indicateur synthétique calculé à partir des données disponibles.</li>
        <li>Le rapport ne remplace ni un essai, ni un contrôle en garage, ni une expertise. Il ne garantit ni l&apos;état du véhicule, ni l&apos;absence de vice, ni la régularité d&apos;une vente.</li>
      </ul>

      <h2 id="cgv-13">13. Obligations de l&apos;utilisateur</h2>
      <ul>
        <li>Ne saisir que des informations dont il dispose légitimement, en particulier les informations de la carte grise, communiquées par le titulaire du véhicule ou figurant sur un document qu&apos;il est autorisé à consulter.</li>
        <li>Utiliser le rapport pour son propre besoin d&apos;information dans le cadre d&apos;un achat, d&apos;une vente ou de la gestion de son véhicule. La revente, la diffusion commerciale, l&apos;extraction automatisée du site ou la constitution de bases de données à partir des rapports sont interdites.</li>
        <li>Ne pas utiliser le service pour nuire à une personne, usurper une identité ou contourner une réglementation.</li>
      </ul>

      <h2 id="cgv-14">14. Responsabilité</h2>
      <p>{SITE.name} est tenu d&apos;une obligation de moyens. {COMPANY.name} ne saurait être tenue responsable des décisions prises sur la base d&apos;un rapport (achat, vente, prix négocié, renoncement), des erreurs, omissions ou retards des sources tierces, de l&apos;indisponibilité temporaire d&apos;une source ou du site, ni des conséquences d&apos;informations inexactes saisies par l&apos;utilisateur. En toute hypothèse, la responsabilité de {COMPANY.name} est limitée au montant payé pour la commande concernée. {COMPANY.name} n&apos;est pas responsable des cas de force majeure au sens de l&apos;article 1218 du Code civil.</p>

      <h2 id="cgv-15">15. Propriété intellectuelle</h2>
      <p>Le site, la marque {SITE.name}, les textes, visuels, la base de pannes connues et la présentation des rapports sont protégés. L&apos;utilisateur dispose d&apos;un droit d&apos;usage personnel et non exclusif sur les rapports qu&apos;il a achetés. Toute autre utilisation nécessite l&apos;accord écrit de {COMPANY.name}.</p>

      <h2 id="cgv-16">16. Données personnelles</h2>
      <p>Le traitement des données personnelles est décrit dans la <a href="/confidentialite">politique de confidentialité</a>, qui fait partie des présentes conditions.</p>

      <h2 id="cgv-17">17. Suspension et résiliation</h2>
      <p>En cas de manquement aux présentes (fraude, usage abusif, saisie d&apos;informations détenues illégitimement), {SITE.name} peut suspendre l&apos;accès à l&apos;espace « Mes rapports » et refuser toute nouvelle commande, après en avoir informé l&apos;utilisateur par e-mail. Les rapports déjà payés restent accessibles pendant leur durée de conservation, sauf injonction d&apos;une autorité.</p>

      <h2 id="cgv-18">18. Modification des conditions</h2>
      <p>{SITE.name} peut modifier les présentes conditions. La version applicable à une commande est celle en vigueur au moment du paiement ; elle est datée en haut de cette page.</p>

      <h2 id="cgv-19">19. Droit applicable et réclamations</h2>
      <p>Les présentes conditions sont soumises au droit français. Toute réclamation est à adresser en priorité à {mail} : {COMPANY.name} s&apos;engage à répondre sous 30 jours. À défaut de résolution amiable, les tribunaux français sont compétents ; pour un utilisateur professionnel, compétence est attribuée aux tribunaux du ressort du siège de {COMPANY.name}.</p>

      <h2 id="cgv-annexe">Annexe : modèle de formulaire de rétractation (packs)</h2>
      <p>À l&apos;attention de {COMPANY.name} ({SITE.name}), {SITE.contactEmail} : je vous notifie ma rétractation du contrat portant sur l&apos;achat du pack ci-dessous. Adresse e-mail de l&apos;achat : ………… Date de l&apos;achat : ………… Nom : ………… Date : …………</p>
    </LegalPage>
  );
}
