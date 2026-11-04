import { LegalPage } from "@/components/Legal";
export const metadata = { title: "Conditions générales de vente" };
export default function CGV() {
  return (
    <LegalPage title="Conditions générales de vente" updated="4 novembre 2026">
      <h2>1. Éditeur</h2><p>Le service Caristo est édité par Digikom Group, EURL, [SIREN], [adresse du siège]. Contact : [e-mail de contact].</p>
      <h2>2. Objet</h2><p>Caristo fournit, contre paiement, un rapport d&apos;information sur un véhicule d&apos;occasion, établi à partir de données enregistrées par des sources tierces (fiche technique, historique officiel lorsque les informations de la carte grise sont fournies, rappels constructeur, base Caristo de pannes connues, estimation de cote, lecture automatique d&apos;une annonce).</p>
      <h2>3. Prix et paiement</h2><p>Les prix sont indiqués en euros toutes taxes comprises. Le paiement est unique, sans abonnement, réglé par carte bancaire via un prestataire de paiement sécurisé. Les packs de 3 et 10 rapports donnent droit à des crédits utilisables pendant 12 ou 24 mois à compter de l&apos;achat.</p>
      <h2>4. Livraison</h2><p>Le rapport est affiché à l&apos;écran dès sa génération et envoyé par e-mail à l&apos;adresse indiquée. Il reste consultable par lien pendant 12 mois.</p>
      <h2>5. Droit de rétractation</h2><p>Le rapport est un contenu numérique fourni immédiatement après paiement. Conformément à l&apos;article L221-28 du Code de la consommation, le client renonce expressément à son droit de rétractation dès la génération du rapport.</p>
      <h2>6. Remboursement si aucune donnée</h2><p>Si aucune source n&apos;a renvoyé de donnée pour le véhicule (rapport vide), le paiement est remboursé automatiquement sous 5 jours ouvrés.</p>
      <h2>7. Nature des informations et limites</h2><p>Le rapport restitue les données enregistrées sur le véhicule à la date d&apos;émission, telles que fournies par les sources. Les pannes connues décrivent des faiblesses fréquentes du modèle et ne constituent pas un diagnostic du véhicule. La cote est une estimation. L&apos;échéancier d&apos;entretien est indicatif. Le rapport ne remplace ni un essai, ni un contrôle mécanique, ni une expertise. Il ne garantit pas l&apos;état du véhicule ni l&apos;absence de vice.</p>
      <h2>8. Responsabilité</h2><p>Digikom Group ne saurait être tenue responsable des décisions prises sur la base du rapport, des erreurs ou omissions contenues dans les données des sources tierces, ni de l&apos;indisponibilité temporaire d&apos;une source. La responsabilité de Digikom Group est en tout état de cause limitée au montant payé pour le rapport.</p>
      <h2>9. Utilisation</h2><p>Le client s&apos;engage à ne saisir que des informations dont il dispose légitimement (notamment les informations de la carte grise communiquées par le titulaire). Le rapport est destiné à un usage personnel ; toute revente est interdite.</p>
      <h2>10. Données personnelles</h2><p>Voir la politique de confidentialité.</p>
      <h2>11. Droit applicable</h2><p>Droit français. En cas de litige, le client peut recourir à un médiateur de la consommation : [médiateur à désigner].</p>
    </LegalPage>
  );
}
