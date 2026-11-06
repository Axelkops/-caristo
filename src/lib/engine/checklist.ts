import type { KnownIssue, OfficialHistory, Recall, Vehicle } from "./types";
import { vehicleAgeYears } from "./known-issues";

/*
 * Points à vérifier avant l'achat : une liste construite pour CE véhicule.
 * Chaque point porte la raison de sa présence (énergie, boîte, âge, kilométrage, modèle),
 * afin que deux véhicules différents n'aient jamais la même liste.
 */

export type ChecklistPriority = "essentiel" | "conseille";

export interface ChecklistItem {
  id: string;
  text: string;
  /** comment faire, en une phrase */
  how?: string;
  priority: ChecklistPriority;
  /** pourquoi ce point est là : « Diesel », « Boîte double embrayage », « + de 150 000 km »… */
  because?: string;
}

export interface ChecklistSection {
  id: string;
  title: string;
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

  const S = (id: string, title: string): ChecklistSection => ({ id, title, items: [] });
  const papers = S("papiers", "Papiers et vendeur");
  const outside = S("exterieur", "Carrosserie, pneus et dessous");
  const engine = S("moteur", electric ? "Moteur électrique et batterie" : hybrid ? "Moteur, batterie et système hybride" : "Moteur");
  const gear = S("boite", electric ? "Transmission" : "Boîte de vitesses et transmission");
  const inside = S("interieur", "Intérieur et équipements");
  const drive = S("essai", "Essai sur route");
  const model = S("modele", "Points propres à ce modèle");

  const add = (sec: ChecklistSection, id: string, text: string, priority: ChecklistPriority, how?: string, because?: string) => sec.items.push({ id, text, how, priority, because });

  /* ---------- Papiers ---------- */
  add(papers, "cg-nom", "La carte grise est au nom du vendeur et l'adresse correspond à sa pièce d'identité.", "essentiel", "Comparer la pièce d'identité, la carte grise (C.1, C.4a) et le nom sur le contrat. Un vendeur qui n'est pas le titulaire doit avoir un mandat.");
  add(papers, "cg-vin", "Le numéro de série (E sur la carte grise) est identique à celui du véhicule.", "essentiel", "Lire la plaque constructeur (bas du pare-brise côté passager, montant de porte ou sous le capot) et comparer les 17 caractères.");
  if (age >= 4 || hist?.inspections.length) add(papers, "ct", "Le contrôle technique a moins de 6 mois et le procès-verbal est fourni.", "essentiel", "Lire tout le procès-verbal : les défaillances mineures ne bloquent pas la vente mais annoncent des frais.", age >= 4 ? "Véhicule de plus de 4 ans" : undefined);
  else add(papers, "ct-jeune", "Moins de 4 ans : pas de contrôle technique obligatoire, demander à la place le dernier compte rendu d'atelier.", "conseille", undefined, "Véhicule récent");
  add(papers, "csa", "Le certificat de situation administrative (non-gage) date de moins de 15 jours.", "essentiel", "Gratuit sur le site de l'ANTS. Il doit indiquer « aucune opposition, aucun gage ».");
  if (hist && !hist.available) add(papers, "hist-abs", "L'historique officiel n'a pas pu être consulté : demander au vendeur son rapport HistoVec (gratuit) imprimé ou à l'écran.", "essentiel", "Le vendeur se connecte sur histovec.interieur.gouv.fr avec sa carte grise et vous montre le rapport.", "Historique officiel non disponible");
  if (hist?.pledge) add(papers, "gage", "Un gage figure dans l'historique officiel : exiger la main-levée du créancier avant de payer.", "essentiel", undefined, "Gage signalé");
  if (hist?.opposition) add(papers, "oppo", "Une opposition bloque le transfert de la carte grise : ne pas acheter tant qu'elle n'est pas levée.", "essentiel", undefined, "Opposition signalée");
  if (hist?.damagedProcedure) add(papers, "ve", "Une procédure « véhicule endommagé » existe : demander le rapport d'expertise et la preuve de la levée.", "essentiel", undefined, "Procédure VE");
  if ((hist?.ownersCount ?? 0) >= 4) add(papers, "proprios", `${hist?.ownersCount} propriétaires : demander pourquoi le véhicule change souvent de mains.`, "conseille", undefined, "Nombreux propriétaires");
  add(papers, "factures", "Les factures d'entretien couvrent toute la vie du véhicule, pas seulement les derniers mois.", "essentiel", "Classer les factures par date : un trou de plus de 2 ans ou 30 000 km est un signal.");
  if (thermal) add(papers, "carnet", "Le carnet d'entretien (papier ou numérique) est tamponné aux bonnes échéances.", "conseille", "Chez beaucoup de constructeurs, le carnet est consultable sur l'application ou en concession avec le numéro de série.");
  add(papers, "cles", "Le vendeur remet au moins deux clés qui fonctionnent toutes les deux.", "conseille", "Une clé à refaire coûte souvent 150 à 400 €.", undefined);
  if (v.imported) add(papers, "import", "Véhicule importé : exiger le certificat de conformité européen et le quitus fiscal, et l'historique du pays d'origine.", "essentiel", undefined, "Véhicule importé");
  if (age < 3) add(papers, "garantie", "La garantie constructeur est encore active et transférable : demander la date de fin exacte.", "conseille", "Vérifier aussi qu'aucun entretien hors réseau n'a fait sauter la garantie.", "Véhicule récent");
  if (v.category === "utilitaire") add(papers, "tva", "Utilitaire : vérifier si le prix est TTC avec TVA récupérable (facture pro) ou vendu par un particulier.", "conseille", undefined, "Utilitaire");
  if (fuel === "gpl") add(papers, "gpl-cg", "La mention GPL figure bien sur la carte grise (champ P.3) : une installation non homologuée est interdite.", "essentiel", undefined, "GPL");

