import type { BeWorkPriceDocSourceType } from "@prisma/client";
import { SOURCE_TYPE_LABELS } from "@/lib/be-work-devis-labels";
import {
  mergeImportMeta,
  parseImportMetaFromNotes,
  parsePriceEntryImportMeta,
  type PriceEntryImportMeta,
} from "@/lib/be-work-devis-price-entry-import-meta";

export type ObservedPriceRowSerialized = {
  id: string;
  sourceName: string;
  variantDesignation: string | null;
  importMeta: PriceEntryImportMeta | null;
  sourceType: BeWorkPriceDocSourceType;
  unitPriceHT: number;
  unitPriceTTC: number;
  vatRate: number;
  quantity: number | null;
  totalHT: number | null;
  totalTTC: number | null;
  department: string | null;
  reliabilityScore: number;
  notes: string | null;
  dateObserved: string | null;
  createdAt: string;
  priceSourceName: string | null;
};

export type WorkItemContextSerialized = {
  id: string;
  code: string;
  title: string;
  lot: string;
  subLot: string | null;
  family: string | null;
  unit: string;
};

export type PriceEntryDetailView = {
  id: string;
  displayLabel: string;
  variantDesignation: string;
  sourceName: string;
  codeSource: string | null;
  famille: string | null;
  sousFamille: string | null;
  ficheMere: string | null;
  unite: string | null;
  largeur: string | null;
  profondeur: string | null;
  classeTerre: string | null;
  quantiteReference: string | null;
  unitPriceHT: number;
  vatRate: number;
  unitPriceTTC: number;
  totalHT: number | null;
  totalTTC: number | null;
  quantity: number | null;
  dateImport: string;
  dateObserved: string | null;
  sourceTypeLabel: string;
  reliabilityScore: number;
  commentaire: string | null;
  tags: string[];
  notes: string | null;
  priceSourceName: string | null;
  workItem: WorkItemContextSerialized;
};

export function resolvePriceEntryDetail(
  entry: ObservedPriceRowSerialized,
  workItem: WorkItemContextSerialized,
): PriceEntryDetailView {
  const fromNotes = parseImportMetaFromNotes(entry.notes);
  const stored = entry.importMeta ? parsePriceEntryImportMeta(entry.importMeta) : null;
  const meta = mergeImportMeta(stored, fromNotes);

  const variantDesignation =
    entry.variantDesignation?.trim() ||
    meta.commentaire?.trim() ||
    entry.sourceName;

  return {
    id: entry.id,
    displayLabel: variantDesignation,
    variantDesignation,
    sourceName: entry.sourceName,
    codeSource: meta.codeSource ?? null,
    famille: meta.famille ?? workItem.family ?? workItem.lot,
    sousFamille: meta.sousFamille ?? workItem.subLot,
    ficheMere: meta.ficheMere ?? workItem.title,
    unite: meta.unite ?? workItem.unit,
    largeur: meta.largeur_m ?? null,
    profondeur: meta.profondeur_m ?? null,
    classeTerre: meta.classe_terre ?? null,
    quantiteReference: meta.quantiteReference ?? (entry.quantity != null ? String(entry.quantity) : null),
    unitPriceHT: entry.unitPriceHT,
    vatRate: entry.vatRate,
    unitPriceTTC: entry.unitPriceTTC,
    totalHT: entry.totalHT,
    totalTTC: entry.totalTTC,
    quantity: entry.quantity,
    dateImport: entry.createdAt,
    dateObserved: entry.dateObserved,
    sourceTypeLabel: SOURCE_TYPE_LABELS[entry.sourceType] ?? entry.sourceType,
    reliabilityScore: entry.reliabilityScore,
    commentaire: meta.commentaire ?? null,
    tags: meta.tags ?? [],
    notes: entry.notes,
    priceSourceName: entry.priceSourceName,
    workItem,
  };
}

export function getObservedPriceTableLabel(entry: ObservedPriceRowSerialized): string {
  return entry.variantDesignation?.trim() || entry.sourceName;
}
