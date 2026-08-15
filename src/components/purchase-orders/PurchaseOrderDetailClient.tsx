"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  actionsForPurchaseOrderStatus,
  PURCHASE_ORDER_STATUS_LABELS,
} from "@/lib/purchase-orders/status";
import {
  REFUSE_REASONS,
  supplierActionsForStatus,
} from "@/lib/purchase-orders/supplier-ui";
import { evaluatePurchaseOrderNextAction } from "@/lib/purchase-orders/next-action";
import { evaluatePurchaseOrderWorksiteRisk } from "@/lib/purchase-orders/worksite-risk";
import type { PurchaseOrderStatus } from "@prisma/client";
import { PurchaseOrderMessagerieLink } from "@/components/messagerie/MessagerieContextLinks";
import { ContextBackButton } from "@/components/ui/ContextBackButton";
import { SupplierInvoiceForm } from "@/components/chantier/SupplierInvoiceForm";
import type { SupplierInvoiceDto } from "@/lib/chantier/supplier-invoices";
import { PurchaseCostCategorySelect } from "@/components/purchase-orders/PurchaseCostCategorySelect";
import {
  derivePurchaseOrderInvoiceCategory,
  parsePurchaseCostCategory,
  PURCHASE_COST_CATEGORY_LABELS,
  type SupplierCostCategory,
} from "@/lib/purchase-orders/cost-category";
import {
  buildSupplierInvoicePrefill,
  summarizePoSupplierBilling,
} from "@/lib/chantier/prepare-supplier-invoice";
import {
  contextBackLabelForHref,
  sanitizeInternalReturnTo,
} from "@/lib/navigation/safe-return-to";

const FOCUS_IDS: Record<string, string> = {
  proposal: "po-focus-proposal",
  proposition: "po-focus-proposal",
  receiving: "po-focus-receiving",
  documents: "po-focus-documents",
  delivery: "po-focus-delivery",
  invoice: "po-focus-invoice",
  facture: "po-focus-invoice",
};
type OrderDetail = {
  id: string;
  number: string;
  subject: string;
  status: PurchaseOrderStatus;
  amountHt: string | number | null;
  requestedDeliveryAt: string | null;
  confirmedDeliveryAt: string | null;
  proposedDeliveryAt: string | null;
  proposedDeliveryComment: string | null;
  proposedDeliveryStatus: string;
  supplierRefuseReason: string | null;
  deliveryAddress: string | null;
  internalNotes: string | null;
  deliveryInstructions: string | null;
  sharedWithSupplier: boolean;
  legacyTaskId: string | null;
  organization?: { id: string; name: string } | null;
  project: {
    id: string;
    title: string;
    siteAddress: string | null;
    siteCity: string | null;
  } | null;
  externalOrganization: {
    id: string;
    name: string;
    tradeName: string | null;
    contacts?: {
      id: string;
      firstName: string;
      lastName: string;
      jobTitle: string | null;
    }[];
  };
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    jobTitle: string | null;
  } | null;
  requestedBy: { id: string; name: string };
  responsible: { id: string; name: string } | null;
  validator: { id: string; name: string } | null;
  followUpSheet: { id: string; title: string } | null;
  defaultCostCategory?: string | null;
  lines: {
    id: string;
    designation: string;
    quantity: string | number;
    unit: string;
    unitPriceHt: string | number | null;
    receivedQty: string | number;
    costCategory?: string | null;
  }[];
  events: {
    id: string;
    label: string;
    detail: string | null;
    createdAt: string;
  }[];
  documents: { id: string; kind: string; name: string }[];
  agendaEvents?: {
    id: string;
    startAt: string;
    status: string;
    title: string;
  }[];
  receipts?: {
    id: string;
    receivedAt: string;
    status: string;
    deliveryNoteNumber: string | null;
    commentShared: string | null;
    receivedBy: { id: string; name: string };
    documents: { id: string; name: string; fileUrl?: string | null }[];
  }[];
};

