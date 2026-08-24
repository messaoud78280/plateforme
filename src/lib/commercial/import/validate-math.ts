/**
 * Contrôles arithmétiques sur un brouillon d’import.
 */
import { calculateLine, roundMoney } from "@/lib/commercial/money";
import { moneyClose } from "@/lib/commercial/import/french-number";
import type { ImportedQuoteDraft, ImportedLine } from "@/lib/commercial/import/types";

export function validateImportedLineMath(line: ImportedLine): ImportedLine {
  if (line.kind !== "WORK") return line;
  const qty = line.quantity;
  const pu = line.unitSellHt;
  if (qty == null || pu == null) {
    return {
      ...line,
      confidence: line.confidence === "ok" ? "warn" : line.confidence,
      warnings: [...line.warnings, "Quantité ou PU manquant — à vérifier"],
    };
  }

  const discount = line.discountPercent ?? 0;
  const calc = calculateLine({
    kind: "WORK",
    quantity: qty,
    unitSellHt: pu,
    discountPercent: discount,
    vatRate: line.vatRate ?? 0,
  });

  const warnings = [...line.warnings];
  let confidence = line.confidence;
  let discountPercent = line.discountPercent;

  if (line.lineSellHt != null && !moneyClose(calc.lineSellHt, line.lineSellHt)) {
    // Essayer de déduire une remise si montant affiché < brut
    const gross = roundMoney(qty * pu, 2);
    if (line.lineSellHt < gross - 0.02 && gross > 0) {
      const inferred = roundMoney((1 - line.lineSellHt / gross) * 100, 2);
      if (inferred > 0 && inferred < 100) {
        const withDisc = calculateLine({
          kind: "WORK",
          quantity: qty,
          unitSellHt: pu,
          discountPercent: inferred,
          vatRate: line.vatRate ?? 0,
        });
        if (moneyClose(withDisc.lineSellHt, line.lineSellHt)) {
          discountPercent = inferred;
          warnings.push(
            `Remise déduite ${inferred} % (montant HT ≠ quantité × PU) — à confirmer`,
          );
          confidence = "warn";
        } else {
          warnings.push("Montant HT incohérent avec quantité × PU — à vérifier");
          confidence = "warn";
        }
      } else {
        warnings.push("Montant HT incohérent — à vérifier");
        confidence = "warn";
      }
    } else {
      warnings.push("Montant HT incohérent — à vérifier");
      confidence = "warn";
    }
  }

  return { ...line, discountPercent, confidence, warnings };
}

export function validateImportedDraftMath(draft: ImportedQuoteDraft): ImportedQuoteDraft {
  const sections = draft.sections.map((s) => ({
    ...s,
    lines: s.lines.map(validateImportedLineMath),
  }));

  const workLines = sections.flatMap((s) => s.lines.filter((l) => l.kind === "WORK"));
  const calcResults = workLines.map((l) =>
    calculateLine({
      kind: "WORK",
      quantity: l.quantity ?? 0,
      unitSellHt: l.unitSellHt ?? 0,
      discountPercent: l.discountPercent ?? 0,
      vatRate: l.vatRate ?? draft.totals.vatRateGuess ?? 10,
    }),
  );

  let sumHt = 0;
  let sumVat = 0;
  for (const r of calcResults) {
    sumHt += r.lineSellHt;
    sumVat += r.lineVat;
  }
  sumHt = roundMoney(sumHt, 2);
  sumVat = roundMoney(sumVat, 2);
  const sumTtc = roundMoney(sumHt + sumVat, 2);

  const warnings = [...draft.warnings];
  let mathOk = true;
  let discountAmbiguity = draft.flags.discountAmbiguity;

  if (draft.totals.totalHt != null && !moneyClose(sumHt, draft.totals.totalHt, 0.05)) {
    mathOk = false;
    warnings.push(
      `Somme des lignes HT (${sumHt.toFixed(2)}) ≠ total HT document (${draft.totals.totalHt.toFixed(2)}) — à vérifier`,
    );
    discountAmbiguity = true;
  }
  if (draft.totals.totalTtc != null && !moneyClose(sumTtc, draft.totals.totalTtc, 0.05)) {
    mathOk = false;
    warnings.push(
      `Total TTC recalculé (${sumTtc.toFixed(2)}) ≠ document (${draft.totals.totalTtc.toFixed(2)}) — à vérifier`,
    );
  }

  for (const l of workLines) {
    if (l.warnings.some((w) => /remise|incohérent/i.test(w))) {
      discountAmbiguity = true;
    }
  }

  return {
    ...draft,
    sections,
    warnings,
    flags: {
      ...draft.flags,
      mathOk,
      discountAmbiguity,
    },
    totals: {
      ...draft.totals,
      confidence: mathOk ? draft.totals.confidence : "warn",
    },
  };
}
