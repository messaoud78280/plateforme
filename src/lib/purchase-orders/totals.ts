export type OrderLineInput = {
  quantity: number;
  unitPriceHt?: number | null;
  tvaRate?: number | null;
};

export function lineTotalHt(line: OrderLineInput): number | null {
  if (line.unitPriceHt == null || Number.isNaN(line.unitPriceHt)) return null;
  return Math.round(line.quantity * line.unitPriceHt * 100) / 100;
}

export function computeOrderAmountHt(
  lines: OrderLineInput[],
  opts?: { discountHt?: number | null; deliveryFeesHt?: number | null },
): number | null {
  let sum = 0;
  let any = false;
  for (const line of lines) {
    const t = lineTotalHt(line);
    if (t != null) {
      sum += t;
      any = true;
    }
  }
  if (!any) return null;
  sum -= opts?.discountHt ?? 0;
  sum += opts?.deliveryFeesHt ?? 0;
  return Math.round(sum * 100) / 100;
}