type ReceivingState = {
  totalOrdered: number;
  totalReceivedConforming: number;
  totalRemaining: number;
  totalDamaged: number;
  totalRefused: number;
  fullyReceived: boolean;
  partiallyReceived: boolean;
  hasIssues: boolean;
  lines: {
    orderLineId: string;
    designation: string;
    unit: string;
    ordered: number;
    receivedConforming: number;
    remaining: number;
    damaged: number;
    refused: number;
  }[];
} | null;

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function money(v: string | number | null) {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return "—";
  return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} € HT`;
}

export function PurchaseOrderDetailClient({
  order: initial,
  canAct,
  canReceive = false,
  canPrepareSupplierInvoice = false,
  canOpenSupplier = false,
  isSupplierView = false,
  receiving = null,
  returnTo: returnToProp = null,
}: {
  order: OrderDetail;
  canAct: boolean;
  canReceive?: boolean;
  canPrepareSupplierInvoice?: boolean;
  canOpenSupplier?: boolean;
  isSupplierView?: boolean;
  receiving?: ReceivingState;
  /** Chemin interne validé (?returnTo=) — ex. À traiter / chantier. */
  returnTo?: string | null;
}) {
  const [order, setOrder] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"none" | "confirm" | "propose" | "refuse">("none");
  const [proposeDate, setProposeDate] = useState("");
  const [proposeTime, setProposeTime] = useState("09:00");
  const [proposeComment, setProposeComment] = useState("");
  const [refuseKey, setRefuseKey] = useState<string>("STOCK");
  const [shareContactId, setShareContactId] = useState(order.contact?.id ?? "");
  const [focusHighlight, setFocusHighlight] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<SupplierInvoiceDto[]>([]);
  const [prepareInvoice, setPrepareInvoice] = useState(false);
  const invoiceCategory = useMemo(
    () =>
      derivePurchaseOrderInvoiceCategory({
        lines: order.lines.map((l) => ({
          quantity: Number(l.quantity),
          unitPriceHt: l.unitPriceHt == null ? null : Number(l.unitPriceHt),
          costCategory: l.costCategory,
        })),
        defaultCostCategory: order.defaultCostCategory,
      }),
    [order.lines, order.defaultCostCategory],
  );
  const invoicePrefill = useMemo(() => {
    if (!order.project) return null;
    return buildSupplierInvoicePrefill({
      supplierId: order.externalOrganization.id,
      supplierName:
        order.externalOrganization.tradeName || order.externalOrganization.name,
      projectId: order.project.id,
      projectTitle: order.project.title,
      purchaseOrderId: order.id,
      purchaseOrderNumber: order.number,
      orderAmountHt: order.amountHt != null ? Number(order.amountHt) : null,
      defaultCostCategory: order.defaultCostCategory,
      lines: order.lines.map((l) => {
        const rec = receiving?.lines.find((x) => x.orderLineId === l.id);
        return {
          designation: l.designation,
          quantity: Number(l.quantity),
          unit: l.unit,
          unitPriceHt: l.unitPriceHt == null ? null : Number(l.unitPriceHt),
          costCategory: l.costCategory,
          receivedConforming: rec?.receivedConforming ?? Number(l.receivedQty) ?? 0,
        };
      }),
    });
  }, [order, receiving]);
  const billing = useMemo(
    () =>
      summarizePoSupplierBilling({
        orderHt: order.amountHt != null ? Number(order.amountHt) : null,
        invoices,
      }),
    [order.amountHt, invoices],
  );

  async function updateLineCategory(lineId: string, costCategory: SupplierCostCategory) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/purchase-orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineCostCategories: [{ id: lineId, costCategory }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (data.order) setOrder(data.order);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const safeReturnTo = sanitizeInternalReturnTo(returnToProp, "/dashboard/commandes");
  const backLabel = contextBackLabelForHref(safeReturnTo, "Retour aux commandes");

  useEffect(() => {
    if (isSupplierView) return;
    void (async () => {
      const res = await fetch(
        `/api/supplier-invoices?purchaseOrderId=${encodeURIComponent(order.id)}`,
      );
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data?.invoices)) setInvoices(data.invoices);
    })();
  }, [order.id, isSupplierView]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get("focus") || "").trim().toLowerCase();
    const elId = FOCUS_IDS[raw];
    if (!elId) return;

    const run = () => {
      let el = document.getElementById(elId);
      if (!el && elId === "po-focus-proposal") {
        el = document.getElementById("po-focus-delivery");
      }
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setFocusHighlight(el.id);
      if (el.id === "po-focus-invoice") setPrepareInvoice(true);
      window.setTimeout(() => setFocusHighlight(null), 2200);
      const url = new URL(window.location.href);
      url.searchParams.delete("focus");
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    };

    const t = window.setTimeout(run, 80);
    return () => window.clearTimeout(t);
  }, [order.id]);

  const focusRing = (id: string) =>
    focusHighlight === id
      ? "ring-2 ring-[#1e3a5f]/35 ring-offset-2 transition-shadow duration-500"
      : "";

  const supplierActs = supplierActionsForStatus(
    order.status,
    order.proposedDeliveryStatus || "NONE",
  );

  const internalActions = canAct
    ? actionsForPurchaseOrderStatus(order.status).filter((a) => {
        if (a.action === "send_supplier") return !order.sharedWithSupplier;
        return a.action !== "accept_proposal" && a.action !== "refuse_proposal";
      })
    : [];

  async function refreshOrder() {
    const refreshed = await fetch(`/api/purchase-orders/${order.id}`);
    const body = await refreshed.json();
    if (body.order) setOrder(body.order);
  }

  async function runInternal(action: string, extra?: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/purchase-orders/${order.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      await refreshOrder();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function runSupplier(action: string, payload: Record<string, unknown> = {}) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/purchase-orders/${order.id}/supplier`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      if (data.order) setOrder(data.order);
      setMode("none");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const clientLabel = order.organization?.name ?? "Entreprise";
  const supplierLabel =
    order.externalOrganization.tradeName || order.externalOrganization.name;

  const orderedQty = useMemo(
    () => order.lines.reduce((s, l) => s + Number(l.quantity || 0), 0),
    [order.lines],
  );
  const receivedQty = useMemo(
    () => order.lines.reduce((s, l) => s + Number(l.receivedQty || 0), 0),
    [order.lines],
  );
  const nextAction = useMemo(
    () =>
      evaluatePurchaseOrderNextAction({
        status: order.status,
        sharedWithSupplier: order.sharedWithSupplier,
        proposedDeliveryStatus: order.proposedDeliveryStatus || "NONE",
        requestedDeliveryAt: order.requestedDeliveryAt,
        confirmedDeliveryAt: order.confirmedDeliveryAt,
        proposedDeliveryAt: order.proposedDeliveryAt,
        supplierName: supplierLabel,
        orderedQty,
        receivedQty,
        fullyReceived: orderedQty > 0 && receivedQty >= orderedQty,
      }),
    [
      order.status,
      order.sharedWithSupplier,
      order.proposedDeliveryStatus,
      order.requestedDeliveryAt,
      order.confirmedDeliveryAt,
      order.proposedDeliveryAt,
      supplierLabel,
      orderedQty,
      receivedQty,
    ],
  );
  const worksiteRisk = useMemo(
    () =>
      evaluatePurchaseOrderWorksiteRisk({
        deliveryAt: order.confirmedDeliveryAt || order.requestedDeliveryAt,
        remainingQty: Math.max(0, orderedQty - receivedQty),
        fullyReceived: orderedQty > 0 && receivedQty >= orderedQty,
        projectId: order.project?.id ?? null,
        // Pas de FK intervention — risque dur uniquement si date passée + chantier
      }),
    [
      order.confirmedDeliveryAt,
      order.requestedDeliveryAt,
      orderedQty,
      receivedQty,
      order.project?.id,
    ],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ContextBackButton
          label={backLabel}
          fallbackHref="/dashboard/commandes"
          returnTo={safeReturnTo}
        />
        {!isSupplierView && order.followUpSheet ? (
          <Link
            href={`/dashboard/fiches-suivi/${order.followUpSheet.id}`}
            className="text-xs font-semibold text-[#1d4ed8]"
          >
            Voir la fiche →
          </Link>
        ) : null}
      </div>

      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
              {order.number}
            </p>
            <h1 className="mt-1 text-xl font-extrabold text-slate-900">{order.subject}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {isSupplierView ? (
                <>
                  Client : {clientLabel}
                  {order.project ? ` · ${order.project.title}` : ""}
                </>
              ) : (
                <>
                  {supplierLabel}
                  {order.project ? ` · ${order.project.title}` : ""}
                </>
              )}
            </p>
          </div>
          <span
            className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase ring-1 ${
              order.status === "REFUSEE"
                ? "bg-red-50 text-red-800 ring-red-200"
                : order.proposedDeliveryStatus === "PENDING"
                  ? "bg-violet-50 text-violet-900 ring-violet-200"
                  : "bg-amber-50 text-amber-900 ring-amber-200"
            }`}
          >
            {order.proposedDeliveryStatus === "PENDING" && !isSupplierView
              ? "Modification à valider"
              : PURCHASE_ORDER_STATUS_LABELS[order.status]}
          </span>
        </div>

        {!isSupplierView && nextAction.code !== "AUCUNE" ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
              Prochaine action
            </p>
            <p className="mt-0.5 text-sm font-extrabold text-slate-900">{nextAction.label}</p>
            {worksiteRisk.label ? (
              <p className="mt-1 text-xs font-semibold text-amber-900">
                {worksiteRisk.label}
                {worksiteRisk.reason ? ` — ${worksiteRisk.reason}` : ""}
              </p>
            ) : null}
            {canAct && nextAction.hrefKind === "reception" ? (
              <Link
                href={`/dashboard/commandes/${order.id}/reception`}
                className="mt-2 inline-flex rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white"
              >
                Réceptionner
              </Link>
            ) : null}
          </div>
        ) : null}

        {!isSupplierView && order.project?.id ? (
          <div className="mt-3">
            <PurchaseOrderMessagerieLink
              projectId={order.project.id}
              supplierName={supplierLabel}
              externalOrganizationId={order.externalOrganization.id}
            />
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Montant</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{money(order.amountHt)}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Livraison demandée</p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {fmtDate(order.requestedDeliveryAt)}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Livraison confirmée</p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {order.confirmedDeliveryAt ? fmtDate(order.confirmedDeliveryAt) : "En attente"}
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">
              {isSupplierView ? "Lieu" : "Responsable"}
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {isSupplierView
                ? order.deliveryAddress || order.project?.title || "—"
                : (order.responsible?.name ?? "—")}
            </p>
          </div>
        </div>

        {!isSupplierView ? (
          <p className="mt-3 text-xs text-slate-500">
            Demandée par {order.requestedBy.name}
            {order.validator ? ` · Validation : ${order.validator.name}` : ""}
            {order.contact
              ? ` · Contact : ${order.contact.firstName} ${order.contact.lastName}`
              : ""}
            {order.sharedWithSupplier ? " · Partagée fournisseur" : " · Interne"}
          </p>
        ) : null}

        {order.supplierRefuseReason ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
            Refus fournisseur : {order.supplierRefuseReason}
          </p>
        ) : null}
      </header>

      {/* Proposition en attente — côté entreprise */}
      {!isSupplierView && order.proposedDeliveryStatus === "PENDING" ? (
        <section
          id="po-focus-proposal"
          className={`rounded-2xl border border-violet-200 bg-violet-50/70 p-5 ${focusRing("po-focus-proposal")}`}
        >
          <h2 className="text-sm font-bold text-violet-950">
            {supplierLabel} propose une modification
          </h2>
          <p className="mt-2 text-sm text-violet-900">
            Demandé : {fmtDate(order.requestedDeliveryAt)}
            <br />
            Proposition : <strong>{fmtDate(order.proposedDeliveryAt)}</strong>
          </p>
          {order.proposedDeliveryComment ? (
            <p className="mt-2 text-sm italic text-violet-800">
              « {order.proposedDeliveryComment} »
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || !canAct}
              onClick={() => void runInternal("accept_proposal")}
              className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
            >
              Accepter
            </button>
            <button
              type="button"
              disabled={busy || !canAct}
              onClick={() => void runInternal("refuse_proposal")}
              className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-xs font-bold text-violet-900 disabled:opacity-50"
            >
              Refuser
            </button>
          </div>
        </section>
      ) : null}

      {/* Actions internes */}
      {!isSupplierView && (internalActions.length > 0 || !order.sharedWithSupplier) ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-2">
            {!order.sharedWithSupplier ? (
              <div className="flex flex-wrap items-center gap-2">
                {(order.externalOrganization.contacts?.length ?? 0) > 0 ? (
                  <select
                    value={shareContactId}
                    onChange={(e) => setShareContactId(e.target.value)}
                    className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
                  >
                    <option value="">Contact (optionnel)</option>
                    {order.externalOrganization.contacts?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName}
                        {c.jobTitle ? ` — ${c.jobTitle}` : ""}
                      </option>
                    ))}
                  </select>
                ) : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void runInternal("send_supplier", {
                      contactId: shareContactId || undefined,
                    })
                  }
                  className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  Partager avec le fournisseur
                </button>
              </div>
            ) : null}
            {internalActions
              .filter((a) => a.action !== "send_supplier")
              .map((a) => (
                <button
                  key={a.action}
                  type="button"
                  disabled={busy}
                  onClick={() => void runInternal(a.action)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:border-[#1e3a5f]/40 disabled:opacity-50"
                >
                  {a.label}
                </button>
              ))}
          </div>
        </section>
      ) : null}

      {/* Actions fournisseur */}
      {isSupplierView ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          {supplierActs.proposalPending ? (
            <p className="text-sm font-semibold text-violet-800">
              Proposition envoyée — en attente de validation par {clientLabel}.
            </p>
          ) : null}
          {supplierActs.proposalRefused ? (
            <p className="text-sm font-semibold text-amber-800">
              Proposition refusée — vous pouvez proposer une nouvelle date.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {supplierActs.canConfirm ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setMode(mode === "confirm" ? "none" : "confirm")}
                className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Confirmer la commande
              </button>
            ) : null}
            {supplierActs.canPropose ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setMode(mode === "propose" ? "none" : "propose")}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 disabled:opacity-50"
              >
                Proposer une autre livraison
              </button>
            ) : null}
            {supplierActs.canRefuse ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setMode(mode === "refuse" ? "none" : "refuse")}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-800 disabled:opacity-50"
              >
                Refuser
              </button>
            ) : null}
            <Link
              href={
                order.legacyTaskId
                  ? `/dashboard/taches/${order.legacyTaskId}`
                  : "/dashboard/messagerie?view=chantiers&channel=FOURNISSEUR"
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800"
            >
              Envoyer un message
            </Link>
          </div>

          {mode === "confirm" ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Confirmer {order.number} ?</p>
              <p className="mt-1 text-sm text-slate-600">
                Livraison : {fmtDate(order.requestedDeliveryAt)}
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runSupplier("confirm")}
                className="mt-3 rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
              >
                Confirmer
              </button>
            </div>
          ) : null}

          {mode === "propose" ? (
            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Date demandée : {fmtDate(order.requestedDeliveryAt)} — elle sera conservée.
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-600">
                  Nouvelle date
                  <input
                    type="date"
                    value={proposeDate}
                    onChange={(e) => setProposeDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </label>
                <label className="block text-xs font-semibold text-slate-600">
                  Heure
                  <input
                    type="time"
                    value={proposeTime}
                    onChange={(e) => setProposeTime(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  />
                </label>
              </div>
              <label className="block text-xs font-semibold text-slate-600">
                Commentaire (optionnel)
                <textarea
                  value={proposeComment}
                  onChange={(e) => setProposeComment(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                  placeholder="Ex. Notre camion ne peut pas être sur site avant 9h."
                />
              </label>
              <button
                type="button"
                disabled={busy || !proposeDate}
                onClick={() =>
                  void runSupplier("propose", {
                    proposedDeliveryAt: new Date(
                      `${proposeDate}T${proposeTime || "09:00"}:00`,
                    ).toISOString(),
                    comment: proposeComment || null,
                  })
                }
                className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Envoyer la proposition
              </button>
            </div>
          ) : null}

          {mode === "refuse" ? (
            <div className="space-y-3 rounded-xl border border-red-100 bg-red-50/50 p-4">
              <label className="block text-xs font-semibold text-slate-700">
                Motif *
                <select
                  value={refuseKey}
                  onChange={(e) => setRefuseKey(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                >
                  {REFUSE_REASONS.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runSupplier("refuse", { reasonKey: refuseKey })}
                className="rounded-lg bg-red-700 px-3 py-2 text-xs font-bold text-white"
              >
                Confirmer le refus
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900">Articles</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {order.lines.map((l) => {
            const rs = receiving?.lines.find((x) => x.orderLineId === l.id);
            const cat = parsePurchaseCostCategory(l.costCategory);
            return (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <span className="font-medium text-slate-900">{l.designation}</span>
                <span className="flex flex-wrap items-center gap-2 text-slate-600">
                  {rs
                    ? `${rs.receivedConforming} / ${rs.ordered} ${l.unit}`
                    : `${Number(l.quantity)} ${l.unit}`}
                  {rs && rs.remaining > 0 ? ` · reste ${rs.remaining}` : ""}
                  {!isSupplierView && l.unitPriceHt != null ? ` · ${money(l.unitPriceHt)} / u` : ""}
                  {isSupplierView ? (
                    <span className="text-xs text-slate-500">
                      {PURCHASE_COST_CATEGORY_LABELS[cat]}
                    </span>
                  ) : (
                    <PurchaseCostCategorySelect
                      value={cat}
                      onChange={(next) => void updateLineCategory(l.id, next)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                    />
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        id="po-focus-receiving"
        className={`rounded-2xl border border-slate-200 bg-white p-5 ${focusRing("po-focus-receiving")}`}
      >
        <h2 className="text-sm font-bold text-slate-900">Réceptions</h2>
        {order.receipts && order.receipts.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {order.receipts.map((r) => (
              <li key={r.id} className="rounded-lg border border-slate-100 px-3 py-2 text-sm">
                <p className="font-semibold text-slate-900">
                  {fmtDate(r.receivedAt)} — {r.receivedBy.name}
                </p>
                <p className="text-xs text-slate-500">
                  {r.status}
                  {r.deliveryNoteNumber ? ` · BL ${r.deliveryNoteNumber}` : ""}
                </p>
                {r.commentShared && (isSupplierView || true) ? (
                  <p className="mt-1 text-xs text-slate-600">{r.commentShared}</p>
                ) : null}
                {r.documents?.[0]?.id ? (
                  <a
                    href={`/api/ged/files/purchase-order-document/${r.documents[0].id}?redirect=1`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block text-xs font-semibold text-[#1d4ed8]"
                  >
                    Voir le BL →
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Aucune réception enregistrée.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {canReceive &&
          !["ANNULEE", "CLOTUREE", "BROUILLON", "RECUE"].includes(order.status) ? (
            <Link
              href={`/dashboard/commandes/${order.id}/reception`}
              className="inline-flex rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
            >
              Réceptionner
            </Link>
          ) : null}
          {canPrepareSupplierInvoice &&
          canAct &&
          order.project &&
          !isSupplierView &&
          order.receipts &&
          order.receipts.length > 0 ? (
            <button
              type="button"
              onClick={() => {
                setPrepareInvoice(true);
                document.getElementById("po-focus-invoice")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className="inline-flex rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800"
            >
              Préparer la facture fournisseur
            </button>
          ) : null}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section
          id="po-focus-delivery"
          className={`rounded-2xl border border-slate-200 bg-white p-5 ${focusRing("po-focus-delivery")}`}
        >
          <h2 className="text-sm font-bold text-slate-900">Livraison</h2>
          <dl className="mt-2 space-y-1 text-sm text-slate-700">
            <div>
              <dt className="text-[10px] font-bold uppercase text-slate-500">Demandée</dt>
              <dd>{fmtDate(order.requestedDeliveryAt)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-slate-500">Confirmée</dt>
              <dd>
                {order.confirmedDeliveryAt ? fmtDate(order.confirmedDeliveryAt) : "En attente"}
              </dd>
            </div>
            {!isSupplierView ? (
              <div>
                <dt className="text-[10px] font-bold uppercase text-slate-500">
                  Responsable réception
                </dt>
                <dd>{order.responsible?.name ?? "—"}</dd>
              </div>
            ) : null}
          </dl>
          <p className="mt-3 text-sm text-slate-700">
            {order.deliveryAddress ||
              [order.project?.siteAddress, order.project?.siteCity].filter(Boolean).join(", ") ||
              "Adresse chantier"}
          </p>
          {order.deliveryInstructions ? (
            <p className="mt-2 text-xs text-slate-500">{order.deliveryInstructions}</p>
          ) : null}
          {order.proposedDeliveryStatus === "PENDING" ? (
            <p className="mt-3 text-xs font-semibold text-violet-800">
              Proposition en cours : {fmtDate(order.proposedDeliveryAt)}
            </p>
          ) : null}
          {receiving ? (
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <p className="text-[10px] font-bold uppercase text-slate-500">Réception</p>
              <p className="mt-1 text-sm font-bold text-slate-900">
                {receiving.totalReceivedConforming} / {receiving.totalOrdered} reçus
              </p>
              {receiving.totalRemaining > 0 ? (
                <p className="text-xs font-semibold text-amber-800">
                  {receiving.totalRemaining} restant à livrer
                </p>
              ) : (
                <p className="text-xs font-semibold text-emerald-800">Tout reçu</p>
              )}
              {receiving.hasIssues ? (
                <p className="mt-1 text-xs text-red-700">
                  Anomalies : {receiving.totalDamaged} endommagé(s), {receiving.totalRefused}{" "}
                  refusé(s)
                </p>
              ) : null}
              {order.receipts?.[0] ? (
                <p className="mt-2 text-xs text-slate-600">
                  Dernière : {fmtDate(order.receipts[0].receivedAt)} —{" "}
                  {order.receipts[0].receivedBy.name}
                  {order.receipts[0].deliveryNoteNumber
                    ? ` · BL ${order.receipts[0].deliveryNoteNumber}`
                    : ""}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-3">
            {!isSupplierView && order.agendaEvents?.[0] ? (
              <Link
                href={`/dashboard/agenda?event=${order.agendaEvents[0].id}`}
                className="text-xs font-semibold text-[#1d4ed8]"
              >
                Voir dans l’agenda →
              </Link>
            ) : null}
            {canReceive &&
            !["ANNULEE", "CLOTUREE", "BROUILLON", "RECUE"].includes(order.status) ? (
              <Link
                href={`/dashboard/commandes/${order.id}/reception`}
                className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
              >
                Réceptionner
              </Link>
            ) : null}
          </div>
        </section>

        <section
          id="po-focus-documents"
          className={`rounded-2xl border border-slate-200 bg-white p-5 ${focusRing("po-focus-documents")}`}
        >
          <h2 className="text-sm font-bold text-slate-900">Documents</h2>
          {order.documents.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aucun document pour l’instant.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {order.documents.map((d) => (
                <li key={d.id}>
                  <a
                    href={`/api/ged/files/purchase-order-document/${d.id}?redirect=1`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[#1d4ed8] hover:underline"
                  >
                    {d.kind} — {d.name}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {canAct && order.project && !isSupplierView ? (
        <section
          id="po-focus-invoice"
          className={`rounded-2xl border border-slate-200 bg-white p-5 ${focusRing("po-focus-invoice")}`}
        >
          <h2 className="text-sm font-bold text-slate-900">
            Facture fournisseur
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Enregistrer la pièce reçue alimente le réel du chantier, sans
            additionner la réception du même BC.
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-bold uppercase text-slate-500">Commandé</dt>
              <dd className="tabular-nums font-medium">{money(order.amountHt)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-slate-500">Réceptionné</dt>
              <dd className="tabular-nums font-medium">
                {invoicePrefill?.hasReceipt
                  ? `${money(invoicePrefill.receivedAmountHt)} · ${invoicePrefill.receivedQty} / ${invoicePrefill.orderedQty}`
                  : "Aucune réception enregistrée"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-slate-500">Facturé fournisseur</dt>
              <dd className="tabular-nums font-medium">
                {order.amountHt != null
                  ? `${billing.invoicedHt.toLocaleString("fr-FR")} € / ${Number(order.amountHt).toLocaleString("fr-FR")} €`
                  : `${billing.invoicedHt.toLocaleString("fr-FR")} €`}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-slate-500">Reste théorique</dt>
              <dd className="tabular-nums font-medium">
                {billing.remainingHt == null
                  ? "—"
                  : `${billing.remainingHt.toLocaleString("fr-FR")} €`}
              </dd>
            </div>
          </dl>
          {invoices.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {invoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 text-sm"
                >
                  <span>
                    <span className="font-semibold">{inv.supplierNumber}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      {inv.kindLabel} · {inv.statusLabel}
                    </span>
                  </span>
                  <span className="tabular-nums font-medium">
                    {inv.signedHt.toLocaleString("fr-FR")} €
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Aucune facture saisie.</p>
          )}
          {canPrepareSupplierInvoice && prepareInvoice ? (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <SupplierInvoiceForm
                projectId={order.project.id}
                purchaseOrderId={order.id}
                supplierId={order.externalOrganization.id}
                supplierName={supplierLabel}
                defaultCategory={invoiceCategory}
                hideCategory={invoicePrefill?.categoryKnown ?? invoiceCategory !== "UNCLASSIFIED"}
                context={invoicePrefill}
                onCreated={(inv) => {
                  setInvoices((prev) => [inv, ...prev]);
                  setPrepareInvoice(false);
                }}
              />
            </div>
          ) : canPrepareSupplierInvoice ? (
            <button
              type="button"
              onClick={() => setPrepareInvoice(true)}
              className="mt-4 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800"
            >
              Ajouter / préparer une facture
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-slate-900">Historique</h2>
        <ol className="mt-3 space-y-2">
          {order.events.map((e) => (
            <li key={e.id} className="border-l-2 border-slate-100 pl-3">
              <p className="text-sm font-semibold text-slate-900">{e.label}</p>
              {e.detail ? <p className="text-xs text-slate-500">{e.detail}</p> : null}
              <p className="text-[11px] text-slate-400">{fmtDate(e.createdAt)}</p>
            </li>
          ))}
        </ol>
      </section>

      {!isSupplierView && order.project ? (
        <p className="text-xs text-slate-500">
          Fournisseur :{" "}
          {canOpenSupplier ? (
            <Link
              href={`/dashboard/fournisseurs/${order.externalOrganization.id}`}
              className="font-semibold text-[#1d4ed8]"
            >
              {supplierLabel}
            </Link>
          ) : (
            <span className="font-semibold text-slate-800">{supplierLabel}</span>
          )}
          {" · "}
          Chantier :{" "}
          <Link href={`/dashboard/projets/${order.project.id}`} className="font-semibold text-[#1d4ed8]">
            {order.project.title}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
