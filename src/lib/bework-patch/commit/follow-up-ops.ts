/**
 * CTX-02C — Opérations FOLLOW_UP supportées au commit universel.
 * Sous-ensemble conservateur : title + notes sur FollowUpSheet uniquement.
 * Status / avancement / dates / timeline / médias = UNSUPPORTED.
 */
import type { Prisma } from "@prisma/client";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";
import {
  computeFollowUpContextVersion,
  type FollowUpContextVersionInput,
} from "@/lib/bework-context/follow-up-context-version";

export const FOLLOW_UP_COMMIT_SUPPORTED_OPS = ["update_follow_up"] as const;

export type FollowUpCommitSupportedOp =
  (typeof FOLLOW_UP_COMMIT_SUPPORTED_OPS)[number];

export function isFollowUpCommitSupportedOp(
  op: string,
): op is FollowUpCommitSupportedOp {
  return (FOLLOW_UP_COMMIT_SUPPORTED_OPS as readonly string[]).includes(op);
}

export const FOLLOW_UP_COMMIT_UNSUPPORTED_OPS = [
  "update_progress",
  "update_text",
  "update_parameter",
] as const;

/** Whitelist stricte — jamais d’injection Prisma directe de changes. */
export const FOLLOW_UP_UPDATE_ALLOWED_FIELDS = ["title", "notes"] as const;

const MAX_TITLE = 200;
const MAX_NOTES = 8000;

export function sheetToVersionInput(row: {
  id: string;
  title: string;
  status: string;
  notes: string | null;
  prepSchedulePlanId: string | null;
}): FollowUpContextVersionInput {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    notes: row.notes,
    prepSchedulePlanId: row.prepSchedulePlanId,
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

/**
 * Applique un patch FOLLOW_UP local dans une transaction.
 * - Sheet FollowUpSheet uniquement (pas le fallback planning_suivi)
 * - Vérifie org / project / version déterministe CTX-02C
 * - Whitelist title / notes
 */
export async function applyFollowUpDirectInTx(
  tx: Prisma.TransactionClient,
  input: {
    orgId: string;
    projectId: string;
    patch: BeworkPatchV1;
    expectedVersion: number;
  },
): Promise<{
  updated: boolean;
  sheetId: string;
  versionBefore: number;
  versionAfter: number;
}> {
  const sheetId = input.patch.origin.entity_id;
  const sheet = await tx.followUpSheet.findFirst({
    where: {
      id: sheetId,
      organizationId: input.orgId,
      projectId: input.projectId,
    },
    select: {
      id: true,
      title: true,
      status: true,
      notes: true,
      prepSchedulePlanId: true,
    },
  });
  if (!sheet) {
    throw Object.assign(new Error("Fiche de suivi introuvable"), {
      code: "TARGET_NOT_FOUND",
    });
  }

  const versionBefore = computeFollowUpContextVersion(
    sheetToVersionInput(sheet),
  );
  if (versionBefore !== input.expectedVersion) {
    throw Object.assign(
      new Error(
        "Le suivi a été modifié depuis la génération de ce patch. Copiez un nouveau contexte et recommencez.",
      ),
      { code: "PREVIEW_STALE" },
    );
  }
  if (input.patch.origin.base_version !== versionBefore) {
    throw Object.assign(
      new Error(
        "Le suivi a été modifié depuis la génération de ce patch. Copiez un nouveau contexte et recommencez.",
      ),
      { code: "VERSION_CONFLICT" },
    );
  }

  const data: Prisma.FollowUpSheetUpdateInput = {};
  let touched = false;

  for (const op of input.patch.operations) {
    if (!isFollowUpCommitSupportedOp(op.op)) {
      throw Object.assign(
        new Error(`Opération ${op.op} non supportée pour le commit FOLLOW_UP.`),
        { code: "OPERATION_NOT_ALLOWED_FOR_SECTION" },
      );
    }
    if (op.op !== "update_follow_up") continue;

    const targetId = op.target.sheet_id ?? op.target.id;
    if (targetId && targetId !== sheet.id) {
      throw Object.assign(
        new Error("Cible hors fiche de suivi — commit refusé."),
        { code: "PROJECT_MISMATCH" },
      );
    }

    const changes = op.changes;
    const keys = Object.keys(changes).filter(
      (k) => (changes as Record<string, unknown>)[k] !== undefined,
    );
    for (const key of keys) {
      if (
        !(FOLLOW_UP_UPDATE_ALLOWED_FIELDS as readonly string[]).includes(key)
      ) {
        throw Object.assign(
          new Error(`Champ « ${key} » non autorisé pour update_follow_up.`),
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
      data.title = changes.title.trim();
      touched = true;
    }
    if (changes.notes !== undefined) {
      if (changes.notes !== null) {
        assertText("notes", changes.notes, MAX_NOTES);
      }
      data.notes = changes.notes;
      touched = true;
    }
  }

  if (!touched) {
    throw Object.assign(new Error("Aucune modification suivi applicable."), {
      code: "EMPTY_OPERATIONS",
    });
  }

  await tx.followUpSheet.update({
    where: { id: sheet.id },
    data,
  });

  const after = await tx.followUpSheet.findFirst({
    where: {
      id: sheet.id,
      organizationId: input.orgId,
      projectId: input.projectId,
    },
    select: {
      id: true,
      title: true,
      status: true,
      notes: true,
      prepSchedulePlanId: true,
    },
  });
  if (!after) {
    throw Object.assign(new Error("Fiche introuvable après écriture"), {
      code: "TARGET_NOT_FOUND",
    });
  }

  const versionAfter = computeFollowUpContextVersion(
    sheetToVersionInput(after),
  );
  if (versionAfter === versionBefore) {
    throw Object.assign(
      new Error("Aucune modification effective de la fiche de suivi."),
      { code: "EMPTY_OPERATIONS" },
    );
  }

  return {
    updated: true,
    sheetId: sheet.id,
    versionBefore,
    versionAfter,
  };
}
