import {
  asString,
  normalizeMoneyOrQty,
  normalizeUnit,
  stripCodeFences,
} from "@/lib/commercial/chatgpt-bundle/normalize";
import {
  BEWORK_QUOTE_PATCH_FORMAT,
  type BeworkQuotePatchV1,
  type PatchItemChanges,
  type PatchItemPayload,
  type PatchOperation,
  type PatchParseIssue,
  type PatchParseResult,
  type PatchQuoteChanges,
} from "@/lib/commercial/chatgpt-patch/types";

function issue(
  path: string,
  message: string,
  severity: "error" | "warn" = "error",
): PatchParseIssue {
  return { path, message, severity };
}

function parseItemPayload(
  raw: unknown,
  path: string,
  issues: PatchParseIssue[],
): PatchItemPayload | null {
  if (!raw || typeof raw !== "object") {
    issues.push(issue(path, "Objet item requis"));
    return null;
  }
  const o = raw as Record<string, unknown>;
  const designation = asString(o.designation ?? o.title ?? o.label);
  if (!designation) {
    issues.push(issue(`${path}.designation`, "Désignation requise"));
    return null;
  }
  const qty = normalizeMoneyOrQty(o.quantity ?? o.qty ?? o.qte);
  if (qty == null || !Number.isFinite(qty) || qty < 0) {
    issues.push(issue(`${path}.quantity`, "Quantité invalide"));
    return null;
  }
  const price = normalizeMoneyOrQty(
    o.unit_price_ht ?? o.unitPriceHt ?? o.unit_sell_ht ?? o.price_ht ?? o.prix,
  );
  if (price == null || !Number.isFinite(price)) {
    issues.push(issue(`${path}.unit_price_ht`, "Prix unitaire HT invalide"));
    return null;
  }
  const vat = normalizeMoneyOrQty(o.vat_rate ?? o.vatRate ?? o.tva);
  const discount = normalizeMoneyOrQty(
    o.discount_percent ?? o.discountPercent ?? o.remise,
  );
  return {
    itemId: asString(o.item_id ?? o.itemId ?? o.id),
    designation,
    description: asString(o.description ?? o.desc),
    quantity: qty,
    unit: normalizeUnit(o.unit ?? o.unite ?? "U"),
    unitPriceHt: price,
    vatRate: vat,
    discountPercent: discount,
  };
}

function parseItemChanges(
  raw: unknown,
  path: string,
  issues: PatchParseIssue[],
): PatchItemChanges | null {
  if (!raw || typeof raw !== "object") {
    issues.push(issue(path, "Objet changes requis"));
    return null;
  }
  const o = raw as Record<string, unknown>;
  const changes: PatchItemChanges = {};
  let any = false;

  if ("designation" in o || "title" in o || "label" in o) {
    const d = asString(o.designation ?? o.title ?? o.label);
    if (!d) {
      issues.push(issue(`${path}.designation`, "Désignation vide interdite"));
      return null;
    }
    changes.designation = d;
    any = true;
  }
  if ("description" in o || "desc" in o) {
    changes.description = asString(o.description ?? o.desc);
    any = true;
  }
  if ("quantity" in o || "qty" in o || "qte" in o) {
    const q = normalizeMoneyOrQty(o.quantity ?? o.qty ?? o.qte);
    if (q == null || !Number.isFinite(q) || q < 0) {
      issues.push(issue(`${path}.quantity`, "Quantité invalide"));
      return null;
    }
    changes.quantity = q;
    any = true;
  }
  if ("unit" in o || "unite" in o) {
    changes.unit = normalizeUnit(o.unit ?? o.unite);
    any = true;
  }
  if (
    "unit_price_ht" in o ||
    "unitPriceHt" in o ||
    "unit_sell_ht" in o ||
    "price_ht" in o ||
    "prix" in o
  ) {
    const p = normalizeMoneyOrQty(
      o.unit_price_ht ?? o.unitPriceHt ?? o.unit_sell_ht ?? o.price_ht ?? o.prix,
    );
    if (p == null || !Number.isFinite(p)) {
      issues.push(issue(`${path}.unit_price_ht`, "Prix unitaire invalide"));
      return null;
    }
    changes.unitPriceHt = p;
    any = true;
  }
  if ("vat_rate" in o || "vatRate" in o || "tva" in o) {
    const v = normalizeMoneyOrQty(o.vat_rate ?? o.vatRate ?? o.tva);
    if (v == null || !Number.isFinite(v)) {
      issues.push(issue(`${path}.vat_rate`, "TVA invalide"));
      return null;
    }
    changes.vatRate = v;
    any = true;
  }
  if ("discount_percent" in o || "discountPercent" in o || "remise" in o) {
    const d = normalizeMoneyOrQty(
      o.discount_percent ?? o.discountPercent ?? o.remise,
    );
    if (d == null || !Number.isFinite(d)) {
      issues.push(issue(`${path}.discount_percent`, "Remise invalide"));
      return null;
    }
    changes.discountPercent = d;
    any = true;
  }

  if (!any) {
    issues.push(issue(path, "Aucun champ à modifier dans changes"));
    return null;
  }
  return changes;
}

