/**
 * Helpers preview UI add_line — purs, testables, aucune DB.
 * Ne jamais exposer JSON.stringify pour une ligne.
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
  included_services?: string[];
  technical_references?: Array<{
    label: string;
    kind: string;
    note: string | null;
  }>;
  execution_notes?: string | null;
  quality_controls?: string[];
  technical_reservations?: string[];
};

export type TechnicalNotesSections = {
  metre: string | null;
  references: string[];
  controls: string[];
  reserves: string[];
  other: string | null;
};

/** Détection robuste (op OU field+payload line). */
export function isAddLineDirectChange(c: DirectChange): boolean {
  if (c.op === "add_line") return true;
  if (c.field !== "line") return false;
  if (c.before != null) return false; // delete_line a un before
  return parseAddLineAfter(c.after) != null;
}

export function parseAddLineAfter(after: unknown): AddLinePreviewPayload | null {
  if (!after || typeof after !== "object" || Array.isArray(after)) return null;
  const o = after as Record<string, unknown>;
  const code = typeof o.code === "string" ? o.code.trim() : "";
  const lot = typeof o.lot === "string" ? o.lot.trim() : "";
  const designation =
    typeof o.designation === "string" ? o.designation.trim() : "";
  const unitRaw =
    typeof o.unit === "string"
      ? o.unit.trim()
      : typeof o.unite === "string"
        ? o.unite.trim()
        : "";
  if (!code || !designation) return null;
  const unit = unitRaw || "u";
  const qtyRaw = o.declared_quantity ?? o.declaredQuantity ?? o.quantity;
  const strList = (v: unknown): string[] =>
    Array.isArray(v)
      ? v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean)
      : [];
  const refs = (v: unknown) => {
    if (!Array.isArray(v)) return [] as AddLinePreviewPayload["technical_references"];
    const out: NonNullable<AddLinePreviewPayload["technical_references"]> = [];
    for (const item of v) {
      if (!item || typeof item !== "object") continue;
      const r = item as Record<string, unknown>;
      const label = typeof r.label === "string" ? r.label.trim() : "";
      if (!label) continue;
      out.push({
        label,
        kind: typeof r.kind === "string" ? r.kind : "INDICATIVE",
        note: typeof r.note === "string" ? r.note : null,
      });
    }
    return out;
  };
  return {
    code,
    lot: lot || "Sans lot",
    designation,
    description:
      typeof o.description === "string"
        ? o.description
        : typeof o.technical_description === "string"
          ? o.technical_description
          : null,
    unit,
    declared_quantity:
      typeof qtyRaw === "number" && Number.isFinite(qtyRaw) ? qtyRaw : null,
    formula:
      typeof o.formula === "string"
        ? o.formula
        : o.formula === null
          ? null
          : null,
    provenance: typeof o.provenance === "string" ? o.provenance : null,
    role: typeof o.role === "string" ? o.role : null,
    nature: typeof o.nature === "string" ? o.nature : null,
    notes: typeof o.notes === "string" ? o.notes : null,
    insert_after_code:
      typeof o.insert_after_code === "string"
        ? o.insert_after_code
        : typeof o.insertAfterCode === "string"
          ? o.insertAfterCode
          : null,
    included_services: strList(o.included_services ?? o.includedServices),
    technical_references: refs(o.technical_references ?? o.technicalReferences),
    execution_notes:
      typeof o.execution_notes === "string"
        ? o.execution_notes
        : typeof o.executionNotes === "string"
          ? o.executionNotes
          : o.execution_notes === null || o.executionNotes === null
            ? null
            : null,
    quality_controls: strList(o.quality_controls ?? o.qualityControls),
    technical_reservations: strList(
      o.technical_reservations ?? o.technicalReservations,
    ),
  };
}

