/**
 * Helpers preview UI add_line — purs, testables, aucune DB.
 */
import type { DirectChange } from "@/lib/bework-patch/impact/types";

export type AddLinePreviewPayload = {
  code: string;
  lot: string;
  designation: string;
  description?: string | null;
  unit: string;
  declared_quantity?: number | null;
  formula?: string | null;
  provenance?: string | null;
  role?: string | null;
  nature?: string | null;
  notes?: string | null;
  insert_after_code?: string | null;
};

export function isAddLineDirectChange(c: DirectChange): boolean {
  return c.op === "add_line";
}

export function parseAddLineAfter(after: unknown): AddLinePreviewPayload | null {
  if (!after || typeof after !== "object" || Array.isArray(after)) return null;
  const o = after as Record<string, unknown>;
  const code = typeof o.code === "string" ? o.code.trim() : "";
  const lot = typeof o.lot === "string" ? o.lot.trim() : "";
  const designation =
    typeof o.designation === "string" ? o.designation.trim() : "";
  const unit = typeof o.unit === "string" ? o.unit.trim() : "";
  if (!code || !designation || !unit) return null;
  return {
    code,
    lot: lot || "Sans lot",
    designation,
    description:
      typeof o.description === "string"
        ? o.description
        : o.description === null
          ? null
          : null,
    unit,
    declared_quantity:
      typeof o.declared_quantity === "number" && Number.isFinite(o.declared_quantity)
        ? o.declared_quantity
        : o.declared_quantity === null
          ? null
          : null,
    formula: typeof o.formula === "string" ? o.formula : o.formula === null ? null : null,
    provenance: typeof o.provenance === "string" ? o.provenance : null,
    role: typeof o.role === "string" ? o.role : null,
    nature: typeof o.nature === "string" ? o.nature : null,
    notes: typeof o.notes === "string" ? o.notes : o.notes === null ? null : null,
    insert_after_code:
      typeof o.insert_after_code === "string" ? o.insert_after_code : null,
  };
}

export function summarizeAddLineLots(
  changes: DirectChange[],
): Array<{ lot: string; count: number }> {
  const map = new Map<string, number>();
  for (const c of changes) {
    if (!isAddLineDirectChange(c)) continue;
    const line = parseAddLineAfter(c.after);
    const lot = line?.lot?.trim() || "Sans lot";
    map.set(lot, (map.get(lot) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([lot, count]) => ({ lot, count }))
    .sort((a, b) => a.lot.localeCompare(b.lot, "fr"));
}

export function countAddLines(changes: DirectChange[]): number {
  return changes.filter(isAddLineDirectChange).length;
}

export function provenanceBadgeLabel(provenance: string | null | undefined): string | null {
  if (!provenance) return null;
  const map: Record<string, string> = {
    HYPOTHESE: "HYPOTHÈSE",
    RELEVE: "RELEVÉ",
    RELEVE_A_VERIFIER: "À VÉRIFIER",
    SAISIE_MANUELLE: "MANUEL",
  };
  return map[provenance] ?? provenance.replace(/_/g, " ");
}

export function roleBadgeLabel(role: string | null | undefined): string | null {
  if (!role) return null;
  return role.toUpperCase();
}
