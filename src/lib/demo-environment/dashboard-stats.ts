import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type DemoHomeStats = {
  urgentActions: number;
  ordersToValidate: number;
  lateDeliveries: number;
  deadlinesThisWeek: number;
  missingDocuments: number;
  projectsWithoutRecentCr: number;
  overdueTasks: number;
};

export type DemoHomeItem = {
  id: string;
  tone: "critical" | "watch" | "ok" | "info";
  title: string;
  subtitle?: string;
  href: string;
};

export type DemoHomeProject = {
  id: string;
  title: string;
  city: string | null;
  manager: string | null;
  status: string;
};

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfWeek(d = new Date()) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** KPIs et listes « Aujourd’hui » calculés sur les données fictives du tenant. */
export async function collectDemoHomeData(clientId: string): Promise<{
  stats: DemoHomeStats;
  inbox: DemoHomeItem[];
  projects: DemoHomeProject[];
  firstName: string;
}> {
  const today = startOfDay();
  const weekEnd = endOfWeek();

  const [tasks, docs, projects, user] = await Promise.all([
    prisma.task.findMany({
      where: { clientId, status: { not: TaskStatus.COMPLETE } },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        priority: true,
        desiredDate: true,
        project: { select: { id: true, title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 40,
    }),
    prisma.document.findMany({
      where: { clientId, status: "EN_ATTENTE" },
      select: { id: true, name: true, projectId: true },
      take: 10,
    }),
    prisma.project.findMany({
      where: { clientId },
      select: {
        id: true,
        title: true,
        siteCity: true,
        internalManager: true,
        chantierStatus: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
    prisma.user.findUnique({
      where: { id: clientId },
      select: { name: true },
    }),
  ]);

  const orders = tasks.filter((t) => (t.category ?? "").toLowerCase().includes("bon de commande"));
  const ordersToValidate = orders.filter((t) => t.status === TaskStatus.A_VALIDER).length;
  const lateDeliveries = orders.filter((t) => {
    if (!t.desiredDate) return false;
    return t.desiredDate < today && t.status !== TaskStatus.COMPLETE;
  }).length;

  const overdueTasks = tasks.filter((t) => {
    if (!t.desiredDate) return false;
    return t.desiredDate < today;
  }).length;

  const urgentActions = tasks.filter(
    (t) => t.priority === "URGENT" || t.priority === "PRIORITAIRE" || (t.desiredDate && t.desiredDate <= today),
  ).length;

  const deadlinesThisWeek = tasks.filter((t) => {
    if (!t.desiredDate) return false;
    return t.desiredDate >= today && t.desiredDate <= weekEnd;
  }).length;

  const missingDocuments = docs.length;

  // Chantier sans CR récent : tâche catégorie Compte rendu encore ouverte sur le projet
  const crOpenProjectIds = new Set(
    tasks
      .filter((t) => (t.category ?? "").toLowerCase().includes("compte rendu"))
      .map((t) => t.project?.id)
      .filter(Boolean) as string[],
  );
  const projectsWithoutRecentCr = crOpenProjectIds.size;

  const inbox: DemoHomeItem[] = [];

  for (const t of orders.filter((x) => x.status === TaskStatus.A_VALIDER).slice(0, 3)) {
    inbox.push({
      id: t.id,
      tone: "critical",
      title: t.title,
      subtitle: t.project?.title ?? "Bon de commande",
      href: `/dashboard/taches/${t.id}`,
    });
  }

  for (const t of tasks.filter((x) => x.desiredDate && x.desiredDate < today).slice(0, 3)) {
    if (inbox.some((i) => i.id === t.id)) continue;
    inbox.push({
      id: t.id,
      tone: "watch",
      title: t.title,
      subtitle: "Échéance dépassée",
      href: `/dashboard/taches/${t.id}`,
    });
  }

  for (const d of docs.slice(0, 2)) {
    inbox.push({
      id: d.id,
      tone: "watch",
      title: d.name,
      subtitle: "Document manquant",
      href: "/dashboard/documents",
    });
  }

  for (const t of tasks.filter((x) => (x.category ?? "").toLowerCase().includes("compte rendu")).slice(0, 1)) {
    if (inbox.some((i) => i.id === t.id)) continue;
    inbox.push({
      id: `cr-${t.id}`,
      tone: "info",
      title: t.title,
      subtitle: t.project?.title ?? "Compte rendu",
      href: t.project ? `/dashboard/projets/${t.project.id}` : "/dashboard/taches",
    });
  }

  const firstName = (user?.name ?? "vous").split(" ")[0] || "vous";

  return {
    stats: {
      urgentActions,
      ordersToValidate,
      lateDeliveries,
      deadlinesThisWeek,
      missingDocuments,
      projectsWithoutRecentCr,
      overdueTasks,
    },
    inbox: inbox.slice(0, 6),
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      city: p.siteCity,
      manager: p.internalManager,
      status: p.chantierStatus,
    })),
    firstName,
  };
}
