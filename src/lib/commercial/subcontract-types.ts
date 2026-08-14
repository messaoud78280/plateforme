/**
 * DF-6D — types et règles pures (sans Prisma, utilisable côté client).
 */
import { roundMoney } from "@/lib/commercial/money";

export const SUBCONTRACT_STATUSES = [
  "PREPARATION",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

export type SubcontractStatus = (typeof SUBCONTRACT_STATUSES)[number];

export const SUBCONTRACT_STATUS_LABELS: Record<SubcontractStatus, string> = {
  PREPARATION: "Préparation",
  IN_PROGRESS: "En cours",
  COMPLETED: "Terminé",
};

export type SubcontractInput = {
  externalOrganizationId: string;
  scope: string;
  contractAmountHt: number;
  status?: SubcontractStatus;
  contractRef?: string | null;
  contractDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  contactId?: string | null;
  notes?: string | null;
  progressPercent?: number | null;
};

export type SubcontractDto = {
  id: string;
  projectId: string;
  externalOrganizationId: string;
  companyName: string;
  scope: string;
  contractAmountHt: number;
  status: SubcontractStatus;
  statusLabel: string;
  contractRef: string | null;
  contractDate: string | null;
  startDate: string | null;
  endDate: string | null;
  contactId: string | null;
  contactName: string | null;
  notes: string | null;
  progressPercent: number | null;
  realizedHt: number | null;
  canDelete: boolean;
};

export function isSubcontractStatus(v: unknown): v is SubcontractStatus {
  return (
    typeof v === "string" &&
    (SUBCONTRACT_STATUSES as readonly string[]).includes(v)
  );
}

export function parseAmountHt(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    if (raw < 0) throw new Error("Montant du contrat invalide");
    return roundMoney(raw, 2);
  }
  const s = String(raw ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) {
    throw new Error("Montant du contrat invalide");
  }
  return roundMoney(n, 2);
}

export function parseProgressPercent(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(",", "."));
  if (!Number.isFinite(n)) throw new Error("Avancement invalide");
  if (n < 0 || n > 100) throw new Error("Avancement : 0 à 100 %");
  return roundMoney(n, 2);
}

/** Réalisé informatif = montant × % / 100. Ne jamais stocker. */
export function realizedHtFromProgress(
  contractAmountHt: number,
  progressPercent: number | null | undefined,
): number | null {
  if (progressPercent == null) return null;
  return roundMoney((contractAmountHt * progressPercent) / 100, 2);
}

export function canDeleteSubcontract(row: {
  status: string;
  progressPercent?: unknown;
}): boolean {
  if (row.status !== "PREPARATION") return false;
  if (row.progressPercent == null || row.progressPercent === "") return true;
  const p = Number(row.progressPercent);
  return !Number.isFinite(p) || p <= 0;
}
