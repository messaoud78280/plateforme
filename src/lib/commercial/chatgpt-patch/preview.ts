import { prisma } from "@/lib/prisma";
import { d } from "@/lib/commercial/decimal";
import { calculateLine, roundMoney } from "@/lib/commercial/money";
import type { BeworkQuotePatchV1 } from "@/lib/commercial/chatgpt-patch/types";

export type PatchPreviewFieldChange = {
  field: string;
  label: string;
  before: string | number | null;
  after: string | number | null;
  impactHt?: number | null;
};

export type PatchPreviewOp =
  | {
      kind: "add";
      label: string;
      detail: string;
      amountHt: number;
      sectionTitle: string | null;
    }
  | {
      kind: "update";
      label: string;
      detail: string;
      fields: PatchPreviewFieldChange[];
      amountHtDelta: number;
    }
  | {
      kind: "delete";
      label: string;
      detail: string;
      amountHt: number;
    }
  | {
      kind: "meta";
      label: string;
      detail: string;
      fields: PatchPreviewFieldChange[];
    }
  | {
      kind: "error";
      label: string;
      detail: string;
    };

export type QuotePatchPreview = {
  ok: boolean;
  quoteId: string;
  quoteNumber: string;
  versionNumber: number;
  versionMismatch: boolean;
  alreadyApplied: boolean;
  blockedReason: string | null;
  operations: PatchPreviewOp[];
  totals: {
    beforeHt: number;
    afterHt: number;
    deltaHt: number;
    beforeTtc: number;
    afterTtc: number;
    deltaTtc: number;
  };
  warnings: string[];
  errors: string[];
};

type LineRow = {
  id: string;
  sectionId: string | null;
  designation: string;
  description: string | null;
  quantity: unknown;
  unit: string;
  unitSellHt: unknown;
  unitCostHt: unknown;
  discountPercent: unknown;
  vatRate: unknown;
  lineSellHt: unknown;
  reference: string | null;
  kind: string;
  isOptional: boolean;
  sortOrder: number;
};

type SectionRow = {
  id: string;
  title: string;
  sortOrder: number;
};

function money(n: unknown) {
  return roundMoney(d(n), 2);
}

function resolveLine(
  lines: LineRow[],
  itemId?: string | null,
  designationMatch?: string | null,
): { line: LineRow } | { error: string } {
  if (itemId) {
    const byId = lines.find((l) => l.id === itemId);
    if (byId) return { line: byId };
    const byRef = lines.find((l) => l.reference && l.reference === itemId);
    if (byRef) return { line: byRef };
    return { error: `Aucun poste trouvé pour item_id « ${itemId} ».` };
  }
  const needle = (designationMatch ?? "").trim().toLowerCase();
  if (!needle) return { error: "item_id ou designation_match requis." };
  const matches = lines.filter((l) => l.designation.trim().toLowerCase() === needle);
  if (matches.length === 0) {
    return { error: `Aucun poste correspondant à « ${designationMatch} ».` };
  }
  if (matches.length > 1) {
    return {
      error:
        "Impossible d’identifier précisément le poste à modifier (plusieurs lignes portent la même désignation). Fournissez un item_id.",
    };
  }
  return { line: matches[0]! };
}

function resolveSection(
  sections: SectionRow[],
  sectionId?: string | null,
  titleMatch?: string | null,
): { section: SectionRow } | { error: string } {
  if (sectionId) {
    const s = sections.find((x) => x.id === sectionId);
    if (s) return { section: s };
    return { error: `Section introuvable : ${sectionId}` };
  }
  const needle = (titleMatch ?? "").trim().toLowerCase();
  if (!needle) return { error: "section_id ou title_match requis." };
  const matches = sections.filter((s) => s.title.trim().toLowerCase() === needle);
  if (matches.length === 0) {
    return { error: `Aucune section « ${titleMatch} ».` };
  }
  if (matches.length > 1) {
    return {
      error:
        "Plusieurs sections portent le même titre. Fournissez un section_id.",
    };
  }
  return { section: matches[0]! };
}

