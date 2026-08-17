"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  FileWarning,
  ShoppingCart,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader";
import type {
  ExpenseListRow,
  ExpensesPeriod,
  ExpensesSort,
  ExpensesView,
  ExpensesWorkspaceSummary,
} from "@/lib/chantier/expenses-workspace";
import { SUPPLIER_INVOICE_CATEGORY_LABELS } from "@/lib/chantier/supplier-invoices";

function fmtHt(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}

function fmtDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function categoryBadgeClass(cat: string) {
  switch (cat) {
    case "MATERIAL":
      return "bg-amber-50 text-amber-900 border-amber-200/80";
    case "EQUIPMENT":
      return "bg-sky-50 text-sky-900 border-sky-200/80";
    case "SUBCONTRACT":
      return "bg-violet-50 text-violet-900 border-violet-200/80";
    case "OTHER":
      return "bg-slate-100 text-slate-700 border-slate-200";
    default:
      return "bg-slate-100 text-slate-500 border-slate-200";
  }
}

function controlTone(row: ExpenseListRow) {
  if (row.controlStatus === "coherent") return "text-emerald-700";
  if (row.controlStatus === "cancelled") return "text-slate-500";
  if (row.controlStatus === "without_po") return "text-slate-600";
  if (row.controlStatus === "unclassified" || row.controlStatus === "missing_receipt")
    return "text-amber-800";
  if (row.controlStatus === "to_verify") {
    if (row.varianceHt != null && Math.abs(row.varianceHt) > 500) return "text-red-700";
    return "text-amber-800";
  }
  return "text-slate-600";
}

function primaryAction(row: ExpenseListRow): { label: string; href?: string } {
  if (row.status === "CANCELLED") return { label: "Voir" };
  if (row.category === "UNCLASSIFIED") return { label: "Classer", href: row.profitabilityHref };
  if (row.needsControl && row.purchaseOrderHref) {
    return { label: "Contrôler", href: row.purchaseOrderHref };
  }
  if (!row.purchaseOrderId) return { label: "Voir" };
  return { label: "Voir", href: row.purchaseOrderHref ?? undefined };
}

type Props = {
  rows: ExpenseListRow[];
  summary: ExpensesWorkspaceSummary;
  canOpenSupplier: boolean;
  initialView?: ExpensesView;
  initialQ?: string;
  initialSort?: ExpensesSort;
  initialPeriod?: ExpensesPeriod;
  initialProjectId?: string;
  initialSupplierId?: string;
  initialPurchaseOrderId?: string;
  initialCategory?: string;
};

