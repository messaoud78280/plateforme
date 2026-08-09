import type { PurchaseOrderStatus } from "@prisma/client";
import type {
  AttentionCode,
  FollowUpAttentionItem,
  FollowUpAttentionResult,
} from "@/lib/follow-up/attention/types";
import type { PurchaseOrderAttentionPolicy } from "@/lib/purchase-orders/attention/policy";

export type PurchaseOrderAttentionCode = Extract<
  AttentionCode,
  | "SUPPLIER_NO_RESPONSE"
  | "SUPPLIER_REFUSED"
  | "SUPPLIER_PROPOSAL_PENDING"
  | "ORDER_NOT_SENT"
  | "DELIVERY_UNCONFIRMED"
  | "DELIVERY_OVERDUE"
  | "PARTIAL_RECEIPT_PENDING"
  | "RECEIPT_ISSUE"
  | "DELIVERY_NOTE_MISSING"
>;

export type PurchaseOrderAttentionLineInput = {
  id: string;
  designation: string;
  unit: string;
  quantity: number;
};

export type PurchaseOrderAttentionReceiptLineInput = {
  orderLineId: string;
  receivedQty: number;
  damagedQty: number;
  refusedQty: number;
  receiptId: string;
};

export type PurchaseOrderAttentionReceiptInput = {
  id: string;
  receivedAt: Date | string;
  cancelledAt?: Date | string | null;
  status: string;
  deliveryNoteNumber?: string | null;
  hasBlDocument: boolean;
};

export type PurchaseOrderAttentionInput = {
  id: string;
  number: string;
  status: PurchaseOrderStatus | string;
  subject?: string | null;
  sharedWithSupplier: boolean;
  /** Date fiable du partage (event kind=shared) — jamais updatedAt. */
  sharedWithSupplierAt?: Date | string | null;
  /** Id event kind=shared (épisode SUPPLIER_NO_RESPONSE). */
  sharedEventId?: string | null;
  /** Id event kind=supplier_propose. */
  proposeEventId?: string | null;
  /** Id event kind=supplier_refuse. */
  refuseEventId?: string | null;
  requestedDeliveryAt?: Date | string | null;
  confirmedDeliveryAt?: Date | string | null;
  proposedDeliveryAt?: Date | string | null;
  proposedDeliveryStatus?: string | null;
  supplierRefuseReason?: string | null;
  supplierName?: string | null;
  projectTitle?: string | null;
  responsibleId?: string | null;
  requestedById?: string | null;
  responsibleName?: string | null;
  requestedByName?: string | null;
  lines: PurchaseOrderAttentionLineInput[];
  receipts: PurchaseOrderAttentionReceiptInput[];
  receiptLines: PurchaseOrderAttentionReceiptLineInput[];
  agendaEventId?: string | null;
};

export type EvaluatePurchaseOrderAttentionContext = {
  now?: Date;
  policy?: PurchaseOrderAttentionPolicy;
};

export type PurchaseOrderAttentionItem = FollowUpAttentionItem;
export type PurchaseOrderAttentionResult = FollowUpAttentionResult;

export type PurchaseOrderReceivingSnapshot = {
  totalOrdered: number;
  totalReceivedConforming: number;
  totalDamaged: number;
  totalRefused: number;
  totalRemaining: number;
  fullyReceived: boolean;
  partiallyReceived: boolean;
  hasIssues: boolean;
  lastActiveReceiptAt: Date | null;
  activeReceiptCount: number;
  lineSummaries: {
    designation: string;
    unit: string;
    ordered: number;
    remaining: number;
    damaged: number;
    refused: number;
  }[];
};
