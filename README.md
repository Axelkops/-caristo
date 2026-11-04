# Caristo

Le rapport complet sur un véhicule d'occasion : historique, kilométrage, sinistres, pannes connues du modèle, cote, échéancier d'entretien, questions au vendeur. Édité par Digikom Group.

## Ce que contient ce projet

- **Site complet** (Next.js 15, TypeScript, Tailwind) : accueil, parcours en 3 étapes (véhicule → informations → rapport), paiement, rapport à l'écran, PDF, lien de partage 12 mois, carnet d'entretien, pages légales.
- **Moteur Caristo** (`src/lib/engine`) : validation des plaques (France + Europe) et VIN (monde), base de pannes connues par motorisation (`src/lib/data/known-issues.ts`), échéancier 12/24/36 mois, estimation de cote, score de risque, questions au vendeur.
- **Fournisseurs de données** (`src/lib/providers`) : identification par plaque / VIN, historique officiel, rappels constructeur, analyse d'annonce. Chaque fournisseur a une version **démo** (données réalistes, sans compte) et une version **réelle**.
- **Base de données** Postgres via Drizzle : PGlite en local (aucune installation), Postgres en production.
- **Tests** : 38 tests unitaires (dont 10 000 rapports générés automatiquement) et 20 tests de parcours complet (ordinateur + mobile).

## Démarrer en local (mode démonstration)

```bash
npm install --legacy-peer-deps
cp .env.example .env        # DEMO_MODE=true par défaut
npm run dev                 # http://localhost:3000
```

En mode démo : n'importe quelle plaque française valide renvoie un véhicule d'exemple, le paiement est simulé, les e-mails s'affichent dans la console du serveur. Plaque `ZZ-999-ZZ` = véhicule inconnu (pour tester l'erreur).

## Tests

```bash
npm test            # unitaires (vitest)
npm run build       # build de production
npm run test:e2e    # parcours complet avec Playwright (lance le serveur tout seul)
```

## Mettre en ligne : les comptes à créer

| Étape | Service | Pourquoi | Variables à renseigner |
| --- | --- | --- | --- |
| 1 | **Hébergement** : [Vercel](https://vercel.com) (gratuit pour démarrer) ou VPS avec Node 20+ | Exécuter l'application (Hostinger mutualisé ne suffit pas) | `NEXT_PUBLIC_SITE_URL` |
| 2 | **Base Postgres** : Neon, Supabase ou Vercel Postgres (gratuit pour démarrer) | Stocker les rapports | `DATABASE_URL=postgresql://…` |
| 3 | **API plaque / VIN** : ex. apiplaqueimmatriculation.com (packs dès 39 €/mois) | Fiche technique à partir de la plaque | `PLATE_PROVIDER=apiplaque`, `PLATE_API_KEY`, `PLATE_API_URL` |
| 4 | **Stripe** | Encaisser 19,90 / 49,90 / 129,90 € | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` |
| 5 | **Resend** (ou autre) | Envoyer le rapport par e-mail | `RESEND_API_KEY`, `EMAIL_FROM` |
| 6 | **Nom de domaine** chez Hostinger : pointer vers Vercel | Adresse du site | — |

Puis : `DEMO_MODE=false`, `APP_SECRET` (chaîne aléatoire de 32 caractères minimum), `CRON_SECRET` (idem). Le nettoyage nocturne (suppression des informations de carte grise après 30 jours, des brouillons, des rapports expirés) est déclaré dans `vercel.json`.

### Stripe : réglages

1. Créer 3 produits avec prix uniques (19,90 €, 49,90 €, 129,90 €) et copier les `price_…` dans `STRIPE_PRICE_SINGLE`, `STRIPE_PRICE_PACK3`, `STRIPE_PRICE_PACK10`.
2. Ajouter un webhook vers `https://votre-domaine/api/stripe/webhook` pour l'événement `checkout.session.completed` ; copier le secret de signature dans `STRIPE_WEBHOOK_SECRET`.
3. Tester en mode test Stripe avant de passer en clés réelles.

### Historique officiel

Les contrôles techniques, kilométrages relevés, sinistres et situation administrative viennent des registres de l'État, ouverts avec les trois informations de la carte grise saisies par le client. L'adaptateur `HISTORY_PROVIDER=auto` est à implémenter dans `src/lib/providers/` une fois l'accès validé (voir le document « Caristo — Sources de données »). Tant qu'il n'est pas branché (`HISTORY_PROVIDER=none`), le rapport est produit avec tout le reste et signale clairement les sections non disponibles. Une alternative est un fournisseur privé sous contrat, à brancher dans le même adaptateur.

### Rappels constructeur

Base publique RappelConso (licence ouverte), interrogée en direct avec cache 7 jours. Rien à configurer.

### Analyse d'annonce

Lecture automatique de la page de l'annonce (prix, kilométrage, mentions clés). Certains sites bloquent les robots : le rapport le dit alors au lieu d'inventer.

## Enrichir la base de pannes connues

Fichier `src/lib/data/known-issues.ts`. Une fiche = une famille de moteurs (mots-clés, marques, énergie) et ses pannes : titre simple, gravité, kilométrage d'apparition, description en une phrase, coût, geste de contrôle. C'est le cœur de la valeur de Caristo : à enrichir modèle par modèle, à partir des rappels, bulletins techniques et retours d'ateliers.

## Limites assumées (affichées au client)

- Les pannes connues décrivent le modèle, pas ce véhicule : à contrôler sur place.
- Un seul relevé de kilométrage par contrôle technique.
- La cote est une estimation.
- L'historique officiel n'existe que pour les véhicules immatriculés en France ; hors France, le rapport contient fiche technique, pannes connues, cote et échéancier.
- Les textes des pages légales sont des documents de travail à faire valider par un avocat.

## Structure

```
src/app            pages et routes API (Next.js App Router)
src/components     composants d'interface
src/lib/engine     moteur : identifiants, pannes connues, échéancier, cote, rapport
src/lib/providers  fournisseurs de données (démo + réels) et cache
src/lib/services   rapports, paiement, e-mail, tarifs
src/lib/db         schéma Drizzle et connexion
src/lib/data       base des pannes connues
drizzle/           migrations SQL
tests/unit         tests unitaires (vitest)
tests/e2e          tests de parcours (Playwright)
```
