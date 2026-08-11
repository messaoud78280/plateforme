/**
 * MATERIAUX-V1B — calculs purs (pas d'I/O).
 * REÇU = qty conforme ReceiptLine (reçu − endommagé − refusé) sur réceptions non annulées.
 * COMMANDÉ = Σ allocations sur lignes dont PO ≠ ANNULEE / REFUSEE.
 */
export type MaterialCoverageState =
  | "A_COMMANDER"
  | "PARTIELLEMENT_COMMANDE"
  | "COMMANDE"
  | "PARTIELLEMENT_RECU"
  | "RECU"
  | "ANNULE";

export type MaterialRequirementProgressInput = {
  status: "PROPOSED" | "VALIDATED" | "CANCELLED" | string;
  quantityRequired: number;
  unit: string;
  allocations: Array<{
    quantityAllocated: number;
    lineUnit: string;
    orderStatus: string;
    /** Quantité conforme reçue sur cette ligne (déjà proportionnée côté loader si multi-link) */
    receivedConforming: number;
  }>;
};

export type MaterialRequirementProgress = {
  need: number;
  ordered: number;
  received: number;
  remainingToOrder: number;
  remainingToReceive: number;
  coverageState: MaterialCoverageState;
  /** true si au moins une allocation a une unité incompatible */
  unitMismatch: boolean;
  resteLabel: string;
};

const CANCELLED_ORDER = new Set(["ANNULEE", "REFUSEE"]);

/** Variantes triviales d'unité — pas de conversion métier. */
export function normalizeMaterialUnit(unit: string): string {
  const u = unit.trim().toLowerCase().replace(/\s+/g, " ");
  if (["u", "unité", "unites", "unités", "unit", "units", "pce", "pcs", "pc"].includes(u)) {
    return "u";
  }
  return u;
}

export function unitsCompatible(a: string, b: string): boolean {
  return normalizeMaterialUnit(a) === normalizeMaterialUnit(b);
}

export function calculateMaterialRequirementProgress(
  input: MaterialRequirementProgressInput,
): MaterialRequirementProgress {
  if (input.status === "CANCELLED") {
    return {
      need: Number(input.quantityRequired) || 0,
      ordered: 0,
      received: 0,
      remainingToOrder: 0,
      remainingToReceive: 0,
      coverageState: "ANNULE",
      unitMismatch: false,
      resteLabel: "Annulé",
    };
  }

  const need = Math.max(0, Number(input.quantityRequired) || 0);
  let ordered = 0;
  let received = 0;
  let unitMismatch = false;

  for (const a of input.allocations) {
    if (CANCELLED_ORDER.has(a.orderStatus)) continue;
    if (!unitsCompatible(input.unit, a.lineUnit)) {
      unitMismatch = true;
      continue;
    }
    ordered += Math.max(0, Number(a.quantityAllocated) || 0);
    received += Math.max(0, Number(a.receivedConforming) || 0);
  }

  // Reçu ne peut pas dépasser commandé alloué compatible
  received = Math.min(received, ordered);

  const remainingToOrder = Math.max(need - ordered, 0);
  const remainingToReceive = Math.max(ordered - received, 0);

  let coverageState: MaterialCoverageState;
  if (unitMismatch && ordered === 0 && received === 0) {
    coverageState = remainingToOrder > 0 ? "A_COMMANDER" : "COMMANDE";
  } else if (need > 0 && received >= need - 1e-9 && remainingToReceive <= 1e-9) {
    coverageState = "RECU";
  } else if (received > 0 && remainingToReceive > 0) {
    coverageState = "PARTIELLEMENT_RECU";
  } else if (ordered >= need - 1e-9 && remainingToReceive > 0) {
    coverageState = "COMMANDE";
  } else if (ordered > 0 && remainingToOrder > 0) {
    coverageState = "PARTIELLEMENT_COMMANDE";
  } else if (ordered <= 0) {
    coverageState = "A_COMMANDER";
  } else {
    coverageState = "COMMANDE";
  }

  let resteLabel = "Couvert";
  if (unitMismatch && ordered === 0)
    resteLabel = "Unité différente — correspondance à confirmer";
  else if (remainingToOrder > 0)
    resteLabel = `${formatQty(remainingToOrder)} à commander`;
  else if (remainingToReceive > 0)
    resteLabel = `${formatQty(remainingToReceive)} à recevoir`;
  else if (coverageState === "RECU") resteLabel = "Reçu";
  else resteLabel = "Couvert";

  return {
    need,
    ordered,
    received,
    remainingToOrder,
    remainingToReceive,
    coverageState,
    unitMismatch,
    resteLabel,
  };
}

export function formatQty(n: number): string {
  if (!Number.isFinite(n)) return "0";
  const r = Math.round(n * 1000) / 1000;
  return Number.isInteger(r) ? String(r) : String(r);
}

export function coverageStateLabel(state: MaterialCoverageState): string {
  switch (state) {
    case "A_COMMANDER":
      return "À commander";
    case "PARTIELLEMENT_COMMANDE":
      return "Partiellement commandé";
    case "COMMANDE":
      return "Commandé";
    case "PARTIELLEMENT_RECU":
      return "Partiellement reçu";
    case "RECU":
      return "Reçu";
    case "ANNULE":
      return "Annulé";
    default:
      return state;
  }
}

export function normalizeMaterialLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}
