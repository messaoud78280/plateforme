import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/debug-db – Diagnostic connexion DB (dev / staging uniquement).
 * Réservé MANAGER. N’expose jamais le mot de passe de connexion.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "MANAGER") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
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
