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

export const VISIT_COMMIT_SUPPORTED_OPS = ["update_visit"] as const;

export type VisitCommitSupportedOp =
  (typeof VISIT_COMMIT_SUPPORTED_OPS)[number];

export function isVisitCommitSupportedOp(
  op: string,
): op is VisitCommitSupportedOp {
  return (VISIT_COMMIT_SUPPORTED_OPS as readonly string[]).includes(op);
}

/** Ops catalogue VISIT non commitables CTX-02B. */
export const VISIT_COMMIT_UNSUPPORTED_OPS = [
  "update_measurement",
  "add_measurement",
  "update_parameter",
  "update_progress",
] as const;

/** Whitelist stricte — jamais d’injection Prisma directe de changes. */
export const VISIT_UPDATE_ALLOWED_FIELDS = [
  "subject",
  "client_need",
  "comments",
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
    projectId: string;
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
  if (visit.projectId && visit.projectId !== input.projectId) {
    throw Object.assign(
      new Error("Visite hors projet ciblé — commit refusé."),
      { code: "PROJECT_MISMATCH" },
    );
  }
  if (!visit.projectId) {
    throw Object.assign(
      new Error("Visite sans projet rattaché — commit patch refusé."),
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

  for (const op of input.patch.operations) {
    if (!isVisitCommitSupportedOp(op.op)) {
      throw Object.assign(
        new Error(`Opération ${op.op} non supportée pour le commit VISIT.`),
        { code: "OPERATION_NOT_ALLOWED_FOR_SECTION" },
      );
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
  }

  if (!touched) {
    throw Object.assign(new Error("Aucune modification visite applicable."), {
      code: "EMPTY_OPERATIONS",
    });
  }

  await tx.siteVisit.update({
    where: { id: visit.id },
    data,
  });

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
