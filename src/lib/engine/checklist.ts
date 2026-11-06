import type { KnownIssue, OfficialHistory, Recall, Vehicle } from "./types";
import { vehicleAgeYears } from "./known-issues";

/*
 * À vérifier avant l'achat : une liste courte, construite pour CE véhicule, en trois parties :
 *  - Papiers : ce qui doit être en règle avant de payer ;
 *  - Vendeur : ce qu'il faut lui demander ;
 *  - Acheteur : ce qu'on contrôle soi-même sur place et à l'essai.
 * Chaque point porte la raison de sa présence (énergie, boîte, âge, kilométrage, modèle).
 */

export type ChecklistPriority = "essentiel" | "conseille";

export interface ChecklistItem {
  id: string;
  text: string;
  /** comment faire, en quelques mots (facultatif) */
  how?: string;
  priority: ChecklistPriority;
  /** pourquoi ce point est là : « Diesel », « Boîte double embrayage », « + de 150 000 km »… */
  because?: string;
}

export type ChecklistParty = "vendeur" | "acheteur";

export const PARTY_LABEL: Record<ChecklistParty, { title: string; sub: string }> = {
  vendeur: { title: "Côté vendeur", sub: "Ce que le vendeur doit fournir, en règle, avant de payer." },
  acheteur: { title: "Côté acheteur", sub: "Ce que vous lui demandez, puis ce que vous contrôlez vous-même." },
};

export interface ChecklistSection {
  id: "papiers" | "vendeur" | "acheteur";
  /** qui est concerné : le vendeur (papiers, questions) ou l'acheteur (contrôles) */
  party: ChecklistParty;
  title: string;
  /** qui s'en charge, en une ligne */
  sub: string;
  items: ChecklistItem[];
}

export interface Checklist {
  /** étiquettes qui résument le profil pris en compte */
  profile: string[];
  sections: ChecklistSection[];
  total: number;
  essential: number;
}

export interface ChecklistInput {
  vehicle: Vehicle;
  mileage?: number;
  history?: OfficialHistory;
  knownIssues?: KnownIssue[];
  recalls?: Recall[];
  now?: Date;
}

export type AutoGearboxKind = "double_embrayage" | "convertisseur" | "cvt" | "e_cvt" | "robotisee" | "inconnue";

/** Devine la technologie de la boîte automatique d'après la version (DSG, EAT8, CVT…). */
export function detectAutoGearbox(vehicle: Vehicle): AutoGearboxKind {
  const s = `${vehicle.version ?? ""} ${vehicle.model} ${vehicle.make}`.toLowerCase();
  if (/\b(dsg|s[- ]?tronic|dct|edc|powershift|tct|pdk|7g-dct|8g-dct|dkg|speedshift dct|twinclutch|6dct|7dct)\d*\b/.test(s)) return "double_embrayage";
  if (/\b(e-cvt|ecvt|hybrid synergy|hsd)\b/.test(s) || (vehicle.fuel === "hybride" && /toyota|lexus/.test(s))) return "e_cvt";
  if (/\b(cvt|xtronic|lineartronic|multitronic|ivt|multidrive)\b/.test(s)) return "cvt";
  if (/\b(eat6|eat8|eat 6|eat 8|zf|tiptronic|steptronic|9g-tronic|7g-tronic|aisin|bva|bva6|bva8|at6|at8|torque)\d*\b/.test(s)) return "convertisseur";
  if (/\b(robotis|etg|mta|easy-r|easytronic|selespeed|dualogic|smg|sensodrive|bmp6|2-tronic)\b/.test(s)) return "robotisee";
  return "inconnue";
}

const isTurboPetrol = (v: Vehicle) => /\b(tce|tsi|tfsi|puretech|ecoboost|turbo|t-gdi|thp|tgi|1\.0|1\.2|1\.3|1\.4|1\.5)\b/i.test(`${v.version ?? ""}`) && (v.fuel === "essence" || v.fuel === "hybride");
const isAwd = (v: Vehicle) => /\b(4x4|4wd|awd|quattro|4motion|xdrive|4matic|allgrip|all4|4control|x-drive|sh-awd|e-four|dual motor|4drive)\b/i.test(`${v.version ?? ""} ${v.model}`);

