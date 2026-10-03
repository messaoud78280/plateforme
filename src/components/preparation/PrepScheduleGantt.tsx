"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";
import {
  buildGanttBars,
  calendarDaysInclusive,
  dayWidthForZoom,
  enumerateCalendarDays,
  GANTT_LABEL_GRID,
  GANTT_LABEL_PANEL_WIDTH,
  groupDaysByIsoWeek,
  type GanttZoom,
} from "@/lib/preparation/schedule/gantt-layout";
import type {
  PlanningPhaseVM,
  PlanningTaskVM,
} from "@/lib/preparation/schedule/planning-view-model";

export type GanttDependency = {
  id: string;
  type: string;
  predecessorStepCode: string;
  successorStepCode: string;
};

export type GanttDensity = "comfortable" | "compact";

export type PrepScheduleGanttHandle = {
  scrollToday: () => void;
  scrollThisWeek: () => void;
  scrollStart: () => void;
};

type Props = {
  phases: PlanningPhaseVM[];
  tasks: PlanningTaskVM[];
  dependencies: GanttDependency[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
  density?: GanttDensity;
  expanded?: boolean;
  conductMode?: boolean;
  /** Masque la barre interne (toolbar fournie par le parent). */
  showChrome?: boolean;
  zoom?: GanttZoom;
  onZoomChange?: (zoom: GanttZoom) => void;
};

const TRANS = "duration-150 ease-out";
const ZOOM_BTNS: Array<[GanttZoom, string]> = [
  ["day", "Jour"],
  ["week", "Semaine"],
  ["3weeks", "3 semaines"],
  ["month", "Mois"],
];

function densitySizes(d: GanttDensity) {
  if (d === "compact") {
    return { rowH: 52, phaseH: 46, barH: 26 };
  }
  return { rowH: 64, phaseH: 54, barH: 30 };
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

function formatDayHeader(iso: string): {
  wd: string;
  day: string;
  month: string;
} {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`);
  const wdLabels = ["DIM", "LUN", "MAR", "MER", "JEU", "VEN", "SAM"];
  const months = [
    "JAN.",
    "FÉV.",
    "MARS",
    "AVR.",
    "MAI",
    "JUIN",
    "JUIL.",
    "AOÛT",
    "SEPT.",
    "OCT.",
    "NOV.",
    "DÉC.",
  ];
  const wd = wdLabels[date.getDay()] ?? "";
  return {
    wd,
    day: String(date.getDate()),
    month: months[date.getMonth()] ?? "",
  };
}

function cleanPhaseTitle(label: string): string {
  return label.replace(/^PHASE\s*\d+\s*[—–\-:]\s*/i, "").trim() || label;
}

function todayIso(): string {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, "0");
  const d = String(n.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function defaultZoom(dayCount: number): GanttZoom {
  if (dayCount <= 10) return "week";
  if (dayCount <= 28) return "3weeks";
  return "month";
}

function isMilestone(t: PlanningTaskVM): boolean {
  if (t.visualKind === "handover") return true;
  if (t.holdPoint) return true;
  if (t.visualKind === "control" && t.durationDays <= 0.5) return true;
  return false;
}

function barDurationText(t: PlanningTaskVM): string {
  const n = Math.round(t.durationDays * 10) / 10;
  return Number.isInteger(n) ? `${n} j` : `${n.toLocaleString("fr-FR")} j`;
}

function taskAlert(t: PlanningTaskVM): string | null {
  if (t.visualKind === "blocked") return "Bloqué";
  if (t.missing.crew) return "Équipe manquante";
  if (t.missing.rate) return "Rendement à confirmer";
  if (t.issueCodes.includes("DEP_DATE_VIOLATION")) return "Dépendance";
  return null;
}

export const PrepScheduleGantt = forwardRef<PrepScheduleGanttHandle, Props>(
  function PrepScheduleGantt(
    {
      phases,
      tasks,
      dependencies,
      selectedTaskId,
      onSelectTask,
      density = "comfortable",
      expanded = false,
      conductMode = false,
      showChrome = true,
      zoom: zoomProp,
      onZoomChange,
    },
    ref,
  ) {
  const sizes = densitySizes(density);
  const scrollRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [zoomInternal, setZoomInternal] = useState<GanttZoom>("3weeks");
  const zoom = zoomProp ?? zoomInternal;
  const setZoom = onZoomChange ?? setZoomInternal;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [hoveredPhaseKey, setHoveredPhaseKey] = useState<string | null>(null);
  const [scrollRatio, setScrollRatio] = useState({ left: 0, width: 1 });
  const zoomInit = useRef(false);

  /** Panneau gauche fixe — jamais compressé pour « remplir » l’écran. */
  const labelCol = expanded
    ? Math.min(640, GANTT_LABEL_PANEL_WIDTH + 20)
    : GANTT_LABEL_PANEL_WIDTH;
  const labelGrid = { gridTemplateColumns: GANTT_LABEL_GRID };

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

  const { days, bars, chartWidth, axisStartIso } = useMemo(() => {
    const dated = taskRows.filter((t) => t.startDate && t.endDate);
    const source = dated.length
      ? dated
      : tasks.filter((t) => t.startDate && t.endDate);
    if (!source.length) {
      return { days: [], bars: [], chartWidth: 0, axisStartIso: today };
    }
    const starts = source.map((t) => t.startDate!);
    const ends = source.map((t) => t.endDate!);
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
    return { days, bars, chartWidth: days.length * dayWidth, axisStartIso };
  }, [taskRows, dayWidth, tasks, today]);

  useEffect(() => {
    if (zoomInit.current || !days.length) return;
    zoomInit.current = true;
    setZoom(defaultZoom(days.length));
  }, [days.length]);

  const weekBands = useMemo(() => groupDaysByIsoWeek(days), [days]);

  const barByCode = useMemo(() => {
    const m = new Map<string, (typeof bars)[0]>();
    for (const b of bars) m.set(b.stepCode, b);
    return m;
  }, [bars]);

  const totalHeight = displayRows.reduce(
    (s, r) => s + (r.type === "phase" ? sizes.phaseH : sizes.rowH),
    0,
  );

  const connectors = useMemo(() => {
    const lines: Array<{
      key: string;
      d: string;
      type: string;
      highlight: boolean;
      muted: boolean;
    }> = [];
    const selectedCode = selected?.stepCode ?? null;
    const hasSelection = !!selectedCode;
    for (const dep of dependencies) {
      if (!hasSelection && dep.type !== "FS") continue;
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
        hasSelection &&
        (selectedCode === dep.predecessorStepCode ||
          selectedCode === dep.successorStepCode);
      const muted = hasSelection && !highlight;
      const rowY = (idx: number) => {
        let y = 0;
        for (let i = 0; i < idx; i++) {
          y += displayRows[i]!.type === "phase" ? sizes.phaseH : sizes.rowH;
        }
        const h = displayRows[idx]!.type === "phase" ? sizes.phaseH : sizes.rowH;
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
      const midX = Math.max(x1, x2) + 10;
      const d =
        Math.abs(yy2 - yy1) < 2
          ? `M ${x1} ${yy1} L ${x2} ${yy2}`
          : `M ${x1} ${yy1} L ${midX} ${yy1} L ${midX} ${yy2} L ${x2} ${yy2}`;
      lines.push({ key: dep.id, d, type: dep.type, highlight, muted });
    }
    return lines;
  }, [dependencies, barByCode, displayRows, selected, sizes.phaseH, sizes.rowH]);

  const todayIdx = days.findIndex((d) => d.iso === today);

  function updateMini() {
    const el = scrollRef.current;
    if (!el) return;
    const total = el.scrollWidth - labelCol;
    const vis = el.clientWidth - labelCol;
    if (total <= 0) {
      setScrollRatio({ left: 0, width: 1 });
      return;
    }
    const left = Math.max(0, (el.scrollLeft) / Math.max(1, el.scrollWidth - el.clientWidth));
    setScrollRatio({
      left,
      width: Math.min(1, vis / Math.max(total, 1)),
    });
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateMini();
    el.addEventListener("scroll", updateMini, { passive: true });
    return () => el.removeEventListener("scroll", updateMini);
  }, [chartWidth, labelCol, days.length]);

  function scrollToIso(iso: string) {
    const el = scrollRef.current;
    if (!el) return;
    const idx = days.findIndex((d) => d.iso === iso);
    if (idx < 0) return;
    const x = idx * dayWidth;
    const vis = el.clientWidth - labelCol;
    el.scrollTo({ left: Math.max(0, x - vis / 3), behavior: "smooth" });
  }

  function scrollThisWeek() {
    if (days.some((d) => d.iso === today)) {
      scrollToIso(today);
      return;
    }
    const monday = days.find(
      (d) => new Date(`${d.iso}T12:00:00`).getDay() === 1,
    );
    if (monday) scrollToIso(monday.iso);
    else if (days[0]) scrollToIso(days[0].iso);
  }

  useImperativeHandle(
    ref,
    () => ({
      scrollToday: () => {
        if (todayIdx >= 0) scrollToIso(today);
        else scrollThisWeek();
      },
      scrollThisWeek,
      scrollStart: () => {
        if (days[0]) scrollToIso(days[0].iso);
      },
    }),
    // days / dayWidth / labelCol suffisent pour resynchroniser le scroll
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [days, dayWidth, labelCol, today, todayIdx],
  );

  useEffect(() => {
    if (!days.length) return undefined;
    const target =
      days.find((d) => d.iso === todayIso())?.iso ?? days[0]?.iso ?? null;
    if (!target) return undefined;
    const id = window.setTimeout(() => scrollToIso(target), 80);
    return () => window.clearTimeout(id);
  }, [axisStartIso, zoom, days, dayWidth, labelCol]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setHoveredTaskId(null);
        if (selectedTaskId) onSelectTask(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTaskId, onSelectTask]);

  const mobileDays = useMemo(() => {
    const map = new Map<string, PlanningTaskVM[]>();
    const ordered = [...tasks].sort((a, b) =>
      (a.startDate ?? "").localeCompare(b.startDate ?? ""),
    );
    for (const t of ordered) {
      const key = t.startDate ?? "sans-date";
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [tasks]);

  if (!days.length) {
    return (
      <p className="px-4 py-6 text-[13px] text-slate-500">
        Aucune date à afficher sur le Gantt.
      </p>
    );
  }

  const ganttMaxH = expanded
    ? "max-h-[calc(100dvh-5.5rem)]"
    : conductMode
      ? "max-h-[min(82vh,920px)]"
      : "max-h-[min(78vh,860px)]";

  return (
    <div
      ref={wrapRef}
      className="isolate overflow-hidden rounded-[16px] border border-slate-200/80 bg-white"
    >
      {showChrome ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-3 py-1.5">
          <h2 className="text-[13px] font-semibold tracking-tight text-[#1e3a5f]">
            Planning
          </h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (todayIdx >= 0) scrollToIso(today);
                else scrollThisWeek();
              }}
              className="rounded-md border border-[#1e3a5f]/25 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#1e3a5f] hover:bg-[#1e3a5f]/5"
            >
              Aujourd&apos;hui
            </button>
            <button
              type="button"
              onClick={scrollThisWeek}
              className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-50"
            >
              Cette semaine
            </button>
            <div
              className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white p-0.5"
              role="group"
              aria-label="Échelle du Gantt"
            >
              {ZOOM_BTNS.map(([z, label]) => (
                <button
                  key={z}
                  type="button"
                  onClick={() => setZoom(z)}
                  aria-pressed={zoom === z}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium transition",
                    TRANS,
                    zoom === z
                      ? "bg-[#1e3a5f] text-white"
                      : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Desktop Gantt */}
      <div className="hidden md:block">
        <div
          ref={scrollRef}
          className={cn(
            "relative z-0 overflow-x-scroll overflow-y-auto overscroll-x-contain",
            ganttMaxH,
          )}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onSelectTask(null);
            }
          }}
        >
          <div
            style={{ minWidth: labelCol + chartWidth }}
            className="relative"
          >
            <div className="sticky top-0 z-20 border-b border-slate-200/90 bg-[#f7f8fa]">
              <div className="flex">
                <div
                  className="sticky left-0 z-30 shrink-0 border-r border-slate-200/80 bg-[#f7f8fa]"
                  style={{ width: labelCol }}
                />
                <div className="relative flex" style={{ width: chartWidth }}>
                  {weekBands.map((band) => (
                    <div
                      key={`${band.year}-w${band.week}-${band.startIso}`}
                      className="flex items-center justify-center border-r border-[#1e3a5f]/25 px-1 py-1.5 text-[11px] font-semibold tracking-[0.04em] text-[#1e3a5f]"
                      style={{ width: band.dayCount * dayWidth }}
                    >
                      Semaine {band.week}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex border-t border-slate-200/70">
                <div
                  className="sticky left-0 z-30 grid shrink-0 gap-2 border-r border-slate-200/80 bg-[#f7f8fa] px-3 py-2 text-[11px] font-medium text-slate-500"
                  style={{ width: labelCol, ...labelGrid }}
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
                    const monday =
                      new Date(`${day.iso}T12:00:00`).getDay() === 1;
                    return (
                      <div
                        key={day.iso}
                        className={cn(
                          "shrink-0 border-r border-slate-200/60 px-1 py-1.5 text-center",
                          (day.isWeekend || day.isHoliday) &&
                            "bg-slate-100/80",
                          monday && "border-l border-l-[#1e3a5f]/50",
                          isToday && "bg-[#1e3a5f]/[0.06]",
                        )}
                        style={{ width: dayWidth, minWidth: dayWidth }}
                      >
                        <div
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-[0.08em]",
                            isToday ? "text-[#1e3a5f]" : "text-slate-500",
                          )}
                        >
                          {zoom === "month" ? h.wd.slice(0, 3) : h.wd}
                        </div>
                        <div
                          className={cn(
                            "text-[12px] font-semibold tabular-nums leading-tight",
                            day.isWeekend ? "text-slate-400" : "text-slate-800",
                            isToday && "text-[#1e3a5f]",
                          )}
                        >
                          {h.day}
                          {dayWidth >= 48 ? (
                            <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wide text-slate-500">
                              {h.month}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                  {todayIdx >= 0 ? (
                    <div
                      className="pointer-events-none absolute bottom-0 top-0 z-[2] w-px bg-[#1e3a5f]/45"
                      style={{ left: todayIdx * dayWidth + dayWidth / 2 }}
                      aria-hidden
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="relative">
              <div
                className="pointer-events-none absolute inset-y-0"
                style={{ left: labelCol, width: chartWidth }}
              >
                {days.map((day, i) =>
                  day.isWeekend || day.isHoliday ? (
                    <div
                      key={`bg-${day.iso}`}
                      className="absolute inset-y-0 bg-slate-100/70"
                      style={{ left: i * dayWidth, width: dayWidth }}
                    />
                  ) : null,
                )}
                {todayIdx >= 0 ? (
                  <div
                    className="absolute inset-y-0 z-[4] w-px bg-[#1e3a5f]/45"
                    style={{ left: todayIdx * dayWidth + dayWidth / 2 }}
                  >
                    <span className="absolute left-1/2 top-1 z-[5] -translate-x-1/2 whitespace-nowrap rounded-md bg-[#1e3a5f] px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Aujourd&apos;hui
                    </span>
                  </div>
                ) : null}
              </div>

              <svg
                className="pointer-events-none absolute top-0 z-[5]"
                style={{
                  left: labelCol,
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
                      c.highlight ? 0.92 : c.muted ? 0.05 : 0.09
                    }
                    className={cn("transition-opacity", TRANS)}
                    markerEnd={
                      c.highlight ? "url(#gantt-arrow-hi)" : undefined
                    }
                  />
                ))}
                <defs>
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
                  const calDays =
                    p.startDate && p.endDate
                      ? calendarDaysInclusive(p.startDate, p.endDate)
                      : null;
                  const phaseHover = hoveredPhaseKey === p.key;
                  const phaseBar = (() => {
                    if (!p.startDate || !p.endDate || !days.length) return null;
                    const startIdx = days.findIndex((d) => d.iso === p.startDate);
                    const endIdx = days.findIndex((d) => d.iso === p.endDate);
                    if (startIdx < 0 && endIdx < 0) return null;
                    const a = startIdx >= 0 ? startIdx : 0;
                    const b = endIdx >= 0 ? endIdx : days.length - 1;
                    return {
                      left: a * dayWidth,
                      width: Math.max(dayWidth, (b - a + 1) * dayWidth),
                    };
                  })();
                  return (
                    <div
                      key={`phase:${p.key}`}
                      className={cn(
                        "relative flex border-b border-slate-200/70 transition-colors",
                        TRANS,
                        phaseHover ? "bg-slate-100" : "bg-slate-50/90",
                      )}
                      style={{ height: sizes.phaseH }}
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
                        className="sticky left-0 z-[11] flex shrink-0 items-center gap-2.5 border-r border-slate-200/80 bg-inherit px-3 text-left"
                        style={{ width: labelCol }}
                        aria-expanded={!isCollapsed}
                        aria-label={`${isCollapsed ? "Déplier" : "Replier"} phase ${title}`}
                      >
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center text-[12px] font-semibold tabular-nums text-[#1e3a5f]"
                          aria-hidden
                        >
                          {num}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold tracking-tight text-slate-800">
                            {title}
                          </span>
                          <span className="block truncate text-[12px] text-slate-500">
                            {p.taskCount} tâche{p.taskCount > 1 ? "s" : ""}
                            {p.startDate && p.endDate
                              ? ` · ${formatShortDate(p.startDate)} → ${formatShortDate(p.endDate)}`
                              : ""}
                            {calDays != null
                              ? ` · ${calDays} j calendaires`
                              : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] text-slate-500" aria-hidden>
                          {isCollapsed ? "▶" : "▼"}
                        </span>
                      </button>
                      <div
                        className="relative"
                        style={{ width: chartWidth, height: sizes.phaseH }}
                      >
                        {phaseBar ? (
                          <div
                            className="absolute rounded-md bg-[#1e3a5f]/12"
                            style={{
                              left: phaseBar.left,
                              width: phaseBar.width,
                              top: Math.max(10, sizes.phaseH / 2 - 4),
                              height: 8,
                            }}
                            title={`${title} · ${p.taskCount} tâches`}
                          />
                        ) : null}
                      </div>
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
                // Sélection : renforcer la tâche + deps — ne jamais pâler le reste.
                const emphasize =
                  !!focusTask && (isRelated || isHovered || isSelected);
                const alert = taskAlert(t);
                const crewLine = t.missing.crew
                  ? "Équipe à définir"
                  : [t.crewId, t.crewSize != null ? `${t.crewSize} pers.` : null]
                      .filter(Boolean)
                      .join(" · ") || t.crewDisplay;
                const subLine = [
                  crewLine,
                  t.durationLabel,
                  t.quantitySnapshot != null ? t.quantityDisplay : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                const milestone = isMilestone(t);

                return (
                  <div
                    key={t.id}
                    className={cn(
                      "group relative flex border-b border-slate-200/80 transition-colors",
                      TRANS,
                      isSelected &&
                        "bg-[#1e3a5f]/[0.08] shadow-[inset_3px_0_0_0_#1e3a5f]",
                      isHovered && !isSelected && "bg-[#1e3a5f]/[0.04]",
                      phaseAccent && !isSelected && "bg-[#1e3a5f]/[0.03]",
                      emphasize &&
                        !isSelected &&
                        isRelated &&
                        "bg-[#1e3a5f]/[0.03]",
                    )}
                    style={{ height: sizes.rowH }}
                    onMouseEnter={() => setHoveredTaskId(t.id)}
                    onMouseLeave={() => {
                      setHoveredTaskId((cur) => (cur === t.id ? null : cur));
                    }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        onSelectTask(isSelected ? null : t.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelectTask(isSelected ? null : t.id);
                        }
                      }}
                      className={cn(
                        "sticky left-0 z-[11] grid shrink-0 cursor-pointer items-center gap-2 border-r border-slate-200/80 px-3 text-left",
                        TRANS,
                        isSelected || isHovered ? "bg-[#f4f6f8]" : "bg-white",
                      )}
                      style={{ width: labelCol, ...labelGrid }}
                      aria-pressed={isSelected}
                      aria-label={`Tâche ${t.stepCode} ${t.name}`}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 font-mono text-[11px] tabular-nums",
                          isSelected
                            ? "font-semibold text-[#1e3a5f]"
                            : "text-slate-500",
                        )}
                      >
                        {t.visualKind === "incomplete" || alert ? (
                          <span
                            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                            title={alert ?? "À compléter"}
                            aria-hidden
                          />
                        ) : null}
                        {t.stepCode}
                      </span>
                      <span className="min-w-0">
                        <span
                          className="block text-[13px] font-semibold leading-snug text-[#152a45]"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                          title={t.name}
                        >
                          {t.name}
                        </span>
                        <span className="mt-0.5 hidden truncate text-[12px] text-slate-500 lg:block">
                          {subLine}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "truncate text-[11px] font-medium",
                          t.missing.crew
                            ? "text-amber-700"
                            : "text-slate-700",
                        )}
                        title={crewLine}
                      >
                        {t.missing.crew
                          ? "À définir"
                          : t.crewId ?? `${t.crewSize ?? "?"}p`}
                        {t.crewSize != null && !t.missing.crew ? (
                          <span className="block text-[10px] font-normal text-slate-500">
                            {t.crewSize} pers.
                          </span>
                        ) : null}
                      </span>
                      <span className="flex items-center gap-1 tabular-nums text-[12px] font-medium text-slate-700">
                        {t.durationLabel}
                        {alert ? (
                          <span
                            className="text-[12px] text-amber-700"
                            title={alert}
                          >
                            ⚠
                          </span>
                        ) : null}
                      </span>
                    </div>

                    <div
                      className="relative"
                      style={{ width: chartWidth, height: sizes.rowH }}
                      onClick={() => {
                        if (!bar) {
                          onSelectTask(null);
                        }
                      }}
                    >
                      {bar && milestone ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTask(isSelected ? null : t.id);
                          }}
                          className={cn(
                            "absolute z-[6] flex items-center justify-center text-[18px] leading-none",
                            t.visualKind === "handover"
                              ? "text-emerald-700"
                              : t.visualKind === "blocked"
                                ? "text-red-700"
                                : "text-[#3d5a80]",
                            (isSelected || isHovered) && "scale-125",
                          )}
                          style={{
                            left: bar.leftPx + Math.max(0, bar.widthPx / 2) - 10,
                            top: sizes.rowH / 2 - 12,
                            width: 20,
                            height: 24,
                          }}
                          aria-label={`${t.stepCode}, jalon ${t.name}`}
                        >
                          ◆
                        </button>
                      ) : bar ? (
                        <button
                          type="button"
                          title={t.name}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTask(isSelected ? null : t.id);
                          }}
                          className={cn(
                            "absolute flex items-center overflow-hidden rounded-[7px] px-2 text-left text-[11px] font-semibold shadow-none transition-[box-shadow]",
                            TRANS,
                            barToneClass(t.visualKind),
                            t.conditional && "opacity-90",
                            (isSelected || isHovered) &&
                              "z-[6] ring-2 ring-[#1e3a5f]/40 ring-offset-1",
                          )}
                          style={{
                            left: bar.leftPx,
                            width: Math.max(
                              bar.widthPx,
                              t.durationDays <= 0.5
                                ? dayWidth * 0.5
                                : dayWidth * 0.45,
                            ),
                            top: (sizes.rowH - sizes.barH) / 2,
                            height: sizes.barH,
                          }}
                          aria-label={`${t.stepCode}, ${t.name}, ${t.durationLabel}`}
                        >
                          <span className="truncate">
                            {bar.widthPx >= 36 ? barDurationText(t) : ""}
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

        {days.length * dayWidth > 600 ? (
          <div className="border-t border-slate-200 bg-slate-50 px-3 py-2">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Défiler horizontalement · {days.length} jours ·{" "}
              {Math.round(days.length * dayWidth)} px
            </p>
            <button
              type="button"
              className="relative block h-3 w-full overflow-hidden rounded-full bg-slate-200"
              aria-label="Déplacer la fenêtre visible"
              onClick={(e) => {
                const el = scrollRef.current;
                if (!el) return;
                const r = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - r.left) / r.width;
                const max = el.scrollWidth - el.clientWidth;
                el.scrollTo({ left: ratio * max, behavior: "smooth" });
              }}
            >
              <span
                className="absolute top-0 h-full rounded-full bg-[#1e3a5f]/55"
                style={{
                  left: `${scrollRatio.left * 100}%`,
                  width: `${Math.max(8, scrollRatio.width * 100)}%`,
                }}
              />
            </button>
          </div>
        ) : null}
      </div>

      {/* Mobile — liste chronologique */}
      <div className="space-y-3 p-3 md:hidden">
        <p className="text-[12px] font-semibold text-[#1e3a5f]">
          Aujourd&apos;hui {formatShortDate(today)} · Cette semaine
        </p>
        {mobileDays.map(([iso, list]) => {
          const h = iso === "sans-date" ? null : formatDayHeader(iso);
          return (
            <div key={iso}>
              <p className="mb-1 text-[12px] font-bold uppercase tracking-wide text-[#1e3a5f]">
                {h ? `${h.wd} ${h.day}` : "Sans date"}
              </p>
              <ul className="space-y-1">
                {list.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() =>
                        onSelectTask(selectedTaskId === t.id ? null : t.id)
                      }
                      className={cn(
                        "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left",
                        selectedTaskId === t.id && "border-[#1e3a5f] bg-[#1e3a5f]/5",
                      )}
                    >
                      <p className="text-[13px] font-semibold leading-snug text-slate-900">
                        {t.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {t.crewDisplay} · {t.durationLabel}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-100 bg-slate-50/50 px-3 py-1.5 text-[11px] text-slate-600">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-4 rounded-sm bg-[#1e3a5f]" /> Travail
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-4 rounded-sm border-2 border-[#3d5a80] bg-white" />{" "}
          Contrôle
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-4 rounded-sm bg-[repeating-linear-gradient(135deg,#94a3b8,#94a3b8_3px,#cbd5e1_3px,#cbd5e1_6px)]" />{" "}
          Attente
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="text-emerald-700">◆</span> Remise
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> À compléter
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="font-bold text-red-700">!</span> Bloqué
        </span>
      </div>

    </div>
  );
  },
);

function barToneClass(kind: PlanningTaskVM["visualKind"]): string {
  switch (kind) {
    case "blocked":
      return "bg-red-700 text-white";
    case "incomplete":
      // Tâche normale BeWork — l’alerte est sur la ligne (point ambre), pas la barre
      return "bg-[#1e3a5f] text-white";
    case "control":
      return "border-2 border-[#3d5a80] bg-white text-[#1e3a5f]";
    case "wait":
      return "bg-[repeating-linear-gradient(135deg,#64748b,#64748b_5px,#94a3b8_5px,#94a3b8_10px)] text-white";
    case "handover":
      return "bg-emerald-700 text-white";
    default:
      return "bg-[#1e3a5f] text-white";
  }
}
