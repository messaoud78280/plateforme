"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  actionsForPurchaseOrderStatus,
  PURCHASE_ORDER_STATUS_LABELS,
} from "@/lib/purchase-orders/status";
import {
  REFUSE_REASONS,
  supplierActionsForStatus,
} from "@/lib/purchase-orders/supplier-ui";
import type { PurchaseOrderStatus } from "@prisma/client";

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
  lines: {
    id: string;
    designation: string;
    quantity: string | number;
    unit: string;
    unitPriceHt: string | number | null;
    receivedQty: string | number;
  }[];
  events: {
    id: string;
    label: string;
    detail: string | null;
    createdAt: string;
  }[];
  documents: { id: string; kind: string; name: string }[];
};

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
  isSupplierView = false,
}: {
  order: OrderDetail;
  canAct: boolean;
  isSupplierView?: boolean;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"none" | "confirm" | "propose" | "refuse">("none");
  const [proposeDate, setProposeDate] = useState("");
  const [proposeTime, setProposeTime] = useState("09:00");
  const [proposeComment, setProposeComment] = useState("");
  const [refuseKey, setRefuseKey] = useState<string>("STOCK");
  const [shareContactId, setShareContactId] = useState(order.contact?.id ?? "");

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
    router.refresh();
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
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const clientLabel = order.organization?.name ?? "Entreprise";
  const supplierLabel =
    order.externalOrganization.tradeName || order.externalOrganization.name;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/commandes" className="text-sm font-semibold text-[#1e3a5f]">
          ← Commandes
        </Link>
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
        <section className="rounded-2xl border border-violet-200 bg-violet-50/70 p-5">
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
          {order.lines.map((l) => (
            <li key={l.id} className="flex flex-wrap justify-between gap-2 py-2.5 text-sm">
              <span className="font-medium text-slate-900">{l.designation}</span>
              <span className="text-slate-600">
                {Number(l.quantity)} {l.unit}
                {!isSupplierView && l.unitPriceHt != null ? ` · ${money(l.unitPriceHt)} / u` : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-slate-900">Livraison</h2>
          <p className="mt-2 text-sm text-slate-700">
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
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-slate-900">Documents</h2>
          {order.documents.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">Aucun document pour l’instant.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {order.documents.map((d) => (
                <li key={d.id}>
                  {d.kind} — {d.name}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

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
          <Link
            href={`/dashboard/fournisseurs/${order.externalOrganization.id}`}
            className="font-semibold text-[#1d4ed8]"
          >
            {supplierLabel}
          </Link>
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
