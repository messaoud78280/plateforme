import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** GET /api/alerts – Alertes non lues du client */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (session.user.role !== "CLIENT") {
    return NextResponse.json({ alerts: [] });
  }
  try {
    const alerts = await prisma.alert.findMany({
      where: { clientId: session.user.id, read: false },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return NextResponse.json(alerts);
  } catch {
    return NextResponse.json({ alerts: [] });
  }
}
