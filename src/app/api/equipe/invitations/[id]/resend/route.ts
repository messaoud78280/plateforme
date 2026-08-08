import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { requireEquipeAdmin } from "@/lib/equipe-acces/admin";
import { logAccessAction } from "@/lib/equipe-acces/audit";

type Ctx = { params: Promise<{ id: string }> };

/** POST — renouvelle le token et prolonge l’expiration. */
export async function POST(_request: Request, context: Ctx) {
  const gate = await requireEquipeAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { id } = await context.params;

  try {
    const inv = await prisma.invitation.findFirst({
      where: { id, invitedById: gate.ctx.ownerUserId },
    });
    if (!inv) {
      return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
    }
    if (inv.status === "ACCEPTED") {
      return NextResponse.json({ error: "Invitation déjà acceptée" }, { status: 400 });
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.invitation.update({
      where: { id },
      data: { token, expiresAt, status: "PENDING" },
    });

    const baseUrl = (process.env.NEXTAUTH_URL?.trim() || SITE_URL).replace(/\/$/, "");
    const acceptUrl = `${baseUrl}/invitation/accept?token=${token}`;

    await logAccessAction({
      organizationId: gate.ctx.organizationId,
      actorUserId: gate.ctx.actorId,
      action: "INVITE_RESENT",
      detail: JSON.stringify({ invitationId: id, email: inv.email }),
    });

    return NextResponse.json({ email: inv.email, acceptUrl, expiresAt });
  } catch (e) {
    console.error("POST resend invite", e);
    return NextResponse.json({ error: "Erreur renvoi" }, { status: 500 });
  }
}