  /* ---------- Extérieur ---------- */
  add(outside, "jeux", "Les écarts entre les éléments de carrosserie sont réguliers, les teintes identiques d'un panneau à l'autre.", "essentiel", "Regarder en lumière rasante. Un capot ou une aile plus neufs que le reste = choc réparé.");
  add(outside, "vis", "Les vis de capot, d'ailes et de portes n'ont pas de traces d'outil.", "conseille", "Des vis marquées signifient qu'un élément a été déposé.");
  add(outside, "pare-brise", "Le pare-brise n'a ni impact ni fissure (refus au contrôle technique dans le champ de vision).", "conseille");
  add(outside, "pneus", "Les 4 pneus ont au moins 3 mm, s'usent de façon régulière et ont moins de 6 ans.", "essentiel", "Date : les 4 chiffres après « DOT » sur le flanc (semaine + année). Une usure d'un seul côté = parallélisme ou train abîmé.");
  if (electric || hybrid) add(outside, "pneus-ev", "Usure des pneus avant plus rapide sur ce type de véhicule (couple immédiat) : vérifier qu'ils sont de la même marque et du même indice de charge.", "conseille", undefined, electric ? "Électrique" : "Hybride");
  add(outside, "freins", "Les disques ne sont ni rayés ni voilés, sans lèvre sur le bord.", "conseille", "Passer le doigt sur le bord du disque : une marche nette = disque usé.");
  if (electric) add(outside, "freins-ev", "Disques rouillés ou grippés : sur une électrique les freins servent peu et peuvent se gripper.", "conseille", "Rouler quelques mètres puis freiner fort une fois : pas de vibration ni de bruit de frottement.", "Électrique");
  if (age >= 8 || km >= 150000) add(outside, "dessous", "Dessous de caisse, bas de caisse et passages de roue : pas de corrosion perforante ni de mastic récent.", "essentiel", "Se baisser avec une lampe. Un dessous entièrement repeint en noir cache souvent quelque chose.", age >= 8 ? `${Math.floor(age)} ans` : "Kilométrage élevé");
  if (age >= 10) add(outside, "flexibles", "Flexibles de frein, durites et soufflets de cardan : pas de craquelures ni de suintement.", "conseille", undefined, "Plus de 10 ans");
  add(outside, "fuites", "Aucune trace d'huile ou de liquide sous le véhicule après 10 minutes à l'arrêt.", "essentiel", "Demander à voir la place où le véhicule dort habituellement.");
  if (electric || fuel === "hybride_rechargeable") add(outside, "trappe", "La trappe de charge se verrouille et la prise ne présente ni broche noircie ni jeu.", "conseille", undefined, "Recharge");
  if (v.category === "utilitaire") add(outside, "utilitaire", "Plancher et parois du compartiment de charge : pas de déformation, portes arrière qui ferment bien, cloison fixée.", "essentiel", "Les utilitaires sont souvent surchargés : contrôler les lames de ressort et l'assiette arrière.", "Utilitaire");
  if (v.category === "moto") add(outside, "moto", "Traces de chute : leviers, embouts de guidon, carter, repose-pieds râpés ; fourche sans fuite ; kit chaîne sans point dur.", "essentiel", undefined, "Deux-roues");

