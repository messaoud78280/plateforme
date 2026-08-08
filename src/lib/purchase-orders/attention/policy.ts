/**
 * CDE-3B1 — Délais d’attention commandes (centralisés).
 * Pas de hardcode dans React / composants. Paramétrables plus tard par entreprise.
 */

export type PurchaseOrderAttentionPolicy = {
  /** Fournisseur sans réponse après partage (heures). */
  supplierResponseHours: number;
  /** Livraison demandée dans ≤ N h sans confirmation → A_SURVEILLER. */
  unconfirmedDeliveryWarningHours: number;
  /** Tolérance après confirmedDeliveryAt avant alerte réception (heures). */
  deliveryGraceHours: number;
  /** Après dernière réception partielle, délai avant rappel reste à livrer (heures). */
  partialReceiptReminderHours: number;
  /** Après réception, délai avant alerte BL manquant (heures). */
  deliveryNoteGraceHours: number;
  /** Règle BL manquant activable (préparation désactivation entreprise). */
  deliveryNoteMissingEnabled: boolean;
  /** Après grace, retard livraison sans réception → URGENT (heures). */
  deliveryNotReceivedUrgentHours: number;
  /** Part de quantités endommagées/refusées → URGENT (≥), sinon IMPORTANT. */
  receiptIssueUrgentRatio: number;
};

export const DEFAULT_PURCHASE_ORDER_ATTENTION_POLICY: PurchaseOrderAttentionPolicy = {
  supplierResponseHours: 48,
  unconfirmedDeliveryWarningHours: 48,
  deliveryGraceHours: 0.5,
  partialReceiptReminderHours: 48,
  deliveryNoteGraceHours: 24,
  deliveryNoteMissingEnabled: true,
  deliveryNotReceivedUrgentHours: 4,
  receiptIssueUrgentRatio: 0.25,
};
