/**
 * Helpers canoniques rendement planning — présentation / qualité uniquement.
 * Aucun recalcul de durée.
 */

export type ProductivityFields = {
  rateValue: number | null | undefined;
  rateUnit?: string | null;
  ratePerLabel?: string | null;
  quantityUnit?: string | null;
  durationMode?: string | null;
  kind?: string | null;
  phaseRole?: string | null;
};

/** Rendement renseigné = nombre fini strictement positif. */
export function hasProductivity(
  rateValue: number | null | undefined,
): boolean {
  return typeof rateValue === "number" && Number.isFinite(rateValue) && rateValue > 0;
}

/**
 * Un rendement est attendu uniquement quand le mode durée en dépend.
 * FIXED / MANUAL / contrôle / remise / attente : non exigé.
 * (Pas d’heuristique fragile sur le libellé.)
 */
export function isProductivityExpected(task: {
  durationMode?: string | null;
  kind?: string | null;
  phaseRole?: string | null;
}): boolean {
  const kind = (task.kind ?? "").toLowerCase();
  if (kind === "control" || kind === "wait" || kind === "handover") {
    return false;
  }
  const role = (task.phaseRole ?? "").toLowerCase();
  if (role === "controls" || role === "handover") {
    return false;
  }
  const mode = (task.durationMode ?? "").toLowerCase();
  return mode === "computed" || mode === "computed_workload";
}

/** Manque de rendement réellement attendu. */
export function isMissingProductivity(task: {
  rateValue: number | null | undefined;
  durationMode?: string | null;
  kind?: string | null;
  phaseRole?: string | null;
}): boolean {
  return isProductivityExpected(task) && !hasProductivity(task.rateValue);
}

/** Libellé d’affichage rendement (contrat update_productivity : rate_value ± unit). */
export function formatProductivityDisplay(task: ProductivityFields): string {
  if (!hasProductivity(task.rateValue)) {
    if (isProductivityExpected(task)) return "Rendement à renseigner";
    return "—";
  }
  const n = task.rateValue as number;
  const value = Number.isInteger(n)
    ? String(n)
    : n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  const rawUnit = (task.rateUnit ?? "").trim();
  if (rawUnit) {
    // rateUnit peut déjà contenir "/j"
    if (/\/\s*j/i.test(rawUnit)) return `${value} ${rawUnit}`;
    return `${value} ${rawUnit}/j`;
  }
  const qtyUnit = (task.quantityUnit ?? "").trim();
  const unit =
    qtyUnit && !/^forfait$/i.test(qtyUnit) ? qtyUnit : "U";
  const per = task.ratePerLabel ? ` (${task.ratePerLabel})` : "";
  return `${value} ${unit}/j${per}`;
}
