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
import type { PlanningPhaseVM, PlanningTaskVM } from "@/lib/preparation/schedule/planning-view-model";

export type GanttDependency = {
  id: string;
  type: string;
  predecessorStepCode: string;
  successorStepCode: string;
};

const LABEL_COL = 360;
const ROW_H = 34;
const PHASE_H = 32;

type Props = {
  phases: PlanningPhaseVM[];
  tasks: PlanningTaskVM[];
  dependencies: GanttDependency[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string) => void;
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
      return "bg-slate-600 text-white";
    default:
      return "bg-[#1e3a5f] text-white";
  }
}

function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso.slice(0, 10);
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

function barLabel(t: PlanningTaskVM, widthPx: number): string {
  const dur = t.durationLabel;
  if (widthPx < 40) return dur.replace(" j", "");
  if (widthPx < 90) return dur;
  if (t.crewId) return `${t.crewId} · ${dur}`;
  return dur;
}

function tooltipLines(t: PlanningTaskVM): string {
  const lines = [
    t.name,
    `Phase : ${t.phaseLabel}`,
    t.missing.crew ? "Équipe : non renseignée" : `Équipe : ${t.crewDisplay}`,
    t.crewSize != null ? `Effectif : ${t.crewSize}` : null,
    t.quantitySnapshot != null
      ? `Quantité : ${t.quantityDisplay}`
      : "Quantité : non disponible",
    t.rateValue != null ? `Rendement : ${t.rateDisplay}` : "Rendement : non renseigné",
    t.workloadPersonDays != null ? `Charge : ${t.workloadDisplay}` : null,
    `Durée : ${t.durationLabel} · ${t.durationModeLabel}`,
    t.startDate && t.endDate
      ? `Dates : ${t.startDate} (${halfLabel(t.startHalf)}) → ${t.endDate} (${halfLabel(t.endHalf)})`
      : "Dates : à définir",
  ];
  return lines.filter(Boolean).join("\n");
}

