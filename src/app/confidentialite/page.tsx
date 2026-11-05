import { LegalPage } from "@/components/Legal";
export const metadata = { title: "Politique de confidentialité" };
export default function Confidentialite() {
  return (
    <LegalPage title="Politique de confidentialité" updated="5 novembre 2026">
      <h2>Responsable du traitement</h2><p>Digikom Group, EURL, [adresse], contact@rapportcaristo.com.</p>
      <h2>Données collectées</h2><ul><li>Immatriculation ou VIN et kilométrage.</li><li>Informations de la carte grise saisies pour ouvrir l&apos;historique officiel : numéro de formule, nom du titulaire, date de première immatriculation. Elles servent uniquement à cette consultation et sont supprimées 30 jours après la génération du rapport.</li><li>Adresse e-mail, pour envoyer le rapport et les codes de connexion à l&apos;espace « Mes rapports ».</li><li>Données de paiement : traitées par le prestataire de paiement, jamais stockées par Caristo.</li></ul>
      <h2>Finalités et base légale</h2><p>Exécution du contrat (génération et livraison du rapport), obligations légales (facturation), intérêt légitime (sécurité, prévention des abus).</p>
      <h2>Durées de conservation</h2><p>Rapport et lien de partage : 12 mois. E-mail : 12 mois après la dernière commande. Informations de carte grise : 30 jours. Codes de connexion : 24 heures. Session « Mes rapports » : 90 jours. Données de facturation : 10 ans.</p>
      <h2>Destinataires</h2><p>Prestataires techniques (hébergement, paiement, envoi d&apos;e-mails, fournisseurs de données véhicule), tous soumis à des obligations de confidentialité. Aucune revente de données.</p>
      <h2>Vos droits</h2><p>Accès, rectification, effacement, limitation, portabilité, opposition : écrivez à contact@rapportcaristo.com. Vous pouvez saisir la CNIL.</p>
      <h2>Cookies</h2><p>Caristo n&apos;utilise que des cookies techniques strictement nécessaires au fonctionnement du service : un cookie de session pour l&apos;espace « Mes rapports » (90 jours). Aucun cookie publicitaire ni de mesure d&apos;audience.</p>
    </LegalPage>
  );
}
