"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader";
import { AnnualContractDrawer } from "@/components/annual-contracts/AnnualContractDrawer";
import {
  resolvePilotRowAction,
  resolveAnnualSecondaryAction,
} from "@/lib/annual-contracts/primary-action";
import type { loadAnnualContractsBoard } from "@/lib/annual-contracts/load-board";
import type {
  SerializedAnnualContract,
  SerializedAnnualIntervention,
} from "@/lib/annual-contracts/load-board";
import { annualInvoiceHref } from "@/lib/annual-contracts/nav";
import { formatShortDateFr } from "@/lib/annual-contracts/types";

type Board = Awaited<ReturnType<typeof loadAnnualContractsBoard>>;
type ViewId = "piloter" | "planning" | "portefeuille" | "facturation";

const MONTHS = [
  "JAN",
  "FÉV",
  "MAR",
  "AVR",
  "MAI",
  "JUN",
  "JUL",
  "AOÛ",
  "SEP",
  "OCT",
  "NOV",
  "DÉC",
];

const BUCKET_LABELS: Record<string, string> = {
  overdue: "En retard",
  this_week: "Cette semaine",
  within_30: "Dans les 30 jours",
  to_prepare: "À préparer",
  to_bill: "À facturer",
  preparing: "Facturation en cours",
};

