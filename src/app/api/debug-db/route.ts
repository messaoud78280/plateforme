import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/debug-db – Diagnostic connexion DB (à supprimer après résolution).
 * Affiche l'erreur exacte et le host utilisé, sans exposer le mot de passe.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const url = process.env.DATABASE_URL || process.env.DIRECT_URL || "";
  let host = "non défini";
  try {
    const parsed = new URL(url.replace(/^postgres:/, "postgresql:"));
    host = parsed.hostname + ":" + (parsed.port || "5432");
  } catch {
    // ignore
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      message: "Connexion OK",
      host,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectUrl: !!process.env.DIRECT_URL,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: false,
        host,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasDirectUrl: !!process.env.DIRECT_URL,
        error: message,
      },
      { status: 500 }
    );
  }
}
