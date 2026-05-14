import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import crypto from "crypto";

const ROLE_MAP: Record<string, string> = {
  Administrateur: "ADMIN",
  Utilisateur: "USER",
  Superviseur: "SUPERVISEUR",
};
const ROLES = ["Administrateur", "Utilisateur", "Superviseur"];

/** GET /api/invitations – Liste des invitations envoyées par le client */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Réservé aux clients" }, { status: 403 });
  }
  try {
    const list = await prisma.invitation.findMany({
      where: { invitedById: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(list);
  } catch {
    return NextResponse.json({ invitations: [] });
  }
}

/** POST /api/invitations – Créer une invitation */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Réservé aux clients" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const roleLabel = body.role;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    const roleKey = ROLE_MAP[roleLabel] || "USER";
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 400 }
      );
    }
    const pending = await prisma.invitation.findFirst({
      where: { email, invitedById: session.user.id, status: "PENDING" },
    });
    if (pending && pending.expiresAt > new Date()) {
      return NextResponse.json(
        { error: "Une invitation en attente existe déjà pour cet email." },
        { status: 400 }
      );
    }
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const inv = await prisma.invitation.create({
      data: {
        email,
        role: roleKey,
        invitedById: session.user.id,
        token,
        status: "PENDING",
        expiresAt,
      },
    });
    const baseUrl = (process.env.NEXTAUTH_URL?.trim() || SITE_URL).replace(/\/$/, "");
    const acceptUrl = `${baseUrl}/invitation/accept?token=${token}`;
    return NextResponse.json({
      id: inv.id,
      email: inv.email,
      role: roleKey,
      acceptUrl,
      expiresAt: inv.expiresAt,
    });
  } catch (e) {
    console.error("Création invitation:", e);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'invitation." },
      { status: 500 }
    );
  }
}
