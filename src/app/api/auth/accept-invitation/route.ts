import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, name, password } = body;
    if (!token || !name?.trim() || !password || password.length < 8) {
      return NextResponse.json(
        { error: "Token, nom et mot de passe (8 caractères min.) requis." },
        { status: 400 }
      );
    }
    const inv = await prisma.invitation.findUnique({
      where: { token },
    });
    if (!inv || inv.status !== "PENDING" || inv.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invitation expirée ou déjà utilisée." },
        { status: 400 }
      );
    }
    const existing = await prisma.user.findUnique({
      where: { email: inv.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 400 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email: inv.email,
        password: hashedPassword,
        name: name.trim(),
        role: UserRole.CLIENT,
        invitedById: inv.invitedById,
        teamRole: inv.role,
        subscriptionPlan: "STANDARD",
        monthlyActionsTotal: SUBSCRIPTION_PLANS.STANDARD.actionsIncluded,
      },
    });
    await prisma.invitation.update({
      where: { id: inv.id },
      data: { status: "ACCEPTED" },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Accept invitation:", e);
    return NextResponse.json(
      { error: "Erreur lors de l'acceptation de l'invitation." },
      { status: 500 }
    );
  }
}
