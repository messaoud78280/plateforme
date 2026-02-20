import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/users/gerante – Récupère la gérante (Laure Olivie / MANAGER) */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  try {
    const manager = await prisma.user.findFirst({
      where: { role: "MANAGER" },
      select: { id: true, name: true },
    });

    if (!manager) {
      return NextResponse.json(null);
    }

    return NextResponse.json(manager);
  } catch (error) {
    console.error("Erreur récupération gérante:", error);
    return NextResponse.json(
      { error: "Erreur." },
      { status: 500 }
    );
  }
}
