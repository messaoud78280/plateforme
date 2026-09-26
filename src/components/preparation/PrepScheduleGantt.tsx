"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import {
  buildGanttBars,
  dayWidthForZoom,
  enumerateCalendarDays,
  halfLabel,
  type GanttZoom,
} from "@/lib/preparation/schedule/gantt-layout";

export type GanttTaskRow = {
  id: string;
  stepCode: string;
  name: string;
  kind: string;
  includeInBase: boolean;
  holdPoint: boolean;
  holdPointStatus: string | null;
  holdPointBlocksNext: boolean;
  conditional: boolean;
  startDate: string | null;
  endDate: string | null;
  startHalf: number;
  endHalf: number;
  durationDays: number;
  durationCalendar: string;
  sellHtSnapshot: number | null;
};

export type GanttDependency = {
  id: string;
  type: string;
  predecessorStepCode: string;
  successorStepCode: string;
};

const LABEL_COL = 220;
const ROW_H = 36;

type Props = {
  tasks: GanttTaskRow[];
  dependencies: GanttDependency[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
};

export function PrepScheduleGantt({
  tasks,
  dependencies,
  selectedTaskId,
  onSelectTask,
}: Props) {
  const [zoom, setZoom] = useState<GanttZoom>("day");

  const dayWidth = dayWidthForZoom(zoom);

  const { days, bars, chartWidth } = useMemo(() => {
    const dated = tasks.filter((t) => t.startDate && t.endDate);
    if (!dated.length) {
      return { days: [], bars: [], chartWidth: 0 };
    }
    const starts = dated.map((t) => t.startDate!);
    const ends = dated.map((t) => t.endDate!);
    const axisStartIso = starts.reduce((a, b) => (a < b ? a : b));
    const axisEnd = ends.reduce((a, b) => (a > b ? a : b));
    const days = enumerateCalendarDays(axisStartIso, axisEnd);
    const bars = buildGanttBars(
      tasks.map((t) => ({
        id: t.id,
        stepCode: t.stepCode,
        startDate: t.startDate,
        endDate: t.endDate,
        startHalf: t.startHalf,
        endHalf: t.endHalf,
        durationDays: t.durationDays,
        durationCalendar: t.durationCalendar,
        kind: t.kind,
        includeInBase: t.includeInBase,
        holdPoint: t.holdPoint,
        conditional: t.conditional,
      })),
      axisStartIso,
      dayWidth,
    );
    return {
      days,
      bars,
      chartWidth: days.length * dayWidth,
    };
  }, [tasks, dayWidth]);

  const barByCode = useMemo(() => {
    const m = new Map<string, (typeof bars)[0]>();
    for (const b of bars) m.set(b.stepCode, b);
    return m;
  }, [bars]);

  const taskByCode = useMemo(() => {
    const m = new Map<string, GanttTaskRow>();
    for (const t of tasks) m.set(t.stepCode, t);
    return m;
  }, [tasks]);

  const connectors = useMemo(() => {
    const lines: Array<{ key: string; d: string; type: string }> = [];
    for (const dep of dependencies) {
      const from = barByCode.get(dep.predecessorStepCode);
      const to = barByCode.get(dep.successorStepCode);
      const fromTask = taskByCode.get(dep.predecessorStepCode);
      const toTask = taskByCode.get(dep.successorStepCode);
      if (!from || !to || !fromTask || !toTask) continue;
      const fromIdx = tasks.findIndex((t) => t.stepCode === dep.predecessorStepCode);
      const toIdx = tasks.findIndex((t) => t.stepCode === dep.successorStepCode);
      if (fromIdx < 0 || toIdx < 0) continue;

      const y1 = fromIdx * ROW_H + ROW_H / 2;
      const y2 = toIdx * ROW_H + ROW_H / 2;
      let x1 = from.leftPx + from.widthPx;
      let x2 = to.leftPx;
      if (dep.type === "SS") {
        x1 = from.leftPx;
        x2 = to.leftPx;
      } else if (dep.type === "FF") {
        x1 = from.leftPx + from.widthPx;
        x2 = to.leftPx + to.widthPx;
      }
      const midX = Math.max(x1, x2) + 10;
      const d =
        Math.abs(y2 - y1) < 2
          ? `M ${x1} ${y1} L ${x2} ${y2}`
          : `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
      lines.push({ key: dep.id, d, type: dep.type });
    }
    return lines;
  }, [dependencies, barByCode, taskByCode, tasks]);

  if (!days.length) {
    return (
      <p className="px-4 py-6 text-[13px] text-slate-500">
        Aucune date à afficher sur le Gantt.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#1e3a5f]/10 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5">
        <h2 className="text-[14px] font-semibold text-[#1e3a5f]">Gantt chantier</h2>
        <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-0.5">
          {([
            ["day", "Jour"],
            ["week", "Semaine"],
            ["month", "Mois"],
          ] as const).map(([z, label]) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoom(z)}
              className={cn(
                "rounded-full px-3 py-1 text-[12px] font-medium transition",
                zoom === z
                  ? "bg-[#1e3a5f] text-white"
                  : "text-slate-600 hover:bg-white",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[min(70vh,720px)] overflow-auto">
        <div style={{ minWidth: LABEL_COL + chartWidth }} className="relative">
          {/* En-tête dates sticky */}
          <div className="sticky top-0 z-20 flex border-b border-slate-200 bg-white/95 backdrop-blur">
            <div
              className="sticky left-0 z-30 shrink-0 border-r border-slate-200 bg-white px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-slate-500"
              style={{ width: LABEL_COL }}
            >
              Intervention
            </div>
            <div className="relative flex" style={{ width: chartWidth }}>
              {days.map((day) => (
                <div
                  key={day.iso}
                  className={cn(
                    "shrink-0 border-r border-slate-100 px-0.5 py-1.5 text-center",
                    (day.isWeekend || day.isHoliday) && "bg-slate-100/80",
                  )}
                  style={{ width: dayWidth }}
                  title={day.iso}
                >
                  <div className="text-[10px] uppercase text-slate-400">{day.weekdayLabel}</div>
                  <div
                    className={cn(
                      "text-[11px] font-medium tabular-nums",
                      day.isWeekend ? "text-slate-400" : "text-slate-700",
                    )}
                  >
                    {zoom === "month" ? day.label.slice(0, 2) : day.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lignes tâches */}
          <div className="relative">
            {/* Fond week-ends */}
            <div
              className="pointer-events-none absolute inset-y-0"
              style={{ left: LABEL_COL, width: chartWidth }}
            >
              {days.map((day, i) =>
                day.isWeekend || day.isHoliday ? (
                  <div
                    key={`bg-${day.iso}`}
                    className="absolute inset-y-0 bg-slate-50"
                    style={{ left: i * dayWidth, width: dayWidth }}
                  />
                ) : null,
              )}
            </div>

            {/* Liens dépendances */}
            <svg
              className="pointer-events-none absolute top-0 z-[5]"
              style={{ left: LABEL_COL, width: chartWidth, height: tasks.length * ROW_H }}
              width={chartWidth}
              height={tasks.length * ROW_H}
            >
              {connectors.map((c) => (
                <g key={c.key}>
                  <path
                    d={c.d}
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth={1.25}
                    strokeDasharray={c.type === "FS" ? undefined : "4 3"}
                    markerEnd="url(#gantt-arrow)"
                  />
                </g>
              ))}
              <defs>
                <marker
                  id="gantt-arrow"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L6,3 L0,6 Z" fill="#94a3b8" />
                </marker>
              </defs>
            </svg>

            {tasks.map((t) => {
              const bar = bars.find((b) => b.taskId === t.id);
              return (
                <div
                  key={t.id}
                  className={cn(
                    "relative flex border-b border-slate-50",
                    selectedTaskId === t.id && "bg-[#1e3a5f]/[0.03]",
                  )}
                  style={{ height: ROW_H }}
                >
                  <button
                    type="button"
                    onClick={() => onSelectTask(t.id)}
                    className="sticky left-0 z-10 flex shrink-0 items-center gap-1.5 border-r border-slate-100 bg-white px-2.5 text-left hover:bg-slate-50"
                    style={{ width: LABEL_COL }}
                  >
                    <span className="w-9 shrink-0 font-mono text-[11px] text-slate-500">
                      {t.stepCode}
                    </span>
                    <span className="min-w-0 truncate text-[12px] font-medium text-slate-800">
                      {t.name}
                    </span>
                    {t.holdPoint ? (
                      <span className="shrink-0 rounded bg-amber-100 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-900">
                        Arrêt
                      </span>
                    ) : null}
                    {t.conditional ? (
                      <span className="shrink-0 rounded bg-slate-200 px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-600">
                        Cond.
                      </span>
                    ) : null}
                  </button>

                  <div className="relative" style={{ width: chartWidth, height: ROW_H }}>
                    {bar ? (
                      <button
                        type="button"
                        onClick={() => onSelectTask(t.id)}
                        className={cn(
                          "absolute top-1.5 flex h-7 items-center overflow-hidden rounded px-1.5 text-left text-[10px] font-medium text-white shadow-sm transition",
                          t.conditional
                            ? "border border-dashed border-slate-400 bg-slate-300/90 text-slate-700"
                            : t.kind === "wait"
                              ? "bg-violet-500/90"
                              : t.holdPoint
                                ? "bg-amber-600"
                                : t.kind === "control"
                                  ? "bg-[#3d5a80]"
                                  : "bg-[#1e3a5f]",
                          selectedTaskId === t.id && "ring-2 ring-[#1e3a5f]/40 ring-offset-1",
                        )}
                        style={{ left: bar.leftPx, width: bar.widthPx }}
                        title={`${t.stepCode} · ${t.startDate} (${halfLabel(t.startHalf)}) → ${t.endDate} (${halfLabel(t.endHalf)})`}
                      >
                        <span className="truncate">
                          {t.durationDays} j
                          {t.durationCalendar === "calendar" ? " cal." : ""}
                          {t.conditional ? " · hors base" : ""}
                        </span>
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded bg-[#1e3a5f]" /> Travaux
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded bg-amber-600" /> Point d&apos;arrêt
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded bg-violet-500" /> Attente calendaire
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded border border-dashed border-slate-400 bg-slate-300" />{" "}
          Conditionnel
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-slate-100 border border-slate-200" /> Week-end
        </span>
      </div>
    </div>
  );
}
