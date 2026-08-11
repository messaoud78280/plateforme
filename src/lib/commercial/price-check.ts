/**
 * COMMERCIAL V1.2 — Vérification des prix (snapshot devis vs bibliothèque actuelle).
 * Ne modifie pas les formules V1.1. Aucune mutation lors de l’évaluation.
 */
import { prisma } from "@/lib/prisma";
import {
  calculateLine,
  calculateWorkItemCosting,
  marquePercentFromCostSell,
  markupPercentFromCostSell,
  roundMoney,
  sellCoefficientFromCostSell,
} from "@/lib/commercial/money";
import { d } from "@/lib/commercial/decimal";
import type {
  CompositionSnapshot,
  CompositionSnapshotComponent,
} from "@/lib/commercial/library";
import { ensureCommercialOrgSettings } from "@/lib/commercial/settings";
import type { CommercialQuoteStatus, Prisma } from "@prisma/client";
import type {
  PriceCheckStatus,
  ResourceKind,
  ResourcePriceChange,
  AffectedLinePriceCheck,
  QuotePriceCheckResult,
} from "@/lib/commercial/price-check-types";
export type {
  PriceCheckStatus,
  ResourceKind,
  ResourcePriceChange,
  AffectedLinePriceCheck,
  QuotePriceCheckResult,
} from "@/lib/commercial/price-check-types";

type CurrentResource = {
  id: string;
  name: string;
  unitCostHt: number;
  unit?: string;
  isActive: boolean;
  updatedAt: Date;
};

function parseSnapshot(raw: unknown): CompositionSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Partial<CompositionSnapshot>;
  if (!Array.isArray(s.components)) return null;
  return s as CompositionSnapshot;
}

function resourceRef(
  c: CompositionSnapshotComponent,
): { kind: ResourceKind; id: string } | null {
  if (c.materialId) return { kind: "MATERIAL", id: c.materialId };
  if (c.laborId) return { kind: "LABOR", id: c.laborId };
  if (c.equipmentId) return { kind: "EQUIPMENT", id: c.equipmentId };
  return null;
}

function resourceKey(kind: ResourceKind, id: string) {
  return `${kind}:${id}`;
}

function deltaPercent(oldV: number, newV: number): number {
  if (oldV === 0) return newV === 0 ? 0 : 100;
  return roundMoney(((newV - oldV) / Math.abs(oldV)) * 100, 2);
}

function laborUnitCost(l: {
  hourlyCostHt: Prisma.Decimal | number;
  loadedCostHt: Prisma.Decimal | number | null;
}): number {
  return l.loadedCostHt != null ? d(l.loadedCostHt) : d(l.hourlyCostHt);
}

function equipmentUnitCost(
  e: {
    hourlyCostHt: Prisma.Decimal | number | null;
    dailyCostHt: Prisma.Decimal | number | null;
    unit: string;
  },
  snapshotUnit?: string,
): number {
  const unit = (snapshotUnit || e.unit || "h").toLowerCase();
  if ((unit === "j" || unit === "jour" || unit === "d") && e.dailyCostHt != null) {
    return d(e.dailyCostHt);
  }
  if (e.hourlyCostHt != null) return d(e.hourlyCostHt);
  if (e.dailyCostHt != null) return d(e.dailyCostHt);
  return 0;
}

