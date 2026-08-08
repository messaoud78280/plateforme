import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isUserInTenant, requireEquipeAdmin } from "@/lib/equipe-acces/admin";

type Ctx = { params: Promise<{ userId: string }> };

/** GET — journal d’accès pour un membre. */
export async function GET(_request: Request, context: Ctx) {
  const gate = await requireEquipeAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { userId } = await context.params;
  if (!(await isUserInTenant(gate.ctx, userId))) {
    return NextResponse.json({ error: "Utilisateur hors périmètre" }, { status: 404 });
  }

  try {
    const logs = await prisma.accessAuditLog.findMany({
      where: {
        OR: [
          { targetUserId: userId },
          {
            action: { in: ["INVITE_SENT", "INVITE_RESENT"] },
            organizationId: gate.ctx.organizationId,
            detail: { contains: userId },
          },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        actor: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json({ logs });
  } catch (e) {
    console.error("GET audit", e);
    return NextResponse.json({ error: "Erreur audit" }, { status: 500 });
  }
}
