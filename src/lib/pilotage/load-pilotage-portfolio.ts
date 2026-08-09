/**
 * PILOTAGE-V2A — Vue direction multi-chantiers.
 * Source de vérité : Project (pas WorksitePilotage obligatoire).
 * Enrichissement optionnel si un suivi contractuel existe.
 * Pas de loadChantierCockpitOps × N.
 */
import { prisma } from "@/lib/prisma";
import {
  loadProjectsPortfolio,
  type PortfolioProjectRow,
  type ProjectsPortfolioResult,
} from "@/lib/chantier/portfolio";
import { withPerfLog } from "@/lib/perf/server-timing";
import { isVisaPending, isOverdue, startOfDay, addDays } from "@/lib/pilotage/calculations";

export type PilotageContractSignals = {
  pilotageId: string;
  criticalBlockers: number;
  openBlockers: number;
  visasPending: number;
  doeAtRisk: boolean;
};

export type PilotagePortfolioRow = PortfolioProjectRow & {
  contract: PilotageContractSignals | null;
  /** Signal principal lisible pour la liste */
  primarySignal: string | null;
  weekDeadline: boolean;
};

export type PilotagePortfolioSummary = {
  chantiers: number;
  withAttention: number;
  weekDeadlines: number;
  deliveriesToConfirm: number;
  criticalBlockers: number;
  visasPending: number;
  doeAtRisk: number;
  attentionItems: number;
};

export type PilotagePortfolioResult = {
  rows: PilotagePortfolioRow[];
  summary: PilotagePortfolioSummary;
  base: ProjectsPortfolioResult;
};

function primarySignalFor(row: PortfolioProjectRow, contract: PilotageContractSignals | null): string | null {
  if (contract && contract.criticalBlockers > 0) {
    return `${contract.criticalBlockers} blocage${contract.criticalBlockers > 1 ? "s" : ""} critique${contract.criticalBlockers > 1 ? "s" : ""}`;
  }
  if (row.primaryAttentionReason) return row.primaryAttentionReason;
  if (row.attentionLabel) return row.attentionLabel;
  if (row.nextDelivery?.phase === "requested" || row.nextDelivery?.phase === "proposed") {
    return `${row.nextDelivery.supplierName} — ${row.nextDelivery.statusHint}`;
  }
  if (row.overdueTasks > 0) {
    return `${row.overdueTasks} tâche${row.overdueTasks > 1 ? "s" : ""} en retard`;
  }
  if (contract && contract.visasPending > 0) {
    return `${contract.visasPending} visa${contract.visasPending > 1 ? "s" : ""} en attente`;
  }
  if (contract?.doeAtRisk) return "DOE à compléter";
  if (row.nextEvent) return `Échéance · ${row.nextEvent.title}`;
  return null;
}

export async function loadPilotagePortfolio(opts: {
  user: {
    id: string;
    role?: string | null;
    personType?: string | null;
    permissionProfile?: string | null;
  };
  whereProject: Record<string, unknown>;
  search?: string;
}): Promise<PilotagePortfolioResult> {
  return withPerfLog("loadPilotagePortfolio", async () => {
    const base = await loadProjectsPortfolio({
      user: opts.user,
      whereProject: opts.whereProject,
      search: opts.search,
      take: 80,
    });

    const projectIds = base.rows.map((r) => r.id);
    const today = startOfDay(new Date());
    const weekEnd = addDays(today, 7);

    const pilotages = projectIds.length
      ? await prisma.worksitePilotage.findMany({
          where: {
            projectId: { in: projectIds },
            archivedAt: null,
          },
          select: {
            id: true,
            projectId: true,
            blockers: {
              where: { archivedAt: null, status: { in: ["Ouvert", "En cours"] } },
              select: { severity: true, status: true },
            },
            plans: {
              where: { archivedAt: null },
              select: { status: true, visaDueDate: true },
            },
            doeItems: {
              where: { archivedAt: null },
              select: { status: true },
            },
          },
        })
      : [];

    const contractByProject = new Map<string, PilotageContractSignals>();
    for (const p of pilotages) {
      const critical = p.blockers.filter((b) => b.severity === "Critique").length;
      const visas = p.plans.filter(
        (pl) => isVisaPending(pl.status) || isOverdue(pl.visaDueDate, pl.status),
      ).length;
      const doeAtRisk = p.doeItems.some(
        (d) => d.status !== "Conforme" && d.status !== "Non applicable",
      );
      contractByProject.set(p.projectId, {
        pilotageId: p.id,
        criticalBlockers: critical,
        openBlockers: p.blockers.length,
        visasPending: visas,
        doeAtRisk,
      });
    }

    const rows: PilotagePortfolioRow[] = base.rows.map((r) => {
      const contract = contractByProject.get(r.id) ?? null;
      const eventInWeek = Boolean(
        r.nextEvent &&
          new Date(r.nextEvent.startAt) >= today &&
          new Date(r.nextEvent.startAt) <= weekEnd,
      );
      const deliveryInWeek = Boolean(
        r.nextDelivery &&
          new Date(r.nextDelivery.at) >= today &&
          new Date(r.nextDelivery.at) <= weekEnd,
      );
      return {
        ...r,
        contract,
        primarySignal: primarySignalFor(r, contract),
        weekDeadline: eventInWeek || deliveryInWeek || r.overdueTasks > 0,
        // Deep-link cockpit chantier (pas le silo Pilotage)
        href: `/dashboard/projets/${r.id}`,
      };
    });

    // Priorité : critique contractuel → attention → score existant
    rows.sort((a, b) => {
      const ac = a.contract?.criticalBlockers ?? 0;
      const bc = b.contract?.criticalBlockers ?? 0;
      if (bc !== ac) return bc - ac;
      if (b.attentionScore !== a.attentionScore) return b.attentionScore - a.attentionScore;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    const weekDeadlines = rows.filter((r) => r.weekDeadline).length;
    const deliveriesToConfirm = rows.filter(
      (r) =>
        r.nextDelivery?.phase === "requested" || r.nextDelivery?.phase === "proposed",
    ).length;

    return {
      rows,
      base,
      summary: {
        chantiers: base.summary.total,
        withAttention: base.summary.withAttention,
        weekDeadlines,
        deliveriesToConfirm,
        criticalBlockers: rows.reduce((n, r) => n + (r.contract?.criticalBlockers ?? 0), 0),
        visasPending: rows.reduce((n, r) => n + (r.contract?.visasPending ?? 0), 0),
        doeAtRisk: rows.filter((r) => r.contract?.doeAtRisk).length,
        attentionItems: rows.reduce((n, r) => n + r.attentionCount, 0),
      },
    };
  });
}
