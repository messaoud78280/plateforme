/**
 * CHANTIERS-V2B.1 — Affichage livraison portefeuille.
 * Source de vérité = PurchaseOrder (pas AgendaEvent).
 */

export type PortfolioDeliveryPhase = "requested" | "proposed" | "confirmed";

export type PortfolioDeliverySnapshot = {
  id: string;
  supplierName: string;
  /** Instant principal (tri / fallback affichage) */
  at: string;
  requestedAt: string | null;
  proposedAt: string | null;
  confirmedAt: string | null;
  phase: PortfolioDeliveryPhase;
  /** Demandée | Proposition | Confirmée */
  statusHint: string;
  href: string;
};

export function resolvePortfolioDelivery(order: {
  id: string;
  status: string;
  confirmedDeliveryAt: Date | null;
  requestedDeliveryAt: Date | null;
  proposedDeliveryAt: Date | null;
  proposedDeliveryStatus: string | null;
  supplierName: string;
}): PortfolioDeliverySnapshot | null {
  const confirmed = order.confirmedDeliveryAt;
  const requested = order.requestedDeliveryAt;
  const proposed =
    order.proposedDeliveryStatus === "PENDING" && order.proposedDeliveryAt
      ? order.proposedDeliveryAt
      : null;

  if (confirmed) {
    return {
      id: order.id,
      supplierName: order.supplierName,
      at: confirmed.toISOString(),
      requestedAt: requested?.toISOString() ?? null,
      proposedAt: proposed?.toISOString() ?? null,
      confirmedAt: confirmed.toISOString(),
      phase: "confirmed",
      statusHint: "Confirmée",
      href: `/dashboard/commandes/${order.id}`,
    };
  }

  if (!requested && !proposed) return null;

  if (proposed && requested) {
    return {
      id: order.id,
      supplierName: order.supplierName,
      at: requested.toISOString(),
      requestedAt: requested.toISOString(),
      proposedAt: proposed.toISOString(),
      confirmedAt: null,
      phase: "proposed",
      statusHint: "Proposition",
      href: `/dashboard/commandes/${order.id}`,
    };
  }

  if (proposed) {
    return {
      id: order.id,
      supplierName: order.supplierName,
      at: proposed.toISOString(),
      requestedAt: null,
      proposedAt: proposed.toISOString(),
      confirmedAt: null,
      phase: "proposed",
      statusHint: "Proposition",
      href: `/dashboard/commandes/${order.id}`,
    };
  }

  return {
    id: order.id,
    supplierName: order.supplierName,
    at: requested!.toISOString(),
    requestedAt: requested!.toISOString(),
    proposedAt: null,
    confirmedAt: null,
    phase: "requested",
    statusHint: "Demandée",
    href: `/dashboard/commandes/${order.id}`,
  };
}

/** Même livraison : AgendaEvent LIVRAISON lié au PO, ou titre clairement doublon. */
export function isSameDeliveryAsAgendaEvent(
  delivery: { id: string; supplierName: string } | null | undefined,
  event: {
    type?: string | null;
    purchaseOrderId?: string | null;
    title?: string | null;
  } | null | undefined,
): boolean {
  if (!delivery || !event) return false;
  if (event.purchaseOrderId && event.purchaseOrderId === delivery.id) return true;
  if (event.type === "LIVRAISON") {
    const t = (event.title ?? "").toLowerCase();
    const s = delivery.supplierName.toLowerCase();
    if (t.includes("livraison") && (t.includes(s) || t.includes("point.p") || t.includes("bc-2026"))) {
      return true;
    }
  }
  return false;
}