export function PrepScheduleGantt({
  phases,
  tasks,
  dependencies,
  selectedTaskId,
  onSelectTask,
}: Props) {
  const [zoom, setZoom] = useState<GanttZoom>("week");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const selected = useMemo(
    () => tasks.find((t) => t.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  const relatedCodes = useMemo(() => {
    if (!selected) return new Set<string>();
    const s = new Set<string>([selected.stepCode]);
    for (const d of selected.dependsOn) s.add(d.stepId);
    for (const d of selected.successors) s.add(d.stepId);
    return s;
  }, [selected]);

  const displayRows = useMemo(() => {
    const out: Array<
      | { type: "phase"; phase: PlanningPhaseVM }
      | { type: "task"; task: PlanningTaskVM }
    > = [];
    for (const phase of phases) {
      const phaseTasks = phase.tasks.filter((t) => tasks.some((x) => x.id === t.id));
      if (!phaseTasks.length) continue;
      out.push({ type: "phase", phase: { ...phase, tasks: phaseTasks, taskCount: phaseTasks.length } });
      if (!collapsed[phase.key]) {
        for (const t of phaseTasks) out.push({ type: "task", task: t });
      }
    }
    return out;
  }, [phases, tasks, collapsed]);

  const taskRows = useMemo(
    () => displayRows.filter((r): r is { type: "task"; task: PlanningTaskVM } => r.type === "task").map((r) => r.task),
    [displayRows],
  );

  const dayWidth = dayWidthForZoom(zoom);

  const { days, bars, chartWidth } = useMemo(() => {
    const dated = taskRows.filter((t) => t.startDate && t.endDate);
    if (!dated.length) {
      // Still show axis from all filtered tasks if any dates in full set
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
    }> = [];
    // Limit connector noise: only FS by default; when selected, show related
    for (const dep of dependencies) {
      if (dep.type !== "FS" && !selected) continue;
      const from = barByCode.get(dep.predecessorStepCode);
      const to = barByCode.get(dep.successorStepCode);
      if (!from || !to) continue;
      const fromIdx = displayRows.findIndex(
        (r) => r.type === "task" && r.task.stepCode === dep.predecessorStepCode,
      );
      const toIdx = displayRows.findIndex(
        (r) => r.type === "task" && r.task.stepCode === dep.successorStepCode,
      );
      if (fromIdx < 0 || toIdx < 0) continue;
      const highlight =
        !!selected &&
        (relatedCodes.has(dep.predecessorStepCode) ||
          relatedCodes.has(dep.successorStepCode));
      if (selected && !highlight) continue;

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
      lines.push({ key: dep.id, d, type: dep.type, highlight });
    }
    return lines;
  }, [dependencies, barByCode, displayRows, selected, relatedCodes]);

  const totalHeight = displayRows.reduce(
    (s, r) => s + (r.type === "phase" ? PHASE_H : ROW_H),
    0,
  );

  if (!days.length) {
    return (
      <p className="px-4 py-6 text-[13px] text-slate-500">
        Aucune date à afficher sur le Gantt.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[#1e3a5f]/12 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
        <h2 className="text-[13px] font-semibold text-[#1e3a5f]">Gantt par phase</h2>
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

      {/* Desktop Gantt — hidden on very small screens */}
      <div className="hidden md:block">
        <div className="max-h-[min(68vh,680px)] overflow-auto">
          <div style={{ minWidth: LABEL_COL + chartWidth }} className="relative">
            <div className="sticky top-0 z-20 flex border-b border-slate-200 bg-white/95 backdrop-blur">
              <div
                className="sticky left-0 z-30 grid shrink-0 grid-cols-[52px_minmax(0,1fr)_72px_48px] gap-1 border-r border-slate-200 bg-white px-2 py-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500"
                style={{ width: LABEL_COL }}
              >
                <span>Réf.</span>
                <span>Intervention</span>
                <span>Équipe</span>
                <span>Durée</span>
              </div>
              <div className="relative flex" style={{ width: chartWidth }}>
                {days.map((day) => (
                  <div
                    key={day.iso}
                    className={cn(
                      "shrink-0 border-r border-slate-100 px-0.5 py-1 text-center",
                      (day.isWeekend || day.isHoliday) && "bg-slate-200/70",
                    )}
                    style={{ width: dayWidth }}
                    title={day.iso}
                  >
                    <div className="text-[9px] uppercase text-slate-400">
                      {day.weekdayLabel}
                    </div>
                    <div
                      className={cn(
                        "text-[10px] font-medium tabular-nums",
                        day.isWeekend ? "text-slate-400" : "text-slate-700",
                      )}
                    >
                      {zoom === "month" ? day.label.slice(0, 2) : day.label}
                    </div>
                  </div>
                ))}
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
                      className="absolute inset-y-0 bg-slate-100/90"
                      style={{ left: i * dayWidth, width: dayWidth }}
                    />
                  ) : null,
                )}
              </div>

              <svg
                className="pointer-events-none absolute top-0 z-[5]"
                style={{ left: LABEL_COL, width: chartWidth, height: totalHeight }}
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
                    strokeWidth={c.highlight ? 1.75 : 1}
                    strokeOpacity={c.highlight ? 1 : 0.55}
                    markerEnd={c.highlight ? "url(#gantt-arrow-hi)" : "url(#gantt-arrow)"}
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
                    <path d="M0,0 L5,2.5 L0,5 Z" fill="#94a3b8" />
                  </marker>
                  <marker
                    id="gantt-arrow-hi"
                    markerWidth="5"
                    markerHeight="5"
                    refX="4"
                    refY="2.5"
                    orient="auto"
                  >
                    <path d="M0,0 L5,2.5 L0,5 Z" fill="#1e3a5f" />
                  </marker>
                </defs>
              </svg>

              {displayRows.map((row) => {
                if (row.type === "phase") {
                  const p = row.phase;
                  const isCollapsed = !!collapsed[p.key];
                  return (
                    <div
                      key={`phase:${p.key}`}
                      className="relative flex border-b border-slate-200 bg-[#1e3a5f]/[0.04]"
                      style={{ height: PHASE_H }}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsed((c) => ({ ...c, [p.key]: !c[p.key] }))
                        }
                        className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r border-slate-200 bg-[#f4f7fb] px-2 text-left"
                        style={{ width: LABEL_COL }}
                        aria-expanded={!isCollapsed}
                        aria-label={`${isCollapsed ? "Déplier" : "Replier"} phase ${p.label}`}
                      >
                        <span className="text-[11px] text-slate-500" aria-hidden>
                          {isCollapsed ? "▶" : "▼"}
                        </span>
                        <span className="min-w-0 truncate text-[11px] font-semibold text-[#1e3a5f]">
                          {p.label}
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-500">
                          {p.taskCount} tâche{p.taskCount > 1 ? "s" : ""}
                          {p.startDate && p.endDate
                            ? ` · ${formatShortDate(p.startDate)} → ${formatShortDate(p.endDate)}`
                            : ""}
                        </span>
                      </button>
                      <div style={{ width: chartWidth, height: PHASE_H }} />
                    </div>
                  );
                }

                const t = row.task;
                const bar = bars.find((b) => b.taskId === t.id);
                const isSelected = selectedTaskId === t.id;
                const isRelated = relatedCodes.has(t.stepCode);
                const dimmed = selected && !isRelated;

                return (
                  <div
                    key={t.id}
                    className={cn(
                      "relative flex border-b border-slate-50 transition-opacity",
                      isSelected && "bg-[#1e3a5f]/[0.05]",
                      dimmed && "opacity-35",
                    )}
                    style={{ height: ROW_H }}
                  >
                    <button
                      type="button"
                      onClick={() => onSelectTask(t.id)}
                      className="sticky left-0 z-10 grid shrink-0 grid-cols-[52px_minmax(0,1fr)_72px_48px] items-center gap-1 border-r border-slate-100 bg-white px-2 text-left hover:bg-slate-50"
                      style={{ width: LABEL_COL }}
                      aria-label={`Tâche ${t.stepCode} ${t.name}`}
                    >
                      <span className="font-mono text-[10px] text-slate-500">
                        {t.stepCode}
                      </span>
                      <span className="min-w-0 truncate text-[11px] font-medium text-slate-800">
                        {t.name}
                      </span>
                      <span
                        className={cn(
                          "truncate text-[10px]",
                          t.missing.crew ? "text-amber-700" : "text-slate-600",
                        )}
                      >
                        {t.missing.crew ? "À rens." : t.crewId ?? `${t.crewSize ?? "?"}p`}
                      </span>
                      <span className="tabular-nums text-[10px] text-slate-600">
                        {t.durationLabel}
                      </span>
                    </button>

                    <div className="relative" style={{ width: chartWidth, height: ROW_H }}>
                      {bar ? (
                        <button
                          type="button"
                          onClick={() => onSelectTask(t.id)}
                          className={cn(
                            "absolute top-1 flex h-[26px] items-center overflow-hidden rounded px-1.5 text-left text-[10px] font-medium transition",
                            barTone(t.visualKind),
                            t.conditional && "border border-dashed border-slate-400 opacity-90",
                            isSelected && "ring-2 ring-[#1e3a5f]/50 ring-offset-1",
                          )}
                          style={{
                            left: bar.leftPx,
                            width: Math.max(bar.widthPx, dayWidth * 0.45),
                          }}
                          title={tooltipLines(t)}
                          aria-label={`${t.stepCode}, durée ${t.durationLabel}`}
                        >
                          <span className="truncate">{barLabel(t, bar.widthPx)}</span>
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

      {/* Mobile chronological list */}
      <div className="space-y-1 p-2 md:hidden">
        {phases.map((phase) => {
          const list = phase.tasks.filter((t) => tasks.some((x) => x.id === t.id));
          if (!list.length) return null;
          return (
            <div key={phase.key} className="rounded-lg border border-slate-100">
              <p className="border-b border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-[#1e3a5f]">
                {phase.label} · {list.length} tâche{list.length > 1 ? "s" : ""}
              </p>
              {list.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTask(t.id)}
                  className={cn(
                    "flex w-full items-start justify-between gap-2 border-t border-slate-50 px-3 py-2 text-left",
                    selectedTaskId === t.id && "bg-[#1e3a5f]/[0.04]",
                  )}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-[10px] text-slate-500">{t.stepCode}</p>
                    <p className="truncate text-[12px] font-medium text-slate-800">{t.name}</p>
                    <p
                      className={cn(
                        "text-[11px]",
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
          <span className="h-2 w-3 rounded bg-slate-600" /> Remise
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
    </div>
  );
}
