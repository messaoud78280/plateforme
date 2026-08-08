"use client";

import Link from "next/link";
import {
  addMonths,
  formatMonthYear,
  formatTime,
  isSameDay,
  isSameMonth,
  monthGrid,
  startOfMonth,
} from "@/lib/agenda/dates";
import {
  AGENDA_REMINDER_OPTIONS,
  agendaTypeMeta,
} from "@/lib/agenda/types";
import { AGENDA_STATUS_LABELS } from "@/lib/agenda/serialize-event";
import { URGENCY_STYLES } from "@/lib/follow-up/types";
import type { AgendaEventDTO } from "./agenda-types";

type Props = {
  cursor: Date;
  selectedEvent: AgendaEventDTO | null;
  currentUserId?: string;
  todayEvents?: AgendaEventDTO[];
  conflictWarning?: string | null;
  onCursorChange: (d: Date) => void;
  onSelectDay: (d: Date) => void;
  onSelectEvent?: (id: string) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRsvp?: (status: "ACCEPTE" | "REFUSE") => void;
  onStatusChange?: (status: "PLANIFIE" | "CONFIRME" | "TERMINE" | "ANNULE") => void;
};

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function deliveryStatusLabel(ev: AgendaEventDTO): string {
  if (ev.deliveryVisual === "PROPOSITION") return "Proposition fournisseur";
  if (ev.deliveryVisual === "A_CONFIRMER") return "À confirmer";
  if (ev.deliveryVisual === "CONFIRMEE" || ev.status === "CONFIRME") return "Confirmée";
  if (ev.status === "TERMINE") return "Réceptionnée / terminée";
  return AGENDA_STATUS_LABELS[ev.status] ?? ev.status;
}