/** Construit la prévisualisation sans écrire en base. */
export async function previewQuotePatch(input: {
  orgId: string;
  quoteId: string;
  patch: BeworkQuotePatchV1;
}): Promise<QuotePatchPreview> {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: input.quoteId, organizationId: input.orgId },
    include: {
      currentVersion: {
        include: {
          sections: { orderBy: { sortOrder: "asc" } },
          lines: { orderBy: { sortOrder: "asc" } },
        },
      },
      _count: {
        select: { invoices: true, progressStatements: true, amendments: true },
      },
      chatgptPatches: {
        where: { patchId: input.patch.patchId, status: "APPLIED" },
        select: { id: true },
        take: 1,
      },
    },
  });

  const emptyTotals = {
    beforeHt: 0,
    afterHt: 0,
    deltaHt: 0,
    beforeTtc: 0,
    afterTtc: 0,
    deltaTtc: 0,
  };

  if (!quote || !quote.currentVersion) {
    return {
      ok: false,
      quoteId: input.quoteId,
      quoteNumber: "",
      versionNumber: 0,
      versionMismatch: false,
      alreadyApplied: false,
      blockedReason: "Devis introuvable.",
      operations: [],
      totals: emptyTotals,
      warnings: [],
      errors: ["Devis introuvable."],
    };
  }

  const version = quote.currentVersion;
  const warnings: string[] = [];
  const errors: string[] = [];
  const operations: PatchPreviewOp[] = [];

  const targetNum = input.patch.target.quoteNumber.trim().toUpperCase();
  const actualNum = quote.number.trim().toUpperCase();
  if (targetNum !== actualNum) {
    return {
      ok: false,
      quoteId: quote.id,
      quoteNumber: quote.number,
      versionNumber: version.versionNumber,
      versionMismatch: false,
      alreadyApplied: false,
      blockedReason: `Ce bloc de modification semble destiné au devis ${input.patch.target.quoteNumber}, alors que vous êtes actuellement sur ${quote.number}.`,
      operations: [],
      totals: emptyTotals,
      warnings: [],
      errors: [
        `Ce bloc de modification semble destiné au devis ${input.patch.target.quoteNumber}, alors que vous êtes actuellement sur ${quote.number}.`,
      ],
    };
  }

  const alreadyApplied = quote.chatgptPatches.length > 0;
  if (alreadyApplied) {
    return {
      ok: false,
      quoteId: quote.id,
      quoteNumber: quote.number,
      versionNumber: version.versionNumber,
      versionMismatch: false,
      alreadyApplied: true,
      blockedReason: "Cette modification a déjà été appliquée à ce devis.",
      operations: [],
      totals: emptyTotals,
      warnings: [],
      errors: ["Cette modification a déjà été appliquée à ce devis."],
    };
  }

  const versionMismatch =
    input.patch.target.baseVersion != null &&
    input.patch.target.baseVersion !== version.versionNumber;
  if (versionMismatch) {
    warnings.push(
      `Ce devis a été modifié depuis la génération de ce bloc (version ${version.versionNumber}, patch basé sur v${input.patch.target.baseVersion}). Vérifiez les changements avant de continuer.`,
    );
  }

  let blockedReason: string | null = null;
  if (quote._count.invoices > 0 || quote._count.progressStatements > 0) {
    blockedReason =
      "Ce devis possède déjà des documents associés (facture ou situation). Certaines modifications sont bloquées.";
    errors.push(blockedReason);
  }

  const lines = version.lines as LineRow[];
  const sections = version.sections as SectionRow[];

  /* Simulation légère des totaux */
  const simLines = lines.map((l) => ({
    id: l.id,
    sectionId: l.sectionId,
    designation: l.designation,
    description: l.description,
    quantity: money(l.quantity),
    unit: l.unit,
    unitSellHt: money(l.unitSellHt),
    unitCostHt: money(l.unitCostHt),
    discountPercent: money(l.discountPercent),
    vatRate: money(l.vatRate),
    isOptional: l.isOptional,
    kind: l.kind,
    deleted: false,
  }));
  const simSections = sections.map((s) => ({ ...s, deleted: false }));

  for (const op of input.patch.operations) {
    if (op.op === "add_item") {
      let sectionTitle: string | null = op.sectionTitle ?? null;
      if (op.sectionId) {
        const r = resolveSection(simSections.filter((s) => !s.deleted), op.sectionId, null);
        if ("error" in r) {
          operations.push({ kind: "error", label: "Ajout de poste", detail: r.error });
          errors.push(r.error);
          continue;
        }
        sectionTitle = r.section.title;
      } else if (op.sectionTitle) {
        const existing = simSections.find(
          (s) =>
            !s.deleted &&
            s.title.trim().toLowerCase() === op.sectionTitle!.trim().toLowerCase(),
        );
        if (!existing) {
          const msg = `Section « ${op.sectionTitle} » introuvable. Ajoutez add_section ou un section_id.`;
          operations.push({ kind: "error", label: "Ajout de poste", detail: msg });
          errors.push(msg);
          continue;
        }
        sectionTitle = existing.title;
      }
      const amountHt = roundMoney(
        op.item.quantity * op.item.unitPriceHt * (1 - (op.item.discountPercent ?? 0) / 100),
        2,
      );
      operations.push({
        kind: "add",
        label: op.item.designation,
        detail: `${op.item.quantity} ${op.item.unit} · ${op.item.unitPriceHt.toLocaleString("fr-FR")} € HT`,
        amountHt,
        sectionTitle,
      });
      simLines.push({
        id: `new-${simLines.length}`,
        sectionId: null,
        designation: op.item.designation,
        description: op.item.description ?? null,
        quantity: op.item.quantity,
        unit: op.item.unit,
        unitSellHt: op.item.unitPriceHt,
        unitCostHt: 0,
        discountPercent: op.item.discountPercent ?? 0,
        vatRate: op.item.vatRate ?? money(quote.defaultVatRate),
        isOptional: false,
        kind: "WORK",
        deleted: false,
      });
      continue;
    }

    if (op.op === "update_item") {
      const r = resolveLine(
        simLines.filter((l) => !l.deleted) as unknown as LineRow[],
        op.itemId,
        op.designationMatch,
      );
      if ("error" in r) {
        operations.push({ kind: "error", label: "Modification de poste", detail: r.error });
        errors.push(r.error);
        continue;
      }
      const line = simLines.find((l) => l.id === r.line.id)!;
      const fields: PatchPreviewFieldChange[] = [];
      const beforeHt = roundMoney(
        line.quantity * line.unitSellHt * (1 - line.discountPercent / 100),
        2,
      );
      if (op.changes.designation !== undefined) {
        fields.push({
          field: "designation",
          label: "Désignation",
          before: line.designation,
          after: op.changes.designation,
        });
        line.designation = op.changes.designation;
      }
      if (op.changes.description !== undefined) {
        fields.push({
          field: "description",
          label: "Description",
          before: line.description,
          after: op.changes.description,
        });
        line.description = op.changes.description;
      }
      if (op.changes.quantity !== undefined) {
        fields.push({
          field: "quantity",
          label: "Quantité",
          before: line.quantity,
          after: op.changes.quantity,
        });
        line.quantity = op.changes.quantity;
      }
      if (op.changes.unit !== undefined) {
        fields.push({
          field: "unit",
          label: "Unité",
          before: line.unit,
          after: op.changes.unit,
        });
        line.unit = op.changes.unit;
      }
      if (op.changes.unitPriceHt !== undefined) {
        const impact =
          (op.changes.unitPriceHt - line.unitSellHt) *
          line.quantity *
          (1 - line.discountPercent / 100);
        fields.push({
          field: "unitPriceHt",
          label: "Prix unitaire HT",
          before: line.unitSellHt,
          after: op.changes.unitPriceHt,
          impactHt: roundMoney(impact, 2),
        });
        line.unitSellHt = op.changes.unitPriceHt;
      }
      if (op.changes.vatRate !== undefined) {
        fields.push({
          field: "vatRate",
          label: "TVA %",
          before: line.vatRate,
          after: op.changes.vatRate,
        });
        line.vatRate = op.changes.vatRate;
      }
      if (op.changes.discountPercent !== undefined) {
        fields.push({
          field: "discountPercent",
          label: "Remise %",
          before: line.discountPercent,
          after: op.changes.discountPercent,
        });
        line.discountPercent = op.changes.discountPercent;
      }
      const afterHt = roundMoney(
        line.quantity * line.unitSellHt * (1 - line.discountPercent / 100),
        2,
      );
      operations.push({
        kind: "update",
        label: line.designation,
        detail: fields.map((f) => f.label).join(", "),
        fields,
        amountHtDelta: roundMoney(afterHt - beforeHt, 2),
      });
      continue;
    }

    if (op.op === "delete_item") {
      const r = resolveLine(lines, op.itemId, op.designationMatch);
      if ("error" in r) {
        operations.push({ kind: "error", label: "Suppression de poste", detail: r.error });
        errors.push(r.error);
        continue;
      }
      const line = simLines.find((l) => l.id === r.line.id);
      if (line) line.deleted = true;
      const amountHt = money(r.line.lineSellHt);
      operations.push({
        kind: "delete",
        label: r.line.designation,
        detail: `Montant actuel : ${amountHt.toLocaleString("fr-FR")} € HT — cette ligne sera supprimée.`,
        amountHt,
      });
      continue;
    }

    if (op.op === "add_section") {
      operations.push({
        kind: "add",
        label: `Section « ${op.title} »`,
        detail: "Nouvelle section / lot",
        amountHt: 0,
        sectionTitle: op.title,
      });
      simSections.push({
        id: `new-sec-${simSections.length}`,
        title: op.title,
        sortOrder: simSections.length,
        deleted: false,
      });
      continue;
    }

    if (op.op === "update_section") {
      const r = resolveSection(
        simSections.filter((s) => !s.deleted),
        op.sectionId,
        op.titleMatch,
      );
      if ("error" in r) {
        operations.push({ kind: "error", label: "Modification de section", detail: r.error });
        errors.push(r.error);
        continue;
      }
      operations.push({
        kind: "meta",
        label: `Section « ${r.section.title} »`,
        detail: "Renommage",
        fields: [
          {
            field: "title",
            label: "Titre",
            before: r.section.title,
            after: op.title,
          },
        ],
      });
      continue;
    }

    if (op.op === "delete_section") {
      const r = resolveSection(sections, op.sectionId, op.titleMatch);
      if ("error" in r) {
        operations.push({ kind: "error", label: "Suppression de section", detail: r.error });
        errors.push(r.error);
        continue;
      }
      const lineCount = lines.filter((l) => l.sectionId === r.section.id).length;
      operations.push({
        kind: "delete",
        label: `Section « ${r.section.title} »`,
        detail: `${lineCount} poste(s) de cette section seront également supprimés.`,
        amountHt: lines
          .filter((l) => l.sectionId === r.section.id)
          .reduce((s, l) => s + money(l.lineSellHt), 0),
      });
      const sec = simSections.find((s) => s.id === r.section.id);
      if (sec) sec.deleted = true;
      for (const l of simLines) {
        if (l.sectionId === r.section.id) l.deleted = true;
      }
      continue;
    }

    if (op.op === "update_quote") {
      const fields: PatchPreviewFieldChange[] = [];
      if (op.changes.subject !== undefined) {
        fields.push({
          field: "subject",
          label: "Objet",
          before: quote.subject,
          after: op.changes.subject,
        });
      }
      if (op.changes.clientNotes !== undefined) {
        fields.push({
          field: "clientNotes",
          label: "Notes client",
          before: quote.clientNotes,
          after: op.changes.clientNotes,
        });
      }
      if (op.changes.internalNotes !== undefined) {
        fields.push({
          field: "internalNotes",
          label: "Notes internes",
          before: quote.internalNotes,
          after: op.changes.internalNotes,
        });
      }
      if (op.changes.paymentTerms !== undefined) {
        fields.push({
          field: "paymentTerms",
          label: "Conditions",
          before: quote.paymentTerms,
          after: op.changes.paymentTerms,
        });
      }
      operations.push({
        kind: "meta",
        label: "Informations du devis",
        detail: fields.map((f) => f.label).join(", "),
        fields,
      });
      continue;
    }

    if (op.op === "add_note") {
      operations.push({
        kind: "add",
        label: op.target === "internal" ? "Note interne" : "Note client",
        detail: op.content.slice(0, 180) + (op.content.length > 180 ? "…" : ""),
        amountHt: 0,
        sectionTitle: null,
      });
    }
  }

  const beforeHt = money(quote.totalSellHt);
  const beforeTtc = money(quote.totalTtc);

  let afterHt = 0;
  let afterTtc = 0;
  for (const l of simLines) {
    if (l.deleted || l.isOptional) continue;
    const calc = calculateLine({
      kind: l.kind as never,
      quantity: l.quantity,
      unitCostHt: l.unitCostHt,
      unitSellHt: l.unitSellHt,
      discountPercent: l.discountPercent,
      vatRate: l.vatRate,
      isOptional: false,
    });
    afterHt += calc.lineSellHt;
    afterTtc += calc.lineTtc;
  }
  afterHt = roundMoney(afterHt, 2);
  afterTtc = roundMoney(afterTtc, 2);

  const hasErrors = errors.length > 0 || operations.some((o) => o.kind === "error");

  return {
    ok: !hasErrors && !blockedReason,
    quoteId: quote.id,
    quoteNumber: quote.number,
    versionNumber: version.versionNumber,
    versionMismatch,
    alreadyApplied: false,
    blockedReason,
    operations,
    totals: {
      beforeHt,
      afterHt,
      deltaHt: roundMoney(afterHt - beforeHt, 2),
      beforeTtc,
      afterTtc,
      deltaTtc: roundMoney(afterTtc - beforeTtc, 2),
    },
    warnings,
    errors,
  };
}
