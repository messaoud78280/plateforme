/**
 * COMMANDES-V2D — prochaine action (projection déterministe, pas d'IA).
 * Distinct du statut PO et de l'attention W3.
 */
import type { PurchaseOrderStatus } from "@prisma/client";

export type PurchaseOrderNextActionCode =
  | "ENVOYER_FOURNISSEUR"
  | "OBTENIR_CONFIRMATION"
  | "VALIDER_PROPOSITION_FOURNISSEUR"
  | "ATTENDRE_LIVRAISON"
  | "RECEPTIONNER"
  | "TRAITER_RECEPTION_PARTIELLE"
  | "RELANCER_LIVRAISON_EN_RETARD"
  | "TRAITER_ANOMALIE"
  | "TRAITER_REFUS"
  | "CLOTURER_COMMANDE"
  | "AUCUNE";

export type PurchaseOrderNextAction = {
  code: PurchaseOrderNextActionCode;
  /** Libellé court pour liste / mobile */
  label: string;
  /** true = l'utilisateur doit intervenir (vue À traiter) */
  needsUserAction: boolean;
  /** Lien d'action rapide si applicable */
  hrefKind: "detail" | "reception" | "none";
};

export type PurchaseOrderNextActionInput = {
  status: PurchaseOrderStatus;
  sharedWithSupplier: boolean;
  proposedDeliveryStatus: string;
  requestedDeliveryAt: Date | string | null;
  confirmedDeliveryAt: Date | string | null;
  proposedDeliveryAt?: Date | string | null;
  supplierName?: string | null;
  orderedQty: number;
  receivedQty: number;
  fullyReceived: boolean;
  /** damaged/refused > 0 sur réceptions actives */
  hasReceiptIssue?: boolean;
};

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function supplierShort(name?: string | null): string {
  const n = (name || "").trim();
  if (!n) return "fournisseur";
  return n.split(/\s+/)[0] || n;
}

/**
 * Date de référence livraison (foi opérationnelle) :
 * confirmée > demandée (proposition PENDING n'est pas « foi »).
 */
export function resolvePurchaseOrderDeliveryReference(
  input: Pick<
    PurchaseOrderNextActionInput,
    "confirmedDeliveryAt" | "requestedDeliveryAt"
  >,
): Date | null {
  return toDate(input.confirmedDeliveryAt) ?? toDate(input.requestedDeliveryAt);
}

/**
 * Calcule la prochaine action métier explicable.
 */
