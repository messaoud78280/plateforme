import type { QuoteLineDraft } from "@/app/dashboard/devis/quote-actions";

export type QuoteLineKind =
  | "produit"
  | "service"
  | "regroupement"
  | "texte_libre"
  | "interligne"
  | "trait"
  | "sous_total"
  | "total";

export const QUOTE_LINE_KIND_LABELS: Record<QuoteLineKind, string> = {
  produit: "Produit",
  service: "Service",
  regroupement: "Regroupement",
  texte_libre: "Texte libre",
  interligne: "Interligne",
  trait: "Trait",
  sous_total: "Sous-total",
  total: "Total",
};

export const QUOTE_LINE_KIND_META: Record<
  QuoteLineKind,
  { description: string; accent: string; billable: boolean }
> = {
  produit: {
    description: "Produit, fourniture, marchandises…",
    accent: "bg-sky-400",
    billable: true,
  },
  service: {
    description: "Main d'œuvre ou prestation de services.",
    accent: "bg-amber-400",
    billable: true,
  },
  regroupement: {
    description: "Regroupement de lignes (prix global possible).",
    accent: "bg-rose-400",
    billable: false,
  },
  texte_libre: {
    description: "Mentions, explications…",
    accent: "bg-slate-300",
    billable: false,
  },
  interligne: {
    description: "Espacement entre deux lignes.",
    accent: "bg-slate-300",
    billable: false,
  },
  trait: {
    description: "Ligne de séparation.",
    accent: "bg-slate-400",
    billable: false,
  },
  sous_total: {
    description: "Total depuis le dernier sous-total ou le début.",
    accent: "bg-emerald-400",
    billable: false,
  },
  total: {
    description: "Total depuis le dernier total ou le début.",
    accent: "bg-emerald-500",
    billable: false,
  },
};

const FAMILY_TO_KIND: Record<string, QuoteLineKind> = {
  Produit: "produit",
  Service: "service",
  Regroupement: "regroupement",
  "Texte libre": "texte_libre",
  Interligne: "interligne",
  Trait: "trait",
  "Sous-total": "sous_total",
  Total: "total",
};

export function lineKindFromDraft(row: QuoteLineDraft): QuoteLineKind {
  const fam = row.family?.trim() ?? "";
  if (fam && FAMILY_TO_KIND[fam]) return FAMILY_TO_KIND[fam];
  const lower = fam.toLowerCase();
  if (lower.includes("service") || lower.includes("main")) return "service";
  if (lower.includes("regroup")) return "regroupement";
  if (lower.includes("texte")) return "texte_libre";
  return "produit";
}

export function applyLineKind(row: QuoteLineDraft, kind: QuoteLineKind): QuoteLineDraft {
  const famille =
    kind === "produit" ? "Produit" : kind === "service" ? "Service" : QUOTE_LINE_KIND_LABELS[kind];
  return {
    ...row,
    family: famille,
    title:
      kind === "regroupement"
        ? "Regroupement"
        : kind === "texte_libre"
          ? "Texte libre"
          : kind === "interligne"
            ? " "
            : kind === "trait"
              ? "—"
              : kind === "sous_total"
                ? "Sous-total"
                : kind === "total"
                  ? "Total"
                  : row.title,
    unit: kind === "produit" || kind === "service" ? row.unit || "u" : "u",
    quantity: QUOTE_LINE_KIND_META[kind].billable ? row.quantity : "0",
    unitPriceHT: QUOTE_LINE_KIND_META[kind].billable ? row.unitPriceHT : "0",
  };
}

export function newLineDraft(kind: QuoteLineKind, sortOrder: number, defaultVat: string): QuoteLineDraft {
  const base: QuoteLineDraft = {
    id: `tmp-${crypto.randomUUID()}`,
    workItemId: null,
    lot: "Divers",
    family: "Produit",
    code: null,
    title: "",
    description: "",
    unit: "u",
    quantity: "1",
    unitPriceHT: "0",
    vatRate: defaultVat,
    includedItems: null,
    excludedItems: null,
    vigilancePoints: null,
    sortOrder,
  };
  return applyLineKind(base, kind);
}

export function parseNum(raw: string): number {
  const t = raw.trim().replace(/\s/g, "").replace(",", ".");
  const n = Number(t);
  return Number.isFinite(n) ? n : 0;
}

export function lineMoney(qty: string, puHt: string, vatPct: string, discountPct = 0) {
  const ht = parseNum(qty) * parseNum(puHt) * (1 - discountPct / 100);
  const vat = ht * (parseNum(vatPct) / 100);
  return { ht, vat, ttc: ht + vat };
}

export function fmtEur(n: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export function isBillableKind(kind: QuoteLineKind): boolean {
  return QUOTE_LINE_KIND_META[kind].billable;
}