  /* ---------- Moteur ---------- */
  if (thermal) {
    add(engine, "froid", "Démarrage moteur froid, capot ouvert : pas de claquement, de sifflement ni de fumée au démarrage.", "essentiel", "Demander au vendeur de ne pas faire chauffer le véhicule avant votre arrivée. Toucher le capot en arrivant.");
    add(engine, "huile", "Niveau et aspect de l'huile corrects : pas de dépôt beige sous le bouchon (mélange eau-huile).", "essentiel", "Un bouchon de remplissage avec une mousse beige = joint de culasse à suspecter.");
    add(engine, "liquides", "Liquide de refroidissement propre et au niveau ; pas de trace de fuite sur le radiateur ni les durites.", "conseille");
  }
  if (fuel === "diesel") {
    add(engine, "fumee", "À l'accélération franche moteur chaud : pas de fumée noire (injection) ni blanche/bleue persistante.", "essentiel", "Se faire suivre par quelqu'un ou regarder dans le rétroviseur sur une accélération.", "Diesel");
    add(engine, "fap", "Filtre à particules : le véhicule fait régulièrement de la route, pas uniquement de la ville.", "essentiel", "Demander l'usage habituel. Un diesel urbain accumule les régénérations ratées : voyant, perte de puissance, consommation en hausse.", "Diesel");
    add(engine, "egr", "Pas d'à-coups ni de trou à l'accélération à bas régime (vanne EGR encrassée).", "conseille", undefined, "Diesel");
    add(engine, "turbo-d", "Pas de sifflement aigu ni de fumée bleue à l'accélération (turbo).", "essentiel", "Vérifier l'absence d'huile dans la durite d'admission si elle est accessible.", "Diesel");
    if (euro6) add(engine, "adblue", "AdBlue : pas de message d'avertissement ni de compte à rebours ; demander la fréquence des remplissages.", "conseille", "Une panne du système AdBlue peut immobiliser le véhicule et coûte souvent 500 à 1 500 €.", "Diesel Euro 6");
    add(engine, "injecteurs", "Ralenti stable et régulier, sans claquement sec d'injecteur.", "conseille", undefined, "Diesel");
  }
  if (fuel === "essence" || fuel === "hybride" || fuel === "hybride_rechargeable") {
    add(engine, "fumee-e", "Pas de fumée bleue à l'accélération après un ralenti prolongé (consommation d'huile).", "essentiel", "Laisser tourner au ralenti 2 minutes puis accélérer : regarder l'échappement.", "Essence");
    if (isTurboPetrol(v)) add(engine, "turbo-e", "Petit moteur essence turbo : vérifier la consommation d'huile et l'historique des vidanges (intervalle respecté, huile de la bonne norme).", "essentiel", "Demander si le propriétaire rajoute de l'huile entre deux vidanges. Une courroie « baignée dans l'huile » impose un remplacement anticipé sur certains moteurs.", "Essence turbo");
    add(engine, "allumage", "Pas de ratés ni de tremblement au ralenti (bougies, bobines).", "conseille", undefined, "Essence");
  }
  if (fuel === "gpl") {
    add(engine, "gpl-bascule", "Le passage essence → GPL se fait sans à-coup et le véhicule tient le ralenti dans les deux modes.", "essentiel", undefined, "GPL");
    add(engine, "gpl-reservoir", "Le réservoir GPL a été contrôlé (épreuve) dans les délais et aucune odeur de gaz n'est perceptible.", "essentiel", "Demander la date de pose et l'attestation de l'installateur.", "GPL");
  }
  if (hybrid) {
    add(engine, "hyb-batt", "La batterie hybride est saine : pas de message d'alerte, garantie constructeur (souvent 8 ans ou 160 000 km) indiquée.", "essentiel", "Demander un relevé de santé de la batterie en concession ou via l'application constructeur.", "Hybride");
    add(engine, "hyb-transition", "La transition entre électrique et thermique se fait sans à-coup ni bruit, à l'arrêt comme en roulant.", "essentiel", undefined, "Hybride");
    add(engine, "hyb-regen", "Le freinage régénératif fonctionne : la jauge montre une recharge en décélération.", "conseille", undefined, "Hybride");
  }
  if (fuel === "hybride_rechargeable") {
    add(engine, "phev-charge", "Brancher le véhicule pendant la visite : la charge démarre et l'autonomie électrique affichée à 100 % est proche de celle annoncée.", "essentiel", "Une hybride rechargeable jamais rechargée fait travailler le thermique en surcharge : regarder la consommation moyenne sur l'ordinateur de bord.", "Hybride rechargeable");
    add(engine, "phev-cable", "Le câble de recharge (prise domestique et/ou type 2) est fourni et en bon état.", "conseille", undefined, "Hybride rechargeable");
  }
  if (electric) {
    add(engine, "ev-soh", "État de santé de la batterie (SOH) connu : demander un certificat de santé de la batterie, que la concession ou un diagnostic indépendant peut établir.", "essentiel", "À défaut, batterie chargée à 100 % : comparer l'autonomie affichée à l'autonomie neuve du modèle. Une perte au-delà de 15 à 20 % se négocie.", "Électrique");
    add(engine, "ev-garantie", "Garantie batterie encore active (généralement 8 ans ou 160 000 km, seuil 70 %) : noter la date de fin.", "essentiel", undefined, "Électrique");
    add(engine, "ev-charge", "Lancer une charge pendant la visite (borne ou prise) : la charge démarre, sans message d'erreur, à la puissance attendue.", "essentiel", "Si possible, tester aussi une charge rapide : une puissance très basse peut révéler une batterie fatiguée ou bridée.", "Électrique");
    add(engine, "ev-cables", "Câbles fournis : câble type 2 et, souvent, câble pour prise domestique. Un câble manquant coûte 150 à 300 €.", "conseille", undefined, "Électrique");
    add(engine, "ev-12v", "Batterie 12 V : pas de message de défaut au démarrage, véhicule qui « s'allume » immédiatement.", "conseille", "La petite batterie 12 V tombe souvent en panne avant la grosse.", "Électrique");
    add(engine, "ev-bruit", "Aucun sifflement ou grondement inhabituel du moteur ou du réducteur à l'accélération et en décélération.", "conseille", undefined, "Électrique");
    add(engine, "ev-usage", "Demander l'usage de la recharge : majoritairement lente (bon) ou presque toujours rapide (plus d'usure).", "conseille", undefined, "Électrique");
  }
  if (thermal && (km >= 90000 || age >= 6)) add(engine, "distribution", "Distribution (courroie ou chaîne) : facture de remplacement ou preuve qu'elle n'est pas encore due.", "essentiel", "Sans facture, prévoir le remplacement : une rupture détruit le moteur.", km >= 90000 ? "Plus de 90 000 km" : "Plus de 6 ans");
  if (thermal && km >= 150000) add(engine, "km-eleve", "Au-delà de 150 000 km : demander précisément ce qui a été remplacé (turbo, injecteurs, embrayage, amortisseurs, batterie).", "essentiel", undefined, "Plus de 150 000 km");

