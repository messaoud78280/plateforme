/**
 * Commit universel Phase E — une seule transaction Prisma.
 * Aucune écriture partielle. Journal BeworkUniversalPatch en fin de TX.
 */
import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNS } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { calculateLine, roundMoney } from "@/lib/commercial/money";
import { computeStudy } from "@/lib/preparation/engine/compute";
import { invalidateFinalValidationIfNeeded } from "@/lib/preparation/service";
import { parseBeworkPatch } from "@/lib/bework-patch/parse";
import { analyzePatchImpact } from "@/lib/bework-patch/impact/analyze-impact";
import { loadImpactSubgraph } from "@/lib/bework-patch/impact/load-subgraph";
import { evaluatePatchSourceProtection } from "@/lib/bework-patch/impact/source-protection";
import { simulatePlanFromQuantityMap } from "@/lib/bework-patch/impact/simulate-planning";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import type { AnalyzePatchImpactResult } from "@/lib/bework-patch/impact/types";
import {
  buildFingerprintPayload,
  collectVersionSnapshot,
  computePreviewFingerprint,
  type VersionSnapshot,
} from "@/lib/bework-patch/commit/fingerprint";
import {
  evaluateCommitEligibility,
  type SyncMode,
} from "@/lib/bework-patch/commit/eligibility";
import { applyPlanningDirectInTx } from "@/lib/bework-patch/commit/planning-ops";
import { applyVisitDirectInTx } from "@/lib/bework-patch/commit/visit-ops";
import { applyFollowUpDirectInTx } from "@/lib/bework-patch/commit/follow-up-ops";
import { applyReportDirectInTx } from "@/lib/bework-patch/commit/report-ops";
import { applyNoticeDirectInTx } from "@/lib/bework-patch/commit/notice-ops";
import {
  applySupplyDirectInTx,
  loadSupplyFingerprintSnapshot,
} from "@/lib/bework-patch/commit/supply-ops";

export type CommitUniversalResult =
  | {
      ok: true;
      syncMode: SyncMode;
      patchRecordId: string;
      versionsBefore: VersionSnapshot;
      versionsAfter: VersionSnapshot;
      summary: {
        takeoffUpdated: boolean;
        quoteUpdated: boolean;
        planningUpdated: boolean;
        visitUpdated: boolean;
        followUpUpdated: boolean;
        reportUpdated: boolean;
        noticeUpdated: boolean;
        supplyUpdated: boolean;
        quoteProtected: boolean;
      };
      impact: AnalyzePatchImpactResult;
    }
  | {
      ok: false;
      error: string;
      code: string;
      impact?: AnalyzePatchImpactResult;
    };

