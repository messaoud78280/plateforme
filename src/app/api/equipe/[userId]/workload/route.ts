import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isUserInTenant, requireEquipeAdmin } from "@/lib/equipe-acces/admin";

type Ctx = { params: Promise<{ userId: string }> };

/** GET — charge ouverte avant désactivation (tâches, commandes, agenda). */
export async function GET(_request: Request, context: Ctx) {
  const gate = await requireEquipeAdmin();
  if (!gate.ok) {
    return NextResponse.json({ error: gate.error }, { status: gate.status });
  }
  const { userId } = await context.params;
  if (!(await isUserInTenant(gate.ctx, userId))) {
    return NextResponse.json({ error: "Utilisateur hors périmètre" }, { status: 404 });
  }

  const now = new Date();
  const [tasks, orders, events] = await Promise.all([
    prisma.task.count({
      where: {
        assignedToId: userId,
        status: { not: "COMPLETE" },
      },
    }),
    prisma.purchaseOrder.count({
      where: {
        responsibleId: userId,
        status: { notIn: ["ANNULEE", "CLOTUREE", "RECUE", "REFUSEE"] },
      },
    }),
    prisma.agendaEvent.count({
      where: {
        OR: [
          { responsibleId: userId },
          { attendees: { some: { userId } } },
        ],
        startAt: { gte: now },
        status: { not: "ANNULE" },
      },
    }),
  ]);

  return NextResponse.json({
    tasks,
    orders,
    events,
    total: tasks + orders + events,
  });
}
