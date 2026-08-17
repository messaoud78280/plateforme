"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { SerializedAnnualContract } from "@/lib/annual-contracts/load-board";
import {
  resolveAnnualPrimaryAction,
  resolveAnnualSecondaryAction,
  resolveBillingIntervention,
} from "@/lib/annual-contracts/primary-action";
import { annualAgendaHref, annualInvoiceHref } from "@/lib/annual-contracts/nav";

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "À renseigner";
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

type SectionId = "overview" | "interventions" | "billing" | "documents" | "history";

export function AnnualContractDrawer({
  contract,
  year,
  includeFinancials,
  busy,
  onClose,
  onSchedule,
  onComplete,
  onPrepareInvoice,
}: {
  contract: SerializedAnnualContract;
  year: number;
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
  const secondary = resolveAnnualSecondaryAction(contract, { includeFinancials });

  const [section, setSection] = useState<SectionId>("overview");
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
  const [prepChecks, setPrepChecks] = useState({
    contact: false,
    access: false,
    team: false,
    material: false,
    docs: false,
  });

  const nextIntervention =
    open && billing && open.id !== billing.id
      ? open
      : open && open.status !== "COMPLETED"
        ? open
        : null;

  const opsCycle =
    billing && billing.status === "COMPLETED"
      ? billing
      : open && open.status === "SCHEDULED"
        ? open
        : billing ?? open;

  const timeline = useMemo(() => {
    const items: { key: string; date: string; label: string; year: number }[] = [];
    for (const h of contract.allInterventions) {
      if (h.status === "CANCELLED") continue;
      if (h.plannedDate && (h.status === "SCHEDULED" || h.status === "TO_PREPARE")) {
        items.push({
          key: `${h.id}-plan`,
          date: h.plannedDate,
          label: `Intervention ${h.plannedYear ?? ""} — ${h.statusLabel}`,
          year: h.plannedYear ?? year,
        });
      }
      if (h.completedAt) {
        items.push({
          key: `${h.id}-done`,
          date: h.completedAt.slice(0, 10),
          label: `Intervention ${h.plannedYear ?? ""} réalisée`,
          year: h.plannedYear ?? year,
        });
      }
      if (h.commercialInvoiceNumber && h.billingState === "preparing") {
        items.push({
          key: `${h.id}-draft`,
          date: h.completedAt?.slice(0, 10) || h.plannedDate || "",
          label: `Facture ${h.commercialInvoiceNumber} brouillon`,
          year: h.plannedYear ?? year,
        });
      }
      if (h.commercialInvoiceNumber && h.billingState === "invoiced") {
        items.push({
          key: `${h.id}-inv`,
          date: h.completedAt?.slice(0, 10) || h.plannedDate || "",
          label: `Facture ${h.commercialInvoiceNumber} émise`,
          year: h.plannedYear ?? year,
        });
      }
      if (h.billingState === "paid" && h.commercialInvoiceNumber) {
        items.push({
          key: `${h.id}-paid`,
          date: h.completedAt?.slice(0, 10) || h.plannedDate || "",
          label: `Encaissement · ${h.commercialInvoiceNumber}`,
          year: h.plannedYear ?? year,
        });
      }
    }
    return items
      .filter((i) => i.date)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [contract.allInterventions, year]);

  const timelineByYear = useMemo(() => {
    const map = new Map<number, typeof timeline>();
    for (const t of timeline) {
      const list = map.get(t.year) ?? [];
      list.push(t);
      map.set(t.year, list);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [timeline]);

  async function runAction(
    kind: typeof primary.kind,
    interventionId: string | null,
    invoiceHref: string | null,
  ) {
    if (kind === "schedule" || kind === "view_intervention") {
      setMode("schedule");
      setSection("interventions");
      return;
    }
    if (kind === "complete") {
      setMode("complete");
      setSection("interventions");
      return;
    }
    if (
      (kind === "prepare_invoice" || kind === "continue_invoice") &&
      interventionId
    ) {
      await onPrepareInvoice(interventionId);
      return;
    }
    if (
      (kind === "view_invoice" || kind === "view_paid_invoice") &&
      invoiceHref
    ) {
      window.open(
        annualInvoiceHref({
          invoiceId: invoiceHref.split("/").pop()!.split("?")[0]!,
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

  const docsHref = contract.projectId
    ? `/dashboard/documents?projectId=${contract.projectId}`
    : `/dashboard/documents?q=${encodeURIComponent(contract.clientName)}`;

  const chain = [
    {
      label: "Intervention",
      done: Boolean(
        opsCycle &&
          (opsCycle.status === "SCHEDULED" ||
            opsCycle.status === "COMPLETED" ||
            opsCycle.status === "TO_PREPARE"),
      ),
      active: open?.status === "TO_PREPARE" || open?.status === "SCHEDULED",
    },
    {
      label: "Réalisation",
      done: Boolean(billing?.status === "COMPLETED" || open?.status === "COMPLETED"),
      active: open?.status === "SCHEDULED" && (open.daysOverdue != null || false),
    },
    {
      label: "Facturation",
      done: Boolean(
        billing &&
          (billing.billingState === "preparing" ||
            billing.billingState === "invoiced" ||
            billing.billingState === "paid"),
      ),
      active:
        billing?.billingState === "to_bill" || billing?.billingState === "preparing",
    },
    {
      label: "Encaissement",
      done: billing?.billingState === "paid",
      active: billing?.billingState === "invoiced",
    },
    {
      label: "Prochaine",
      done: Boolean(nextIntervention && nextIntervention.id !== billing?.id),
      active: Boolean(
        nextIntervention &&
          billing &&
          nextIntervention.id !== billing.id &&
          nextIntervention.status === "TO_PREPARE",
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl sm:max-w-lg"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={contract.clientName}
      >
        <div className="border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-violet-600/80">
                Contrat annuel · {contract.statusLabel}
              </p>
              <h3 className="mt-0.5 text-xl font-semibold tracking-tight text-[#1e3a5f]">
                {contract.clientName}
              </h3>
              <p className="mt-0.5 text-[13px] text-slate-500">{contract.siteAddress}</p>
              {includeFinancials && contract.amountHtLabel ? (
                <p className="mt-2 text-[14px] font-semibold tabular-nums text-slate-900">
                  {contract.amountHtLabel}{" "}
                  <span className="text-[12px] font-medium text-slate-500">
                    annuel HT
                  </span>
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              Fermer
            </button>
          </div>
          <nav className="mt-4 flex flex-wrap gap-1">
            {(
              [
                ["overview", "Vue d’ensemble"],
                ["interventions", "Interventions"],
                ["billing", "Facturation"],
                ["documents", "Documents"],
                ["history", "Historique"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSection(id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  section === id
                    ? "bg-violet-700 text-white"
                    : "bg-slate-100 text-slate-600",
                )}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 text-sm">
          {section === "overview" ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                {chain.map((c, i) => (
                  <span key={c.label} className="flex items-center gap-1">
                    {i > 0 ? <span className="text-slate-300">→</span> : null}
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        c.active
                          ? "bg-violet-100 text-violet-900"
                          : c.done
                            ? "bg-emerald-50 text-emerald-800"
                            : "bg-slate-50 text-slate-500",
                      )}
                    >
                      {c.label}
                    </span>
                  </span>
                ))}
              </div>

              <section className="space-y-2">
                <h4 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-slate-400">
                  Contrat
                </h4>
                <Meta label="Client / syndic" value={contract.clientName} />
                <Meta label="Adresse" value={contract.siteAddress} />
                <Meta label="Type" value={contract.contractType} />
                <Meta label="Fréquence" value={contract.frequencyLabel} />
                {includeFinancials ? (
                  <Meta
                    label="Montant annuel HT"
                    value={contract.amountHtLabel ?? "À renseigner"}
                  />
                ) : null}
                {contract.comment ? (
                  <p className="mt-2 whitespace-pre-wrap rounded-xl bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
                    {contract.comment}
                  </p>
                ) : null}
              </section>

              {billing && billing.billingState !== "none" ? (
                <section className="rounded-2xl border border-amber-200/70 bg-amber-50/40 p-3 space-y-1">
                  <h4 className="text-[12px] font-semibold uppercase tracking-wide text-amber-900/70">
                    Facturation cycle {billing.plannedYear ?? "—"}
                  </h4>
                  <p className="text-[15px] font-semibold text-slate-900">
                    {billing.commercialInvoiceNumber ?? billing.billingStateLabel}
                  </p>
                  <p className="text-[12px] text-slate-600">
                    {billing.billingStateLabel}
                    {billing.invoiceTotalHtLabel
                      ? ` · ${billing.invoiceTotalHtLabel}`
                      : ""}
                  </p>
                </section>
              ) : null}

              {nextIntervention ? (
                <section className="rounded-2xl border border-cyan-200/70 bg-cyan-50/40 p-3 space-y-1">
                  <h4 className="text-[12px] font-semibold uppercase tracking-wide text-cyan-900/70">
                    Prochaine intervention · cycle {nextIntervention.plannedYear ?? "—"}
                  </h4>
                  <p className="text-[15px] font-semibold text-slate-900">
                    {fmtDate(nextIntervention.plannedDate)}
                  </p>
                  <p className="text-[12px] text-slate-600">
                    {nextIntervention.daysOverdue != null
                      ? `Retard de ${nextIntervention.daysOverdue} jours`
                      : nextIntervention.statusLabel}
                  </p>
                </section>
              ) : null}
            </>
          ) : null}

          {section === "interventions" ? (
            <>
              {open ? (
                <section className="space-y-2 rounded-2xl border border-slate-200 p-3">
                  <h4 className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                    Cycle {open.plannedYear ?? "—"}
                  </h4>
                  <Meta label="Statut" value={open.statusLabel} />
                  <Meta label="Date" value={fmtDate(open.plannedDate)} />
                  <Meta
                    label="Équipe"
                    value={
                      open.plannedCrewCount != null
                        ? `${open.plannedCrewCount} personne${open.plannedCrewCount > 1 ? "s" : ""}`
                        : contract.plannedCrewCount != null
                          ? `${contract.plannedCrewCount} personne${contract.plannedCrewCount > 1 ? "s" : ""}`
                          : "À renseigner"
                    }
                  />
                  <Meta
                    label="Durée"
                    value={
                      open.plannedDuration ||
                      contract.plannedDuration ||
                      "À renseigner"
                    }
                  />
                  {open.daysOverdue != null ? (
                    <p className="rounded-lg bg-orange-50 px-2.5 py-1.5 text-[12px] font-medium text-orange-900">
                      Retard de {open.daysOverdue} jours
                      {open.plannedDate
                        ? ` · prévue le ${fmtShort(open.plannedDate)}`
                        : ""}
                    </p>
                  ) : null}

                  {open.status === "TO_PREPARE" ? (
                    <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-3">
                      <p className="text-[12px] font-semibold text-slate-700">
                        À préparer
                      </p>
                      {(
                        [
                          ["contact", "Contact confirmé"],
                          ["access", "Accès"],
                          ["team", "Équipe"],
                          ["material", "Matériel"],
                          ["docs", "Documents / consignes"],
                        ] as const
                      ).map(([k, label]) => (
                        <label
                          key={k}
                          className="flex items-center gap-2 text-[12px] text-slate-700"
                        >
                          <input
                            type="checkbox"
                            checked={prepChecks[k]}
                            onChange={(e) =>
                              setPrepChecks((s) => ({ ...s, [k]: e.target.checked }))
                            }
                            className="rounded border-slate-300"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  ) : null}
                </section>
              ) : (
                <p className="text-slate-500">Aucune intervention ouverte.</p>
              )}

              {mode === "schedule" ? (
                <section className="space-y-3 rounded-2xl border border-sky-200 bg-sky-50/50 p-4">
                  <p className="text-[13px] font-semibold text-slate-800">
                    Programmer l’intervention
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
                    Équipe / compagnons (nombre)
                    <input
                      type="number"
                      min={1}
                      value={crew}
                      onChange={(e) => setCrew(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-[12px] font-medium text-slate-500">
                    Durée prévue
                    <input
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="ex. 1 journée · demi-journée · 4 h"
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-[12px] font-medium text-slate-500">
                    Instructions / notes
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
                      Confirmer · Agenda
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
                <section className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
                  <p className="text-[13px] font-semibold text-slate-800">
                    Valider l’intervention
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
                    Équipe réelle (optionnel)
                    <input
                      type="number"
                      min={1}
                      value={actualCrew}
                      onChange={(e) => setActualCrew(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-[12px] font-medium text-slate-500">
                    Commentaire (optionnel)
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
                          actualCrewCount: actualCrew
                            ? Number(actualCrew)
                            : undefined,
                          comment: comment || undefined,
                        });
                        setMode("idle");
                      }}
                      className="rounded-full bg-emerald-700 px-4 py-2 text-[13px] font-medium text-white disabled:opacity-40"
                    >
                      Valider l’intervention
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
            </>
          ) : null}

          {section === "billing" ? (
            includeFinancials ? (
              <section className="space-y-3">
                {billing && billing.billingState !== "none" ? (
                  <div className="rounded-2xl border border-slate-200 p-3 space-y-2">
                    <h4 className="text-[12px] font-semibold uppercase text-slate-400">
                      Cycle {billing.plannedYear ?? "—"}
                    </h4>
                    <Meta
                      label="Montant"
                      value={
                        billing.invoiceTotalHtLabel ??
                        contract.amountHtLabel ??
                        "À renseigner"
                      }
                    />
                    <Meta
                      label="Facture"
                      value={billing.commercialInvoiceNumber ?? "Non créée"}
                    />
                    <Meta label="Statut" value={billing.billingStateLabel} />
                    {billing.invoiceAmountPaid != null ? (
                      <Meta
                        label="Encaissé"
                        value={`${billing.invoiceAmountPaid.toLocaleString("fr-FR")} €`}
                      />
                    ) : null}
                    {billing.invoiceAmountDue != null &&
                    billing.invoiceAmountDue > 0.01 ? (
                      <Meta
                        label="Reste"
                        value={`${billing.invoiceAmountDue.toLocaleString("fr-FR")} €`}
                      />
                    ) : null}
                  </div>
                ) : (
                  <p className="text-slate-500">Aucune facturation en cours.</p>
                )}
                {nextIntervention &&
                billing &&
                nextIntervention.id !== billing.id ? (
                  <p className="rounded-xl bg-cyan-50 px-3 py-2 text-[12px] text-cyan-900">
                    La prochaine intervention {nextIntervention.plannedYear} est
                    distincte de cette facturation.
                  </p>
                ) : null}
              </section>
            ) : (
              <p className="text-slate-500">Accès financier restreint.</p>
            )
          ) : null}

          {section === "documents" ? (
            <section className="space-y-3">
              <p className="text-[13px] text-slate-600">
                Contrats, rapports, photos et factures via Document Center BeWork.
              </p>
              <Link
                href={docsHref}
                className="inline-flex rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
              >
                Voir dans Documents
              </Link>
              {agendaHref ? (
                <Link
                  href={agendaHref}
                  className="ml-2 inline-flex rounded-full border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-700"
                >
                  Voir dans Agenda
                </Link>
              ) : null}
            </section>
          ) : null}

          {section === "history" ? (
            <section className="space-y-4">
              {timelineByYear.length === 0 ? (
                <p className="text-slate-500">Aucun événement enregistré.</p>
              ) : (
                timelineByYear.map(([y, items]) => (
                  <div key={y}>
                    <h4 className="mb-2 text-[12px] font-semibold uppercase text-violet-700">
                      {y}
                    </h4>
                    <ul className="space-y-2">
                      {items.map((t) => (
                        <li key={t.key} className="flex gap-3 text-[13px]">
                          <span className="w-24 shrink-0 tabular-nums text-slate-400">
                            {fmtShort(t.date)}
                          </span>
                          <span className="text-slate-700">{t.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </section>
          ) : null}
        </div>

        <div className="space-y-2 border-t border-slate-100 px-5 py-4">
          {primary.kind !== "none" && mode === "idle" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction(
                  primary.kind,
                  primary.interventionId,
                  primary.invoiceHref,
                )
              }
              className="w-full rounded-full bg-[#1e3a5f] px-4 py-3 text-[14px] font-semibold text-white disabled:opacity-40"
            >
              {primary.label || "Voir"}
            </button>
          ) : null}
          {secondary && secondary.kind !== "none" && mode === "idle" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction(
                  secondary.kind,
                  secondary.interventionId,
                  secondary.invoiceHref,
                )
              }
              className="w-full rounded-full border border-slate-200 px-4 py-2.5 text-[13px] font-medium text-slate-800"
            >
              Ensuite · {secondary.label}
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
          </div>
        </div>
      </aside>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[12px] text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}