export async function commitUniversalPatch(input: {
  orgId: string;
  projectId?: string | null;
  userId: string | null;
  raw: unknown;
  /** Fingerprint du preview client — doit matcher le recalcul serveur. */
  previewFingerprint: string;
}): Promise<CommitUniversalResult> {
  const parsed = parseBeworkPatch(input.raw);
  if (!parsed.ok) {
    return {
      ok: false,
      error: parsed.errors[0]?.message ?? "Patch invalide",
      code: parsed.errors[0]?.code ?? "INVALID_JSON",
    };
  }
  const patch = parsed.patch;
  const inputProject = input.projectId?.trim() || null;
  const patchProject = patch.origin.project_id?.trim() || null;
  const visitStandalone = patch.origin.section === "VISIT";
  if (visitStandalone) {
    if (patchProject && inputProject && patchProject !== inputProject) {
      return {
        ok: false,
        error: "Le projet du patch ne correspond pas.",
        code: "PROJECT_MISMATCH",
      };
    }
  } else if (patchProject !== inputProject) {
    return {
      ok: false,
      error: "Le projet du patch ne correspond pas.",
      code: "PROJECT_MISMATCH",
    };
  }
  const resolvedProjectId = inputProject || patchProject || "";

  // Pré-check duplicate (UX)
  const existing = await prisma.beworkUniversalPatch.findUnique({
    where: {
      organizationId_patchId: {
        organizationId: input.orgId,
        patchId: patch.patch_id,
      },
    },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: false,
      error: "Ce patch a déjà été appliqué.",
      code: "DUPLICATE_PATCH",
    };
  }

  // Reload + re-analyze
  const subgraph = await loadImpactSubgraph({
    orgId: input.orgId,
    projectId: resolvedProjectId || null,
    patch,
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  const preferredPlanId =
    patch.origin.section === "PLANNING" ? patch.origin.entity_id : null;
  const versionsBefore = collectVersionSnapshot(subgraph, { preferredPlanId });

  const fpPayload = buildFingerprintPayload({
    patch,
    versions: versionsBefore,
    impact,
    subgraph,
  });
  const freshFp = computePreviewFingerprint(fpPayload);
  if (freshFp !== input.previewFingerprint) {
    return {
      ok: false,
      error:
        patch.origin.section === "PLANNING"
          ? "Le planning a été modifié depuis la génération de ce patch. Copiez un nouveau contexte et recommencez."
          : patch.origin.section === "VISIT"
            ? "La visite a été modifiée depuis la génération de ce patch. Copiez un nouveau contexte et recommencez."
            : patch.origin.section === "FOLLOW_UP"
              ? "Le suivi a été modifié depuis la génération de ce patch. Copiez un nouveau contexte et recommencez."
              : patch.origin.section === "REPORT"
                ? "Le compte rendu a été modifié depuis la génération de ce patch. Copiez un nouveau contexte et recommencez."
                : patch.origin.section === "NOTICE"
                  ? "La notice a été modifiée depuis la génération de ce patch. Analysez de nouveau les modifications avant de les appliquer."
                  : patch.origin.section === "SUPPLY"
                    ? "Les Approvisionnements ont changé depuis la génération de ce patch. Copiez un nouveau contexte et recommencez."
                    : "Les données ont changé depuis l’analyse. Veuillez relancer la prévisualisation.",
      code: "PREVIEW_STALE",
      impact,
    };
  }

  const eligibility = evaluateCommitEligibility({ patch, impact });
  if (!eligibility.ok) {
    return {
      ok: false,
      error: eligibility.reason,
      code: eligibility.code,
      impact,
    };
  }

  try {
    const result = await prisma.$transaction(
      async (tx) => {
      // Re-check duplicate inside TX
      const dup = await tx.beworkUniversalPatch.findUnique({
        where: {
          organizationId_patchId: {
            organizationId: input.orgId,
            patchId: patch.patch_id,
          },
        },
        select: { id: true },
      });
      if (dup) {
        throw Object.assign(new Error("DUPLICATE_PATCH"), { code: "DUPLICATE_PATCH" });
      }

      let takeoffUpdated = false;
      let quoteUpdated = false;
      let planningUpdated = false;
      let visitUpdated = false;
      let followUpUpdated = false;
      let reportUpdated = false;
      let noticeUpdated = false;
      let supplyUpdated = false;
      const quoteProtected = impact.protectedEntities.some((p) => p.section === "QUOTE");

      let studyId: string | null = subgraph.study?.id ?? null;
      let quoteId: string | null = subgraph.quotes[0]?.id ?? null;
      let planId: string | null =
        (patch.origin.section === "PLANNING"
          ? subgraph.plans.find((p) => p.id === patch.origin.entity_id)?.id
          : null) ??
        subgraph.plans[0]?.id ??
        null;
      let visitId: string | null = subgraph.visit?.id ?? null;
      let visitVersionAfter: number | null = null;
      let followUpId: string | null = subgraph.followUp?.id ?? null;
      let followUpVersionAfter: number | null = null;
      let reportId: string | null = subgraph.report?.id ?? null;
      let reportVersionAfter: number | null = null;
      let noticeId: string | null = subgraph.notice?.id ?? null;
      let noticeVersionAfter: number | null = null;
      let supplyVersionAfter: number | null = null;

      if (eligibility.mode === "SUPPLY_ONLY") {
        if (!subgraph.supply) {
          throw Object.assign(
            new Error("Approvisionnements introuvables dans le sous-graphe."),
            { code: "TARGET_NOT_FOUND" },
          );
        }
        if (!resolvedProjectId) {
          throw Object.assign(
            new Error("projectId requis pour le commit Approvisionnements."),
            { code: "INVALID_TARGET" },
          );
        }
        if (!input.userId) {
          throw Object.assign(
            new Error("Utilisateur requis pour le commit Approvisionnements."),
            { code: "UNAUTHORIZED" },
          );
        }
        const supplyProjectId = resolvedProjectId;
        const supplyUserId = input.userId;
        const applied = await applySupplyDirectInTx(tx, {
          orgId: input.orgId,
          projectId: supplyProjectId,
          userId: supplyUserId,
          patch,
          expectedVersion: subgraph.supply.contextVersion,
        });
        if (applied.purchaseOrdersCreated > 0) {
          throw Object.assign(
            new Error("Anomalie : SUPPLY a créé un PurchaseOrder — rollback."),
            { code: "SUPPLY_PO_FORBIDDEN" },
          );
        }
        supplyUpdated = applied.appliedOps.length > 0;
        supplyVersionAfter = await loadSupplyFingerprintSnapshot(tx, {
          orgId: input.orgId,
          projectId: supplyProjectId,
        });
      } else if (eligibility.mode === "NOTICE_ONLY") {
        if (!subgraph.notice) {
          throw Object.assign(
            new Error("Notice introuvable dans le sous-graphe."),
            { code: "TARGET_NOT_FOUND" },
          );
        }
        const applied = await applyNoticeDirectInTx(tx, {
          orgId: input.orgId,
          projectId: resolvedProjectId,
          patch,
          expectedVersion: subgraph.notice.contextVersion,
        });
        noticeUpdated = applied.updated;
        noticeId = applied.documentId;
        noticeVersionAfter = applied.versionAfter;
      } else if (eligibility.mode === "REPORT_ONLY") {
        if (!subgraph.report) {
          throw Object.assign(
            new Error("Compte rendu introuvable dans le sous-graphe."),
            { code: "TARGET_NOT_FOUND" },
          );
        }
        const applied = await applyReportDirectInTx(tx, {
          orgId: input.orgId,
          projectId: resolvedProjectId,
          patch,
          expectedVersion: subgraph.report.contextVersion,
        });
        reportUpdated = applied.updated;
        reportId = applied.documentId;
        reportVersionAfter = applied.versionAfter;
      } else if (eligibility.mode === "FOLLOW_UP_ONLY") {
        if (!subgraph.followUp) {
          throw Object.assign(
            new Error("Fiche de suivi introuvable dans le sous-graphe."),
            { code: "TARGET_NOT_FOUND" },
          );
        }
        const applied = await applyFollowUpDirectInTx(tx, {
          orgId: input.orgId,
          projectId: resolvedProjectId,
          patch,
          expectedVersion: subgraph.followUp.contextVersion,
        });
        followUpUpdated = applied.updated;
        followUpId = applied.sheetId;
        followUpVersionAfter = applied.versionAfter;
      } else if (eligibility.mode === "VISIT_ONLY") {
        if (!subgraph.visit) {
          throw Object.assign(new Error("Visite introuvable dans le sous-graphe."), {
            code: "TARGET_NOT_FOUND",
          });
        }
        const applied = await applyVisitDirectInTx(tx, {
          orgId: input.orgId,
          projectId: resolvedProjectId || null,
          patch,
          expectedVersion: subgraph.visit.contextVersion,
        });
        visitUpdated = applied.updated;
        visitId = applied.visitId;
        visitVersionAfter = applied.versionAfter;
      } else if (eligibility.mode === "PLANNING_ONLY") {
        const plan = subgraph.plans.find((p) => p.id === patch.origin.entity_id);
        if (!plan) {
          throw Object.assign(new Error("Planning introuvable dans le sous-graphe."), {
            code: "TARGET_NOT_FOUND",
          });
        }
        const applied = await applyPlanningDirectInTx(tx, {
          orgId: input.orgId,
          projectId: resolvedProjectId,
          patch,
          impact,
          plans: subgraph.plans,
          expectedRevision: plan.revisionNumber,
        });
        planningUpdated = applied.updated;
        planId = applied.planId;
        studyId = applied.studyId;
      } else if (eligibility.mode === "QUOTE_ONLY") {
        quoteUpdated = await applyQuoteOnlyInTx(tx, {
          orgId: input.orgId,
          patch,
          subgraphQuotes: subgraph.quotes,
        });
        quoteId = subgraph.quotes[0]?.id ?? null;
      } else {
        // TAKEOFF path (FULL or SAFE_PARTIAL)
        const takeoff = await applyTakeoffDirectInTx(tx, {
          orgId: input.orgId,
          userId: input.userId,
          patch,
          studyId: subgraph.study!.id,
          expectedVersion: subgraph.study!.version,
        });
        takeoffUpdated = true;
        studyId = takeoff.studyId;

        // Quote sync — only non-blocked CERTAIN quantity changes
        if (eligibility.mode === "FULL_SYNC") {
          const q = await applyQuoteDerivedInTx(tx, {
            orgId: input.orgId,
            impact,
            quotes: subgraph.quotes,
            studyId: takeoff.studyId,
            studyVersion: takeoff.studyVersion,
          });
          quoteUpdated = q.updated;
          if (q.quoteId) quoteId = q.quoteId;
        }
        // SAFE_PARTIAL: skip protected / override quote lines

        // Planning — aligne studyVersionAtGeneration uniquement si sync planning écrite
        const p = await applyPlanningDerivedInTx(tx, {
          orgId: input.orgId,
          impact,
          plans: subgraph.plans,
          qtyByCode: takeoff.qtyByCode,
          studyVersionAtGeneration: takeoff.studyVersion,
        });
        planningUpdated = p.updated;
        if (p.planId) planId = p.planId;
      }

      // Versions after (re-read)
      const versionsAfter = await readVersionsAfter(tx, {
        studyId,
        quoteId,
        planId,
        visitId,
        visitContextVersionOverride: visitVersionAfter,
        followUpId,
        followUpVersionOverride: followUpVersionAfter,
        reportId,
        reportVersionOverride: reportVersionAfter,
        noticeId,
        noticeVersionOverride: noticeVersionAfter,
        supplyVersionOverride: supplyVersionAfter,
      });

      const writtenDerived = impact.derivedChanges.filter((d) => {
        if (d.blocked) return false;
        if (eligibility.mode === "SAFE_PARTIAL_SYNC" && d.section === "QUOTE") {
          return false;
        }
        if (eligibility.mode === "QUOTE_ONLY") return d.section === "QUOTE";
        if (eligibility.mode === "PLANNING_ONLY") return d.section === "PLANNING";
        if (eligibility.mode === "VISIT_ONLY") return false;
        if (eligibility.mode === "FOLLOW_UP_ONLY") return false;
        if (eligibility.mode === "REPORT_ONLY") return false;
        if (eligibility.mode === "NOTICE_ONLY") return false;
        if (eligibility.mode === "SUPPLY_ONLY") return false;
        return true;
      });

      try {
        if (!resolvedProjectId) {
          return {
            patchRecordId: `visit:${visitId ?? patch.origin.entity_id}`,
            versionsAfter,
            summary: {
              takeoffUpdated,
              quoteUpdated,
              planningUpdated,
              visitUpdated,
              followUpUpdated,
              reportUpdated,
              noticeUpdated,
              supplyUpdated,
              quoteProtected,
            },
          };
        }
        const row = await tx.beworkUniversalPatch.create({
          data: {
            organizationId: input.orgId,
            projectId: resolvedProjectId,
            patchId: patch.patch_id,
            originSection: patch.origin.section,
            originEntityId: patch.origin.entity_id,
            changeIntent: patch.change_intent,
            reason: patch.reason ?? null,
            syncMode: eligibility.mode,
            status: "APPLIED",
            previewFingerprint: freshFp,
            directChangesJson: impact.directChanges as unknown as Prisma.InputJsonValue,
            derivedChangesJson: writtenDerived as unknown as Prisma.InputJsonValue,
            protectedImpactsJson:
              impact.protectedEntities.length > 0
                ? (impact.protectedEntities as unknown as Prisma.InputJsonValue)
                : PrismaNS.DbNull,
            overridesJson:
              impact.overrides.length > 0
                ? (impact.overrides as unknown as Prisma.InputJsonValue)
                : PrismaNS.DbNull,
            versionsBeforeJson: versionsBefore as unknown as Prisma.InputJsonValue,
            versionsAfterJson: versionsAfter as unknown as Prisma.InputJsonValue,
            studyId,
            quoteId,
            planId,
            actorUserId: input.userId,
          },
          select: { id: true },
        });

        return {
          patchRecordId: row.id,
          versionsAfter,
          summary: {
            takeoffUpdated,
            quoteUpdated,
            planningUpdated,
            visitUpdated,
            followUpUpdated,
            reportUpdated,
            noticeUpdated,
            supplyUpdated,
            quoteProtected,
          },
        };
      } catch (e) {
        if (
          e instanceof PrismaNS.PrismaClientKnownRequestError &&
          e.code === "P2002"
        ) {
          throw Object.assign(new Error("DUPLICATE_PATCH"), {
            code: "DUPLICATE_PATCH",
          });
        }
        throw e;
      }
    },
      {
        // Cause historique : timeout défaut 5s sous N×create séquentiels.
        // Le batch deps réduit les round-trips ; timeout = filet réseau Supabase.
        maxWait: 15_000,
        timeout: 60_000,
      },
    );

    return {
      ok: true,
      syncMode: eligibility.mode,
      patchRecordId: result.patchRecordId,
      versionsBefore,
      versionsAfter: result.versionsAfter,
      summary: result.summary,
      impact,
    };
  } catch (e) {
    const code =
      e && typeof e === "object" && "code" in e
        ? String((e as { code: string }).code)
        : "ERROR";
    if (code === "DUPLICATE_PATCH") {
      return {
        ok: false,
        error: "Ce patch a déjà été appliqué.",
        code: "DUPLICATE_PATCH",
        impact,
      };
    }
    if (code === "STRUCTURAL_OPERATION_NOT_APPLIED") {
      return {
        ok: false,
        error:
          e instanceof Error
            ? e.message
            : "Les ajouts de lignes n’ont pas été enregistrés. Aucune donnée n’a été modifiée.",
        code: "STRUCTURAL_OPERATION_NOT_APPLIED",
        impact,
      };
    }
    if (code === "PREVIEW_STALE" || code === "VERSION_CONFLICT") {
      return {
        ok: false,
        error:
          e instanceof Error
            ? e.message
            : patch.origin.section === "VISIT"
              ? "La visite a été modifiée depuis la génération de ce patch. Copiez un nouveau contexte et recommencez."
              : patch.origin.section === "FOLLOW_UP"
                ? "Le suivi a été modifié depuis la génération de ce patch. Copiez un nouveau contexte et recommencez."
                : patch.origin.section === "REPORT"
                  ? "Le compte rendu a été modifié depuis la génération de ce patch. Copiez un nouveau contexte et recommencez."
                  : patch.origin.section === "NOTICE"
                    ? "La notice a été modifiée depuis la génération de ce patch. Analysez de nouveau les modifications avant de les appliquer."
                    : "Le planning a été modifié depuis la génération de ce patch. Copiez un nouveau contexte et recommencez.",
        code: code === "VERSION_CONFLICT" ? "VERSION_CONFLICT" : "PREVIEW_STALE",
        impact,
      };
    }
    console.error("[bework-patch/commit]", e);
    return {
      ok: false,
      error:
        e instanceof Error
          ? e.message
          : "Synchronisation annulée. Aucune donnée n’a été modifiée.",
      code: code === "ERROR" ? "ERROR" : code,
      impact,
    };
  }
}

async function readVersionsAfter(
  tx: Prisma.TransactionClient,
  ids: {
    studyId: string | null;
    quoteId: string | null;
    planId: string | null;
    visitId: string | null;
    visitContextVersionOverride?: number | null;
    followUpId?: string | null;
    followUpVersionOverride?: number | null;
    reportId?: string | null;
    reportVersionOverride?: number | null;
    noticeId?: string | null;
    noticeVersionOverride?: number | null;
    supplyVersionOverride?: number | null;
  },
): Promise<VersionSnapshot> {
  const [study, quote, plan] = await Promise.all([
    ids.studyId
      ? tx.prepStudy.findFirst({
          where: { id: ids.studyId },
          select: { version: true },
        })
      : null,
    ids.quoteId
      ? tx.commercialQuote.findFirst({
          where: { id: ids.quoteId },
          select: {
            status: true,
            currentVersion: { select: { id: true, versionNumber: true } },
          },
        })
      : null,
    ids.planId
      ? tx.prepSchedulePlan.findFirst({
          where: { id: ids.planId },
          select: { revisionNumber: true, studyVersionAtGeneration: true },
        })
      : null,
  ]);
  return {
    study: study?.version ?? null,
    quoteVersion: quote?.currentVersion?.versionNumber ?? null,
    quoteVersionId: quote?.currentVersion?.id ?? null,
    quoteStatus: quote?.status ?? null,
    planRevision: plan?.revisionNumber ?? null,
    studyVersionAtGeneration: plan?.studyVersionAtGeneration ?? null,
    visitContextVersion: ids.visitContextVersionOverride ?? null,
    followUpVersion: ids.followUpVersionOverride ?? null,
    reportVersion: ids.reportVersionOverride ?? null,
    noticeVersion: ids.noticeVersionOverride ?? null,
    supplyVersion: ids.supplyVersionOverride ?? null,
  };
}

async function applyTakeoffDirectInTx(
  tx: Prisma.TransactionClient,
  input: {
    orgId: string;
    userId: string | null;
    patch: BeworkPatchV1;
    studyId: string;
    expectedVersion: number;
  },
): Promise<{ studyId: string; studyVersion: number; qtyByCode: Map<string, number | null> }> {
  const study = await tx.prepStudy.findFirst({
    where: {
      id: input.studyId,
      organizationId: input.orgId,
      archivedAt: null,
    },
    include: {
      parameters: true,
      lines: true,
    },
  });
  if (!study) throw new Error("Étude introuvable");
  if (study.version !== input.expectedVersion) {
    throw Object.assign(new Error("PREVIEW_STALE"), { code: "PREVIEW_STALE" });
  }

  // Hard-guard provenance (défense en profondeur — même si analyze a été contourné).
  const guard = evaluatePatchSourceProtection({
    patch: input.patch,
    subgraph: {
      projectId: study.projectId,
      study: {
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
        lines: study.lines.map((l) => ({
          id: l.id,
          code: l.code,
          designation: l.designation,
          unit: l.unit,
          formula: l.formula,
          declaredQuantity: l.declaredQuantity != null ? d(l.declaredQuantity) : null,
          computedQuantity: l.computedQuantity != null ? d(l.computedQuantity) : null,
          validatedQuantity: l.validatedQuantity != null ? d(l.validatedQuantity) : null,
          provenance: l.provenance,
          role: l.role,
        })),
      },
      quotes: [],
      quoteLinks: [],
      plans: [],
      visit: null,
      followUp: null,
      report: null,
      notice: null,
      supply: null,
    },
  });
  if (guard.blocked) {
    throw Object.assign(
      new Error(guard.errors[0]?.message ?? "PROTECTED_SOURCE_CONFLICT"),
      { code: "PROTECTED_SOURCE_CONFLICT" },
    );
  }

  const addLineOps = input.patch.operations.filter((op) => op.op === "add_line");
  const updateLineOps = input.patch.operations.filter((op) => op.op === "update_line");
  const deleteLineOps = input.patch.operations.filter((op) => op.op === "delete_line");
  const hypothesisOps = input.patch.operations.filter(
    (op) => op.op === "update_hypothesis",
  );
  const structuralRequested =
    addLineOps.length + updateLineOps.length + deleteLineOps.length;

  const paramUpdates = new Map<string, number | null>();
  const isOverride =
    input.patch.change_intent === "TECHNICAL_OVERRIDE" &&
    typeof input.patch.reason === "string" &&
    input.patch.reason.trim().length > 0;

  for (const op of input.patch.operations) {
    if (op.op !== "update_parameter") continue;
    const key =
      op.target.parameter_key ??
      study.parameters.find(
        (p) => p.id === op.target.parameter_id || p.id === op.target.id,
      )?.key;
    if (!key || op.changes.value === undefined) continue;
    paramUpdates.set(key, op.changes.value);
  }

  for (const [key, value] of paramUpdates) {
    await tx.prepParameter.update({
      where: { studyId_key: { studyId: study.id, key } },
      data: {
        value,
        // Override explicite → SAISIE_MANUELLE ; sinon conserver la provenance existante
        // si la valeur ne change pas de catégorie (premier remplissage → SAISIE_MANUELLE).
        provenance: isOverride
          ? "SAISIE_MANUELLE"
          : (study.parameters.find((p) => p.key === key)?.provenance ??
            "SAISIE_MANUELLE"),
        modifiedAt: new Date(),
        modifiedById: input.userId,
      },
    });
  }

  // --- Lignes : état mutable en mémoire (existantes + créations) ---
  type MutableLine = {
    id: string | null;
    code: string;
    lot: string;
    designation: string;
    description: string | null;
    unit: string;
    formula: string | null;
    declaredQuantity: number | null;
    provenance: string | null;
    role: string;
    nature: string | null;
    notes: string | null;
    includedServices: string[] | null;
    technicalReferences: Array<{
      label: string;
      kind: string;
      note: string | null;
    }> | null;
    executionNotes: string | null;
    qualityControls: string[] | null;
    technicalReservations: string[] | null;
    textsUserEdited: boolean;
    sheetTouched: boolean;
    sortOrder: number;
    isNew: boolean;
    deleted: boolean;
  };

  const asStringList = (v: unknown): string[] | null => {
    if (v == null) return null;
    if (!Array.isArray(v)) return null;
    const out = v
      .map((x) => (typeof x === "string" ? x.trim() : ""))
      .filter(Boolean);
    return out;
  };
  const asTechRefs = (
    v: unknown,
  ): MutableLine["technicalReferences"] => {
    if (v == null) return null;
    if (!Array.isArray(v)) return null;
    const out: NonNullable<MutableLine["technicalReferences"]> = [];
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

  const lineMap = new Map<string, MutableLine>();
  const idToCode = new Map<string, string>();
  for (const l of study.lines) {
    idToCode.set(l.id, l.code);
    lineMap.set(l.code, {
      id: l.id,
      code: l.code,
      lot: l.lot,
      designation: l.designation,
      description: l.description,
      unit: l.unit,
      formula: l.formula,
      declaredQuantity: l.declaredQuantity != null ? d(l.declaredQuantity) : null,
      provenance: l.provenance,
      role: l.role,
      nature: l.nature,
      notes: l.notes,
      includedServices: asStringList(l.includedServicesJson),
      technicalReferences: asTechRefs(l.technicalReferencesJson),
      executionNotes: l.executionNotes,
      qualityControls: asStringList(l.qualityControlsJson),
      technicalReservations: asStringList(l.technicalReservationsJson),
      textsUserEdited: l.textsUserEdited,
      sheetTouched: false,
      sortOrder: l.sortOrder,
      isNew: false,
      deleted: false,
    });
  }

  const resolveLineCode = (target: {
    line_code?: string | null;
    code?: string | null;
    line_id?: string | null;
    id?: string | null;
  }): string | null => {
    const byCode = target.line_code ?? target.code ?? null;
    if (byCode && lineMap.has(byCode)) return byCode;
    const lineId = target.line_id ?? null;
    if (lineId && idToCode.has(lineId)) return idToCode.get(lineId)!;
    if (target.id && idToCode.has(target.id)) return idToCode.get(target.id)!;
    if (target.id && lineMap.has(target.id)) return target.id;
    return byCode;
  };

  let maxSort = study.lines.reduce((m, l) => Math.max(m, l.sortOrder), -1);
  let addedCount = 0;
  let updatedCount = 0;
  let deletedCount = 0;

  for (const op of deleteLineOps) {
    const code = resolveLineCode(op.target);
    if (!code) {
      throw Object.assign(new Error("delete_line sans line_code / line_id"), {
        code: "STRUCTURAL_OPERATION_NOT_APPLIED",
      });
    }
    const existing = lineMap.get(code);
    if (!existing || existing.deleted) {
      throw Object.assign(new Error(`Ligne introuvable pour suppression : ${code}`), {
        code: "STRUCTURAL_OPERATION_NOT_APPLIED",
      });
    }
    existing.deleted = true;
    deletedCount += 1;
  }

  for (const op of updateLineOps) {
    const code = resolveLineCode(op.target);
    if (!code) {
      throw Object.assign(new Error("update_line sans line_code / line_id"), {
        code: "STRUCTURAL_OPERATION_NOT_APPLIED",
      });
    }
    const existing = lineMap.get(code);
    if (!existing || existing.deleted) {
      throw Object.assign(new Error(`Ligne introuvable pour mise à jour : ${code}`), {
        code: "STRUCTURAL_OPERATION_NOT_APPLIED",
      });
    }
    if (op.changes.designation !== undefined) existing.designation = op.changes.designation;
    if (op.changes.description !== undefined) existing.description = op.changes.description;
    if (op.changes.declared_quantity !== undefined) {
      existing.declaredQuantity = op.changes.declared_quantity;
    }
    if (op.changes.unit !== undefined) existing.unit = op.changes.unit;
    if (op.changes.lot !== undefined) existing.lot = op.changes.lot;
    if (op.changes.notes !== undefined) existing.notes = op.changes.notes;
    let sheetChange = false;
    if (op.changes.included_services !== undefined) {
      existing.includedServices = op.changes.included_services;
      sheetChange = true;
    }
    if (op.changes.technical_references !== undefined) {
      existing.technicalReferences = op.changes.technical_references;
      sheetChange = true;
    }
    if (op.changes.execution_notes !== undefined) {
      existing.executionNotes = op.changes.execution_notes;
      sheetChange = true;
    }
    if (op.changes.quality_controls !== undefined) {
      existing.qualityControls = op.changes.quality_controls;
      sheetChange = true;
    }
    if (op.changes.technical_reservations !== undefined) {
      existing.technicalReservations = op.changes.technical_reservations;
      sheetChange = true;
    }
    if (
      sheetChange ||
      op.changes.designation !== undefined ||
      op.changes.description !== undefined
    ) {
      existing.sheetTouched = true;
      // Patch ChatGPT explicite (preview + confirmation) : autorisé même si textsUserEdited.
      existing.textsUserEdited = true;
    }
    updatedCount += 1;
  }

  for (const op of addLineOps) {
    const code = op.line.code.trim();
    const existing = lineMap.get(code);
    if (existing && !existing.deleted) {
      throw Object.assign(new Error(`Ligne déjà présente : ${code}`), {
        code: "STRUCTURAL_OPERATION_NOT_APPLIED",
      });
    }
    let sortOrder = maxSort + 1;
    if (op.insert_after_code) {
      const after = lineMap.get(op.insert_after_code);
      if (after && !after.deleted) {
        sortOrder = after.sortOrder + 1;
        for (const l of lineMap.values()) {
          if (!l.deleted && l.sortOrder >= sortOrder) l.sortOrder += 1;
        }
      }
    }
    maxSort = Math.max(maxSort, sortOrder);
    const hasSheet =
      (op.line.included_services?.length ?? 0) > 0 ||
      (op.line.technical_references?.length ?? 0) > 0 ||
      !!op.line.execution_notes ||
      (op.line.quality_controls?.length ?? 0) > 0 ||
      (op.line.technical_reservations?.length ?? 0) > 0;
    lineMap.set(code, {
      id: null,
      code,
      lot: op.line.lot,
      designation: op.line.designation,
      description: op.line.description ?? null,
      unit: op.line.unit,
      formula: op.line.formula ?? null,
      declaredQuantity:
        op.line.declared_quantity != null && Number.isFinite(op.line.declared_quantity)
          ? op.line.declared_quantity
          : null,
      provenance: op.line.provenance ?? null,
      role: op.line.role ?? "quote",
      nature: op.line.nature ?? null,
      notes: op.line.notes ?? null,
      includedServices: op.line.included_services ?? null,
      technicalReferences: op.line.technical_references ?? null,
      executionNotes: op.line.execution_notes ?? null,
      qualityControls: op.line.quality_controls ?? null,
      technicalReservations: op.line.technical_reservations ?? null,
      // Création ChatGPT : fiche générée, pas encore retouchée manuellement.
      textsUserEdited: false,
      sheetTouched: hasSheet,
      sortOrder,
      isNew: true,
      deleted: false,
    });
    addedCount += 1;
  }

  // Anti-faux succès : opérations structurantes demandées ≠ appliquées → rollback TX
  if (addLineOps.length > 0 && addedCount !== addLineOps.length) {
    throw Object.assign(
      new Error(
        `STRUCTURAL_OPERATION_NOT_APPLIED: ${addedCount}/${addLineOps.length} add_line persistées`,
      ),
      { code: "STRUCTURAL_OPERATION_NOT_APPLIED" },
    );
  }
  if (updateLineOps.length > 0 && updatedCount !== updateLineOps.length) {
    throw Object.assign(
      new Error(
        `STRUCTURAL_OPERATION_NOT_APPLIED: ${updatedCount}/${updateLineOps.length} update_line`,
      ),
      { code: "STRUCTURAL_OPERATION_NOT_APPLIED" },
    );
  }
  if (deleteLineOps.length > 0 && deletedCount !== deleteLineOps.length) {
    throw Object.assign(
      new Error(
        `STRUCTURAL_OPERATION_NOT_APPLIED: ${deletedCount}/${deleteLineOps.length} delete_line`,
      ),
      { code: "STRUCTURAL_OPERATION_NOT_APPLIED" },
    );
  }
  if (structuralRequested > 0 && addedCount + updatedCount + deletedCount === 0) {
    throw Object.assign(
      new Error(
        "STRUCTURAL_OPERATION_NOT_APPLIED: aucune opération structurante n’a été persistée",
      ),
      { code: "STRUCTURAL_OPERATION_NOT_APPLIED" },
    );
  }

  // Persist deletes / updates / creates
  for (const l of lineMap.values()) {
    if (l.deleted && !l.isNew) {
      await tx.prepTakeoffLine.delete({
        where: { studyId_code: { studyId: study.id, code: l.code } },
      });
    }
  }
  for (const l of lineMap.values()) {
    if (l.deleted) continue;
    if (l.isNew) {
      await tx.prepTakeoffLine.create({
        data: {
          studyId: study.id,
          organizationId: input.orgId,
          code: l.code,
          lot: l.lot,
          designation: l.designation,
          description: l.description,
          unit: l.unit,
          formula: l.formula,
          declaredQuantity: l.declaredQuantity,
          provenance: l.provenance,
          role: l.role,
          nature: l.nature,
          notes: l.notes,
          includedServicesJson:
            l.includedServices != null
              ? (l.includedServices as unknown as Prisma.InputJsonValue)
              : PrismaNS.DbNull,
          technicalReferencesJson:
            l.technicalReferences != null
              ? (l.technicalReferences as unknown as Prisma.InputJsonValue)
              : PrismaNS.DbNull,
          executionNotes: l.executionNotes,
          qualityControlsJson:
            l.qualityControls != null
              ? (l.qualityControls as unknown as Prisma.InputJsonValue)
              : PrismaNS.DbNull,
          technicalReservationsJson:
            l.technicalReservations != null
              ? (l.technicalReservations as unknown as Prisma.InputJsonValue)
              : PrismaNS.DbNull,
          textsUserEdited: l.textsUserEdited,
          sortOrder: l.sortOrder,
          originalDesignation: l.designation,
          originalDeclared: l.declaredQuantity,
          originalProvenance: l.provenance,
        },
      });
    } else if (
      updateLineOps.some(
        (op) => (op.target.line_code ?? op.target.code ?? op.target.id) === l.code,
      )
    ) {
      await tx.prepTakeoffLine.update({
        where: { studyId_code: { studyId: study.id, code: l.code } },
        data: {
          lot: l.lot,
          designation: l.designation,
          description: l.description,
          unit: l.unit,
          declaredQuantity: l.declaredQuantity,
          notes: l.notes,
          ...(l.sheetTouched
            ? {
                includedServicesJson:
                  l.includedServices != null
                    ? (l.includedServices as unknown as Prisma.InputJsonValue)
                    : PrismaNS.DbNull,
                technicalReferencesJson:
                  l.technicalReferences != null
                    ? (l.technicalReferences as unknown as Prisma.InputJsonValue)
                    : PrismaNS.DbNull,
                executionNotes: l.executionNotes,
                qualityControlsJson:
                  l.qualityControls != null
                    ? (l.qualityControls as unknown as Prisma.InputJsonValue)
                    : PrismaNS.DbNull,
                technicalReservationsJson:
                  l.technicalReservations != null
                    ? (l.technicalReservations as unknown as Prisma.InputJsonValue)
                    : PrismaNS.DbNull,
                textsUserEdited: l.textsUserEdited,
              }
            : {}),
          sortOrder: l.sortOrder,
        },
      });
    } else if (addLineOps.length > 0 || deleteLineOps.length > 0) {
      // Réordonner si insertions ont décalé sortOrder
      await tx.prepTakeoffLine.update({
        where: { studyId_code: { studyId: study.id, code: l.code } },
        data: { sortOrder: l.sortOrder },
      });
    }
  }

  // Hypothèses (JSON étude)
  let hypothesesJson: Prisma.InputJsonValue | typeof PrismaNS.DbNull | undefined;
  if (hypothesisOps.length > 0) {
    const raw = study.hypothesesJson;
    const list = Array.isArray(raw) ? [...(raw as Array<Record<string, unknown>>)] : [];
    for (const op of hypothesisOps) {
      const id = op.target.id;
      const idx = list.findIndex((h) => h && typeof h === "object" && h.id === id);
      if (idx < 0) {
        throw Object.assign(new Error(`Hypothèse introuvable : ${id}`), {
          code: "STRUCTURAL_OPERATION_NOT_APPLIED",
        });
      }
      const cur = { ...list[idx]! };
      if (op.changes.statement !== undefined) cur.statement = op.changes.statement;
      if (op.changes.reason !== undefined) cur.reason = op.changes.reason;
      list[idx] = cur;
    }
    hypothesesJson = list as unknown as Prisma.InputJsonValue;
  }

  const activeLines = [...lineMap.values()].filter((l) => !l.deleted);
  const params = study.parameters.map((p) => ({
    key: p.key,
    value: paramUpdates.has(p.key)
      ? paramUpdates.get(p.key)!
      : p.value != null
        ? d(p.value)
        : null,
    formula: p.formula,
    provenance: null as null,
  }));
  const engineLines = activeLines.map((l) => ({
    code: l.code,
    formula: l.formula,
    declaredQuantity: l.declaredQuantity,
    provenance: null as null,
    literalProvenance: null as null,
  }));
  const engine = computeStudy({ params, lines: engineLines });

  for (const l of activeLines) {
    const node = engine.nodes.get(l.code);
    await tx.prepTakeoffLine.update({
      where: { studyId_code: { studyId: study.id, code: l.code } },
      data: {
        computedQuantity: node?.value ?? null,
        computeError: node?.error ?? null,
      },
    });
  }

  // Garde finale lecture DB : version +1 sans les add_line créés = invalide
  if (addLineOps.length > 0) {
    const dbCount = await tx.prepTakeoffLine.count({ where: { studyId: study.id } });
    const expectedCount = study.lines.length - deletedCount + addedCount;
    if (dbCount !== expectedCount) {
      throw Object.assign(
        new Error(
          `STRUCTURAL_OPERATION_NOT_APPLIED: count DB=${dbCount}, attendu=${expectedCount}`,
        ),
        { code: "STRUCTURAL_OPERATION_NOT_APPLIED" },
      );
    }
    for (const op of addLineOps) {
      const row = await tx.prepTakeoffLine.findUnique({
        where: { studyId_code: { studyId: study.id, code: op.line.code } },
        select: { code: true },
      });
      if (!row) {
        throw Object.assign(
          new Error(`STRUCTURAL_OPERATION_NOT_APPLIED: ${op.line.code} absente après create`),
          { code: "STRUCTURAL_OPERATION_NOT_APPLIED" },
        );
      }
    }
  }

  const nextVersion = study.version + 1;
  await tx.prepStudy.update({
    where: { id: study.id },
    data: {
      version: nextVersion,
      updatedById: input.userId,
      ...(hypothesesJson !== undefined ? { hypothesesJson } : {}),
    },
  });
  await invalidateFinalValidationIfNeeded(tx, {
    studyId: study.id,
    organizationId: input.orgId,
    currentStatus: study.dossierStatus,
    change:
      structuralRequested > 0 || paramUpdates.size > 0
        ? "patch_takeoff"
        : "text_only",
    actorUserId: input.userId,
    versionBefore: study.version,
    versionAfter: nextVersion,
  });

  const qtyByCode = new Map<string, number | null>();
  for (const l of activeLines) {
    qtyByCode.set(l.code, engine.nodes.get(l.code)?.value ?? null);
  }
  return { studyId: study.id, studyVersion: nextVersion, qtyByCode };
}

async function applyQuoteDerivedInTx(
  tx: Prisma.TransactionClient,
  input: {
    orgId: string;
    impact: AnalyzePatchImpactResult;
    quotes: import("@/lib/bework-patch/impact/types").ImpactQuote[];
    studyId: string;
    studyVersion: number;
  },
): Promise<{ updated: boolean; quoteId: string | null }> {
  const qtyChanges = input.impact.derivedChanges.filter(
    (d) =>
      d.section === "QUOTE" &&
      d.field === "quantity" &&
      !d.blocked &&
      d.certainty === "CERTAIN" &&
      typeof d.after === "number" &&
      d.entityId,
  );
  if (!qtyChanges.length) return { updated: false, quoteId: null };

  let quoteId: string | null = null;
  const touchedVersions = new Set<string>();
  const touchedQuoteIds = new Set<string>();

  for (const ch of qtyChanges) {
    const quote = input.quotes.find((q) =>
      q.lines.some((l) => l.id === ch.entityId),
    );
    if (!quote || !quote.versionId) continue;
    if (["SENT", "VIEWED", "ACCEPTED", "REFUSED", "EXPIRED", "CANCELLED"].includes(quote.status)) {
      continue;
    }
    const line = quote.lines.find((l) => l.id === ch.entityId);
    if (!line) continue;

    const calc = calculateLine({
      kind: (line.kind as "WORK") ?? "WORK",
      quantity: ch.after as number,
      unitSellHt: line.unitSellHt,
      discountPercent: line.discountPercent,
      vatRate: line.vatRate,
    });

    await tx.commercialQuoteLine.update({
      where: { id: line.id },
      data: {
        quantity: ch.after as number,
        lineCostHt: calc.lineCostHt,
        lineSellHt: calc.lineSellHt,
        lineVat: calc.lineVat,
        lineTtc: calc.lineTtc,
        marginAmount: calc.marginAmount,
      },
    });

    // CTX-03 — garder le snapshot de transfert aligné avec la quantité écrite
    await tx.prepQuoteLink.updateMany({
      where: {
        organizationId: input.orgId,
        quoteLineId: line.id,
        studyId: input.studyId,
      },
      data: { quantityAtTransfer: ch.after as number },
    });

    quoteId = quote.id;
    touchedQuoteIds.add(quote.id);
    touchedVersions.add(quote.versionId);
  }

  for (const versionId of touchedVersions) {
    await recomputeVersionTotalsInTx(tx, input.orgId, versionId);
  }

  // CTX-03 — aligner PrepQuoteTransfer.studyVersion dans la même transaction
  for (const qid of touchedQuoteIds) {
    await tx.prepQuoteTransfer.updateMany({
      where: {
        organizationId: input.orgId,
        quoteId: qid,
        studyId: input.studyId,
      },
      data: { studyVersion: input.studyVersion },
    });
  }

  return { updated: touchedVersions.size > 0, quoteId };
}

async function applyQuoteOnlyInTx(
  tx: Prisma.TransactionClient,
  input: {
    orgId: string;
    patch: BeworkPatchV1;
    subgraphQuotes: import("@/lib/bework-patch/impact/types").ImpactQuote[];
  },
): Promise<boolean> {
  let updated = false;
  const touched = new Set<string>();

  for (const op of input.patch.operations) {
    if (op.op !== "update_quote_item") continue;
    const quote = input.subgraphQuotes.find((q) => q.id === op.target.quote_id);
    const line = quote?.lines.find(
      (l) => l.id === op.target.item_id || l.id === op.target.id,
    );
    if (!quote || !line || !quote.versionId) continue;
    if (["SENT", "VIEWED", "ACCEPTED", "REFUSED", "EXPIRED", "CANCELLED"].includes(quote.status)) {
      throw Object.assign(new Error("PROTECTED_ENTITY"), { code: "PROTECTED_ENTITY" });
    }

    const nextQty = op.changes.quantity ?? line.quantity;
    const nextPu = op.changes.unit_price_ht ?? line.unitSellHt;
    const nextDisc = op.changes.discount_percent ?? line.discountPercent;
    const calc = calculateLine({
      quantity: nextQty,
      unitSellHt: nextPu,
      discountPercent: nextDisc,
      vatRate: line.vatRate,
    });

    await tx.commercialQuoteLine.update({
      where: { id: line.id },
      data: {
        quantity: nextQty,
        unitSellHt: nextPu,
        discountPercent: nextDisc,
        ...(op.changes.designation !== undefined
          ? { designation: op.changes.designation }
          : {}),
        lineCostHt: calc.lineCostHt,
        lineSellHt: calc.lineSellHt,
        lineVat: calc.lineVat,
        lineTtc: calc.lineTtc,
        marginAmount: calc.marginAmount,
      },
    });
    touched.add(quote.versionId);
    updated = true;
  }

  for (const versionId of touched) {
    await recomputeVersionTotalsInTx(tx, input.orgId, versionId);
  }
  return updated;
}

async function recomputeVersionTotalsInTx(
  tx: Prisma.TransactionClient,
  orgId: string,
  versionId: string,
) {
  const lines = await tx.commercialQuoteLine.findMany({
    where: { versionId, organizationId: orgId },
  });
  let totalCostHt = 0;
  let totalSellHt = 0;
  let totalVat = 0;
  let totalTtc = 0;
  let marginAmount = 0;
  for (const l of lines) {
    if (l.isOptional) continue;
    totalCostHt += d(l.lineCostHt);
    totalSellHt += d(l.lineSellHt);
    totalVat += d(l.lineVat);
    totalTtc += d(l.lineTtc);
    marginAmount += d(l.marginAmount);
  }
  totalCostHt = roundMoney(totalCostHt);
  totalSellHt = roundMoney(totalSellHt);
  totalVat = roundMoney(totalVat);
  totalTtc = roundMoney(totalTtc);
  marginAmount = roundMoney(marginAmount);
  const marginPercent =
    totalSellHt > 0 ? roundMoney((marginAmount / totalSellHt) * 100, 4) : 0;

  await tx.commercialQuoteVersion.update({
    where: { id: versionId },
    data: {
      totalCostHt,
      totalSellHt,
      totalVat,
      totalTtc,
      marginAmount,
      marginPercent,
    },
  });

  const version = await tx.commercialQuoteVersion.findFirst({
    where: { id: versionId },
    select: { quoteId: true },
  });
  if (version) {
    await tx.commercialQuote.update({
      where: { id: version.quoteId },
      data: {
        totalCostHt,
        totalSellHt,
        totalVat,
        totalTtc,
        marginAmount,
        marginPercent,
      },
    });
  }
}

async function applyPlanningDerivedInTx(
  tx: Prisma.TransactionClient,
  input: {
    orgId: string;
    impact: AnalyzePatchImpactResult;
    plans: import("@/lib/bework-patch/impact/types").ImpactPlan[];
    qtyByCode: Map<string, number | null>;
    /** Version courante du métré après apply takeoff — écrite seulement si le plan est touché. */
    studyVersionAtGeneration: number;
  },
): Promise<{ updated: boolean; planId: string | null }> {
  if (!input.plans.length) return { updated: false, planId: null };
  let any = false;
  let planId: string | null = null;

  for (const plan of input.plans) {
    const sim = simulatePlanFromQuantityMap(plan, input.qtyByCode);
    const touchedTasks = sim.tasks.filter(
      (t) =>
        t.mode !== "unchanged" ||
        (t.afterQty != null && t.beforeQty !== t.afterQty),
    );
    if (!touchedTasks.length) continue;

    for (const t of touchedTasks) {
      const data: Prisma.PrepScheduleTaskUpdateInput = {};
      if (t.afterQty != null) {
        data.quantitySnapshot = t.afterQty;
      }
      if (Math.abs(t.afterDuration - t.beforeDuration) >= 1e-9 && t.mode !== "locked") {
        data.durationDays = t.afterDuration;
        data.computedDurationDays = t.afterDuration;
      }
      if (Object.keys(data).length) {
        await tx.prepScheduleTask.update({
          where: { id: t.taskId },
          data,
        });
        any = true;
      }
    }

    // KPI plan — conserver startDate ; jamais inventer 1970
    // CTX-04 : studyVersionAtGeneration dans la MÊME update que revisionNumber
    const planData: Prisma.PrepSchedulePlanUpdateInput = {
      revisionNumber: { increment: 1 },
      studyVersionAtGeneration: input.studyVersionAtGeneration,
    };
    if (sim.afterDurationWorkingDays != null) {
      planData.baseDurationWorkingDays = sim.afterDurationWorkingDays;
    }
    // endDateBase : uniquement si startDate réelle existe
    if (plan.startDate && sim.afterEndDate) {
      planData.endDateBase = new Date(`${sim.afterEndDate}T12:00:00.000Z`);
    } else if (!plan.startDate) {
      // relative — ne pas écrire de date sentinelle
      planData.endDateBase = null;
    }

    await tx.prepSchedulePlan.update({
      where: { id: plan.id },
      data: planData,
    });
    planId = plan.id;
    any = true;
  }

  return { updated: any, planId };
}

/** Métadonnées commit pour la preview UI (fingerprint + eligibility). */
export function buildCommitPreviewMeta(input: {
  patch: BeworkPatchV1;
  impact: AnalyzePatchImpactResult;
  subgraph: import("@/lib/bework-patch/impact/types").ImpactSubgraph;
}) {
  const preferredPlanId =
    input.patch.origin.section === "PLANNING"
      ? input.patch.origin.entity_id
      : null;
  const versions = collectVersionSnapshot(input.subgraph, { preferredPlanId });
  const fingerprint = computePreviewFingerprint(
    buildFingerprintPayload({
      patch: input.patch,
      versions,
      impact: input.impact,
      subgraph: input.subgraph,
    }),
  );
  const eligibility = evaluateCommitEligibility({
    patch: input.patch,
    impact: input.impact,
  });
  return { fingerprint, eligibility, versions };
}
