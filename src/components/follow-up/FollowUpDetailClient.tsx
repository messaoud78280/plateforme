"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import {
  DEFAULT_REMINDER_OFFSETS_HOURS,
  POSTIT_COLORS,
  STATUS_LABELS,
  URGENCY_LABELS,
  URGENCY_STYLES,
} from "@/lib/follow-up/types";
import { FollowUpMessagerieLink } from "@/components/messagerie/MessagerieContextLinks";

type TeamUser = { id: string; name: string; email: string };

type AttentionSerialized = {
  effectiveUrgency: string;
  computedUrgency: string;
  manualUrgency: string | null;
  primaryReason: string | null;
  attentionItems: { code: string; level: string; reason: string }[];
};

type Sheet = {
  id: string;
  title: string;
  clientName: string | null;
  osNumber: string | null;
  orderNumber: string | null;
  workObject: string | null;
  siteAddress: string | null;
  amountHt: number | null;
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
  reminderOffsets: unknown;
  assigneeId: string | null;
  assignee: { id: string; name: string } | null;
  projectId: string | null;
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
  attention?: AttentionSerialized | null;
};

const QUICK_EVENTS = [
  { type: "INTERVENTION", label: "Programmer une intervention" },
  { type: "COMMANDE", label: "Ajouter une commande" },
  { type: "LIVRAISON", label: "Ajouter une livraison" },
  { type: "RDV_CLIENT", label: "Ajouter un rendez-vous" },
  { type: "FACTURATION", label: "Préparer facturation" },
  { type: "ECHEANCE", label: "Ajouter une relance" },
] as const;

