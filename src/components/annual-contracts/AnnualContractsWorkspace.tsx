"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnnualContractDrawer } from "@/components/annual-contracts/AnnualContractDrawer";
import { resolveAnnualPrimaryAction } from "@/lib/annual-contracts/primary-action";
import type { loadAnnualContractsBoard } from "@/lib/annual-contracts/load-board";
import type {
  SerializedAnnualContract,
  SerializedAnnualIntervention,
} from "@/lib/annual-contracts/load-board";
import { annualInvoiceHref } from "@/lib/annual-contracts/nav";

type Board = Awaited<ReturnType<typeof loadAnnualContractsBoard>>;
type ViewId = "piloter" | "planning" | "portefeuille";

const MONTHS = [
  "Janv.",
  "Févr.",
  "Mars",
  "Avr.",
  "Mai",
  "Juin",
  "Juil.",
  "Août",
  "Sept.",
  "Oct.",
  "Nov.",
  "Déc.",
];

const BUCKET_LABELS: Record<string, string> = {
  overdue: "En retard",
  to_bill: "À facturer",
  within_7: "Dans moins de 7 jours",
  to_confirm: "À confirmer",
  within_15: "Dans moins de 15 jours",
  to_prepare: "À préparer",
};

function urgencyClass(level: string | null): string {
  switch (level) {
    case "CRITIQUE":
      return "bg-red-900 text-white";
    case "URGENT":
      return "bg-red-50 text-red-800 ring-1 ring-red-200";
    case "IMPORTANT":
      return "bg-orange-50 text-orange-900 ring-1 ring-orange-200";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function AnnualContractsWorkspace({
  initialBoard,
  initialView,
  focusContractId,
}: {
  initialBoard: Board;
  initialView: ViewId;
  focusContractId: string | null;
}) {
  const router = useRouter();
  const [view, setView] = useState<ViewId>(initialView);
  const [board, setBoard] = useState(initialBoard);
  const [selected, setSelected] = useState<SerializedAnnualContract | null>(
    () =>
      (focusContractId &&
        initialBoard.contracts.find((c) => c.id === focusContractId)) ||
      null,
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "actifs" | "programmer" | "facturer" | "resilies">(
    "all",
  );
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function reload(year = board.year) {
    const res = await fetch(`/api/annual-contracts?year=${year}`);
    if (!res.ok) return;
    const data = (await res.json()) as Board;
    setBoard(data);
    if (selected) {
      setSelected(data.contracts.find((c) => c.id === selected.id) ?? null);
    }
  }

  async function schedule(
    interventionId: string,
    body: {
      plannedDate?: string;
      plannedCrewCount?: number;
      plannedDuration?: string;
      comment?: string;
    } = {},
  ) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/annual-contracts/interventions/${interventionId}/schedule`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec programmation");
      setMessage("Intervention confirmée et synchronisée dans l’Agenda.");
      await reload();
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function complete(
    interventionId: string,
    body: {
      completedAt?: string;
      actualCrewCount?: number;
      comment?: string;
    } = {},
  ) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/annual-contracts/interventions/${interventionId}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec réalisation");
      setMessage(
        data.nextPlannedDate
          ? `Réalisée. À facturer. Prochaine échéance : ${data.nextPlannedDate}.`
          : `Réalisée. ${data.billingNote}`,
      );
      await reload();
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function prepareInvoice(interventionId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/annual-contracts/interventions/${interventionId}/prepare-invoice`,
        { method: "POST" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec préparation facture");
      setMessage(
        data.action === "created"
          ? `Brouillon ${data.invoiceNumber} créé — ouverture Devis & Facturation.`
          : data.action === "continue"
            ? `Brouillon ${data.invoiceNumber} — continuer la facture.`
            : `Facture ${data.invoiceNumber} — ouverture.`,
      );
      await reload();
      router.refresh();
      if (data.href) {
        const href =
          selected
            ? annualInvoiceHref({
                invoiceId: data.invoiceId,
                contractId: selected.id,
              })
            : String(data.href);
        window.open(href, "_blank", "noopener,noreferrer");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function openContract(c: SerializedAnnualContract) {
    setSelected(c);
    const url = new URL(window.location.href);
    url.searchParams.set("contract", c.id);
    window.history.replaceState({}, "", url.toString());
  }

  function closeContract() {
    setSelected(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("contract");
    window.history.replaceState({}, "", url.toString());
  }

  const portfolio = useMemo(() => {
    let list = board.contracts;
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.clientName.toLowerCase().includes(q) ||
          c.siteAddress.toLowerCase().includes(q) ||
          (c.siteName ?? "").toLowerCase().includes(q),
      );
    }
    if (filter === "actifs") list = list.filter((c) => c.status === "ACTIVE");
    if (filter === "resilies")
      list = list.filter((c) => c.status === "TERMINATED" || c.status === "TERMINATING");
    if (filter === "programmer")
      list = list.filter(
        (c) =>
          !c.nextPlannedDate ||
          c.openIntervention?.status === "TO_PREPARE",
      );
    if (filter === "facturer")
      list = list.filter((c) => c.history.some((h) => h.billingNeeded));
    return list;
  }, [board.contracts, query, filter]);

  const planningByContract = useMemo(() => {
    const map = new Map<
      string,
      {
        clientName: string;
        siteAddress: string;
        amountHtLabel: string | null;
        plannedCrewCount: number | null;
        status: string;
        months: Map<number, SerializedAnnualIntervention>;
      }
    >();
    for (const cell of board.planningCells) {
      let row = map.get(cell.contractId);
      if (!row) {
        row = {
          clientName: cell.clientName,
          siteAddress: cell.siteAddress,
          amountHtLabel: cell.amountHtLabel,
          plannedCrewCount: cell.plannedCrewCount,
          status: cell.status,
          months: new Map(),
        };
        map.set(cell.contractId, row);
      }
      row.months.set(cell.month, cell.intervention);
    }
    // Also include contracts with no intervention this year (portefeuille feel)
    for (const c of board.contracts) {
      if (!map.has(c.id)) {
        map.set(c.id, {
          clientName: c.clientName,
          siteAddress: c.siteAddress,
          amountHtLabel: c.amountHtLabel,
          plannedCrewCount: c.plannedCrewCount,
          status: c.status,
          months: new Map(),
        });
      }
    }
    return [...map.entries()].sort((a, b) =>
      a[1].clientName.localeCompare(b[1].clientName, "fr"),
    );
  }, [board.planningCells, board.contracts]);

  return (
    <div className="mx-auto max-w-[1520px] space-y-6 px-4 py-6 sm:px-6">
      <PageHeader
        title="Contrats annuels"
        description="Interventions récurrentes — préparer, confirmer, réaliser, facturer."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
        <Kpi label="À préparer" value={String(board.kpis.toPrepare)} />
        <Kpi label="Dans les 30 jours" value={String(board.kpis.within30)} />
        <Kpi label="À facturer" value={String(board.kpis.toBill)} />
        {board.includeFinancials ? (
          <>
            <Kpi label="En préparation" value={String(board.kpis.preparing ?? 0)} />
            <Kpi label="Facturées" value={String(board.kpis.invoiced ?? 0)} />
            <Kpi label="Payées" value={String(board.kpis.paid ?? 0)} />
          </>
        ) : null}
        <Kpi
          label="Portefeuille annuel HT"
          value={board.kpis.portfolioHtLabel ?? "—"}
          hint={board.includeFinancials ? "Contrats actifs (pas le CA facturé)" : "Masqué (SEC-1)"}
        />
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {(
          [
            ["piloter", "À piloter"],
            ["planning", "Planning annuel"],
            ["portefeuille", "Portefeuille"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setView(id);
              startTransition(() => {
                const url = new URL(window.location.href);
                url.searchParams.set("view", id);
                window.history.replaceState({}, "", url.toString());
              });
            }}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              view === id
                ? "bg-[#1e3a5f] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {message ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {message}
        </p>
      ) : null}

      {view === "piloter" ? (
        <PilotView
          pilot={board.pilot}
          includeFinancials={board.includeFinancials}
          onOpen={openContract}
          onComplete={complete}
          onPrepareInvoice={prepareInvoice}
          busy={busy}
        />
      ) : null}

      {view === "planning" ? (
        <PlanningView
          year={board.year}
          rows={planningByContract}
          includeFinancials={board.includeFinancials}
          onYear={(y) => {
            startTransition(async () => {
              await reload(y);
            });
          }}
          onOpen={(contractId) => {
            const c = board.contracts.find((x) => x.id === contractId);
            if (c) openContract(c);
          }}
          pending={pending}
        />
      ) : null}

      {view === "portefeuille" ? (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Syndic, adresse, site…"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-[#1e3a5f]/20 focus:ring-2 sm:max-w-sm"
            />
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "Tous"],
                  ["actifs", "Actifs"],
                  ["programmer", "À programmer"],
                  ["facturer", "À facturer"],
                  ["resilies", "Résiliés"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium",
                    filter === id
                      ? "bg-[#1e3a5f] text-white"
                      : "bg-slate-100 text-slate-600",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Syndic</th>
                  <th className="px-4 py-3">Adresse</th>
                  {board.includeFinancials ? (
                    <th className="px-4 py-3">Montant HT</th>
                  ) : null}
                  <th className="px-4 py-3">Prochaine</th>
                  <th className="px-4 py-3">Compagnons</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer border-t border-slate-100 hover:bg-slate-50/80"
                    onClick={() => openContract(c)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{c.clientName}</td>
                    <td className="px-4 py-3 text-slate-600">{c.siteAddress}</td>
                    {board.includeFinancials ? (
                      <td className="px-4 py-3 tabular-nums">{c.amountHtLabel}</td>
                    ) : null}
                    <td className="px-4 py-3">
                      {c.nextPlannedDate
                        ? new Date(c.nextPlannedDate + "T00:00:00Z").toLocaleDateString("fr-FR", {
                            timeZone: "UTC",
                          })
                        : "À programmer"}
                    </td>
                    <td className="px-4 py-3">{c.plannedCrewCount ?? "—"}</td>
                    <td className="px-4 py-3">{c.statusLabel}</td>
                  </tr>
                ))}
                {portfolio.length === 0 ? (
                  <tr>
                    <td
                      colSpan={board.includeFinancials ? 6 : 5}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Aucun contrat
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {selected ? (
        <AnnualContractDrawer
          contract={selected}
          includeFinancials={board.includeFinancials}
          busy={busy}
          onClose={closeContract}
          onSchedule={schedule}
          onComplete={complete}
          onPrepareInvoice={prepareInvoice}
        />
      ) : null}
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  const tone =
    label === "À préparer"
      ? "bw-surface-tinted-cyan"
      : label === "À facturer"
        ? "bw-surface-tinted-watch"
        : label === "Payées"
          ? "bw-surface-tinted-ok"
          : label === "En préparation"
            ? "bw-surface-tinted-violet"
            : label === "Facturées"
              ? "bw-surface-tinted-accent"
              : label === "Dans les 30 jours"
                ? "bw-surface-tinted-navy"
                : "bg-white border border-slate-200/80";
  const valueTone =
    label === "Payées"
      ? "text-bework-ok"
      : label === "À facturer"
        ? "text-bework-watch"
        : label === "À préparer"
          ? "text-bework-cyan"
          : "text-bework-navy";
  return (
    <div className={cn("rounded-2xl px-4 py-3 shadow-sm", tone)}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", valueTone)}>{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );
}

function PilotView({
  pilot,
  includeFinancials,
  onOpen,
  onComplete,
  onPrepareInvoice,
  busy,
}: {
  pilot: Board["pilot"];
  includeFinancials: boolean;
  onOpen: (c: SerializedAnnualContract) => void;
  onComplete: (
    id: string,
    body?: { completedAt?: string; actualCrewCount?: number; comment?: string },
  ) => void;
  onPrepareInvoice: (id: string) => void;
  busy: boolean;
}) {
  if (pilot.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-slate-500">
        Rien à piloter pour l’instant — le portefeuille est à jour.
      </div>
    );
  }

  const grouped = new Map<string, typeof pilot>();
  for (const p of pilot) {
    const list = grouped.get(p.bucket) ?? [];
    list.push(p);
    grouped.set(p.bucket, list);
  }

  return (
    <div className="space-y-6">
      {[...grouped.entries()].map(([bucket, items]) => (
        <section key={bucket} className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-800">
            {BUCKET_LABELS[bucket] ?? bucket}
            <span className="ml-2 text-slate-400">({items.length})</span>
          </h2>
          <ul className="space-y-2">
            {items.map((item) => {
              const yearLabel =
                item.bucket === "to_bill"
                  ? `Intervention ${item.intervention.plannedYear ?? ""}`
                  : item.bucket === "to_prepare" ||
                      item.bucket === "to_confirm" ||
                      item.bucket === "within_7" ||
                      item.bucket === "within_15" ||
                      item.bucket === "overdue"
                    ? item.intervention.plannedYear
                      ? `Prochaine intervention ${item.intervention.plannedYear}`
                      : "À programmer"
                    : null;
              return (
              <li
                key={`${item.bucket}-${item.intervention.id}`}
                className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between"
                onClick={() => onOpen(item.contract)}
              >
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-medium text-slate-900">{item.contract.clientName}</p>
                  <p className="truncate text-sm text-slate-500">{item.contract.siteAddress}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {yearLabel ? (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {yearLabel}
                      </span>
                    ) : null}
                    {item.intervention.plannedDate ? (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs tabular-nums text-slate-700">
                        {new Date(item.intervention.plannedDate + "T00:00:00Z").toLocaleDateString(
                          "fr-FR",
                          { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" },
                        )}
                      </span>
                    ) : (
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                        À programmer
                      </span>
                    )}
                    {includeFinancials && item.contract.amountHtLabel ? (
                      <span className="text-xs tabular-nums text-slate-600">
                        {item.contract.amountHtLabel}
                      </span>
                    ) : null}
                    {item.intervention.billingStateLabel ? (
                      <span className="rounded-md bg-orange-50 px-2 py-0.5 text-xs text-orange-900">
                        {item.intervention.billingStateLabel}
                        {item.intervention.commercialInvoiceNumber
                          ? ` · ${item.intervention.commercialInvoiceNumber}`
                          : ""}
                      </span>
                    ) : null}
                    {item.intervention.attentionReason &&
                    !item.intervention.billingStateLabel ? (
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs",
                          urgencyClass(item.intervention.attentionLevel),
                        )}
                      >
                        {item.intervention.attentionReason}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div
                  className="flex flex-wrap gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(() => {
                    const primary = resolveAnnualPrimaryAction(item.contract, {
                      includeFinancials,
                    });
                    if (primary.kind === "none") return null;
                    if (
                      primary.kind === "view_invoice" ||
                      primary.kind === "view_paid_invoice"
                    ) {
                      const invId = primary.invoiceHref?.split("/").pop()?.split("?")[0];
                      if (!invId) return null;
                      return (
                        <a
                          href={annualInvoiceHref({
                            invoiceId: invId,
                            contractId: item.contract.id,
                          })}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white"
                        >
                          {primary.label} →
                        </a>
                      );
                    }
                    if (
                      primary.kind === "prepare_invoice" ||
                      primary.kind === "continue_invoice"
                    ) {
                      return (
                        <button
                          type="button"
                          disabled={busy || !primary.interventionId}
                          onClick={() =>
                            primary.interventionId &&
                            onPrepareInvoice(primary.interventionId)
                          }
                          className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                        >
                          {primary.label} →
                        </button>
                      );
                    }
                    if (primary.kind === "complete") {
                      return (
                        <button
                          type="button"
                          disabled={busy || !primary.interventionId}
                          onClick={() =>
                            primary.interventionId && onComplete(primary.interventionId)
                          }
                          className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                        >
                          {primary.label}
                        </button>
                      );
                    }
                    if (primary.kind === "schedule") {
                      return (
                        <button
                          type="button"
                          disabled={busy || !primary.interventionId}
                          onClick={() => onOpen(item.contract)}
                          className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
                        >
                          {primary.label}
                        </button>
                      );
                    }
                    return (
                      <button
                        type="button"
                        onClick={() => onOpen(item.contract)}
                        className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-medium text-white"
                      >
                        {primary.label}
                      </button>
                    );
                  })()}
                </div>
              </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PlanningView({
  year,
  rows,
  includeFinancials,
  onYear,
  onOpen,
  pending,
}: {
  year: number;
  rows: [
    string,
    {
      clientName: string;
      siteAddress: string;
      amountHtLabel: string | null;
      plannedCrewCount: number | null;
      status: string;
      months: Map<number, SerializedAnnualIntervention>;
    },
  ][];
  includeFinancials: boolean;
  onYear: (y: number) => void;
  onOpen: (contractId: string) => void;
  pending: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => onYear(year - 1)}
          className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
        >
          ‹ {year - 1}
        </button>
        <span className="text-lg font-semibold text-[#1e3a5f]">{year}</span>
        <button
          type="button"
          onClick={() => onYear(year + 1)}
          className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
        >
          {year + 1} ›
        </button>
      </div>
      <div
        className={cn(
          "overflow-x-auto rounded-2xl border border-slate-200 bg-white",
          pending && "opacity-60",
        )}
      >
        <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-[#1e3a5f] text-white">
              <th className="sticky left-0 z-10 bg-[#1e3a5f] px-3 py-3 text-xs font-medium">
                Syndic / site
              </th>
              {includeFinancials ? (
                <th className="px-2 py-3 text-xs font-medium">HT</th>
              ) : null}
              <th className="px-2 py-3 text-xs font-medium">Eq.</th>
              {MONTHS.map((m) => (
                <th key={m} className="px-1 py-3 text-center text-[11px] font-medium">
                  {m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([id, row]) => (
              <tr
                key={id}
                className={cn(
                  "border-t border-slate-100",
                  row.status === "TERMINATING" && "bg-orange-50/60",
                  row.status === "TERMINATED" && "bg-slate-50 opacity-70",
                )}
              >
                <td className="sticky left-0 z-10 max-w-[220px] bg-white px-3 py-2">
                  <button type="button" className="text-left" onClick={() => onOpen(id)}>
                    <p className="font-medium text-slate-900">{row.clientName}</p>
                    <p className="truncate text-xs text-slate-500">{row.siteAddress}</p>
                  </button>
                </td>
                {includeFinancials ? (
                  <td className="whitespace-nowrap px-2 py-2 text-xs tabular-nums text-slate-600">
                    {row.amountHtLabel}
                  </td>
                ) : null}
                <td className="px-2 py-2 text-xs text-slate-600">
                  {row.plannedCrewCount ?? "—"}
                </td>
                {MONTHS.map((_, month) => {
                  const inter = row.months.get(month);
                  return (
                    <td key={month} className="px-1 py-1.5 align-top">
                      {inter ? (
                        <button
                          type="button"
                          onClick={() => onOpen(id)}
                          className={cn(
                            "w-full rounded-lg px-1.5 py-1 text-left text-[10px] leading-tight ring-1",
                            inter.status === "COMPLETED"
                              ? "bg-[color:var(--bw-soft-ok)] text-bework-ok ring-bework-ok/20"
                              : inter.status === "SCHEDULED"
                                ? "bg-[color:var(--bw-soft-accent)] text-bework-accent ring-bework-accent/20"
                                : inter.status === "TO_PREPARE"
                                  ? "bg-[color:var(--bw-soft-cyan)] text-bework-cyan ring-bework-cyan/20"
                                  : "bg-slate-50 text-slate-800 ring-slate-200",
                          )}
                        >
                          <span className="font-semibold">
                            {inter.plannedDate
                              ? new Date(inter.plannedDate + "T00:00:00Z").toLocaleDateString(
                                  "fr-FR",
                                  { day: "numeric", month: "short", timeZone: "UTC" },
                                )
                              : "—"}
                          </span>
                          {inter.plannedCrewCount ? (
                            <span className="mt-0.5 block text-slate-500">
                              {inter.plannedCrewCount} comp.
                            </span>
                          ) : null}
                        </button>
                      ) : (
                        <span className="block h-8 rounded-md bg-slate-50/50" />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-slate-50 pb-2">
      <span className="text-xs uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-800">{value}</span>
    </div>
  );
}
