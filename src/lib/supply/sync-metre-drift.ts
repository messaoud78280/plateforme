/**
 * Propagation métré → Approvisionnements : marquage drift uniquement.
 * Jamais de modification automatique des quantités / offres / BC.
 */
import type { Prisma } from "@prisma/client";
import {
  computeSourceFingerprint,
  evaluateMetreDrift,
  buildDriftDecisionPayload,
} from "@/lib/supply/drift";

type Db = Prisma.TransactionClient | typeof import("@/lib/prisma").prisma;

function asCodeList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const p = JSON.parse(raw) as unknown;
      if (Array.isArray(p)) {
        return p.map((x) => String(x).trim()).filter(Boolean);
      }
    } catch {
      /* CSV */
    }
    return raw
      .split(/[,;]/)
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function n(v: unknown): number | null {
  if (v == null) return null;
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : null;
}

function lineQty(row: {
  validatedQuantity: unknown;
  computedQuantity: unknown;
  declaredQuantity: unknown;
}): number | null {
  return (
    n(row.validatedQuantity) ??
    n(row.computedQuantity) ??
    n(row.declaredQuantity)
  );
}

export type MetreDriftMarkResult = {
  scanned: number;
  marked: number;
  cleared: number;
  bootstrapped: number;
  skipped: number;
};

/**
 * Après Commit métré : compare fingerprints et pose sourceDrift.
 * Ne touche ni quantité, ni offre, ni BC.
 */