function accentBar(bucket: string, daysOverdue: number | null): string {
  if (bucket === "overdue") {
    return (daysOverdue ?? 0) > 90 ? "bg-red-500" : "bg-orange-500";
  }
  if (bucket === "this_week") return "bg-amber-400";
  if (bucket === "within_30") return "bg-sky-500";
  if (bucket === "to_prepare") return "bg-cyan-500";
  if (bucket === "to_bill") return "bg-amber-500";
  if (bucket === "preparing") return "bg-violet-500";
  return "bg-slate-300";
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return null;
  return formatShortDateFr(iso);
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
  const [filter, setFilter] = useState<
    "all" | "actifs" | "programmer" | "facturer" | "resilies"
  >("all");
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [kpiFocus, setKpiFocus] = useState<string | null>(null);

  async function reload(year = board.year) {
    const res = await fetch(`/api/annual-contracts?year=${year}`);
    if (!res.ok) return;
    const data = (await res.json()) as Board;
    setBoard(data);
    if (selected) {
      setSelected(data.contracts.find((c) => c.id === selected.id) ?? null);
    }
  }

  function setYear(y: number) {
    startTransition(async () => {
      const url = new URL(window.location.href);
      url.searchParams.set("year", String(y));
      window.history.replaceState({}, "", url.toString());
      await reload(y);
    });
  }

  function setViewAndUrl(id: ViewId) {
    setView(id);
    startTransition(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("view", id);
      window.history.replaceState({}, "", url.toString());
    });
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
        const href = selected
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
          (c.siteName ?? "").toLowerCase().includes(q) ||
          c.history.some((h) =>
            (h.commercialInvoiceNumber ?? "").toLowerCase().includes(q),
          ),
      );
    }
    if (filter === "actifs") list = list.filter((c) => c.status === "ACTIVE");
    if (filter === "resilies")
      list = list.filter(
        (c) => c.status === "TERMINATED" || c.status === "TERMINATING",
      );
    if (filter === "programmer")
      list = list.filter(
        (c) => !c.nextPlannedDate || c.openIntervention?.status === "TO_PREPARE",
      );
    if (filter === "facturer")
      list = list.filter((c) =>
        c.history.some(
          (h) => h.billingState === "to_bill" || h.billingState === "preparing",
        ),
      );
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
    for (const c of board.contracts) {
      if (!map.has(c.id) && c.status === "ACTIVE") {
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

  const treatSummary = useMemo(() => {
    const overdue = board.kpis.overdue;
    const preparing = board.kpis.preparing;
    const prep = board.pilot.filter((p) => p.bucket === "to_prepare").length;
    return { overdue, preparing, prep };
  }, [board]);

  const years = [board.year - 1, board.year, board.year + 1];

  return (
    <div className="mx-auto max-w-[1520px] space-y-5 px-4 py-6 sm:px-6">
      <PageHeader
        title="Contrats annuels"
        description="Pilotez vos contrats récurrents, interventions et facturation annuelle."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full border border-slate-200 bg-white p-0.5 text-[12px] font-semibold">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setYear(y)}
                  className={cn(
                    "rounded-full px-3 py-1.5",
                    board.year === y
                      ? "bg-violet-700 text-white"
                      : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Portefeuille annuel HT"
          value={board.kpis.portfolioHtLabel ?? "—"}
          tone="violet"
          title="Somme des montants annuels HT des contrats actifs."
          active={kpiFocus === "portfolio"}
          onClick={() => {
            setKpiFocus("portfolio");
            setViewAndUrl("portefeuille");
          }}
        />
        <KpiCard
          label="Contrats actifs"
          value={String(board.kpis.activeCount)}
          tone="indigo"
          onClick={() => {
            setFilter("actifs");
            setViewAndUrl("portefeuille");
          }}
        />
        <KpiCard
          label="Interventions en retard"
          value={String(board.kpis.overdue)}
          tone={board.kpis.overdue > 0 ? "orange" : "slate"}
          onClick={() => {
            setKpiFocus("overdue");
            setViewAndUrl("piloter");
          }}
        />
        <KpiCard
          label="Dans les 30 jours"
          value={String(board.kpis.within30)}
          tone="blue"
          onClick={() => {
            setKpiFocus("within_30");
            setViewAndUrl("piloter");
          }}
        />
        <KpiCard
          label="À facturer"
          value={String(board.kpis.toBill)}
          tone="amber"
          title="Intervention réalisée — aucune facture créée."
          onClick={() => {
            setKpiFocus("to_bill");
            setViewAndUrl("facturation");
          }}
        />
        <KpiCard
          label="Facturation en cours"
          value={String(board.kpis.preparing)}
          tone="cyan"
          title="Facture brouillon / en préparation."
          onClick={() => {
            setKpiFocus("preparing");
            setViewAndUrl("facturation");
          }}
        />
      </div>

      {board.includeFinancials ? (
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200/80 bg-white px-4 py-2.5 text-[12px]">
          <span className="font-semibold text-slate-500">Année {board.year}</span>
          <span className="text-slate-700">
            Facturé{" "}
            <strong className="tabular-nums text-slate-900">
              {board.kpis.yearInvoicedHtLabel}
            </strong>
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-emerald-800">
            Encaissé{" "}
            <strong className="tabular-nums">{board.kpis.yearCollectedLabel}</strong>
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-amber-900">
            Reste à encaisser{" "}
            <strong className="tabular-nums">{board.kpis.yearDueLabel}</strong>
          </span>
        </div>
      ) : null}

      {(treatSummary.overdue > 0 ||
        treatSummary.preparing > 0 ||
        treatSummary.prep > 0) &&
      view === "piloter" ? (
        <div className="flex flex-wrap gap-2 text-[12px]">
          <span className="font-semibold text-slate-500">À traiter</span>
          {treatSummary.overdue > 0 ? (
            <button
              type="button"
              onClick={() => setKpiFocus("overdue")}
              className="rounded-full bg-orange-50 px-2.5 py-1 font-medium text-orange-900"
            >
              🟠 {treatSummary.overdue} intervention
              {treatSummary.overdue > 1 ? "s" : ""} en retard
            </button>
          ) : null}
          {treatSummary.preparing > 0 ? (
            <button
              type="button"
              onClick={() => {
                setKpiFocus("preparing");
                setViewAndUrl("facturation");
              }}
              className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-900"
            >
              🟣 {treatSummary.preparing} facture
              {treatSummary.preparing > 1 ? "s" : ""} à finaliser
            </button>
          ) : null}
          {treatSummary.prep > 0 ? (
            <button
              type="button"
              onClick={() => setKpiFocus("to_prepare")}
              className="rounded-full bg-cyan-50 px-2.5 py-1 font-medium text-cyan-900"
            >
              🔵 {treatSummary.prep} à préparer
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="sticky top-14 z-20 flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white/95 p-3 shadow-sm backdrop-blur sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un contrat, client, adresse, facture…"
          className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-2 text-[13px] outline-none focus:border-violet-400/50"
        />
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["piloter", "À piloter"],
              ["planning", "Planning annuel"],
              ["portefeuille", "Portefeuille"],
              ["facturation", "Facturation"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewAndUrl(id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-[12px] font-semibold transition",
                view === id
                  ? "bg-[#1e3a5f] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {message ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
          {message}
        </p>
      ) : null}

      {view === "piloter" ? (
        <PilotView
          pilot={board.pilot.filter((p) =>
            kpiFocus === "overdue"
              ? p.bucket === "overdue"
              : kpiFocus === "within_30"
                ? p.bucket === "this_week" || p.bucket === "within_30"
                : kpiFocus === "to_prepare"
                  ? p.bucket === "to_prepare"
                  : kpiFocus === "to_bill"
                    ? p.bucket === "to_bill"
                    : kpiFocus === "preparing"
                      ? p.bucket === "preparing"
                      : true,
          )}
          includeFinancials={board.includeFinancials}
          query={query}
          onClearFocus={() => setKpiFocus(null)}
          focus={kpiFocus}
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
          onYear={setYear}
          onOpen={(contractId) => {
            const c = board.contracts.find((x) => x.id === contractId);
            if (c) openContract(c);
          }}
          pending={pending}
        />
      ) : null}

      {view === "portefeuille" ? (
        <PortfolioView
          list={portfolio}
          includeFinancials={board.includeFinancials}
          filter={filter}
          setFilter={setFilter}
          onOpen={openContract}
        />
      ) : null}

      {view === "facturation" ? (
        <BillingView
          board={board}
          includeFinancials={board.includeFinancials}
          onOpen={openContract}
          onPrepareInvoice={prepareInvoice}
          busy={busy}
          focus={kpiFocus}
        />
      ) : null}

      {selected ? (
        <AnnualContractDrawer
          contract={selected}
          year={board.year}
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

function KpiCard({
  label,
  value,
  tone,
  title,
  onClick,
  active,
}: {
  label: string;
  value: string;
  tone: "violet" | "indigo" | "orange" | "blue" | "amber" | "cyan" | "slate";
  title?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const tones: Record<string, string> = {
    violet: "border-violet-200/60 bg-violet-50/50",
    indigo: "border-indigo-200/60 bg-indigo-50/40",
    orange: "border-orange-200/60 bg-orange-50/40",
    blue: "border-sky-200/60 bg-sky-50/40",
    amber: "border-amber-200/60 bg-amber-50/40",
    cyan: "border-cyan-200/60 bg-cyan-50/40",
    slate: "border-slate-200 bg-white",
  };
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "rounded-2xl border px-3 py-2.5 text-left shadow-sm transition hover:-translate-y-px",
        tones[tone],
        active && "ring-2 ring-[#1e3a5f]/25",
      )}
    >
      <p className="text-[1.15rem] font-semibold tabular-nums text-[#1e3a5f]">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-slate-600">{label}</p>
    </button>
  );
}

function PilotView({
  pilot,
  includeFinancials,
  query,
  focus,
  onClearFocus,
  onOpen,
  onComplete,
  onPrepareInvoice,
  busy,
}: {
  pilot: Board["pilot"];
  includeFinancials: boolean;
  query: string;
  focus: string | null;
  onClearFocus: () => void;
  onOpen: (c: SerializedAnnualContract) => void;
  onComplete: (
    id: string,
    body?: { completedAt?: string; actualCrewCount?: number; comment?: string },
  ) => void;
  onPrepareInvoice: (id: string) => void;
  busy: boolean;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pilot;
    return pilot.filter(
      (p) =>
        p.contract.clientName.toLowerCase().includes(q) ||
        p.contract.siteAddress.toLowerCase().includes(q) ||
        (p.intervention.commercialInvoiceNumber ?? "")
          .toLowerCase()
          .includes(q),
    );
  }, [pilot, query]);

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-12 text-center text-slate-500">
        {focus ? (
          <button type="button" onClick={onClearFocus} className="text-[#1e3a5f] underline">
            Effacer le filtre KPI
          </button>
        ) : (
          "✓ Rien à piloter pour l’instant — le portefeuille est à jour."
        )}
      </div>
    );
  }

  const grouped = new Map<string, typeof filtered>();
  for (const p of filtered) {
    const list = grouped.get(p.bucket) ?? [];
    list.push(p);
    grouped.set(p.bucket, list);
  }

  const order = [
    "overdue",
    "this_week",
    "within_30",
    "to_bill",
    "preparing",
    "to_prepare",
  ];

  return (
    <div className="space-y-6">
      {focus ? (
        <button
          type="button"
          onClick={onClearFocus}
          className="text-[12px] font-medium text-[#1e3a5f] hover:underline"
        >
          Afficher tout · filtre actif
        </button>
      ) : null}
      {order
        .filter((b) => grouped.has(b))
        .map((bucket) => {
          const items = grouped.get(bucket)!;
          return (
            <section key={bucket}>
              <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
                {BUCKET_LABELS[bucket] ?? bucket}
                <span className="ml-1.5 font-medium normal-case text-slate-400">
                  · {items.length}
                </span>
              </h2>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <PilotRow
                    key={`${item.bucket}-${item.intervention.id}`}
                    item={item}
                    includeFinancials={includeFinancials}
                    onOpen={onOpen}
                    onComplete={onComplete}
                    onPrepareInvoice={onPrepareInvoice}
                    busy={busy}
                  />
                ))}
              </ul>
            </section>
          );
        })}
    </div>
  );
}

function PilotRow({
  item,
  includeFinancials,
  onOpen,
  onComplete,
  onPrepareInvoice,
  busy,
}: {
  item: Board["pilot"][number];
  includeFinancials: boolean;
  onOpen: (c: SerializedAnnualContract) => void;
  onComplete: (id: string) => void;
  onPrepareInvoice: (id: string) => void;
  busy: boolean;
}) {
  const primary = resolvePilotRowAction(item.contract, item.intervention, {
    includeFinancials,
    bucket: item.bucket,
  });
  const secondary = resolveAnnualSecondaryAction(item.contract, {
    includeFinancials,
  });
  const crew =
    item.intervention.plannedCrewCount ?? item.contract.plannedCrewCount;
  const duration =
    item.intervention.plannedDuration ?? item.contract.plannedDuration;
  const isBilling =
    item.bucket === "to_bill" || item.bucket === "preparing";

  return (
    <li
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
      onClick={() => onOpen(item.contract)}
    >
      <span
        className={cn(
          "absolute inset-y-0 left-0 w-[3px]",
          accentBar(item.bucket, item.intervention.daysOverdue),
        )}
        aria-hidden
      />
      {/* Desktop dense */}
      <div className="hidden gap-3 py-2.5 pl-4 pr-3 lg:grid lg:grid-cols-[28%_17%_20%_15%_20%] lg:items-center">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-slate-900">
            {item.contract.clientName}
          </p>
          <p className="truncate text-[12px] text-slate-500">
            {item.contract.siteAddress}
          </p>
          {item.contract.status === "ACTIVE" ? (
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-700/80">
              Contrat actif
            </p>
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Cycle</p>
          <p className="text-[13px] font-semibold text-slate-800">{item.cycleLabel}</p>
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold tabular-nums text-slate-900">
            {fmtDate(item.intervention.plannedDate) ?? "À programmer"}
          </p>
          <p className="text-[12px] text-slate-600">
            {isBilling
              ? item.intervention.billingStateLabel || item.intervention.statusLabel
              : item.intervention.daysOverdue != null
                ? `Retard de ${item.intervention.daysOverdue} j`
                : item.intervention.statusLabel}
          </p>
          {(crew != null || duration) && !isBilling ? (
            <p className="mt-0.5 text-[11px] text-slate-500">
              {[
                crew != null ? `${crew} pers.` : null,
                duration || null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
        </div>
        <div className="min-w-0">
          {includeFinancials && item.contract.amountHtLabel ? (
            <>
              <p className="text-[13px] font-semibold tabular-nums text-slate-900">
                {item.intervention.invoiceTotalHtLabel ?? item.contract.amountHtLabel}
              </p>
              <p className="text-[11px] text-slate-500">
                {isBilling && item.intervention.commercialInvoiceNumber
                  ? item.intervention.commercialInvoiceNumber
                  : "Annuel HT"}
              </p>
            </>
          ) : (
            <span className="text-slate-400">—</span>
          )}
        </div>
        <div
          className="flex flex-wrap items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <ActionButton
            action={primary}
            contractId={item.contract.id}
            busy={busy}
            onOpen={() => onOpen(item.contract)}
            onComplete={onComplete}
            onPrepareInvoice={onPrepareInvoice}
          />
          {secondary &&
          secondary.kind !== "none" &&
          secondary.interventionId !== primary.interventionId ? (
            <button
              type="button"
              className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600"
              onClick={() => onOpen(item.contract)}
              title={secondary.label}
            >
              {secondary.label}
            </button>
          ) : null}
        </div>
      </div>
      {/* Mobile */}
      <div className="space-y-2 px-4 py-3 lg:hidden">
        <div>
          <p className="font-semibold text-slate-900">{item.contract.clientName}</p>
          <p className="text-[12px] text-slate-500">{item.contract.siteAddress}</p>
        </div>
        <p className="text-[12px] font-medium text-violet-800">{item.cycleLabel}</p>
        <p className="text-[13px]">
          {fmtDate(item.intervention.plannedDate) ?? "À programmer"}
          {item.intervention.daysOverdue != null
            ? ` · retard ${item.intervention.daysOverdue} j`
            : ""}
        </p>
        {includeFinancials && item.contract.amountHtLabel ? (
          <p className="text-[13px] font-semibold tabular-nums">
            {item.contract.amountHtLabel}
          </p>
        ) : null}
        <div onClick={(e) => e.stopPropagation()}>
          <ActionButton
            action={primary}
            contractId={item.contract.id}
            busy={busy}
            onOpen={() => onOpen(item.contract)}
            onComplete={onComplete}
            onPrepareInvoice={onPrepareInvoice}
          />
        </div>
      </div>
    </li>
  );
}

function ActionButton({
  action,
  contractId,
  busy,
  onOpen,
  onComplete,
  onPrepareInvoice,
}: {
  action: ReturnType<typeof resolvePilotRowAction>;
  contractId: string;
  busy: boolean;
  onOpen: () => void;
  onComplete: (id: string) => void;
  onPrepareInvoice: (id: string) => void;
}) {
  if (action.kind === "none" || !action.label) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="rounded-full bg-[#1e3a5f] px-3 py-1.5 text-[11px] font-medium text-white"
      >
        Voir
      </button>
    );
  }
  if (action.kind === "view_invoice" || action.kind === "view_paid_invoice") {
    const invId = action.invoiceHref?.split("/").pop()?.split("?")[0];
    if (!invId) return null;
    return (
      <a
        href={annualInvoiceHref({ invoiceId: invId, contractId })}
        target="_blank"
        rel="noreferrer"
        className="rounded-full bg-[#1e3a5f] px-3 py-1.5 text-[11px] font-medium text-white"
      >
        {action.label}
      </a>
    );
  }
  if (action.kind === "prepare_invoice" || action.kind === "continue_invoice") {
    return (
      <button
        type="button"
        disabled={busy || !action.interventionId}
        onClick={() =>
          action.interventionId && onPrepareInvoice(action.interventionId)
        }
        className="rounded-full bg-[#1e3a5f] px-3 py-1.5 text-[11px] font-medium text-white disabled:opacity-40"
      >
        {action.label}
      </button>
    );
  }
  if (action.kind === "complete") {
    return (
      <button
        type="button"
        disabled={busy || !action.interventionId}
        onClick={onOpen}
        className="rounded-full bg-[#1e3a5f] px-3 py-1.5 text-[11px] font-medium text-white disabled:opacity-40"
      >
        {action.label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-full bg-[#1e3a5f] px-3 py-1.5 text-[11px] font-medium text-white"
    >
      {action.label}
    </button>
  );
}

function PortfolioView({
  list,
  includeFinancials,
  filter,
  setFilter,
  onOpen,
}: {
  list: SerializedAnnualContract[];
  includeFinancials: boolean;
  filter: string;
  setFilter: (f: "all" | "actifs" | "programmer" | "facturer" | "resilies") => void;
  onOpen: (c: SerializedAnnualContract) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Tous"],
            ["actifs", "Actifs"],
            ["programmer", "À programmer"],
            ["facturer", "Facturation"],
            ["resilies", "Résiliés"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium",
              filter === id ? "bg-[#1e3a5f] text-white" : "bg-slate-100 text-slate-600",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Adresse</th>
              {includeFinancials ? (
                <th className="px-4 py-3">Montant annuel HT</th>
              ) : null}
              <th className="px-4 py-3">Fréquence</th>
              <th className="px-4 py-3">Prochaine</th>
              <th className="px-4 py-3">Dernière</th>
              <th className="px-4 py-3">Facturation</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => {
              const bill =
                c.history.find(
                  (h) =>
                    h.billingState === "to_bill" ||
                    h.billingState === "preparing" ||
                    h.billingState === "invoiced" ||
                    h.billingState === "paid",
                ) ?? null;
              return (
                <tr
                  key={c.id}
                  className="cursor-pointer border-t border-slate-100 hover:bg-slate-50/80"
                  onClick={() => onOpen(c)}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {c.clientName}
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-slate-600">
                    {c.siteAddress}
                  </td>
                  {includeFinancials ? (
                    <td className="px-4 py-3 tabular-nums">{c.amountHtLabel}</td>
                  ) : null}
                  <td className="px-4 py-3 text-slate-600">{c.frequencyLabel}</td>
                  <td className="px-4 py-3">
                    {c.nextPlannedDate
                      ? fmtDate(c.nextPlannedDate)
                      : "À programmer"}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.lastCompletedDate
                      ? fmtDate(c.lastCompletedDate)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-[12px]">
                    {bill
                      ? `${bill.plannedYear ?? ""} · ${bill.billingStateLabel}${
                          bill.commercialInvoiceNumber
                            ? ` · ${bill.commercialInvoiceNumber}`
                            : ""
                        }`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">{c.statusLabel}</td>
                </tr>
              );
            })}
            {list.length === 0 ? (
              <tr>
                <td
                  colSpan={includeFinancials ? 8 : 7}
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
  );
}

function BillingView({
  board,
  includeFinancials,
  onOpen,
  onPrepareInvoice,
  busy,
  focus,
}: {
  board: Board;
  includeFinancials: boolean;
  onOpen: (c: SerializedAnnualContract) => void;
  onPrepareInvoice: (id: string) => void;
  busy: boolean;
  focus: string | null;
}) {
  if (!includeFinancials) {
    return (
      <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
        Montants et factures masqués pour votre profil.
      </p>
    );
  }
  const groups = [
    { id: "toBill", label: "À facturer", items: board.billingView.toBill },
    {
      id: "preparing",
      label: "En préparation",
      items: board.billingView.preparing,
    },
    { id: "invoiced", label: "Émises", items: board.billingView.invoiced },
    {
      id: "toCollect",
      label: "À encaisser",
      items: board.billingView.toCollect,
    },
    {
      id: "collected",
      label: "Encaissées",
      items: board.billingView.collected,
    },
  ].filter((g) => {
    if (focus === "to_bill") return g.id === "toBill";
    if (focus === "preparing") return g.id === "preparing";
    return g.items.length > 0;
  });

  if (groups.every((g) => g.items.length === 0)) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
        ✓ Aucune facture en attente pour {board.year}.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((g) =>
        g.items.length === 0 ? null : (
          <section key={g.id}>
            <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-slate-500">
              {g.label} · {g.items.length}
            </h2>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {g.items.map((item) => (
                <li
                  key={item.intervention.id}
                  className="flex cursor-pointer flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-50/80"
                  onClick={() => onOpen(item.contract)}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {item.contract.clientName}
                    </p>
                    <p className="text-[12px] text-slate-500">
                      {item.cycleLabel}
                      {item.intervention.plannedDate
                        ? ` · ${fmtDate(item.intervention.plannedDate)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[13px]">
                    <span className="font-semibold tabular-nums">
                      {item.intervention.invoiceTotalHtLabel ??
                        item.contract.amountHtLabel}
                    </span>
                    <span className="text-slate-600">
                      {item.intervention.commercialInvoiceNumber ??
                        item.intervention.billingStateLabel}
                    </span>
                    <div onClick={(e) => e.stopPropagation()}>
                      <ActionButton
                        action={resolvePilotRowAction(
                          item.contract,
                          item.intervention,
                          {
                            includeFinancials: true,
                            bucket:
                              item.intervention.billingState === "preparing"
                                ? "preparing"
                                : "to_bill",
                          },
                        )}
                        contractId={item.contract.id}
                        busy={busy}
                        onOpen={() => onOpen(item.contract)}
                        onComplete={() => undefined}
                        onPrepareInvoice={onPrepareInvoice}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ),
      )}
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
          ← {year - 1}
        </button>
        <span className="text-lg font-semibold text-violet-800">{year}</span>
        <button
          type="button"
          onClick={() => onYear(year + 1)}
          className="rounded-lg px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
        >
          {year + 1} →
        </button>
      </div>
      <p className="text-center text-[11px] text-slate-500">
        Synthèse annuelle — détail horaire dans l’Agenda
      </p>
      <div
        className={cn(
          "overflow-x-auto rounded-2xl border border-slate-200 bg-white",
          pending && "opacity-60",
        )}
      >
        <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="bg-violet-900 text-white">
              <th className="sticky left-0 z-10 bg-violet-900 px-3 py-3 text-xs font-medium">
                Client / site
              </th>
              {includeFinancials ? (
                <th className="px-2 py-3 text-xs font-medium">HT</th>
              ) : null}
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
                {MONTHS.map((_, month) => {
                  const inter = row.months.get(month);
                  return (
                    <td key={month} className="px-1 py-1.5 align-middle">
                      {inter ? (
                        <button
                          type="button"
                          onClick={() => onOpen(id)}
                          title={inter.statusLabel}
                          className={cn(
                            "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold",
                            inter.daysOverdue != null
                              ? "bg-orange-500 text-white"
                              : inter.status === "COMPLETED"
                                ? "bg-emerald-500 text-white"
                                : inter.status === "SCHEDULED"
                                  ? "bg-sky-500 text-white"
                                  : inter.status === "TO_PREPARE"
                                    ? "bg-cyan-500 text-white"
                                    : "bg-slate-300 text-slate-800",
                          )}
                        >
                          {inter.plannedDate
                            ? new Date(
                                inter.plannedDate + "T00:00:00Z",
                              ).getUTCDate()
                            : "·"}
                        </button>
                      ) : (
                        <span className="mx-auto block h-2 w-2 rounded-full bg-slate-100" />
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
