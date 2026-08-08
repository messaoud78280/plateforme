"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  actionsForPurchaseOrderStatus,
  PURCHASE_ORDER_STATUS_LABELS,
} from "@/lib/purchase-orders/status";
import type { PurchaseOrderStatus } from "@prisma/client";

type OrderDetail = {
  id: string;
  number: string;
  subject: string;
  status: PurchaseOrderStatus;
  amountHt: string | number | null;
  requestedDeliveryAt: string | null;
  confirmedDeliveryAt: string | null;
  deliveryAddress: string | null;
  internalNotes: string | null;
  deliveryInstructions: string | null;
  sharedWithSupplier: boolean;
  project: { id: string; title: string } | null;
  externalOrganization: { id: string; name: string; tradeName: string | null };
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
}: {
  order: OrderDetail;
  canAct: boolean;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = canAct ? actionsForPurchaseOrderStatus(order.status) : [];

  async function runAction(action: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/purchase-orders/${order.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      const refreshed = await fetch(`/api/purchase-orders/${order.id}`);
      const body = await refreshed.json();
      if (body.order) setOrder(body.order);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/commandes" className="text-sm font-semibold text-[#1e3a5f]">
          ← Commandes
        </Link>
        {order.followUpSheet ? (
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
              {order.externalOrganization.tradeName || order.externalOrganization.name}
              {order.project ? ` · ${order.project.title}` : ""}
            </p>
          </div>
          <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-bold uppercase text-amber-900 ring-1 ring-amber-200">
            {PURCHASE_ORDER_STATUS_LABELS[order.status]}
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
            <p className="text-[10px] font-bold uppercase text-slate-500">Responsable</p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {order.responsible?.name ?? "—"}
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Demandée par {order.requestedBy.name}
          {order.validator ? ` · Validation : ${order.validator.name}` : ""}
          {order.contact
            ? ` · Contact : ${order.contact.firstName} ${order.contact.lastName}`
            : ""}
        </p>
      </header>

      {actions.length > 0 ? (
        <section className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4">
          {actions.map((a) => (
            <button
              key={a.action}
              type="button"
              disabled={busy}
              onClick={() => void runAction(a.action)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:border-[#1e3a5f]/40 disabled:opacity-50"
            >
              {a.label}
            </button>
          ))}
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
                {l.unitPriceHt != null ? ` · ${money(l.unitPriceHt)} / u` : ""}
                {Number(l.receivedQty) > 0
                  ? ` · reçu ${Number(l.receivedQty)}`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold text-slate-900">Livraison</h2>
          <p className="mt-2 text-sm text-slate-700">
            {order.deliveryAddress || "Adresse chantier"}
          </p>
          {order.deliveryInstructions ? (
            <p className="mt-2 text-xs text-slate-500">{order.deliveryInstructions}</p>
          ) : null}
          <Link href="/dashboard/agenda" className="mt-3 inline-block text-xs font-semibold text-[#1d4ed8]">
            Voir l’agenda →
          </Link>
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

      {order.project ? (
        <p className="text-xs text-slate-500">
          Fournisseur :{" "}
          <Link
            href={`/dashboard/fournisseurs/${order.externalOrganization.id}`}
            className="font-semibold text-[#1d4ed8]"
          >
            {order.externalOrganization.tradeName || order.externalOrganization.name}
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
