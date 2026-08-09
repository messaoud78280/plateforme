import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { searchGlobal } from "@/lib/search/global-search";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/search?q=
 * Recherche globale métier (métadonnées). Min 2 caractères pour résultats objet.
 */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      personType: true,
      permissionProfile: true,
      name: true,
      role: true,
    },
  });

  const result = await searchGlobal({
    user: {
      id: session.user.id,
      role: dbUser?.role ?? session.user.role,
      personType: dbUser?.personType ?? session.user.personType ?? null,
      permissionProfile:
        dbUser?.permissionProfile ?? session.user.permissionProfile ?? null,
      isDemo: Boolean(session.user.isDemo),
      demoRootUserId: session.user.demoRootUserId ?? null,
      name: dbUser?.name ?? session.user.name ?? null,
    },
    query: q,
  });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "private, no-store",
    },
  });
}
