/**
 * CTX-02B — Opérations VISIT supportées au commit universel.
 * Sous-ensemble conservateur : champs texte SiteVisit uniquement.
 * Mesures / médias / status / add-remove = UNSUPPORTED.
 */
import type { Prisma } from "@prisma/client";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import {
  computeVisitContextVersion,
  type VisitContextVersionInput,
} from "@/lib/bework-context/visit-context-version";

export const VISIT_COMMIT_SUPPORTED_OPS = [
  "update_visit",
  "update_measurement",
  "add_measurement",
] as const;

export type VisitCommitSupportedOp =
  (typeof VISIT_COMMIT_SUPPORTED_OPS)[number];

export function isVisitCommitSupportedOp(
  op: string,
): op is VisitCommitSupportedOp {
  return (VISIT_COMMIT_SUPPORTED_OPS as readonly string[]).includes(op);
}

/** Ops catalogue VISIT non commitables. */
export const VISIT_COMMIT_UNSUPPORTED_OPS = [
  "update_parameter",
  "update_progress",
] as const;

/** Whitelist stricte — jamais d’injection Prisma directe de changes. */
export const VISIT_UPDATE_ALLOWED_FIELDS = [
  "subject",
  "client_need",
  "comments",
  "findings",
  "proposed_works",
  "commercial",
  "constraints",
  "field_notes",
] as const;

export type VisitUpdateAllowedField =
  (typeof VISIT_UPDATE_ALLOWED_FIELDS)[number];

const MAX_SUBJECT = 200;
const MAX_TEXT = 8000;

function assertText(
  field: string,
  value: string,
  max: number,
): void {
  if (value.length > max) {
    throw Object.assign(
      new Error(`Champ ${field} trop long (max ${max}).`),
      { code: "INVALID_FIELD" },
    );
  }
}

export function visitRowToVersionInput(row: {
  id: string;
  subject: string;
  status: string;
  clientName: string;
  siteAddress: string;
  clientNeed: string | null;
  comments: string | null;
  measurements: Array<{
    id: string;
    zone: string | null;
    label: string;
    measureType: string;
    unit: string;
    lengthM: { toNumber(): number } | number | null;
    widthM: { toNumber(): number } | number | null;
    heightM: { toNumber(): number } | number | null;
    quantityValue: { toNumber(): number } | number | null;
    computedQuantity: { toNumber(): number } | number;
    lot: string | null;
    observation: string | null;
  }>;
  medias: Array<{
    id: string;
    name: string;
    kind: string;
    category: string | null;
    observation: string | null;
    fileUrl: string | null;
    storagePath: string | null;
  }>;
}): VisitContextVersionInput {
  const num = (v: { toNumber(): number } | number | null | undefined): number | null => {
    if (v == null) return null;
    return typeof v === "number" ? v : v.toNumber();
  };
  return {
    id: row.id,
    subject: row.subject,
    status: row.status,
    clientName: row.clientName,
    siteAddress: row.siteAddress,
    clientNeed: row.clientNeed,
    comments: row.comments,
    measurements: row.measurements.map((m) => ({
      id: m.id,
      zone: m.zone,
      label: m.label,
      measureType: m.measureType,
      unit: m.unit,
      lengthM: num(m.lengthM),
      widthM: num(m.widthM),
      heightM: num(m.heightM),
      quantityValue: num(m.quantityValue),
      computedQuantity: num(m.computedQuantity) ?? 0,
      lot: m.lot,
      observation: m.observation,
    })),
    mediaRefs: row.medias.map((m) => ({
      id: m.id,
      name: m.name,
      kind: m.kind,
      category: m.category,
      observation: m.observation,
      hasUrl: Boolean(m.fileUrl || m.storagePath),
    })),
  };
}

const visitSelectForVersion = {
  id: true,
  subject: true,
  status: true,
  clientName: true,
  siteAddress: true,
  clientNeed: true,
  comments: true,
  organizationId: true,
  projectId: true,
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
} as const;

/**
 * Applique un patch VISIT local dans une transaction.
 * - Vérifie org / project / version CTX-07 (base_version)
 * - Whitelist subject / client_need / comments
 * - Ne touche PAS mesures, médias, status, ownership
 * - Recalcule versionAfter depuis l’état DB réel
 */