export function ExpensesWorkspace({
  rows: initialRows,
  summary: initialSummary,
  canOpenSupplier,
  initialView = "all",
  initialQ = "",
  initialSort = "recent",
  initialPeriod = "month",
  initialProjectId = "",
  initialSupplierId = "",
  initialPurchaseOrderId = "",
  initialCategory = "",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rows, setRows] = useState(initialRows);
  const [summary, setSummary] = useState(initialSummary);
  const [view, setView] = useState<ExpensesView>(initialView);
  const [q, setQ] = useState(initialQ);
  const [sort, setSort] = useState<ExpensesSort>(initialSort);
  const [period, setPeriod] = useState<ExpensesPeriod>(initialPeriod);
  const [projectId, setProjectId] = useState(initialProjectId);
  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [purchaseOrderId] = useState(initialPurchaseOrderId);
  const [category, setCategory] = useState(initialCategory);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [drawer, setDrawer] = useState<ExpenseListRow | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    projectId?: string;
    supplierId?: string;
    category?: string;
  }) {
    const p = new URLSearchParams();
    const v = next.view ?? (view === "all" ? "" : view);
    const qq = next.q !== undefined ? next.q : q;
    const s = next.sort ?? (sort === "recent" ? "" : sort);
    const per = next.period ?? (period === "month" ? "" : period);
    const pi = next.projectId !== undefined ? next.projectId : projectId;
    const si = next.supplierId !== undefined ? next.supplierId : supplierId;
    const cat = next.category !== undefined ? next.category : category;
    if (v) p.set("view", v);
    if (qq.trim()) p.set("q", qq.trim());
    if (s) p.set("sort", s);
    if (per) p.set("period", per);
    if (pi) p.set("projectId", pi);
    if (si) p.set("supplierId", si);
    if (purchaseOrderId) p.set("purchaseOrderId", purchaseOrderId);
    if (cat) p.set("category", cat);
    const qs = p.toString();
    startTransition(() => {
      router.replace(qs ? `/dashboard/depenses?${qs}` : "/dashboard/depenses");
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
      list = list.filter((r) =>
        [
          r.supplierNumber,
          r.supplierName,
          r.projectTitle,
          r.purchaseOrderNumber,
          r.categoryLabel,
          r.notes,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(needle),
      );
    }
    if (projectId) list = list.filter((r) => r.projectId === projectId);
    if (supplierId) list = list.filter((r) => r.supplierId === supplierId);
    if (purchaseOrderId) list = list.filter((r) => r.purchaseOrderId === purchaseOrderId);
    if (category) list = list.filter((r) => r.category === category);

    if (view === "to_control") list = list.filter((r) => r.needsControl);
    else if (view === "with_po") list = list.filter((r) => Boolean(r.purchaseOrderId));
    else if (view === "without_po") list = list.filter((r) => !r.purchaseOrderId && r.status !== "CANCELLED");
    else if (view === "with_variance") {
      list = list.filter((r) => r.varianceHt != null && Math.abs(r.varianceHt) > 0.004);
    } else if (view === "this_month") {
      const now = new Date();
      list = list.filter((r) => {
        const d = new Date(r.invoiceDate + "T12:00:00");
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }

    list.sort((a, b) => {
      switch (sort) {
        case "oldest":
          return a.invoiceDate.localeCompare(b.invoiceDate);
        case "amount_desc":
          return Math.abs(b.signedHt) - Math.abs(a.signedHt);
        case "amount_asc":
          return Math.abs(a.signedHt) - Math.abs(b.signedHt);
        case "supplier":
          return a.supplierName.localeCompare(b.supplierName, "fr");
        case "project":
          return (a.projectTitle ?? "").localeCompare(b.projectTitle ?? "", "fr");
        case "variance":
          return Math.abs(b.varianceHt ?? 0) - Math.abs(a.varianceHt ?? 0);
        case "created":
          return b.createdAt.localeCompare(a.createdAt);
        default:
          return b.invoiceDate.localeCompare(a.invoiceDate) || b.createdAt.localeCompare(a.createdAt);
      }
    });
    return list;
  }, [rows, q, view, sort, projectId, supplierId, purchaseOrderId, category]);

  async function cancel(id: string) {
    if (!window.confirm("Annuler cette facture fournisseur ? Elle sortira du réel.")) {
      return;
    }
    setBusyId(id);
    setError(null);
    setMenuId(null);
    try {
      const res = await fetch(`/api/supplier-invoices/${id}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setRows((prev) =>
        prev.map((r) =>
          r.id === id && data.invoice
            ? {
                ...r,
                status: "CANCELLED",
                statusLabel: "Annulée",
                controlStatus: "cancelled",
                controlLabel: "Annulée",
                needsControl: false,
                inProfitability: false,
              }
            : r,
        ),
      );
      if (drawer?.id === id) setDrawer(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  const treatBanner =
    summary.toControlCount > 0 ||
    summary.unclassifiedCount > 0 ||
    summary.varianceCount > 0;

  const kpiItems = [
    {
      id: "spent",
      value: fmtHt(summary.spentPeriodHt),
      label: "Dépenses période",
      secondary: summary.periodLabel,
      tone: "accent" as const,
      icon: CircleDollarSign,
      onClick: () => {
        setView("this_month");
        pushUrl({ view: "this_month" });
      },
    },
    {
      id: "actual",
      value: fmtHt(summary.actualCostHt),
      label: "Coût réel chantier",
      secondary: "rentabilité",
      tone: "navy" as const,
      icon: Building2,
      onClick: () => {
        setView("all");
        pushUrl({ view: "" });
      },
    },
    {
      id: "control",
      value: String(summary.toControlCount),
      label: "À contrôler",
      secondary: summary.toControlHt > 0 ? fmtHt(summary.toControlHt) : "—",
      tone: "watch" as const,
      icon: ClipboardList,
      onClick: () => {
        setView("to_control");
        pushUrl({ view: "to_control" });
      },
    },
    {
      id: "nopo",
      value: String(summary.withoutPoCount),
      label: "Sans commande",
      secondary: "associée",
      tone: "violet" as const,
      icon: FileWarning,
      onClick: () => {
        setView("without_po");
        pushUrl({ view: "without_po" });
      },
    },
    {
      id: "var",
      value: String(summary.varianceCount),
      label: "Écart commande / facture",
      secondary: "calculable",
      tone: "critical" as const,
      icon: AlertTriangle,
      onClick: () => {
        setView("with_variance");
        pushUrl({ view: "with_variance" });
      },
    },
    {
      id: "sup",
      value: String(summary.supplierCount),
      label: "Fournisseurs",
      secondary: "période",
      tone: "cyan" as const,
      icon: Users,
      onClick: () => undefined,
    },
  ];

  function RowCard({ row }: { row: ExpenseListRow }) {
    const action = primaryAction(row);
    return (
      <li
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[var(--cc-shadow)] transition hover:border-bework-navy/20 hover:shadow-md",
          row.status === "CANCELLED" && "opacity-60",
        )}
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-1",
            row.needsControl && "bg-amber-500",
            row.controlStatus === "coherent" && "bg-emerald-500",
            row.controlStatus === "without_po" && "bg-slate-300",
            row.category === "UNCLASSIFIED" && "bg-slate-400",
            row.controlStatus === "to_verify" &&
              row.varianceHt != null &&
              Math.abs(row.varianceHt) > 500 &&
              "bg-red-500",
          )}
        />
        {/* Desktop */}
        <div
          className="hidden cursor-pointer grid-cols-[minmax(7rem,1.1fr)_minmax(6rem,1fr)_minmax(7rem,1.1fr)_5.5rem_minmax(6rem,1fr)_6.5rem_minmax(6rem,1fr)_5.5rem] items-center gap-3 py-3 pl-5 pr-3 lg:grid"
          onClick={() => setDrawer(row)}
        >
          <div>
            <p className="text-[14px] font-semibold tabular-nums text-bework-ink">
              {row.supplierNumber}
            </p>
            <p className="text-[12px] text-slate-500">{fmtDate(row.invoiceDate)}</p>
            <span className="mt-0.5 inline-block text-[11px] text-slate-500">
              {row.statusLabel}
              {row.kind === "CREDIT" ? " · Avoir" : ""}
            </span>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            {canOpenSupplier ? (
              <Link
                href={`/dashboard/fournisseurs/${row.supplierId}`}
                className="text-[14px] font-medium text-bework-intel hover:underline"
              >
                {row.supplierName}
              </Link>
            ) : (
              <p className="text-[14px] font-medium text-slate-800">{row.supplierName}</p>
            )}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <Link
              href={`/dashboard/projets/${row.projectId}`}
              className="text-[14px] font-medium text-bework-navy hover:underline"
            >
              {row.projectTitle ?? "—"}
            </Link>
            {row.projectCity ? (
              <p className="text-[12px] text-slate-500">{row.projectCity}</p>
            ) : null}
          </div>
          <div>
            <span
              className={cn(
                "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                categoryBadgeClass(row.category),
              )}
            >
              {row.categoryLabel}
            </span>
          </div>
          <div>
            {row.purchaseOrderNumber ? (
              <>
                <p className="text-[13px] font-medium tabular-nums text-sky-900">
                  {row.purchaseOrderNumber}
                </p>
                {row.orderedQty > 0 ? (
                  <p className="text-[12px] text-cyan-800">
                    {row.fullyReceived
                      ? "Réception complète"
                      : `${Math.round(row.receivedQty)} / ${Math.round(row.orderedQty)} reçus`}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-[13px] text-slate-500">Sans commande</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[16px] font-semibold tabular-nums text-bework-navy">
              {fmtHt(row.signedHt)}
            </p>
            <p className="text-[11px] text-slate-500">
              HT
              {row.amountTtc > 0.004 ? ` · ${fmtHt(row.amountTtc)} TTC` : ""}
            </p>
          </div>
          <div>
            <p className={cn("text-[13px] font-semibold", controlTone(row))}>
              {row.controlLabel}
            </p>
            {row.inProfitability ? (
              <p className="text-[11px] text-emerald-700">Pris en compte</p>
            ) : row.status === "RECORDED" ? (
              <p className="text-[11px] text-slate-500">Catégorie à définir</p>
            ) : null}
          </div>
          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
            {action.href ? (
              <Link
                href={action.href}
                className="rounded-full bg-[#1e3a5f] px-3 py-1 text-[12px] font-medium text-white"
              >
                {action.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setDrawer(row)}
                className="rounded-full border border-slate-200 px-3 py-1 text-[12px] font-medium"
              >
                {action.label}
              </button>
            )}
            <div className="relative">
              <button
                type="button"
                className="rounded-full px-2 py-1 text-slate-400 hover:bg-slate-50"
                onClick={() => setMenuId(menuId === row.id ? null : row.id)}
                aria-label="Actions"
              >
                …
              </button>
              {menuId === row.id ? (
                <div className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 text-[13px] shadow-lg">
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                    onClick={() => {
                      setDrawer(row);
                      setMenuId(null);
                    }}
                  >
                    Voir le détail
                  </button>
                  <Link
                    href={row.profitabilityHref}
                    className="block px-3 py-2 hover:bg-slate-50"
                    onClick={() => setMenuId(null)}
                  >
                    Rentabilité
                  </Link>
                  {row.status === "RECORDED" ? (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      className="block w-full px-3 py-2 text-left text-red-700 hover:bg-red-50 disabled:opacity-50"
                      onClick={() => void cancel(row.id)}
                    >
                      Annuler
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="space-y-2 p-4 pl-5 lg:hidden" onClick={() => setDrawer(row)}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[15px] font-semibold tabular-nums">{row.supplierNumber}</p>
              <p className="text-[12px] font-semibold uppercase tracking-wide text-bework-intel">
                {row.supplierName}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                categoryBadgeClass(row.category),
              )}
            >
              {row.categoryLabel}
            </span>
          </div>
          <p className="text-[13px] text-slate-600">{row.projectTitle ?? "—"}</p>
          <p className="text-[17px] font-semibold tabular-nums text-bework-navy">
            {fmtHt(row.signedHt)} HT
          </p>
          {row.purchaseOrderNumber ? (
            <p className="text-[13px] text-slate-700">
              Commande {row.purchaseOrderNumber}
              {row.varianceHt != null && Math.abs(row.varianceHt) > 0.004
                ? ` · Écart ${row.varianceHt > 0 ? "+" : ""}${fmtHt(row.varianceHt)}`
                : ""}
            </p>
          ) : (
            <p className="text-[13px] text-slate-500">Sans commande</p>
          )}
          <p className={cn("text-[13px] font-semibold", controlTone(row))}>{row.controlLabel}</p>
        </div>
      </li>
    );
  }

  return (
    <div className={cn("mx-auto max-w-[1440px] space-y-5", pending && "opacity-80")}>
      <PageHeader
        title="Dépenses"
        description="Suivez vos factures fournisseurs et les coûts réels de vos chantiers."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/depenses/nouvelle"
              className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
            >
              + Enregistrer une dépense
            </Link>
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-full border border-bework-navy/15 bg-white px-3 py-2 text-[13px] font-medium text-bework-navy">
                Actions
              </summary>
              <div className="absolute right-0 z-20 mt-1 w-60 rounded-xl border border-slate-200 bg-white py-1 text-[13px] shadow-lg">
                <Link href="/dashboard/depenses/nouvelle" className="block px-3 py-2 hover:bg-slate-50">
                  Enregistrer une facture fournisseur
                </Link>
                <Link
                  href="/dashboard/depenses/nouvelle?associate=1"
                  className="block px-3 py-2 hover:bg-slate-50"
                >
                  Associer une facture à une commande
                </Link>
                <Link href="/dashboard/documents" className="block px-3 py-2 hover:bg-slate-50">
                  Voir dans Documents
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
            {summary.toControlCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setView("to_control");
                  pushUrl({ view: "to_control" });
                }}
                className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-900"
              >
                {summary.toControlCount} contrôle
                {summary.toControlCount > 1 ? "s" : ""} achat
              </button>
            ) : null}
            {summary.unclassifiedCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setCategory("UNCLASSIFIED");
                  setView("all");
                  pushUrl({ category: "UNCLASSIFIED", view: "" });
                }}
                className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700"
              >
                {summary.unclassifiedCount} à classer
              </button>
            ) : null}
            {summary.varianceCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setView("with_variance");
                  pushUrl({ view: "with_variance" });
                }}
                className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-800"
              >
                {summary.varianceCount} écart
                {summary.varianceCount > 1 ? "s" : ""} commande / facture
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-[13px] font-medium text-emerald-700">
          ✓ Aucun écart à contrôler · Toutes les dépenses sont sous contrôle
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

      {(summary.categoryShares.length > 1 || summary.topProjects.length > 1) && (
        <div className="grid gap-3 lg:grid-cols-2">
          {summary.categoryShares.length > 1 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
              <p className="text-[12px] font-semibold text-bework-navy">Répartition des dépenses</p>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-100">
                {summary.categoryShares.map((c) => (
                  <div
                    key={c.key}
                    title={`${c.label} ${c.pct}%`}
                    className={cn(
                      c.key === "MATERIAL" && "bg-amber-400",
                      c.key === "EQUIPMENT" && "bg-sky-400",
                      c.key === "SUBCONTRACT" && "bg-violet-400",
                      c.key === "OTHER" && "bg-slate-400",
                      c.key === "UNCLASSIFIED" && "bg-slate-300",
                    )}
                    style={{ width: `${Math.max(c.pct, 2)}%` }}
                  />
                ))}
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-slate-600">
                {summary.categoryShares.map((c) => (
                  <li key={c.key}>
                    {c.label} {c.pct}%
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {summary.topProjects.length > 1 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3">
              <p className="text-[12px] font-semibold text-bework-navy">
                Principaux chantiers · {summary.periodLabel}
              </p>
              <ul className="mt-2 space-y-1.5">
                {summary.topProjects.map((p) => (
                  <li key={p.projectId} className="flex justify-between gap-2 text-[13px]">
                    <Link
                      href={`/dashboard/depenses?projectId=${p.projectId}`}
                      className="truncate font-medium text-bework-navy hover:underline"
                    >
                      {p.title}
                    </Link>
                    <span className="shrink-0 tabular-nums text-slate-700">{fmtHt(p.ht)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <div className="sticky top-14 z-20 space-y-2 bg-[linear-gradient(180deg,#f8fafc_75%,rgba(248,250,252,0.8))] py-2">
        <div className="flex flex-wrap gap-1 rounded-full border border-slate-200 bg-white p-0.5">
          {(
            [
              ["all", "Toutes"],
              ["to_control", "À contrôler"],
              ["with_po", "Avec commande"],
              ["without_po", "Sans commande"],
              ["with_variance", "Avec écart"],
              ["this_month", "Ce mois"],
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
            placeholder="Rechercher une facture, fournisseur, chantier, commande, référence…"
            className="min-w-[14rem] flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] outline-none focus:border-bework-accent/40"
          />
          <select
            value={period}
            onChange={(e) => {
              const p = e.target.value as ExpensesPeriod;
              setPeriod(p);
              pushUrl({ period: p === "month" ? "" : p });
              startTransition(() => router.refresh());
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px]"
          >
            <option value="month">Ce mois</option>
            <option value="prev_month">Mois précédent</option>
            <option value="quarter">Trimestre</option>
            <option value="year">Année</option>
            <option value="all">Toutes périodes</option>
          </select>
          <select
            value={sort}
            onChange={(e) => {
              const s = e.target.value as ExpensesSort;
              setSort(s);
              pushUrl({ sort: s === "recent" ? "" : s });
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px]"
          >
            <option value="recent">Plus récentes</option>
            <option value="oldest">Plus anciennes</option>
            <option value="amount_desc">Montant décroissant</option>
            <option value="amount_asc">Montant croissant</option>
            <option value="supplier">Fournisseur</option>
            <option value="project">Chantier</option>
            <option value="variance">Écart le plus important</option>
            <option value="created">Dernières enregistrées</option>
          </select>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium"
          >
            Filtres
          </button>
        </div>
        {filtersOpen ? (
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["", "Toutes catégories"],
                ["MATERIAL", SUPPLIER_INVOICE_CATEGORY_LABELS.MATERIAL],
                ["EQUIPMENT", "Matériel"],
                ["SUBCONTRACT", SUPPLIER_INVOICE_CATEGORY_LABELS.SUBCONTRACT],
                ["OTHER", SUPPLIER_INVOICE_CATEGORY_LABELS.OTHER],
                ["UNCLASSIFIED", "À classer"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id || "all-cat"}
                type="button"
                onClick={() => {
                  setCategory(id);
                  pushUrl({ category: id });
                }}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  category === id ? "bg-[#1e3a5f] text-white" : "bg-slate-100 text-slate-600",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
        {(projectId || supplierId || purchaseOrderId || category) && (
          <div className="flex flex-wrap gap-1.5">
            {projectId ? (
              <button
                type="button"
                onClick={() => {
                  setProjectId("");
                  pushUrl({ projectId: "" });
                }}
                className="rounded-full bg-bework-soft-navy px-2.5 py-1 text-[12px] font-medium"
              >
                Chantier ×
              </button>
            ) : null}
            {supplierId ? (
              <button
                type="button"
                onClick={() => {
                  setSupplierId("");
                  pushUrl({ supplierId: "" });
                }}
                className="rounded-full bg-bework-soft-violet px-2.5 py-1 text-[12px] font-medium"
              >
                Fournisseur ×
              </button>
            ) : null}
            {category ? (
              <button
                type="button"
                onClick={() => {
                  setCategory("");
                  pushUrl({ category: "" });
                }}
                className="rounded-full bg-bework-soft-watch px-2.5 py-1 text-[12px] font-medium"
              >
                Catégorie ×
              </button>
            ) : null}
          </div>
        )}
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center">
          <p className="text-sm font-semibold text-slate-900">Aucune dépense pour le moment.</p>
          <Link
            href="/dashboard/depenses/nouvelle"
            className="mt-4 inline-flex rounded-full bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white"
          >
            + Enregistrer une dépense
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
          Aucune facture dans ce filtre.
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((row) => (
            <RowCard key={row.id} row={row} />
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
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[18px] font-semibold text-bework-ink">
                  {drawer.supplierNumber}
                </p>
                <p className="text-[13px] font-semibold uppercase tracking-wide text-bework-intel">
                  {drawer.supplierName}
                </p>
                <p className="mt-1 text-[12px] text-slate-500">{drawer.statusLabel}</p>
              </div>
              <button type="button" onClick={() => setDrawer(null)} className="text-slate-400" aria-label="Fermer">
                ×
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Montant HT</dt>
                <dd className="font-semibold tabular-nums">{fmtHt(drawer.signedHt)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">TVA</dt>
                <dd className="tabular-nums">{fmtHt(drawer.amountVat)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">TTC</dt>
                <dd className="tabular-nums">{fmtHt(drawer.amountTtc)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Date</dt>
                <dd>{fmtDate(drawer.invoiceDate)}</dd>
              </div>
            </dl>

            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3 text-[13px]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Chantier
              </p>
              <p className="font-medium text-slate-900">{drawer.projectTitle ?? "—"}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Catégorie
              </p>
              <p className="font-medium">{drawer.categoryLabel}</p>
            </div>

            <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/40 px-3 py-3">
              <p className="text-[12px] font-semibold text-bework-navy">Contrôle achat</p>
              <div className="mt-3 space-y-2 text-[13px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-slate-600">
                    <ShoppingCart className="h-3.5 w-3.5" /> Commande
                  </span>
                  <span className="tabular-nums font-medium">
                    {drawer.orderAmountHt != null ? fmtHt(drawer.orderAmountHt) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Réception</span>
                  <span className="tabular-nums font-medium">
                    {drawer.purchaseOrderId
                      ? drawer.fullyReceived
                        ? "Réception complète"
                        : drawer.hasReceipt
                          ? `${Math.round(drawer.receivedQty)} / ${Math.round(drawer.orderedQty)} reçus`
                          : "Aucune"
                      : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-600">Facture</span>
                  <span className="tabular-nums font-semibold">{fmtHt(drawer.signedHt)}</span>
                </div>
                {drawer.varianceHt != null ? (
                  <div className="flex items-center justify-between gap-2 border-t border-sky-100 pt-2">
                    <span className="text-slate-600">Écart</span>
                    <span className={cn("tabular-nums font-semibold", controlTone(drawer))}>
                      {drawer.varianceHt > 0 ? "+" : ""}
                      {fmtHt(drawer.varianceHt)}
                      {drawer.variancePercent != null
                        ? ` (${drawer.variancePercent > 0 ? "+" : ""}${drawer.variancePercent} %)`
                        : ""}
                    </span>
                  </div>
                ) : null}
                <p className={cn("pt-1 font-semibold", controlTone(drawer))}>
                  {drawer.controlLabel}
                </p>
              </div>
            </div>

            {drawer.purchaseOrderId && drawer.orderAmountHt != null ? (
              <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                <div className="rounded-xl border border-slate-100 px-3 py-2">
                  <p className="text-[11px] text-slate-400">Engagé</p>
                  <p className="font-semibold tabular-nums">{fmtHt(drawer.orderAmountHt)}</p>
                </div>
                <div className="rounded-xl border border-slate-100 px-3 py-2">
                  <p className="text-[11px] text-slate-400">Réel</p>
                  <p className="font-semibold tabular-nums">{fmtHt(drawer.signedHt)}</p>
                </div>
              </div>
            ) : null}

            <div className="mt-4 text-[13px]">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Impact rentabilité
              </p>
              {drawer.inProfitability ? (
                <p className="mt-1 text-emerald-700">
                  Pris en compte · {drawer.categoryLabel} · {fmtHt(drawer.signedHt)} HT
                </p>
              ) : (
                <p className="mt-1 text-amber-800">Catégorie à définir pour un suivi propre</p>
              )}
            </div>

            {drawer.hasBl ? (
              <p className="mt-3 text-[12px] text-cyan-800">
                {drawer.blCount} bon{drawer.blCount > 1 ? "s" : ""} de livraison lié
                {drawer.blCount > 1 ? "s" : ""} à la commande
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2">
              {drawer.purchaseOrderHref ? (
                <Link
                  href={drawer.purchaseOrderHref}
                  className="rounded-full bg-[#1e3a5f] px-4 py-2.5 text-center text-[13px] font-medium text-white"
                >
                  Voir la commande
                </Link>
              ) : null}
              <Link
                href={drawer.profitabilityHref}
                className="rounded-full border border-slate-200 px-4 py-2 text-center text-[13px] font-medium"
              >
                Voir dans Rentabilité
              </Link>
              <Link
                href={`/dashboard/projets/${drawer.projectId}`}
                className="text-center text-[13px] font-medium text-bework-navy hover:underline"
              >
                Voir le chantier
              </Link>
              {canOpenSupplier ? (
                <Link
                  href={`/dashboard/fournisseurs/${drawer.supplierId}`}
                  className="text-center text-[13px] font-medium text-bework-navy hover:underline"
                >
                  Voir le fournisseur
                </Link>
              ) : null}
              <Link
                href={drawer.documentsHref}
                className="text-center text-[13px] font-medium text-bework-navy hover:underline"
              >
                Voir dans Documents
              </Link>
              {drawer.status === "RECORDED" ? (
                <button
                  type="button"
                  disabled={busyId === drawer.id}
                  onClick={() => void cancel(drawer.id)}
                  className="mt-2 text-center text-[12px] font-medium text-red-700 disabled:opacity-50"
                >
                  Annuler la facture
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
