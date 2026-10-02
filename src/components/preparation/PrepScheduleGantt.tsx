"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import {
  buildGanttBars,
  dayWidthForZoom,
  enumerateCalendarDays,
  type GanttZoom,
} from "@/lib/preparation/schedule/gantt-layout";
import type {
  PlanningPhaseVM,
  PlanningTaskVM,
} from "@/lib/preparation/schedule/planning-view-model";
import { TruncatedTextWithPopover } from "./TruncatedTextWithPopover";
import { PlanningTaskHoverCard } from "./PlanningTaskHoverCard";

export type GanttDependency = {
  id: string;
  type: string;
  predecessorStepCode: string;
  successorStepCode: string;
};

/** Sticky left: Réf 80 + Intervention ~360 + Équipe 90 + Durée 70 ≈ 600 */
const LABEL_COL = 600;
const ROW_H = 46;
const PHASE_H = 44;
const BAR_H = 20;
const TRANS = "duration-150 ease-out";

type Props = {
  phases: PlanningPhaseVM[];
  tasks: PlanningTaskVM[];
  dependencies: GanttDependency[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
};

function barTone(kind: PlanningTaskVM["visualKind"]): string {
  switch (kind) {
    case "blocked":
      return "bg-red-700 text-white";
    case "incomplete":
      return "bg-amber-600 text-white";
    case "control":
      return "bg-[#3d5a80] text-white";
    case "wait":
      return "bg-slate-400 text-white";
    case "handover":
      return "bg-emerald-700 text-white";
    default:
      return "bg-[#1e3a5f] text-white";
  }
}

function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  const [, m, d] = iso.slice(0, 10).split("-");
  if (!m || !d) return iso.slice(0, 10);
  const months = [
    "jan.",
    "fév.",
    "mars",
    "avr.",
    "mai",
    "juin",
    "juil.",
    "août",
    "sept.",
    "oct.",
    "nov.",
    "déc.",
  ];
  return `${Number(d)} ${months[Number(m) - 1] ?? m}`;
}

function formatDayHeader(iso: string): { wd: string; day: string } {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const wdLabels = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
  const wd = wdLabels[date.getDay()] ?? "";
  return { wd, day: formatShortDate(iso) };
}

function cleanPhaseTitle(label: string): string {
  return label.replace(/^PHASE\s*\d+\s*[—–\-:]\s*/i, "").trim() || label;
}

function barLabel(t: PlanningTaskVM, widthPx: number): string {
  const dur = t.durationLabel;
  if (widthPx < 40) return dur.replace(" j", "");
  if (widthPx < 90) return dur;
  if (t.crewId) return `${t.crewId} · ${dur}`;
  return dur;
}

