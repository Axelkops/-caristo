# Caristo sur un VPS Hostinger

Tout chez Hostinger : le site, la base de données, le domaine, l'e-mail. Seuls Stripe (paiement) et le fournisseur de plaques restent externes.

## 1. Commander le VPS
Hostinger → VPS → offre KVM 1 ou KVM 2 (2 Go de RAM suffisent au départ). Système : Ubuntu 24.04. Notez l'adresse IP et le mot de passe root.

## 2. Pointer le domaine
Dans Hostinger → Domaines → votre domaine → DNS : créer un enregistrement **A** `@` → IP du VPS, et un **A** `www` → IP du VPS. (Le reste des enregistrements, notamment e-mail, ne change pas.)

## 3. Envoyer le code sur le VPS
Depuis votre ordinateur, avec le fichier `caristo-site.tar.gz` :
```bash
scp caristo-site.tar.gz root@IP_DU_VPS:/root/
ssh root@IP_DU_VPS
tar xzf caristo-site.tar.gz && cd caristo
```

## 4. Installer
```bash
bash deploy/install-hostinger-vps.sh votre-domaine.fr
```
Le script installe Docker, démarre le site, la base Postgres, le HTTPS automatique et une sauvegarde quotidienne de la base.

## 5. Renseigner les clés
Éditer `.env` (`nano .env`) : `DEMO_MODE=false`, `NEXT_PUBLIC_SITE_URL=https://votre-domaine.fr`, clé du fournisseur de plaques, Stripe, Resend, `APP_SECRET` et `CRON_SECRET` (chaînes aléatoires). Puis :
```bash
cd deploy && docker compose up -d --build
```

## Au quotidien
- Journaux : `cd deploy && docker compose logs -f web`
- Mise à jour du code : remplacer les fichiers, puis `docker compose up -d --build`
- Sauvegardes : `deploy/backups/` (14 jours)
- Redémarrer : `docker compose restart`
