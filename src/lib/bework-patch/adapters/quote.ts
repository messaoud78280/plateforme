/**
 * Adapter : bework_patch_v1 → bework_quote_patch_v1 (délégation sûre).
 * Aucune écriture — conversion pure pour le moteur devis existant.
 */
import { BEWORK_QUOTE_PATCH_FORMAT } from "@/lib/commercial/chatgpt-patch/types";
import type { BeworkQuotePatchV1, PatchOperation } from "@/lib/commercial/chatgpt-patch/types";
import { err, warn, type BeworkPatchIssue } from "@/lib/bework-patch/errors";
import type { BeworkPatchV1 } from "@/lib/bework-patch/types";

export type QuoteDelegateResult =
  | { ok: true; quotePatch: BeworkQuotePatchV1; warnings: BeworkPatchIssue[] }
  | { ok: false; errors: BeworkPatchIssue[]; warnings: BeworkPatchIssue[] };

const QUOTE_OPS = new Set([
  "update_quote_item",
  "add_quote_item",
  "delete_quote_item",
  "update_quote_section",
  "update_quote_meta",
]);

export function canDelegateToQuotePatch(patch: BeworkPatchV1): boolean {
  return patch.operations.every((op) => QUOTE_OPS.has(op.op));
}

/**
 * Convertit un patch universel (ops devis uniquement) vers bework_quote_patch_v1.
 */
export function toLegacyQuotePatch(patch: BeworkPatchV1): QuoteDelegateResult {
  const warnings: BeworkPatchIssue[] = [
    warn(
      "LEGACY_PATCH_DELEGATED",
      "$",
      "Délégation vers le moteur bework_quote_patch_v1 existant",
    ),
  ];
  const errors: BeworkPatchIssue[] = [];

  if (!canDelegateToQuotePatch(patch)) {
    errors.push(
      err(
        "UNKNOWN_OPERATION",
        "operations",
        "Le patch contient des opérations hors devis — délégation quote impossible",
      ),
    );
    return { ok: false, errors, warnings };
  }

  const operations: PatchOperation[] = [];
  for (const op of patch.operations) {
    if (op.op === "update_quote_item") {
      const itemId = op.target.item_id ?? op.target.id;
      if (!itemId) {
        errors.push(err("INVALID_TARGET", "target.item_id", "item_id manquant"));
        continue;
      }
      operations.push({
        op: "update_item",
        itemId,
        changes: {
          designation: op.changes.designation,
          description: op.changes.description,
          quantity: op.changes.quantity,
          unit: op.changes.unit,
          unitPriceHt: op.changes.unit_price_ht,
          vatRate: op.changes.vat_rate,
          discountPercent: op.changes.discount_percent,
        },
      });
    } else if (op.op === "add_quote_item") {
      operations.push({
        op: "add_item",
        sectionId: op.section_id ?? op.target.section_id,
        sectionTitle: op.section_title,
        item: {
          itemId: op.item.item_id,
          designation: op.item.designation,
          description: op.item.description,
          quantity: op.item.quantity,
          unit: op.item.unit,
          unitPriceHt: op.item.unit_price_ht,
          vatRate: op.item.vat_rate,
          discountPercent: op.item.discount_percent,
        },
      });
    } else if (op.op === "delete_quote_item") {
      operations.push({
        op: "delete_item",
        itemId: op.target.item_id ?? op.target.id,
      });
    } else if (op.op === "update_quote_section") {
      operations.push({
        op: "update_section",
        sectionId: op.target.section_id ?? op.target.id,
        title: op.changes.title,
      });
    } else if (op.op === "update_quote_meta") {
      operations.push({
        op: "update_quote",
        changes: {
          subject: op.changes.subject,
          clientNotes: op.changes.client_notes,
          internalNotes: op.changes.internal_notes,
          paymentTerms: op.changes.payment_terms,
        },
      });
    }
  }

  if (errors.length || !operations.length) {
    return { ok: false, errors, warnings };
  }

  // Le moteur historique attend quoteNumber — fourni via origin/entity si code, sinon placeholder
  // L’appelant doit enrichir quoteNumber avant commit legacy.
  const quotePatch: BeworkQuotePatchV1 = {
    type: BEWORK_QUOTE_PATCH_FORMAT,
    patchId: patch.patch_id,
    target: {
      quoteNumber: patch.origin.entity_id,
      baseVersion: patch.origin.base_version,
    },
    operations,
  };

  return { ok: true, quotePatch, warnings };
}
