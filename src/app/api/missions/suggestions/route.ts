import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/missions/suggestions?q= — Suggestions de missions basées sur l'historique */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Réservé aux clients" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();

  try {
    const where = {
      clientId: session.user.id,
      status: "COMPLETE" as const,
      completedAt: { not: null },
    };

    let missions = await prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        completedAt: true,
      },
      orderBy: { completedAt: "desc" },
      take: 20,
    });

    // Filtrer par similarité du titre si q fourni
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      missions = missions.filter((m) => {
        const title = (m.title ?? "").toLowerCase();
        const desc = (m.description ?? "").toLowerCase();
        return tokens.some((t) => title.includes(t) || desc.includes(t));
      });
    }

    // Dédupliquer par titre normalisé (premier = plus récent)
    const seen = new Set<string>();
    const unique = missions.filter((m) => {
      const key = m.title.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json(unique.slice(0, 10));
  } catch (e) {
    console.error("Erreur suggestions missions:", e);
    return NextResponse.json(
      { error: "Erreur lors des suggestions" },
      { status: 500 }
    );
  }
}