export function buildChecklist(input: ChecklistInput): Checklist {
  const v = input.vehicle;
  const now = input.now ?? new Date();
  const age = vehicleAgeYears(v, now);
  const km = input.mileage ?? 0;
  const hist = input.history;
  const fuel = v.fuel;
  const electric = fuel === "electrique";
  const auto = v.gearbox === "automatique" && !electric;
  const manual = v.gearbox === "manuelle" && !electric;
  const hybrid = fuel === "hybride" || fuel === "hybride_rechargeable";
  const thermal = !electric;
  const autoKind = auto ? detectAutoGearbox(v) : "inconnue";
  const euro6 = v.firstRegistration ? v.firstRegistration >= "2015-09-01" : age < 11;

  const profile: string[] = [];
  profile.push(fuel === "electrique" ? "100 % électrique" : fuel === "hybride_rechargeable" ? "Hybride rechargeable" : fuel === "hybride" ? "Hybride" : fuel === "diesel" ? "Diesel" : fuel === "essence" ? "Essence" : fuel === "gpl" ? "GPL" : "Motorisation non précisée");
  if (!electric) profile.push(auto ? `Boîte automatique${autoKind === "double_embrayage" ? " (double embrayage)" : autoKind === "convertisseur" ? " (convertisseur)" : autoKind === "cvt" ? " (CVT)" : autoKind === "e_cvt" ? " (e-CVT)" : autoKind === "robotisee" ? " (robotisée)" : ""}` : manual ? "Boîte manuelle" : "Boîte non précisée");
  if (v.firstRegistration) profile.push(age < 1 ? "Moins d'un an" : `${Math.floor(age)} an${age >= 2 ? "s" : ""}`);
  if (km) profile.push(`${km.toLocaleString("fr-FR")} km`);
  if (v.category === "utilitaire") profile.push("Utilitaire");
  if (v.category === "moto") profile.push("Deux-roues");
  if (v.imported) profile.push("Importé");
  if (isAwd(v)) profile.push("4 roues motrices");

  const papers: ChecklistSection = { id: "papiers", party: "vendeur", title: "Papiers à fournir", sub: "À avoir en règle avant de payer.", items: [] };
  const seller: ChecklistSection = { id: "vendeur", party: "acheteur", title: "À demander au vendeur", sub: "Les questions et documents qui révèlent l'entretien réel.", items: [] };
  const buyer: ChecklistSection = { id: "acheteur", party: "acheteur", title: "À vérifier vous-même", sub: "Sur place, puis à l'essai (20 minutes, moteur froid au départ).", items: [] };
  const add = (sec: ChecklistSection, id: string, text: string, priority: ChecklistPriority, how?: string, because?: string) => sec.items.push({ id, text, how, priority, because });

  /* ---------- Papiers ---------- */
  add(papers, "cg-nom", "Carte grise au nom du vendeur, identique à sa pièce d'identité.", "essentiel");
  add(papers, "cg-vin", "Numéro de série (E) identique sur la carte grise et sur le véhicule.", "essentiel", "Plaque constructeur en bas du pare-brise ou dans la porte.");
  if (age >= 4 || hist?.inspections.length) add(papers, "ct", "Contrôle technique de moins de 6 mois, procès-verbal lu en entier.", "essentiel", undefined, "Plus de 4 ans");
  else add(papers, "ct-jeune", "Moins de 4 ans : pas de contrôle technique, demander le dernier compte rendu d'atelier.", "conseille", undefined, "Véhicule récent");
  add(papers, "csa", "Certificat de situation administrative (non-gage) de moins de 15 jours.", "essentiel", "Gratuit sur le site de l'ANTS.");
  if (hist && !hist.available) add(papers, "hist-abs", "Historique officiel non consulté : procès-verbaux des derniers contrôles techniques et factures.", "essentiel", undefined, "Historique officiel non disponible");
  if (hist?.pledge) add(papers, "gage", "Gage inscrit : exiger la main-levée du créancier avant de payer.", "essentiel", undefined, "Gage signalé");
  if (hist?.opposition) add(papers, "oppo", "Opposition en cours : ne pas acheter tant qu'elle n'est pas levée.", "essentiel", undefined, "Opposition signalée");
  if (hist?.damagedProcedure) add(papers, "ve", "Procédure « véhicule endommagé » : rapport d'expertise et preuve de levée.", "essentiel", undefined, "Procédure VE");
  if (v.imported) add(papers, "import", "Importé : certificat de conformité européen et quitus fiscal.", "essentiel", undefined, "Véhicule importé");
  if (fuel === "gpl") add(papers, "gpl-cg", "Mention GPL présente sur la carte grise (champ P.3).", "essentiel", undefined, "GPL");
  if (v.category === "utilitaire") add(papers, "tva", "Prix TTC ou HT : vérifier si la TVA est récupérable.", "conseille", undefined, "Utilitaire");

  /* ---------- Vendeur ---------- */
  add(seller, "factures", "Les factures d'entretien, de la première à la dernière.", "essentiel", "Un trou de 2 ans ou 30 000 km est un signal.");
  add(seller, "cles", "Les deux clés, qui fonctionnent.", "conseille", "Une clé à refaire : 150 à 400 €.");
  if (thermal && (km >= 90000 || age >= 6)) add(seller, "distribution", "La facture de la distribution (courroie ou chaîne).", "essentiel", "Sans facture, prévoir le remplacement.", km >= 90000 ? "Plus de 90 000 km" : "Plus de 6 ans");
  if (fuel === "diesel") add(seller, "fap", "Son usage : route ou surtout ville ?", "essentiel", "Un diesel urbain encrasse le filtre à particules.", "Diesel");
  if (fuel === "diesel" && euro6) add(seller, "adblue", "La fréquence des remplissages d'AdBlue et l'absence de message d'alerte.", "conseille", undefined, "Diesel Euro 6");
  if (isTurboPetrol(v)) add(seller, "huile-conso", "S'il rajoute de l'huile entre deux vidanges.", "essentiel", undefined, "Essence turbo");
  if (auto) add(seller, "auto-huile", "La facture de vidange de la boîte automatique (souvent tous les 60 000 km).", "essentiel", "Même si le constructeur dit « à vie ».", "Boîte automatique");
  if (manual && km >= 120000) add(seller, "embrayage-vendeur", "Si l'embrayage a déjà été remplacé.", "conseille", undefined, "Plus de 120 000 km");
  if (electric || hybrid) add(seller, "batt-certif", "Un certificat de santé de la batterie (concession ou diagnostic indépendant).", "essentiel", "À défaut, l'autonomie affichée à 100 % de charge.", electric ? "Électrique" : "Hybride");
  if (electric || fuel === "hybride_rechargeable") add(seller, "cables", "Les câbles de recharge fournis (type 2, prise domestique).", "conseille", undefined, "Recharge");
  if (electric) add(seller, "ev-garantie", "La date de fin de garantie batterie (souvent 8 ans ou 160 000 km).", "essentiel", undefined, "Électrique");
  if (fuel === "gpl") add(seller, "gpl-reservoir", "L'attestation de l'installateur et la date du contrôle du réservoir.", "essentiel", undefined, "GPL");
  if (age < 3) add(seller, "garantie", "La date de fin de garantie constructeur.", "conseille", undefined, "Véhicule récent");
  if ((hist?.ownersCount ?? 0) >= 4) add(seller, "proprios", `Pourquoi ${hist?.ownersCount} propriétaires en si peu de temps.`, "conseille", undefined, "Nombreux propriétaires");
  if (km >= 150000) add(seller, "km-eleve", "Ce qui a été remplacé : turbo, injecteurs, embrayage, amortisseurs, batterie.", "essentiel", undefined, "Plus de 150 000 km");
  for (const r of (input.recalls ?? []).filter((x) => x.status !== "done").slice(0, 3)) add(seller, `recall-${r.reference ?? r.date}`, `Si le rappel « ${r.title} » a été fait (facture ou attestation).`, "essentiel", undefined, "Rappel constructeur");

  /* ---------- Acheteur ---------- */
  add(buyer, "carrosserie", "Carrosserie : écarts réguliers, même teinte partout, pas de vis marquées.", "essentiel", "Regarder en lumière rasante.");
  add(buyer, "pneus", "Pneus : 3 mm minimum, usure régulière, moins de 6 ans.", "essentiel", "Date : les 4 chiffres après « DOT ».");
  if (age >= 8 || km >= 150000) add(buyer, "dessous", "Dessous de caisse : pas de rouille perforante ni de mastic récent.", "essentiel", undefined, age >= 8 ? `${Math.floor(age)} ans` : "Kilométrage élevé");
  add(buyer, "fuites", "Aucune trace de fuite sous le véhicule.", "essentiel");
  if (thermal) add(buyer, "froid", "Démarrage à froid : pas de claquement, de sifflement ni de fumée.", "essentiel", "Toucher le capot en arrivant : il doit être froid.", "Thermique");
  if (thermal) add(buyer, "huile", "Bouchon d'huile propre, sans dépôt beige.", "essentiel", "Dépôt beige = eau dans l'huile.", "Thermique");
  if (fuel === "diesel") add(buyer, "fumee", "Pas de fumée noire ou bleue en accélérant moteur chaud.", "essentiel", undefined, "Diesel");
  if (fuel === "essence" || hybrid) add(buyer, "fumee-e", "Pas de fumée bleue en accélérant après un ralenti prolongé.", "essentiel", undefined, "Essence");
  if (fuel === "gpl") add(buyer, "gpl-bascule", "Passage essence → GPL sans à-coup, aucune odeur de gaz.", "essentiel", undefined, "GPL");
  if (hybrid) add(buyer, "hyb-transition", "Passage électrique ↔ thermique sans à-coup.", "essentiel", undefined, "Hybride");
  if (fuel === "hybride_rechargeable") add(buyer, "phev-charge", "Brancher le véhicule : la charge démarre.", "essentiel", undefined, "Hybride rechargeable");
  if (electric) {
    add(buyer, "ev-charge", "Lancer une charge : elle démarre, sans message d'erreur.", "essentiel", "Si possible, tester une charge rapide.", "Électrique");
    add(buyer, "ev-autonomie", "Noter l'autonomie et le % au départ et à l'arrivée de l'essai : cohérents avec la distance.", "essentiel", undefined, "Électrique");
    add(buyer, "ev-freins", "Freinage fort une fois : pas de vibration ni de bruit (disques peu sollicités).", "conseille", undefined, "Électrique");
  }
  if (manual) add(buyer, "embrayage", "Embrayage : en 3e à 50 km/h, accélérer à fond ; le régime ne doit pas monter sans la vitesse.", "essentiel", "Sinon il patine : 600 à 1 500 €.", "Boîte manuelle");
  if (manual) add(buyer, "synchros", "Toutes les vitesses passent sans craquement, y compris la 2e à froid.", "essentiel", undefined, "Boîte manuelle");
  if (manual && fuel === "diesel") add(buyer, "bimasse", "Pas de claquement métallique au ralenti ni à la coupure (volant bi-masse).", "essentiel", undefined, "Diesel à boîte manuelle");
  if (auto) add(buyer, "auto-passages", "Passages de rapports doux, sans à-coup ni hésitation, surtout entre 0 et 30 km/h.", "essentiel", undefined, "Boîte automatique");
  if (autoKind === "double_embrayage") add(buyer, "dsg", "Manœuvres lentes en avant et en arrière : aucun broutement.", "essentiel", "Double embrayage : 1 500 à 4 000 € si usé.", "Double embrayage");
  if (autoKind === "cvt") add(buyer, "cvt", "Vitesse stabilisée : pas de bruit de courroie ni de vibration.", "essentiel", undefined, "CVT");
  if (autoKind === "robotisee") add(buyer, "robot", "Passages lents mais sans secousse, pas de message d'embrayage.", "essentiel", undefined, "Boîte robotisée");
  if (isAwd(v)) add(buyer, "awd", "Virage serré à faible vitesse : pas de vibration ni de bruit de roulement.", "essentiel", undefined, "4 roues motrices");
  add(buyer, "interieur", "Usure du volant, des pédales et du siège cohérente avec le kilométrage.", "essentiel");
  add(buyer, "voyants", "Au contact, tous les voyants s'allument puis s'éteignent.", "essentiel", "Un voyant qui ne s'allume jamais a pu être débranché.");
  add(buyer, "equipements", "Vitres, clim (vraiment froide), écran, caméra, aides à la conduite : tout fonctionne.", "conseille");
  add(buyer, "essai", "À l'essai : freinage droit sans vibration, direction sans jeu, pas de claquement sur dos-d'âne.", "essentiel", km >= 120000 ? "Au-delà de 120 000 km, amortisseurs souvent en fin de vie." : undefined);
  if (v.category === "utilitaire") add(buyer, "utilitaire", "Compartiment de charge : plancher droit, portes qui ferment, assiette arrière correcte.", "essentiel", undefined, "Utilitaire");
  if (v.category === "moto") add(buyer, "moto", "Traces de chute (leviers, carters, embouts), fourche sans fuite, kit chaîne sans point dur.", "essentiel", undefined, "Deux-roues");
  for (const i of (input.knownIssues ?? []).filter((x) => x.applies && x.inZone).slice(0, 3)) add(buyer, `issue-${i.id}`, `${i.title} : ${i.whatToCheck}`, i.severity === "high" ? "essentiel" : "conseille", undefined, "Point connu du modèle");

  const sections = [papers, seller, buyer];
  const all = sections.flatMap((s) => s.items);
  return { profile, sections, total: all.length, essential: all.filter((i) => i.priority === "essentiel").length };
}
