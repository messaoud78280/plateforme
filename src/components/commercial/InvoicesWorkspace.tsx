"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ClipboardList,
  FileText,
  Filter,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  COMMERCIAL_INVOICE_STATUS_LABELS,
  COMMERCIAL_INVOICE_TYPE_LABELS,
} from "@/lib/commercial/money";
import { fmtDate, fmtMoney } from "@/components/commercial/dashboard/format";
import {
  badgeClassForTone,
  FACTURE_STATUS_TONE,
} from "@/lib/design-system/semantic-colors";
import type {
  InvoiceListItem,
  InvoicesSort,
  InvoicesViewFilter,
  InvoicesWorkspaceKpis,
} from "@/lib/commercial/invoices-workspace";

const VIEWS: { id: InvoicesViewFilter; label: string; countKey?: keyof InvoicesWorkspaceKpis }[] = [
  { id: "all", label: "Toutes" },
  { id: "drafts", label: "Brouillons", countKey: "draftCount" },
  { id: "to_issue", label: "À émettre", countKey: "toFinalizeCount" },
  { id: "issued", label: "Émises" },
  { id: "partial", label: "Partiellement encaissées", countKey: "partialCount" },
  { id: "paid", label: "Encaissées" },
  { id: "overdue", label: "En retard", countKey: "overdueCount" },
];

const SORTS: { id: InvoicesSort; label: string }[] = [
  { id: "recent", label: "Plus récentes" },
  { id: "oldest", label: "Plus anciennes" },
  { id: "due_asc", label: "Échéance la plus proche" },
  { id: "amount_desc", label: "Montant décroissant" },
  { id: "amount_asc", label: "Montant croissant" },
  { id: "due_amount_desc", label: "Reste à encaisser décroissant" },
  { id: "client_az", label: "Client A–Z" },
];

function fmtEur(n: number, digits = 2) {
  return `${fmtMoney(n, digits)} €`;
}

function dueBadge(inv: InvoiceListItem) {
  if (inv.status === "PAID" || inv.amountDue <= 0.004) return null;
  if (inv.daysLate > 0) {
    return {
      label: `${inv.daysLate} j de retard`,
      className: "text-bework-critical font-semibold",
    };
  }
  if (inv.daysUntilDue != null && inv.daysUntilDue <= 7) {
    return {
      label:
        inv.daysUntilDue === 0
          ? "Échéance aujourd’hui"
          : `Dans ${inv.daysUntilDue} j`,
      className: "text-[#b45309] font-semibold",
    };
  }
  if (inv.daysUntilDue != null) {
    return {
      label: `Échéance dans ${inv.daysUntilDue} jours`,
      className: "text-slate-500",
    };
  }
  return null;
}

function primaryAction(inv: InvoiceListItem): { label: string; href?: string; kind: string } {
  if (inv.status === "DRAFT") {
    return { label: "Finaliser", href: `/dashboard/devis-facturation/factures/${inv.id}`, kind: "finalize" };
  }
  if (inv.status === "OVERDUE" && inv.amountDue > 0.004) {
    return { label: "Relancer", kind: "remind" };
  }
  if (
    (inv.status === "ISSUED" || inv.status === "PARTIALLY_PAID" || inv.status === "OVERDUE") &&
    inv.amountDue > 0.004
  ) {
    return {
      label: "Enregistrer un paiement",
      href: `/dashboard/devis-facturation/factures/${inv.id}#paiement`,
      kind: "pay",
    };
  }
  return { label: "Voir", href: `/dashboard/devis-facturation/factures/${inv.id}`, kind: "view" };
}

