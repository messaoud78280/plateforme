"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  EMPTY_SUPPLIER_FORM,
  SupplierFormDrawer,
} from "@/components/suppliers/SupplierFormDrawer";
import { cn } from "@/lib/cn";
import type {
  SupplierWorkspaceRow,
  SuppliersPeriod,
  SuppliersSort,
  SuppliersView,
  SuppliersWorkspaceSummary,
} from "@/lib/suppliers/suppliers-workspace";

function fmtHt(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtDelivery(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
    time: d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  };
}

type Props = {
  rows: SupplierWorkspaceRow[];
  summary: SuppliersWorkspaceSummary;
  initialView?: SuppliersView;
  initialQ?: string;
  initialSort?: SuppliersSort;
  initialPeriod?: SuppliersPeriod;
  initialDisplay?: "cards" | "list";
};

export function SuppliersWorkspace({
  rows: initialRows,
  summary: initialSummary,
  initialView = "all",
  initialQ = "",
  initialSort = "name",
  initialPeriod = "month",
  initialDisplay = "cards",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState(initialRows);
  const [summary, setSummary] = useState(initialSummary);
  const [view, setView] = useState<SuppliersView>(initialView);
  const [q, setQ] = useState(initialQ);
  const [sort, setSort] = useState<SuppliersSort>(initialSort);
  const [period, setPeriod] = useState<SuppliersPeriod>(initialPeriod);
  const [display, setDisplay] = useState<"cards" | "list">(initialDisplay);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"" | "ACTIVE" | "INACTIVE" | "incomplete">("");
  const [createOpen, setCreateOpen] = useState(false);
  const [drawer, setDrawer] = useState<SupplierWorkspaceRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);
  useEffect(() => {
    setSummary(initialSummary);
  }, [initialSummary]);

  function pushUrl(next: {
    view?: string;
    q?: string;
    sort?: string;
    period?: string;
    display?: string;
    status?: string;
  }) {
    const p = new URLSearchParams();
    const v = next.view ?? (view === "all" ? "" : view);
    const qq = next.q !== undefined ? next.q : q;
    const s = next.sort ?? (sort === "name" ? "" : sort);
    const per = next.period ?? (period === "month" ? "" : period);
    const d = next.display ?? (display === "cards" ? "" : display);
    const st = next.status !== undefined ? next.status : statusFilter;
    if (v) p.set("view", v);
    if (qq.trim()) p.set("q", qq.trim());
    if (s) p.set("sort", s);
    if (per) p.set("period", per);
    if (d) p.set("display", d);
    if (st) p.set("status", st);
    const qs = p.toString();
    startTransition(() => {
      router.replace(qs ? `/dashboard/fournisseurs?${qs}` : "/dashboard/fournisseurs");
    });
  }

  useEffect(() => {
    const t = window.setTimeout(() => pushUrl({ q }), 280);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const filtered = useMemo(() => {
    let list = [...rows];
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter((s) =>
        [
          s.name,
          s.tradeName,
          s.activity,
          s.city,
          s.phone,
          s.email,
          s.siret,
          s.primaryContactName,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle),
      );
    }
    if (view === "active") list = list.filter((s) => s.status === "ACTIVE");
    else if (view === "with_orders") list = list.filter((s) => s.hasOpenOrders);
    else if (view === "with_deliveries") list = list.filter((s) => s.hasUpcomingDelivery);
    else if (view === "awaiting_confirm") list = list.filter((s) => s.awaitingConfirmCount > 0);
    else if (view === "incomplete") list = list.filter((s) => s.isIncomplete);

    if (statusFilter === "ACTIVE" || statusFilter === "INACTIVE") {
      list = list.filter((s) => s.status === statusFilter);
    } else if (statusFilter === "incomplete") {
      list = list.filter((s) => s.isIncomplete);
    }

    list.sort((a, b) => {
      switch (sort) {
        case "active":
          return (
            Number(b.hasOpenOrders) - Number(a.hasOpenOrders) ||
            b.openOrdersCount - a.openOrdersCount ||
            a.displayName.localeCompare(b.displayName, "fr")
          );
        case "last_order":
          return (b.lastOrderAt ?? "").localeCompare(a.lastOrderAt ?? "");
        case "committed":
          return b.committedHt - a.committedHt;
        case "spent":
          return b.spentPeriodHt - a.spentPeriodHt;
        case "confirm":
          return b.awaitingConfirmCount - a.awaitingConfirmCount;
        case "deliveries":
          return b.upcomingDeliveriesCount - a.upcomingDeliveriesCount;
        case "activity":
          return (b.lastOrderAt ?? b.lastInvoiceAt ?? "").localeCompare(
            a.lastOrderAt ?? a.lastInvoiceAt ?? "",
          );
        default:
          return a.displayName.localeCompare(b.displayName, "fr");
      }
    });
    return list;
  }, [rows, q, view, sort, statusFilter]);

  const treatBanner =
    summary.awaitingConfirmCount > 0 || summary.incompleteCount > 0;

  const kpiItems = [
    {
      id: "active",
      value: String(summary.activeCount),
      label: "Fournisseurs actifs",
      secondary: `${rows.length} au total`,
      tone: "violet" as const,
      icon: Users,
      onClick: () => {
        setView("active");
        pushUrl({ view: "active" });
      },
    },
    {
      id: "open",
      value: String(summary.openOrdersCount),
      label: "Commandes ouvertes",
      secondary: "tous fournisseurs",
      tone: "accent" as const,
      icon: ShoppingCart,
      onClick: () => {
        setView("with_orders");
        pushUrl({ view: "with_orders" });
      },
    },
    {
      id: "committed",
      value: fmtHt(summary.committedHt),
      label: "Engagements HT",
      secondary: "commandes ouvertes",
      tone: "navy" as const,
      icon: ClipboardList,
      onClick: () => {
        setView("with_orders");
        setSort("committed");
        pushUrl({ view: "with_orders", sort: "committed" });
      },
    },
    {
      id: "spent",
      value: fmtHt(summary.spentPeriodHt),
      label: "Dépenses période",
      secondary: summary.periodLabel,
      tone: "watch" as const,
      icon: Building2,
      onClick: () => {
        setSort("spent");
        pushUrl({ sort: "spent" });
      },
    },
    {
      id: "confirm",
      value: String(summary.awaitingConfirmCount),
      label: "Confirmations attendues",
      secondary: "fournisseur",
      tone: "critical" as const,
      icon: AlertTriangle,
      onClick: () => {
        setView("awaiting_confirm");
        pushUrl({ view: "awaiting_confirm" });
      },
    },
    {
      id: "deliv",
      value: String(summary.upcomingDeliveriesCount),
      label: "Livraisons à venir",
      secondary: "planifiées",
      tone: "cyan" as const,
      icon: Truck,
      onClick: () => {
        setView("with_deliveries");
        pushUrl({ view: "with_deliveries" });
      },
    },
  ];

  function SupplierCard({ s }: { s: SupplierWorkspaceRow }) {
    const del = fmtDelivery(s.nextDeliveryAt);
    const showStats =
      s.openOrdersCount > 0 ||
      s.committedHt > 0.004 ||
      Math.abs(s.spentPeriodHt) > 0.004 ||
      s.hasUpcomingDelivery;

    return (
      <li
        className={cn(
          "group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[var(--cc-shadow)] transition hover:-translate-y-px hover:border-bework-intel/25 hover:shadow-md",
          s.status !== "ACTIVE" && "opacity-70",
        )}
        onClick={() => setDrawer(s)}
      >
        <span
          className={cn(
            "absolute inset-y-0 left-0 w-1",
            s.awaitingConfirmCount > 0
              ? "bg-amber-500"
              : s.hasOpenOrders
                ? "bg-bework-accent"
                : s.isIncomplete
                  ? "bg-slate-300"
                  : "bg-bework-intel/50",
          )}
          aria-hidden
        />
        <div className="grid gap-3 p-4 pl-5 lg:grid-cols-[minmax(11rem,1.2fr)_minmax(12rem,1.4fr)_minmax(9rem,1fr)_auto] lg:items-center">
          {/* Identité */}
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bework-soft-violet text-[13px] font-bold text-bework-intel">
              {s.initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold tracking-tight text-bework-ink">
                {s.displayName}
              </p>
              <p className="mt-0.5 truncate text-[12px] text-slate-600">
                {s.activity || "Fournisseur"}
                {s.city ? ` · ${s.city}` : ""}
              </p>
              <p className="mt-0.5 text-[12px] text-slate-500">
                {s.contactsCount > 0
                  ? `${s.contactsCount} contact${s.contactsCount > 1 ? "s" : ""}`
                  : "Aucun contact"}
                {s.status !== "ACTIVE" ? " · Inactif" : ""}
              </p>
            </div>
          </div>

          {/* Activité */}
          <div className="grid grid-cols-2 gap-2 text-[13px] sm:grid-cols-3 lg:grid-cols-3">
            {showStats ? (
              <>
                {(s.openOrdersCount > 0 || s.committedHt > 0.004) && (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Commandes
                    </p>
                    <p className="font-semibold tabular-nums text-bework-navy">
                      {s.openOrdersCount} ouv.
                    </p>
                    {s.committedHt > 0.004 ? (
                      <p className="text-[12px] tabular-nums text-slate-600">
                        {fmtHt(s.committedHt)} HT
                      </p>
                    ) : null}
                  </div>
                )}
                {Math.abs(s.spentPeriodHt) > 0.004 ? (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Dépenses
                    </p>
                    <p className="font-semibold tabular-nums text-bework-navy">
                      {fmtHt(s.spentPeriodHt)}
                    </p>
                    <p className="text-[12px] text-slate-500">HT période</p>
                  </div>
                ) : null}
                {del ? (
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Livraison
                    </p>
                    <p className="font-semibold text-cyan-900">
                      {del.date} · {del.time}
                    </p>
                    {s.nextDeliveryProject ? (
                      <p className="truncate text-[12px] text-slate-500">
                        {s.nextDeliveryProject}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="col-span-full text-[13px] text-slate-500">
                Pas d’activité ouverte pour le moment
              </p>
            )}
          </div>

          {/* À traiter */}
          <div>
            {s.awaitingConfirmCount > 0 ? (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[12px] font-semibold text-amber-900">
                <span aria-hidden>🟠</span>
                {s.awaitingConfirmCount} confirmation
                {s.awaitingConfirmCount > 1 ? "s" : ""} attendue
                {s.awaitingConfirmCount > 1 ? "s" : ""}
              </p>
            ) : s.isIncomplete ? (
              <p className="text-[12px] font-medium text-slate-500">
                {s.incompleteItems.length} info
                {s.incompleteItems.length > 1 ? "s" : ""} à compléter
              </p>
            ) : s.hasOpenOrders ? (
              <p className="inline-flex items-center gap-1 text-[12px] font-medium text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Situation suivie
              </p>
            ) : null}
          </div>

          {/* Actions */}
          <div
            className="flex flex-wrap items-center justify-end gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href={`/dashboard/fournisseurs/${s.id}`}
              className="rounded-full bg-[#1e3a5f] px-3 py-1.5 text-[12px] font-medium text-white"
            >
              Ouvrir la fiche
            </Link>
            <Link
              href={`/dashboard/commandes?supplierId=${encodeURIComponent(s.id)}`}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-medium text-slate-700"
            >
              Commandes
            </Link>
          </div>
        </div>
      </li>
    );
  }

  return (
    <div className={cn("mx-auto max-w-[1440px] space-y-5 px-1 sm:px-0", pending && "opacity-80")}>
      <PageHeader
        title="Fournisseurs"
        description="Centralisez vos fournisseurs, contacts, commandes et dépenses."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
            >
              + Nouveau fournisseur
            </button>
            <Link
              href="/dashboard/commandes/nouvelle"
              className="rounded-full border border-bework-navy/15 bg-white px-3 py-2 text-[13px] font-medium text-bework-navy"
            >
              Nouvelle commande
            </Link>
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-full border border-bework-navy/15 bg-white px-3 py-2 text-[13px] font-medium text-bework-navy">
                Actions
              </summary>
              <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-slate-200 bg-white py-1 text-[13px] shadow-lg">
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                  onClick={() => setCreateOpen(true)}
                >
                  Nouveau fournisseur
                </button>
                <Link href="/dashboard/commandes/nouvelle" className="block px-3 py-2 hover:bg-slate-50">
                  Nouvelle commande
                </Link>
                <Link href="/dashboard/depenses" className="block px-3 py-2 hover:bg-slate-50">
                  Voir les dépenses
                </Link>
              </div>
            </details>
          </div>
        }
      />

      {treatBanner ? (
        <div className="rounded-2xl border border-bework-navy/10 bg-white px-4 py-3">
          <p className="text-[13px] font-semibold text-bework-navy">À traiter</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[13px]">
            {summary.awaitingConfirmCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setView("awaiting_confirm");
                  pushUrl({ view: "awaiting_confirm" });
                }}
                className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-900"
              >
                {summary.awaitingConfirmCount} confirmation
                {summary.awaitingConfirmCount > 1 ? "s" : ""} attendue
                {summary.awaitingConfirmCount > 1 ? "s" : ""}
              </button>
            ) : null}
            {summary.incompleteCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setView("incomplete");
                  pushUrl({ view: "incomplete" });
                }}
                className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700"
              >
                {summary.incompleteCount} fiche
                {summary.incompleteCount > 1 ? "s" : ""} à compléter
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-[13px] font-medium text-emerald-700">
          ✓ Toutes les confirmations fournisseurs sont à jour
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {kpiItems.map((k) => {
          const Icon = k.icon;
          return (
            <button
              key={k.id}
              type="button"
              onClick={k.onClick}
              className={cn(
                "rounded-2xl border px-3 py-2.5 text-left shadow-[var(--cc-shadow)] transition hover:-translate-y-px",
                k.tone === "critical" && "border-bework-critical/25 bg-bework-soft-critical/60",
                k.tone === "cyan" && "border-bework-cyan/20 bg-bework-soft-cyan/60",
                k.tone === "accent" && "border-bework-accent/20 bg-bework-soft-accent/70",
                k.tone === "watch" && "border-bework-watch/25 bg-bework-soft-watch/70",
                k.tone === "violet" && "border-bework-intel/20 bg-bework-soft-violet/70",
                k.tone === "navy" && "border-bework-navy/10 bg-bework-soft-navy/50",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[1.1rem] font-semibold tabular-nums leading-tight text-bework-navy">
                  {k.value}
                </p>
                <Icon className="h-4 w-4 shrink-0 text-bework-navy/70" strokeWidth={1.75} />
              </div>
              <p className="mt-1.5 text-[12px] font-medium text-slate-700">{k.label}</p>
              <p className="text-[11px] text-slate-500">{k.secondary}</p>
            </button>
          );
        })}
      </div>

      <div className="sticky top-14 z-20 space-y-2 bg-[linear-gradient(180deg,#f8fafc_75%,rgba(248,250,252,0.8))] py-2">
        <div className="flex flex-wrap gap-1 rounded-full border border-slate-200 bg-white p-0.5">
          {(
            [
              ["all", "Tous"],
              ["active", "Actifs"],
              ["with_orders", "Avec commandes"],
              ["with_deliveries", "Avec livraisons"],
              ["awaiting_confirm", "Confirmation attendue"],
              ["incomplete", "À compléter"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setView(id);
                pushUrl({ view: id === "all" ? "" : id });
              }}
              className={cn(
                "rounded-full px-3 py-1.5 text-[12px] font-semibold",
                view === id ? "bg-bework-navy text-white" : "text-slate-600",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un fournisseur, métier, contact, ville, SIRET, référence…"
            className="min-w-[14rem] flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] outline-none focus:border-bework-accent/40"
          />
          <select
            value={period}
            onChange={(e) => {
              const p = e.target.value as SuppliersPeriod;
              setPeriod(p);
              pushUrl({ period: p === "month" ? "" : p });
              startTransition(() => router.refresh());
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px]"
          >
            <option value="month">Ce mois</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Année</option>
            <option value="last12">12 derniers mois</option>
            <option value="all">Toutes périodes</option>
          </select>
          <select
            value={sort}
            onChange={(e) => {
              const s = e.target.value as SuppliersSort;
              setSort(s);
              pushUrl({ sort: s === "name" ? "" : s });
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px]"
          >
            <option value="name">Nom A–Z</option>
            <option value="active">Plus actifs</option>
            <option value="last_order">Dernière commande</option>
            <option value="committed">Montant commandé</option>
            <option value="spent">Montant dépensé</option>
            <option value="confirm">Confirmations attendues</option>
            <option value="deliveries">Livraisons à venir</option>
            <option value="activity">Dernière activité</option>
          </select>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium"
          >
            Filtres
          </button>
          <div className="flex rounded-full border border-slate-200 bg-white p-0.5 text-[12px]">
            <button
              type="button"
              onClick={() => {
                setDisplay("cards");
                pushUrl({ display: "" });
              }}
              className={cn(
                "rounded-full px-2.5 py-1 font-medium",
                display === "cards" ? "bg-bework-navy text-white" : "text-slate-600",
              )}
            >
              Cartes
            </button>
            <button
              type="button"
              onClick={() => {
                setDisplay("list");
                pushUrl({ display: "list" });
              }}
              className={cn(
                "rounded-full px-2.5 py-1 font-medium",
                display === "list" ? "bg-bework-navy text-white" : "text-slate-600",
              )}
            >
              Liste
            </button>
          </div>
        </div>
        {filtersOpen ? (
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["", "Tous statuts"],
                ["ACTIVE", "Actif"],
                ["INACTIVE", "Inactif"],
                ["incomplete", "À compléter"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id || "all-st"}
                type="button"
                onClick={() => {
                  setStatusFilter(id);
                  pushUrl({ status: id });
                }}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  statusFilter === id ? "bg-[#1e3a5f] text-white" : "bg-slate-100 text-slate-600",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Aucun fournisseur"
          description="Ajoutez votre premier fournisseur au référentiel."
          actionLabel="+ Nouveau fournisseur"
          onAction={() => setCreateOpen(true)}
        />
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
          Aucun fournisseur ne correspond à votre recherche.
        </p>
      ) : display === "list" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Fournisseur</th>
                <th className="hidden px-3 py-2.5 sm:table-cell">Commandes</th>
                <th className="hidden px-3 py-2.5 md:table-cell">Dépenses</th>
                <th className="hidden px-3 py-2.5 lg:table-cell">Livraison</th>
                <th className="px-3 py-2.5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer hover:bg-slate-50/80"
                  onClick={() => setDrawer(s)}
                >
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-bework-ink">{s.displayName}</p>
                    <p className="text-[12px] text-slate-500">
                      {s.activity || "—"}
                      {s.city ? ` · ${s.city}` : ""}
                    </p>
                  </td>
                  <td className="hidden tabular-nums sm:table-cell px-3 py-2.5">
                    {s.openOrdersCount > 0 ? (
                      <>
                        {s.openOrdersCount}
                        {s.committedHt > 0 ? (
                          <span className="text-slate-500"> · {fmtHt(s.committedHt)}</span>
                        ) : null}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="hidden tabular-nums md:table-cell px-3 py-2.5">
                    {Math.abs(s.spentPeriodHt) > 0.004 ? fmtHt(s.spentPeriodHt) : "—"}
                  </td>
                  <td className="hidden lg:table-cell px-3 py-2.5 text-slate-600">
                    {fmtDelivery(s.nextDeliveryAt)
                      ? `${fmtDelivery(s.nextDeliveryAt)!.date}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/dashboard/fournisseurs/${s.id}`}
                      className="font-medium text-bework-navy hover:underline"
                    >
                      Ouvrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((s) => (
            <SupplierCard key={s.id} s={s} />
          ))}
        </ul>
      )}

      {drawer ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/20"
          onClick={() => setDrawer(null)}
        >
          <aside
            className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-[-8px_0_32px_rgba(15,23,42,0.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bework-soft-violet text-sm font-bold text-bework-intel">
                {drawer.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[18px] font-semibold text-bework-ink">{drawer.displayName}</p>
                <p className="text-[13px] text-slate-600">{drawer.activity || "Fournisseur"}</p>
                {drawer.status === "ACTIVE" ? (
                  <p className="mt-1 text-[12px] font-medium text-emerald-700">Actif</p>
                ) : (
                  <p className="mt-1 text-[12px] font-medium text-slate-500">Inactif</p>
                )}
              </div>
              <button type="button" onClick={() => setDrawer(null)} className="text-slate-400" aria-label="Fermer">
                ×
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Commandes ouvertes</dt>
                <dd className="font-semibold tabular-nums">{drawer.openOrdersCount}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Engagé</dt>
                <dd className="font-semibold tabular-nums">{fmtHt(drawer.committedHt)} HT</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Dépenses période</dt>
                <dd className="font-semibold tabular-nums">{fmtHt(drawer.spentPeriodHt)} HT</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Livraisons à venir</dt>
                <dd className="font-semibold tabular-nums">{drawer.upcomingDeliveriesCount}</dd>
              </div>
            </dl>

            {drawer.awaitingConfirmCount > 0 ? (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[13px] font-semibold text-amber-900">
                {drawer.awaitingConfirmCount} confirmation
                {drawer.awaitingConfirmCount > 1 ? "s" : ""} attendue
                {drawer.awaitingConfirmCount > 1 ? "s" : ""}
              </p>
            ) : null}

            {drawer.nextDeliveryAt ? (
              <div className="mt-3 rounded-xl border border-cyan-100 bg-cyan-50/50 px-3 py-2 text-[13px]">
                <p className="text-[11px] font-semibold uppercase text-cyan-800">Prochaine livraison</p>
                <p className="font-medium text-slate-800">
                  {fmtDelivery(drawer.nextDeliveryAt)?.date} ·{" "}
                  {fmtDelivery(drawer.nextDeliveryAt)?.time}
                </p>
                {drawer.nextDeliveryProject ? (
                  <p className="text-slate-600">{drawer.nextDeliveryProject}</p>
                ) : null}
                {drawer.nextDeliveryNumber ? (
                  <p className="text-slate-500">{drawer.nextDeliveryNumber}</p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-4 text-[13px]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Contacts
              </p>
              {drawer.primaryContactName ? (
                <p className="mt-1 font-medium">{drawer.primaryContactName} (principal)</p>
              ) : (
                <p className="mt-1 text-slate-500">Aucun contact principal</p>
              )}
              {drawer.phone ? <p className="text-slate-600">{drawer.phone}</p> : null}
              {drawer.email ? <p className="text-slate-600">{drawer.email}</p> : null}
            </div>

            <div className="mt-4 text-[13px]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Dernière activité
              </p>
              <p className="mt-1 text-slate-700">
                Commande : {fmtDate(drawer.lastOrderAt) ?? "—"}
              </p>
              <p className="text-slate-700">
                Facture : {fmtDate(drawer.lastInvoiceAt) ?? "—"}
              </p>
            </div>

            {drawer.isIncomplete ? (
              <p className="mt-3 text-[12px] text-amber-800">
                À compléter : {drawer.incompleteItems.join(", ")}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2">
              <Link
                href={`/dashboard/fournisseurs/${drawer.id}`}
                className="rounded-full bg-[#1e3a5f] px-4 py-2.5 text-center text-[13px] font-medium text-white"
              >
                Ouvrir la fiche
              </Link>
              <Link
                href={`/dashboard/commandes/nouvelle?supplierId=${encodeURIComponent(drawer.id)}`}
                className="rounded-full border border-slate-200 px-4 py-2 text-center text-[13px] font-medium"
              >
                Nouvelle commande
              </Link>
              <Link
                href={`/dashboard/commandes?supplierId=${encodeURIComponent(drawer.id)}`}
                className="text-center text-[13px] font-medium text-bework-navy hover:underline"
              >
                Voir les commandes
              </Link>
              <Link
                href={`/dashboard/depenses?supplierId=${encodeURIComponent(drawer.id)}`}
                className="text-center text-[13px] font-medium text-bework-navy hover:underline"
              >
                Voir les dépenses
              </Link>
              <Link
                href={`/dashboard/commandes?supplierId=${encodeURIComponent(drawer.id)}&view=deliveries`}
                className="text-center text-[13px] font-medium text-bework-navy hover:underline"
              >
                Voir les livraisons
              </Link>
              <Link
                href={`/dashboard/documents?q=${encodeURIComponent(drawer.displayName)}`}
                className="text-center text-[13px] font-medium text-bework-navy hover:underline"
              >
                Voir dans Documents
              </Link>
            </div>
          </aside>
        </div>
      ) : null}

      <SupplierFormDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        mode="create"
        initial={EMPTY_SUPPLIER_FORM}
        onSaved={() => {
          setToast("Fournisseur ajouté");
          window.setTimeout(() => setToast(null), 2800);
          setCreateOpen(false);
          router.refresh();
        }}
      />

      {toast ? (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-bework-navy-deep px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          {toast}
        </div>
      ) : null}
    </div>
  );
}
