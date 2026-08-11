/** Types V1.2 — vérif. prix (sans dépendance Prisma / serveur). */

export type PriceCheckStatus =
  | "UP_TO_DATE"
  | "CHANGES_FOUND"
  | "MANUAL_REVIEW_REQUIRED"
  | "NOTHING_TO_COMPARE";

export type ResourceKind = "MATERIAL" | "LABOR" | "EQUIPMENT";

export type ResourcePriceChange = {
  key: string;
  kind: ResourceKind;
  resourceId: string;
  designationSnapshot: string;
  designationCurrent: string | null;
  unit: string;
  snapshotUnitCostHt: number;
  currentUnitCostHt: number | null;
  deltaUnitHt: number | null;
  deltaPercent: number | null;
  status: "CHANGED" | "UNCHANGED" | "MISSING" | "INACTIVE";
  affectedLineIds: string[];
  affectedLineDesignations: string[];
  totalCostImpactHt: number;
};

export type AffectedLinePriceCheck = {
  lineId: string;
  designation: string;
  quantity: number;
  unit: string;
  sellMode: "MARGIN" | "FIXED_SELL";
  snapshotUnitCostHt: number;
  currentUnitCostHt: number;
  snapshotLineCostHt: number;
  currentLineCostHt: number;
  costDeltaHt: number;
  snapshotUnitSellHt: number;
  analysisUnitSellHt: number;
  snapshotLineSellHt: number;
  analysisLineSellHt: number;
  oldMarquePercent: number;
  currentIndicativeMarquePercent: number;
  oldMarkupPercent: number;
  currentIndicativeMarkupPercent: number;
  oldSellCoefficient: number;
  currentIndicativeSellCoefficient: number;
  hasMissingResources: boolean;
  changedResourceKeys: string[];
  compositionMayHaveChanged: boolean;
};

export type QuotePriceCheckResult = {
  status: PriceCheckStatus;
  quoteId: string;
  versionId: string;
  checkedAt: string;
  oldestSnapshotAt: string | null;
  comparableResourceCount: number;
  manualComponentCount: number;
  changedResourceCount: number;
  missingResourceCount: number;
  affectedLineCount: number;
  oldEstimatedCostHt: number;
  currentEstimatedCostHt: number;
  costDeltaHt: number;
  sellHtUnchanged: number;
  oldMarquePercent: number;
  currentIndicativeMarquePercent: number;
  oldMarkupPercent: number;
  currentIndicativeMarkupPercent: number;
  oldSellCoefficient: number;
  currentIndicativeSellCoefficient: number;
  minMarginPercent: number | null;
  belowMinMarginAlert: boolean;
  belowMinMarginMessage: string | null;
  changedResources: ResourcePriceChange[];
  missingResources: ResourcePriceChange[];
  affectedLines: AffectedLinePriceCheck[];
  compositionHints: Array<{ lineId: string; designation: string; message: string }>;
  canApply: boolean;
  applyBlockedReason: string | null;
};
