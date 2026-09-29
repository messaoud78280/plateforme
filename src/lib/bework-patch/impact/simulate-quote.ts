/**
 * Simulation devis — totaux via calculateLine (mémoire uniquement).
 */
import { calculateLine, roundMoney } from "@/lib/commercial/money";
import type { ImpactQuote, ImpactQuoteLine } from "@/lib/bework-patch/impact/types";

export type QuoteLineSim = {
  lineId: string;
  designation: string;
  beforeQty: number;
  afterQty: number;
  beforeUnitSellHt: number;
  afterUnitSellHt: number;
  beforeLineHt: number;
  afterLineHt: number;
};

export function simulateQuoteLine(input: {
  line: ImpactQuoteLine;
  quantity?: number;
  unitSellHt?: number;
  discountPercent?: number;
}): QuoteLineSim {
  const before = calculateLine({
    kind: (input.line.kind as "WORK" | undefined) ?? "WORK",
    quantity: input.line.quantity,
    unitSellHt: input.line.unitSellHt,
    discountPercent: input.line.discountPercent,
    vatRate: input.line.vatRate,
  });
  const afterQty = input.quantity ?? input.line.quantity;
  const afterPu = input.unitSellHt ?? input.line.unitSellHt;
  const afterDisc = input.discountPercent ?? input.line.discountPercent;
  const after = calculateLine({
    kind: (input.line.kind as "WORK" | undefined) ?? "WORK",
    quantity: afterQty,
    unitSellHt: afterPu,
    discountPercent: afterDisc,
    vatRate: input.line.vatRate,
  });
  return {
    lineId: input.line.id,
    designation: input.line.designation,
    beforeQty: input.line.quantity,
    afterQty,
    beforeUnitSellHt: input.line.unitSellHt,
    afterUnitSellHt: afterPu,
    beforeLineHt: before.lineSellHt,
    afterLineHt: after.lineSellHt,
  };
}

export function simulateQuoteTotals(
  quote: ImpactQuote,
  lineOverrides: Map<string, { quantity?: number; unitSellHt?: number }>,
): { beforeHt: number; afterHt: number } {
  let beforeHt = 0;
  let afterHt = 0;
  for (const line of quote.lines) {
    const ov = lineOverrides.get(line.id);
    const b = calculateLine({
      quantity: line.quantity,
      unitSellHt: line.unitSellHt,
      discountPercent: line.discountPercent,
      vatRate: line.vatRate,
    });
    const a = calculateLine({
      quantity: ov?.quantity ?? line.quantity,
      unitSellHt: ov?.unitSellHt ?? line.unitSellHt,
      discountPercent: line.discountPercent,
      vatRate: line.vatRate,
    });
    beforeHt = roundMoney(beforeHt + b.lineSellHt);
    afterHt = roundMoney(afterHt + a.lineSellHt);
  }
  return { beforeHt, afterHt };
}
