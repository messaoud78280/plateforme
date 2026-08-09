/**
 * CDE-3B1 — Délais d’attention commandes (centralisés).
 * Pas de hardcode dans React / composants. Paramétrables plus tard par entreprise.
 */

export type PurchaseOrderAttentionPolicy = {
  /** Fournisseur sans réponse après partage (heures). */
  supplierResponseHours: number;
  /** Livraison demandée dans ≤ N h sans confirmation → IMPORTANT. */
  unconfirmedDeliveryImportantHours: number;
  /** Livraison demandée dans ≤ N h sans confirmation → URGENT. */
  unconfirmedDeliveryUrgentHours: number;
  /** Tolérance après confirmedDeliveryAt avant alerte réception (heures). */
  deliveryGraceHours: number;
  /** Retard livraison confirmée → URGENT (heures). */
  deliveryOverdueUrgentHours: number;
  /** Retard livraison confirmée → CRITIQUE (heures). */
  deliveryOverdueCriticalHours: number;
  /** Après dernière réception partielle → IMPORTANT (heures). */
  partialReceiptImportantHours: number;
  /** Après dernière réception partielle → URGENT (heures). */
  partialReceiptUrgentHours: number;
  /** Après réception, délai avant alerte BL manquant IMPORTANT (heures). */
  deliveryNoteImportantHours: number;
  /** BL manquant → URGENT (heures). */
  deliveryNoteUrgentHours: number;
  /** Règle BL manquant activable. */
  deliveryNoteMissingEnabled: boolean;
  /** Proposition fournisseur PENDING → URGENT après N h. */
  proposalPendingUrgentHours: number;
  /** Commande non envoyée + livraison demandée dans ≤ N h → ORDER_NOT_SENT. */
  orderNotSentWarningHours: number;
  /** Part de quantités endommagées/refusées → URGENT (≥), sinon IMPORTANT. */
  receiptIssueUrgentRatio: number;
};

export const DEFAULT_PURCHASE_ORDER_ATTENTION_POLICY: PurchaseOrderAttentionPolicy = {
  supplierResponseHours: 48,
  unconfirmedDeliveryImportantHours: 48,
  unconfirmedDeliveryUrgentHours: 24,
  deliveryGraceHours: 0.5,
  deliveryOverdueUrgentHours: 24,
  deliveryOverdueCriticalHours: 72,
  partialReceiptImportantHours: 24,
  partialReceiptUrgentHours: 72,
  deliveryNoteImportantHours: 24,
  deliveryNoteUrgentHours: 72,
  deliveryNoteMissingEnabled: true,
  proposalPendingUrgentHours: 24,
  orderNotSentWarningHours: 48,
  receiptIssueUrgentRatio: 0.25,
};
