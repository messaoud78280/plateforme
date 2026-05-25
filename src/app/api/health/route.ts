import { NextResponse } from "next/server";

/**
 * Endpoint healthcheck léger pour Railway et UptimeRobot.
 * Pas d'appel DB / Auth / dépendance externe : on confirme uniquement que le
 * runtime Next.js a bien démarré et peut servir une requête HTTP.
 *
 * À configurer côté Railway : Settings → Networking → Healthcheck Path = /api/health
 * Pendant un redéploiement, Railway ne bascule le trafic qu'une fois ce endpoint OK
 * → évite les erreurs 5xx vues par Googlebot ou les utilisateurs.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "bework",
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}

export function HEAD() {
  return new Response(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
