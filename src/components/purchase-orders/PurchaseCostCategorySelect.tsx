"use client";

import {
  PURCHASE_COST_CATEGORIES,
  PURCHASE_COST_CATEGORY_LABELS,
  type SupplierCostCategory,
} from "@/lib/purchase-orders/cost-category";

export function PurchaseCostCategorySelect({
  value,
  onChange,
  className,
  id,
}: {
  value: SupplierCostCategory;
  onChange: (next: SupplierCostCategory) => void;
  className?: string;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as SupplierCostCategory)}
      className={className ?? "rounded-lg border border-slate-200 px-3 py-2 text-sm"}
    >
      {PURCHASE_COST_CATEGORIES.map((c) => (
        <option key={c} value={c}>
          {PURCHASE_COST_CATEGORY_LABELS[c]}
        </option>
      ))}
    </select>
  );
}
