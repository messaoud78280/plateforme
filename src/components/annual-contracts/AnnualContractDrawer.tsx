"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { SerializedAnnualContract } from "@/lib/annual-contracts/load-board";
import {
  resolveAnnualPrimaryAction,
  resolveBillingIntervention,
} from "@/lib/annual-contracts/primary-action";
import { annualAgendaHref, annualInvoiceHref } from "@/lib/annual-contracts/nav";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function fmtShort(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00Z").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function AnnualContractDrawer({
  contract,
  includeFinancials,
  busy,
  onClose,
  onSchedule,
  onComplete,
  onPrepareInvoice,
}: {
  contract: SerializedAnnualContract;
  includeFinancials: boolean;
  busy: boolean;
  onClose: () => void;
  onSchedule: (
    id: string,
    body: {
      plannedDate?: string;
      plannedCrewCount?: number;
      plannedDuration?: string;
      comment?: string;
    },
  ) => Promise<void> | void;
  onComplete: (
    id: string,
    body: { completedAt?: string; actualCrewCount?: number; comment?: string },
  ) => Promise<void> | void;
  onPrepareInvoice: (id: string) => Promise<void> | void;
}) {
  const open = contract.openIntervention;
  const billing = resolveBillingIntervention(contract);
  const primary = resolveAnnualPrimaryAction(contract, { includeFinancials });

  const [mode, setMode] = useState<"idle" | "schedule" | "complete" | "more">("idle");
  const [plannedDate, setPlannedDate] = useState(open?.plannedDate ?? "");
  const [crew, setCrew] = useState(
    String(open?.plannedCrewCount ?? contract.plannedCrewCount ?? ""),
  );
  const [duration, setDuration] = useState(
    open?.plannedDuration ?? contract.plannedDuration ?? "",
  );
  const [comment, setComment] = useState(open?.comment ?? "");
  const [completedAt, setCompletedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [actualCrew, setActualCrew] = useState(
    String(open?.actualCrewCount ?? open?.plannedCrewCount ?? ""),
  );

  const nextYearDate = useMemo(() => {
    // Prochaine année = openIntervention si année > billing, sinon nextPlannedDate
    if (open?.plannedDate && billing && open.id !== billing.id) {
      return open.plannedDate;
    }
    if (open?.plannedDate && open.status !== "COMPLETED") {
      // Si open est N+1 après réalisation, nextPlannedDate = open
      if (billing && billing.status === "COMPLETED") return open.plannedDate;
    }
    if (
      contract.nextPlannedDate &&
      (!open || open.plannedDate !== contract.nextPlannedDate)
    ) {
      // Afficher N+1 seulement si distinct de l’intervention courante à traiter
      if (billing?.plannedDate && contract.nextPlannedDate > billing.plannedDate) {
        return contract.nextPlannedDate;
      }
    }
    if (open?.status !== "COMPLETED" && open?.plannedDate) return null;
    return contract.nextPlannedDate;
  }, [contract.nextPlannedDate, open, billing]);

  const timeline = useMemo(() => {
    const items: { key: string; date: string; label: string }[] = [];
    for (const h of contract.history) {
      if (h.completedAt) {
        items.push({
          key: `${h.id}-done`,
          date: h.completedAt.slice(0, 10),
          label: `Intervention ${h.plannedYear ?? ""} réalisée`,
        });
      } else if (h.plannedDate && h.status === "SCHEDULED") {
        items.push({
          key: `${h.id}-sched`,
          date: h.plannedDate,
          label: `Intervention ${h.plannedYear ?? ""} programmée`,
        });
      }
      if (h.commercialInvoiceNumber && h.billingState === "invoiced") {
        items.push({
          key: `${h.id}-inv`,
          date: h.completedAt?.slice(0, 10) || h.plannedDate || "",
          label: `Facture ${h.commercialInvoiceNumber} émise`,
        });
      }
      if (h.billingState === "paid" && h.commercialInvoiceNumber) {
        items.push({
          key: `${h.id}-paid`,
          date: h.completedAt?.slice(0, 10) || h.plannedDate || "",
          label: `Paiement reçu · ${h.commercialInvoiceNumber}`,
        });
      }
    }
    if (open?.plannedDate && open.status === "SCHEDULED") {
      items.push({
        key: `${open.id}-open`,
        date: open.plannedDate,
        label: `Intervention ${open.plannedYear ?? ""} programmée`,
      });
    }
    return items
      .filter((i) => i.date)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);
  }, [contract.history, open]);

  async function runPrimary() {
    if (primary.kind === "schedule" || primary.kind === "view_intervention") {
      setMode("schedule");
      return;
    }
    if (primary.kind === "complete") {
      setMode("complete");
      return;
    }
    if (
      (primary.kind === "prepare_invoice" || primary.kind === "continue_invoice") &&
      primary.interventionId
    ) {
      await onPrepareInvoice(primary.interventionId);
      return;
    }
    if (
      (primary.kind === "view_invoice" || primary.kind === "view_paid_invoice") &&
      primary.invoiceHref
    ) {
      window.open(
        annualInvoiceHref({
          invoiceId: primary.invoiceHref.split("/").pop()!.split("?")[0]!,
          contractId: contract.id,
        }),
        "_blank",
        "noopener,noreferrer",
      );
    }
  }

  const agendaHref =
    open?.agendaEventId && open.plannedDate
      ? annualAgendaHref({
          agendaEventId: open.agendaEventId,
          plannedDate: open.plannedDate,
          contractId: contract.id,
          clientName: contract.clientName,
        })
      : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:max-w-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={contract.clientName}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
              Contrat annuel
            </p>
            <h3 className="mt-0.5 text-xl font-semibold tracking-tight text-[#1e3a5f]">
              {contract.clientName}
            </h3>
            <p className="mt-0.5 text-[13px] text-slate-500">{contract.siteAddress}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            Fermer
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 text-sm">
          <section className="space-y-2">
            <h4 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              Contrat
            </h4>
            <Meta label="Client / syndic" value={contract.clientName} />
            <Meta label="Adresse" value={contract.siteAddress} />
            <Meta label="Statut" value={contract.statusLabel} />
            {includeFinancials ? (
              <Meta label="Montant annuel HT" value={contract.amountHtLabel ?? "—"} />
            ) : null}
          </section>

          {open ? (
            <section className="space-y-2">
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                Intervention actuelle
              </h4>
              <Meta label="Année" value={open.plannedYear ? String(open.plannedYear) : "—"} />
              <Meta label="Date" value={fmtDate(open.plannedDate)} />
              <Meta label="Statut" value={open.statusLabel} />
              <Meta
                label="Compagnons"
                value={
                  open.plannedCrewCount != null
                    ? String(open.plannedCrewCount)
                    : contract.plannedCrewCount != null
                      ? String(contract.plannedCrewCount)
                      : "—"
                }
              />
              <Meta
                label="Durée"
                value={open.plannedDuration || contract.plannedDuration || "—"}
              />
              {open.attentionReason ? (
                <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[12px] text-amber-900">
                  {open.attentionReason}
                </p>
              ) : null}
            </section>
          ) : null}

          {includeFinancials && billing && billing.billingState !== "none" ? (
            <section className="space-y-2">
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                Facturation
              </h4>
              {billing.billingState === "to_bill" ? (
                <p className="text-[15px] font-semibold text-slate-900">
                  À facturer
                  {contract.amountHtLabel ? ` — ${contract.amountHtLabel}` : ""}
                </p>
              ) : null}
              {billing.billingState === "preparing" ? (
                <p className="text-[15px] font-semibold text-slate-900">
                  Facture en préparation
                  {billing.commercialInvoiceNumber
                    ? ` · ${billing.commercialInvoiceNumber}`
                    : ""}
                </p>
              ) : null}
              {billing.billingState === "invoiced" ? (
                <p className="text-[15px] font-semibold text-slate-900">
                  Facturée
                  {billing.commercialInvoiceNumber
                    ? ` · ${billing.commercialInvoiceNumber}`
                    : ""}
                  {contract.amountHtLabel ? ` · ${contract.amountHtLabel}` : ""}
                </p>
              ) : null}
              {billing.billingState === "paid" ? (
                <p className="text-[15px] font-semibold text-emerald-800">
                  Payée
                  {billing.commercialInvoiceNumber
                    ? ` · ${billing.commercialInvoiceNumber}`
                    : ""}
                </p>
              ) : null}
            </section>
          ) : null}

          {nextYearDate ? (
            <section className="space-y-1">
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                Prochaine intervention
              </h4>
              <p className="text-[15px] font-medium text-slate-900">{fmtDate(nextYearDate)}</p>
            </section>
          ) : null}

          {contract.comment ? (
            <section className="space-y-1">
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                Commentaires
              </h4>
              <p className="whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
                {contract.comment}
              </p>
            </section>
          ) : null}

          {timeline.length > 0 ? (
            <section className="space-y-2">
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                Historique
              </h4>
              <ul className="space-y-2">
                {timeline.map((t) => (
                  <li key={t.key} className="flex gap-3 text-[13px]">
                    <span className="w-24 shrink-0 tabular-nums text-slate-400">
                      {fmtShort(t.date)}
                    </span>
                    <span className="text-slate-700">{t.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {mode === "schedule" ? (
            <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-[13px] font-semibold text-slate-800">
                Programmer / confirmer
              </p>
              <label className="block text-[12px] font-medium text-slate-500">
                Date
                <input
                  type="date"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-[12px] font-medium text-slate-500">
                Compagnons prévus
                <input
                  type="number"
                  min={1}
                  value={crew}
                  onChange={(e) => setCrew(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-[12px] font-medium text-slate-500">
                Durée
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="ex. 1 journée"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-[12px] font-medium text-slate-500">
                Commentaire
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy || !open || !plannedDate}
                  onClick={async () => {
                    if (!open) return;
                    await onSchedule(open.id, {
                      plannedDate,
                      plannedCrewCount: crew ? Number(crew) : undefined,
                      plannedDuration: duration || undefined,
                      comment: comment || undefined,
                    });
                    setMode("idle");
                  }}
                  className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40"
                >
                  Confirmer
                </button>
                <button
                  type="button"
                  onClick={() => setMode("idle")}
                  className="rounded-full border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600"
                >
                  Annuler
                </button>
              </div>
            </section>
          ) : null}

          {mode === "complete" ? (
            <section className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <p className="text-[13px] font-semibold text-slate-800">
                Confirmer la réalisation
              </p>
              <label className="block text-[12px] font-medium text-slate-500">
                Date réelle
                <input
                  type="date"
                  value={completedAt}
                  onChange={(e) => setCompletedAt(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-[12px] font-medium text-slate-500">
                Compagnons réels
                <input
                  type="number"
                  min={1}
                  value={actualCrew}
                  onChange={(e) => setActualCrew(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
              <label className="block text-[12px] font-medium text-slate-500">
                Commentaire
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy || !open}
                  onClick={async () => {
                    if (!open) return;
                    await onComplete(open.id, {
                      completedAt: completedAt
                        ? new Date(`${completedAt}T12:00:00.000Z`).toISOString()
                        : undefined,
                      actualCrewCount: actualCrew ? Number(actualCrew) : undefined,
                      comment: comment || undefined,
                    });
                    setMode("idle");
                  }}
                  className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40"
                >
                  Confirmer réalisée
                </button>
                <button
                  type="button"
                  onClick={() => setMode("idle")}
                  className="rounded-full border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-600"
                >
                  Annuler
                </button>
              </div>
            </section>
          ) : null}
        </div>

        <div className="space-y-2 border-t border-slate-100 px-5 py-4">
          {primary.kind !== "none" && mode === "idle" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void runPrimary()}
              className="w-full rounded-full bg-[#1e3a5f] px-4 py-3 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              {primary.label}
            </button>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {agendaHref ? (
              <Link
                href={agendaHref}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
              >
                Voir dans l’Agenda
              </Link>
            ) : null}
            <div className="relative ml-auto">
              <button
                type="button"
                onClick={() => setMode((m) => (m === "more" ? "idle" : "more"))}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-500"
                aria-label="Plus d’actions"
              >
                •••
              </button>
              {mode === "more" ? (
                <div className="absolute bottom-full right-0 mb-1 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                  {open && open.status !== "COMPLETED" ? (
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                      onClick={() => setMode("schedule")}
                    >
                      Modifier l’intervention
                    </button>
                  ) : null}
                  {open && open.status !== "COMPLETED" && primary.kind !== "complete" ? (
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-50"
                      onClick={() => setMode("complete")}
                    >
                      Marquer réalisée
                    </button>
                  ) : null}
                  {includeFinancials &&
                  billing?.commercialInvoiceHref &&
                  primary.kind !== "view_invoice" &&
                  primary.kind !== "view_paid_invoice" &&
                  primary.kind !== "continue_invoice" ? (
                    <a
                      href={annualInvoiceHref({
                        invoiceId: billing.commercialInvoiceId!,
                        contractId: contract.id,
                      })}
                      target="_blank"
                      rel="noreferrer"
                      className="block px-3 py-2 text-[13px] text-slate-700 hover:bg-slate-50"
                    >
                      Voir la facture
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4")}>
      <span className="text-[12px] text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}
