"use client";

import { useMemo } from "react";
import {
  isSameDay,
  isSameMonth,
  isoWeekLabel,
  monthGrid,
  startOfMonth,
} from "@/lib/agenda/dates";
import { dayActivityIndex, dayKey } from "@/lib/agenda/period-summary";
import { agendaTypeMeta } from "@/lib/agenda/types";
import type { AgendaEventDTO } from "./agenda-types";

type Props = {
  cursor: Date;
  events: AgendaEventDTO[];
  selectedDay: Date;
  onOpenMonth: (d: Date) => void;
  onSelectDay: (d: Date) => void;
  onOpenDay: (d: Date) => void;
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

const TYPE_DOT: Record<string, string> = {
  LIVRAISON: "#f97316",
  INTERVENTION: "#10b981",
  VISITE_CHANTIER: "#10b981",
  REUNION_CHANTIER: "#3b82f6",
  RDV_CLIENT: "#3b82f6",
  RDV_FOURNISSEUR: "#f97316",
  ECHEANCE: "#ef4444",
  SITUATION: "#ef4444",
};

function MiniMonth({
  year,
  monthIndex,
  activity,
  selectedDay,
  onOpenMonth,
  onSelectDay,
  onOpenDay,
}: {
  year: number;
  monthIndex: number;
  activity: Map<string, { count: number; types: Set<string> }>;
  selectedDay: Date;
  onOpenMonth: (d: Date) => void;
  onSelectDay: (d: Date) => void;
  onOpenDay: (d: Date) => void;
}) {
  const monthDate = new Date(year, monthIndex, 1);
  const days = monthGrid(monthDate);
  const month = startOfMonth(monthDate);
  const today = new Date();
  const weekLabel = isoWeekLabel(days[0]!);

  return (
    <div className="rounded-2xl p-3 transition-colors hover:bg-slate-50/80">
      <button
        type="button"
        onClick={() => onOpenMonth(monthDate)}
        className="mb-2 flex w-full items-center justify-between text-left"
      >
        <span className="text-sm font-semibold capitalize text-[#1e3a5f] hover:underline">
          {MONTH_NAMES[monthIndex]}
        </span>
        <span className="text-[10px] font-medium text-slate-300">{weekLabel}</span>
      </button>
      <div className="grid grid-cols-7 gap-0 text-center">
        {WEEKDAYS.map((d, i) => (
          <div key={`${d}-${i}`} className="py-0.5 text-[9px] font-semibold text-slate-300">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const isToday = inMonth && isSameDay(day, today);
          const selected = inMonth && isSameDay(day, selectedDay);
          const info = inMonth ? activity.get(dayKey(day)) : undefined;
          const count = info?.count ?? 0;
          const typeColors = info
            ? Array.from(info.types)
                .slice(0, 3)
                .map((t) => TYPE_DOT[t] ?? agendaTypeMeta(t).colors.border)
            : [];

          return (
            <button
              type="button"
              key={day.toISOString()}
              disabled={!inMonth}
              onClick={() => {
                if (!inMonth) return;
                onSelectDay(day);
              }}
              onDoubleClick={() => {
                if (!inMonth) return;
                onOpenDay(day);
              }}
              className={`relative flex h-7 flex-col items-center justify-start rounded-md pt-0.5 text-[10px] transition-colors ${
                !inMonth
                  ? "cursor-default text-transparent"
                  : isToday
                    ? "font-semibold text-white"
                    : selected
                      ? "bg-slate-100 font-semibold text-[#1e3a5f]"
                      : "text-slate-600 hover:bg-slate-100/80"
              }`}
            >
              {isToday ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1e3a5f]">
                  {day.getDate()}
                </span>
              ) : (
                <span className={inMonth ? "" : "invisible"}>{day.getDate()}</span>
              )}
              {inMonth && count > 0 ? (
                <span className="mt-0.5 flex h-1.5 items-center justify-center gap-0.5">
                  {count === 1 ? (
                    <span
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: typeColors[0] ?? "#1d4ed8" }}
                    />
                  ) : count === 2 ? (
                    <>
                      <span
                        className="h-1 w-1 rounded-full"
                        style={{ backgroundColor: typeColors[0] ?? "#1d4ed8" }}
                      />
                      <span
                        className="h-1 w-1 rounded-full"
                        style={{ backgroundColor: typeColors[1] ?? "#64748b" }}
                      />
                    </>
                  ) : (
                    <span className="text-[8px] font-semibold leading-none text-slate-400">
                      +{count}
                    </span>
                  )}
                </span>
              ) : (
                <span className="h-1.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function AgendaYearView({
  cursor,
  events,
  selectedDay,
  onOpenMonth,
  onSelectDay,
  onOpenDay,
}: Props) {
  const year = cursor.getFullYear();
  const activity = useMemo(() => dayActivityIndex(events), [events]);

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-4">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 12 }, (_, i) => (
          <MiniMonth
            key={i}
            year={year}
            monthIndex={i}
            activity={activity}
            selectedDay={selectedDay}
            onOpenMonth={onOpenMonth}
            onSelectDay={onSelectDay}
            onOpenDay={onOpenDay}
          />
        ))}
      </div>
    </div>
  );
}
