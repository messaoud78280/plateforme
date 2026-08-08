"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { POSTIT_COLORS, STATUS_LABELS, URGENCY_STYLES } from "@/lib/follow-up/types";

type Sheet = {
  id: string;
  title: string;
  clientName: string | null;
  osNumber: string | null;
  orderNumber: string | null;
  workObject: string | null;
  siteAddress: string | null;
  status: string;
  statusLabel: string;
  colorKey: string;
  nextAction: string | null;
  nextActionAt: string | null;
  nextActionAtLabel: string;
  nextActionDone: boolean;
  urgency: string;
  urgencyLabel: string;
  delayLabel: string | null;
  notes: string | null;
  postponeCount: number;
  assignee: { id: string; name: string } | null;
  timeline: {
    id: string;
    kind: string;
    label: string;
    detail: string | null;
    occurredAt: string;
    authorName: string | null;
  }[];
  agendaEvents: {
    id: string;
    title: string;
    type: string;
    startAt: string;
    status: string;
  }[];
};

const QUICK_EVENTS = [
  { type: "INTERVENTION", label: "Programmer une intervention" },
  { type: "COMMANDE", label: "Ajouter une commande" },
  { type: "LIVRAISON", label: "Ajouter une livraison" },
  { type: "RDV_CLIENT", label: "Ajouter un rendez-vous" },
  { type: "FACTURATION", label: "Préparer facturation" },
  { type: "ECHEANCE", label: "Ajouter une relance" },
] as const;

