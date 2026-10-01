/**
 * Charge le sous-graphe d’impact (liens directs uniquement) — lecture seule.
 */
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import {
  emptySubgraph,
  type ImpactSubgraph,
} from "@/lib/bework-patch/impact/types";

function asIso(dte: Date | null | undefined): string | null {
  if (!dte) return null;
  return dte.toISOString().slice(0, 10);
}

export async function loadImpactSubgraph(input: {
  orgId: string;
  projectId: string;
  patch: BeworkPatchV1;
}): Promise<ImpactSubgraph> {
  const graph = emptySubgraph(input.projectId);
  const project = await prisma.project.findFirst({
    where: { id: input.projectId, organizationId: input.orgId },
    select: { id: true },
  });
  if (!project) return graph;

  const section = input.patch.origin.section;
  let studyId: string | null = null;
  let quoteId: string | null = null;
  let planId: string | null = null;

  if (section === "TAKEOFF") {
    studyId = input.patch.origin.entity_id;
  } else if (section === "QUOTE") {
    quoteId = input.patch.origin.entity_id;
  } else if (section === "PLANNING") {
    planId = input.patch.origin.entity_id;
  } else {
    return graph;
  }

  // Résoudre studyId depuis devis / plan
  if (!studyId && quoteId) {
    const link = await prisma.prepQuoteLink.findFirst({
      where: { organizationId: input.orgId, quoteId },
      select: { studyId: true },
    });
    studyId = link?.studyId ?? null;
    if (!studyId) {
      const q = await prisma.commercialQuote.findFirst({
        where: { id: quoteId, organizationId: input.orgId },
        select: { sourcePrepStudyId: true },
      });
      studyId = q?.sourcePrepStudyId ?? null;
    }
  }
  if (!studyId && planId) {
    const plan = await prisma.prepSchedulePlan.findFirst({
      where: {
        id: planId,
        organizationId: input.orgId,
        projectId: input.projectId,
      },
      select: { studyId: true },
    });
    studyId = plan?.studyId ?? null;
  }

  if (studyId) {
    const study = await prisma.prepStudy.findFirst({
      where: {
        id: studyId,
        organizationId: input.orgId,
        projectId: input.projectId,
        archivedAt: null,
      },
      select: {
        id: true,
        title: true,
        version: true,
        parameters: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            key: true,
            label: true,
            unit: true,
            value: true,
            formula: true,
          },
        },
        lines: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            code: true,
            designation: true,
            unit: true,
            formula: true,
            declaredQuantity: true,
            role: true,
          },
        },
      },
    });
    if (study) {
      graph.study = {
        id: study.id,
        title: study.title,
        version: study.version,
        params: study.parameters.map((p) => ({
          id: p.id,
          key: p.key,
          label: p.label,
          value: p.value != null ? d(p.value) : null,
          unit: p.unit,
          formula: p.formula,
        })),
        lines: study.lines.map((l) => ({
          id: l.id,
          code: l.code,
          designation: l.designation,
          unit: l.unit,
          formula: l.formula,
          declaredQuantity: l.declaredQuantity != null ? d(l.declaredQuantity) : null,
          role: l.role,
        })),
      };
    }
  }

  // Liens devis de l’étude (sous-graphe)
  if (studyId) {
    const links = await prisma.prepQuoteLink.findMany({
      where: { organizationId: input.orgId, studyId },
      select: {
        id: true,
        studyId: true,
        studyLineCode: true,
        quoteId: true,
        quoteLineId: true,
        quantityAtTransfer: true,
      },
    });
    graph.quoteLinks = links.map((l) => ({
      id: l.id,
      studyId: l.studyId,
      studyLineCode: l.studyLineCode,
      quoteId: l.quoteId,
      quoteLineId: l.quoteLineId,
      quantityAtTransfer: d(l.quantityAtTransfer),
    }));

    const quoteIds = [...new Set(links.map((l) => l.quoteId))];
    if (quoteId && !quoteIds.includes(quoteId)) quoteIds.push(quoteId);

    if (quoteIds.length) {
      const quotes = await prisma.commercialQuote.findMany({
        where: {
          organizationId: input.orgId,
          id: { in: quoteIds },
          OR: [{ projectId: input.projectId }, { projectId: null }],
        },
        select: {
          id: true,
          number: true,
          status: true,
          currentVersion: {
            select: {
              id: true,
              versionNumber: true,
              lines: {
                select: {
                  id: true,
                  designation: true,
                  quantity: true,
                  unit: true,
                  unitSellHt: true,
                  discountPercent: true,
                  vatRate: true,
                  kind: true,
                },
              },
            },
          },
        },
      });
      graph.quotes = quotes.map((q) => ({
        id: q.id,
        number: q.number,
        status: q.status,
        versionNumber: q.currentVersion?.versionNumber ?? 1,
        versionId: q.currentVersion?.id ?? "",
        lines: (q.currentVersion?.lines ?? []).map((l) => ({
          id: l.id,
          designation: l.designation,
          quantity: d(l.quantity),
          unit: l.unit,
          unitSellHt: d(l.unitSellHt),
          discountPercent: d(l.discountPercent),
          vatRate: d(l.vatRate),
          kind: l.kind,
        })),
      }));
    }

    // Plans liés à l’étude
    const plans = await prisma.prepSchedulePlan.findMany({
      where: {
        organizationId: input.orgId,
        projectId: input.projectId,
        studyId,
        ...(planId ? { id: planId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: planId ? 1 : 5,
      select: {
        id: true,
        title: true,
        startDate: true,
        endDateBase: true,
        baseDurationWorkingDays: true,
        revisionNumber: true,
        studyVersionAtGeneration: true,
        tasks: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            stepCode: true,
            name: true,
            description: true,
            durationDays: true,
            durationMode: true,
            durationLockedByUser: true,
            driverTakeoffCode: true,
            quantitySnapshot: true,
            quantityUnit: true,
            rateValue: true,
            parallelUnits: true,
            startDate: true,
            endDate: true,
            lot: true,
            dependsOnJson: true,
            takeoffLinks: {
              select: { taskId: true, studyLineCode: true },
            },
          },
        },
      },
    });

    graph.plans = plans.map((p) => ({
      id: p.id,
      title: p.title,
      startDate: asIso(p.startDate),
      endDateBase: asIso(p.endDateBase),
      baseDurationWorkingDays:
        p.baseDurationWorkingDays != null ? d(p.baseDurationWorkingDays) : null,
      revisionNumber: p.revisionNumber,
      studyVersionAtGeneration: p.studyVersionAtGeneration,
      tasks: p.tasks.map((t) => {
        const depsRaw = Array.isArray(t.dependsOnJson) ? t.dependsOnJson : [];
        const dependsOnStepCodes = depsRaw
          .map((x) =>
            x && typeof x === "object" && "stepId" in x
              ? String((x as { stepId: string }).stepId)
              : null,
          )
          .filter((x): x is string => !!x);
        return {
          id: t.id,
          stepCode: t.stepCode,
          name: t.name,
          description: t.description,
          durationDays: d(t.durationDays),
          durationMode: t.durationMode,
          durationLockedByUser: t.durationLockedByUser,
          driverTakeoffCode: t.driverTakeoffCode,
          quantitySnapshot:
            t.quantitySnapshot != null ? d(t.quantitySnapshot) : null,
          quantityUnit: t.quantityUnit,
          rateValue: t.rateValue != null ? d(t.rateValue) : null,
          parallelUnits: t.parallelUnits,
          startDate: asIso(t.startDate),
          endDate: asIso(t.endDate),
          dependsOnStepCodes,
          lot: t.lot,
        };
      }),
      takeoffLinks: p.tasks.flatMap((t) =>
        t.takeoffLinks.map((l) => ({
          taskId: l.taskId,
          studyLineCode: l.studyLineCode,
        })),
      ),
    }));
  } else if (quoteId) {
    // Devis sans étude — charger le devis seul
    const quote = await prisma.commercialQuote.findFirst({
      where: { id: quoteId, organizationId: input.orgId },
      select: {
        id: true,
        number: true,
        status: true,
        currentVersion: {
          select: {
            id: true,
            versionNumber: true,
            lines: {
              select: {
                id: true,
                designation: true,
                quantity: true,
                unit: true,
                unitSellHt: true,
                discountPercent: true,
                vatRate: true,
                kind: true,
              },
            },
          },
        },
      },
    });
    if (quote) {
      graph.quotes = [
        {
          id: quote.id,
          number: quote.number,
          status: quote.status,
          versionNumber: quote.currentVersion?.versionNumber ?? 1,
          versionId: quote.currentVersion?.id ?? "",
          lines: (quote.currentVersion?.lines ?? []).map((l) => ({
            id: l.id,
            designation: l.designation,
            quantity: d(l.quantity),
            unit: l.unit,
            unitSellHt: d(l.unitSellHt),
            discountPercent: d(l.discountPercent),
            vatRate: d(l.vatRate),
            kind: l.kind,
          })),
        },
      ];
    }
  } else if (planId) {
    const plan = await prisma.prepSchedulePlan.findFirst({
      where: {
        id: planId,
        organizationId: input.orgId,
        projectId: input.projectId,
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDateBase: true,
        baseDurationWorkingDays: true,
        revisionNumber: true,
        studyVersionAtGeneration: true,
        tasks: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            stepCode: true,
            name: true,
            description: true,
            durationDays: true,
            durationMode: true,
            durationLockedByUser: true,
            driverTakeoffCode: true,
            quantitySnapshot: true,
            quantityUnit: true,
            rateValue: true,
            parallelUnits: true,
            startDate: true,
            endDate: true,
            lot: true,
            dependsOnJson: true,
            takeoffLinks: { select: { taskId: true, studyLineCode: true } },
          },
        },
      },
    });
    if (plan) {
      graph.plans = [
        {
          id: plan.id,
          title: plan.title,
          startDate: asIso(plan.startDate),
          endDateBase: asIso(plan.endDateBase),
          baseDurationWorkingDays:
            plan.baseDurationWorkingDays != null
              ? d(plan.baseDurationWorkingDays)
              : null,
          revisionNumber: plan.revisionNumber,
          studyVersionAtGeneration: plan.studyVersionAtGeneration,
          tasks: plan.tasks.map((t) => ({
            id: t.id,
            stepCode: t.stepCode,
            name: t.name,
            description: t.description,
            durationDays: d(t.durationDays),
            durationMode: t.durationMode,
            durationLockedByUser: t.durationLockedByUser,
            driverTakeoffCode: t.driverTakeoffCode,
            quantitySnapshot:
              t.quantitySnapshot != null ? d(t.quantitySnapshot) : null,
            quantityUnit: t.quantityUnit,
            rateValue: t.rateValue != null ? d(t.rateValue) : null,
            parallelUnits: t.parallelUnits,
            startDate: asIso(t.startDate),
            endDate: asIso(t.endDate),
            dependsOnStepCodes: [],
            lot: t.lot,
          })),
          takeoffLinks: plan.tasks.flatMap((t) =>
            t.takeoffLinks.map((l) => ({
              taskId: l.taskId,
              studyLineCode: l.studyLineCode,
            })),
          ),
        },
      ];
    }
  }

  return graph;
}
