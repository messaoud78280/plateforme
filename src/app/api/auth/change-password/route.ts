import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** POST /api/auth/change-password – Changer le mot de passe */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const currentPassword = body.currentPassword;
    const newPassword = body.newPassword;

    if (typeof currentPassword !== "string" || !currentPassword.trim()) {
      return NextResponse.json(
        { error: "Mot de passe actuel requis" },
        { status: 400 }
      );
    }
    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Mot de passe actuel incorrect" },
        { status: 400 }
      );
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors du changement de mot de passe" },
      { status: 500 }
    );
  }
}
