"use client";

import { useMemo } from "react";
import {
  formatMonthYear,
  formatTime,
  isSameDay,
  isSameMonth,
  isWeekend,
  isoWeekLabel,
  monthGrid,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "@/lib/agenda/dates";
import { agendaEventCardLines } from "@/lib/agenda/event-card";
import { eventsForDay } from "@/lib/agenda/period-summary";
import { agendaTypeMeta } from "@/lib/agenda/types";
import type { AgendaZoomLevel } from "@/lib/agenda/zoom";
import { agendaMonthMaxEvents } from "@/lib/agenda/zoom";
import type { AgendaEventDTO, AgendaQuickCreateDraft } from "./agenda-types";

type Props = {
  cursor: Date;
  events: AgendaEventDTO[];
  selectedEventId: string | null;
  selectedDay: Date;
  zoom?: AgendaZoomLevel;
  onSelectEvent: (id: string) => void;
  onSelectDay: (d: Date) => void;
  onOpenDay: (d: Date) => void;
  onQuickCreate: (draft: AgendaQuickCreateDraft) => void;
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function AgendaMonthView({
  cursor,
  events,
  selectedEventId,
  selectedDay,
  zoom = 100,
  onSelectEvent,
  onSelectDay,
  onOpenDay,
  onQuickCreate,
}: Props) {
  const days = monthGrid(cursor);
  const month = startOfMonth(cursor);
  const today = new Date();
  const maxVisible = agendaMonthMaxEvents(zoom);
  const weeks = useMemo(() => {
    const rows: Date[][] = [];
    for (let i = 0; i < 6; i++) rows.push(days.slice(i * 7, i * 7 + 7));
    return rows;
  }, [days]);

  /** Liste mobile lisible */
  const monthDaysWithEvents = useMemo(() => {
    const list: { day: Date; items: AgendaEventDTO[] }[] = [];
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    for (let d = new Date(month); d <= end; d.setDate(d.getDate() + 1)) {
      const day = startOfDay(d);
      const items = eventsForDay(events, day);
      if (items.length) list.push({ day: new Date(day), items });
    }
    return list;
  }, [events, month]);

  const showTwoLines = zoom >= 100;
  const eventFs = zoom >= 120 ? "text-[13px]" : zoom >= 100 ? "text-[12px]" : "text-[11px]";

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Desktop / tablette : grille */}
      <div className="hidden h-full min-h-0 flex-col md:flex">
        <div className="grid grid-cols-[36px_repeat(7,minmax(0,1fr))] border-b border-slate-200">
          <div className="py-2" />
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid flex-1 grid-rows-6">
          {weeks.map((week, wi) => (
            <div
              key={wi}
              className="grid min-h-0 grid-cols-[36px_repeat(7,minmax(0,1fr))] border-b border-slate-200/80"
            >
              <div
                className="flex items-start justify-center pt-2.5 text-[11px] font-semibold tabular-nums text-slate-400"
                title="Semaine ISO"
              >
                {isoWeekLabel(week[0] ?? startOfWeek(month))}
              </div>
              {week.map((day) => {
                const dayEvents = eventsForDay(events, day);
                const visible = dayEvents.slice(0, maxVisible);
                const more = dayEvents.length - visible.length;
                const inMonth = isSameMonth(day, month);
                const isToday = isSameDay(day, today);
                const selected = isSameDay(day, selectedDay);
                const weekend = isWeekend(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-0 border-r border-slate-200/70 p-[var(--agenda-cell-pad,0.35rem)] ${
                      !inMonth
                        ? "bg-slate-50/70"
                        : selected
                          ? "bg-slate-50"
                          : weekend
                            ? "bg-slate-50/40"
                            : "bg-white"
                    }`}
                    onClick={() => onSelectDay(day)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      onOpenDay(day);
                    }}
                  >
                    <div className="mb-1 flex items-center justify-between px-0.5">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[var(--agenda-day-num,0.8125rem)] ${
                          isToday
                            ? "bg-[#1e3a5f] font-bold text-white"
                            : selected
                              ? "font-bold text-[#1e3a5f] ring-2 ring-[#1e3a5f]/35"
                              : inMonth
                                ? "font-semibold text-slate-800"
                                : "font-medium text-slate-300"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {visible.map((ev) => {
                        const meta = agendaTypeMeta(ev.type);
                        const selectedEv = ev.id === selectedEventId;
                        const lines = agendaEventCardLines(ev);
                        const time = ev.allDay ? "" : formatTime(new Date(ev.startAt));
                        const primary =
                          ev.type === "LIVRAISON" && ev.purchaseOrder?.supplierName
                            ? ev.purchaseOrder.supplierName
                            : lines.title;
                        const siteLine = ev.project?.title?.split(/[—–|-]/)[0]?.trim() ?? null;
                        const showSite =
                          Boolean(siteLine) &&
                          (ev.type === "LIVRAISON" ||
                            ev.type === "REUNION_CHANTIER" ||
                            ev.type === "VISITE_CHANTIER" ||
                            ev.type === "INTERVENTION");

                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectEvent(ev.id);
                            }}
                            className={`block w-full rounded-md px-1.5 py-1 text-left shadow-sm transition hover:-translate-y-px hover:shadow ${
                              selectedEv ? "ring-2 ring-[#1d4ed8]/50" : ""
                            } ${lines.done ? "opacity-50" : ""} ${
                              lines.unconfirmed
                                ? "border border-dashed border-orange-400/70"
                                : "border border-transparent"
                            }`}
                            style={{
                              backgroundColor: meta.colors.bg,
                              color: meta.colors.text,
                              borderLeft: `3px solid ${meta.colors.border}`,
                            }}
                            title={`${time ? `${time} · ` : ""}${lines.eyebrow} — ${lines.title}${lines.meta ? ` · ${lines.meta}` : ""}`}
                          >
                            <span className={`block truncate font-semibold leading-tight ${eventFs}`}>
                              {lines.done ? "✓ " : lines.unconfirmed ? "… " : ""}
                              {time ? (
                                <span className="font-bold tabular-nums opacity-90">{time}</span>
                              ) : null}
                              {time ? "  " : ""}
                              {primary}
                            </span>
                            {showTwoLines && showSite ? (
                              <span className="mt-0.5 block truncate text-[11px] font-medium leading-tight opacity-80">
                                {siteLine}
                              </span>
                            ) : showTwoLines && lines.meta && !showSite ? (
                              <span className="mt-0.5 block truncate text-[11px] font-medium leading-tight opacity-80">
                                {lines.meta}
                              </span>
                            ) : null}
                            {showTwoLines && zoom >= 110 && lines.unconfirmed ? (
                              <span className="mt-0.5 block truncate text-[10px] font-semibold text-amber-800/90">
                                À confirmer
                              </span>
                            ) : null}
                          </button>
                        );
                      })}
                      {more > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenDay(day);
                          }}
                          className="w-full rounded-md px-1.5 py-0.5 text-left text-[11px] font-semibold text-[#1e3a5f]/80 underline-offset-2 hover:bg-slate-100 hover:text-[#1e3a5f] hover:underline"
                        >
                          + {more} autres
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile : liste agenda */}
      <div className="flex-1 overflow-y-auto md:hidden">
        {monthDaysWithEvents.length === 0 ? (
          <p className="p-6 text-center text-sm text-slate-400">
            Aucun événement en {formatMonthYear(cursor)}.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {monthDaysWithEvents.map(({ day, items }) => (
              <li key={day.toISOString()} className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => onOpenDay(day)}
                  className="mb-2 text-left text-sm font-semibold capitalize text-[#1e3a5f]"
                >
                  {day.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </button>
                <ul className="space-y-1">
                  {items.slice(0, 4).map((ev) => {
                    const meta = agendaTypeMeta(ev.type);
                    return (
                      <li key={ev.id}>
                        <button
                          type="button"
                          onClick={() => onSelectEvent(ev.id)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50"
                        >
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: meta.colors.border }}
                          />
                          <span className="w-12 shrink-0 text-xs text-slate-400">
                            {ev.allDay ? "Jour" : formatTime(new Date(ev.startAt))}
                          </span>
                          <span className="truncate font-medium text-slate-700">{ev.title}</span>
                        </button>
                      </li>
                    );
                  })}
                  {items.length > 4 ? (
                    <li className="px-2 text-xs text-slate-400">+{items.length - 4} autres</li>
                  ) : null}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="sr-only">{formatMonthYear(cursor)}</p>
      <button
        type="button"
        className="sr-only"
        onClick={() => {
          const start = new Date(selectedDay);
          start.setHours(9, 0, 0, 0);
          const end = new Date(selectedDay);
          end.setHours(10, 0, 0, 0);
          onQuickCreate({ startAt: start.toISOString(), endAt: end.toISOString() });
        }}
      >
        Créer
      </button>
    </div>
  );
}
