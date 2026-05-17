#!/usr/bin/env bash
# Déploiement Railway — authentification par session CLI ou token projet (.env.railway).
set -euo pipefail
cd "$(dirname "$0")/.."

CLI="npx --yes @railway/cli"
ENV_FILE=".env.railway"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

SERVICE="${RAILWAY_SERVICE:-plateforme}"
ENVIRONMENT="${RAILWAY_ENVIRONMENT:-production}"

echo "→ Vérification Railway CLI…"

if [[ -n "${RAILWAY_TOKEN:-}" ]]; then
  echo "   Token projet (.env.railway) détecté."
elif $CLI whoami &>/dev/null; then
  echo "   Session CLI active ($($CLI whoami 2>/dev/null || echo 'ok'))."
else
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  Railway CLI non connectée                                   ║"
  echo "╠══════════════════════════════════════════════════════════════╣"
  echo "║  Option A — Connexion navigateur (une fois) :                ║"
  echo "║    npm run deploy:login                                      ║"
  echo "║                                                              ║"
  echo "║  Option B — Token projet (recommandé, stable) :               ║"
  echo "║    1. railway.app → projet plateforme → Settings → Tokens    ║"
  echo "║    2. Create project token                                   ║"
  echo "║    3. cp railway.deploy.env.example .env.railway              ║"
  echo "║    4. Collez le token dans .env.railway                      ║"
  echo "║    5. npm run deploy                                         ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
  exit 1
fi

if [[ -z "${RAILWAY_TOKEN:-}" ]]; then
  echo "→ Liaison du projet (si besoin)…"
  $CLI link -p plateforme -e "$ENVIRONMENT" -s "$SERVICE" 2>/dev/null || $CLI link 2>/dev/null || true
fi

echo "→ Déploiement : service=$SERVICE environment=$ENVIRONMENT"
$CLI up --service "$SERVICE" --environment "$ENVIRONMENT"

echo ""
echo "→ Déploiement envoyé. Suivez les logs sur railway.app ou : npm run deploy:logs"