export function AgendaSidePanel({
  cursor,
  selectedEvent,
  currentUserId,
  todayEvents = [],
  conflictWarning = null,
  onCursorChange,
  onSelectDay,
  onSelectEvent,
  onEdit,
  onDuplicate,
  onDelete,
  onRsvp,
  onStatusChange,
}: Props) {
  const month = startOfMonth(cursor);
  const days = monthGrid(cursor);
  const today = new Date();

  const meta = selectedEvent ? agendaTypeMeta(selectedEvent.type) : null;
  const start = selectedEvent ? new Date(selectedEvent.startAt) : null;
  const end = selectedEvent ? new Date(selectedEvent.endAt) : null;

  const reminderLabel =
    selectedEvent?.reminderMinutes != null
      ? AGENDA_REMINDER_OPTIONS.find((o) => o.minutes === selectedEvent.reminderMinutes)?.label ??
        `${selectedEvent.reminderMinutes} min`
      : null;

  const po = selectedEvent?.purchaseOrder;
  const urgencyStyle =
    selectedEvent?.urgency && selectedEvent.urgency !== "NORMAL"
      ? URGENCY_STYLES[selectedEvent.urgency as keyof typeof URGENCY_STYLES]
      : null;

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-l border-slate-200/60 bg-white lg:w-[300px]">
      <div className="border-b border-slate-100 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onCursorChange(addMonths(month, -1))}
            className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
            aria-label="Mois précédent"
          >
            ‹
          </button>
          <p className="text-sm font-semibold capitalize text-[#1e3a5f]">{formatMonthYear(month)}</p>
          <button
            type="button"
            onClick={() => onCursorChange(addMonths(month, 1))}
            className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100"
            aria-label="Mois suivant"
          >
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 gap-0.5 text-center">
          {WEEKDAYS.map((d, i) => (
            <div key={`${d}-${i}`} className="py-1 text-[10px] font-semibold text-slate-400">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const inMonth = isSameMonth(day, month);
            const isToday = isSameDay(day, today);
            const selected = isSameDay(day, cursor);
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelectDay(day)}
                className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                  isToday
                    ? "bg-[#1d4ed8] font-semibold text-white"
                    : selected
                      ? "bg-slate-200 font-semibold text-[#1e3a5f]"
                      : inMonth
                        ? "text-slate-700 hover:bg-slate-100"
                        : "text-slate-300 hover:bg-slate-50"
                }`}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!selectedEvent || !start || !end || !meta ? (
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                Aujourd’hui
              </p>
              <p className="mt-0.5 text-sm font-semibold capitalize text-[#1e3a5f]">
                {today.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
            {todayEvents.length === 0 ? (
              <p className="text-sm text-slate-400">Rien de planifié aujourd’hui.</p>
            ) : (
              <ul className="space-y-1.5">
                {todayEvents.map((ev) => {
                  const s = new Date(ev.startAt);
                  const tMeta = agendaTypeMeta(ev.type);
                  return (
                    <li key={ev.id}>
                      <button
                        type="button"
                        onClick={() => onSelectEvent?.(ev.id)}
                        className="w-full rounded-xl px-2.5 py-2 text-left transition hover:bg-slate-50"
                      >
                        <div className="flex gap-2">
                          <span className="w-11 shrink-0 pt-0.5 text-[11px] font-semibold tabular-nums text-slate-500">
                            {ev.allDay ? "Jour" : formatTime(s)}
                          </span>
                          <span className="min-w-0">
                            <span
                              className="mb-0.5 inline-block rounded px-1 py-px text-[9px] font-bold uppercase tracking-wide"
                              style={{
                                backgroundColor: tMeta.colors.bg,
                                color: tMeta.colors.text,
                              }}
                            >
                              {tMeta.label}
                            </span>
                            <p className="truncate text-sm font-semibold text-slate-900">{ev.title}</p>
                            {ev.responsible?.name ? (
                              <p className="truncate text-[11px] text-slate-500">
                                {ev.responsible.name}
                              </p>
                            ) : null}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="text-[11px] text-slate-400">Sélectionnez un événement pour le contexte.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span
                  className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: meta.colors.bg,
                    color: meta.colors.text,
                    border: `1px solid ${meta.colors.border}`,
                  }}
                >
                  {meta.label}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  {selectedEvent.type === "LIVRAISON"
                    ? deliveryStatusLabel(selectedEvent)
                    : AGENDA_STATUS_LABELS[selectedEvent.status] ?? selectedEvent.status}
                </span>
                {urgencyStyle && selectedEvent.urgencyLabel ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${urgencyStyle.badge}`}
                  >
                    {selectedEvent.urgencyLabel}
                  </span>
                ) : null}
              </div>
              <h3 className="text-base font-semibold leading-snug text-[#1e3a5f]">
                {po?.supplierName && selectedEvent.type === "LIVRAISON"
                  ? po.supplierName
                  : selectedEvent.title}
              </h3>
              {po?.supplierName && selectedEvent.type === "LIVRAISON" ? (
                <p className="mt-0.5 text-xs text-slate-500">{selectedEvent.title}</p>
              ) : null}
            </div>

            {conflictWarning ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] font-medium text-amber-900">
                {conflictWarning}
              </p>
            ) : null}

            <dl className="space-y-2.5 text-sm">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Quand
                </dt>
                <dd className="text-slate-700">
                  {start.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                  <span className="block text-slate-600">
                    {selectedEvent.allDay
                      ? "Journée entière"
                      : `${formatTime(start)} – ${formatTime(end)}`}
                    {selectedEvent.deliveryVisual === "PROPOSITION" && po?.proposedDeliveryAt
                      ? ` · proposé ${formatTime(new Date(po.proposedDeliveryAt))}`
                      : ""}
                  </span>
                </dd>
              </div>

              {selectedEvent.project ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Où / Chantier
                  </dt>
                  <dd>
                    <Link
                      href={`/dashboard/projets/${selectedEvent.project.id}`}
                      className="font-medium text-[#1d4ed8] hover:underline"
                    >
                      {selectedEvent.project.title}
                    </Link>
                    {selectedEvent.location ? (
                      <span className="block text-xs text-slate-500">{selectedEvent.location}</span>
                    ) : selectedEvent.project.siteCity ? (
                      <span className="block text-xs text-slate-500">
                        {selectedEvent.project.siteCity}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ) : selectedEvent.location ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Lieu
                  </dt>
                  <dd className="text-slate-700">{selectedEvent.location}</dd>
                </div>
              ) : null}

              {po ? (
                <>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      Commande
                    </dt>
                    <dd className="font-semibold text-slate-800">{po.number}</dd>
                    {po.linesSummary ? (
                      <dd className="mt-0.5 text-xs text-slate-600">{po.linesSummary}</dd>
                    ) : (
                      <dd className="mt-0.5 text-xs text-slate-500">{po.subject}</dd>
                    )}
                  </div>
                </>
              ) : null}

              {selectedEvent.responsible ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {selectedEvent.type === "LIVRAISON"
                      ? "Responsable réception"
                      : "Responsable"}
                  </dt>
                  <dd className="text-slate-700">
                    {selectedEvent.responsible.name || selectedEvent.responsible.email}
                  </dd>
                </div>
              ) : null}

              {selectedEvent.attendees.length > 0 &&
              selectedEvent.type !== "LIVRAISON" ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Avec qui
                  </dt>
                  <dd className="space-y-0.5 text-slate-700">
                    {selectedEvent.attendees.map((a) => (
                      <div key={a.id}>{a.user.name || a.user.email}</div>
                    ))}
                  </dd>
                </div>
              ) : null}

              {(selectedEvent.followUpSheet || selectedEvent.followUpSheetId) &&
              selectedEvent.type !== "LIVRAISON" ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Fiche de suivi
                  </dt>
                  <dd>
                    <Link
                      href={
                        selectedEvent.href ||
                        `/dashboard/fiches-suivi/${selectedEvent.followUpSheet?.id ?? selectedEvent.followUpSheetId}`
                      }
                      className="font-medium text-[#1d4ed8] hover:underline"
                    >
                      {selectedEvent.followUpSheet?.title ?? "Ouvrir la fiche"}
                    </Link>
                  </dd>
                </div>
              ) : null}

              {reminderLabel && !po ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Rappel
                  </dt>
                  <dd className="text-slate-700">{reminderLabel}</dd>
                </div>
              ) : null}

              {selectedEvent.description && !po ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Description
                  </dt>
                  <dd className="whitespace-pre-wrap text-slate-700">{selectedEvent.description}</dd>
                </div>
              ) : null}
            </dl>

            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {po?.canOpen ? (
                <Link
                  href={`/dashboard/commandes/${po.id}`}
                  className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162d4a]"
                >
                  Voir la commande
                </Link>
              ) : null}
              {po?.canReceive ? (
                <Link
                  href={`/dashboard/commandes/${po.id}/reception`}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                >
                  Réceptionner
                </Link>
              ) : null}
              {selectedEvent.project ? (
                <Link
                  href={`/dashboard/projets/${selectedEvent.project.id}`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Voir le chantier
                </Link>
              ) : null}
              {(selectedEvent.followUpSheet || selectedEvent.followUpSheetId) && !po ? (
                <Link
                  href={
                    selectedEvent.href ||
                    `/dashboard/fiches-suivi/${selectedEvent.followUpSheet?.id ?? selectedEvent.followUpSheetId}`
                  }
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Voir la fiche
                </Link>
              ) : null}
              {po?.legacyTaskId ? (
                <Link
                  href={`/dashboard/messagerie?task=${po.legacyTaskId}`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Message fournisseur
                </Link>
              ) : selectedEvent.sourceMessageHref ? (
                <Link
                  href={selectedEvent.sourceMessageHref}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Voir le message
                </Link>
              ) : null}

              {selectedEvent.readOnly ? (
                selectedEvent.href && !po ? (
                  <Link
                    href={selectedEvent.href}
                    className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162d4a]"
                  >
                    Ouvrir la source
                  </Link>
                ) : null
              ) : (
                <>
                  {onStatusChange && !po ? (
                    <div className="mb-1 flex w-full flex-wrap gap-1.5">
                      {selectedEvent.status !== "TERMINE" ? (
                        <button
                          type="button"
                          onClick={() => onStatusChange("TERMINE")}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                        >
                          Marquer terminé
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {currentUserId &&
                  onRsvp &&
                  !po &&
                  (selectedEvent.attendees.some((a) => a.user.id === currentUserId) ||
                    selectedEvent.responsibleId === currentUserId) ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onRsvp("ACCEPTE")}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                      >
                        Accepter
                      </button>
                      <button
                        type="button"
                        onClick={() => onRsvp("REFUSE")}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Refuser
                      </button>
                    </>
                  ) : null}
                  {!po ? (
                    <>
                      <button
                        type="button"
                        onClick={onEdit}
                        className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162d4a]"
                      >
                        Modifier
                      </button>
                      <button
                        type="button"
                        onClick={onDuplicate}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Dupliquer
                      </button>
                      <button
                        type="button"
                        onClick={onDelete}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Supprimer
                      </button>
                    </>
                  ) : (
                    <Link
                      href={`/dashboard/commandes/${po.id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Modifier la livraison
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
