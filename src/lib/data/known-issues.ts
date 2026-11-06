/**
 * Base Caristo des pannes connues par motorisation.
 * Chaque fiche décrit une faiblesse fréquente, en phrases simples, avec un coût et un geste de contrôle.
 * Sources : campagnes de rappel, bulletins techniques, retours d'ateliers, forums de propriétaires.
 * À enrichir en continu. Les montants sont des fourchettes indicatives en garage indépendant.
 */
import type { Fuel, KnownIssue } from "../engine/types";

export interface IssueFamily {
  id: string;
  label: string;
  /** mots-clés (minuscules) à trouver dans "marque modèle version code moteur" */
  keywords: string[];
  /** marques concernées (minuscules), vide = toutes */
  makes: string[];
  fuel?: Fuel[];
  /** années de 1re immatriculation concernées (génération du modèle), bornes incluses */
  years?: { from?: number; to?: number };
  issues: Omit<KnownIssue, "applies" | "inZone">[];
}

export const ISSUE_FAMILIES: IssueFamily[] = [
  {
    id: "psa-dv5-15-bluehdi",
    label: "PSA 1.5 BlueHDi (DV5)",
    keywords: ["1.5 bluehdi", "1.5 hdi", "dv5", "bluehdi 130", "bluehdi 100", "bluehdi 110", "bluehdi 120"],
    makes: ["peugeot", "citroen", "citroën", "ds", "opel", "vauxhall", "toyota"],
    fuel: ["diesel"],
    issues: [
      { id: "dv5-belt", title: "Courroie de distribution à remplacer", severity: "high", fromKm: 80000, peakKm: 140000, fromYears: 5, description: "Sur ce moteur, la courroie s'use plus vite que prévu. Si elle casse, le moteur est détruit.", costMin: 900, costMax: 1400, whatToCheck: "Demander la facture du remplacement. Sans facture, prévoir de la faire remplacer." },
      { id: "dv5-egr", title: "Vanne antipollution encrassée", severity: "medium", fromKm: 90000, description: "Voyant moteur, à-coups, moteur qui manque de force en ville.", costMin: 350, costMax: 600, whatToCheck: "Démarrer à froid et écouter le ralenti 2 minutes. Pas d'à-coups, pas de voyant." },
      { id: "dv5-adblue", title: "Réservoir AdBlue", severity: "low", fromKm: 50000, description: "Fuite ou panne du réservoir d'additif. Un rappel constructeur existe sur certaines séries.", costMin: 0, costMax: 900, whatToCheck: "Vérifier que le rappel a été fait (facture ou carnet) et qu'aucun message AdBlue ne s'affiche." },
    ],
  },
  {
    id: "psa-dv6-16-hdi",
    label: "PSA 1.6 HDi / BlueHDi (DV6)",
    keywords: ["1.6 hdi", "1.6 bluehdi", "dv6", "1.6 e-hdi", "hdi 92", "hdi 110", "hdi 115", "bluehdi 100 ", "bluehdi 120 "],
    makes: ["peugeot", "citroen", "citroën", "ds", "ford", "mazda", "volvo", "mini", "suzuki", "mitsubishi"],
    fuel: ["diesel"],
    issues: [
      { id: "dv6-turbo", title: "Turbo fragile si l'huile n'est pas changée à temps", severity: "high", fromKm: 100000, description: "Le turbo s'abîme quand les vidanges sont espacées. Il perd de la force puis casse.", costMin: 900, costMax: 1800, whatToCheck: "Vérifier que les vidanges ont été faites tous les 15 000 km maximum. Sifflement à l'accélération = mauvais signe." },
      { id: "dv6-dpf", title: "Filtre à particules bouché", severity: "medium", fromKm: 120000, description: "Fréquent sur les véhicules qui roulent surtout en ville.", costMin: 300, costMax: 1200, whatToCheck: "Demander si le véhicule roule souvent sur route. Voyant ou perte de puissance = filtre à contrôler." },
      { id: "dv6-egr", title: "Vanne antipollution encrassée", severity: "medium", fromKm: 90000, description: "Voyant moteur et à-coups à bas régime.", costMin: 300, costMax: 600, whatToCheck: "Essai moteur froid : pas d'à-coups, pas de voyant." },
    ],
  },
  {
    id: "psa-eb2-12-puretech",
    label: "PSA 1.2 PureTech (EB2)",
    keywords: ["1.2 puretech", "puretech 110", "puretech 130", "puretech 100", "puretech 82", "eb2", "1.2 vti"],
    makes: ["peugeot", "citroen", "citroën", "ds", "opel", "vauxhall", "toyota"],
    fuel: ["essence", "hybride"],
    issues: [
      { id: "eb2-belt", title: "Courroie de distribution à remplacer", severity: "high", fromKm: 60000, peakKm: 110000, fromYears: 4, description: "La courroie de ce moteur s'use dans l'huile et peut casser tôt. Le constructeur a raccourci l'intervalle de remplacement.", costMin: 700, costMax: 1200, whatToCheck: "Demander la facture du remplacement de courroie. Sans facture après 60 000 km ou 5 ans : à prévoir." },
      { id: "eb2-oil", title: "Consommation d'huile", severity: "medium", fromKm: 80000, description: "Ce moteur peut consommer de l'huile entre deux vidanges.", costMin: 0, costMax: 300, whatToCheck: "Vérifier le niveau d'huile avec la jauge. Demander si le propriétaire rajoute de l'huile." },
    ],
  },
  {
    id: "renault-k9k-15-dci",
    label: "Renault 1.5 dCi (K9K)",
    keywords: ["1.5 dci", "k9k", "dci 90", "dci 110", "dci 115", "dci 75", "dci 85", "dci 95", "dci 105", "blue dci 115", "blue dci 95"],
    makes: ["renault", "dacia", "nissan", "mercedes", "mercedes-benz", "suzuki", "infiniti"],
    fuel: ["diesel"],
    issues: [
      { id: "k9k-injectors", title: "Injecteurs fragiles", severity: "medium", fromKm: 120000, description: "Un injecteur qui fuit abîme le moteur. Fréquent sur les versions les plus anciennes.", costMin: 400, costMax: 1200, whatToCheck: "Démarrage à froid franc, pas de fumée blanche, ralenti régulier." },
      { id: "k9k-turbo", title: "Turbo à surveiller", severity: "medium", fromKm: 130000, description: "Le turbo peut faiblir si l'huile a été négligée.", costMin: 800, costMax: 1500, whatToCheck: "Pas de sifflement ni de fumée bleue à l'accélération." },
      { id: "k9k-dpf", title: "Filtre à particules bouché", severity: "medium", fromKm: 120000, description: "Fréquent en usage urbain.", costMin: 300, costMax: 1000, whatToCheck: "Demander le type de trajets. Voyant = à contrôler." },
    ],
  },
  {
    id: "renault-h5f-12-tce",
    label: "Renault 1.2 TCe (H5F)",
    keywords: ["1.2 tce", "h5f", "tce 115", "tce 120", "tce 130", "1.2 dig-t"],
    makes: ["renault", "dacia", "nissan", "mercedes", "mercedes-benz"],
    fuel: ["essence"],
    issues: [
      { id: "h5f-oil", title: "Consommation d'huile élevée", severity: "high", fromKm: 60000, peakKm: 120000, description: "Ce moteur peut consommer beaucoup d'huile. Si le niveau tombe trop bas, le moteur casse.", costMin: 0, costMax: 4000, whatToCheck: "Vérifier le niveau d'huile. Demander la fréquence des appoints. Fumée bleue à l'échappement = mauvais signe." },
      { id: "h5f-chain", title: "Chaîne de distribution bruyante", severity: "medium", fromKm: 100000, description: "Un cliquetis au démarrage annonce une chaîne usée.", costMin: 800, costMax: 1500, whatToCheck: "Écouter le moteur au démarrage à froid : pas de cliquetis." },
    ],
  },
  {
    id: "renault-h5h-13-tce",
    label: "Renault / Mercedes 1.3 TCe (H5H)",
    keywords: ["1.3 tce", "h5h", "tce 140", "tce 150", "tce 160", "1.3 dig-t", "a200", "a 200", "b180", "b 180"],
    makes: ["renault", "dacia", "nissan", "mercedes", "mercedes-benz", "mitsubishi"],
    fuel: ["essence", "hybride"],
    issues: [
      { id: "h5h-coil", title: "Bobines d'allumage", severity: "low", fromKm: 80000, description: "Ratés moteur, voyant. Réparation simple.", costMin: 100, costMax: 300, whatToCheck: "Ralenti régulier, pas de voyant moteur." },
      { id: "h5h-oil", title: "Consommation d'huile à surveiller", severity: "medium", fromKm: 80000, description: "Certains exemplaires consomment de l'huile.", costMin: 0, costMax: 500, whatToCheck: "Vérifier le niveau à la jauge et demander la fréquence des appoints." },
    ],
  },
  {
    id: "vag-ea189-20-tdi",
    label: "Volkswagen 2.0 TDI (EA189, avant 2015)",
    keywords: ["2.0 tdi", "ea189", "tdi 140", "tdi 170", "tdi 110", "tdi 136", "tdi 143"],
    makes: ["volkswagen", "audi", "seat", "skoda", "škoda", "cupra"],
    fuel: ["diesel"],
    issues: [
      { id: "ea189-emissions", title: "Mise à jour antipollution (dieselgate)", severity: "low", description: "Les moteurs d'avant 2015 ont eu une mise à jour obligatoire. Certains ont ensuite eu des soucis de vanne antipollution.", costMin: 0, costMax: 600, whatToCheck: "Demander si la mise à jour a été faite et si des pannes ont suivi." },
      { id: "ea189-flywheel", title: "Volant moteur et embrayage", severity: "medium", fromKm: 150000, description: "Vibrations au ralenti et bruit à l'arrêt du moteur : volant moteur fatigué.", costMin: 900, costMax: 1600, whatToCheck: "Pas de vibration ni de claquement en coupant le moteur." },
      { id: "ea189-dpf", title: "Filtre à particules", severity: "medium", fromKm: 150000, description: "À contrôler si usage urbain.", costMin: 400, costMax: 1500, whatToCheck: "Pas de voyant, pas de perte de puissance." },
    ],
  },
  {
    id: "vag-ea288-tdi",
    label: "Volkswagen 1.6 / 2.0 TDI (EA288)",
    keywords: ["1.6 tdi", "ea288", "tdi 115", "tdi 150", "tdi 190", "tdi 120", "tdi 105", "tdi 116"],
    makes: ["volkswagen", "audi", "seat", "skoda", "škoda", "cupra"],
    fuel: ["diesel"],
    issues: [
      { id: "ea288-adblue", title: "Système AdBlue", severity: "medium", fromKm: 80000, description: "Panne du chauffage ou du capteur AdBlue : message au tableau de bord, puis blocage du démarrage.", costMin: 300, costMax: 1200, whatToCheck: "Aucun message AdBlue. Demander si une intervention a déjà eu lieu." },
      { id: "ea288-egr", title: "Vanne antipollution", severity: "medium", fromKm: 100000, description: "Encrassement, voyant moteur.", costMin: 300, costMax: 800, whatToCheck: "Essai moteur froid sans à-coups." },
    ],
  },
  {
    id: "vag-ea111-14-tsi",
    label: "Volkswagen 1.4 TSI (EA111, avant 2013)",
    keywords: ["1.4 tsi", "ea111", "tsi 122", "tsi 140", "tsi 160", "tsi 170", "1.4 tfsi"],
    makes: ["volkswagen", "audi", "seat", "skoda", "škoda"],
    fuel: ["essence"],
    issues: [
      { id: "ea111-chain", title: "Chaîne de distribution fragile", severity: "high", fromKm: 60000, peakKm: 120000, description: "La chaîne peut se détendre et sauter. Le moteur est alors détruit.", costMin: 900, costMax: 1600, whatToCheck: "Cliquetis au démarrage à froid = mauvais signe. Demander la facture de remplacement de la chaîne." },
      { id: "ea111-oil", title: "Consommation d'huile", severity: "medium", fromKm: 80000, description: "Les versions les plus puissantes consomment de l'huile.", costMin: 0, costMax: 2500, whatToCheck: "Niveau d'huile et fréquence des appoints." },
    ],
  },
  {
    id: "vag-ea211-tsi",
    label: "Volkswagen 1.0 / 1.2 / 1.5 TSI (EA211)",
    keywords: ["1.0 tsi", "1.2 tsi", "1.5 tsi", "ea211", "tsi 95", "tsi 110", "tsi 115", "tsi 130", "tsi 150", "1.5 etsi", "1.0 etsi"],
    makes: ["volkswagen", "audi", "seat", "skoda", "škoda", "cupra"],
    fuel: ["essence", "hybride"],
    issues: [
      { id: "ea211-hesitation", title: "À-coups à froid (1.5 TSI)", severity: "low", description: "Les premiers 1.5 TSI ont des à-coups moteur froid, corrigés par une mise à jour.", costMin: 0, costMax: 150, whatToCheck: "Essai moteur froid : accélération franche sans trou." },
      { id: "ea211-coolant", title: "Pompe à eau et thermostat", severity: "medium", fromKm: 80000, description: "Fuite de liquide de refroidissement fréquente.", costMin: 400, costMax: 800, whatToCheck: "Niveau de liquide de refroidissement, pas de trace blanche sous le moteur." },
    ],
  },
  {
    id: "vag-dsg7-dq200",
    label: "Boîte DSG 7 à sec (DQ200)",
    keywords: ["dsg7", "dsg 7", "dq200", "s tronic 7", "dsg"],
    makes: ["volkswagen", "audi", "seat", "skoda", "škoda", "cupra"],
    issues: [
      { id: "dq200-mecha", title: "Boîte automatique DSG à surveiller", severity: "high", fromKm: 80000, description: "Le bloc électronique de la boîte (mécatronique) peut tomber en panne. Passage de vitesses brutal, voyant, impossibilité de rouler.", costMin: 1500, costMax: 3500, whatToCheck: "Essai en ville : passages de vitesses doux, pas de secousse en manœuvre." },
    ],
  },
  {
    id: "ford-10-ecoboost",
    label: "Ford 1.0 EcoBoost",
    keywords: ["1.0 ecoboost", "ecoboost 100", "ecoboost 125", "ecoboost 140", "ecoboost 155", "1.0 ti-vct"],
    makes: ["ford"],
    fuel: ["essence", "hybride"],
    issues: [
      { id: "eco10-belt", title: "Courroie de distribution à remplacer", severity: "high", fromKm: 100000, fromYears: 8, description: "La courroie baigne dans l'huile et s'use. Le remplacement est cher car il faut ouvrir le moteur.", costMin: 1000, costMax: 1800, whatToCheck: "Demander la facture. Le constructeur préconise 10 ans ou 240 000 km, mais les ateliers conseillent plus tôt." },
      { id: "eco10-coolant", title: "Fuite de liquide de refroidissement (avant 2017)", severity: "high", fromKm: 60000, description: "Un tuyau peut lâcher et faire surchauffer le moteur.", costMin: 100, costMax: 4000, whatToCheck: "Rappel constructeur fait ? Niveau de liquide stable." },
    ],
  },
  {
    id: "ford-15-tdci",
    label: "Ford 1.5 / 1.6 TDCi",
    keywords: ["1.5 tdci", "1.6 tdci", "tdci 95", "tdci 100", "tdci 120", "2.0 tdci", "tdci 150"],
    makes: ["ford"],
    fuel: ["diesel"],
    issues: [
      { id: "tdci-dpf", title: "Filtre à particules", severity: "medium", fromKm: 120000, description: "Encrassement en usage urbain.", costMin: 300, costMax: 1200, whatToCheck: "Pas de voyant ni de perte de puissance." },
      { id: "tdci-turbo", title: "Turbo", severity: "medium", fromKm: 130000, description: "Sensible aux vidanges espacées.", costMin: 800, costMax: 1600, whatToCheck: "Pas de sifflement ni fumée bleue." },
    ],
  },
  {
    id: "bmw-n47",
    label: "BMW 2.0d N47 (2007-2014)",
    keywords: ["n47", "116d", "118d", "120d", "318d", "320d", "x1 18d", "x1 20d", "x3 20d", "520d", "2.0d"],
    makes: ["bmw", "mini"],
    fuel: ["diesel"],
    issues: [
      { id: "n47-chain", title: "Chaîne de distribution à l'arrière du moteur", severity: "high", fromKm: 100000, peakKm: 180000, description: "La chaîne s'use et peut casser. Elle est placée côté boîte : la réparation oblige à sortir le moteur.", costMin: 1800, costMax: 3500, whatToCheck: "Bruit de chaîne au ralenti moteur chaud = danger. Demander si elle a été remplacée." },
      { id: "n47-swirl", title: "Volets d'admission", severity: "medium", fromKm: 120000, description: "Encrassement, perte de puissance.", costMin: 400, costMax: 900, whatToCheck: "Accélération franche sans trou." },
    ],
  },
  {
    id: "bmw-b47-b48",
    label: "BMW B47 / B48 (depuis 2014)",
    keywords: ["b47", "b48", "116d", "118d", "120d", "318d", "320d", "520d", "x1 18d", "x1 20d", "x3 20d", "118i", "120i", "320i", "330i", "x1 18i", "x1 20i"],
    makes: ["bmw", "mini"],
    issues: [
      { id: "b47-egr", title: "Rappel vanne antipollution", severity: "medium", description: "Un rappel pour risque d'incendie a concerné de nombreux diesels. À vérifier.", costMin: 0, costMax: 0, whatToCheck: "Demander si le rappel a été fait ; la concession peut le confirmer avec le VIN." },
      { id: "b47-coolant", title: "Pompe à eau", severity: "low", fromKm: 120000, description: "Fuite possible à kilométrage élevé.", costMin: 400, costMax: 800, whatToCheck: "Niveau de liquide de refroidissement." },
    ],
  },
  {
    id: "mercedes-om651",
    label: "Mercedes 2.1 CDI OM651",
    keywords: ["om651", "200 cdi", "220 cdi", "250 cdi", "180 cdi", "200 d", "220 d", "2.1 cdi", "2.2 cdi"],
    makes: ["mercedes", "mercedes-benz", "infiniti"],
    fuel: ["diesel"],
    issues: [
      { id: "om651-injectors", title: "Injecteurs (premières années)", severity: "medium", fromKm: 100000, description: "Les injecteurs des premiers moteurs peuvent fuir ou claquer.", costMin: 500, costMax: 1500, whatToCheck: "Ralenti régulier, pas d'odeur de gazole dans l'habitacle." },
      { id: "om651-chain", title: "Chaîne de distribution", severity: "medium", fromKm: 150000, description: "Cliquetis au démarrage à kilométrage élevé.", costMin: 1200, costMax: 2500, whatToCheck: "Pas de bruit métallique au démarrage à froid." },
    ],
  },
  {
    id: "toyota-hybrid",
    label: "Toyota / Lexus hybride",
    keywords: ["hybrid", "hybride", "hsd", "hev"],
    makes: ["toyota", "lexus"],
    fuel: ["hybride", "hybride_rechargeable"],
    issues: [
      { id: "thsd-battery", title: "Batterie hybride à kilométrage élevé", severity: "low", fromKm: 200000, fromYears: 10, description: "Très fiable. La batterie peut faiblir après 10 ans ou 200 000 km.", costMin: 1500, costMax: 3000, whatToCheck: "Pas de message batterie. Demander si la garantie hybride a été prolongée (contrôle annuel)." },
      { id: "thsd-brakes", title: "Freins peu sollicités", severity: "low", description: "Les disques peuvent rouiller car le freinage est surtout électrique.", costMin: 200, costMax: 500, whatToCheck: "Regarder l'état des disques arrière." },
    ],
  },
  {
    id: "nissan-12-dig-t",
    label: "Nissan 1.2 DIG-T (Qashqai, Juke)",
    keywords: ["1.2 dig-t", "dig-t 115", "hra2"],
    makes: ["nissan"],
    fuel: ["essence"],
    issues: [
      { id: "digt-oil", title: "Consommation d'huile excessive", severity: "high", fromKm: 60000, description: "Ce moteur peut consommer beaucoup d'huile et casser si le niveau n'est pas surveillé.", costMin: 0, costMax: 4000, whatToCheck: "Niveau d'huile, fréquence des appoints, fumée bleue." },
      { id: "digt-chain", title: "Chaîne de distribution", severity: "medium", fromKm: 90000, description: "Cliquetis au démarrage.", costMin: 800, costMax: 1500, whatToCheck: "Pas de cliquetis moteur froid." },
    ],
  },
  {
    id: "fiat-13-multijet",
    label: "Fiat / Opel 1.3 Multijet / CDTI",
    keywords: ["1.3 multijet", "1.3 cdti", "1.3 jtd", "multijet 95", "cdti 95", "1.3 d"],
    makes: ["fiat", "opel", "vauxhall", "alfa romeo", "lancia", "suzuki", "jeep"],
    fuel: ["diesel"],
    issues: [
      { id: "mjet-dpf", title: "Filtre à particules", severity: "medium", fromKm: 120000, description: "Encrassement en ville.", costMin: 300, costMax: 1000, whatToCheck: "Pas de voyant, pas de perte de puissance." },
      { id: "mjet-turbo", title: "Turbo", severity: "medium", fromKm: 130000, description: "Sensible à l'huile.", costMin: 700, costMax: 1400, whatToCheck: "Pas de sifflement." },
    ],
  },
  {
    id: "hyundai-kia-16-crdi",
    label: "Hyundai / Kia 1.6 CRDi",
    keywords: ["1.6 crdi", "crdi 115", "crdi 136", "crdi 110", "1.7 crdi"],
    makes: ["hyundai", "kia"],
    fuel: ["diesel", "hybride"],
    issues: [
      { id: "crdi-dpf", title: "Filtre à particules", severity: "medium", fromKm: 120000, description: "Encrassement en ville.", costMin: 300, costMax: 1000, whatToCheck: "Pas de voyant." },
      { id: "crdi-egr", title: "Vanne antipollution", severity: "low", fromKm: 100000, description: "Encrassement.", costMin: 250, costMax: 600, whatToCheck: "Essai moteur froid." },
    ],
  },
  {
    id: "psa-ecmp-electrique",
    label: "Peugeot e-208 / e-2008, Opel Corsa-e / Mokka-e, DS3 E-Tense (plateforme e-CMP)",
    keywords: ["electrique", "électrique", "e-208", "e-2008", "corsa-e", "mokka-e", "e-tense", "e-c4", "ë-c4", "208 ii", "2008 ii"],
    makes: ["peugeot", "citroen", "citroën", "ds", "opel", "vauxhall"],
    fuel: ["electrique"],
    issues: [
      { id: "ecmp-12v", title: "Batterie 12 V qui se décharge", severity: "medium", fromYears: 2, description: "La petite batterie 12 V peut se vider et empêcher le démarrage, même avec la grosse batterie pleine. Une mise à jour corrige souvent le problème.", costMin: 0, costMax: 250, whatToCheck: "Demander si le véhicule a déjà refusé de démarrer et si la mise à jour a été faite en concession." },
      { id: "ecmp-software", title: "Mises à jour logicielles", severity: "low", description: "Plusieurs rappels se font par mise à jour : écran, recharge, chauffage.", costMin: 0, costMax: 0, whatToCheck: "Vérifier en concession, avec le VIN, que toutes les mises à jour et rappels sont faits." },
      { id: "ecmp-charge", title: "Recharge : câble et prise", severity: "low", fromKm: 40000, description: "Le câble de recharge et le capot de prise s'usent. La recharge rapide peut être moins rapide que l'annonce par temps froid : c'est normal.", costMin: 100, costMax: 400, whatToCheck: "Brancher le véhicule pendant l'essai et vérifier que la recharge démarre. Demander le câble d'origine." },
      { id: "ecmp-battery", title: "État de la batterie de traction", severity: "info", description: "Garantie 8 ans ou 160 000 km à 70 % de capacité. L'autonomie baisse lentement avec les années.", costMin: 0, costMax: 0, whatToCheck: "Demander au vendeur combien de kilomètres le tableau de bord affiche quand la batterie est chargée à 100 % (neuve : environ 340 km). Demander aussi un certificat de santé de la batterie, que la concession peut établir." },
    ],
  },
  {
    id: "tesla-model3-y",
    label: "Tesla Model 3 / Model Y",
    keywords: ["model 3", "model y"],
    makes: ["tesla"],
    fuel: ["electrique"],
    issues: [
      { id: "tesla-susp", title: "Bras de suspension", severity: "medium", fromKm: 60000, description: "Bruits et usure prématurée des bras de suspension avant.", costMin: 300, costMax: 900, whatToCheck: "Pas de claquement sur dos d'âne." },
      { id: "tesla-battery", title: "État de la batterie", severity: "info", description: "La batterie est garantie 8 ans. Sa capacité baisse lentement.", costMin: 0, costMax: 0, whatToCheck: "Demander au vendeur combien de kilomètres le tableau de bord affiche à 100 % de charge et comparer à l'autonomie d'origine du modèle." },
    ],
  },
  {
    id: "psa-eat6-eat8",
    label: "Boîte automatique EAT6 / EAT8",
    keywords: ["eat8", "eat6", "eat 8", "eat 6"],
    makes: ["peugeot", "citroen", "citroën", "ds", "opel", "vauxhall"],
    issues: [
      { id: "eat-jerk", title: "Boîte automatique : à-coups à basse vitesse", severity: "low", description: "Souvent réglé par une mise à jour en concession.", costMin: 0, costMax: 150, whatToCheck: "À l'essai, rouler doucement en ville et sentir les passages de vitesse." },
      { id: "eat-oil", title: "Vidange de boîte automatique", severity: "medium", fromKm: 60000, description: "Le constructeur dit « sans entretien », les ateliers conseillent une vidange tous les 60 000 km.", costMin: 250, costMax: 450, whatToCheck: "Demander si une vidange de boîte a été faite." },
    ],
  },
  {
    id: "dacia-generic",
    label: "Dacia",
    keywords: ["sandero", "duster", "logan", "jogger", "spring"],
    makes: ["dacia"],
    issues: [
      { id: "dacia-rust", title: "Points de rouille", severity: "low", fromYears: 6, description: "Traitement anticorrosion léger : regarder le bas de caisse et les passages de roue.", costMin: 0, costMax: 800, whatToCheck: "Regarder sous le véhicule et autour des roues." },
    ],
  },
];

