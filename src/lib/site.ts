/**
 * Coordonnées et informations légales du service : un seul endroit à modifier.
 * L'e-mail de contact peut être surchargé par la variable NEXT_PUBLIC_CONTACT_EMAIL.
 */
export const SITE = {
  name: "Caristo",
  domain: "rapportcaristo.com",
  url: "https://rapportcaristo.com",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@rapportcaristo.com",
  legalUpdated: "5 novembre 2026",
};

export const COMPANY = {
  name: "Digikom Group",
  form: "entreprise unipersonnelle à responsabilité limitée (EURL)",
  formShort: "EURL",
  rcs: "RCS de Vannes",
  siren: "932 297 526",
  vat: "FR22932297526",
  manager: "Axel Douillard",
  /** Lieu du siège : ville seulement sur le site (adresse complète communiquée sur demande). */
  city: "Nivillac (Morbihan)",
};

export const HOST = {
  name: "Hostinger International Ltd",
  address: "61 Lordou Vironos Street, 6023 Larnaca, Chypre",
  note: "serveur situé en France (Paris)",
};
