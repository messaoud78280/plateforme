#!/usr/bin/env bash
# Démarrage production (Railway Metal).
# Ne pas passer -H : `0.0.0.0` = IPv4 seul, `::` = IPv6 seul selon ipv6Only.
# Sans hostname, Node écoute en dual-stack (IPv4 + IPv6) — requis pour le healthcheck.
set -euo pipefail

PORT="${PORT:-3000}"

# Railway définit HOSTNAME = id du conteneur (casse le bind en mode standalone).
unset HOSTNAME || true

echo "→ BeWork start port=${PORT} bind=dual-stack node=$(node -v)"

exec node ./node_modules/next/dist/bin/next start -p "${PORT}"
