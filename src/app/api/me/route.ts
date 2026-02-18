import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** PATCH /api/me – Mettre à jour le profil (nom) */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : null;

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Le nom doit contenir au moins 2 caractères" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil" },
      { status: 500 }
    );
  }
}
