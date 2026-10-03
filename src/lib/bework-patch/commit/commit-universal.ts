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
  projectId: string;
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

  if (patch.origin.project_id !== input.projectId) {
    return {
      ok: false,
      error: "Le projet du patch ne correspond pas.",
      code: "PROJECT_MISMATCH",
    };
  }

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
    projectId: input.projectId,
    patch,
  });
  const impact = analyzePatchImpact({ patch, subgraph });
  const versionsBefore = collectVersionSnapshot(subgraph);

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
      const quoteProtected = impact.protectedEntities.some((p) => p.section === "QUOTE");

      let studyId: string | null = subgraph.study?.id ?? null;
      let quoteId: string | null = subgraph.quotes[0]?.id ?? null;
      let planId: string | null = subgraph.plans[0]?.id ?? null;
      let visitId: string | null = subgraph.visit?.id ?? null;
      let visitVersionAfter: number | null = null;
      let followUpId: string | null = subgraph.followUp?.id ?? null;
      let followUpVersionAfter: number | null = null;
      let reportId: string | null = subgraph.report?.id ?? null;
      let reportVersionAfter: number | null = null;
      let noticeId: string | null = subgraph.notice?.id ?? null;
      let noticeVersionAfter: number | null = null;

      if (eligibility.mode === "NOTICE_ONLY") {
        if (!subgraph.notice) {
          throw Object.assign(
            new Error("Notice introuvable dans le sous-graphe."),
            { code: "TARGET_NOT_FOUND" },
          );
        }
        const applied = await applyNoticeDirectInTx(tx, {
          orgId: input.orgId,
          projectId: input.projectId,
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
          projectId: input.projectId,
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
          projectId: input.projectId,
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
          projectId: input.projectId,
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
          projectId: input.projectId,
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
        return true;
      });

      try {
        const row = await tx.beworkUniversalPatch.create({
          data: {
            organizationId: input.orgId,
            projectId: input.projectId,
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
    },
  });
  if (guard.blocked) {
    throw Object.assign(
      new Error(guard.errors[0]?.message ?? "PROTECTED_SOURCE_CONFLICT"),
      { code: "PROTECTED_SOURCE_CONFLICT" },
    );
  }

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
  const lines = study.lines.map((l) => ({
    code: l.code,
    formula: l.formula,
    declaredQuantity: l.declaredQuantity != null ? d(l.declaredQuantity) : null,
    provenance: null as null,
    literalProvenance: null as null,
  }));
  const engine = computeStudy({ params, lines });

  for (const l of study.lines) {
    const node = engine.nodes.get(l.code);
    await tx.prepTakeoffLine.update({
      where: { studyId_code: { studyId: study.id, code: l.code } },
      data: {
        computedQuantity: node?.value ?? null,
        computeError: node?.error ?? null,
      },
    });
  }

  const nextVersion = study.version + 1;
  await tx.prepStudy.update({
    where: { id: study.id },
    data: {
      version: nextVersion,
      updatedById: input.userId,
    },
  });
  await invalidateFinalValidationIfNeeded(tx, {
    studyId: study.id,
    organizationId: input.orgId,
    currentStatus: study.dossierStatus,
    change: "patch_takeoff",
    actorUserId: input.userId,
    versionBefore: study.version,
    versionAfter: nextVersion,
  });

  const qtyByCode = new Map<string, number | null>();
  for (const l of study.lines) {
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
  const versions = collectVersionSnapshot(input.subgraph);
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
