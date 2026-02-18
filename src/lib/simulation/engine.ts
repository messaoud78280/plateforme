/**
 * Moteur d'exécution des événements de simulation
 * Exécute les événements d'un jour et met à jour la base via Prisma
 */

import { prisma } from "@/lib/prisma";
import { SIMULATION_TIMELINE, getSimulationDate } from "./timeline";

interface SimulationContext {
  projectId: string;
  clientId: string;
  managerId: string;
  agentId: string;
}

export async function getSimulationContext(): Promise<SimulationContext | null> {
  const sophie = await prisma.user.findFirst({
    where: { email: "sophie.mercier@bellevie-cosmetiques.fr" },
  });
  const laure = await prisma.user.findFirst({
    where: { email: "laure.olivie@iatask.fr" },
  });
  const amina = await prisma.user.findFirst({
    where: { email: "amina@taskflow-solutions.com" },
  });
  const project = await prisma.project.findFirst({
    where: { title: { contains: "BelleVie" } },
  });
  if (!sophie || !laure || !amina || !project) return null;
  return {
    projectId: project.id,
    clientId: sophie.id,
    managerId: laure.id,
    agentId: amina.id,
  };
}

function resolveUserId(role: string, ctx: SimulationContext): string {
  if (role === "client") return ctx.clientId;
  if (role === "manager") return ctx.managerId;
  if (role === "agent") return ctx.agentId;
  return ctx.agentId;
}

export async function executeDayEvents(
  day: number,
  ctx: SimulationContext
): Promise<{ executed: number; errors: string[] }> {
  const dayData = SIMULATION_TIMELINE.find((d) => d.day === day);
  if (!dayData || dayData.events.length === 0) {
    return { executed: 0, errors: [] };
  }

  const errors: string[] = [];
  let executed = 0;
  const baseDate = getSimulationDate(day);

  for (const evt of dayData.events) {
    try {
      const [h, m] = evt.time.split(":").map(Number);
      const eventDate = new Date(baseDate);
      eventDate.setHours(h, m, 0, 0);

      if (evt.type === "message") {
        const from = resolveUserId((evt.data.from as string) ?? "agent", ctx);
        const to = resolveUserId((evt.data.to as string) ?? "client", ctx);
        await prisma.message.create({
          data: {
            content: (evt.data.content as string) ?? "",
            projectId: ctx.projectId,
            senderId: from,
            receiverId: to,
            read: false,
          },
        });
        // Alerte pour le destinataire
        await prisma.alert.create({
          data: {
            title: "Nouveau message",
            message: "Vous avez reçu un message sur le projet BelleVie.",
            level: "WARNING",
            clientId: to,
            actionUrl: `/dashboard/projets/${ctx.projectId}`,
          },
        });
      } else if (evt.type === "task") {
        const title = evt.data.title as string;
        const status = (evt.data.status as string) ?? "EN_COURS";
        const assignedTo = evt.data.assignedTo === "agent" ? ctx.agentId : null;
        await prisma.task.create({
          data: {
            title,
            status: status as "EN_ATTENTE" | "EN_COURS" | "COMPLETE",
            clientId: ctx.clientId,
            projectId: ctx.projectId,
            assignedToId: assignedTo,
            ...(status === "COMPLETE" && { completedAt: eventDate }),
          },
        });
      } else if (evt.type === "activity") {
        await prisma.activity.create({
          data: {
            type: (evt.data.type as string) ?? "EVENT",
            title: (evt.data.title as string) ?? "Événement",
            detail: evt.data.detail as string | null,
            clientId: ctx.clientId,
            projectId: ctx.projectId,
            metadata: evt.data ? (evt.data as object) : undefined,
          },
        });
      } else if (evt.type === "metric") {
        await prisma.metric.create({
          data: {
            projectId: ctx.projectId,
            metricDate: eventDate,
            metricType: (evt.data.metricType as string) ?? "general",
            metricData: (evt.data.metricData as object) ?? {},
          },
        });
      } else if (evt.type === "invoice") {
        const issueDate = new Date(baseDate);
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + 15);
        await prisma.invoice.create({
          data: {
            projectId: ctx.projectId,
            invoiceNumber: (evt.data.invoiceNumber as string) ?? `INV-${Date.now()}`,
            amount: (evt.data.amount as number) ?? 850,
            status: (evt.data.status as "DRAFT" | "SENT" | "PAID" | "CANCELLED") ?? "SENT",
            issueDate,
            dueDate,
          },
        });
      }
      executed++;
    } catch (e) {
      errors.push(`${evt.type} ${evt.time}: ${(e as Error).message}`);
    }
  }

  return { executed, errors };
}