function PaymentBar({ paid, total }: { paid: number; total: number }) {
  const pct = total > 0.004 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  return (
    <div className="mt-1.5 h-1.5 w-full max-w-[9rem] overflow-hidden rounded-full bg-slate-100">
      <div
        className={cn(
          "h-full rounded-full transition-[width]",
          pct >= 100 ? "bg-bework-ok" : pct > 0 ? "bg-bework-watch" : "bg-slate-200",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function InvoicesWorkspace({
  initialInvoices,
  kpis,
  initialView = "all",
  initialQ = "",
  initialSort = "recent",
  initialQuoteId = "",
  initialProjectId = "",
  initialClientId = "",
  initialPayment = "",
}: {
  initialInvoices: InvoiceListItem[];
  kpis: InvoicesWorkspaceKpis;
  initialView?: InvoicesViewFilter;
  initialQ?: string;
  initialSort?: InvoicesSort;
  initialQuoteId?: string;
  initialProjectId?: string;
  initialClientId?: string;
  initialPayment?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [kpiState, setKpiState] = useState(kpis);
  const [view, setView] = useState<InvoicesViewFilter>(initialView);
  const [q, setQ] = useState(initialQ);
  const [sort, setSort] = useState<InvoicesSort>(initialSort);
  const [quoteId, setQuoteId] = useState(initialQuoteId);
  const [projectId, setProjectId] = useState(initialProjectId);
  const [clientId, setClientId] = useState(initialClientId);
  const [payment, setPayment] = useState(initialPayment);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [type, setType] = useState("");
  const [drawer, setDrawer] = useState<InvoiceListItem | null>(null);
  const [drawerPayments, setDrawerPayments] = useState<
    Array<{ id: string; amount: number; paidAt: string; method: string; cancelledAt?: string | null }>
  >([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function pushUrl(next: Record<string, string>) {
    const p = new URLSearchParams();
    const v = next.view ?? (view === "all" ? "" : view);
    const qq = next.q !== undefined ? next.q : q;
    const s = next.sort ?? (sort === "recent" ? "" : sort);
    const qi = next.quoteId !== undefined ? next.quoteId : quoteId;
    const pi = next.projectId !== undefined ? next.projectId : projectId;
    const ci = next.clientId !== undefined ? next.clientId : clientId;
    const pay = next.payment !== undefined ? next.payment : payment;
    const t = next.type !== undefined ? next.type : type;
    if (v) p.set("view", v);
    if (qq.trim()) p.set("q", qq.trim());
    if (s) p.set("sort", s);
    if (qi) p.set("quoteId", qi);
    if (pi) p.set("projectId", pi);
    if (ci) p.set("clientId", ci);
    if (pay) p.set("payment", pay);
    if (t) p.set("type", t);
    const qs = p.toString();
    startTransition(() => {
      router.replace(
        qs
          ? `/dashboard/devis-facturation/factures?${qs}`
          : "/dashboard/devis-facturation/factures",
      );
    });
  }

  async function reload(overrides?: Record<string, string>) {
    const params = new URLSearchParams();
    params.set("workspace", "1");
    const v = overrides?.view ?? (view === "all" ? "" : view);
    const qq = overrides?.q ?? q;
    const s = overrides?.sort ?? (sort === "recent" ? "" : sort);
    const qi = overrides?.quoteId ?? quoteId;
    const pi = overrides?.projectId ?? projectId;
    const ci = overrides?.clientId ?? clientId;
    const pay = overrides?.payment ?? payment;
    const t = overrides?.type ?? type;
    if (v) params.set("view", v);
    if (qq.trim()) params.set("q", qq.trim());
    if (s) params.set("sort", s);
    if (qi) params.set("quoteId", qi);
    if (pi) params.set("projectId", pi);
    if (ci) params.set("clientId", ci);
    if (pay) params.set("payment", pay);
    if (t) params.set("type", t);
    const res = await fetch(`/api/commercial/invoices?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setInvoices(data.invoices ?? []);
    if (data.kpis) setKpiState(data.kpis);
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      void reload({ q });
      pushUrl({ q });
    }, 280);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    if (!drawer) {
      setDrawerPayments([]);
      return;
    }
    void fetch(`/api/commercial/invoices/${drawer.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.invoice?.payments) return;
        setDrawerPayments(
          (data.invoice.payments as Array<{
            id: string;
            amount: number;
            paidAt: string;
            method: string;
            cancelledAt?: string | null;
          }>).filter((p) => !p.cancelledAt),
        );
      })
      .catch(() => undefined);
  }, [drawer]);

  const chips = useMemo(() => {
    const out: { key: string; label: string; clear: () => void }[] = [];
    if (view !== "all") {
      out.push({
        key: "view",
        label: VIEWS.find((v) => v.id === view)?.label ?? view,
        clear: () => {
          setView("all");
          pushUrl({ view: "" });
          void reload({ view: "" });
        },
      });
    }
    if (payment) {
      out.push({
        key: "payment",
        label:
          payment === "open"
            ? "Reste à encaisser"
            : payment === "partial"
              ? "Partiellement encaissée"
              : payment === "paid"
                ? "Payée"
                : "Non payée",
        clear: () => {
          setPayment("");
          pushUrl({ payment: "" });
          void reload({ payment: "" });
        },
      });
    }
    if (type) {
      out.push({
        key: "type",
        label: COMMERCIAL_INVOICE_TYPE_LABELS[type] ?? type,
        clear: () => {
          setType("");
          pushUrl({ type: "" });
          void reload({ type: "" });
        },
      });
    }
    if (quoteId) {
      out.push({
        key: "quote",
        label: `Devis ${invoices.find((i) => i.quoteId === quoteId)?.quoteNumber ?? quoteId.slice(0, 8)}`,
        clear: () => {
          setQuoteId("");
          pushUrl({ quoteId: "" });
          void reload({ quoteId: "" });
        },
      });
    }
    if (projectId) {
      out.push({
        key: "project",
        label: invoices.find((i) => i.projectId === projectId)?.projectTitle ?? "Chantier",
        clear: () => {
          setProjectId("");
          pushUrl({ projectId: "" });
          void reload({ projectId: "" });
        },
      });
    }
    if (clientId) {
      out.push({
        key: "client",
        label: invoices.find((i) => i.clientId === clientId)?.clientName ?? "Client",
        clear: () => {
          setClientId("");
          pushUrl({ clientId: "" });
          void reload({ clientId: "" });
        },
      });
    }
    return out;
  }, [view, payment, type, quoteId, projectId, clientId, invoices]);

  async function remind(id: string) {
    if (!confirm("Marquer cette facture comme relancée ?")) return;
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/commercial/invoices/${id}/remind`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "MANUEL" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      await reload();
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  async function issue(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/commercial/invoices/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "issue" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      await reload();
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  function applyView(id: InvoicesViewFilter) {
    setView(id);
    pushUrl({ view: id === "all" ? "" : id });
    void reload({ view: id === "all" ? "" : id });
  }

  function onPrimary(inv: InvoiceListItem, e: React.MouseEvent) {
    e.stopPropagation();
    const a = primaryAction(inv);
    if (a.kind === "remind") {
      void remind(inv.id);
      return;
    }
    if (a.href) router.push(a.href);
  }

  const kpiItems = [
    {
      id: "billed",
      value: fmtEur(kpiState.billedMonthHt, 0),
      label: "Facturé ce mois",
      secondary: "HT",
      tone: "accent" as const,
      icon: FileText,
      onClick: () => applyView("issued"),
    },
    {
      id: "collected",
      value: fmtEur(kpiState.collectedMonthTtc, 0),
      label: "Encaissé ce mois",
      secondary: "TTC",
      tone: "ok" as const,
      icon: Banknote,
      onClick: () => applyView("paid"),
    },
    {
      id: "outstanding",
      value: fmtEur(kpiState.outstandingTtc, 0),
      label: "Reste à encaisser",
      secondary: `${kpiState.openCount} ouverte${kpiState.openCount > 1 ? "s" : ""}`,
      tone: "cyan" as const,
      icon: Wallet,
      onClick: () => {
        setPayment("open");
        setView("open");
        pushUrl({ view: "open", payment: "open" });
        void reload({ view: "open", payment: "open" });
      },
    },
    {
      id: "overdue",
      value: fmtEur(kpiState.overdueTtc, 0),
      label: "En retard",
      secondary: `${kpiState.overdueCount} facture${kpiState.overdueCount > 1 ? "s" : ""}`,
      tone: "critical" as const,
      icon: AlertTriangle,
      onClick: () => applyView("overdue"),
    },
    {
      id: "open",
      value: String(kpiState.openCount),
      label: "Factures ouvertes",
      secondary: "à encaisser",
      tone: "navy" as const,
      icon: ClipboardList,
      onClick: () => applyView("open"),
    },
    {
      id: "drafts",
      value: String(kpiState.draftCount),
      label: "Brouillons",
      secondary: "à finaliser",
      tone: "neutral" as const,
      icon: CheckCircle2,
      onClick: () => applyView("drafts"),
    },
  ];

  const treat =
    kpiState.toFinalizeCount > 0 ||
    kpiState.dueSoonCount > 0 ||
    kpiState.overdueCount > 0 ||
    kpiState.partialCount > 0;

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <PageHeader
        title="Factures"
        description="Suivez vos factures, échéances et encaissements clients."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard/devis-facturation/factures/preparer"
              className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
            >
              + Préparer une facture
            </Link>
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-full border border-bework-navy/15 bg-white px-3 py-2 text-[13px] font-medium text-bework-navy">
                Actions
              </summary>
              <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1 text-[13px] shadow-lg">
                <Link
                  href="/dashboard/devis-facturation/factures/preparer"
                  className="block px-3 py-2 hover:bg-slate-50"
                >
                  Préparer une facture
                </Link>
                <Link
                  href="/dashboard/devis-facturation/encaissements"
                  className="block px-3 py-2 hover:bg-slate-50"
                >
                  Enregistrer un paiement
                </Link>
                <Link
                  href="/dashboard/devis-facturation/situations"
                  className="block px-3 py-2 hover:bg-slate-50"
                >
                  Créer une situation
                </Link>
              </div>
            </details>
          </div>
        }
      />

      {treat ? (
        <div className="rounded-2xl border border-bework-navy/10 bg-white px-4 py-3">
          <p className="text-[13px] font-semibold text-bework-navy">À traiter</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[13px]">
            {kpiState.toFinalizeCount > 0 ? (
              <button
                type="button"
                onClick={() => applyView("drafts")}
                className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700"
              >
                {kpiState.toFinalizeCount} facture{kpiState.toFinalizeCount > 1 ? "s" : ""} à finaliser
              </button>
            ) : null}
            {kpiState.dueSoonCount > 0 ? (
              <button
                type="button"
                onClick={() => applyView("open")}
                className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-800"
              >
                {kpiState.dueSoonCount} échéance{kpiState.dueSoonCount > 1 ? "s" : ""} dans moins de 7 jours
              </button>
            ) : null}
            {kpiState.overdueCount > 0 ? (
              <button
                type="button"
                onClick={() => applyView("overdue")}
                className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-800"
              >
                {kpiState.overdueCount} facture{kpiState.overdueCount > 1 ? "s" : ""} en retard
              </button>
            ) : null}
            {kpiState.partialCount > 0 ? (
              <button
                type="button"
                onClick={() => applyView("partial")}
                className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-800"
              >
                {kpiState.partialCount} paiement{kpiState.partialCount > 1 ? "s" : ""} partiel{kpiState.partialCount > 1 ? "s" : ""}
              </button>
            ) : null}
          </div>
        </div>
      ) : kpiState.overdueCount === 0 ? (
        <p className="text-[13px] font-medium text-emerald-700">✓ Aucun impayé · Toutes les échéances sont à jour</p>
      ) : null}

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
                k.tone === "ok" && "border-bework-ok/20 bg-bework-soft-ok/60",
                k.tone === "critical" && "border-bework-critical/25 bg-bework-soft-critical/60",
                k.tone === "cyan" && "border-bework-cyan/20 bg-bework-soft-cyan/60",
                k.tone === "accent" && "border-bework-accent/20 bg-bework-soft-accent/70",
                k.tone === "navy" && "border-bework-navy/10 bg-bework-soft-navy/50",
                k.tone === "neutral" && "border-slate-200 bg-slate-50/80",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[1.15rem] font-semibold tabular-nums leading-tight text-bework-navy">
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

      <div className="sticky top-14 z-20 -mx-1 space-y-2 bg-[linear-gradient(180deg,#f8fafc_75%,rgba(248,250,252,0.8))] px-1 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une facture, client, chantier, référence…"
            className="min-w-[14rem] flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] outline-none focus:border-bework-accent/40"
          />
          <select
            value={sort}
            onChange={(e) => {
              const s = e.target.value as InvoicesSort;
              setSort(s);
              pushUrl({ sort: s === "recent" ? "" : s });
              void reload({ sort: s === "recent" ? "" : s });
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px]"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700"
          >
            <Filter className="h-3.5 w-3.5" />
            Filtres
          </button>
        </div>
        {filtersOpen ? (
          <div className="flex flex-wrap gap-2 rounded-xl border border-bework-navy/10 bg-white p-3">
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                pushUrl({ type: e.target.value });
                void reload({ type: e.target.value });
              }}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-[12px]"
            >
              <option value="">Tous types</option>
              {Object.entries(COMMERCIAL_INVOICE_TYPE_LABELS).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={payment}
              onChange={(e) => {
                setPayment(e.target.value);
                pushUrl({ payment: e.target.value });
                void reload({ payment: e.target.value });
              }}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-[12px]"
            >
              <option value="">Encaissement — tous</option>
              <option value="unpaid">Non payée</option>
              <option value="partial">Partiellement payée</option>
              <option value="paid">Payée</option>
              <option value="open">Reste dû</option>
            </select>
          </div>
        ) : null}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {VIEWS.map((f) => {
            const count = f.countKey ? kpiState[f.countKey] : null;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => applyView(f.id)}
                className={cn(
                  "bw-chip shrink-0",
                  view === f.id ? "bw-chip-active" : "bw-chip-idle",
                )}
              >
                {f.label}
                {typeof count === "number" && count > 0 ? ` ${count}` : ""}
              </button>
            );
          })}
        </div>
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.clear}
                className="inline-flex items-center gap-1 rounded-full bg-bework-soft-navy px-2.5 py-1 text-[12px] font-medium text-slate-700"
              >
                {c.label} <span className="text-slate-400">×</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {message ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{message}</p>
      ) : null}

      <div className={cn(pending && "opacity-70")}>
        {/* Desktop */}
        <ul className="hidden space-y-2 lg:block">
          {invoices.map((inv) => {
            const due = dueBadge(inv);
            const action = primaryAction(inv);
            const rowBg =
              inv.status === "OVERDUE" || inv.daysLate > 0
                ? "border-bework-critical/20 bg-bework-soft-critical/30"
                : inv.status === "PARTIALLY_PAID"
                  ? "border-bework-watch/20 bg-bework-soft-watch/40"
                  : inv.status === "PAID"
                    ? "border-bework-ok/15 bg-bework-soft-ok/30"
                    : inv.status === "DRAFT"
                      ? "border-slate-200 bg-slate-50/80"
                      : "border-bework-navy/10 bg-white";
            const barTone =
              inv.status === "OVERDUE" || inv.daysLate > 0
                ? "bg-bework-critical"
                : inv.status === "PARTIALLY_PAID"
                  ? "bg-bework-watch"
                  : inv.status === "PAID"
                    ? "bg-bework-ok"
                    : inv.status === "DRAFT"
                      ? "bg-slate-300"
                      : "bg-bework-accent";
            return (
              <li key={inv.id} className={cn("relative overflow-hidden rounded-2xl border", rowBg)}>
                <span className={cn("absolute inset-y-0 left-0 w-[3px]", barTone)} aria-hidden />
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setDrawer(inv)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setDrawer(inv);
                  }}
                  className="grid cursor-pointer grid-cols-[minmax(0,1.1fr)_minmax(0,1.2fr)_minmax(0,0.9fr)_minmax(0,0.8fr)_minmax(0,1.1fr)_auto_auto] items-center gap-3 px-4 py-3 pl-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-bework-ink">{inv.number}</p>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      {inv.originLabel}
                      {inv.marketCumulativePercent != null
                        ? ` · Cumul marché ${inv.marketCumulativePercent} %`
                        : ""}
                    </p>
                    {inv.quoteNumber ? (
                      <p className="text-[11px] text-bework-intel">{inv.quoteNumber}</p>
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-slate-800">
                      {inv.clientName || (inv.status === "DRAFT" ? "Client à renseigner" : "—")}
                    </p>
                    <p className="truncate text-[13px] text-slate-500">
                      {inv.projectTitle || "—"}
                    </p>
                  </div>
                  <div className="text-[13px]">
                    <p className="text-slate-700">{fmtDate(inv.issueDate)}</p>
                    <p className="text-slate-500">
                      Échéance {inv.dueDate ? fmtDate(inv.dueDate) : "—"}
                    </p>
                    {due ? <p className={cn("text-[12px]", due.className)}>{due.label}</p> : null}
                  </div>
                  <div className="text-right">
                    <p className="text-[16px] font-semibold tabular-nums text-bework-navy">
                      {fmtEur(inv.totalTtc)}
                    </p>
                    <p className="text-[11px] tabular-nums text-slate-500">{fmtEur(inv.totalHt)} HT</p>
                  </div>
                  <div>
                    {inv.status === "PAID" || inv.amountDue <= 0.004 ? (
                      <>
                        <p className="text-[13px] font-semibold tabular-nums text-bework-ok">
                          {fmtEur(inv.amountPaid)} encaissés
                        </p>
                        <p className="text-[12px] text-emerald-700">✓ Soldée</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[13px] font-medium tabular-nums text-slate-700">
                          {fmtEur(inv.amountPaid)} encaissés
                        </p>
                        <p className="text-[13px] font-semibold tabular-nums text-bework-navy">
                          {fmtEur(inv.amountDue)} restants
                        </p>
                        <PaymentBar paid={inv.amountPaid} total={inv.totalTtc} />
                        <p className="mt-0.5 text-[11px] text-slate-400">{inv.paidPercent} %</p>
                      </>
                    )}
                  </div>
                  <span className={badgeClassForTone(FACTURE_STATUS_TONE[inv.status] ?? "neutral")}>
                    {COMMERCIAL_INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
                  </span>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      type="button"
                      disabled={busyId === inv.id}
                      onClick={(e) => onPrimary(inv, e)}
                      className="rounded-full bg-[#1e3a5f] px-3 py-1 text-[12px] font-medium text-white disabled:opacity-40"
                    >
                      {action.label}
                    </button>
                    {inv.status === "DRAFT" ? (
                      <button
                        type="button"
                        disabled={busyId === inv.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void issue(inv.id);
                        }}
                        className="text-[11px] font-medium text-bework-navy hover:underline"
                      >
                        Émettre
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
          {invoices.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-slate-200 px-4 py-12 text-center text-sm text-slate-500">
              Aucune facture dans ce filtre.
            </li>
          ) : null}
        </ul>

        {/* Mobile cards */}
        <ul className="space-y-2 lg:hidden">
          {invoices.map((inv) => {
            const action = primaryAction(inv);
            const due = dueBadge(inv);
            return (
              <li
                key={inv.id}
                className="rounded-2xl border border-bework-navy/10 bg-white p-4"
                onClick={() => setDrawer(inv)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[15px] font-semibold text-bework-ink">{inv.number}</p>
                    <p className="text-[13px] text-slate-600">
                      {inv.clientName || "Client à renseigner"}
                    </p>
                  </div>
                  <span className={badgeClassForTone(FACTURE_STATUS_TONE[inv.status] ?? "neutral")}>
                    {COMMERCIAL_INVOICE_STATUS_LABELS[inv.status] ?? inv.status}
                  </span>
                </div>
                <p className="mt-2 text-[17px] font-semibold tabular-nums text-bework-navy">
                  {fmtEur(inv.totalTtc)} TTC
                </p>
                <p className="text-[13px] text-slate-600">
                  {fmtEur(inv.amountPaid)} encaissés · {fmtEur(inv.amountDue)} restant
                </p>
                {due ? <p className={cn("mt-1 text-[12px]", due.className)}>{due.label}</p> : null}
                <button
                  type="button"
                  disabled={busyId === inv.id}
                  onClick={(e) => onPrimary(inv, e)}
                  className="mt-3 w-full rounded-xl bg-[#1e3a5f] py-2.5 text-[13px] font-semibold text-white"
                >
                  {action.label}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {drawer ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20" onClick={() => setDrawer(null)}>
          <aside
            className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-[-8px_0_32px_rgba(15,23,42,0.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[18px] font-semibold text-bework-ink">{drawer.number}</p>
                <span className={cn("mt-1 inline-flex", badgeClassForTone(FACTURE_STATUS_TONE[drawer.status] ?? "neutral"))}>
                  {COMMERCIAL_INVOICE_STATUS_LABELS[drawer.status] ?? drawer.status}
                </span>
              </div>
              <button type="button" onClick={() => setDrawer(null)} className="text-slate-400" aria-label="Fermer">
                ×
              </button>
            </div>
            <dl className="mt-4 space-y-3 text-[13px]">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Client</dt>
                <dd className="font-medium text-slate-800">
                  {drawer.clientName || "Client à renseigner"}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Chantier</dt>
                <dd>{drawer.projectTitle || "—"}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Montants</dt>
                <dd className="tabular-nums">
                  HT {fmtEur(drawer.totalHt)} · TVA {fmtEur(drawer.totalVat)} ·{" "}
                  <span className="font-semibold">TTC {fmtEur(drawer.totalTtc)}</span>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Encaissement</dt>
                <dd>
                  Payé {fmtEur(drawer.amountPaid)} · Reste{" "}
                  <span className="font-semibold">{fmtEur(drawer.amountDue)}</span>
                </dd>
                <PaymentBar paid={drawer.amountPaid} total={drawer.totalTtc} />
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Échéance</dt>
                <dd>
                  {drawer.dueDate ? fmtDate(drawer.dueDate) : "—"}
                  {dueBadge(drawer) ? (
                    <span className={cn(" ml-2", dueBadge(drawer)!.className)}>
                      {dueBadge(drawer)!.label}
                    </span>
                  ) : null}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Source</dt>
                <dd>
                  {drawer.originLabel}
                  {drawer.quoteNumber ? ` · ${drawer.quoteNumber}` : ""}
                </dd>
              </div>
              {drawer.reminderCount > 0 ? (
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">Relances</dt>
                  <dd>
                    {drawer.reminderCount} relance{drawer.reminderCount > 1 ? "s" : ""}
                    {drawer.lastReminderAt
                      ? ` · dernière ${fmtDate(drawer.lastReminderAt)}`
                      : ""}
                  </dd>
                </div>
              ) : null}
            </dl>

            {drawerPayments.length > 0 ? (
              <div className="mt-5">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                  Paiements
                </p>
                <ul className="mt-2 space-y-1.5 text-[13px]">
                  {drawerPayments.map((p) => (
                    <li key={p.id} className="flex justify-between gap-2 border-b border-slate-100 py-1.5">
                      <span>
                        {fmtDate(p.paidAt)}
                        {p.method ? ` · ${p.method}` : ""}
                      </span>
                      <span className="font-semibold tabular-nums">{fmtEur(Number(p.amount))}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-2">
              <Link
                href={`/dashboard/devis-facturation/factures/${drawer.id}`}
                className="rounded-full bg-[#1e3a5f] px-4 py-2.5 text-center text-[13px] font-medium text-white"
              >
                Ouvrir la facture
              </Link>
              <a
                href={`/api/commercial/invoices/${drawer.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-slate-200 px-4 py-2 text-center text-[13px] font-medium text-slate-700"
              >
                Télécharger PDF
              </a>
              {drawer.amountDue > 0.004 && drawer.status !== "DRAFT" && drawer.status !== "CANCELLED" ? (
                <Link
                  href={`/dashboard/devis-facturation/factures/${drawer.id}#paiement`}
                  className="rounded-full border border-slate-200 px-4 py-2 text-center text-[13px] font-medium text-slate-700"
                >
                  Enregistrer un paiement
                </Link>
              ) : null}
              {drawer.status === "OVERDUE" || drawer.daysLate > 0 ? (
                <button
                  type="button"
                  disabled={busyId === drawer.id}
                  onClick={() => void remind(drawer.id)}
                  className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[13px] font-medium text-amber-900"
                >
                  Relancer
                </button>
              ) : null}
              {drawer.projectId ? (
                <Link
                  href={`/dashboard/projets/${drawer.projectId}`}
                  className="text-center text-[13px] font-medium text-bework-navy hover:underline"
                >
                  Voir le chantier
                </Link>
              ) : null}
              {drawer.quoteId ? (
                <Link
                  href={`/dashboard/devis-facturation/devis/${drawer.quoteId}`}
                  className="text-center text-[13px] font-medium text-bework-navy hover:underline"
                >
                  Voir le devis
                </Link>
              ) : null}
              {drawer.progressStatementId ? (
                <Link
                  href={`/dashboard/devis-facturation/situations/${drawer.progressStatementId}`}
                  className="text-center text-[13px] font-medium text-bework-navy hover:underline"
                >
                  Voir la situation
                </Link>
              ) : null}
              <Link
                href={drawer.documentsHref}
                className="text-center text-[13px] font-medium text-bework-navy hover:underline"
              >
                Voir dans Documents
              </Link>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
