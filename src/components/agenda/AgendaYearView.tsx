"use client";

import { isSameDay, isSameMonth, monthGrid, startOfMonth } from "@/lib/agenda/dates";
import type { AgendaEventDTO } from "./agenda-types";

type Props = {
  cursor: Date;
  events: AgendaEventDTO[];
  onOpenMonth: (d: Date) => void;
};

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTH_NAMES = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

function MiniMonth({
  year,
  monthIndex,
  events,
  onOpenMonth,
}: {
  year: number;
  monthIndex: number;
  events: AgendaEventDTO[];
  onOpenMonth: (d: Date) => void;
}) {
  const monthDate = new Date(year, monthIndex, 1);
  const days = monthGrid(monthDate);
  const month = startOfMonth(monthDate);
  const today = new Date();

  function hasEvent(day: Date) {
    return events.some((ev) => {
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
    <button
      type="button"
      onClick={() => onOpenMonth(monthDate)}
      className="rounded-xl p-3 text-left transition-colors hover:bg-slate-50"
    >
      <p className="mb-2 text-sm font-semibold capitalize text-[#1d4ed8]">
        {MONTH_NAMES[monthIndex]}
      </p>
      <div className="grid grid-cols-7 gap-0 text-center">
        {WEEKDAYS.map((d, i) => (
          <div key={`${d}-${i}`} className="py-0.5 text-[9px] font-semibold text-slate-300">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, today);
          const marked = inMonth && hasEvent(day);
          return (
            <div
              key={day.toISOString()}
              className={`relative flex h-5 items-center justify-center text-[10px] ${
                isToday
                  ? "rounded-full bg-[#1d4ed8] font-semibold text-white"
                  : inMonth
                    ? "text-slate-600"
                    : "text-slate-200"
              }`}
            >
              {day.getDate()}
              {marked && !isToday ? (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-0.5 -translate-x-1/2 rounded-full bg-[#1d4ed8]" />
              ) : null}
            </div>
          );
        })}
      </div>
    </button>
  );
}

export function AgendaYearView({ cursor, events, onOpenMonth }: Props) {
  const year = cursor.getFullYear();

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 12 }, (_, i) => (
          <MiniMonth
            key={i}
            year={year}
            monthIndex={i}
            events={events}
            onOpenMonth={onOpenMonth}
          />
        ))}
      </div>
    </div>
  );
}
