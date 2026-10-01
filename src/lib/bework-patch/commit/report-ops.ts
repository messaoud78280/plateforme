/**
 * CTX-02D — Opérations REPORT supportées au commit universel.
 * Sous-ensemble conservateur : title, quick_notes, summary, additional_notes.
 * Sections JSON, médias, status, PDF = UNSUPPORTED.
 * kind doit être COMPTE_RENDU (jamais NOTICE/PPSPS).
 */
import type { Prisma } from "@prisma/client";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import {
  computeReportContextVersion,
  type ReportContextVersionInput,
} from "@/lib/bework-context/report-context-version";

export const REPORT_COMMIT_SUPPORTED_OPS = ["update_report"] as const;

export type ReportCommitSupportedOp =
  (typeof REPORT_COMMIT_SUPPORTED_OPS)[number];

export function isReportCommitSupportedOp(
  op: string,
): op is ReportCommitSupportedOp {
  return (REPORT_COMMIT_SUPPORTED_OPS as readonly string[]).includes(op);
}

export const REPORT_COMMIT_UNSUPPORTED_OPS = [
  "update_document_section",
  "add_document_section",
  "update_text",
] as const;

/** Whitelist stricte. */
export const REPORT_UPDATE_ALLOWED_FIELDS = [
  "title",
  "quick_notes",
  "summary",
  "additional_notes",
] as const;

const MAX_TITLE = 200;
const MAX_TEXT = 20000;

export function docToVersionInput(row: {
  id: string;
  kind: string;
  title: string;
  status: string;
  quickNotes: string | null;
  payloadJson: unknown;
}): ReportContextVersionInput {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    status: row.status,
    quickNotes: row.quickNotes,
    payload: row.payloadJson,
  };
}

function assertText(field: string, value: string, max: number): void {
  if (value.length > max) {
    throw Object.assign(
      new Error(`Champ ${field} trop long (max ${max}).`),
      { code: "INVALID_FIELD" },
    );
  }
}

function asPayloadObject(
  raw: unknown,
): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return { ...(raw as Record<string, unknown>) };
  }
  return {};
}

/**
 * Applique un patch REPORT local dans une transaction.
 * - kind === COMPTE_RENDU obligatoire
 * - Whitelist title / quick_notes / summary / additional_notes
 * - Ne touche PAS status, médias, PDF, sections array, notice
 */
