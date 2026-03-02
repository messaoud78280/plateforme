import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/contract/accept
 * Enregistre l'acceptation du contrat par le client connecté (sans prestataire externe).
 * Met à jour contractStatus = SIGNED et signedAt = now().
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, contractStatus: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
  if (user.contractStatus === "SIGNED") {
    return NextResponse.json({ signed: true, message: "Contrat déjà accepté." });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      contractStatus: "SIGNED",
      signedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, signed: true });
}
