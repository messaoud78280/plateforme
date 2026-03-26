import { prisma } from "@/lib/prisma";

export type PeriodKey = "7d" | "30d" | "3m" | "6m" | "1y";

export function getPeriodBounds(period: PeriodKey): { start: Date; end: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  switch (period) {
    case "7d":
      start.setDate(start.getDate() - 6);
      break;
    case "30d":
      start.setDate(start.getDate() - 29);
      break;
    case "3m":
      start.setMonth(start.getMonth() - 2);
      break;
    case "6m":
      start.setMonth(start.getMonth() - 5);
      break;
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      break;
  }
  start.setHours(0, 0, 0, 0);
  return { start, end };
}

export interface ReportStats {
  period: PeriodKey;
  start: Date;
  end: Date;
  tasks: { total: number; completed: number; byStatus: Record<string, number> };
  documents: { total: number; byStatus: Record<string, number> };
  projects: { total: number };
  tempsMoyenJours: number;
  evolution: { date: string; label: string; creees: number; completees: number }[];
}

export async function getReportStats(
  userId: string,
  isAgence: boolean,
  period: PeriodKey
): Promise<ReportStats> {
  const whereClient = isAgence ? {} : { clientId: userId };
  const { start, end } = getPeriodBounds(period);

  const [tasksInPeriod, tasksCompletedInPeriod, documentsInPeriod, projectsInPeriod] = await Promise.all([
    prisma.task.findMany({
      where: { ...whereClient, createdAt: { gte: start, lte: end } },
      select: { id: true, status: true, createdAt: true, completedAt: true },
    }),
    prisma.task.findMany({
      where: { ...whereClient, status: "COMPLETE", completedAt: { gte: start, lte: end } },
      select: { createdAt: true, completedAt: true },
    }),
    prisma.document.findMany({
      where: { ...whereClient, createdAt: { gte: start, lte: end } },
      select: { id: true, status: true },
    }),
    prisma.project.findMany({
      where: { ...whereClient, createdAt: { gte: start, lte: end } },
      select: { id: true },
    }),
  ]);

  const byStatus = { EN_ATTENTE: 0, EN_COURS: 0, COMPLETE: 0 };
  tasksInPeriod.forEach((t) => {
    if (t.status in byStatus) byStatus[t.status as keyof typeof byStatus]++;
  });

  let tempsMoyenJours = 0;
  if (tasksCompletedInPeriod.length > 0) {
    const totalJours = tasksCompletedInPeriod.reduce((acc, t) => {
      if (!t.completedAt) return acc;
      return acc + (t.completedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    }, 0);
    tempsMoyenJours = totalJours / tasksCompletedInPeriod.length;
  }

  const nbDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const evolution: { date: string; label: string; creees: number; completees: number }[] = [];
  const step = period === "7d" ? 1 : period === "30d" ? 1 : period === "3m" || period === "6m" ? 7 : 14;
  for (let i = 0; i <= nbDays; i += step) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const endDay = new Date(d);
    endDay.setDate(endDay.getDate() + (step === 1 ? 1 : step));
    evolution.push({
      date: d.toISOString().slice(0, 10),
      label:
        step === 1
          ? d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })
          : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      creees: tasksInPeriod.filter((t) => t.createdAt >= d && t.createdAt < endDay).length,
      completees: tasksCompletedInPeriod.filter(
        (t) => t.completedAt && t.completedAt >= d && t.completedAt < endDay
      ).length,
    });
  }

  const docByStatus = { EN_ATTENTE: 0, EN_TRAITEMENT: 0, TRAITE: 0, ARCHIVE: 0 };
  documentsInPeriod.forEach((d) => {
    if (d.status in docByStatus) docByStatus[d.status as keyof typeof docByStatus]++;
  });

  return {
    period,
    start,
    end,
    tasks: {
      total: tasksInPeriod.length,
      completed: tasksCompletedInPeriod.length,
      byStatus,
    },
    documents: { total: documentsInPeriod.length, byStatus: docByStatus },
    projects: { total: projectsInPeriod.length },
    tempsMoyenJours: Math.round(tempsMoyenJours * 10) / 10,
    evolution,
  };
}
