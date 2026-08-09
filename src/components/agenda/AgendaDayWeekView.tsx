"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  EXTENDED_HOUR_END,
  EXTENDED_HOUR_START,
  PX_PER_HOUR,
  WORK_HOUR_END,
  WORK_HOUR_START,
  addDays,
  formatTime,
  hoursList,
  isOutsideWorkHours,
  isSameDay,
  isoWeekLabel,
  minutesSinceMidnight,
  startOfDay,
  startOfWeek,
} from "@/lib/agenda/dates";
import { agendaEventCardLines } from "@/lib/agenda/event-card";
import { agendaTypeMeta } from "@/lib/agenda/types";
import { URGENCY_STYLES } from "@/lib/follow-up/types";
import type { AgendaEventDTO, AgendaQuickCreateDraft } from "./agenda-types";

type Props = {
  mode: "day" | "week";
  cursor: Date;
  events: AgendaEventDTO[];
  selectedEventId: string | null;
  onSelectEvent: (id: string) => void;
  onQuickCreate: (draft: AgendaQuickCreateDraft, typeHint?: string | null) => void;
  onEventMoved: (event: AgendaEventDTO) => void;
  onConfirmLinkedReschedule?: (
    event: AgendaEventDTO,
    startAt: Date,
    endAt: Date,
  ) => Promise<boolean>;
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

const SLOT_QUICK_TYPES = [
  { type: "REUNION_CHANTIER", label: "Réunion" },
  { type: "INTERVENTION", label: "Intervention" },
  { type: "RDV_CLIENT", label: "Rendez-vous" },
  { type: "ECHEANCE", label: "Échéance" },
  { type: "AUTRE", label: "Autre" },
] as const;

function snapMinutes(mins: number, step = 15): number {
  return Math.round(mins / step) * step;
}

export function AgendaDayWeekView({
  mode,
  cursor,
  events,
  selectedEventId,
  onSelectEvent,
  onQuickCreate,
  onEventMoved,
  onConfirmLinkedReschedule,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(() => new Date());
  const [extended, setExtended] = useState(false);
  const autoExtendedRef = useRef(false);
  const [slotMenu, setSlotMenu] = useState<{
    dayIndex: number;
    draft: AgendaQuickCreateDraft;
    x: number;
    y: number;
  } | null>(null);
  const [preview, setPreview] = useState<{
    eventId: string;
    startAt: Date;
    endAt: Date;
  } | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const previewRef = useRef<{ eventId: string; startAt: Date; endAt: Date } | null>(null);
  const onEventMovedRef = useRef(onEventMoved);
  onEventMovedRef.current = onEventMoved;
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const confirmLinkedRef = useRef(onConfirmLinkedReschedule);
  confirmLinkedRef.current = onConfirmLinkedReschedule;
  const ignoreClickRef = useRef(false);

  const hourStart = extended ? EXTENDED_HOUR_START : WORK_HOUR_START;
  const hourEnd = extended ? EXTENDED_HOUR_END : WORK_HOUR_END;
  const gridTopMin = hourStart * 60;
  const gridBottomMin = (hourEnd + 1) * 60;
  const totalHours = hourEnd - hourStart + 1;
  const gridHeight = totalHours * PX_PER_HOUR;

  const yToMinutes = useCallback(
    (y: number) => gridTopMin + (y / PX_PER_HOUR) * 60,
    [gridTopMin],
  );
  const minutesToY = useCallback(
    (mins: number) => ((mins - gridTopMin) / 60) * PX_PER_HOUR,
    [gridTopMin],
  );

  const days = useMemo(() => {
    if (mode === "day") return [startOfDay(cursor)];
    const mon = startOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  }, [mode, cursor]);

  const daysRef = useRef(days);
  daysRef.current = days;

  const hours = hoursList(hourStart, hourEnd);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Auto-étendre une fois si un événement hors plage travail
  useEffect(() => {
    if (autoExtendedRef.current) return;
    const outside = events.some((ev) => {
      if (ev.allDay) return false;
      return isOutsideWorkHours(new Date(ev.startAt)) || isOutsideWorkHours(new Date(ev.endAt));
    });
    if (outside) {
      autoExtendedRef.current = true;
      setExtended(true);
    }
  }, [events]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const mins = minutesSinceMidnight(new Date());
    const y = minutesToY(Math.max(gridTopMin, Math.min(mins, gridBottomMin - 60)));
    el.scrollTop = Math.max(0, y - 80);
  }, [minutesToY, gridTopMin, gridBottomMin, extended]);

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
    async function patchTimes(
      eventId: string,
      startAt: Date,
      endAt: Date,
      kind: "move" | "resize",
    ) {
      try {
        const baseId = eventId.includes("__") ? eventId.split("__")[0]! : eventId;
        const ev = eventsRef.current.find((e) => e.id === eventId || e.id === baseId);
        const linked = Boolean(ev?.linkedPurchaseOrder || ev?.purchaseOrderId);
        if (linked && kind === "resize") return;
        if (linked) {
          const ok = confirmLinkedRef.current
            ? await confirmLinkedRef.current(ev!, startAt, endAt)
            : window.confirm(
                `Modifier la livraison liée à la commande ?\n\nNouveau créneau : ${startAt.toLocaleString("fr-FR")}`,
              );
          if (!ok) return;
        }

        const res = await fetch(`/api/agenda/events/${baseId}`, {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            ...(linked ? { confirmLinkedReschedule: true } : {}),
          }),
        });
        if (!res.ok) {
          try {
            const err = await res.json();
            if (err?.error === "SUPPLIER_CONFIRMED_LOCKED" && err?.orderUrl) {
              const go = window.confirm(
                `${err.message || "Livraison confirmée — modification bloquée."}\n\nOK = Voir la commande\nAnnuler`,
              );
              if (go) window.location.href = String(err.orderUrl);
            }
          } catch {
            /* ignore */
          }
          return;
        }
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
      const topMin = (extended ? EXTENDED_HOUR_START : WORK_HOUR_START) * 60;
      const bottomMin = ((extended ? EXTENDED_HOUR_END : WORK_HOUR_END) + 1) * 60;

      if (d.kind === "move") {
        const deltaMins = snapMinutes((deltaY / PX_PER_HOUR) * 60);
        let startMins = snapMinutes(d.originStart + deltaMins);
        startMins = Math.max(topMin, Math.min(bottomMin - 15, startMins));
        const durationMins = d.durationMs / 60_000;
        let endMins = startMins + durationMins;
        if (endMins > bottomMin) {
          endMins = bottomMin;
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
        endMins = Math.max(d.startMs + 15, Math.min(bottomMin, endMins));
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
      ignoreClickRef.current = true;
      window.setTimeout(() => {
        ignoreClickRef.current = false;
      }, 0);
      previewRef.current = null;
      setPreview(null);
      void patchTimes(p.eventId, p.startAt, p.endAt, d.kind);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [mode, extended]);

  function startMove(e: React.PointerEvent, ev: AgendaEventDTO, dayIndex: number) {
    e.stopPropagation();
    e.preventDefault();
    setSlotMenu(null);
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

  function openSlotAt(e: React.MouseEvent, dayIndex: number) {
    if (ignoreClickRef.current) return;
    const grid = document.getElementById("agenda-timed-grid");
    if (!grid) return;
    const rect = grid.getBoundingClientRect();
    const y = e.clientY - rect.top + (scrollRef.current?.scrollTop ?? 0);
    let mins = snapMinutes(yToMinutes(y));
    mins = Math.max(gridTopMin, Math.min(gridBottomMin - 60, mins));
    const day = days[dayIndex]!;
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    start.setMinutes(mins);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const draft = { startAt: start.toISOString(), endAt: end.toISOString() };
    setSlotMenu({
      dayIndex,
      draft,
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 220),
    });
  }

  const nowVisible = days.some((d) => isSameDay(d, now));
  const nowMins = minutesSinceMidnight(now);
  const nowY = minutesToY(nowMins);
  const showNow = nowVisible && nowMins >= gridTopMin && nowMins <= gridBottomMin;
  const nowDayIndex = days.findIndex((d) => isSameDay(d, now));

  // Mobile / vue Jour étroite : timeline listée (pas de grille miniature)
  const useTimeline = mode === "day" && isNarrow;

  if (useTimeline) {
    const day = days[0]!;
    const dayAllDay = allDayEvents.filter((ev) => {
      const s = new Date(ev.startAt);
      const e = new Date(ev.endAt);
      const dayStart = startOfDay(day);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);
      return s <= dayEnd && e >= dayStart;
    });
    const dayTimed = timedEvents
      .filter((ev) => isSameDay(new Date(ev.startAt), day))
      .sort((a, b) => a.startAt.localeCompare(b.startAt));

    return (
      <div className="flex h-full flex-col overflow-y-auto px-3 py-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold capitalize text-[#1e3a5f]">
            {day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <button
            type="button"
            onClick={() => {
              const start = new Date(day);
              start.setHours(9, 0, 0, 0);
              const end = new Date(start.getTime() + 60 * 60 * 1000);
              setSlotMenu({
                dayIndex: 0,
                draft: { startAt: start.toISOString(), endAt: end.toISOString() },
                x: 24,
                y: 120,
              });
            }}
            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600"
          >
            + Créer
          </button>
        </div>

        {dayAllDay.length > 0 ? (
          <div className="mb-4">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Toute la journée
            </p>
            <ul className="space-y-1.5">
              {dayAllDay.map((ev) => {
                const lines = agendaEventCardLines(ev);
                return (
                  <li key={ev.id}>
                    <button
                      type="button"
                      onClick={() => onSelectEvent(ev.id)}
                      className={`w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-left ${
                        lines.done ? "opacity-60" : ""
                      } ${lines.unconfirmed ? "border-dashed border-orange-300" : ""} ${
                        ev.id === selectedEventId ? "ring-1 ring-[#1d4ed8]" : ""
                      }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {lines.eyebrow}
                      </p>
                      <p className="text-sm font-semibold text-slate-900">{lines.title}</p>
                      {lines.meta ? (
                        <p className="text-[11px] text-slate-500">{lines.meta}</p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <ul className="space-y-3">
          {dayTimed.length === 0 && dayAllDay.length === 0 ? (
            <li className="rounded-xl border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
              Rien de planifié — touchez + Créer
            </li>
          ) : null}
          {dayTimed.map((ev) => {
            const { start, end } = getEventTimes(ev);
            const lines = agendaEventCardLines(ev, { start, end });
            const meta = agendaTypeMeta(ev.type);
            return (
              <li key={ev.id} className="flex gap-3">
                <div className="w-12 shrink-0 pt-1 text-right">
                  <p className="text-xs font-bold tabular-nums text-[#1e3a5f]">
                    {formatTime(start)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectEvent(ev.id)}
                  className={`min-w-0 flex-1 rounded-xl border border-l-[3px] bg-white px-3 py-2 text-left ${
                    lines.done ? "opacity-55" : ""
                  } ${lines.unconfirmed ? "border-dashed" : "border-solid"} ${
                    ev.id === selectedEventId ? "ring-1 ring-[#1d4ed8]" : ""
                  }`}
                  style={{
                    borderColor: meta.colors.border,
                    backgroundColor: meta.colors.bg,
                  }}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: meta.colors.text }}
                  >
                    {lines.eyebrow}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">{lines.title}</p>
                  {lines.meta ? (
                    <p className="text-[11px] opacity-80" style={{ color: meta.colors.text }}>
                      {lines.meta}
                    </p>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        {slotMenu ? (
          <SlotQuickMenu
            menu={slotMenu}
            onClose={() => setSlotMenu(null)}
            onPick={(type) => {
              onQuickCreate(slotMenu.draft, type);
              setSlotMenu(null);
            }}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative flex h-full flex-col">
      <div className="flex border-b border-slate-200/80">
        <div className="flex w-14 shrink-0 flex-col items-center justify-center gap-0.5">
          {mode === "week" ? (
            <span className="text-[10px] font-bold tabular-nums text-[#1e3a5f]/70">
              {isoWeekLabel(days[0]!)}
            </span>
          ) : null}
        </div>
        <div className={`grid flex-1 ${mode === "week" ? "grid-cols-7" : "grid-cols-1"}`}>
          {days.map((d) => {
            const isToday = isSameDay(d, now);
            return (
              <div
                key={d.toISOString()}
                className={`border-l border-slate-100 px-2 py-2 text-center ${
                  isToday ? "bg-[#1e3a5f]/[0.04]" : ""
                }`}
              >
                <p
                  className={`text-[11px] font-medium uppercase ${
                    isToday ? "text-[#1e3a5f]" : "text-slate-400"
                  }`}
                >
                  {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                </p>
                <p
                  className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                    isToday
                      ? "bg-[#1e3a5f] text-white"
                      : "text-[#1e3a5f]"
                  }`}
                >
                  {d.getDate()}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOUTE LA JOURNÉE — toujours visible */}
      <div className="flex border-b border-slate-200/80">
        <div className="flex w-14 shrink-0 items-start justify-end pr-1.5 pt-2 text-[9px] font-bold uppercase leading-tight tracking-wide text-slate-400">
          Toute la
          <br />
          journée
        </div>
        <div className={`grid flex-1 ${mode === "week" ? "grid-cols-7" : "grid-cols-1"}`}>
          {days.map((d) => {
            const isToday = isSameDay(d, now);
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
                className={`min-h-[40px] space-y-0.5 border-l border-slate-100 p-1 ${
                  isToday ? "bg-[#1e3a5f]/[0.03]" : ""
                }`}
                onDoubleClick={() => {
                  const start = startOfDay(d);
                  const end = new Date(start);
                  end.setHours(23, 59, 0, 0);
                  onQuickCreate(
                    { startAt: start.toISOString(), endAt: end.toISOString(), allDay: true },
                    "ECHEANCE",
                  );
                }}
              >
                {dayEvents.map((ev) => {
                  const lines = agendaEventCardLines(ev);
                  const meta = agendaTypeMeta(ev.type);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => onSelectEvent(ev.id)}
                      className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium ${
                        ev.id === selectedEventId ? "ring-1 ring-[#1d4ed8]" : ""
                      } ${lines.done ? "opacity-55" : ""} ${
                        lines.unconfirmed ? "border border-dashed border-orange-400/70" : ""
                      }`}
                      style={{
                        backgroundColor: meta.colors.bg,
                        color: meta.colors.text,
                        borderLeft: `3px solid ${meta.colors.border}`,
                      }}
                    >
                      {lines.done ? "✓ " : ""}
                      {lines.eyebrow.includes("🚚") ? lines.eyebrow : lines.title}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {!extended ? (
        <div className="flex items-center justify-center border-b border-slate-100 bg-slate-50/50 py-0.5">
          <button
            type="button"
            onClick={() => setExtended(true)}
            className="text-[10px] font-semibold text-slate-400 hover:text-slate-600"
          >
            Afficher 06:00 – 22:00
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center border-b border-slate-100 bg-slate-50/50 py-0.5">
          <button
            type="button"
            onClick={() => setExtended(false)}
            className="text-[10px] font-semibold text-slate-400 hover:text-slate-600"
          >
            Revenir à 07:00 – 19:00
          </button>
        </div>
      )}

      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-y-auto">
        <div className="flex" style={{ height: gridHeight }}>
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
            style={{ height: gridHeight }}
          >
            {hours.map((h) => (
              <div
                key={`line-${h}`}
                className="pointer-events-none absolute left-0 right-0 border-t border-slate-100"
                style={{ top: minutesToY(h * 60) }}
              />
            ))}

            {days.map((d, dayIndex) => {
              const isToday = isSameDay(d, now);
              return (
                <div
                  key={d.toISOString()}
                  className={`relative border-l border-slate-100 ${
                    isToday ? "bg-[#1e3a5f]/[0.03]" : ""
                  }`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("[data-agenda-event]")) return;
                    openSlotAt(e, dayIndex);
                  }}
                >
                  {timedEvents.map((ev) => {
                    const { start, end } = getEventTimes(ev);
                    if (!isSameDay(start, d)) return null;

                    const startMins = minutesSinceMidnight(start);
                    const endMins = minutesSinceMidnight(end);
                    if (endMins <= gridTopMin || startMins >= gridBottomMin) return null;

                    const clampedStart = Math.max(startMins, gridTopMin);
                    const clampedEnd = Math.min(endMins, gridBottomMin);
                    const top = minutesToY(clampedStart);
                    const height = Math.max(22, minutesToY(clampedEnd) - top);
                    const meta = agendaTypeMeta(ev.type);
                    const selected = ev.id === selectedEventId;
                    const lines = agendaEventCardLines(ev, { start, end });
                    const urgencyStyle =
                      ev.urgency && URGENCY_STYLES[ev.urgency as keyof typeof URGENCY_STYLES]
                        ? URGENCY_STYLES[ev.urgency as keyof typeof URGENCY_STYLES]
                        : null;
                    const linkedPo = Boolean(ev.linkedPurchaseOrder || ev.purchaseOrderId);

                    return (
                      <div
                        key={ev.id}
                        data-agenda-event
                        className={`absolute left-1 right-1 z-10 overflow-hidden rounded-md border border-l-[3px] px-1.5 py-0.5 text-left ${
                          ev.readOnly ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
                        } ${selected ? "ring-2 ring-[#1e3a5f]/40 ring-offset-1" : ""} ${
                          lines.done ? "opacity-50" : ""
                        } ${lines.unconfirmed ? "border-dashed opacity-90" : ""}`}
                        style={{
                          top,
                          height,
                          backgroundColor: meta.colors.bg,
                          borderColor: meta.colors.border,
                          color: meta.colors.text,
                        }}
                        onPointerDown={(e) => {
                          if (ev.readOnly) return;
                          startMove(e, ev, dayIndex);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(ev.id);
                        }}
                      >
                        <div className="flex items-start gap-1">
                          {lines.urgencyDot && urgencyStyle ? (
                            <span
                              className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${urgencyStyle.dot}`}
                              title={ev.urgencyLabel ?? undefined}
                            />
                          ) : null}
                          <p className="truncate text-[10px] font-bold uppercase leading-tight tracking-wide opacity-90">
                            {lines.eyebrow}
                          </p>
                        </div>
                        {height > 28 ? (
                          <p className="truncate text-[11px] font-semibold leading-tight">
                            {lines.title}
                          </p>
                        ) : null}
                        {height > 44 && lines.meta ? (
                          <p className="truncate text-[10px] opacity-75">{lines.meta}</p>
                        ) : height > 44 && lines.time ? (
                          <p className="truncate text-[10px] opacity-75">{lines.time}</p>
                        ) : null}
                        {!ev.readOnly && !linkedPo ? (
                          <div
                            className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
                            onPointerDown={(e) => startResize(e, ev, dayIndex)}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {showNow && nowDayIndex >= 0 ? (
              <div
                className="pointer-events-none absolute z-20"
                style={{
                  top: nowY,
                  left: mode === "week" ? `${(nowDayIndex / days.length) * 100}%` : 0,
                  width: mode === "week" ? `${100 / days.length}%` : "100%",
                }}
              >
                <div className="relative border-t border-[#c2410c]">
                  <span className="absolute -left-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-[#c2410c]" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {slotMenu ? (
        <SlotQuickMenu
          menu={slotMenu}
          onClose={() => setSlotMenu(null)}
          onPick={(type) => {
            onQuickCreate(slotMenu.draft, type);
            setSlotMenu(null);
          }}
        />
      ) : null}
    </div>
  );
}

function SlotQuickMenu({
  menu,
  onClose,
  onPick,
}: {
  menu: { x: number; y: number; draft: AgendaQuickCreateDraft };
  onClose: () => void;
  onPick: (type: string) => void;
}) {
  const start = new Date(menu.draft.startAt);
  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default bg-transparent"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div
        className="fixed z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        style={{ left: menu.x, top: menu.y }}
      >
        <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
          {formatTime(start)}
        </p>
        <ul className="py-1">
          {SLOT_QUICK_TYPES.map((q) => (
            <li key={q.type}>
              <button
                type="button"
                onClick={() => onPick(q.type)}
                className="w-full px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                + {q.label}
              </button>
            </li>
          ))}
        </ul>
        <p className="border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-400">
          Livraison : depuis une commande
        </p>
      </div>
    </>
  );
}