function parseQuoteChanges(
  raw: unknown,
  path: string,
  issues: PatchParseIssue[],
): PatchQuoteChanges | null {
  if (!raw || typeof raw !== "object") {
    issues.push(issue(path, "Objet changes requis"));
    return null;
  }
  const o = raw as Record<string, unknown>;
  const changes: PatchQuoteChanges = {};
  let any = false;
  if ("subject" in o || "title" in o || "objet" in o) {
    const s = asString(o.subject ?? o.title ?? o.objet);
    if (!s) {
      issues.push(issue(`${path}.subject`, "Objet vide interdit"));
      return null;
    }
    changes.subject = s;
    any = true;
  }
  if ("client_notes" in o || "clientNotes" in o || "description" in o) {
    changes.clientNotes = asString(o.client_notes ?? o.clientNotes ?? o.description) ?? "";
    any = true;
  }
  if ("internal_notes" in o || "internalNotes" in o) {
    changes.internalNotes =
      asString(o.internal_notes ?? o.internalNotes) ?? "";
    any = true;
  }
  if ("payment_terms" in o || "paymentTerms" in o || "conditions" in o) {
    changes.paymentTerms =
      asString(o.payment_terms ?? o.paymentTerms ?? o.conditions) ?? "";
    any = true;
  }
  if (!any) {
    issues.push(issue(path, "Aucun champ devis à modifier"));
    return null;
  }
  return changes;
}

function normalizeOp(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
}

function parseOperation(
  raw: unknown,
  path: string,
  issues: PatchParseIssue[],
): PatchOperation | null {
  if (!raw || typeof raw !== "object") {
    issues.push(issue(path, "Opération invalide"));
    return null;
  }
  const o = raw as Record<string, unknown>;
  const op = normalizeOp(o.op ?? o.operation ?? o.type);

  if (op === "add_item" || op === "add_line") {
    const item = parseItemPayload(o.item ?? o.line, `${path}.item`, issues);
    if (!item) return null;
    return {
      op: "add_item",
      sectionId: asString(o.section_id ?? o.sectionId),
      sectionTitle: asString(o.section ?? o.section_title ?? o.sectionTitle),
      insertAfterItemId: asString(
        o.insert_after_item_id ?? o.insertAfterItemId,
      ),
      insertBeforeItemId: asString(
        o.insert_before_item_id ?? o.insertBeforeItemId,
      ),
      item,
    };
  }

  if (op === "update_item" || op === "update_line" || op === "modify_item") {
    const changes = parseItemChanges(o.changes ?? o.patch, `${path}.changes`, issues);
    if (!changes) return null;
    const itemId = asString(o.item_id ?? o.itemId ?? o.id);
    const designationMatch = asString(
      o.designation_match ?? o.designationMatch ?? o.designation,
    );
    if (!itemId && !designationMatch) {
      issues.push(
        issue(path, "update_item nécessite item_id ou designation_match"),
      );
      return null;
    }
    return { op: "update_item", itemId, designationMatch, changes };
  }

  if (op === "delete_item" || op === "delete_line" || op === "remove_item") {
    const itemId = asString(o.item_id ?? o.itemId ?? o.id);
    const designationMatch = asString(
      o.designation_match ?? o.designationMatch ?? o.designation,
    );
    if (!itemId && !designationMatch) {
      issues.push(
        issue(path, "delete_item nécessite item_id ou designation_match"),
      );
      return null;
    }
    return { op: "delete_item", itemId, designationMatch };
  }

  if (op === "add_section") {
    const title = asString(o.title ?? o.name ?? o.section);
    if (!title) {
      issues.push(issue(`${path}.title`, "Titre de section requis"));
      return null;
    }
    return {
      op: "add_section",
      sectionId: asString(o.section_id ?? o.sectionId ?? o.id),
      title,
    };
  }

  if (op === "update_section") {
    const title = asString(o.title ?? o.name ?? o.changes);
    if (!title) {
      issues.push(issue(`${path}.title`, "Nouveau titre requis"));
      return null;
    }
    return {
      op: "update_section",
      sectionId: asString(o.section_id ?? o.sectionId ?? o.id),
      titleMatch: asString(o.title_match ?? o.titleMatch),
      title,
    };
  }

  if (op === "delete_section" || op === "remove_section") {
    const sectionId = asString(o.section_id ?? o.sectionId ?? o.id);
    const titleMatch = asString(o.title_match ?? o.titleMatch ?? o.title);
    if (!sectionId && !titleMatch) {
      issues.push(
        issue(path, "delete_section nécessite section_id ou title_match"),
      );
      return null;
    }
    return { op: "delete_section", sectionId, titleMatch };
  }

  if (op === "update_quote" || op === "update_meta") {
    const changes = parseQuoteChanges(
      o.changes ?? o.patch ?? o,
      `${path}.changes`,
      issues,
    );
    if (!changes) return null;
    return { op: "update_quote", changes };
  }

  if (op === "add_note") {
    const content = asString(o.content ?? o.text ?? o.note);
    if (!content) {
      issues.push(issue(`${path}.content`, "Contenu de note requis"));
      return null;
    }
    const targetRaw = String(o.target ?? o.visibility ?? "client").toLowerCase();
    const target = targetRaw === "internal" || targetRaw === "interne" ? "internal" : "client";
    return { op: "add_note", target, content };
  }

  issues.push(issue(`${path}.op`, `Opération non supportée : ${op || "(vide)"}`));
  return null;
}

