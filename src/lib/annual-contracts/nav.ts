/**
 * CONTRATS-ANNUELS-3 — liens de navigation contextuelle (URL déterministe).
 */
import { withReturnTo } from "@/lib/navigation/safe-return-to";

export function annualContractHref(opts: {
  contractId: string;
  view?: "piloter" | "planning" | "portefeuille" | "facturation";
}): string {
  const p = new URLSearchParams();
  p.set("view", opts.view ?? "piloter");
  p.set("contract", opts.contractId);
  return `/dashboard/contrats-annuels?${p.toString()}`;
}

export function annualAgendaHref(opts: {
  agendaEventId: string;
  plannedDate: string | null;
  contractId: string;
  clientName?: string;
}): string {
  const p = new URLSearchParams();
  p.set("event", opts.agendaEventId);
  if (opts.plannedDate && /^\d{4}-\d{2}-\d{2}$/.test(opts.plannedDate)) {
    p.set("date", opts.plannedDate);
  }
  p.set("view", "day");
  const returnTo = annualContractHref({ contractId: opts.contractId });
  p.set("returnTo", returnTo);
  if (opts.clientName?.trim()) {
    p.set("returnLabel", opts.clientName.trim().slice(0, 80));
  }
  return `/dashboard/agenda?${p.toString()}`;
}

export function annualInvoiceHref(opts: {
  invoiceId: string;
  contractId: string;
}): string {
  return withReturnTo(
    `/dashboard/devis-facturation/factures/${opts.invoiceId}`,
    annualContractHref({ contractId: opts.contractId }),
  );
}
