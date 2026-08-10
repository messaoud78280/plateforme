#!/usr/bin/env bash
# Build production Next.js — heap forcé (Railway Metal / webpack OOM).
set -euo pipefail

HEAP_MB="${BEWORK_BUILD_HEAP_MB:-8192}"

echo "→ prisma generate"
npx prisma generate

echo "→ next build (heap=${HEAP_MB} Mo, webpack)"
# Forcer le plafond sur le process Node qui lance Next (pas seulement via env npm).
exec node --max-old-space-size="${HEAP_MB}" ./node_modules/next/dist/bin/next build --webpack