export async function applyReportDirectInTx(
  tx: Prisma.TransactionClient,
  input: {
    orgId: string;
    projectId: string;
    patch: BeworkPatchV1;
    expectedVersion: number;
  },
): Promise<{
  updated: boolean;
  documentId: string;
  versionBefore: number;
  versionAfter: number;
}> {
  const documentId = input.patch.origin.entity_id;
  const doc = await tx.siteDocument.findFirst({
    where: {
      id: documentId,
      organizationId: input.orgId,
      projectId: input.projectId,
    },
    select: {
      id: true,
      kind: true,
      title: true,
      status: true,
      quickNotes: true,
      payloadJson: true,
    },
  });
  if (!doc) {
    throw Object.assign(new Error("Compte rendu introuvable"), {
      code: "TARGET_NOT_FOUND",
    });
  }
  if (doc.kind !== "COMPTE_RENDU") {
    throw Object.assign(
      new Error(
        "Document hors type COMPTE_RENDU — commit REPORT refusé.",
      ),
      { code: "PROJECT_MISMATCH" },
    );
  }

  const versionBefore = computeReportContextVersion(docToVersionInput(doc));
  if (versionBefore !== input.expectedVersion) {
    throw Object.assign(
      new Error(
        "Le compte rendu a été modifié depuis la génération de ce patch. Copiez un nouveau contexte et recommencez.",
      ),
      { code: "PREVIEW_STALE" },
    );
  }
  if (input.patch.origin.base_version !== versionBefore) {
    throw Object.assign(
      new Error(
        "Le compte rendu a été modifié depuis la génération de ce patch. Copiez un nouveau contexte et recommencez.",
      ),
      { code: "VERSION_CONFLICT" },
    );
  }

  const data: Prisma.SiteDocumentUpdateInput = {};
  let payload = asPayloadObject(doc.payloadJson);
  let payloadTouched = false;
  let touched = false;

  for (const op of input.patch.operations) {
    if (!isReportCommitSupportedOp(op.op)) {
      throw Object.assign(
        new Error(`Opération ${op.op} non supportée pour le commit REPORT.`),
        { code: "OPERATION_NOT_ALLOWED_FOR_SECTION" },
      );
    }
    if (op.op !== "update_report") continue;

    const targetId = op.target.document_id ?? op.target.id;
    if (targetId && targetId !== doc.id) {
      throw Object.assign(
        new Error("Cible hors compte rendu — commit refusé."),
        { code: "PROJECT_MISMATCH" },
      );
    }

    const changes = op.changes;
    const keys = Object.keys(changes).filter(
      (k) => (changes as Record<string, unknown>)[k] !== undefined,
    );
    for (const key of keys) {
      if (
        !(REPORT_UPDATE_ALLOWED_FIELDS as readonly string[]).includes(key)
      ) {
        throw Object.assign(
          new Error(`Champ « ${key} » non autorisé pour update_report.`),
          { code: "INVALID_FIELD" },
        );
      }
    }

    if (changes.title !== undefined) {
      assertText("title", changes.title, MAX_TITLE);
      if (!changes.title.trim()) {
        throw Object.assign(new Error("title ne peut pas être vide."), {
          code: "INVALID_FIELD",
        });
      }
      const t = changes.title.trim();
      data.title = t;
      payload = { ...payload, title: t };
      payloadTouched = true;
      touched = true;
    }
    if (changes.quick_notes !== undefined) {
      if (changes.quick_notes !== null) {
        assertText("quick_notes", changes.quick_notes, MAX_TEXT);
      }
      data.quickNotes = changes.quick_notes;
      touched = true;
    }
    if (changes.summary !== undefined) {
      if (changes.summary !== null) {
        assertText("summary", changes.summary, MAX_TEXT);
      }
      payload = { ...payload, summary: changes.summary };
      payloadTouched = true;
      touched = true;
    }
    if (changes.additional_notes !== undefined) {
      if (changes.additional_notes !== null) {
        assertText("additional_notes", changes.additional_notes, MAX_TEXT);
      }
      payload = { ...payload, additionalNotes: changes.additional_notes };
      payloadTouched = true;
      touched = true;
    }
  }

  if (!touched) {
    throw Object.assign(
      new Error("Aucune modification compte rendu applicable."),
      { code: "EMPTY_OPERATIONS" },
    );
  }

  if (payloadTouched) {
    data.payloadJson = payload as Prisma.InputJsonValue;
  }

  await tx.siteDocument.update({
    where: { id: doc.id },
    data,
  });

  const after = await tx.siteDocument.findFirst({
    where: {
      id: doc.id,
      organizationId: input.orgId,
      projectId: input.projectId,
      kind: "COMPTE_RENDU",
    },
    select: {
      id: true,
      kind: true,
      title: true,
      status: true,
      quickNotes: true,
      payloadJson: true,
    },
  });
  if (!after) {
    throw Object.assign(new Error("Compte rendu introuvable après écriture"), {
      code: "TARGET_NOT_FOUND",
    });
  }

  const versionAfter = computeReportContextVersion(docToVersionInput(after));
  if (versionAfter === versionBefore) {
    throw Object.assign(
      new Error("Aucune modification effective du compte rendu."),
      { code: "EMPTY_OPERATIONS" },
    );
  }

  return {
    updated: true,
    documentId: doc.id,
    versionBefore,
    versionAfter,
  };
}
