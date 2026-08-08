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
import type { AgendaEventDTO } from "./agenda-types";

type Props = {
  cursor: Date;
  selectedEvent: AgendaEventDTO | null;
  currentUserId?: string;
  onCursorChange: (d: Date) => void;
  onSelectDay: (d: Date) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRsvp?: (status: "ACCEPTE" | "REFUSE") => void;
};

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

export function AgendaSidePanel({
  cursor,
  selectedEvent,
  currentUserId,
  onCursorChange,
  onSelectDay,
  onEdit,
  onDuplicate,
  onDelete,
  onRsvp,
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

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-slate-200/80 bg-white">
      <div className="border-b border-slate-200/80 p-4">
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
          <p className="text-sm text-slate-400">Aucun événement sélectionné</p>
        ) : (
          <div className="space-y-4">
            <div>
              <div
                className="mb-2 inline-block rounded px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  backgroundColor: meta.colors.bg,
                  color: meta.colors.text,
                  border: `1px solid ${meta.colors.border}`,
                }}
              >
                {meta.label}
              </div>
              <h3 className="text-base font-semibold leading-snug text-[#1e3a5f]">
                {selectedEvent.title}
              </h3>
            </div>

            <dl className="space-y-2.5 text-sm">
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Date
                </dt>
                <dd className="text-slate-700">
                  {start.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Horaire
                </dt>
                <dd className="text-slate-700">
                  {selectedEvent.allDay
                    ? "Journée entière"
                    : `${formatTime(start)} – ${formatTime(end)}`}
                </dd>
              </div>
              {selectedEvent.location ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Lieu
                  </dt>
                  <dd className="text-slate-700">{selectedEvent.location}</dd>
                </div>
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
                    {selectedEvent.project.siteCity ? (
                      <span className="block text-xs text-slate-500">
                        {selectedEvent.project.siteCity}
                      </span>
                    ) : null}
                  </dd>
                </div>
              ) : null}
              {selectedEvent.responsible ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Responsable
                  </dt>
                  <dd className="text-slate-700">
                    {selectedEvent.responsible.name || selectedEvent.responsible.email}
                  </dd>
                </div>
              ) : null}
              {selectedEvent.attendees.length > 0 ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Participants
                  </dt>
                  <dd className="space-y-0.5 text-slate-700">
                    {selectedEvent.attendees.map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-2">
                        <span>{a.user.name || a.user.email}</span>
                        <span className="text-[10px] font-semibold uppercase text-slate-400">
                          {a.status === "ACCEPTE"
                            ? "Accepté"
                            : a.status === "REFUSE"
                              ? "Refusé"
                              : "En attente"}
                        </span>
                      </div>
                    ))}
                  </dd>
                </div>
              ) : null}
              {reminderLabel ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Rappel
                  </dt>
                  <dd className="text-slate-700">{reminderLabel}</dd>
                </div>
              ) : null}
              {selectedEvent.description ? (
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Description
                  </dt>
                  <dd className="whitespace-pre-wrap text-slate-700">{selectedEvent.description}</dd>
                </div>
              ) : null}
            </dl>

            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {selectedEvent.readOnly ? (
                selectedEvent.href ? (
                  <Link
                    href={selectedEvent.href}
                    className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162d4a]"
                  >
                    Ouvrir la source
                  </Link>
                ) : (
                  <p className="text-xs text-slate-500">Échéance liée — non modifiable ici</p>
                )
              ) : (
                <>
                  {currentUserId &&
                  onRsvp &&
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
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
