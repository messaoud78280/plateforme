"use client";

import { useState } from "react";
import Link from "next/link";
import type { AgendaEventDTO, AgendaView } from "./agenda-types";
import { pickKeyEvents, eventsForDay as eventsOnDay } from "@/lib/agenda/period-summary";
import {
  addDays,
  addMonths,
  formatMonthYear,
  formatTime,
  isSameDay,
  isSameMonth,
  monthGrid,
  startOfMonth,
  startOfWeek,
} from "@/lib/agenda/dates";
import { agendaEventCardLines, isDeliveryUnconfirmed } from "@/lib/agenda/event-card";
import {
  AGENDA_REMINDER_OPTIONS,
  agendaTypeMeta,
} from "@/lib/agenda/types";
import { AGENDA_STATUS_LABELS } from "@/lib/agenda/serialize-event";
import { URGENCY_STYLES } from "@/lib/follow-up/types";

type Props = {
  cursor: Date;
  view?: AgendaView;
  selectedEvent: AgendaEventDTO | null;
  currentUserId?: string;
  todayEvents?: AgendaEventDTO[];
  periodEvents?: AgendaEventDTO[];
  conflictWarning?: string | null;
  onCursorChange: (d: Date) => void;
  onSelectDay: (d: Date) => void;
  onSelectEvent?: (id: string) => void;
  onClearSelection?: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRsvp?: (status: "ACCEPTE" | "REFUSE") => void;
  onStatusChange?: (status: "PLANIFIE" | "CONFIRME" | "TERMINE" | "ANNULE") => void;
};

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const TODAY_MAX = 8;

function deliveryStatusLabel(ev: AgendaEventDTO): string {
  if (ev.deliveryVisual === "PROPOSITION") return "Proposition fournisseur";
  if (ev.deliveryVisual === "A_CONFIRMER") return "À confirmer";
  if (ev.deliveryVisual === "CONFIRMEE" || ev.status === "CONFIRME") return "Confirmée";
  if (ev.status === "TERMINE") return "Réceptionnée / terminée";
  return AGENDA_STATUS_LABELS[ev.status] ?? ev.status;
}