export function evaluatePurchaseOrderNextAction(
  input: PurchaseOrderNextActionInput,
  opts?: { now?: Date },
): PurchaseOrderNextAction {
  const now = opts?.now ?? new Date();
  const remaining = Math.max(0, input.orderedQty - input.receivedQty);
  const supplier = supplierShort(input.supplierName);

  if (input.status === "ANNULEE") {
    return { code: "AUCUNE", label: "Commande annulée", needsUserAction: false, hrefKind: "none" };
  }
  if (input.status === "CLOTUREE") {
    return { code: "AUCUNE", label: "Clôturée", needsUserAction: false, hrefKind: "none" };
  }
  if (input.status === "REFUSEE" || input.proposedDeliveryStatus === "REFUSED") {
    return {
      code: "TRAITER_REFUS",
      label: `Replanifier / Contacter ${supplier}`,
      needsUserAction: true,
      hrefKind: "detail",
    };
  }

  if (input.hasReceiptIssue && !input.fullyReceived) {
    return {
      code: "TRAITER_ANOMALIE",
      label: "Traiter l'anomalie",
      needsUserAction: true,
      hrefKind: "detail",
    };
  }

  if (input.proposedDeliveryStatus === "PENDING") {
    return {
      code: "VALIDER_PROPOSITION_FOURNISSEUR",
      label: "Valider la nouvelle date",
      needsUserAction: true,
      hrefKind: "detail",
    };
  }

  if (
    input.status === "BROUILLON" ||
    input.status === "A_VALIDER" ||
    input.status === "VALIDEE" ||
    (["ENVOYEE_FOURNISSEUR", "A_CONFIRMER"].includes(input.status) && !input.sharedWithSupplier)
  ) {
    if (!input.sharedWithSupplier) {
      return {
        code: "ENVOYER_FOURNISSEUR",
        label: "Envoyer au fournisseur",
        needsUserAction: true,
        hrefKind: "detail",
      };
    }
  }

  if (
    !input.confirmedDeliveryAt &&
    (input.status === "A_CONFIRMER" ||
      input.status === "ENVOYEE_FOURNISSEUR" ||
      (input.sharedWithSupplier &&
        !["RECUE", "PARTIELLEMENT_RECUE", "CONFIRMEE", "LIVRAISON_PROGRAMMEE"].includes(
          input.status,
        )))
  ) {
    return {
      code: "OBTENIR_CONFIRMATION",
      label: "Obtenir confirmation",
      needsUserAction: true,
      hrefKind: "detail",
    };
  }

  if (input.status === "RECUE" || (input.fullyReceived && input.orderedQty > 0)) {
    if (input.status === "RECUE") {
      return {
        code: "CLOTURER_COMMANDE",
        label: "Clôturer la commande",
        needsUserAction: false,
        hrefKind: "detail",
      };
    }
  }

  if (
    (input.status === "PARTIELLEMENT_RECUE" || (input.receivedQty > 0 && remaining > 0)) &&
    !input.fullyReceived
  ) {
    const refPartial = resolvePurchaseOrderDeliveryReference(input);
    if (refPartial && startOfLocalDay(refPartial).getTime() < startOfLocalDay(now).getTime()) {
      return {
        code: "RELANCER_LIVRAISON_EN_RETARD",
        label: `Relancer ${supplier} — ${Math.round(remaining)} restent`,
        needsUserAction: true,
        hrefKind: "reception",
      };
    }
    return {
      code: "TRAITER_RECEPTION_PARTIELLE",
      label: `Réceptionner le solde (${Math.round(remaining)})`,
      needsUserAction: true,
      hrefKind: "reception",
    };
  }

  const ref = resolvePurchaseOrderDeliveryReference(input);
  const confirmed =
    Boolean(input.confirmedDeliveryAt) ||
    input.status === "CONFIRMEE" ||
    input.status === "LIVRAISON_PROGRAMMEE";

  if (confirmed && ref && !input.fullyReceived) {
    const dayStart = startOfLocalDay(now);
    const dayEnd = endOfLocalDay(now);
    // Même jour calendaire → réceptionner (même si l'heure est passée)
    if (ref >= dayStart && ref <= dayEnd) {
      return {
        code: "RECEPTIONNER",
        label: "Réceptionner",
        needsUserAction: true,
        hrefKind: "reception",
      };
    }
    if (ref.getTime() < dayStart.getTime()) {
      return {
        code: "RELANCER_LIVRAISON_EN_RETARD",
        label: `Livraison en retard — relancer ${supplier}`,
        needsUserAction: true,
        hrefKind: "reception",
      };
    }
    return {
      code: "ATTENDRE_LIVRAISON",
      label: "Attendre livraison",
      needsUserAction: false,
      hrefKind: "none",
    };
  }

  if (!input.confirmedDeliveryAt && toDate(input.requestedDeliveryAt) && input.sharedWithSupplier) {
    return {
      code: "OBTENIR_CONFIRMATION",
      label: "Obtenir confirmation",
      needsUserAction: true,
      hrefKind: "detail",
    };
  }

  if (input.status === "BROUILLON") {
    return {
      code: "ENVOYER_FOURNISSEUR",
      label: "Compléter / envoyer",
      needsUserAction: true,
      hrefKind: "detail",
    };
  }

  return { code: "AUCUNE", label: "—", needsUserAction: false, hrefKind: "none" };
}

/** Raison attention courte et explicable (liste). */
export function formatPurchaseOrderAttentionWhy(
  input: {
    attentionReason: string | null;
    deliveryAt: string | null;
    deliveryKind: string;
    orderedQty: number;
    receivedQty: number;
    fullyReceived: boolean;
    nextActionCode: PurchaseOrderNextActionCode;
  },
  opts?: { now?: Date },
): string | null {
  const now = opts?.now ?? new Date();
  if (input.nextActionCode === "RELANCER_LIVRAISON_EN_RETARD" && input.deliveryAt) {
    const ref = new Date(input.deliveryAt);
    const hours = Math.max(0, (now.getTime() - ref.getTime()) / 3600000);
    if (hours < 36) {
      const h = Math.max(1, Math.round(hours));
      return `Livraison en retard depuis ${h} h`;
    }
    const days = Math.max(1, Math.round(hours / 24));
    return `Livraison en retard depuis ${days === 1 ? "1 jour" : `${days} jours`}`;
  }
  if (input.nextActionCode === "RECEPTIONNER" && input.deliveryAt) {
    const t = new Date(input.deliveryAt).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Livraison attendue aujourd'hui à ${t}`;
  }
  if (input.nextActionCode === "TRAITER_RECEPTION_PARTIELLE") {
    const rem = Math.round(input.orderedQty - input.receivedQty);
    if (rem > 0) return `${rem} unité${rem > 1 ? "s" : ""} restent à recevoir`;
  }
  return input.attentionReason;
}