  /* ---------- Boîte / transmission ---------- */
  if (manual) {
    add(gear, "embrayage", "Embrayage : le point de patinage n'est pas trop haut et le moteur ne s'emballe pas quand on accélère en 3e à bas régime.", "essentiel", "Test : en 3e à 50 km/h, accélérer à fond. Si le régime monte sans que la vitesse suive, l'embrayage patine (600 à 1 500 €).", "Boîte manuelle");
    add(gear, "synchros", "Toutes les vitesses passent sans craquement, y compris la 2e à froid et la marche arrière.", "essentiel", undefined, "Boîte manuelle");
    add(gear, "butee", "Pas de grognement pédale enfoncée ni de vibration à la pédale (butée, volant moteur).", "conseille", undefined, "Boîte manuelle");
    if (fuel === "diesel") add(gear, "bimasse", "Volant moteur bi-masse : pas de claquement métallique au ralenti ni de vibration au démarrage et à la coupure.", "essentiel", "Fréquent sur les diesels manuels au-delà de 120 000 km : 1 000 à 2 000 € avec l'embrayage.", "Diesel à boîte manuelle");
  }
  if (auto) {
    add(gear, "auto-passages", "Les passages de rapports sont doux, sans à-coup ni hésitation, en montée comme en descente de rapports.", "essentiel", "Tester en ville à faible vitesse (0-30 km/h) : c'est là que les boîtes fatiguées se trahissent.", "Boîte automatique");
    add(gear, "auto-huile", "L'huile de boîte a été remplacée aux échéances (souvent tous les 60 000 km) : exiger la facture, même si le constructeur dit « à vie ».", "essentiel", undefined, "Boîte automatique");
    if (autoKind === "double_embrayage") add(gear, "dsg", "Boîte à double embrayage : pas de broutement au démarrage ni de secousse en manœuvre, pas de message « boîte » ; mécatronique sans fuite.", "essentiel", "En marche arrière lente puis en avant à très basse vitesse, l'embrayage doit être progressif. Un remplacement coûte 1 500 à 4 000 €.", "Double embrayage");
    if (autoKind === "convertisseur") add(gear, "convertisseur", "Boîte à convertisseur : aucun à-coup au passage de P à D ou R, pas de glissement (régime qui monte sans accélération).", "conseille", undefined, "Convertisseur de couple");
    if (autoKind === "cvt") add(gear, "cvt", "Boîte CVT : pas de bruit de courroie ni de vibration à vitesse stabilisée, pas d'à-coup en relance.", "essentiel", "Une CVT abîmée se remplace plus souvent qu'elle ne se répare.", "CVT");
    if (autoKind === "e_cvt") add(gear, "ecvt", "Transmission hybride e-CVT : très fiable, mais vérifier l'absence de bruit de roulement à vitesse constante.", "conseille", undefined, "e-CVT");
    if (autoKind === "robotisee") add(gear, "robot", "Boîte robotisée : les passages sont lents par nature, mais sans secousse ; pas de message d'embrayage ; vérifier la date du dernier réglage.", "essentiel", undefined, "Boîte robotisée");
    add(gear, "auto-modes", "Les modes (P, R, N, D, mode manuel/palettes) répondent tous et le levier ou sélecteur se verrouille bien en P.", "conseille", undefined, "Boîte automatique");
  }
  if (v.gearbox === "inconnue" && !electric) add(gear, "boite-inconnue", "Type de boîte à confirmer sur place : manuelle (tester l'embrayage) ou automatique (tester la douceur des passages et l'huile).", "conseille");
  if (electric) {
    add(gear, "ev-reducteur", "Pas de boîte de vitesses : vérifier seulement l'absence de jeu à l'accélération/décélération et que le mode « B » (régénération forte) fonctionne.", "conseille", undefined, "Électrique");
  }
  if (isAwd(v)) add(gear, "awd", "Transmission intégrale : pas de bruit de roulement, pas de vibration en virage serré à faible vitesse, pneus 4 identiques.", "essentiel", "Des pneus d'usure différente peuvent endommager la transmission intégrale.", "4 roues motrices");
  add(gear, "cardans", "Pas de claquement en braquant à fond en avançant lentement (cardans) ni de vibration à l'accélération.", "conseille");