function formatShortDt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AgendaSidePanel({
  cursor,
  view = "day",
  selectedEvent,
  currentUserId,
  todayEvents = [],
  periodEvents = [],
  conflictWarning = null,
  onCursorChange,
  onSelectDay,
  onSelectEvent,
  onClearSelection,
  onEdit,
  onDuplicate,
  onDelete,
  onRsvp,
  onStatusChange,
}: Props) {
  const [miniOpen, setMiniOpen] = useState(false);
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

  const todaySlice = todayEvents.slice(0, TODAY_MAX);
  const panelList =
    view === "year"
      ? pickKeyEvents(periodEvents.length ? periodEvents : todayEvents, 7)
      : view === "month"
        ? pickKeyEvents(
            (periodEvents.length ? periodEvents : todayEvents).filter((ev) => {
              const s = new Date(ev.startAt);
              return s.getMonth() === cursor.getMonth() && s.getFullYear() === cursor.getFullYear();
            }),
            8,
          )
        : view === "week"
          ? (() => {
              const mon = startOfWeek(cursor);
              const sun = addDays(mon, 6);
              sun.setHours(23, 59, 59, 999);
              return (periodEvents.length ? periodEvents : todayEvents)
                .filter((ev) => {
                  const s = new Date(ev.startAt);
                  return s >= mon && s <= sun;
                })
                .slice(0, TODAY_MAX);
            })()
          : isSameDay(cursor, today)
            ? todaySlice
            : eventsOnDay(periodEvents.length ? periodEvents : todayEvents, cursor).slice(0, TODAY_MAX);

  const panelTitle =
    view === "year"
      ? "À venir"
      : view === "month"
        ? `Dates clés — ${formatMonthYear(cursor)}`
        : view === "week"
          ? "Cette semaine"
          : isSameDay(cursor, today)
            ? "Aujourd’hui"
            : "Journée sélectionnée";

  const emptyHint =
    view === "year"
      ? "Aucune date importante à venir dans cette année."
      : view === "month"
        ? "Aucune date clé ce mois-ci."
        : view === "week"
          ? "Rien de planifié cette semaine."
          : isSameDay(cursor, today)
            ? "Rien de planifié aujourd’hui."
            : "Rien de planifié ce jour.";

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-l border-slate-200/60 bg-white lg:w-[280px]">
      {/* Mini calendrier — replié par défaut, poids léger */}
      <div className="border-b border-slate-100 px-3 py-2">
        <button
          type="button"
          onClick={() => setMiniOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left hover:bg-slate-50"
        >
          <span className="text-[11px] font-semibold capitalize text-slate-500">
            {formatMonthYear(month)}
          </span>
          <span className="text-[10px] font-semibold text-slate-400">
            {miniOpen ? "Replier" : "Calendrier"}
          </span>
        </button>
        {miniOpen ? (
          <div className="mt-1 pb-1">
            <div className="mb-1 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onCursorChange(addMonths(month, -1))}
                className="rounded-md px-2 py-0.5 text-slate-400 hover:bg-slate-100"
                aria-label="Mois précédent"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => onCursorChange(addMonths(month, 1))}
                className="rounded-md px-2 py-0.5 text-slate-400 hover:bg-slate-100"
                aria-label="Mois suivant"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0 text-center">
              {WEEKDAYS.map((d, i) => (
                <div key={`${d}-${i}`} className="py-0.5 text-[9px] font-semibold text-slate-400">
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
                    className={`mx-auto flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                      isToday
                        ? "bg-[#1e3a5f] font-semibold text-white"
                        : selected
                          ? "bg-slate-200 font-semibold text-[#1e3a5f]"
                          : inMonth
                            ? "text-slate-600 hover:bg-slate-100"
                            : "text-slate-300"
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {!selectedEvent || !start || !end || !meta ? (
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                {panelTitle}
              </p>
              {view === "day" || view === "week" ? (
                <p className="mt-0.5 text-sm font-semibold capitalize text-[#1e3a5f]">
                  {view === "week"
                    ? `${startOfWeek(cursor).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${addDays(startOfWeek(cursor), 6).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                    : cursor.toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                </p>
              ) : null}
            </div>
            {panelList.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-400">
                {emptyHint}
              </p>
            ) : (
              <ul className="relative space-y-0 border-l border-slate-200 pl-3">
                {panelList.map((ev) => {
                  const s = new Date(ev.startAt);
                  const lines = agendaEventCardLines(ev);
                  const showDate = view === "year" || view === "month";
                  return (
                    <li key={ev.id} className="relative pb-3 last:pb-0">
                      <span className="absolute -left-[15px] top-1.5 h-2 w-2 rounded-full bg-slate-300" />
                      <button
                        type="button"
                        onClick={() => onSelectEvent?.(ev.id)}
                        className={`w-full rounded-lg px-2 py-1.5 text-left transition hover:bg-slate-50 ${
                          lines.done ? "opacity-55" : ""
                        }`}
                      >
                        <div className="flex gap-2">
                          <span className="w-12 shrink-0 text-[11px] font-bold tabular-nums text-slate-500">
                            {showDate
                              ? s.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                              : ev.allDay
                                ? "Jour"
                                : formatTime(s)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              {lines.eyebrow}
                              {isDeliveryUnconfirmed(ev) ? " ⚠" : ""}
                            </span>
                            <span className="block truncate text-sm font-semibold text-slate-900">
                              {lines.title}
                            </span>
                            {lines.meta ? (
                              <span
                                className={`block truncate text-[11px] ${
                                  isDeliveryUnconfirmed(ev)
                                    ? "font-medium text-amber-700"
                                    : "text-slate-500"
                                }`}
                              >
                                {lines.meta}
                              </span>
                            ) : null}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
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
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                      isDeliveryUnconfirmed(selectedEvent)
                        ? "bg-amber-50 text-amber-800 ring-1 ring-dashed ring-amber-300"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {selectedEvent.type === "LIVRAISON"
                      ? deliveryStatusLabel(selectedEvent)
                      : AGENDA_STATUS_LABELS[selectedEvent.status] ?? selectedEvent.status}
                  </span>
                  {urgencyStyle && selectedEvent.urgencyLabel ? (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${urgencyStyle.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${urgencyStyle.dot}`} />
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
              {onClearSelection ? (
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                >
                  Aujourd’hui
                </button>
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

              {po ? (
                <>
                  {formatShortDt(po.requestedDeliveryAt) ? (
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Date demandée
                      </dt>
                      <dd className="text-slate-700">{formatShortDt(po.requestedDeliveryAt)}</dd>
                    </div>
                  ) : null}
                  {formatShortDt(po.confirmedDeliveryAt) ? (
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Date confirmée
                      </dt>
                      <dd className="font-medium text-emerald-800">
                        {formatShortDt(po.confirmedDeliveryAt)}
                      </dd>
                    </div>
                  ) : null}
                </>
              ) : null}

              {selectedEvent.project ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Chantier
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
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Commande / BC
                  </dt>
                  <dd className="font-semibold text-slate-800">{po.number}</dd>
                  {po.supplierName ? (
                    <dd className="text-xs text-slate-600">{po.supplierName}</dd>
                  ) : null}
                  {po.linesSummary ? (
                    <dd className="mt-0.5 text-xs text-slate-600">{po.linesSummary}</dd>
                  ) : (
                    <dd className="mt-0.5 text-xs text-slate-500">{po.subject}</dd>
                  )}
                </div>
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

              {selectedEvent.attendees.length > 0 && selectedEvent.type !== "LIVRAISON" ? (
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

            {/* Liens rapides — uniquement si relation */}
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
              {po?.canReceive ? (
                <Link
                  href={`/dashboard/commandes/${po.id}/reception`}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
                >
                  Réceptionner
                </Link>
              ) : null}
              {po?.canOpen ? (
                <Link
                  href={`/dashboard/commandes/${po.id}`}
                  className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162d4a]"
                >
                  Voir commande
                </Link>
              ) : null}
              {selectedEvent.project ? (
                <Link
                  href={`/dashboard/projets/${selectedEvent.project.id}`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Chantier
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
                  Fiche
                </Link>
              ) : null}
              {po?.canOpen || po?.id ? (
                <Link
                  href={
                    po.id && selectedEvent.project?.id
                      ? `/dashboard/messagerie?view=chantiers&project=${encodeURIComponent(selectedEvent.project.id)}&channel=FOURNISSEUR`
                      : po.legacyTaskId
                        ? `/dashboard/messagerie?task=${po.legacyTaskId}`
                        : `/dashboard/messagerie?view=chantiers&channel=FOURNISSEUR`
                  }
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {po.supplierName
                    ? `💬 Contacter ${po.supplierName}`
                    : "💬 Contacter le fournisseur"}
                </Link>
              ) : selectedEvent.sourceMessageHref ? (
                <Link
                  href={selectedEvent.sourceMessageHref}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Message
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