/** Pannes génériques selon énergie, kilométrage et âge, quand aucune fiche précise ne s'applique ou en complément. */
export const GENERIC_ISSUES: { fuel?: Fuel[]; minKm?: number; minYears?: number; issue: Omit<KnownIssue, "applies" | "inZone"> }[] = [
  { fuel: ["diesel"], minKm: 100000, issue: { id: "gen-dpf", title: "Filtre à particules", severity: "medium", fromKm: 100000, description: "Sur un diesel qui roule surtout en ville, le filtre s'encrasse.", costMin: 300, costMax: 1200, whatToCheck: "Demander le type de trajets. Pas de voyant, pas de perte de puissance." } },
  { fuel: ["diesel"], minKm: 90000, issue: { id: "gen-egr", title: "Vanne antipollution", severity: "low", fromKm: 90000, description: "Encrassement fréquent sur tous les diesels.", costMin: 250, costMax: 700, whatToCheck: "Essai moteur froid : pas d'à-coups." } },
  { fuel: ["essence", "diesel", "hybride", "hybride_rechargeable", "gpl"], minKm: 120000, issue: { id: "gen-clutch", title: "Embrayage et volant moteur", severity: "medium", fromKm: 120000, description: "Usure normale à ce kilométrage.", costMin: 600, costMax: 1500, whatToCheck: "Pédale ferme, pas de patinage en côte, pas de vibration au ralenti." } },
  { minKm: 100000, issue: { id: "gen-suspension", title: "Amortisseurs et trains roulants", severity: "low", fromKm: 100000, description: "Usure normale : amortisseurs, silentblocs, rotules.", costMin: 300, costMax: 900, whatToCheck: "Pas de claquement sur route dégradée, tenue de route stable." } },
  { fuel: ["electrique"], minYears: 5, issue: { id: "gen-ev-battery", title: "État de la batterie", severity: "info", description: "La capacité baisse lentement avec l'âge et les charges rapides.", costMin: 0, costMax: 0, whatToCheck: "Demander au vendeur combien de kilomètres le tableau de bord affiche à 100 % de charge, et un certificat de santé de la batterie établi par la concession." } },
  { fuel: ["electrique"], issue: { id: "gen-ev-software", title: "Mises à jour logicielles", severity: "info", description: "De nombreux rappels se font par mise à jour.", costMin: 0, costMax: 0, whatToCheck: "Vérifier en concession, avec le VIN, que toutes les mises à jour sont faites." } },
  { fuel: ["hybride", "hybride_rechargeable"], minYears: 7, issue: { id: "gen-hev-battery", title: "Batterie hybride", severity: "low", fromYears: 7, description: "Peut faiblir après plusieurs années.", costMin: 1000, costMax: 3000, whatToCheck: "Pas de message batterie. Demander un contrôle d'état hybride." } },
  { minYears: 6, issue: { id: "gen-12v", title: "Batterie 12 V", severity: "low", fromYears: 5, description: "Une batterie dure 5 à 7 ans.", costMin: 100, costMax: 250, whatToCheck: "Démarrage franc à froid." } },
];