/** Parse strict d’un bework_quote_patch_v1 (texte collé ou objet). */
export function parseBeworkQuotePatch(rawInput: unknown): PatchParseResult {
  const issues: PatchParseIssue[] = [];
  let raw: unknown = rawInput;

  if (typeof rawInput === "string") {
    const text = stripCodeFences(rawInput);
    try {
      raw = JSON.parse(text);
    } catch (e) {
      return {
        ok: false,
        errors: [
          issue(
            "",
            `JSON invalide${e instanceof Error && e.message ? ` : ${e.message}` : ""}`,
          ),
        ],
      };
    }
  }

  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: [issue("", "Le JSON doit être un objet")] };
  }

  const root = raw as Record<string, unknown>;
  const type = asString(root.type ?? root.format);
  if (type !== BEWORK_QUOTE_PATCH_FORMAT) {
    return {
      ok: false,
      errors: [
        issue(
          "type",
          type === "bework_quote_bundle_v1"
            ? "Ce JSON est un bundle de création (bework_quote_bundle_v1). Utilisez « Importer depuis ChatGPT » pour créer un devis, ou générez un bework_quote_patch_v1."
            : `type attendu : ${BEWORK_QUOTE_PATCH_FORMAT}`,
        ),
      ],
    };
  }

  const patchId = asString(root.patch_id ?? root.patchId);
  if (!patchId || patchId.length < 4) {
    issues.push(issue("patch_id", "patch_id requis (identifiant stable, min. 4 caractères)"));
  }

  const targetRaw = root.target;
  if (!targetRaw || typeof targetRaw !== "object") {
    issues.push(issue("target", "target requis"));
  }
  const targetObj = (targetRaw && typeof targetRaw === "object"
    ? targetRaw
    : {}) as Record<string, unknown>;
  const quoteNumber = asString(
    targetObj.quote_number ?? targetObj.quoteNumber ?? targetObj.number,
  );
  if (!quoteNumber) {
    issues.push(issue("target.quote_number", "Numéro de devis cible requis"));
  }

  let baseVersion: number | null = null;
  const bv = targetObj.base_version ?? targetObj.baseVersion ?? targetObj.version;
  if (bv != null && bv !== "") {
    const n = typeof bv === "number" ? bv : Number(String(bv).trim());
    if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
      issues.push(issue("target.base_version", "base_version invalide"));
    } else {
      baseVersion = n;
    }
  }

  const opsRaw = root.operations ?? root.ops ?? root.changes;
  if (!Array.isArray(opsRaw) || opsRaw.length === 0) {
    issues.push(issue("operations", "Au moins une opération est requise"));
  }

  const operations: PatchOperation[] = [];
  if (Array.isArray(opsRaw)) {
    for (let i = 0; i < opsRaw.length; i++) {
      const op = parseOperation(opsRaw[i], `operations[${i}]`, issues);
      if (op) operations.push(op);
    }
  }

  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length > 0 || !patchId || !quoteNumber || operations.length === 0) {
    return { ok: false, errors: errors.length ? errors : issues };
  }

  const patch: BeworkQuotePatchV1 = {
    type: BEWORK_QUOTE_PATCH_FORMAT,
    patchId,
    target: { quoteNumber: quoteNumber.toUpperCase(), baseVersion },
    operations,
  };

  return {
    ok: true,
    patch,
    warnings: issues.filter((i) => i.severity === "warn"),
  };
}
