import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDemoEmail } from "@/lib/demo-environment/constants";
import { resolveDemoAccessForUser } from "@/lib/demo-environment/access";
import { nextBcStatus } from "@/lib/demo-environment/bon-commande";
import type { TaskStatus } from "@/types";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!session.user.isDemo && !isDemoEmail(session.user.email)) {
    return NextResponse.json({ error: "Réservé à la démonstration" }, { status: 403 });
  }

  const access = await resolveDemoAccessForUser(session.user.id);
  if (!access.ok) {
    return NextResponse.json({ error: "Démonstration inactive" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const task = await prisma.task.findUnique({
    where: { id },
    select: {
      id: true,
      clientId: true,
      status: true,
      category: true,
      organizationId: true,
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  if (task.clientId !== access.demo.rootUserId) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (!(task.category ?? "").toLowerCase().includes("bon de commande")) {
    return NextResponse.json({ error: "Ce n’est pas un bon de commande" }, { status: 400 });
  }

  const next = nextBcStatus(task.status as TaskStatus);
  if (!next) {
    return NextResponse.json({ error: "Workflow terminé" }, { status: 400 });
  }

  const updated = await prisma.task.update({
    where: { id },
    data: {
      status: next,
      ...(next === "COMPLETE" ? { completedAt: new Date() } : {}),
    },
    select: { id: true, status: true },
  });

  return NextResponse.json({ ok: true, task: updated });
}
