"use client";

import {
  formatMonthYear,
  isSameDay,
  isSameMonth,
  monthGrid,
  startOfMonth,
} from "@/lib/agenda/dates";
import { agendaEventCardLines } from "@/lib/agenda/event-card";
import { agendaTypeMeta } from "@/lib/agenda/types";
import type { AgendaEventDTO, AgendaQuickCreateDraft } from "./agenda-types";

type Props = {
  cursor: Date;
  events: AgendaEventDTO[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  onOpenDay: (d: Date) => void;
  onQuickCreate: (draft: AgendaQuickCreateDraft) => void;
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function AgendaMonthView({
  cursor,
  events,
  selectedEventId,
  onSelectEvent,
  onOpenDay,
  onQuickCreate,
}: Props) {
  const days = monthGrid(cursor);
  const month = startOfMonth(cursor);
  const today = new Date();

  function eventsForDay(day: Date) {
    return events.filter((ev) => {
      const s = new Date(ev.startAt);
      const e = new Date(ev.endAt);
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      return s <= dayEnd && e >= dayStart;
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="grid grid-cols-7 border-b border-slate-200/80">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 grid-rows-6">
        {days.map((day) => {
          const dayEvents = eventsForDay(day);
          const visible = dayEvents.slice(0, 3);
          const more = dayEvents.length - visible.length;
          const inMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-0 border-b border-r border-slate-100 p-1.5 ${
                inMonth ? (isToday ? "bg-[#1e3a5f]/[0.03]" : "bg-white") : "bg-slate-50/60"
              }`}
              onClick={() => onOpenDay(day)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                const start = new Date(day);
                start.setHours(9, 0, 0, 0);
                const end = new Date(day);
                end.setHours(10, 0, 0, 0);
                onQuickCreate({ startAt: start.toISOString(), endAt: end.toISOString() });
              }}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? "bg-[#1e3a5f] font-semibold text-white"
                      : inMonth
                        ? "text-slate-700"
                        : "text-slate-300"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
              <div className="space-y-0.5">
                {visible.map((ev) => {
                  const meta = agendaTypeMeta(ev.type);
                  const selected = ev.id === selectedEventId;
                  const lines = agendaEventCardLines(ev);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev.id);
                      }}
                      className={`block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium ${
                        selected ? "ring-1 ring-[#1d4ed8]" : ""
                      } ${lines.done ? "opacity-50" : ""} ${
                        lines.unconfirmed ? "border border-dashed border-orange-400/60" : ""
                      }`}
                      style={{
                        backgroundColor: meta.colors.bg,
                        color: meta.colors.text,
                        borderLeft: `2px solid ${meta.colors.border}`,
                      }}
                      title={`${lines.eyebrow} — ${lines.title}${lines.meta ? ` · ${lines.meta}` : ""}`}
                    >
                      {lines.done ? "✓ " : lines.unconfirmed ? "… " : ""}
                      {ev.type === "LIVRAISON" && ev.purchaseOrder?.supplierName
                        ? ev.purchaseOrder.supplierName
                        : ev.title}
                    </button>
                  );
                })}
                {more > 0 ? (
                  <p className="px-1 text-[10px] font-medium text-slate-400">+{more} autres</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className="sr-only">{formatMonthYear(cursor)}</p>
    </div>
  );
}
