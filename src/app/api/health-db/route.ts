import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/health-db
 * Vérifie si l'app peut se connecter à la base (Supabase).
 * À appeler depuis https://www.bework.fr/api/health-db pour tester Railway ↔ Supabase.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      message: "Connexion à la base Supabase OK (Railway ↔ Supabase).",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