/** Charge batch les prix actuels (org stricte). */
export async function loadCurrentResourcePrices(
  orgId: string,
  refs: { materialIds: string[]; laborIds: string[]; equipmentIds: string[] },
): Promise<{
  materials: Map<string, CurrentResource>;
  labor: Map<string, CurrentResource>;
  equipment: Map<string, CurrentResource>;
}> {
  const [materials, labor, equipment] = await Promise.all([
    refs.materialIds.length
      ? prisma.commercialMaterial.findMany({
          where: { organizationId: orgId, id: { in: refs.materialIds } },
          select: {
            id: true,
            name: true,
            currentPriceHt: true,
            unit: true,
            isActive: true,
            updatedAt: true,
          },
        })
      : Promise.resolve([]),
    refs.laborIds.length
      ? prisma.commercialLaborResource.findMany({
          where: { organizationId: orgId, id: { in: refs.laborIds } },
          select: {
            id: true,
            name: true,
            hourlyCostHt: true,
            loadedCostHt: true,
            isActive: true,
            updatedAt: true,
          },
        })
      : Promise.resolve([]),
    refs.equipmentIds.length
      ? prisma.commercialEquipmentResource.findMany({
          where: { organizationId: orgId, id: { in: refs.equipmentIds } },
          select: {
            id: true,
            name: true,
            hourlyCostHt: true,
            dailyCostHt: true,
            unit: true,
            isActive: true,
            updatedAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  return {
    materials: new Map(
      materials.map((m) => [
        m.id,
        {
          id: m.id,
          name: m.name,
          unitCostHt: d(m.currentPriceHt),
          unit: m.unit,
          isActive: m.isActive,
          updatedAt: m.updatedAt,
        },
      ]),
    ),
    labor: new Map(
      labor.map((l) => [
        l.id,
        {
          id: l.id,
          name: l.name,
          unitCostHt: laborUnitCost(l),
          unit: "h",
          isActive: l.isActive,
          updatedAt: l.updatedAt,
        },
      ]),
    ),
    equipment: new Map(
      equipment.map((e) => [
        e.id,
        {
          id: e.id,
          name: e.name,
          unitCostHt: equipmentUnitCost(e),
          unit: e.unit,
          isActive: e.isActive,
          updatedAt: e.updatedAt,
        },
      ]),
    ),
  };
}

/** Résolution équipement : horaires / journaliers selon unité snapshot. */
type EquipmentDb = {
  id: string;
  name: string;
  hourlyCostHt: number | null;
  dailyCostHt: number | null;
  unit: string;
  isActive: boolean;
  updatedAt: Date;
};

async function loadEquipmentDb(
  orgId: string,
  ids: string[],
): Promise<Map<string, EquipmentDb>> {
  if (!ids.length) return new Map();
  const rows = await prisma.commercialEquipmentResource.findMany({
    where: { organizationId: orgId, id: { in: ids } },
    select: {
      id: true,
      name: true,
      hourlyCostHt: true,
      dailyCostHt: true,
      unit: true,
      isActive: true,
      updatedAt: true,
    },
  });
  return new Map(
    rows.map((e) => [
      e.id,
      {
        id: e.id,
        name: e.name,
        hourlyCostHt: e.hourlyCostHt != null ? d(e.hourlyCostHt) : null,
        dailyCostHt: e.dailyCostHt != null ? d(e.dailyCostHt) : null,
        unit: e.unit,
        isActive: e.isActive,
        updatedAt: e.updatedAt,
      },
    ]),
  );
}

export type PriceMaps = {
  materials: Map<string, CurrentResource>;
  labor: Map<string, CurrentResource>;
  equipmentDb: Map<string, EquipmentDb>;
};

function currentForComponent(
  maps: PriceMaps,
  c: CompositionSnapshotComponent,
): {
  ref: { kind: ResourceKind; id: string } | null;
  current: CurrentResource | null;
  manual: boolean;
} {
  const ref = resourceRef(c);
  if (!ref) return { ref: null, current: null, manual: true };
  if (ref.kind === "MATERIAL") {
    return { ref, current: maps.materials.get(ref.id) ?? null, manual: false };
  }
  if (ref.kind === "LABOR") {
    return { ref, current: maps.labor.get(ref.id) ?? null, manual: false };
  }
  const eq = maps.equipmentDb.get(ref.id);
  if (!eq) return { ref, current: null, manual: false };
  return {
    ref,
    current: {
      id: eq.id,
      name: eq.name,
      unitCostHt: equipmentUnitCost(eq, c.unit),
      unit: eq.unit,
      isActive: eq.isActive,
      updatedAt: eq.updatedAt,
    },
    manual: false,
  };
}

function componentUnitCostWithCurrent(
  c: CompositionSnapshotComponent,
  maps: PriceMaps,
): { unitCostHt: number; missing: boolean; manual: boolean; changed: boolean; key?: string } {
  const { ref, current, manual } = currentForComponent(maps, c);
  if (manual || !ref) {
    return { unitCostHt: Number(c.unitCostHt) || 0, missing: false, manual: true, changed: false };
  }
  if (!current || !current.isActive) {
    return {
      unitCostHt: Number(c.unitCostHt) || 0,
      missing: true,
      manual: false,
      changed: false,
      key: resourceKey(ref.kind, ref.id),
    };
  }
  const snap = roundMoney(Number(c.unitCostHt) || 0, 4);
  const cur = roundMoney(current.unitCostHt, 4);
  return {
    unitCostHt: cur,
    missing: false,
    manual: false,
    changed: snap !== cur,
    key: resourceKey(ref.kind, ref.id),
  };
}

type LineInput = {
  id: string;
  designation: string;
  quantity: number;
  unit: string;
  unitCostHt: number;
  unitSellHt: number;
  discountPercent: number;
  vatRate: number;
  kind: string;
  isOptional: boolean;
  commercialWorkItemId?: string | null;
  compositionSnapshotJson: unknown;
};

/**
 * Évaluation pure (testable) : composition snapshot + prix actuels déjà chargés.
 * Conserve quantités / pertes / frais / sellMode du snapshot — remplace uniquement les unitCost liés.
 */
export function evaluateQuotePriceChanges(input: {
  quoteId: string;
  versionId: string;
  quoteStatus: CommercialQuoteStatus;
  lockState: string;
  lines: LineInput[];
  maps: PriceMaps;
  minMarginPercent: number | null;
  /** workItemId → set de clés ressource actuelles (hint composition). */
  currentWorkItemResourceKeys?: Map<string, Set<string>>;
  checkedAt?: string;
}): QuotePriceCheckResult {
  const checkedAt = input.checkedAt ?? new Date().toISOString();
  const canApply =
    ["DRAFT", "TO_VALIDATE", "VALIDATED"].includes(input.quoteStatus) &&
    input.lockState === "DRAFT";
  let applyBlockedReason: string | null = null;
  if (input.quoteStatus === "ACCEPTED") {
    applyBlockedReason = "Devis accepté — aucune modification possible";
  } else if (["SENT", "VIEWED"].includes(input.quoteStatus)) {
    applyBlockedReason =
      "Devis envoyé — créer une nouvelle version avant d’appliquer des prix";
  } else if (["REFUSED", "CANCELLED", "EXPIRED"].includes(input.quoteStatus)) {
    applyBlockedReason = "Document clos — vérification non proposée en action principale";
  } else if (!canApply) {
    applyBlockedReason = "Version non modifiable";
  }

  type Agg = {
    kind: ResourceKind;
    resourceId: string;
    designationSnapshot: string;
    designationCurrent: string | null;
    unit: string;
    snapshotUnitCostHt: number;
    currentUnitCostHt: number | null;
    status: ResourcePriceChange["status"];
    lineIds: Set<string>;
    lineNames: Set<string>;
    totalCostImpactHt: number;
  };

  const byKey = new Map<string, Agg>();
  let manualComponentCount = 0;
  let oldestSnapshotAt: string | null = null;
  const affectedLines: AffectedLinePriceCheck[] = [];
  const compositionHints: QuotePriceCheckResult["compositionHints"] = [];

  let oldCostCents = 0;
  let currentCostCents = 0;
  let sellCents = 0;

  for (const line of input.lines) {
    if (line.kind === "COMMENT" || line.kind === "SUBTOTAL") continue;
    const included = line.kind === "WORK" && !line.isOptional;

    const snap = parseSnapshot(line.compositionSnapshotJson);
    const qty = Number(line.quantity) || 0;

    if (snap?.snappedAt) {
      if (!oldestSnapshotAt || snap.snappedAt < oldestSnapshotAt) {
        oldestSnapshotAt = snap.snappedAt;
      }
    }

    if (!snap) {
      const calc = calculateLine({
        kind: line.kind as "WORK",
        quantity: qty,
        unitCostHt: line.unitCostHt,
        unitSellHt: line.unitSellHt,
        discountPercent: line.discountPercent,
        vatRate: line.vatRate,
        isOptional: line.isOptional,
      });
      if (included) {
        oldCostCents += Math.round(calc.lineCostHt * 100);
        currentCostCents += Math.round(calc.lineCostHt * 100);
        sellCents += Math.round(calc.lineSellHt * 100);
      }
      continue;
    }

    const sellMode = snap.sellMode === "FIXED_SELL" ? "FIXED_SELL" : "MARGIN";
    const componentsWithCurrent = snap.components.map((c) => {
      const r = componentUnitCostWithCurrent(c, input.maps);
      if (r.manual) manualComponentCount += 1;
      return { c, r };
    });

    // Impact par ressource sur cette ligne (qty × Δ coût unitaire composant avec pertes)
    for (const { c, r } of componentsWithCurrent) {
      const ref = resourceRef(c);
      if (!ref || r.manual) continue;
      const key = resourceKey(ref.kind, ref.id);
      const snapU = roundMoney(Number(c.unitCostHt) || 0, 4);
      let agg = byKey.get(key);
      if (!agg) {
        const { current } = currentForComponent(input.maps, c);
        const status: ResourcePriceChange["status"] = r.missing
          ? !current
            ? "MISSING"
            : "INACTIVE"
          : snapU === (r.unitCostHt) && !r.missing
            ? "UNCHANGED"
            : "CHANGED";
        agg = {
          kind: ref.kind,
          resourceId: ref.id,
          designationSnapshot: c.name,
          designationCurrent: current?.name ?? null,
          unit: c.unit,
          snapshotUnitCostHt: snapU,
          currentUnitCostHt: r.missing ? null : r.unitCostHt,
          status: r.missing ? (current && !current.isActive ? "INACTIVE" : "MISSING") : status,
          lineIds: new Set(),
          lineNames: new Set(),
          totalCostImpactHt: 0,
        };
        byKey.set(key, agg);
      }
      agg.lineIds.add(line.id);
      agg.lineNames.add(line.designation);
      if (!r.missing && agg.currentUnitCostHt != null) {
        const loss = Math.max(0, Number(c.lossPercent) || 0);
        const effQtyPerUnit = (Number(c.quantityPerUnit) || 0) * (1 + loss / 100);
        const deltaPerSaleUnit = roundMoney(
          effQtyPerUnit * (agg.currentUnitCostHt - agg.snapshotUnitCostHt),
          4,
        );
        const lineImpact = roundMoney(deltaPerSaleUnit * qty, 2);
        agg.totalCostImpactHt = roundMoney(agg.totalCostImpactHt + lineImpact, 2);
        if (agg.snapshotUnitCostHt !== agg.currentUnitCostHt) {
          agg.status = "CHANGED";
        } else if (agg.status !== "MISSING" && agg.status !== "INACTIVE") {
          agg.status = "UNCHANGED";
        }
      }
    }

    const costingCurrent = calculateWorkItemCosting({
      components: componentsWithCurrent.map(({ c, r }) => ({
        type: c.type,
        quantityPerUnit: Number(c.quantityPerUnit) || 0,
        unitCostHt: r.unitCostHt,
        lossPercent: Number(c.lossPercent) || 0,
      })),
      feesPercent: Number(snap.feesPercent) || 0,
      feesAmountHt: Number(snap.feesAmountHt) || 0,
      sellMode: "FIXED_SELL",
      unitSellHt: Number(snap.unitSellHt) || Number(line.unitSellHt) || 0,
    });

    const snapshotUnitCost = roundMoney(
      Number(snap.unitCostHt) || Number(line.unitCostHt) || 0,
      2,
    );
    const currentUnitCost = costingCurrent.costPriceHt;
    const analysisUnitSell = roundMoney(
      Number(snap.unitSellHt) || Number(line.unitSellHt) || 0,
      2,
    );

    const oldLine = calculateLine({
      kind: line.kind as "WORK",
      quantity: qty,
      unitCostHt: snapshotUnitCost,
      unitSellHt: analysisUnitSell,
      discountPercent: line.discountPercent,
      vatRate: line.vatRate,
      isOptional: line.isOptional,
    });
    const newLine = calculateLine({
      kind: line.kind as "WORK",
      quantity: qty,
      unitCostHt: currentUnitCost,
      unitSellHt: analysisUnitSell,
      discountPercent: line.discountPercent,
      vatRate: line.vatRate,
      isOptional: line.isOptional,
    });

    if (included) {
      oldCostCents += Math.round(oldLine.lineCostHt * 100);
      currentCostCents += Math.round(newLine.lineCostHt * 100);
      sellCents += Math.round(oldLine.lineSellHt * 100);
    }

    const hasMissing = componentsWithCurrent.some(({ r }) => r.missing);
    const changedKeys = componentsWithCurrent
      .filter(({ r }) => r.changed && r.key)
      .map(({ r }) => r.key!);

    let compositionMayHaveChanged = false;
    if (
      line.commercialWorkItemId &&
      input.currentWorkItemResourceKeys?.has(line.commercialWorkItemId)
    ) {
      const currentKeys = input.currentWorkItemResourceKeys.get(line.commercialWorkItemId)!;
      const snapKeys = new Set(
        snap.components
          .map((c) => resourceRef(c))
          .filter(Boolean)
          .map((r) => resourceKey(r!.kind, r!.id)),
      );
      if (
        snapKeys.size !== currentKeys.size ||
        [...snapKeys].some((k) => !currentKeys.has(k))
      ) {
        compositionMayHaveChanged = true;
        compositionHints.push({
          lineId: line.id,
          designation: line.designation,
          message:
            "La composition de l’ouvrage a également évolué depuis ce devis.",
        });
      }
    }

    if (changedKeys.length > 0 || hasMissing || compositionMayHaveChanged) {
      affectedLines.push({
        lineId: line.id,
        designation: line.designation,
        quantity: qty,
        unit: line.unit,
        sellMode,
        snapshotUnitCostHt: snapshotUnitCost,
        currentUnitCostHt: currentUnitCost,
        snapshotLineCostHt: oldLine.lineCostHt,
        currentLineCostHt: newLine.lineCostHt,
        costDeltaHt: roundMoney(newLine.lineCostHt - oldLine.lineCostHt, 2),
        snapshotUnitSellHt: analysisUnitSell,
        analysisUnitSellHt: analysisUnitSell,
        snapshotLineSellHt: oldLine.lineSellHt,
        analysisLineSellHt: newLine.lineSellHt,
        oldMarquePercent: marquePercentFromCostSell(oldLine.lineCostHt, oldLine.lineSellHt),
        currentIndicativeMarquePercent: marquePercentFromCostSell(
          newLine.lineCostHt,
          newLine.lineSellHt,
        ),
        oldMarkupPercent: markupPercentFromCostSell(oldLine.lineCostHt, oldLine.lineSellHt),
        currentIndicativeMarkupPercent: markupPercentFromCostSell(
          newLine.lineCostHt,
          newLine.lineSellHt,
        ),
        oldSellCoefficient: sellCoefficientFromCostSell(oldLine.lineCostHt, oldLine.lineSellHt),
        currentIndicativeSellCoefficient: sellCoefficientFromCostSell(
          newLine.lineCostHt,
          newLine.lineSellHt,
        ),
        hasMissingResources: hasMissing,
        changedResourceKeys: changedKeys,
        compositionMayHaveChanged,
      });
    }
  }

  const allResources: ResourcePriceChange[] = [...byKey.entries()].map(([key, a]) => ({
    key,
    kind: a.kind,
    resourceId: a.resourceId,
    designationSnapshot: a.designationSnapshot,
    designationCurrent: a.designationCurrent,
    unit: a.unit,
    snapshotUnitCostHt: a.snapshotUnitCostHt,
    currentUnitCostHt: a.currentUnitCostHt,
    deltaUnitHt:
      a.currentUnitCostHt == null
        ? null
        : roundMoney(a.currentUnitCostHt - a.snapshotUnitCostHt, 4),
    deltaPercent:
      a.currentUnitCostHt == null
        ? null
        : deltaPercent(a.snapshotUnitCostHt, a.currentUnitCostHt),
    status: a.status,
    affectedLineIds: [...a.lineIds],
    affectedLineDesignations: [...a.lineNames],
    totalCostImpactHt: a.totalCostImpactHt,
  }));

  const comparableResourceCount = allResources.length;
  const missingResources = allResources.filter(
    (r) => r.status === "MISSING" || r.status === "INACTIVE",
  );
  const changedResources = allResources
    .filter((r) => r.status === "CHANGED")
    .sort((a, b) => {
      // hausses d’abord (impact métier), puis baisses
      const da = a.deltaPercent ?? 0;
      const db = b.deltaPercent ?? 0;
      if (da >= 0 && db < 0) return -1;
      if (da < 0 && db >= 0) return 1;
      return Math.abs(db) - Math.abs(da);
    });

  const oldEstimatedCostHt = roundMoney(oldCostCents / 100, 2);
  const currentEstimatedCostHt = roundMoney(currentCostCents / 100, 2);
  const sellHtUnchanged = roundMoney(sellCents / 100, 2);
  const costDeltaHt = roundMoney(currentEstimatedCostHt - oldEstimatedCostHt, 2);

  const oldMarquePercent = marquePercentFromCostSell(oldEstimatedCostHt, sellHtUnchanged);
  const currentIndicativeMarquePercent = marquePercentFromCostSell(
    currentEstimatedCostHt,
    sellHtUnchanged,
  );
  const oldMarkupPercent = markupPercentFromCostSell(oldEstimatedCostHt, sellHtUnchanged);
  const currentIndicativeMarkupPercent = markupPercentFromCostSell(
    currentEstimatedCostHt,
    sellHtUnchanged,
  );
  const oldSellCoefficient = sellCoefficientFromCostSell(oldEstimatedCostHt, sellHtUnchanged);
  const currentIndicativeSellCoefficient = sellCoefficientFromCostSell(
    currentEstimatedCostHt,
    sellHtUnchanged,
  );

  const minM = input.minMarginPercent;
  const belowMinMarginAlert =
    minM != null &&
    currentIndicativeMarquePercent < minM &&
    (changedResources.length > 0 || missingResources.length > 0);
  const belowMinMarginMessage = belowMinMarginAlert
    ? `Votre taux de marque passerait sous votre objectif de ${roundMoney(minM, 1)} %.`
    : null;

  let status: PriceCheckStatus;
  if (comparableResourceCount === 0) {
    status = "NOTHING_TO_COMPARE";
  } else if (missingResources.length > 0) {
    status = "MANUAL_REVIEW_REQUIRED";
  } else if (changedResources.length > 0) {
    status = "CHANGES_FOUND";
  } else {
    status = "UP_TO_DATE";
  }

  // Lignes affectées : au minimum celles avec changement ou missing
  const linesForUi = affectedLines.filter(
    (l) => l.changedResourceKeys.length > 0 || l.hasMissingResources,
  );

  return {
    status,
    quoteId: input.quoteId,
    versionId: input.versionId,
    checkedAt,
    oldestSnapshotAt,
    comparableResourceCount,
    manualComponentCount,
    changedResourceCount: changedResources.length,
    missingResourceCount: missingResources.length,
    affectedLineCount: linesForUi.length,
    oldEstimatedCostHt,
    currentEstimatedCostHt,
    costDeltaHt,
    sellHtUnchanged,
    oldMarquePercent,
    currentIndicativeMarquePercent,
    oldMarkupPercent,
    currentIndicativeMarkupPercent,
    oldSellCoefficient,
    currentIndicativeSellCoefficient,
    minMarginPercent: minM,
    belowMinMarginAlert,
    belowMinMarginMessage,
    changedResources,
    missingResources,
    affectedLines: linesForUi,
    compositionHints,
    canApply,
    applyBlockedReason,
  };
}

/** Orchestration serveur : charge devis + batch ressources + évalue. */
export async function runQuotePriceCheck(
  orgId: string,
  quoteId: string,
): Promise<QuotePriceCheckResult> {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    include: {
      currentVersion: {
        include: {
          lines: { orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });
  if (!quote?.currentVersion) throw new Error("Devis introuvable");

  const settings = await ensureCommercialOrgSettings(orgId);
  const minMarginPercent =
    settings.minMarginPercent != null ? d(settings.minMarginPercent) : null;

  const materialIds = new Set<string>();
  const laborIds = new Set<string>();
  const equipmentIds = new Set<string>();
  const workItemIds = new Set<string>();

  for (const line of quote.currentVersion.lines) {
    const snap = parseSnapshot(line.compositionSnapshotJson);
    if (line.commercialWorkItemId) workItemIds.add(line.commercialWorkItemId);
    if (!snap) continue;
    for (const c of snap.components) {
      const ref = resourceRef(c);
      if (!ref) continue;
      if (ref.kind === "MATERIAL") materialIds.add(ref.id);
      else if (ref.kind === "LABOR") laborIds.add(ref.id);
      else equipmentIds.add(ref.id);
    }
  }

  const [priceBundle, equipmentDb, workItems] = await Promise.all([
    loadCurrentResourcePrices(orgId, {
      materialIds: [...materialIds],
      laborIds: [...laborIds],
      equipmentIds: [...equipmentIds],
    }),
    loadEquipmentDb(orgId, [...equipmentIds]),
    workItemIds.size
      ? prisma.commercialWorkItem.findMany({
          where: { organizationId: orgId, id: { in: [...workItemIds] } },
          select: {
            id: true,
            components: {
              select: { materialId: true, laborId: true, equipmentId: true },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const currentWorkItemResourceKeys = new Map<string, Set<string>>();
  for (const wi of workItems) {
    const keys = new Set<string>();
    for (const c of wi.components) {
      if (c.materialId) keys.add(resourceKey("MATERIAL", c.materialId));
      if (c.laborId) keys.add(resourceKey("LABOR", c.laborId));
      if (c.equipmentId) keys.add(resourceKey("EQUIPMENT", c.equipmentId));
    }
    currentWorkItemResourceKeys.set(wi.id, keys);
  }

  const maps: PriceMaps = {
    materials: priceBundle.materials,
    labor: priceBundle.labor,
    equipmentDb,
  };

  return evaluateQuotePriceChanges({
    quoteId: quote.id,
    versionId: quote.currentVersion.id,
    quoteStatus: quote.status,
    lockState: quote.currentVersion.lockState,
    lines: quote.currentVersion.lines.map((l) => ({
      id: l.id,
      designation: l.designation,
      quantity: d(l.quantity),
      unit: l.unit,
      unitCostHt: d(l.unitCostHt),
      unitSellHt: d(l.unitSellHt),
      discountPercent: d(l.discountPercent),
      vatRate: d(l.vatRate),
      kind: l.kind,
      isOptional: l.isOptional,
      commercialWorkItemId: l.commercialWorkItemId,
      compositionSnapshotJson: l.compositionSnapshotJson,
    })),
    maps,
    minMarginPercent,
    currentWorkItemResourceKeys,
  });
}

export type ApplyPriceCheckInput = {
  versionId: string;
  lineIds: string[];
};

/**
 * Applique les prix bibliothèque actuels aux lignes sélectionnées.
 * Recharge toujours les prix (ne fait pas confiance au client).
 * Respecte sellMode du snapshot (MARGIN → recalcule PV ; FIXED_SELL → conserve PV).
 */
export async function applyQuotePriceCheck(
  orgId: string,
  quoteId: string,
  input: ApplyPriceCheckInput,
): Promise<{
  updatedLineIds: string[];
  quoteId: string;
  versionId: string;
}> {
  const { updateLineCompositionSnapshot } = await import("@/lib/commercial/quotes");

  const quote = await prisma.commercialQuote.findFirst({
    where: { id: quoteId, organizationId: orgId },
    include: {
      currentVersion: {
        include: { lines: true },
      },
    },
  });
  if (!quote?.currentVersion) throw new Error("Devis introuvable");
  if (quote.currentVersion.id !== input.versionId) {
    const err = new Error(
      "Version de devis obsolète — rechargez puis réessayez",
    ) as Error & { status?: number };
    err.status = 409;
    throw err;
  }
  if (!["DRAFT", "TO_VALIDATE", "VALIDATED"].includes(quote.status)) {
    const err = new Error(
      "Devis non modifiable dans cet état — créer une nouvelle version après envoi",
    ) as Error & { status?: number };
    err.status = 409;
    throw err;
  }
  if (quote.currentVersion.lockState !== "DRAFT") {
    const err = new Error("Version verrouillée — créer une nouvelle version") as Error & {
      status?: number;
    };
    err.status = 409;
    throw err;
  }

  const lineIdSet = new Set(input.lineIds);
  const lines = quote.currentVersion.lines.filter((l) => lineIdSet.has(l.id));
  if (lines.length === 0) throw new Error("Aucune ligne à mettre à jour");

  const materialIds = new Set<string>();
  const laborIds = new Set<string>();
  const equipmentIds = new Set<string>();
  for (const line of lines) {
    const snap = parseSnapshot(line.compositionSnapshotJson);
    if (!snap) continue;
    for (const c of snap.components) {
      const ref = resourceRef(c);
      if (!ref) continue;
      if (ref.kind === "MATERIAL") materialIds.add(ref.id);
      else if (ref.kind === "LABOR") laborIds.add(ref.id);
      else equipmentIds.add(ref.id);
    }
  }

  const [priceBundle, equipmentDb] = await Promise.all([
    loadCurrentResourcePrices(orgId, {
      materialIds: [...materialIds],
      laborIds: [...laborIds],
      equipmentIds: [...equipmentIds],
    }),
    loadEquipmentDb(orgId, [...equipmentIds]),
  ]);
  const maps: PriceMaps = {
    materials: priceBundle.materials,
    labor: priceBundle.labor,
    equipmentDb,
  };

  const updatedLineIds: string[] = [];
  for (const line of lines) {
    const snap = parseSnapshot(line.compositionSnapshotJson);
    if (!snap) continue;

    const components = snap.components.map((c) => {
      const { ref, current, manual } = currentForComponent(maps, c);
      let unitCostHt = Number(c.unitCostHt) || 0;
      if (!manual && ref && current?.isActive) {
        unitCostHt = current.unitCostHt;
      }
      return {
        name: c.name,
        type: c.type,
        quantityPerUnit: Number(c.quantityPerUnit) || 0,
        unit: c.unit,
        unitCostHt,
        lossPercent: Number(c.lossPercent) || 0,
        comment: c.comment ?? null,
        materialId: c.materialId ?? null,
        laborId: c.laborId ?? null,
        equipmentId: c.equipmentId ?? null,
      };
    });

    const sellMode = snap.sellMode === "FIXED_SELL" ? "FIXED_SELL" : "MARGIN";
    await updateLineCompositionSnapshot(
      orgId,
      quoteId,
      line.id,
      {
        components,
        feesPercent: Number(snap.feesPercent) || 0,
        feesAmountHt: Number(snap.feesAmountHt) || 0,
        sellMode,
        marginPercent: Number(snap.marginPercent) || 0,
        unitSellHt: Number(snap.unitSellHt) || d(line.unitSellHt),
      },
      { pushToLibrary: false },
    );
    updatedLineIds.push(line.id);
  }

  return {
    updatedLineIds,
    quoteId,
    versionId: quote.currentVersion.id,
  };
}

/** Visibilité bouton selon statut (V1.2). */
export { shouldOfferPriceCheck } from "@/lib/commercial/price-check-ui";
