import { NextResponse } from "next/server";
import { getPrismaPoolDiagnostics, prisma } from "@/lib/prisma";

/**
 * GET /api/health-db
 * Vérifie Railway ↔ Supabase sans exposer d’URL ni de secret.
 * Une seule requête légère — ne pas rappeler en boucle agressive.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const t0 = Date.now();
  const pool = getPrismaPoolDiagnostics();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      latencyMs: Date.now() - t0,
      pool: {
        mode: pool.mode,
        port: pool.port,
        pgbouncer: pool.pgbouncer,
        connectionLimit: pool.connectionLimit,
        rewrittenToTransaction: pool.rewrittenToTransaction,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const safe = /EMAXCONNSESSION|max clients|P1001|P2024|Can't reach|Too many connections|pool/i.test(
      message,
    )
      ? message.replace(/postgresql:\/\/\S+/gi, "[redacted]").slice(0, 180)
      : "Connexion base indisponible";
    return NextResponse.json(
      {
        ok: false,
        latencyMs: Date.now() - t0,
        error: safe,
        pool: {
          mode: pool.mode,
          port: pool.port,
          pgbouncer: pool.pgbouncer,
          connectionLimit: pool.connectionLimit,
          rewrittenToTransaction: pool.rewrittenToTransaction,
        },
      },
      { status: 503 },
    );
  }
}
