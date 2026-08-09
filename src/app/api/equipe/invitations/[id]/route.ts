import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireEquipeAdmin } from "@/lib/equipe-acces/admin";
import { logAccessAction } from "@/lib/equipe-acces/audit";

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/equipe/invitations/[id] — annule (token inutilisable). */
export async function DELETE(_request: Request, context: Ctx) {
  const gate = await requireEquipeAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { id } = await context.params;

  const inv = await prisma.invitation.findFirst({
    where: { id, invitedById: gate.ctx.ownerUserId },
  });
  if (!inv) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }
  if (inv.status !== "PENDING") {
    return NextResponse.json(
      { error: "Seule une invitation en attente peut être annulée." },
      { status: 400 },
    );
  }

  await prisma.invitation.update({
    where: { id },
    data: {
      status: "EXPIRED",
      // Invalide le token immédiatement
      token: `cancelled-${inv.id}-${Date.now()}`,
      expiresAt: new Date(0),
    },
  });

  await logAccessAction({
    organizationId: gate.ctx.organizationId,
    actorUserId: gate.ctx.actorId,
    action: "INVITE_CANCELLED",
    detail: JSON.stringify({ email: inv.email, invitationId: id }),
  });

  return NextResponse.json({ ok: true });
}