export async function applyVisitDirectInTx(
  tx: Prisma.TransactionClient,
  input: {
    orgId: string;
    projectId?: string | null;
    patch: BeworkPatchV1;
    expectedVersion: number;
  },
): Promise<{
  updated: boolean;
  visitId: string;
  versionBefore: number;
  versionAfter: number;
}> {
  const visitId = input.patch.origin.entity_id;
  const visit = await tx.siteVisit.findFirst({
    where: {
      id: visitId,
      organizationId: input.orgId,
    },
    select: visitSelectForVersion,
  });
  if (!visit) {
    throw Object.assign(new Error("Visite introuvable"), {
      code: "TARGET_NOT_FOUND",
    });
  }
  const targetProject = input.projectId?.trim() || null;
  if (targetProject && visit.projectId && visit.projectId !== targetProject) {
    throw Object.assign(
      new Error("Visite hors projet ciblé — commit refusé."),
      { code: "PROJECT_MISMATCH" },
    );
  }

  const versionInputBefore = visitRowToVersionInput(visit);
  const versionBefore = computeVisitContextVersion(versionInputBefore);
  if (versionBefore !== input.expectedVersion) {
    throw Object.assign(
      new Error(
        "La visite a été modifiée depuis la génération de ce patch. Copiez un nouveau contexte et recommencez.",
      ),
      { code: "PREVIEW_STALE" },
    );
  }
  if (input.patch.origin.base_version !== versionBefore) {
    throw Object.assign(
      new Error(
        "La visite a été modifiée depuis la génération de ce patch. Copiez un nouveau contexte et recommencez.",
      ),
      { code: "VERSION_CONFLICT" },
    );
  }

  const data: Prisma.SiteVisitUpdateInput = {};
  let touched = false;
  const measurementOps: Array<
    | { kind: "update"; measurementId: string; changes: Record<string, unknown> }
    | {
        kind: "add";
        measurement: {
          label: string;
          unit: string;
          length_m?: number | null;
          width_m?: number | null;
          height_m?: number | null;
          quantity_value?: number | null;
          observation?: string | null;
        };
      }
  > = [];

  for (const op of input.patch.operations) {
    if (!isVisitCommitSupportedOp(op.op)) {
      throw Object.assign(
        new Error(`Opération ${op.op} non supportée pour le commit VISIT.`),
        { code: "OPERATION_NOT_ALLOWED_FOR_SECTION" },
      );
    }

    if (op.op === "update_measurement") {
      const mid = op.target.measurement_id ?? op.target.id;
      if (!mid) {
        throw Object.assign(new Error("measurement_id requis"), {
          code: "INVALID_TARGET",
        });
      }
      // Protection : ne pas inventer de cote absente si toutes null
      const ch = op.changes;
      const hasDim =
        ch.length_m != null ||
        ch.width_m != null ||
        ch.height_m != null ||
        ch.quantity_value != null ||
        ch.label != null ||
        ch.observation != null ||
        ch.unit != null;
      if (!hasDim) continue;
      measurementOps.push({ kind: "update", measurementId: mid, changes: ch });
      touched = true;
      continue;
    }

    if (op.op === "add_measurement") {
      const m = op.measurement;
      if (
        m.quantity_value == null &&
        m.length_m == null &&
        m.width_m == null &&
        m.height_m == null
      ) {
        // Pas d'invention : mesure sans cote → ignorée (à confirmer côté preview)
        continue;
      }
      measurementOps.push({ kind: "add", measurement: m });
      touched = true;
      continue;
    }

    if (op.op !== "update_visit") continue;

    const targetVisitId = op.target.visit_id ?? op.target.id;
    if (targetVisitId && targetVisitId !== visit.id) {
      throw Object.assign(
        new Error("Cible hors visite — commit refusé."),
        { code: "PROJECT_MISMATCH" },
      );
    }

    const changes = op.changes;
    const keys = Object.keys(changes).filter(
      (k) => (changes as Record<string, unknown>)[k] !== undefined,
    );
    for (const key of keys) {
      if (
        !(VISIT_UPDATE_ALLOWED_FIELDS as readonly string[]).includes(key)
      ) {
        throw Object.assign(
          new Error(`Champ « ${key} » non autorisé pour update_visit.`),
          { code: "INVALID_FIELD" },
        );
      }
    }

    if (changes.subject !== undefined) {
      assertText("subject", changes.subject, MAX_SUBJECT);
      if (!changes.subject.trim()) {
        throw Object.assign(new Error("subject ne peut pas être vide."), {
          code: "INVALID_FIELD",
        });
      }
      data.subject = changes.subject.trim();
      touched = true;
    }
    if (changes.client_need !== undefined) {
      if (changes.client_need !== null) {
        assertText("client_need", changes.client_need, MAX_TEXT);
      }
      data.clientNeed = changes.client_need;
      touched = true;
    }
    if (changes.comments !== undefined) {
      if (changes.comments !== null) {
        assertText("comments", changes.comments, MAX_TEXT);
      }
      data.comments = changes.comments;
      touched = true;
    }
    if (changes.findings !== undefined) {
      data.findingsJson = changes.findings as Prisma.InputJsonValue;
      touched = true;
    }
    if (changes.proposed_works !== undefined) {
      data.proposedWorksJson = changes.proposed_works as Prisma.InputJsonValue;
      touched = true;
    }
    if (changes.commercial !== undefined) {
      data.commercialJson = changes.commercial as Prisma.InputJsonValue;
      touched = true;
    }
    if (changes.constraints !== undefined) {
      data.constraintsJson = changes.constraints as Prisma.InputJsonValue;
      touched = true;
    }
    if (changes.field_notes !== undefined) {
      const existingPrep =
        (await tx.siteVisit.findFirst({
          where: { id: visit.id },
          select: { prepJson: true },
        }))?.prepJson ?? {};
      const prepObj =
        existingPrep && typeof existingPrep === "object" && !Array.isArray(existingPrep)
          ? { ...(existingPrep as Record<string, unknown>) }
          : {};
      prepObj.fieldNotes = changes.field_notes;
      data.prepJson = prepObj as Prisma.InputJsonValue;
      touched = true;
    }
  }

  if (!touched) {
    throw Object.assign(new Error("Aucune modification visite applicable."), {
      code: "EMPTY_OPERATIONS",
    });
  }

  if (Object.keys(data).length > 0) {
    await tx.siteVisit.update({
      where: { id: visit.id },
      data,
    });
  }

  for (const mop of measurementOps) {
    if (mop.kind === "add") {
      const m = mop.measurement;
      const qty =
        m.quantity_value ??
        (m.length_m != null && m.width_m != null
          ? m.length_m * m.width_m
          : m.length_m ?? m.width_m ?? m.height_m ?? 0);
      await tx.siteVisitMeasurement.create({
        data: {
          visitId: visit.id,
          organizationId: input.orgId,
          label: m.label,
          unit: m.unit,
          measureType: "FREE",
          lengthM: m.length_m ?? null,
          widthM: m.width_m ?? null,
          heightM: m.height_m ?? null,
          quantityValue: m.quantity_value ?? null,
          computedQuantity: qty,
          observation: m.observation ?? null,
        },
      });
    } else {
      const existing = await tx.siteVisitMeasurement.findFirst({
        where: {
          id: mop.measurementId,
          visitId: visit.id,
          organizationId: input.orgId,
        },
      });
      if (!existing) {
        throw Object.assign(new Error("Mesure introuvable"), {
          code: "TARGET_NOT_FOUND",
        });
      }
      // Ne pas écraser silencieusement une mesure terrain par des nulls
      const ch = mop.changes;
      const nextLen =
        ch.length_m !== undefined ? (ch.length_m as number | null) : existing.lengthM;
      const nextWid =
        ch.width_m !== undefined ? (ch.width_m as number | null) : existing.widthM;
      const nextHei =
        ch.height_m !== undefined ? (ch.height_m as number | null) : existing.heightM;
      const nextQty =
        ch.quantity_value !== undefined
          ? (ch.quantity_value as number | null)
          : existing.quantityValue;
      const computed =
        nextQty != null
          ? Number(nextQty)
          : nextLen != null && nextWid != null
            ? Number(nextLen) * Number(nextWid)
            : Number(existing.computedQuantity);
      await tx.siteVisitMeasurement.update({
        where: { id: existing.id },
        data: {
          label:
            typeof ch.label === "string" ? ch.label : existing.label,
          unit: typeof ch.unit === "string" ? ch.unit : existing.unit,
          lengthM: nextLen,
          widthM: nextWid,
          heightM: nextHei,
          quantityValue: nextQty,
          computedQuantity: computed,
          observation:
            ch.observation !== undefined
              ? (ch.observation as string | null)
              : existing.observation,
        },
      });
    }
  }

  const after = await tx.siteVisit.findFirst({
    where: { id: visit.id, organizationId: input.orgId },
    select: visitSelectForVersion,
  });
  if (!after) {
    throw Object.assign(new Error("Visite introuvable après écriture"), {
      code: "TARGET_NOT_FOUND",
    });
  }
  const versionAfter = computeVisitContextVersion(visitRowToVersionInput(after));
  if (versionAfter === versionBefore) {
    throw Object.assign(
      new Error("Aucune modification effective de la visite."),
      { code: "EMPTY_OPERATIONS" },
    );
  }

  return {
    updated: true,
    visitId: visit.id,
    versionBefore,
    versionAfter,
  };
}