const REMINDER_PRESETS = [
  { hours: 168, label: "7 j" },
  { hours: 72, label: "3 j" },
  { hours: 24, label: "24 h" },
  { hours: 2, label: "2 h" },
];

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function FollowUpDetailClient({ sheet: initial }: { sheet: Sheet }) {
  const router = useRouter();
  const [sheet, setSheet] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [postponeOpen, setPostponeOpen] = useState(false);
  const [customDate, setCustomDate] = useState("");
  const [nextDraft, setNextDraft] = useState(sheet.nextAction ?? "");
  const [nextAtDraft, setNextAtDraft] = useState(toLocalInput(sheet.nextActionAt));
  const [team, setTeam] = useState<TeamUser[]>([]);
  const [edit, setEdit] = useState({
    title: sheet.title,
    clientName: sheet.clientName ?? "",
    workObject: sheet.workObject ?? "",
    siteAddress: sheet.siteAddress ?? "",
    osNumber: sheet.osNumber ?? "",
    orderNumber: sheet.orderNumber ?? "",
    notes: sheet.notes ?? "",
    amountHt: sheet.amountHt != null ? String(sheet.amountHt) : "",
    assigneeId: sheet.assigneeId ?? "",
    status: sheet.status,
  });
  const [reminders, setReminders] = useState<number[]>(
    Array.isArray(sheet.reminderOffsets)
      ? (sheet.reminderOffsets as number[])
      : [...DEFAULT_REMINDER_OFFSETS_HOURS],
  );
  const [suggestions, setSuggestions] = useState<
    { label: string; nextStatus?: string; dueInDays: number }[] | null
  >(null);

  const color = POSTIT_COLORS[sheet.colorKey] ?? POSTIT_COLORS.jaune;
  const effectiveUrgency =
    (sheet.attention?.effectiveUrgency as keyof typeof URGENCY_STYLES | undefined) ??
    (sheet.urgency as keyof typeof URGENCY_STYLES);
  const urgency = URGENCY_STYLES[effectiveUrgency] ?? URGENCY_STYLES.NORMAL;
  const urgencyLabel =
    URGENCY_LABELS[effectiveUrgency as keyof typeof URGENCY_LABELS] ?? sheet.urgencyLabel;
  const attention = sheet.attention;
  const showAttention =
    attention &&
    attention.effectiveUrgency !== "NORMAL" &&
    (attention.primaryReason || attention.attentionItems.length > 0);

  useEffect(() => {
    void fetch("/api/follow-up/options")
      .then((r) => r.json())
      .then((d) => setTeam(Array.isArray(d.teamUsers) ? d.teamUsers : []));
  }, []);

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
        if (payload.action === "done" && data.needsNextAction && Array.isArray(data.suggestions)) {
          setSuggestions(data.suggestions);
          setSheet({ ...sheet, nextActionDone: true });
        } else {
          const next = data.sheet ?? data;
          setSheet(next);
          setNextDraft(next.nextAction ?? "");
          setNextAtDraft(toLocalInput(next.nextActionAt));
          setSuggestions(null);
        }
        router.refresh();
      }
    } finally {
      setBusy(false);
      setPostponeOpen(false);
    }
  }

  async function savePatch(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/follow-up/${sheet.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setSheet(data);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/dashboard/fiches-suivi" className="text-sm font-semibold text-[#1e3a5f]">
          ← Fiches de suivi
        </Link>
        <Link
          href="/dashboard/agenda"
          className="text-xs font-semibold text-slate-600 hover:underline"
        >
          Ouvrir l’agenda
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
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{sheet.title}</h1>
            <p className="mt-1 text-sm text-slate-700">
              {sheet.osNumber ? `OS n°${sheet.osNumber}` : null}
              {sheet.osNumber && sheet.orderNumber ? " · " : null}
              {sheet.orderNumber ? `Commande ${sheet.orderNumber}` : null}
            </p>
            {sheet.workObject && <p className="mt-2 text-sm text-slate-800">{sheet.workObject}</p>}
            {sheet.siteAddress && <p className="mt-1 text-xs text-slate-600">{sheet.siteAddress}</p>}
          </div>
          <FollowUpMessagerieLink projectId={sheet.projectId} />
        </div>

        {/* Infos essentielles — visibles immédiatement */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg bg-white/85 p-3 ring-1 ring-slate-200/60">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Statut</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{sheet.statusLabel}</p>
          </div>
          <div className="rounded-lg bg-white/85 p-3 ring-1 ring-slate-200/60">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Urgence</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm font-bold text-slate-900">
              <span className={cn("h-2 w-2 rounded-full", urgency.dot)} aria-hidden />
              {urgencyLabel}
            </p>
          </div>
          <div className="rounded-lg bg-white/85 p-3 ring-1 ring-slate-200/60 sm:col-span-2 lg:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Prochaine action
            </p>
            <p className="mt-1 text-sm font-bold text-slate-900">
              {sheet.nextActionDone ? "Terminée" : sheet.nextAction || "—"}
            </p>
          </div>
          <div className="rounded-lg bg-white/85 p-3 ring-1 ring-slate-200/60">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Responsable</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{sheet.assignee?.name ?? "—"}</p>
          </div>
          <div className="rounded-lg bg-white/85 p-3 ring-1 ring-slate-200/60">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Échéance</p>
            <p className="mt-1 text-sm font-bold text-slate-900">{sheet.nextActionAtLabel}</p>
            {sheet.delayLabel ? (
              <p className="mt-0.5 text-xs font-bold text-red-700">En retard de {sheet.delayLabel}</p>
            ) : null}
          </div>
        </div>

        {showAttention ? (
          <div className="mt-3 rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900/70">
              Pourquoi BeWork alerte
            </p>
            <p className="mt-1 text-sm font-medium text-slate-900">{attention.primaryReason}</p>
            {attention.attentionItems.length > 1 ? (
              <ul className="mt-1.5 space-y-0.5 text-[11px] text-slate-600">
                {attention.attentionItems.slice(1, 4).map((it) => (
                  <li key={it.code + it.reason}>· {it.reason}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
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
          <button
            type="button"
            disabled={busy}
            onClick={() => runAction({ action: "mark_piece_recue" })}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50"
          >
            Pièce reçue
          </button>
          {postponeOpen && (
            <div className="flex w-full flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
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
              <label className="space-y-1 text-xs">
                <span className="font-semibold text-slate-600">Choisir une date</span>
                <input
                  type="datetime-local"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="block rounded-md border border-slate-200 px-2 py-1.5 text-xs"
                />
              </label>
              <button
                type="button"
                disabled={busy || !customDate}
                onClick={() =>
                  runAction({
                    action: "postpone",
                    postpone: "custom",
                    customDate: new Date(customDate).toISOString(),
                  })
                }
                className="rounded-md bg-[#1e3a5f] px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
              >
                Reporter à cette date
              </button>
            </div>
          )}
        </section>
      )}

      {suggestions ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
          <h2 className="text-sm font-bold text-emerald-950">Action terminée — quelle suite ?</h2>
          <p className="mt-1 text-xs text-emerald-900/80">
            Sans prochaine action, BeWork ne pourra plus vous alerter. Choisissez une suite :
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s.label}
                type="button"
                disabled={busy}
                onClick={() => {
                  const due = new Date();
                  due.setDate(due.getDate() + (s.dueInDays ?? 1));
                  due.setHours(9, 0, 0, 0);
                  void (async () => {
                    await runAction({
                      action: "set_next",
                      nextAction: s.label,
                      nextActionAt: due.toISOString(),
                    });
                    if (s.nextStatus) {
                      await runAction({ action: "quick_status", status: s.nextStatus });
                    }
                    setSuggestions(null);
                  })();
                }}
                className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-emerald-200"
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold text-slate-900">Prochaine action</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            value={nextDraft}
            onChange={(e) => setNextDraft(e.target.value)}
            className="min-w-[200px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
            placeholder="Ex. Commander membrane EPDM"
          />
          <input
            type="datetime-local"
            value={nextAtDraft}
            onChange={(e) => setNextAtDraft(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy || !nextDraft.trim()}
            onClick={() =>
              runAction({
                action: "set_next",
                nextAction: nextDraft.trim(),
                nextActionAt: nextAtDraft ? new Date(nextAtDraft).toISOString() : undefined,
              })
            }
            className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
          >
            Enregistrer
          </button>
        </div>
        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase text-slate-500">Rappels avant échéance</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {REMINDER_PRESETS.map((p) => {
              const on = reminders.includes(p.hours);
              return (
                <button
                  key={p.hours}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const next = on
                      ? reminders.filter((h) => h !== p.hours)
                      : [...reminders, p.hours].sort((a, b) => b - a);
                    setReminders(next);
                    void savePatch({ reminderOffsets: next });
                  }}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-semibold",
                    on ? "bg-[#1e3a5f] text-white" : "bg-slate-100 text-slate-700",
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-bold text-slate-900">Compléter la fiche</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs">
            <span className="font-semibold text-slate-600">Titre / chantier</span>
            <input
              value={edit.title}
              onChange={(e) => setEdit({ ...edit, title: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-semibold text-slate-600">Client</span>
            <input
              value={edit.clientName}
              onChange={(e) => setEdit({ ...edit, clientName: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs sm:col-span-2">
            <span className="font-semibold text-slate-600">Objet des travaux</span>
            <input
              value={edit.workObject}
              onChange={(e) => setEdit({ ...edit, workObject: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-semibold text-slate-600">N° OS</span>
            <input
              value={edit.osNumber}
              onChange={(e) => setEdit({ ...edit, osNumber: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-semibold text-slate-600">N° commande</span>
            <input
              value={edit.orderNumber}
              onChange={(e) => setEdit({ ...edit, orderNumber: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-semibold text-slate-600">Montant HT (€)</span>
            <input
              type="number"
              value={edit.amountHt}
              onChange={(e) => setEdit({ ...edit, amountHt: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-semibold text-slate-600">Responsable</span>
            <select
              value={edit.assigneeId}
              onChange={(e) => setEdit({ ...edit, assigneeId: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {team.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs sm:col-span-2">
            <span className="font-semibold text-slate-600">Adresse</span>
            <input
              value={edit.siteAddress}
              onChange={(e) => setEdit({ ...edit, siteAddress: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1 text-xs sm:col-span-2">
            <span className="font-semibold text-slate-600">Statut</span>
            <select
              value={edit.status}
              onChange={(e) => setEdit({ ...edit, status: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-xs sm:col-span-2">
            <span className="font-semibold text-slate-600">Notes</span>
            <textarea
              value={edit.notes}
              onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void savePatch({
              title: edit.title,
              clientName: edit.clientName || null,
              workObject: edit.workObject || null,
              siteAddress: edit.siteAddress || null,
              osNumber: edit.osNumber || null,
              orderNumber: edit.orderNumber || null,
              notes: edit.notes || null,
              amountHt: edit.amountHt === "" ? null : Number(edit.amountHt),
              assigneeId: edit.assigneeId || null,
              status: edit.status,
            })
          }
          className="mt-3 rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          Enregistrer la fiche
        </button>
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
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-bold text-slate-900">Chronologie</h2>
          <p className="mt-1 text-xs text-slate-500">L’histoire du dossier, dans l’ordre.</p>
          <ol className="mt-4 space-y-0">
            {sheet.timeline.map((t, idx) => {
              const d = new Date(t.occurredAt);
              const dayLabel = d.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
              });
              const prev = idx > 0 ? new Date(sheet.timeline[idx - 1]!.occurredAt) : null;
              const prevDay = prev
                ? prev.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
                : null;
              const showDay = dayLabel !== prevDay;
              return (
                <li key={t.id}>
                  {showDay ? (
                    <p className="mb-2 mt-4 first:mt-0 text-[11px] font-bold uppercase tracking-wide text-[#1e3a5f]">
                      {dayLabel}
                    </p>
                  ) : null}
                  <div className="mb-3 flex gap-3 border-l-2 border-slate-100 pl-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{t.label}</p>
                      {t.detail ? <p className="mt-0.5 text-xs text-slate-600">{t.detail}</p> : null}
                      {t.authorName ? (
                        <p className="mt-0.5 text-[11px] text-slate-400">{t.authorName}</p>
                      ) : null}
                    </div>
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
          <h2 className="text-sm font-bold text-slate-900">Agenda lié</h2>
          <ul className="mt-4 space-y-2">
            {sheet.agendaEvents.map((e) => (
              <li key={e.id}>
                <Link
                  href="/dashboard/agenda"
                  className="block rounded-lg border border-slate-100 px-3 py-2 transition hover:border-[#1e3a5f]/30 hover:bg-slate-50"
                >
                  <p className="text-sm font-semibold text-slate-900">{e.title}</p>
                  <p className="text-xs text-slate-500">
                    {e.type === "LIVRAISON"
                      ? "Livraison"
                      : e.type === "INTERVENTION"
                        ? "Intervention"
                        : e.type}{" "}
                    ·{" "}
                    {new Date(e.startAt).toLocaleString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </Link>
              </li>
            ))}
            {sheet.agendaEvents.length === 0 && (
              <li className="text-sm text-slate-500">Aucun événement. Utilisez les actions rapides.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
