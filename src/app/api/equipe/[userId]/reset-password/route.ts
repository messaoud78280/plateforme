import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isUserInTenant, requireEquipeAdmin } from "@/lib/equipe-acces/admin";
import { logAccessAction } from "@/lib/equipe-acces/audit";

type Ctx = { params: Promise<{ userId: string }> };

/** POST — génère un mot de passe temporaire (affiché une seule fois). */
export async function POST(_request: Request, context: Ctx) {
  const gate = await requireEquipeAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { userId } = await context.params;
  if (!(await isUserInTenant(gate.ctx, userId))) {
    return NextResponse.json({ error: "Utilisateur hors périmètre" }, { status: 404 });
  }

  try {
    const temporaryPassword = crypto.randomBytes(12).toString("base64url").slice(0, 16);
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        mustChangePassword: true,
      },
    });
    await logAccessAction({
      organizationId: gate.ctx.organizationId,
      actorUserId: gate.ctx.actorId,
      targetUserId: userId,
      action: "PASSWORD_RESET",
    });
    return NextResponse.json({
      temporaryPassword,
      message:
        "Mot de passe temporaire généré. Copiez-le maintenant — il ne sera plus réaffiché.",
    });
  } catch (e) {
    console.error("POST reset-password", e);
    return NextResponse.json({ error: "Erreur réinitialisation" }, { status: 500 });
  }
}
