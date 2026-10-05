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
import { computeVisitContextVersion } from "@/lib/bework-context/visit-context-version";
import { visitRowToVersionInput } from "@/lib/bework-patch/commit/visit-ops";
import { computeFollowUpContextVersion } from "@/lib/bework-context/follow-up-context-version";
import { sheetToVersionInput } from "@/lib/bework-patch/commit/follow-up-ops";
import { computeReportContextVersion } from "@/lib/bework-context/report-context-version";
import { docToVersionInput } from "@/lib/bework-patch/commit/report-ops";
import {
  computeNoticeContextVersion,
  noticeDocToVersionInput,
} from "@/lib/bework-patch/commit/notice-ops";
import { resolveCurrentSchedulePlan } from "@/lib/chantier/resolve-workspace-entities";
import { normalizeDependsOnJson } from "@/lib/bework-patch/operation-contracts";

function asIso(dte: Date | null | undefined): string | null {
  if (!dte) return null;
  return dte.toISOString().slice(0, 10);
}

export async function loadImpactSubgraph(input: {
  orgId: string;
  projectId?: string | null;
  patch: BeworkPatchV1;
}): Promise<ImpactSubgraph> {
  const projectId = input.projectId?.trim() || "";
  const graph = emptySubgraph(projectId);
  const section = input.patch.origin.section;

  if (section === "VISIT") {
    const visitId = input.patch.origin.entity_id;
    const visit = await prisma.siteVisit.findFirst({
      where: {
        id: visitId,
        organizationId: input.orgId,
      },
      select: {
        id: true,
        projectId: true,
        subject: true,
        status: true,
        clientName: true,
        siteAddress: true,
        clientNeed: true,
        comments: true,
        measurements: {
          select: {
            id: true,
            zone: true,
            label: true,
            measureType: true,
            unit: true,
            lengthM: true,
            widthM: true,
            heightM: true,
            quantityValue: true,
            computedQuantity: true,
            lot: true,
            observation: true,
          },
        },
        medias: {
          select: {
            id: true,
            name: true,
            kind: true,
            category: true,
            observation: true,
            fileUrl: true,
            storagePath: true,
          },
        },
      },
    });
    if (
      visit &&
      (!projectId || !visit.projectId || visit.projectId === projectId)
    ) {
      const contextVersion = computeVisitContextVersion(
        visitRowToVersionInput(visit),
      );
      graph.visit = {
        id: visit.id,
        projectId: visit.projectId,
        subject: visit.subject,
        status: visit.status,
        clientName: visit.clientName,
        siteAddress: visit.siteAddress,
        clientNeed: visit.clientNeed,
        comments: visit.comments,
        contextVersion,
      };
    }
    return graph;
  }

  const project = projectId
    ? await prisma.project.findFirst({
        where: { id: projectId, organizationId: input.orgId },
        select: { id: true },
      })
    : null;
  if (!project) return graph;

  let studyId: string | null = null;
  let quoteId: string | null = null;
  let planId: string | null = null;

  if (section === "TAKEOFF") {
    studyId = input.patch.origin.entity_id;
  } else if (section === "QUOTE") {
    quoteId = input.patch.origin.entity_id;
  } else if (section === "PLANNING") {
    planId = input.patch.origin.entity_id;
  } else if (section === "FOLLOW_UP") {
    const sheetId = input.patch.origin.entity_id;
    const sheet = await prisma.followUpSheet.findFirst({
      where: {
        id: sheetId,
        organizationId: input.orgId,
        projectId,
      },
      select: {
        id: true,
        projectId: true,
        title: true,
        status: true,
        notes: true,
        prepSchedulePlanId: true,
      },
    });
    if (sheet) {
      graph.followUp = {
        id: sheet.id,
        projectId: sheet.projectId,
        title: sheet.title,
        status: sheet.status,
        notes: sheet.notes,
        prepSchedulePlanId: sheet.prepSchedulePlanId,
        contextVersion: computeFollowUpContextVersion(
          sheetToVersionInput(sheet),
        ),
      };
    }
    return graph;
  } else if (section === "REPORT") {
    const documentId = input.patch.origin.entity_id;
    const doc = await prisma.siteDocument.findFirst({
      where: {
        id: documentId,
        organizationId: input.orgId,
        projectId,
        kind: "COMPTE_RENDU",
      },
      select: {
        id: true,
        projectId: true,
        kind: true,
        title: true,
        status: true,
        quickNotes: true,
        payloadJson: true,
      },
    });
    if (doc) {
      graph.report = {
        id: doc.id,
        projectId: doc.projectId,
        kind: doc.kind,
        title: doc.title,
        status: doc.status,
        quickNotes: doc.quickNotes,
        payloadJson: doc.payloadJson,
        contextVersion: computeReportContextVersion(docToVersionInput(doc)),
      };
    }
    return graph;
  } else if (section === "NOTICE") {
    const documentId = input.patch.origin.entity_id;
    const doc = await prisma.siteDocument.findFirst({
      where: {
        id: documentId,
        organizationId: input.orgId,
        projectId,
        kind: "NOTICE",
      },
      select: {
        id: true,
        projectId: true,
        kind: true,
        title: true,
        status: true,
        quickNotes: true,
        payloadJson: true,
      },
    });
    if (doc) {
      graph.notice = {
        id: doc.id,
        projectId: doc.projectId,
        kind: doc.kind,
        title: doc.title,
        status: doc.status,
        quickNotes: doc.quickNotes,
        payloadJson: doc.payloadJson,
        contextVersion: computeNoticeContextVersion(
          noticeDocToVersionInput(doc),
        ),
      };
    }
    return graph;
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
        projectId,
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
        projectId,
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
            provenance: true,
            note: true,
            sourceRef: true,
            hypothesisId: true,
          },
        },
        lines: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true,
            code: true,
            lot: true,
            designation: true,
            description: true,
            unit: true,
            formula: true,
            declaredQuantity: true,
            computedQuantity: true,
            validatedQuantity: true,
            provenance: true,
            role: true,
            nature: true,
            notes: true,
            includedServicesJson: true,
            technicalReferencesJson: true,
            executionNotes: true,
            qualityControlsJson: true,
            technicalReservationsJson: true,
            textsUserEdited: true,
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
          provenance: p.provenance,
          note: p.note,
          sourceRef: p.sourceRef,
          hypothesisId: p.hypothesisId,
        })),
        lines: study.lines.map((l) => {
          const asList = (v: unknown): string[] =>
            Array.isArray(v)
              ? v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean)
              : [];
          const asRefs = (v: unknown) => {
            if (!Array.isArray(v)) return [] as Array<{
              label: string;
              kind: string;
              note: string | null;
            }>;
            const out: Array<{ label: string; kind: string; note: string | null }> = [];
            for (const item of v) {
              if (!item || typeof item !== "object") continue;
              const o = item as Record<string, unknown>;
              const label = typeof o.label === "string" ? o.label.trim() : "";
              if (!label) continue;
              out.push({
                label,
                kind: typeof o.kind === "string" ? o.kind : "INDICATIVE",
                note: typeof o.note === "string" ? o.note : null,
              });
            }
            return out;
          };
          return {
            id: l.id,
            code: l.code,
            lot: l.lot,
            designation: l.designation,
            description: l.description,
            unit: l.unit,
            formula: l.formula,
            declaredQuantity: l.declaredQuantity != null ? d(l.declaredQuantity) : null,
            computedQuantity: l.computedQuantity != null ? d(l.computedQuantity) : null,
            validatedQuantity: l.validatedQuantity != null ? d(l.validatedQuantity) : null,
            provenance: l.provenance,
            role: l.role,
            nature: l.nature,
            notes: l.notes,
            includedServices: asList(l.includedServicesJson),
            technicalReferences: asRefs(l.technicalReferencesJson),
            executionNotes: l.executionNotes,
            qualityControls: asList(l.qualityControlsJson),
            technicalReservations: asList(l.technicalReservationsJson),
            textsUserEdited: l.textsUserEdited,
          };
        }),
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
          OR: [{ projectId }, { projectId: null }],
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

    // Plans liés à l’étude — cible explicite (origin.entity_id) ou CURRENT canonique.
    // Jamais « les 5 plus récents par createdAt » pour fingerprint / impact.
    const planSelect = {
      id: true,
      title: true,
      startDate: true,
      endDateBase: true,
      baseDurationWorkingDays: true,
      revisionNumber: true,
      studyVersionAtGeneration: true,
      status: true,
      revisionKind: true,
      scopeId: true,
      studyId: true,
      createdAt: true,
      tasks: {
        orderBy: { sortOrder: "asc" as const },
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
    };

    let plans: Array<{
      id: string;
      title: string;
      startDate: Date | null;
      endDateBase: Date | null;
      baseDurationWorkingDays: unknown;
      revisionNumber: number;
      studyVersionAtGeneration: number | null;
      status: string;
      revisionKind: string;
      scopeId: string | null;
      studyId: string;
      createdAt: Date;
      tasks: Array<{
        id: string;
        stepCode: string;
        name: string;
        description: string | null;
        durationDays: unknown;
        durationMode: string;
        durationLockedByUser: boolean;
        driverTakeoffCode: string | null;
        quantitySnapshot: unknown;
        quantityUnit: string | null;
        rateValue: unknown;
        parallelUnits: number;
        startDate: Date | null;
        endDate: Date | null;
        lot: string | null;
        dependsOnJson: unknown;
        takeoffLinks: Array<{ taskId: string; studyLineCode: string }>;
      }>;
    }> = [];

    if (planId) {
      const exact = await prisma.prepSchedulePlan.findFirst({
        where: {
          id: planId,
          organizationId: input.orgId,
          projectId,
          studyId,
        },
        select: planSelect,
      });
      if (exact) plans = [exact];
    } else {
      const candidates = await prisma.prepSchedulePlan.findMany({
        where: {
          organizationId: input.orgId,
          projectId,
          studyId,
        },
        select: planSelect,
      });
      const current = resolveCurrentSchedulePlan(candidates);
      if (current) plans = [current];
    }

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
        const dependsOnStepCodes = normalizeDependsOnJson(t.dependsOnJson).map(
          (d) => d.step_id,
        );
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
        projectId,
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
            dependsOnStepCodes: normalizeDependsOnJson(t.dependsOnJson).map(
              (dep) => dep.step_id,
            ),
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