  /* ---------- Intérieur ---------- */
  add(inside, "usure", "L'usure du volant, du pommeau, des pédales et du siège conducteur correspond au kilométrage affiché.", "essentiel", km && km < 80000 ? "Sous 80 000 km, un volant lustré ou un siège affaissé ne colle pas." : "Un intérieur refait à neuf sur un fort kilométrage mérite une question.");
  add(inside, "voyants", "Au contact, tous les voyants s'allument puis s'éteignent au démarrage (moteur, airbag, ABS, ESP).", "essentiel", "Un voyant qui ne s'allume jamais a pu être débranché.");
  add(inside, "electrique", "Tous les équipements fonctionnent : vitres, rétroviseurs, climatisation qui souffle vraiment froid, écran, caméra, aides à la conduite.", "conseille");
  add(inside, "humidite", "Pas d'odeur d'humidité, tapis et coffre (sous le plancher) secs.", "conseille", "Une infiltration abîme les calculateurs placés sous les sièges ou dans le coffre.");
  add(inside, "compteur", "Le kilométrage affiché est cohérent avec les factures, le contrôle technique et l'ordinateur de bord.", "essentiel", hist?.mileageReadings.length ? "Comparer avec les relevés officiels du rapport." : "Comparer avec les factures et le procès-verbal du contrôle technique.");
  if (electric || hybrid) add(inside, "ev-conso", "Consulter la consommation moyenne (kWh/100 km ou l/100 km) sur l'ordinateur de bord : une valeur anormale révèle un usage intensif.", "conseille", undefined, electric ? "Électrique" : "Hybride");
  if (age >= 8) add(inside, "sellerie", "Sellerie, ciel de toit et joints de portes : pas de décollement ni de moisissure.", "conseille", undefined, `${Math.floor(age)} ans`);

