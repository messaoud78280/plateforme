"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  HOUR_END,
  HOUR_START,
  PX_PER_HOUR,
  addDays,
  formatTime,
  hoursList,
  isSameDay,
  minutesSinceMidnight,
  startOfDay,
  startOfWeek,
} from "@/lib/agenda/dates";
import { agendaTypeMeta } from "@/lib/agenda/types";
import type { AgendaEventDTO, AgendaQuickCreateDraft } from "./agenda-types";

type Props = {
  mode: "day" | "week";
  cursor: Date;
  events: AgendaEventDTO[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  onQuickCreate: (draft: AgendaQuickCreateDraft) => void;
  onEventMoved: (event: AgendaEventDTO) => void;
};

type DragState =
  | {
      kind: "move";
      eventId: string;
      originY: number;
      originStart: number;
      originEnd: number;
      durationMs: number;
      dayIndex: number;
    }
  | {
      kind: "resize";
      eventId: string;
      originY: number;
      originEnd: number;
      startMs: number;
      dayIndex: number;
    };

const GRID_TOP_MIN = HOUR_START * 60;
const GRID_BOTTOM_MIN = (HOUR_END + 1) * 60;
const TOTAL_HOURS = HOUR_END - HOUR_START + 1;
const GRID_HEIGHT = TOTAL_HOURS * PX_PER_HOUR;

function snapMinutes(mins: number, step = 15): number {
  return Math.round(mins / step) * step;
}

function yToMinutes(y: number): number {
  return GRID_TOP_MIN + (y / PX_PER_HOUR) * 60;
}

function minutesToY(mins: number): number {
  return ((mins - GRID_TOP_MIN) / 60) * PX_PER_HOUR;
}

export function AgendaDayWeekView({
  mode,
  cursor,
  events,
  selectedEventId,
  onSelectEvent,
  onQuickCreate,
  onEventMoved,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());
  const [preview, setPreview] = useState<{
    eventId: string;
    startAt: Date;
    endAt: Date;
  } | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const previewRef = useRef<{ eventId: string; startAt: Date; endAt: Date } | null>(null);
  const onEventMovedRef = useRef(onEventMoved);
  onEventMovedRef.current = onEventMoved;

  const days = useMemo(() => {
    if (mode === "day") return [startOfDay(cursor)];
    const mon = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }, [mode, cursor]);

  const daysRef = useRef(days);
  daysRef.current = days;

  const hours = hoursList();

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const mins = minutesSinceMidnight(new Date());
    const y = minutesToY(Math.max(GRID_TOP_MIN, Math.min(mins, GRID_BOTTOM_MIN - 60)));
    el.scrollTop = Math.max(0, y - 80);
  }, []);

  const allDayEvents = useMemo(
    () =>
      events.filter((ev) => {
        if (!ev.allDay) return false;
        const s = new Date(ev.startAt);
        const e = new Date(ev.endAt);
        return days.some((d) => {
          const dayStart = startOfDay(d);
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);
          return s <= dayEnd && e >= dayStart;
        });
      }),
    [events, days],
  );

  const timedEvents = useMemo(() => events.filter((ev) => !ev.allDay), [events]);

  const getEventTimes = useCallback(
    (ev: AgendaEventDTO) => {
      if (preview?.eventId === ev.id) {
        return { start: preview.startAt, end: preview.endAt };
      }
      return { start: new Date(ev.startAt), end: new Date(ev.endAt) };
    },
    [preview],
  );

  function columnFromClientX(clientX: number, gridEl: HTMLElement, colCount: number): number {
    const rect = gridEl.getBoundingClientRect();
    const x = clientX - rect.left;
    const colW = rect.width / colCount;
    return Math.max(0, Math.min(colCount - 1, Math.floor(x / colW)));
  }

  useEffect(() => {
    async function patchTimes(eventId: string, startAt: Date, endAt: Date) {
      try {
        const res = await fetch(`/api/agenda/events/${eventId}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
          }),
        });
        if (!res.ok) return;
        const data = await res.json();
        onEventMovedRef.current(data.event as AgendaEventDTO);
      } catch {
        /* ignore */
      }
    }

    function onPointerMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;
      const grid = document.getElementById("agenda-timed-grid");
      if (!grid) return;
      const currentDays = daysRef.current;
      const rect = grid.getBoundingClientRect();
      const y = e.clientY - rect.top + (scrollRef.current?.scrollTop ?? 0);
      const deltaY = y - d.originY;

      if (d.kind === "move") {
        const deltaMins = snapMinutes((deltaY / PX_PER_HOUR) * 60);
        let startMins = snapMinutes(d.originStart + deltaMins);
        startMins = Math.max(GRID_TOP_MIN, Math.min(GRID_BOTTOM_MIN - 15, startMins));
        const durationMins = d.durationMs / 60_000;
        let endMins = startMins + durationMins;
        if (endMins > GRID_BOTTOM_MIN) {
          endMins = GRID_BOTTOM_MIN;
          startMins = endMins - durationMins;
        }
        const dayIndex =
          mode === "week" ? columnFromClientX(e.clientX, grid, currentDays.length) : d.dayIndex;
        const day = currentDays[dayIndex] ?? currentDays[d.dayIndex]!;
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        start.setMinutes(startMins);
        const end = new Date(start.getTime() + d.durationMs);
        const next = { eventId: d.eventId, startAt: start, endAt: end };
        previewRef.current = next;
        setPreview(next);
      } else {
        const deltaMins = snapMinutes((deltaY / PX_PER_HOUR) * 60);
        let endMins = snapMinutes(d.originEnd + deltaMins);
        endMins = Math.max(d.startMs + 15, Math.min(GRID_BOTTOM_MIN, endMins));
        const day = currentDays[d.dayIndex]!;
        const start = new Date(day);
        start.setHours(0, 0, 0, 0);
        start.setMinutes(d.startMs);
        const end = new Date(day);
        end.setHours(0, 0, 0, 0);
        end.setMinutes(endMins);
        const next = { eventId: d.eventId, startAt: start, endAt: end };
        previewRef.current = next;
        setPreview(next);
      }
    }

    function onPointerUp() {
      const d = dragRef.current;
      const p = previewRef.current;
      dragRef.current = null;
      if (!d || !p) {
        previewRef.current = null;
        setPreview(null);
        return;
      }
      previewRef.current = null;
      setPreview(null);
      void patchTimes(p.eventId, p.startAt, p.endAt);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [mode]);

  function startMove(e: React.PointerEvent, ev: AgendaEventDTO, dayIndex: number) {
    e.stopPropagation();
    e.preventDefault();
    onSelectEvent(ev.id);
    const grid = document.getElementById("agenda-timed-grid");
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const y = e.clientY - rect.top + (scrollRef.current?.scrollTop ?? 0);
    const { start, end } = getEventTimes(ev);
    dragRef.current = {
      kind: "move",
      eventId: ev.id,
      originY: y,
      originStart: minutesSinceMidnight(start),
      originEnd: minutesSinceMidnight(end),
      durationMs: end.getTime() - start.getTime(),
      dayIndex,
    };
  }

  function startResize(e: React.PointerEvent, ev: AgendaEventDTO, dayIndex: number) {
    e.stopPropagation();
    e.preventDefault();
    const grid = document.getElementById("agenda-timed-grid");
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const y = e.clientY - rect.top + (scrollRef.current?.scrollTop ?? 0);
    const { start, end } = getEventTimes(ev);
    dragRef.current = {
      kind: "resize",
      eventId: ev.id,
      originY: y,
      originEnd: minutesSinceMidnight(end),
      startMs: minutesSinceMidnight(start),
      dayIndex,
    };
  }

  function onGridDoubleClick(e: React.MouseEvent, dayIndex: number) {
    const grid = document.getElementById("agenda-timed-grid");
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const y = e.clientY - rect.top + (scrollRef.current?.scrollTop ?? 0);
    let mins = snapMinutes(yToMinutes(y));
    mins = Math.max(GRID_TOP_MIN, Math.min(GRID_BOTTOM_MIN - 60, mins));
    const day = days[dayIndex]!;
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    start.setMinutes(mins);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    onQuickCreate({ startAt: start.toISOString(), endAt: end.toISOString() });
  }

  const nowVisible = days.some((d) => isSameDay(d, now));
  const nowMins = minutesSinceMidnight(now);
  const nowY = minutesToY(nowMins);
  const showNow = nowVisible && nowMins >= GRID_TOP_MIN && nowMins <= GRID_BOTTOM_MIN;
  const nowDayIndex = days.findIndex((d) => isSameDay(d, now));

  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b border-slate-200/80">
        <div className="w-14 shrink-0" />
        <div className={`grid flex-1 ${mode === "week" ? "grid-cols-7" : "grid-cols-1"}`}>
          {days.map((d) => {
            const isToday = isSameDay(d, now);
            return (
              <div key={d.toISOString()} className="border-l border-slate-100 px-2 py-2 text-center">
                <p className="text-[11px] font-medium uppercase text-slate-400">
                  {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                </p>
                <p
                  className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                    isToday ? "bg-[#1d4ed8] text-white" : "text-[#1e3a5f]"
                  }`}
                >
                  {d.getDate()}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {allDayEvents.length > 0 ? (
        <div className="flex border-b border-slate-200/80">
          <div className="flex w-14 shrink-0 items-start justify-end pr-2 pt-2 text-[10px] font-medium text-slate-400">
            Journée
          </div>
          <div className={`grid flex-1 ${mode === "week" ? "grid-cols-7" : "grid-cols-1"}`}>
            {days.map((d) => {
              const dayEvents = allDayEvents.filter((ev) => {
                const s = new Date(ev.startAt);
                const e = new Date(ev.endAt);
                const dayStart = startOfDay(d);
                const dayEnd = new Date(dayStart);
                dayEnd.setHours(23, 59, 59, 999);
                return s <= dayEnd && e >= dayStart;
              });
              return (
                <div
                  key={d.toISOString()}
                  className="min-h-[36px] space-y-0.5 border-l border-slate-100 p-1"
                >
                  {dayEvents.map((ev) => {
                    const meta = agendaTypeMeta(ev.type);
                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => onSelectEvent(ev.id)}
                        className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium ${
                          ev.id === selectedEventId ? "ring-1 ring-[#1d4ed8]" : ""
                        }`}
                        style={{
                          backgroundColor: meta.colors.bg,
                          color: meta.colors.text,
                          borderLeft: `3px solid ${meta.colors.border}`,
                        }}
                      >
                        {ev.title}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="flex" style={{ height: GRID_HEIGHT }}>
          <div className="relative w-14 shrink-0">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[10px] font-medium text-slate-400"
                style={{ top: minutesToY(h * 60) }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          <div
            id="agenda-timed-grid"
            className={`relative grid flex-1 ${mode === "week" ? "grid-cols-7" : "grid-cols-1"}`}
            style={{ height: GRID_HEIGHT }}
          >
            {hours.map((h) => (
              <div
                key={`line-${h}`}
                className="pointer-events-none absolute left-0 right-0 border-t border-slate-100"
                style={{ top: minutesToY(h * 60) }}
              />
            ))}

            {days.map((d, dayIndex) => (
              <div
                key={d.toISOString()}
                className="relative border-l border-slate-100"
                onDoubleClick={(e) => onGridDoubleClick(e, dayIndex)}
              >
                {timedEvents.map((ev) => {
                  const { start, end } = getEventTimes(ev);
                  if (!isSameDay(start, d)) return null;

                  const startMins = minutesSinceMidnight(start);
                  const endMins = minutesSinceMidnight(end);
                  if (endMins <= GRID_TOP_MIN || startMins >= GRID_BOTTOM_MIN) return null;

                  const clampedStart = Math.max(startMins, GRID_TOP_MIN);
                  const clampedEnd = Math.min(endMins, GRID_BOTTOM_MIN);
                  const top = minutesToY(clampedStart);
                  const height = Math.max(18, minutesToY(clampedEnd) - top);
                  const meta = agendaTypeMeta(ev.type);
                  const selected = ev.id === selectedEventId;

                  return (
                    <div
                      key={ev.id}
                      className={`absolute left-1 right-1 z-10 cursor-grab overflow-hidden rounded-md border px-1.5 py-0.5 text-left active:cursor-grabbing ${
                        selected ? "ring-2 ring-[#1d4ed8] ring-offset-1" : ""
                      }`}
                      style={{
                        top,
                        height,
                        backgroundColor: meta.colors.bg,
                        borderColor: meta.colors.border,
                        color: meta.colors.text,
                      }}
                      onPointerDown={(e) => startMove(e, ev, dayIndex)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEvent(ev.id);
                      }}
                    >
                      <p className="truncate text-[11px] font-semibold leading-tight">{ev.title}</p>
                      {height > 28 ? (
                        <p className="truncate text-[10px] opacity-80">
                          {formatTime(start)} – {formatTime(end)}
                        </p>
                      ) : null}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
                        onPointerDown={(e) => startResize(e, ev, dayIndex)}
                      />
                    </div>
                  );
                })}
              </div>
            ))}

            {showNow && nowDayIndex >= 0 ? (
              <div
                className="pointer-events-none absolute z-20"
                style={{
                  top: nowY,
                  left: mode === "week" ? `${(nowDayIndex / days.length) * 100}%` : 0,
                  width: mode === "week" ? `${100 / days.length}%` : "100%",
                }}
              >
                <div className="relative border-t-2 border-[#1d4ed8]">
                  <span className="absolute -left-1 -top-2.5 rounded-full bg-[#1d4ed8] px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    {formatTime(now)}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
