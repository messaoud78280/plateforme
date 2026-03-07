#!/usr/bin/env bash
# Déploiement sur Railway — à lancer depuis la racine du projet.
set -e
cd "$(dirname "$0")/.."

echo "→ Vérification de la connexion Railway..."
if ! npx --yes @railway/cli whoami &>/dev/null; then
  echo ""
  echo "Vous devez vous connecter à Railway (une seule fois)."
  echo "Exécutez :  npx @railway/cli login"
  echo "Une page web s’ouvrira pour l’authentification."
  echo ""
  exit 1
fi

echo "→ Liaison du projet (si pas déjà fait : choisir 'Create new project')..."
npx --yes @railway/cli link 2>/dev/null || true

echo "→ Déploiement en cours..."
npx --yes @railway/cli up

echo ""
echo "→ Déploiement lancé. Consultez l’URL dans le dashboard Railway."
echo "  N’oubliez pas de définir les variables d’environnement (voir docs/DEPLOI-RAILWAY.md)."