export function isUpdateLineMetaChange(c: DirectChange): boolean {
  return c.op === "update_line" && c.field === "meta";
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

/** update_line fiche technique (pas quantité). */
export function isTechSheetUpdateChange(c: DirectChange): boolean {
  if (!isUpdateLineMetaChange(c)) return false;
  const after = c.after;
  if (!after || typeof after !== "object" || Array.isArray(after)) return false;
  const o = after as Record<string, unknown>;
  return (
    o.included_services !== undefined ||
    o.technical_references !== undefined ||
    o.execution_notes !== undefined ||
    o.quality_controls !== undefined ||
    o.technical_reservations !== undefined
  );
}

export function countTechSheetUpdates(changes: DirectChange[]): number {
  return changes.filter(isTechSheetUpdateChange).length;
}

export function summarizeTechSheetUpdateLots(
  changes: DirectChange[],
): Array<{ lot: string; count: number }> {
  const map = new Map<string, number>();
  for (const c of changes) {
    if (!isTechSheetUpdateChange(c)) continue;
    const before = c.before;
    let lot = "Sans lot";
    if (before && typeof before === "object" && !Array.isArray(before)) {
      const l = (before as { lot?: unknown }).lot;
      if (typeof l === "string" && l.trim()) lot = l.trim();
    }
    map.set(lot, (map.get(lot) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([lot, count]) => ({ lot, count }))
    .sort((a, b) => a.lot.localeCompare(b.lot, "fr"));
}

export type AddLineStats = {
  total: number;
  quote: number;
  indicator: number;
  hypothesis: number;
  calculated: number;
};

export function summarizeAddLineStats(changes: DirectChange[]): AddLineStats {
  const stats: AddLineStats = {
    total: 0,
    quote: 0,
    indicator: 0,
    hypothesis: 0,
    calculated: 0,
  };
  for (const c of changes) {
    if (!isAddLineDirectChange(c)) continue;
    const line = parseAddLineAfter(c.after);
    if (!line) continue;
    stats.total += 1;
    if (line.role === "indicator") stats.indicator += 1;
    else stats.quote += 1;
    if (line.provenance === "HYPOTHESE") stats.hypothesis += 1;
    if (line.formula) stats.calculated += 1;
  }
  return stats;
}

export function provenanceBadgeLabel(
  provenance: string | null | undefined,
): string | null {
  if (!provenance) return null;
  const map: Record<string, string> = {
    HYPOTHESE: "HYPOTHÈSE",
    RELEVE: "RELEVÉ",
    RELEVE_A_VERIFIER: "À VÉRIFIER",
    SAISIE_MANUELLE: "MANUEL",
  };
  return map[provenance] ?? provenance.replace(/_/g, " ");
}

/** quote → DEVIS (libellé métier). */
export function roleBadgeLabel(role: string | null | undefined): string | null {
  if (!role) return null;
  if (role === "quote") return "DEVIS";
  if (role === "indicator") return "INDICATEUR";
  if (role === "logistics") return "LOGISTIQUE";
  return role.toUpperCase();
}

export function natureLabel(nature: string | null | undefined): string | null {
  if (!nature) return null;
  const map: Record<string, string> = {
    en_place: "EN PLACE",
    foisonne: "FOISONNÉ",
    compacte: "COMPACTÉ",
    theorique: "THÉORIQUE",
  };
  return map[nature] ?? nature.replace(/_/g, " ").toUpperCase();
}

/** Unités affichage chantier. */
export function formatDisplayUnit(unit: string | null | undefined): string {
  if (!unit) return "";
  const u = unit.trim();
  const map: Record<string, string> = {
    m3: "m³",
    M3: "m³",
    m2: "m²",
    M2: "m²",
    "m²": "m²",
    "m³": "m³",
    ml: "ml",
    ML: "ml",
    m: "m",
    u: "u",
    U: "u",
    FT: "Forfait",
    ft: "Forfait",
    forfait: "Forfait",
  };
  return map[u] ?? u;
}

export function formatQtyFr(n: number): string {
  return Number.isInteger(n)
    ? String(n)
    : n.toLocaleString("fr-FR", { maximumFractionDigits: 4 });
}

export function formatQuantityWithUnit(
  qty: number | null | undefined,
  unit: string | null | undefined,
): string | null {
  if (qty == null || !Number.isFinite(qty)) return null;
  const u = formatDisplayUnit(unit);
  return u ? `${formatQtyFr(qty)} ${u}` : formatQtyFr(qty);
}

/** Présentation formule : × à la place de * . */
export function formatFormulaDisplay(formula: string | null | undefined): string | null {
  if (!formula?.trim()) return null;
  return formula
    .trim()
    .replace(/\*/g, " × ")
    .replace(/\s+/g, " ")
    .replace(/\s*×\s*/g, " × ");
}

/**
 * Parse visuelle des notes (MÉTRÉ / RÉFÉRENCES / CONTRÔLES / RÉSERVES).
 * Heuristique UI uniquement — ne modifie pas la donnée.
 */
export function parseTechnicalNotes(
  notes: string | null | undefined,
  opts?: { formula?: string | null; quantity?: number | null; unit?: string | null },
): TechnicalNotesSections | null {
  const references: string[] = [];
  const controls: string[] = [];
  const reserves: string[] = [];
  let metre: string | null = null;
  let other: string | null = null;

  const qtyLine = formatQuantityWithUnit(opts?.quantity ?? null, opts?.unit);
  const formulaDisp = formatFormulaDisplay(opts?.formula ?? null);
  if (formulaDisp && qtyLine) {
    metre = `${formulaDisp} = ${qtyLine}`;
  } else if (formulaDisp) {
    metre = formulaDisp;
  }

  if (!notes?.trim()) {
    if (!metre && references.length === 0) return null;
    return { metre, references, controls, reserves, other: null };
  }

  const text = notes.trim();
  const headerRe =
    /^(m[eé]tr[eé]|r[eé]f[eé]rences?|contr[oô]les?|r[eé]serves?|r[eé]serve)\s*[:\-–]?\s*/i;

  const blocks = text.split(/\n{2,}|\r\n{2,}/);
  const orphanLines: string[] = [];

  const consumeBlock = (block: string) => {
    const lines = block
      .split(/\n/)
      .map((l) => l.replace(/^[\s•\-*]+/, "").trim())
      .filter(Boolean);
    if (!lines.length) return;
    const first = lines[0]!;
    const hm = first.match(headerRe);
    if (hm) {
      const kind = hm[1]!.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
      const restFirst = first.slice(hm[0].length).trim();
      const body = [restFirst, ...lines.slice(1)].filter(Boolean);
      if (kind.startsWith("metr")) {
        if (body.length) metre = body.join(" · ");
      } else if (kind.startsWith("refer")) {
        references.push(...body);
      } else if (kind.startsWith("contr")) {
        controls.push(...body);
      } else if (kind.startsWith("reserv")) {
        reserves.push(...body);
      }
      return;
    }
    orphanLines.push(...lines);
  };

  if (blocks.length > 1) {
    for (const b of blocks) consumeBlock(b);
  } else {
    // Ligne par ligne si pas de blocs
    const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
    let mode: "metre" | "ref" | "ctrl" | "res" | "other" = "other";
    for (const line of lines) {
      const clean = line.replace(/^[\s•\-*]+/, "").trim();
      const hm = clean.match(headerRe);
      if (hm) {
        const kind = hm[1]!.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
        if (kind.startsWith("metr")) mode = "metre";
        else if (kind.startsWith("refer")) mode = "ref";
        else if (kind.startsWith("contr")) mode = "ctrl";
        else if (kind.startsWith("reserv")) mode = "res";
        const rest = clean.slice(hm[0].length).trim();
        if (rest) {
          if (mode === "metre") metre = rest;
          else if (mode === "ref") references.push(rest);
          else if (mode === "ctrl") controls.push(rest);
          else if (mode === "res") reserves.push(rest);
        }
        continue;
      }
      if (mode === "metre") metre = metre ? `${metre} · ${clean}` : clean;
      else if (mode === "ref") references.push(clean);
      else if (mode === "ctrl") controls.push(clean);
      else if (mode === "res") reserves.push(clean);
      else orphanLines.push(clean);
    }
  }

  // Extraire NF / DTU depuis orphelins
  const nfRe = /\bNF\s+[A-Z0-9][A-Z0-9\s.+\-/]*/gi;
  const kept: string[] = [];
  for (const line of orphanLines) {
    const matches = line.match(nfRe);
    if (matches?.length) {
      for (const m of matches) {
        const ref = m.trim().replace(/\s+/g, " ");
        if (!references.includes(ref)) references.push(ref);
      }
      const stripped = line.replace(nfRe, "").replace(/[·|,;]+/g, " ").trim();
      if (stripped.length > 8) kept.push(stripped);
    } else if (/contr[oô]le/i.test(line)) {
      controls.push(line.replace(/^contr[oô]les?\s*[:\-–]?\s*/i, "").trim() || line);
    } else if (/r[eé]serve/i.test(line)) {
      reserves.push(line.replace(/^r[eé]serves?\s*[:\-–]?\s*/i, "").trim() || line);
    } else {
      kept.push(line);
    }
  }
  if (kept.length) other = kept.join("\n");

  if (
    !metre &&
    !references.length &&
    !controls.length &&
    !reserves.length &&
    !other
  ) {
    return null;
  }
  return { metre, references, controls, reserves, other };
}
