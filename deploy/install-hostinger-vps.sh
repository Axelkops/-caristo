#!/usr/bin/env bash
# Installation de Caristo sur un VPS Hostinger (Ubuntu 22.04 / 24.04).
# Usage : bash install-hostinger-vps.sh caristo.fr
set -euo pipefail
DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then echo "Usage : bash install-hostinger-vps.sh votre-domaine.fr"; exit 1; fi

echo "→ Installation de Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

cd "$(dirname "$0")/.."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "→ Fichier .env créé : renseignez-y vos clés (DEMO_MODE=false, PLATE_API_KEY, STRIPE_*, RESEND_API_KEY, APP_SECRET, CRON_SECRET, NEXT_PUBLIC_SITE_URL=https://$DOMAIN)."
fi
cd deploy
if [ ! -f .env ]; then
  echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)" > .env
  echo "DOMAIN=$DOMAIN" >> .env
fi
mkdir -p backups

echo "→ Construction et démarrage (site + base + HTTPS)"
docker compose up -d --build

echo "→ Tâche de nettoyage nocturne"
CRON_SECRET=$(grep '^CRON_SECRET=' ../.env | cut -d'"' -f2 | cut -d'=' -f2)
( crontab -l 2>/dev/null | grep -v caristo-cleanup ; echo "30 3 * * * curl -fsS -H 'Authorization: Bearer ${CRON_SECRET}' https://$DOMAIN/api/cron/cleanup >/dev/null 2>&1 # caristo-cleanup" ) | crontab -

echo
echo "✓ Caristo est en ligne sur https://$DOMAIN (le certificat HTTPS est obtenu automatiquement, prévoir 1 minute)."
echo "  Mettre à jour plus tard : git pull (ou copier les nouveaux fichiers) puis  cd deploy && docker compose up -d --build"
echo "  Journaux :  cd deploy && docker compose logs -f web"