export function FollowUpDetailClient({ sheet: initial }: { sheet: Sheet }) {
  const router = useRouter();
  const [sheet, setSheet] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [nextDraft, setNextDraft] = useState(sheet.nextAction ?? "");
  const color = POSTIT_COLORS[sheet.colorKey] ?? POSTIT_COLORS.jaune;
  const urgency = URGENCY_STYLES[sheet.urgency as keyof typeof URGENCY_STYLES] ?? URGENCY_STYLES.NORMAL;

  async function runAction(payload: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/follow-up/${sheet.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setSheet(data.sheet ?? data);
        router.refresh();
      }
    } finally {
      setBusy(false);
      setPostponeOpen(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/fiches-suivi" className="text-sm font-semibold text-[#1e3a5f]">
          ← Fiches de suivi
        </Link>
        <Link
          href={`/dashboard/agenda?followUp=${sheet.id}`}
          className="text-xs font-semibold text-slate-600 hover:underline"
        >
          Voir dans l’agenda
        </Link>
      </div>

      <header
        className={cn(
          "rounded-2xl border-2 border-l-4 p-5",
          color.bg,
          color.border,
          urgency.bar,
        )}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">{sheet.title}</h1>
            <p className="mt-1 text-sm text-slate-700">
              {sheet.osNumber ? `OS n°${sheet.osNumber}` : null}
              {sheet.osNumber && sheet.orderNumber ? " · " : null}
              {sheet.orderNumber ? `Commande ${sheet.orderNumber}` : null}
            </p>
            {sheet.workObject && <p className="mt-2 text-sm text-slate-800">{sheet.workObject}</p>}
            {sheet.siteAddress && <p className="mt-1 text-xs text-slate-600">{sheet.siteAddress}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={cn("rounded-md px-2 py-1 text-xs font-bold", urgency.badge)}>
              {sheet.urgencyLabel}
            </span>
            <span className="rounded bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase">
              {sheet.statusLabel}
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-white/70 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Prochaine action</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {sheet.nextActionDone ? "✓ Terminée" : sheet.nextAction || "—"}
            </p>
          </div>
          <div className="rounded-lg bg-white/70 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Échéance</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{sheet.nextActionAtLabel}</p>
            {sheet.delayLabel && (
              <p className="text-xs font-bold text-red-700">Retard : {sheet.delayLabel}</p>
            )}
          </div>
          <div className="rounded-lg bg-white/70 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Responsable</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{sheet.assignee?.name ?? "—"}</p>
            {sheet.postponeCount > 0 && (
              <p className="text-[11px] text-amber-800">{sheet.postponeCount} report(s)</p>
            )}
          </div>
        </div>
      </header>

      {!sheet.nextActionDone && sheet.nextAction && (
        <section className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => runAction({ action: "done" })}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Marquer comme fait
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setPostponeOpen((v) => !v)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            Reporter
          </button>
          {postponeOpen && (
            <div className="flex w-full flex-wrap gap-2 border-t border-slate-100 pt-3">
              {(
                [
                  ["tomorrow", "Demain"],
                  ["2days", "Dans 2 jours"],
                  ["1week", "Dans 1 semaine"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  disabled={busy}
                  onClick={() => runAction({ action: "postpone", postpone: k })}
                  className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-semibold"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold text-slate-900">Modifier la prochaine action</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={nextDraft}
            onChange={(e) => setNextDraft(e.target.value)}
            className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Ex. Commander membrane EPDM"
          />
          <button
            type="button"
            disabled={busy || !nextDraft.trim()}
            onClick={() => runAction({ action: "set_next", nextAction: nextDraft.trim() })}
            className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
          >
            Enregistrer
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold text-slate-900">Actions rapides</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_EVENTS.map((q) => (
            <button
              key={q.type}
              type="button"
              disabled={busy}
              onClick={() => {
                const start = new Date();
                start.setDate(start.getDate() + (q.type === "INTERVENTION" ? 3 : 1));
                start.setHours(8, 0, 0, 0);
                void runAction({
                  action: "quick_event",
                  eventType: q.type,
                  eventTitle: `${q.label.replace(/^(Programmer |Ajouter |Préparer )/, "")} — ${sheet.title}`,
                  eventStartAt: start.toISOString(),
                });
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 hover:border-[#1e3a5f]/40"
            >
              + {q.label}
            </button>
          ))}
          {(
            [
              ["A_PLANIFIER", "À planifier"],
              ["AVENANT", "Avenant"],
              ["A_FACTURER", "À facturer"],
              ["TRAVAUX_TERMINES", "Travaux terminés"],
            ] as const
          ).map(([st, label]) => (
            <button
              key={st}
              type="button"
              disabled={busy}
              onClick={() => runAction({ action: "quick_status", status: st })}
              className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
            >
              Statut : {label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          Statuts disponibles :{" "}
          {Object.values(STATUS_LABELS).slice(0, 8).join(" · ")}…
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-slate-900">Chronologie</h2>
          <ol className="mt-4 space-y-3">
            {sheet.timeline.map((t) => {
              const done = ["termine", "creation", "statut", "agenda", "alerte"].includes(t.kind)
                ? t.kind === "termine" || t.kind === "creation"
                : false;
              const past = new Date(t.occurredAt) <= new Date();
              return (
                <li key={t.id} className="flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      past || done ? "bg-emerald-100 text-emerald-800" : "border-2 border-slate-300 text-slate-400",
                    )}
                  >
                    {past || done ? "✓" : "○"}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      {new Date(t.occurredAt).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {t.authorName ? ` · ${t.authorName}` : ""}
                    </p>
                    <p className="text-sm font-medium text-slate-900">{t.label}</p>
                    {t.detail && <p className="text-xs text-slate-600">{t.detail}</p>}
                  </div>
                </li>
              );
            })}
            {sheet.timeline.length === 0 && (
              <li className="text-sm text-slate-500">Aucun événement pour l’instant.</li>
            )}
          </ol>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-slate-900">Événements agenda liés</h2>
          <ul className="mt-4 space-y-2">
            {sheet.agendaEvents.map((e) => (
              <li key={e.id} className="rounded-lg border border-slate-100 px-3 py-2">
                <p className="text-sm font-semibold text-slate-900">{e.title}</p>
                <p className="text-xs text-slate-500">
                  {e.type} ·{" "}
                  {new Date(e.startAt).toLocaleString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </li>
            ))}
            {sheet.agendaEvents.length === 0 && (
              <li className="text-sm text-slate-500">Aucun événement. Utilisez les actions rapides.</li>
            )}
          </ul>
          {sheet.notes && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <p className="text-[10px] font-bold uppercase text-slate-500">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{sheet.notes}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
