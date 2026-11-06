#!/usr/bin/env sh
# Lance la version de production (identique au serveur Docker) pour les tests de bout en bout.
set -e
DIR=.e2e-standalone
rm -rf "$DIR"
cp -r .next/standalone "$DIR"
cp -r .next/static "$DIR/.next/static"
cp -r drizzle "$DIR/drizzle"
[ -d public ] && cp -r public "$DIR/public" || true
cd "$DIR"
exec node server.js