  /* ---------- Essai ---------- */
  add(drive, "duree", "Essai d'au moins 20 minutes, moteur froid au départ, avec ville, route et une voie rapide.", "essentiel");
  add(drive, "freinage", "Freinage fort : le véhicule reste droit, sans vibration dans le volant ni la pédale.", "essentiel");
  add(drive, "direction", "Direction : pas de jeu, pas de bruit en braquant, le véhicule ne tire pas d'un côté en ligne droite.", "essentiel");
  add(drive, "suspension", "Pas de claquement sur dos-d'âne ni de rebond excessif (amortisseurs, silentblocs).", "conseille", km >= 120000 ? "Au-delà de 120 000 km, les amortisseurs d'origine sont souvent en fin de vie." : undefined);
  add(drive, "bruits", "Aucun bruit de roulement qui change en virage (roulements), ni de sifflement qui augmente avec la vitesse.", "conseille");
  if (thermal) add(drive, "temperature", "La température moteur monte normalement et reste stable, le chauffage fonctionne.", "conseille", undefined, "Thermique");
  if (electric) add(drive, "ev-autonomie", "Noter l'autonomie et le pourcentage de batterie au départ et à l'arrivée : la consommation réelle doit être cohérente avec la distance parcourue.", "essentiel", undefined, "Électrique");
  add(drive, "aides", "Régulateur, aide au stationnement, ABS/ESP : aucun message d'erreur après l'essai.", "conseille");

  /* ---------- Modèle ---------- */
  for (const i of input.knownIssues ?? []) {
    if (!i.applies) continue;
    add(model, `issue-${i.id}`, `${i.title} : ${i.whatToCheck}`, i.inZone && i.severity !== "low" ? "essentiel" : "conseille", i.costMin !== undefined || i.costMax !== undefined ? `Coût en cas de réparation : ${i.costMin ?? 0} à ${i.costMax ?? i.costMin ?? 0} €.` : undefined, "Point connu du modèle");
  }
  const openRecalls = (input.recalls ?? []).filter((r) => r.status !== "done");
  for (const r of openRecalls.slice(0, 5)) add(model, `recall-${r.reference ?? r.date}`, `Rappel constructeur « ${r.title} » : vérifier qu'il a été effectué (facture ou attestation du réseau).`, "essentiel", undefined, "Rappel constructeur");

  const sections = [papers, outside, engine, gear, inside, drive, model].filter((s) => s.items.length > 0);
  const all = sections.flatMap((s) => s.items);
  return { profile, sections, total: all.length, essential: all.filter((i) => i.priority === "essentiel").length };
}