function todayIso(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isMonday(iso: string): boolean {
  return new Date(`${iso.slice(0, 10)}T12:00:00`).getDay() === 1;
}

type FloatingCard = {
  task: PlanningTaskVM;
  top: number;
  left: number;
  mode: "row" | "bar";
};

export function PrepScheduleGantt({
  phases,
  tasks,
  dependencies,
  selectedTaskId,
  onSelectTask,
}: Props) {
  const [zoom, setZoom] = useState<GanttZoom>("week");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [hoveredPhaseKey, setHoveredPhaseKey] = useState<string | null>(null);
  const [floating, setFloating] = useState<FloatingCard | null>(null);

  const selected = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  const hovered = useMemo(
    () => tasks.find((t) => t.id === hoveredTaskId) ?? null,
    [tasks, hoveredTaskId],
  );

  const focusTask = selected ?? hovered;

  const relatedCodes = useMemo(() => {
    if (!focusTask) return new Set<string>();
    const s = new Set<string>([focusTask.stepCode]);
    for (const d of focusTask.dependsOn) s.add(d.stepId);
    for (const d of focusTask.successors) s.add(d.stepId);
    return s;
  }, [focusTask]);

  const displayRows = useMemo(() => {
    const out: Array<
      | { type: "phase"; phase: PlanningPhaseVM; phaseIndex: number }
      | { type: "task"; task: PlanningTaskVM; phaseKey: string }
    > = [];
    phases.forEach((phase, idx) => {
      const phaseTasks = phase.tasks.filter((t) =>
        tasks.some((x) => x.id === t.id),
      );
      if (!phaseTasks.length) return;
      out.push({
        type: "phase",
        phase: { ...phase, tasks: phaseTasks, taskCount: phaseTasks.length },
        phaseIndex: idx,
      });
      if (!collapsed[phase.key]) {
        for (const t of phaseTasks) {
          out.push({ type: "task", task: t, phaseKey: phase.key });
        }
      }
    });
    return out;
  }, [phases, tasks, collapsed]);

  const taskRows = useMemo(
    () =>
      displayRows
        .filter(
          (r): r is { type: "task"; task: PlanningTaskVM; phaseKey: string } =>
            r.type === "task",
        )
        .map((r) => r.task),
    [displayRows],
  );

  const dayWidth = dayWidthForZoom(zoom);
  const today = todayIso();

  const { days, bars, chartWidth } = useMemo(() => {
    const dated = taskRows.filter((t) => t.startDate && t.endDate);
    if (!dated.length) {
      const allDated = tasks.filter((t) => t.startDate && t.endDate);
      if (!allDated.length) return { days: [], bars: [], chartWidth: 0 };
      const starts = allDated.map((t) => t.startDate!);
      const ends = allDated.map((t) => t.endDate!);
      const axisStartIso = starts.reduce((a, b) => (a < b ? a : b));
      const axisEnd = ends.reduce((a, b) => (a > b ? a : b));
      const days = enumerateCalendarDays(axisStartIso, axisEnd);
      return { days, bars: [], chartWidth: days.length * dayWidth };
    }
    const starts = dated.map((t) => t.startDate!);
    const ends = dated.map((t) => t.endDate!);
    const axisStartIso = starts.reduce((a, b) => (a < b ? a : b));
    const axisEnd = ends.reduce((a, b) => (a > b ? a : b));
    const days = enumerateCalendarDays(axisStartIso, axisEnd);
    const bars = buildGanttBars(
      taskRows.map((t) => ({
        id: t.id,
        stepCode: t.stepCode,
        startDate: t.startDate,
        endDate: t.endDate,
        startHalf: t.startHalf,
        endHalf: t.endHalf,
        durationDays: t.durationDays,
        durationCalendar: t.durationCalendar,
        kind: t.kind,
        includeInBase: true,
        holdPoint: t.holdPoint,
        conditional: t.conditional,
      })),
      axisStartIso,
      dayWidth,
    );
    return { days, bars, chartWidth: days.length * dayWidth };
  }, [taskRows, dayWidth, tasks]);

  const barByCode = useMemo(() => {
    const m = new Map<string, (typeof bars)[0]>();
    for (const b of bars) m.set(b.stepCode, b);
    return m;
  }, [bars]);

  const connectors = useMemo(() => {
    const lines: Array<{
      key: string;
      d: string;
      type: string;
      highlight: boolean;
      muted: boolean;
    }> = [];
    const hasFocus = !!focusTask;
    for (const dep of dependencies) {
      if (dep.type !== "FS" && !hasFocus) continue;
      const from = barByCode.get(dep.predecessorStepCode);
      const to = barByCode.get(dep.successorStepCode);
      if (!from || !to) continue;
      const fromIdx = displayRows.findIndex(
        (r) =>
          r.type === "task" && r.task.stepCode === dep.predecessorStepCode,
      );
      const toIdx = displayRows.findIndex(
        (r) => r.type === "task" && r.task.stepCode === dep.successorStepCode,
      );
      if (fromIdx < 0 || toIdx < 0) continue;
      const highlight =
        hasFocus &&
        (relatedCodes.has(dep.predecessorStepCode) ||
          relatedCodes.has(dep.successorStepCode)) &&
        (focusTask!.stepCode === dep.predecessorStepCode ||
          focusTask!.stepCode === dep.successorStepCode);
      const muted = hasFocus && !highlight;

      const rowY = (idx: number) => {
        let y = 0;
        for (let i = 0; i < idx; i++) {
          y += displayRows[i]!.type === "phase" ? PHASE_H : ROW_H;
        }
        const h = displayRows[idx]!.type === "phase" ? PHASE_H : ROW_H;
        return y + h / 2;
      };
      const yy1 = rowY(fromIdx);
      const yy2 = rowY(toIdx);
      let x1 = from.leftPx + from.widthPx;
      let x2 = to.leftPx;
      if (dep.type === "SS") {
        x1 = from.leftPx;
        x2 = to.leftPx;
      } else if (dep.type === "FF") {
        x1 = from.leftPx + from.widthPx;
        x2 = to.leftPx + to.widthPx;
      }
      const midX = Math.max(x1, x2) + 8;
      const d =
        Math.abs(yy2 - yy1) < 2
          ? `M ${x1} ${yy1} L ${x2} ${yy2}`
          : `M ${x1} ${yy1} L ${midX} ${yy1} L ${midX} ${yy2} L ${x2} ${yy2}`;
      lines.push({ key: dep.id, d, type: dep.type, highlight, muted });
    }
    return lines;
  }, [dependencies, barByCode, displayRows, focusTask, relatedCodes]);

  const totalHeight = displayRows.reduce(
    (s, r) => s + (r.type === "phase" ? PHASE_H : ROW_H),
    0,
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFloating(null);
        setHoveredTaskId(null);
        if (selectedTaskId) onSelectTask(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTaskId, onSelectTask]);

  const openFloating = (
    task: PlanningTaskVM,
    el: HTMLElement,
    mode: "row" | "bar",
  ) => {
    const r = el.getBoundingClientRect();
    const width = 480;
    let left = mode === "bar" ? r.left : r.left + 80;
    if (left + width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - width - 12);
    }
    let top = r.bottom + 8;
    if (top + 280 > window.innerHeight) {
      top = Math.max(12, r.top - 12);
    }
    setFloating({ task, top, left, mode });
  };

  if (!days.length) {
    return (
      <p className="px-4 py-6 text-[13px] text-slate-500">
        Aucune date à afficher sur le Gantt.
      </p>
    );
  }

  const todayIdx = days.findIndex((d) => d.iso === today);

  return (
    <div className="overflow-hidden rounded-xl border border-[#1e3a5f]/12 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <h2 className="text-[13px] font-semibold text-[#1e3a5f]">
          Gantt par phase
        </h2>
        <div
          className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
          role="group"
          aria-label="Échelle du Gantt"
        >
          {(
            [
              ["day", "Jour"],
              ["week", "Semaine"],
              ["month", "Mois"],
            ] as const
          ).map(([z, label]) => (
            <button
              key={z}
              type="button"
              onClick={() => setZoom(z)}
              aria-pressed={zoom === z}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px] font-medium transition",
                TRANS,
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

      <div className="hidden md:block">
        <div
          className="max-h-[min(72vh,720px)] overflow-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) onSelectTask(null);
          }}
        >
          <div style={{ minWidth: LABEL_COL + chartWidth }} className="relative">
            {/* Header sticky */}
            <div className="sticky top-0 z-30 flex border-b border-slate-200 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur">
              <div
                className="sticky left-0 z-40 grid shrink-0 grid-cols-[80px_minmax(0,1fr)_90px_70px] gap-1.5 border-r border-slate-200 bg-white px-2.5 py-2 text-[10px] font-medium uppercase tracking-wide text-slate-500 shadow-[2px_0_6px_-2px_rgba(15,23,42,0.08)]"
                style={{ width: LABEL_COL }}
              >
                <span>Réf.</span>
                <span>Intervention</span>
                <span>Équipe</span>
                <span>Durée</span>
              </div>
              <div className="relative flex" style={{ width: chartWidth }}>
                {days.map((day) => {
                  const h = formatDayHeader(day.iso);
                  const isToday = day.iso === today;
                  return (
                    <div
                      key={day.iso}
                      className={cn(
                        "shrink-0 border-r border-slate-100 px-0.5 py-1.5 text-center",
                        (day.isWeekend || day.isHoliday) && "bg-slate-100/90",
                        isMonday(day.iso) && "border-l border-l-slate-300/80",
                        isToday && "bg-[#1e3a5f]/[0.06]",
                      )}
                      style={{ width: dayWidth }}
                    >
                      <div
                        className={cn(
                          "text-[9px] font-semibold uppercase tracking-wide",
                          isToday ? "text-[#1e3a5f]" : "text-slate-400",
                        )}
                      >
                        {zoom === "month" ? h.wd.slice(0, 1) : h.wd}
                      </div>
                      <div
                        className={cn(
                          "text-[10px] font-medium tabular-nums",
                          day.isWeekend ? "text-slate-400" : "text-slate-700",
                          isToday && "text-[#1e3a5f]",
                        )}
                      >
                        {zoom === "month" ? day.label.slice(0, 2) : h.day}
                      </div>
                      {isToday && zoom !== "month" ? (
                        <div className="mt-0.5 text-[8px] font-medium text-[#1e3a5f]">
                          Aujourd&apos;hui
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {todayIdx >= 0 ? (
                  <div
                    className="pointer-events-none absolute bottom-0 top-0 z-[1] w-px bg-[#1e3a5f]/55"
                    style={{ left: todayIdx * dayWidth + dayWidth / 2 }}
                    aria-hidden
                  />
                ) : null}
              </div>
            </div>

            <div className="relative">
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
                {todayIdx >= 0 ? (
                  <div
                    className="absolute inset-y-0 w-px bg-[#1e3a5f]/40"
                    style={{ left: todayIdx * dayWidth + dayWidth / 2 }}
                  />
                ) : null}
              </div>

              <svg
                className="pointer-events-none absolute top-0 z-[5]"
                style={{
                  left: LABEL_COL,
                  width: chartWidth,
                  height: totalHeight,
                }}
                width={chartWidth}
                height={totalHeight}
                aria-hidden
              >
                {connectors.map((c) => (
                  <path
                    key={c.key}
                    d={c.d}
                    fill="none"
                    stroke={c.highlight ? "#1e3a5f" : "#94a3b8"}
                    strokeWidth={c.highlight ? 2 : 1}
                    strokeOpacity={
                      c.highlight ? 1 : c.muted ? 0.12 : 0.35
                    }
                    className={cn("transition-opacity", TRANS)}
                    markerEnd={
                      c.highlight
                        ? "url(#gantt-arrow-hi)"
                        : c.muted
                          ? undefined
                          : "url(#gantt-arrow)"
                    }
                  />
                ))}
                <defs>
                  <marker
                    id="gantt-arrow"
                    markerWidth="5"
                    markerHeight="5"
                    refX="4"
                    refY="2.5"
                    orient="auto"
                  >
                    <path d="M0,0 L5,2.5 L0,5 Z" fill="#94a3b8" opacity="0.5" />
                  </marker>
                  <marker
                    id="gantt-arrow-hi"
                    markerWidth="6"
                    markerHeight="6"
                    refX="5"
                    refY="3"
                    orient="auto"
                  >
                    <path d="M0,0 L6,3 L0,6 Z" fill="#1e3a5f" />
                  </marker>
                </defs>
              </svg>

              {displayRows.map((row) => {
                if (row.type === "phase") {
                  const p = row.phase;
                  const isCollapsed = !!collapsed[p.key];
                  const num = String(row.phaseIndex + 1).padStart(2, "0");
                  const title = cleanPhaseTitle(p.label);
                  const phaseHover = hoveredPhaseKey === p.key;
                  return (
                    <div
                      key={`phase:${p.key}`}
                      className={cn(
                        "relative flex border-b border-slate-200/80 transition-colors",
                        TRANS,
                        phaseHover
                          ? "bg-[#1e3a5f]/[0.07]"
                          : "bg-[#f7f9fc]",
                      )}
                      style={{ height: PHASE_H }}
                      onMouseEnter={() => setHoveredPhaseKey(p.key)}
                      onMouseLeave={() => setHoveredPhaseKey(null)}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsed((c) => ({
                            ...c,
                            [p.key]: !c[p.key],
                          }))
                        }
                        className="sticky left-0 z-20 flex shrink-0 items-center gap-2.5 border-r border-slate-200 bg-inherit px-2.5 text-left shadow-[2px_0_6px_-2px_rgba(15,23,42,0.06)]"
                        style={{ width: LABEL_COL }}
                        aria-expanded={!isCollapsed}
                        aria-label={`${isCollapsed ? "Déplier" : "Replier"} phase ${title}`}
                      >
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-[11px] font-semibold tabular-nums text-[#1e3a5f] ring-1 ring-[#1e3a5f]/15"
                          aria-hidden
                        >
                          {num}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-semibold text-[#1e3a5f]">
                            {title}
                          </span>
                          <span className="block truncate text-[10px] text-slate-500">
                            {p.taskCount} tâche{p.taskCount > 1 ? "s" : ""}
                            {p.startDate && p.endDate
                              ? ` · ${formatShortDate(p.startDate)} → ${formatShortDate(p.endDate)}`
                              : ""}
                          </span>
                        </span>
                        <span
                          className="shrink-0 text-[10px] text-slate-400"
                          aria-hidden
                        >
                          {isCollapsed ? "▶" : "▼"}
                        </span>
                      </button>
                      <div style={{ width: chartWidth, height: PHASE_H }} />
                    </div>
                  );
                }

                const t = row.task;
                const bar = bars.find((b) => b.taskId === t.id);
                const isSelected = selectedTaskId === t.id;
                const isHovered = hoveredTaskId === t.id;
                const isRelated = relatedCodes.has(t.stepCode);
                const phaseAccent =
                  hoveredPhaseKey != null && row.phaseKey === hoveredPhaseKey;
                const dimmed =
                  (focusTask && !isRelated && !isHovered) ||
                  (hoveredPhaseKey != null &&
                    row.phaseKey !== hoveredPhaseKey &&
                    !isSelected);

                const qtyLine = [
                  t.quantitySnapshot != null ? t.quantityDisplay : null,
                  t.crewId ?? null,
                  t.durationLabel,
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <div
                    key={t.id}
                    className={cn(
                      "group relative flex border-b border-slate-100/90 transition-[background-color,opacity,box-shadow]",
                      TRANS,
                      isSelected && "bg-[#1e3a5f]/[0.07] shadow-[inset_3px_0_0_0_#1e3a5f]",
                      isHovered && !isSelected && "bg-[#1e3a5f]/[0.04]",
                      phaseAccent && !isSelected && "bg-[#1e3a5f]/[0.03]",
                      dimmed && "opacity-[0.38]",
                    )}
                    style={{ height: ROW_H }}
                    onMouseEnter={() => setHoveredTaskId(t.id)}
                    onMouseLeave={() => {
                      setHoveredTaskId((cur) => (cur === t.id ? null : cur));
                      setFloating((f) =>
                        f?.task.id === t.id && f.mode === "row" ? null : f,
                      );
                    }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => onSelectTask(isSelected ? null : t.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectTask(isSelected ? null : t.id);
                        }
                      }}
                      onFocus={() => setHoveredTaskId(t.id)}
                      onMouseEnter={(e) =>
                        openFloating(t, e.currentTarget, "row")
                      }
                      className={cn(
                        "sticky left-0 z-20 grid shrink-0 cursor-pointer grid-cols-[80px_minmax(0,1fr)_90px_70px] items-center gap-1.5 border-r border-slate-100 px-2.5 text-left shadow-[2px_0_6px_-2px_rgba(15,23,42,0.06)] transition-colors",
                        TRANS,
                        isSelected || isHovered
                          ? "bg-[#f3f6fa]"
                          : "bg-white group-hover:bg-[#f8fafc]",
                      )}
                      style={{ width: LABEL_COL }}
                      aria-pressed={isSelected}
                      aria-label={`Tâche ${t.stepCode} ${t.name}`}
                    >
                      <span
                        className={cn(
                          "font-mono text-[10px] tabular-nums transition-colors",
                          TRANS,
                          isSelected || isHovered
                            ? "font-semibold text-[#1e3a5f]"
                            : "text-slate-500",
                        )}
                      >
                        {t.stepCode}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "block truncate text-[12px] font-medium leading-snug transition-colors",
                            TRANS,
                            isSelected || isHovered
                              ? "text-[#0f2744]"
                              : "text-slate-800",
                          )}
                        >
                          {t.name}
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-slate-400">
                          {qtyLine}
                        </span>
                      </span>
                      <TruncatedTextWithPopover
                        text={
                          t.missing.crew
                            ? "À renseigner"
                            : t.crewId ?? `${t.crewSize ?? "?"}p`
                        }
                        className={cn(
                          "text-[11px]",
                          t.missing.crew
                            ? "text-amber-700"
                            : "text-slate-600",
                        )}
                      />
                      <span className="tabular-nums text-[11px] text-slate-600">
                        {t.durationLabel}
                      </span>
                    </div>

                    <div
                      className="relative"
                      style={{ width: chartWidth, height: ROW_H }}
                      onClick={() => {
                        if (!bar) onSelectTask(null);
                      }}
                    >
                      {bar ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTask(isSelected ? null : t.id);
                          }}
                          onMouseEnter={(e) => {
                            setHoveredTaskId(t.id);
                            openFloating(t, e.currentTarget, "bar");
                          }}
                          onMouseLeave={() => {
                            setFloating((f) =>
                              f?.task.id === t.id && f.mode === "bar"
                                ? null
                                : f,
                            );
                          }}
                          onFocus={(e) => {
                            setHoveredTaskId(t.id);
                            openFloating(t, e.currentTarget, "bar");
                          }}
                          onBlur={() =>
                            setFloating((f) =>
                              f?.task.id === t.id ? null : f,
                            )
                          }
                          className={cn(
                            "absolute flex items-center overflow-hidden rounded-md px-1.5 text-left text-[10px] font-medium shadow-sm transition-[transform,box-shadow,filter]",
                            TRANS,
                            barTone(t.visualKind),
                            t.conditional &&
                              "border border-dashed border-white/50 opacity-90",
                            (isSelected || isHovered) &&
                              "z-[6] scale-[1.03] ring-2 ring-[#1e3a5f]/35 ring-offset-1",
                          )}
                          style={{
                            left: bar.leftPx,
                            width: Math.max(bar.widthPx, dayWidth * 0.45),
                            top: (ROW_H - BAR_H) / 2,
                            height: BAR_H,
                          }}
                          aria-label={`${t.stepCode}, ${t.name}, ${t.durationLabel}, ${formatShortDate(t.startDate)} → ${formatShortDate(t.endDate)}`}
                        >
                          <span className="truncate">
                            {barLabel(t, bar.widthPx)}
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
      </div>

      {/* Mobile */}
      <div className="space-y-1 p-2 md:hidden">
        {phases.map((phase, idx) => {
          const list = phase.tasks.filter((t) =>
            tasks.some((x) => x.id === t.id),
          );
          if (!list.length) return null;
          const title = cleanPhaseTitle(phase.label);
          const num = String(idx + 1).padStart(2, "0");
          return (
            <div key={phase.key} className="rounded-lg border border-slate-100">
              <p className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-[#1e3a5f]">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-white text-[10px] ring-1 ring-slate-200">
                  {num}
                </span>
                {title} · {list.length} tâche{list.length > 1 ? "s" : ""}
              </p>
              {list.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    onSelectTask(selectedTaskId === t.id ? null : t.id)
                  }
                  className={cn(
                    "flex w-full items-start justify-between gap-2 border-t border-slate-50 px-3 py-2.5 text-left transition-colors",
                    TRANS,
                    selectedTaskId === t.id && "bg-[#1e3a5f]/[0.04]",
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] text-slate-500">
                      {t.stepCode}
                    </p>
                    <p className="text-[12px] font-medium leading-snug text-slate-800">
                      {t.name}
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 text-[11px]",
                        t.missing.crew ? "text-amber-700" : "text-slate-500",
                      )}
                    >
                      {t.crewDisplay} · {t.durationLabel}
                    </p>
                  </div>
                  <p className="shrink-0 text-[11px] tabular-nums text-slate-500">
                    {formatShortDate(t.startDate)}
                  </p>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-500">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-3 rounded bg-[#1e3a5f]" /> Travail
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-3 rounded bg-[#3d5a80]" /> Contrôle
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-3 rounded bg-slate-400" /> Attente
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-3 rounded bg-emerald-700" /> Remise
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-3 rounded bg-amber-600" /> À compléter
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-3 rounded bg-red-700" /> Bloqué
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm border border-slate-300 bg-slate-100" />{" "}
          Week-end
        </span>
      </div>

      {floating &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            role="tooltip"
            className="fixed z-[85] max-h-[min(70vh,440px)] overflow-y-auto rounded-xl border border-[#1e3a5f]/15 bg-white p-4 shadow-[0_16px_48px_-16px_rgba(30,58,95,0.4)]"
            style={{
              top: floating.top,
              left: floating.left,
              width: 480,
              maxWidth: "calc(100vw - 24px)",
            }}
            onMouseEnter={() => setHoveredTaskId(floating.task.id)}
            onMouseLeave={() => {
              setFloating(null);
              setHoveredTaskId(null);
            }}
          >
            <PlanningTaskHoverCard
              task={floating.task}
              compact={floating.mode === "bar"}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