export async function markSupplyDriftAfterMetreCommit(
  db: Db,
  input: {
    organizationId: string;
    projectId: string;
    studyId: string;
    studyVersion: number;
  },
): Promise<MetreDriftMarkResult> {
  const lines = await db.prepTakeoffLine.findMany({
    where: {
      studyId: input.studyId,
      organizationId: input.organizationId,
    },
    select: {
      code: true,
      unit: true,
      validatedQuantity: true,
      computedQuantity: true,
      declaredQuantity: true,
    },
  });
  const byCode = new Map(lines.map((l) => [l.code.trim(), l]));

  const needs = await db.materialRequirement.findMany({
    where: {
      organizationId: input.organizationId,
      projectId: input.projectId,
      status: { not: "CANCELLED" },
    },
    select: {
      id: true,
      takeoffCodes: true,
      sourceFingerprint: true,
      sourceDrift: true,
      sourceQuantity: true,
      sourceUnit: true,
      validatedOrderQuantity: true,
      quantityRequired: true,
      unit: true,
      prepStudyId: true,
      sourceType: true,
      _count: { select: { orderLinks: true } },
    },
  });

  let marked = 0;
  let cleared = 0;
  let bootstrapped = 0;
  let skipped = 0;
  let scanned = 0;

  for (const need of needs) {
    const codes = asCodeList(need.takeoffCodes);
    if (codes.length === 0 && need.prepStudyId !== input.studyId) {
      skipped += 1;
      continue;
    }
    // Besoin lié à une autre étude : ignorer
    if (need.prepStudyId && need.prepStudyId !== input.studyId) {
      skipped += 1;
      continue;
    }
    const effectiveCodes =
      codes.length > 0
        ? codes
        : need.prepStudyId === input.studyId
          ? [...byCode.keys()]
          : [];
    if (effectiveCodes.length === 0) {
      skipped += 1;
      continue;
    }

    // Au moins un code du besoin doit exister dans l’étude
    const present = effectiveCodes.filter((c) => byCode.has(c));
    if (present.length === 0) {
      skipped += 1;
      continue;
    }

    scanned += 1;
    const sourceQuantities = present.map((code) => {
      const row = byCode.get(code)!;
      const qty = lineQty(row);
      return {
        code,
        qty: qty ?? 0,
        unit: row.unit || need.unit || "U",
      };
    });
    const nextFp = computeSourceFingerprint({
      takeoffCodes: present,
      sourceQuantities,
      studyVersion: input.studyVersion,
    });

    const prev = need.sourceFingerprint?.trim() || null;

    // Bootstrap : première empreinte sans alerte (sauf écart qty source déjà stockée)
    if (!prev) {
      let drift: "NONE" | "METRE_CHANGED" | "METRE_CHANGED_AFTER_ORDER" =
        "NONE";
      if (need.sourceQuantity != null && present.length === 1) {
        const lineQ = sourceQuantities[0]!.qty;
        const stored = n(need.sourceQuantity);
        if (
          stored != null &&
          Number.isFinite(lineQ) &&
          Math.abs(stored - lineQ) > 1e-6
        ) {
          drift =
            need._count.orderLinks > 0
              ? "METRE_CHANGED_AFTER_ORDER"
              : "METRE_CHANGED";
        }
      }
      await db.materialRequirement.update({
        where: { id: need.id },
        data: {
          sourceFingerprint: nextFp,
          sourceDrift: drift,
          prepStudyId: need.prepStudyId ?? input.studyId,
        },
      });
      if (drift === "NONE") bootstrapped += 1;
      else marked += 1;
      continue;
    }

    const evald = evaluateMetreDrift({
      previousFingerprint: prev,
      nextFingerprint: nextFp,
      hasActiveOrderLinks: need._count.orderLinks > 0,
    });

    if (!evald.changed) {
      if (need.sourceDrift !== "NONE") {
        await db.materialRequirement.update({
          where: { id: need.id },
          data: { sourceDrift: "NONE" },
        });
        cleared += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    // Drift : conserver l’empreinte de référence (prev) jusqu’à décision humaine
    if (need.sourceDrift !== evald.drift) {
      await db.materialRequirement.update({
        where: { id: need.id },
        data: { sourceDrift: evald.drift },
      });
      marked += 1;
    } else {
      // Déjà marqué — idempotent (Commit répété)
      skipped += 1;
    }
  }

  return { scanned, marked, cleared, bootstrapped, skipped };
}

export type DriftRevisionPreview = {
  requirementId: string;
  label: string;
  drift: string;
  unit: string;
  currentOrderQty: number;
  proposedSourceQty: number | null;
  proposedOrderQty: number | null;
  hasOrderLinks: boolean;
  takeoffCodes: string[];
  decision: ReturnType<typeof buildDriftDecisionPayload>;
  notes: string[];
};

export async function previewMetreDriftRevision(
  db: Db,
  input: {
    organizationId: string;
    projectId: string;
    requirementId: string;
  },
): Promise<DriftRevisionPreview> {
  const need = await db.materialRequirement.findFirst({
    where: {
      id: input.requirementId,
      organizationId: input.organizationId,
      projectId: input.projectId,
    },
    select: {
      id: true,
      label: true,
      unit: true,
      sourceDrift: true,
      takeoffCodes: true,
      prepStudyId: true,
      validatedOrderQuantity: true,
      quantityRequired: true,
      sourceQuantity: true,
      lossFactor: true,
      _count: { select: { orderLinks: true } },
    },
  });
  if (!need) throw new Error("Besoin introuvable");

  const codes = asCodeList(need.takeoffCodes);
  const studyId = need.prepStudyId;
  let proposedSourceQty: number | null = null;
  const notes: string[] = [];

  if (studyId && codes.length > 0) {
    const lines = await db.prepTakeoffLine.findMany({
      where: {
        studyId,
        organizationId: input.organizationId,
        code: { in: codes },
      },
      select: {
        code: true,
        unit: true,
        validatedQuantity: true,
        computedQuantity: true,
        declaredQuantity: true,
      },
    });
    if (lines.length === 0) {
      notes.push("Aucune ligne métré correspondante — à vérifier manuellement.");
    } else if (lines.length === 1) {
      proposedSourceQty = lineQty(lines[0]!);
    } else {
      // Somme des quantités si même unité
      const units = new Set(lines.map((l) => l.unit));
      if (units.size === 1) {
        proposedSourceQty = lines.reduce(
          (s, l) => s + (lineQty(l) ?? 0),
          0,
        );
        notes.push(
          `Plusieurs codes métré (${codes.join(", ")}) — somme proposée.`,
        );
      } else {
        notes.push(
          "Unités métré hétérogènes — proposition non calculée automatiquement.",
        );
      }
    }
  } else {
    notes.push("Besoin sans code métré lié — révision manuelle uniquement.");
  }

  const loss = n(need.lossFactor);
  let proposedOrderQty = proposedSourceQty;
  if (proposedSourceQty != null && loss != null && loss > 0) {
    proposedOrderQty = proposedSourceQty * (1 + loss);
    notes.push(`Marge perte ${(loss * 100).toFixed(1)} % appliquée à la proposition.`);
  }

  const currentOrderQty =
    n(need.validatedOrderQuantity) ?? n(need.quantityRequired) ?? 0;
  const hasOrderLinks = need._count.orderLinks > 0;

  if (hasOrderLinks) {
    notes.push(
      "Commande existante : la quantité commandée / BC ne sera jamais modifiée automatiquement.",
    );
  }

  const decision = buildDriftDecisionPayload({
    drift: need.sourceDrift as "NONE" | "METRE_CHANGED" | "METRE_CHANGED_AFTER_ORDER",
    orderedQty: currentOrderQty,
    newRequiredQty: proposedOrderQty ?? currentOrderQty,
  });

  return {
    requirementId: need.id,
    label: need.label,
    drift: need.sourceDrift,
    unit: need.unit,
    currentOrderQty,
    proposedSourceQty,
    proposedOrderQty,
    hasOrderLinks,
    takeoffCodes: codes,
    decision,
    notes,
  };
}

/**
 * Décision humaine après drift.
 * - RECALCULATE : maj qty besoin + empreinte + clear drift (interdit auto si BC sans confirm)
 * - KEEP : accepte métré sans changer qty besoin ; maj empreinte + clear drift
 * Ne touche jamais offres / BC / historique.
 */
export async function commitMetreDriftRevision(
  db: Db,
  input: {
    organizationId: string;
    projectId: string;
    requirementId: string;
    action: "RECALCULATE" | "KEEP";
    confirmQuantityWhenOrdered?: boolean;
  },
): Promise<{ ok: true; action: string }> {
  const preview = await previewMetreDriftRevision(db, input);
  const need = await db.materialRequirement.findFirst({
    where: {
      id: input.requirementId,
      organizationId: input.organizationId,
      projectId: input.projectId,
    },
    select: {
      id: true,
      takeoffCodes: true,
      prepStudyId: true,
      unit: true,
      sourceDrift: true,
      _count: { select: { orderLinks: true } },
    },
  });
  if (!need) throw new Error("Besoin introuvable");
  if (need.sourceDrift === "NONE") {
    return { ok: true, action: "NOOP" };
  }

  if (
    input.action === "RECALCULATE" &&
    preview.hasOrderLinks &&
    !input.confirmQuantityWhenOrdered
  ) {
    throw new Error(
      "Besoin déjà commandé : confirmez explicitement la révision de quantité à commander (BC inchangé).",
    );
  }
  if (
    input.action === "RECALCULATE" &&
    (preview.proposedOrderQty == null ||
      !Number.isFinite(preview.proposedOrderQty) ||
      preview.proposedOrderQty <= 0)
  ) {
    throw new Error("Proposition de quantité indisponible — saisie manuelle requise.");
  }

  // Recalcule empreinte courante
  const studyId = need.prepStudyId;
  const codes = asCodeList(need.takeoffCodes);
  let nextFp: string | null = null;
  if (studyId && codes.length > 0) {
    const study = await db.prepStudy.findFirst({
      where: { id: studyId, organizationId: input.organizationId },
      select: { version: true },
    });
    const lines = await db.prepTakeoffLine.findMany({
      where: {
        studyId,
        organizationId: input.organizationId,
        code: { in: codes },
      },
      select: {
        code: true,
        unit: true,
        validatedQuantity: true,
        computedQuantity: true,
        declaredQuantity: true,
      },
    });
    if (study && lines.length > 0) {
      nextFp = computeSourceFingerprint({
        takeoffCodes: codes,
        sourceQuantities: lines.map((l) => ({
          code: l.code,
          qty: lineQty(l) ?? 0,
          unit: l.unit || need.unit,
        })),
        studyVersion: study.version,
      });
    }
  }

  if (input.action === "KEEP") {
    await db.materialRequirement.update({
      where: { id: need.id },
      data: {
        sourceDrift: "NONE",
        ...(nextFp ? { sourceFingerprint: nextFp } : {}),
      },
    });
    return { ok: true, action: "KEEP" };
  }

  // RECALCULATE
  await db.materialRequirement.update({
    where: { id: need.id },
    data: {
      sourceDrift: "NONE",
      ...(nextFp ? { sourceFingerprint: nextFp } : {}),
      ...(preview.proposedSourceQty != null
        ? { sourceQuantity: preview.proposedSourceQty }
        : {}),
      quantityRequired: preview.proposedOrderQty!,
      validatedOrderQuantity: preview.proposedOrderQty!,
    },
  });
  return { ok: true, action: "RECALCULATE" };
}
