import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isUserInTenant, requireEquipeAdmin } from "@/lib/equipe-acces/admin";
import { logAccessAction } from "@/lib/equipe-acces/audit";

type Ctx = { params: Promise<{ userId: string }> };

/**
 * POST — réaffecte tâches / commandes / événements futurs.
 * Body: { toUserId, tasks?, orders?, events? }
 */
export async function POST(request: Request, context: Ctx) {
  const gate = await requireEquipeAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { userId: fromUserId } = await context.params;
  if (!(await isUserInTenant(gate.ctx, fromUserId))) {
    return NextResponse.json({ error: "Utilisateur hors périmètre" }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const toUserId = typeof body.toUserId === "string" ? body.toUserId : "";
  if (!toUserId || toUserId === fromUserId) {
    return NextResponse.json({ error: "Destinataire de réaffectation requis" }, { status: 400 });
  }
  if (!(await isUserInTenant(gate.ctx, toUserId))) {
    return NextResponse.json({ error: "Destinataire hors périmètre" }, { status: 400 });
  }

  const doTasks = body.tasks !== false;
  const doOrders = body.orders !== false;
  const doEvents = body.events !== false;
  const now = new Date();
  const result = { tasks: 0, orders: 0, events: 0 };

  if (doTasks) {
    const r = await prisma.task.updateMany({
      where: {
        assignedToId: fromUserId,
        status: { not: "COMPLETE" },
      },
      data: { assignedToId: toUserId },
    });
    result.tasks = r.count;
  }
  if (doOrders) {
    const r = await prisma.purchaseOrder.updateMany({
      where: {
        responsibleId: fromUserId,
        status: { notIn: ["ANNULEE", "CLOTUREE", "RECUE", "REFUSEE"] },
      },
      data: { responsibleId: toUserId },
    });
    result.orders = r.count;
  }
  if (doEvents) {
    const r = await prisma.agendaEvent.updateMany({
      where: {
        responsibleId: fromUserId,
        startAt: { gte: now },
        status: { not: "ANNULE" },
      },
      data: { responsibleId: toUserId },
    });
    result.events = r.count;
  }

  await logAccessAction({
    organizationId: gate.ctx.organizationId,
    actorUserId: gate.ctx.actorId,
    targetUserId: fromUserId,
    action: "USER_REASSIGNED",
    detail: JSON.stringify({ toUserId, ...result }),
  });

  return NextResponse.json({ ok: true, ...result });
}
