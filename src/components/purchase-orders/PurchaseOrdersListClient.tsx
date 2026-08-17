"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Package,
  ShoppingCart,
  Truck,
} from "lucide-react";
import type {
  PurchaseOrderListRow,
  PurchaseOrderListSummary,
} from "@/lib/purchase-orders/list-view";
import { urgencyRank } from "@/lib/follow-up/urgency";
import { projectSupplierHref } from "@/lib/messagerie/resolve-conversation";
import { formatPurchaseOrderDeliveryShort } from "@/lib/purchase-orders/delivery-display";
import { PURCHASE_COST_CATEGORY_LABELS } from "@/lib/purchase-orders/cost-category";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";

type NavId = "treat" | "orders" | "deliveries" | "receptions";
type SortId =
  | "attention"
  | "delivery"
  | "recent"
  | "oldest"
  | "amount"
  | "supplier"
  | "project"
  | "remaining";
type ChipId =
  | "all"
  | "a_confirmer"
  | "confirmee"
  | "partielle"
  | "recue"
  | "week"
  | "late"
  | "to_receive";

type Props = {
  rows: PurchaseOrderListRow[];
  summary: PurchaseOrderListSummary;
  canCreate: boolean;
  canOpenSupplier: boolean;
  initialView?: NavId;
  initialQ?: string;
  initialProjectId?: string;
  initialSupplierId?: string;
  initialSort?: SortId;
  initialChip?: ChipId;
};

function fmtHt(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} €`;
}

function fmtDelivery(iso: string | null) {
  return formatPurchaseOrderDeliveryShort(iso);
}

function isSameDay(iso: string | null, ref: Date) {
  if (!iso) return false;
  const d = new Date(iso);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

function ReceiptBar({ row }: { row: PurchaseOrderListRow }) {
  const o = Math.round(row.orderedQty);
  const rec = Math.round(row.receivedQty);
  if (row.fullyReceived && o > 0) {
    return (
      <div>
        <p className="text-[14px] font-semibold tabular-nums text-bework-ok">
          {rec} / {o}
        </p>
        <p className="text-[12px] text-emerald-700">✓ Réception complète</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-[14px] font-semibold tabular-nums text-bework-navy">
        {rec} / {o}
      </p>
      <div className="mt-1 h-1.5 w-full max-w-[7.5rem] overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            "h-full rounded-full",
            row.receivedPercent > 0 ? "bg-bework-watch" : "bg-slate-200",
          )}
          style={{ width: `${row.receivedPercent}%` }}
        />
      </div>
      <p className="mt-0.5 text-[11px] text-slate-500">
        {row.receivedPercent}% · {Math.round(row.remainingQty)} restant
      </p>
    </div>
  );
}

function AttentionBadge({ row }: { row: PurchaseOrderListRow }) {
  if (!row.attentionActive && !row.nextActionNeedsUser) return null;
  const critical = row.attentionUrgency === "CRITIQUE";
  const urgent = critical || row.attentionUrgency === "URGENT";
  return (
    <div className="max-w-[10rem]">
      {row.attentionShort || urgent ? (
        <span
          className={cn(
            "inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
            critical
              ? "bg-red-100 text-red-900"
              : urgent
                ? "bg-red-50 text-red-800"
                : "bg-amber-50 text-amber-900",
          )}
        >
          {critical ? "CRITIQUE" : urgent ? "URGENT" : row.attentionShort}
        </span>
      ) : null}
      {row.attentionWhy ? (
        <p className="mt-0.5 line-clamp-2 text-[11px] font-medium leading-snug text-slate-600">
          {row.attentionWhy}
        </p>
      ) : null}
    </div>
  );
}

export function PurchaseOrdersListClient({
  rows: initialRows,
  summary: initialSummary,
  canCreate,
  canOpenSupplier,
  initialView,
  initialQ = "",
  initialProjectId = "",
  initialSupplierId = "",
  initialSort = "attention",
  initialChip = "all",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rows] = useState(initialRows);
  const [summary] = useState(initialSummary);
  const [q, setQ] = useState(initialQ);
  const [nav, setNav] = useState<NavId>(
    initialView ?? (initialSummary.toTreat > 0 ? "treat" : "orders"),
  );
  const [chip, setChip] = useState<ChipId>(initialChip);
  const [sort, setSort] = useState<SortId>(initialSort);
  const [projectId, setProjectId] = useState(initialProjectId);
  const [supplierId, setSupplierId] = useState(initialSupplierId);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [drawer, setDrawer] = useState<PurchaseOrderListRow | null>(null);
  const [drawerDetail, setDrawerDetail] = useState<{
    lines: Array<{
      id: string;
      designation: string;
      quantity: number;
      unit: string;
      unitPriceHt: number | null;
      receivedQty: number;
    }>;
    tvaRate: number | null;
    invoices: Array<{ id: string; number: string; amountHt: number }>;
  } | null>(null);

  function pushUrl(next: Record<string, string>) {
    const p = new URLSearchParams();
    const v = next.view ?? (nav === "orders" ? "" : nav);
    const qq = next.q !== undefined ? next.q : q;
    const s = next.sort ?? (sort === "attention" ? "" : sort);
    const c = next.chip ?? (chip === "all" ? "" : chip);
    const pi = next.projectId !== undefined ? next.projectId : projectId;
    const si = next.supplierId !== undefined ? next.supplierId : supplierId;
    if (v) p.set("view", v);
    if (qq.trim()) p.set("q", qq.trim());
    if (s) p.set("sort", s);
    if (c) p.set("chip", c);
    if (pi) p.set("projectId", pi);
    if (si) p.set("supplierId", si);
    const qs = p.toString();
    startTransition(() => {
      router.replace(qs ? `/dashboard/commandes?${qs}` : "/dashboard/commandes");
    });
  }

  useEffect(() => {
    const t = window.setTimeout(() => pushUrl({ q }), 280);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    if (!drawer) {
      setDrawerDetail(null);
      return;
    }
    void fetch(`/api/purchase-orders/${drawer.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.order) return;
        const order = data.order as {
          tvaRate?: number | null;
          lines?: Array<{
            id: string;
            designation: string;
            quantity: unknown;
            unit: string;
            unitPriceHt?: unknown;
            receivedQty?: unknown;
          }>;
          supplierInvoices?: Array<{
            id: string;
            supplierNumber: string;
            amountHt: unknown;
            cancelledAt?: string | null;
            status?: string;
          }>;
        };
        setDrawerDetail({
          tvaRate: order.tvaRate != null ? Number(order.tvaRate) : null,
          lines: (order.lines ?? []).map((l) => ({
            id: l.id,
            designation: l.designation,
            quantity: Number(l.quantity),
            unit: l.unit,
            unitPriceHt: l.unitPriceHt != null ? Number(l.unitPriceHt) : null,
            receivedQty: Number(l.receivedQty ?? 0),
          })),
          invoices: (order.supplierInvoices ?? [])
            .filter((i) => !i.cancelledAt && i.status !== "CANCELLED")
            .map((i) => ({
              id: i.id,
              number: i.supplierNumber,
              amountHt: Number(i.amountHt),
            })),
        });
      })
      .catch(() => undefined);
  }, [drawer]);

  const filtered = useMemo(() => {
    let list = [...rows];
    const needle = q.trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (r) =>
          r.number.toLowerCase().includes(needle) ||
          r.supplierName.toLowerCase().includes(needle) ||
          (r.projectTitle ?? "").toLowerCase().includes(needle) ||
          r.subjectShort.toLowerCase().includes(needle),
      );
    }
    if (projectId) list = list.filter((r) => r.projectId === projectId);
    if (supplierId) list = list.filter((r) => r.supplierId === supplierId);

    if (nav === "treat") {
      list = list.filter((r) => r.nextActionNeedsUser || r.attentionActive);
    } else if (nav === "deliveries") {
      list = list.filter(
        (r) =>
          Boolean(r.deliveryAt) &&
          !r.fullyReceived &&
          !["ANNULEE", "REFUSEE", "CLOTUREE"].includes(r.status),
      );
    } else if (nav === "receptions") {
      list = list.filter(
        (r) =>
          r.canReceive ||
          r.status === "PARTIELLEMENT_RECUE" ||
          r.status === "RECUE" ||
          r.receivedQty > 0,
      );
    }

    if (chip === "a_confirmer") {
      list = list.filter(
        (r) => r.status === "A_CONFIRMER" || r.status === "ENVOYEE_FOURNISSEUR",
      );
    } else if (chip === "confirmee") {
      list = list.filter(
        (r) => r.status === "CONFIRMEE" || r.status === "LIVRAISON_PROGRAMMEE",
      );
    } else if (chip === "partielle") {
      list = list.filter((r) => r.status === "PARTIELLEMENT_RECUE" || (r.receivedQty > 0 && !r.fullyReceived));
    } else if (chip === "recue") {
      list = list.filter((r) => r.status === "RECUE" || r.status === "CLOTUREE" || r.fullyReceived);
    } else if (chip === "late") {
      list = list.filter((r) => r.daysLateDelivery > 0 || r.nextActionCode === "RELANCER_LIVRAISON_EN_RETARD");
    } else if (chip === "to_receive") {
      list = list.filter((r) => r.canReceive && !r.fullyReceived);
    } else if (chip === "week") {
      const now = new Date();
      const day = now.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      const start = new Date(now);
      start.setDate(now.getDate() + diff);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      list = list.filter((r) => {
        if (!r.deliveryAt) return false;
        const d = new Date(r.deliveryAt);
        return d >= start && d < end;
      });
    }

    list.sort((a, b) => {
      if (sort === "supplier") return a.supplierName.localeCompare(b.supplierName, "fr");
      if (sort === "project") {
        return (a.projectTitle ?? "").localeCompare(b.projectTitle ?? "", "fr");
      }
      if (sort === "amount") return b.amountHt - a.amountHt;
      if (sort === "remaining") return b.remainingQty - a.remainingQty;
      if (sort === "oldest") {
        return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }
      if (sort === "recent") {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sort === "delivery") {
        const da = a.deliveryAt ? new Date(a.deliveryAt).getTime() : Number.POSITIVE_INFINITY;
        const db = b.deliveryAt ? new Date(b.deliveryAt).getTime() : Number.POSITIVE_INFINITY;
        return da - db;
      }
      if (a.nextActionNeedsUser !== b.nextActionNeedsUser) {
        return a.nextActionNeedsUser ? -1 : 1;
      }
      const ua = a.attentionUrgency ? urgencyRank(a.attentionUrgency) : -1;
      const ub = b.attentionUrgency ? urgencyRank(b.attentionUrgency) : -1;
      if (ub !== ua) return ub - ua;
      const da = a.deliveryAt ? new Date(a.deliveryAt).getTime() : Number.POSITIVE_INFINITY;
      const db = b.deliveryAt ? new Date(b.deliveryAt).getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    });
    return list;
  }, [rows, q, chip, sort, nav, projectId, supplierId]);

  const deliveryGroups = useMemo(() => {
    if (nav !== "deliveries") return null;
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const groups: { id: string; label: string; items: PurchaseOrderListRow[] }[] = [
      { id: "today", label: "Aujourd’hui", items: [] },
      { id: "tomorrow", label: "Demain", items: [] },
      { id: "week", label: "Cette semaine", items: [] },
      { id: "later", label: "Plus tard / en retard", items: [] },
    ];
    for (const r of filtered) {
      if (isSameDay(r.deliveryAt, now)) groups[0]!.items.push(r);
      else if (isSameDay(r.deliveryAt, tomorrow)) groups[1]!.items.push(r);
      else if (r.daysUntilDelivery != null && r.daysUntilDelivery <= 7) groups[2]!.items.push(r);
      else groups[3]!.items.push(r);
    }
    return groups.filter((g) => g.items.length > 0);
  }, [filtered, nav]);

  const kpiItems = [
    {
      id: "committed",
      value: fmtHt(summary.committedHt),
      label: "Engagé HT",
      secondary: `${summary.total} BC`,
      tone: "watch" as const,
      icon: ShoppingCart,
      onClick: () => {
        setNav("orders");
        pushUrl({ view: "orders" });
      },
    },
    {
      id: "open",
      value: String(summary.openCount),
      label: "Commandes ouvertes",
      secondary: "en cours",
      tone: "accent" as const,
      icon: ClipboardList,
      onClick: () => {
        setNav("orders");
        setChip("all");
        pushUrl({ view: "orders", chip: "" });
      },
    },
    {
      id: "deliveries",
      value: String(summary.deliveriesThisWeek),
      label: "Livraisons à venir",
      secondary: `${summary.deliveriesToday} aujourd’hui`,
      tone: "cyan" as const,
      icon: Truck,
      onClick: () => {
        setNav("deliveries");
        setChip("week");
        pushUrl({ view: "deliveries", chip: "week" });
      },
    },
    {
      id: "receive",
      value: String(summary.toReceiveCount + summary.partialCount),
      label: "À réceptionner",
      secondary: `${summary.partialCount} partielle${summary.partialCount > 1 ? "s" : ""}`,
      tone: "navy" as const,
      icon: Package,
      onClick: () => {
        setNav("receptions");
        setChip("to_receive");
        pushUrl({ view: "receptions", chip: "to_receive" });
      },
    },
    {
      id: "confirm",
      value: String(summary.toConfirm),
      label: "Non confirmées",
      secondary: "fournisseur",
      tone: "violet" as const,
      icon: AlertTriangle,
      onClick: () => {
        setNav("treat");
        setChip("a_confirmer");
        pushUrl({ view: "treat", chip: "a_confirmer" });
      },
    },
    {
      id: "overdue",
      value: String(summary.overdue),
      label: "En retard / à risque",
      secondary: summary.overdue > 0 ? "action requise" : "ok",
      tone: "critical" as const,
      icon: CheckCircle2,
      onClick: () => {
        setNav("treat");
        setChip("late");
        pushUrl({ view: "treat", chip: "late" });
      },
    },
  ];

  const treatBanner =
    summary.overdue > 0 ||
    summary.toConfirm > 0 ||
    summary.partialCount > 0 ||
    summary.toTreat > 0;

  function applyNav(id: NavId) {
    setNav(id);
    pushUrl({ view: id === "orders" ? "" : id });
  }

  function RowCard({ row }: { row: PurchaseOrderListRow }) {
    const del = fmtDelivery(row.deliveryAt);
    const barTone =
      row.daysLateDelivery > 0 || row.attentionUrgency === "CRITIQUE"
        ? "bg-bework-critical"
        : row.nextActionNeedsUser
          ? "bg-bework-watch"
          : row.fullyReceived
            ? "bg-bework-ok"
            : "bg-bework-accent";
    const rowBg =
      row.daysLateDelivery > 0
        ? "border-bework-critical/20 bg-bework-soft-critical/30"
        : row.status === "PARTIELLEMENT_RECUE"
          ? "border-bework-watch/20 bg-bework-soft-watch/40"
          : row.fullyReceived
            ? "border-bework-ok/15 bg-bework-soft-ok/30"
            : "border-bework-navy/10 bg-white";

    return (
      <li className={cn("relative overflow-hidden rounded-2xl border", rowBg)}>
        <span className={cn("absolute inset-y-0 left-0 w-[3px]", barTone)} aria-hidden />
        <div
          role="button"
          tabIndex={0}
          onClick={() => setDrawer(row)}
          onKeyDown={(e) => {
            if (e.key === "Enter") setDrawer(row);
          }}
          className="hidden cursor-pointer grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,0.7fr)_minmax(0,0.9fr)_minmax(0,0.85fr)_minmax(0,0.9fr)_auto] items-center gap-3 px-4 py-3 pl-5 lg:grid"
        >
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-bework-ink">{row.number}</p>
            <p className="text-[12px] text-slate-500">
              {new Date(row.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            <p className="text-[11px] text-slate-400">{row.statusLabel}</p>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-semibold uppercase tracking-wide text-bework-intel">
              {canOpenSupplier ? (
                <Link
                  href={`/dashboard/fournisseurs/${row.supplierId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="hover:underline"
                >
                  {row.supplierName}
                </Link>
              ) : (
                row.supplierName
              )}
            </p>
          </div>
          <div className="min-w-0">
            {row.projectId ? (
              <Link
                href={`/dashboard/projets/${row.projectId}`}
                onClick={(e) => e.stopPropagation()}
                className="truncate text-[14px] font-medium text-slate-800 hover:underline"
              >
                {row.projectTitle ?? "—"}
              </Link>
            ) : (
              <p className="text-[14px] text-slate-500">—</p>
            )}
            <p className="truncate text-[13px] text-slate-600">{row.subjectShort}</p>
            <p className="text-[11px] text-slate-400">{row.lineCount} ligne{row.lineCount > 1 ? "s" : ""}</p>
          </div>
          <div className="text-right">
            <p className="text-[16px] font-semibold tabular-nums text-bework-navy">
              {fmtHt(row.amountHt)}
            </p>
            <p className="text-[11px] text-slate-500">HT</p>
          </div>
          <div>
            {del ? (
              <>
                <p className="text-[13px] font-semibold tabular-nums text-slate-800">
                  {del.date} · {del.time}
                </p>
                <p className="text-[11px] text-slate-500">{row.deliveryLabel}</p>
                {row.daysLateDelivery > 0 ? (
                  <p className="text-[12px] font-semibold text-bework-critical">
                    {row.daysLateDelivery} j de retard
                  </p>
                ) : row.daysUntilDelivery != null ? (
                  <p className="text-[12px] text-slate-500">
                    {row.daysUntilDelivery === 0
                      ? "Aujourd’hui"
                      : `dans ${row.daysUntilDelivery} j`}
                  </p>
                ) : null}
              </>
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </div>
          <ReceiptBar row={row} />
          <AttentionBadge row={row} />
          <div className="flex flex-col items-end gap-1" onClick={(e) => e.stopPropagation()}>
            {canCreate && row.nextActionHref && row.nextActionNeedsUser ? (
              <Link
                href={row.nextActionHref}
                className="rounded-full bg-[#1e3a5f] px-3 py-1 text-[12px] font-medium text-white"
              >
                {row.nextActionLabel}
              </Link>
            ) : (
              <span className="text-[12px] font-medium text-slate-500">{row.nextActionLabel}</span>
            )}
          </div>
        </div>

        {/* Mobile */}
        <div className="space-y-2 p-4 pl-5 lg:hidden" onClick={() => setDrawer(row)}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-bework-intel">
                {row.supplierName}
              </p>
              <p className="text-[15px] font-semibold tabular-nums">{row.number}</p>
            </div>
            <AttentionBadge row={row} />
          </div>
          <p className="text-[13px] text-slate-600">{row.projectTitleShort ?? "—"}</p>
          <p className="text-[17px] font-semibold tabular-nums text-bework-navy">
            {fmtHt(row.amountHt)} HT
          </p>
          <ReceiptBar row={row} />
          {del ? (
            <p className="text-[13px] font-medium text-slate-700">
              {del.date} · {del.time}
              {row.daysLateDelivery > 0 ? ` · ${row.daysLateDelivery} j de retard` : ""}
            </p>
          ) : null}
          {canCreate && row.nextActionHref && row.nextActionNeedsUser ? (
            <Link
              href={row.nextActionHref}
              onClick={(e) => e.stopPropagation()}
              className="mt-1 inline-flex w-full items-center justify-center rounded-xl bg-[#1e3a5f] py-2.5 text-[13px] font-semibold text-white"
            >
              {row.nextActionLabel}
            </Link>
          ) : null}
        </div>
      </li>
    );
  }

  return (
    <div className={cn("mx-auto max-w-[1440px] space-y-5", pending && "opacity-80")}>
      <PageHeader
        title="Commandes"
        description="Pilotez vos achats, livraisons et réceptions chantier."
        actions={
          canCreate ? (
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/dashboard/commandes/nouvelle"
                className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
              >
                + Nouvelle commande
              </Link>
              <details className="relative">
                <summary className="cursor-pointer list-none rounded-full border border-bework-navy/15 bg-white px-3 py-2 text-[13px] font-medium text-bework-navy">
                  Actions
                </summary>
                <div className="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-slate-200 bg-white py-1 text-[13px] shadow-lg">
                  <Link href="/dashboard/commandes/nouvelle" className="block px-3 py-2 hover:bg-slate-50">
                    Nouvelle commande
                  </Link>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                    onClick={() => applyNav("receptions")}
                  >
                    Enregistrer une réception
                  </button>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left hover:bg-slate-50"
                    onClick={() => applyNav("deliveries")}
                  >
                    Voir les livraisons
                  </button>
                </div>
              </details>
            </div>
          ) : null
        }
      />

      {treatBanner ? (
        <div className="rounded-2xl border border-bework-navy/10 bg-white px-4 py-3">
          <p className="text-[13px] font-semibold text-bework-navy">À traiter</p>
          <div className="mt-2 flex flex-wrap gap-2 text-[13px]">
            {summary.overdue > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setNav("treat");
                  setChip("late");
                  pushUrl({ view: "treat", chip: "late" });
                }}
                className="rounded-full bg-red-50 px-2.5 py-1 font-medium text-red-800"
              >
                {summary.overdue} livraison{summary.overdue > 1 ? "s" : ""} en retard
              </button>
            ) : null}
            {summary.toConfirm > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setNav("treat");
                  setChip("a_confirmer");
                  pushUrl({ view: "treat", chip: "a_confirmer" });
                }}
                className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-800"
              >
                {summary.toConfirm} commande{summary.toConfirm > 1 ? "s" : ""} non confirmée
                {summary.toConfirm > 1 ? "s" : ""}
              </button>
            ) : null}
            {summary.partialCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setNav("receptions");
                  setChip("partielle");
                  pushUrl({ view: "receptions", chip: "partielle" });
                }}
                className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-800"
              >
                {summary.partialCount} réception{summary.partialCount > 1 ? "s" : ""} partielle
                {summary.partialCount > 1 ? "s" : ""}
              </button>
            ) : null}
          </div>
        </div>
      ) : summary.overdue === 0 && summary.toTreat === 0 ? (
        <p className="text-[13px] font-medium text-emerald-700">
          ✓ Aucune réception en retard · Toutes les livraisons du jour sont sous contrôle
        </p>
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
        <div className="flex rounded-full border border-slate-200 bg-white p-0.5">
          {(
            [
              ["treat", "À traiter", summary.toTreat],
              ["orders", "Commandes", summary.total],
              ["deliveries", "Livraisons", summary.deliveriesThisWeek],
              ["receptions", "Réceptions", summary.toReceiveCount + summary.partialCount],
            ] as const
          ).map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              onClick={() => applyNav(id)}
              className={cn(
                "flex-1 rounded-full px-3 py-1.5 text-[12px] font-semibold",
                nav === id ? "bg-bework-navy text-white" : "text-slate-600",
              )}
            >
              {label}
              {count > 0 ? ` · ${count}` : ""}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un BC, fournisseur, chantier, référence, produit…"
            className="min-w-[14rem] flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] outline-none focus:border-bework-accent/40"
          />
          <select
            value={sort}
            onChange={(e) => {
              const s = e.target.value as SortId;
              setSort(s);
              pushUrl({ sort: s === "attention" ? "" : s });
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px]"
          >
            <option value="attention">Action prioritaire</option>
            <option value="delivery">Livraison la plus proche</option>
            <option value="recent">Plus récentes</option>
            <option value="oldest">Plus anciennes</option>
            <option value="amount">Montant décroissant</option>
            <option value="supplier">Fournisseur</option>
            <option value="project">Chantier</option>
            <option value="remaining">Reste à réceptionner</option>
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
                ["all", "Tous"],
                ["a_confirmer", "À confirmer"],
                ["confirmee", "Confirmées"],
                ["to_receive", "À réceptionner"],
                ["partielle", "Partielles"],
                ["recue", "Reçues"],
                ["week", "Cette semaine"],
                ["late", "En retard"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setChip(id);
                  pushUrl({ chip: id === "all" ? "" : id });
                }}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-semibold",
                  chip === id ? "bg-[#1e3a5f] text-white" : "bg-slate-100 text-slate-600",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
        {(projectId || supplierId) && (
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
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center">
          <p className="text-sm font-semibold text-slate-900">Aucune commande pour le moment.</p>
          {canCreate ? (
            <Link
              href="/dashboard/commandes/nouvelle"
              className="mt-4 inline-flex rounded-full bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white"
            >
              + Nouvelle commande
            </Link>
          ) : null}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600">
          {nav === "treat" ? "Rien à traiter pour le moment." : "Aucune commande dans ce filtre."}
        </p>
      ) : deliveryGroups ? (
        <div className="space-y-5">
          {deliveryGroups.map((g) => (
            <section key={g.id}>
              <h2 className="mb-2 text-[13px] font-semibold text-bework-navy">
                {g.label} · {g.items.length}
              </h2>
              <ul className="space-y-2">
                {g.items.map((row) => (
                  <RowCard key={row.id} row={row} />
                ))}
              </ul>
            </section>
          ))}
        </div>
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
                <p className="text-[18px] font-semibold text-bework-ink">{drawer.number}</p>
                <p className="text-[13px] font-semibold uppercase tracking-wide text-bework-intel">
                  {drawer.supplierName}
                </p>
                <p className="text-[13px] text-slate-600">{drawer.projectTitle ?? "—"}</p>
                <p className="mt-1 text-[12px] text-slate-500">{drawer.statusLabel}</p>
              </div>
              <button type="button" onClick={() => setDrawer(null)} className="text-slate-400" aria-label="Fermer">
                ×
              </button>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Montant</dt>
                <dd className="font-semibold tabular-nums">{fmtHt(drawer.amountHt)} HT</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Commandé</dt>
                <dd className="tabular-nums">{Math.round(drawer.orderedQty)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Reçu</dt>
                <dd className="tabular-nums">{Math.round(drawer.receivedQty)}</dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Restant</dt>
                <dd className="font-semibold tabular-nums">{Math.round(drawer.remainingQty)}</dd>
              </div>
            </dl>
            <ReceiptBar row={drawer} />
            {drawer.deliveryAt ? (
              <p className="mt-3 text-[13px] text-slate-700">
                Livraison {fmtDelivery(drawer.deliveryAt)?.date} ·{" "}
                {fmtDelivery(drawer.deliveryAt)?.time} · {drawer.deliveryLabel}
              </p>
            ) : null}
            {drawer.defaultCostCategory ? (
              <p className="mt-2 text-[12px] text-slate-500">
                Catégorie :{" "}
                {PURCHASE_COST_CATEGORY_LABELS[
                  drawer.defaultCostCategory as keyof typeof PURCHASE_COST_CATEGORY_LABELS
                ] ?? drawer.defaultCostCategory}
              </p>
            ) : null}
            <p className="mt-3 text-[13px] font-semibold text-bework-navy">
              Prochaine action : {drawer.nextActionLabel}
            </p>

            {drawerDetail?.lines?.length ? (
              <div className="mt-5">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                  Articles
                </p>
                <ul className="mt-2 space-y-2 text-[13px]">
                  {drawerDetail.lines.map((l) => {
                    const total =
                      l.unitPriceHt != null ? l.unitPriceHt * l.quantity : null;
                    return (
                      <li
                        key={l.id}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
                      >
                        <p className="font-medium text-slate-800">{l.designation}</p>
                        <p className="mt-0.5 tabular-nums text-slate-600">
                          {l.quantity} {l.unit} · reçu {l.receivedQty} · reste{" "}
                          {Math.max(0, l.quantity - l.receivedQty)}
                          {total != null ? ` · ${fmtHt(total)}` : ""}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {drawerDetail?.invoices?.length ? (
              <div className="mt-4">
                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                  Facture fournisseur
                </p>
                {drawerDetail.invoices.map((inv) => (
                  <p key={inv.id} className="mt-1 text-[13px]">
                    {inv.number} · {fmtHt(inv.amountHt)} HT
                    {drawer.amountHt > 0 ? (
                      <span className="text-slate-500">
                        {" "}
                        · écart {fmtHt(inv.amountHt - drawer.amountHt)}
                      </span>
                    ) : null}
                  </p>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-[12px] text-slate-500">Facture fournisseur : non reçue</p>
            )}

            <div className="mt-5 flex flex-col gap-2">
              <Link
                href={`/dashboard/commandes/${drawer.id}`}
                className="rounded-full bg-[#1e3a5f] px-4 py-2.5 text-center text-[13px] font-medium text-white"
              >
                Ouvrir la commande
              </Link>
              {canCreate && drawer.canReceive ? (
                <Link
                  href={`/dashboard/commandes/${drawer.id}/reception`}
                  className="rounded-full border border-slate-200 px-4 py-2 text-center text-[13px] font-medium"
                >
                  Réceptionner
                </Link>
              ) : null}
              {drawer.projectId ? (
                <Link
                  href={`/dashboard/projets/${drawer.projectId}`}
                  className="text-center text-[13px] font-medium text-bework-navy hover:underline"
                >
                  Voir le chantier
                </Link>
              ) : null}
              {canOpenSupplier ? (
                <Link
                  href={`/dashboard/fournisseurs/${drawer.supplierId}`}
                  className="text-center text-[13px] font-medium text-bework-navy hover:underline"
                >
                  Voir le fournisseur
                </Link>
              ) : null}
              {drawer.agendaEventId ? (
                <Link
                  href={`/dashboard/agenda?event=${drawer.agendaEventId}`}
                  className="text-center text-[13px] font-medium text-bework-navy hover:underline"
                >
                  Voir dans Agenda
                </Link>
              ) : null}
              {drawer.profitabilityHref ? (
                <Link
                  href={drawer.profitabilityHref}
                  className="text-center text-[13px] font-medium text-bework-navy hover:underline"
                >
                  Voir dans Rentabilité
                </Link>
              ) : null}
              <Link
                href={drawer.documentsHref}
                className="text-center text-[13px] font-medium text-bework-navy hover:underline"
              >
                Voir dans Documents
              </Link>
              {drawer.canMessage && drawer.projectId ? (
                <Link
                  href={projectSupplierHref(drawer.projectId, drawer.supplierId)}
                  className="text-center text-[13px] font-medium text-bework-navy hover:underline"
                >
                  Message fournisseur
                </Link>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
