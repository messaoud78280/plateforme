"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AgendaEventDTO, AgendaUserOption } from "@/components/agenda/agenda-types";
import {
  addDays,
  endOfDay,
  formatDayShort,
  formatTime,
  isSameDay,
  startOfDay,
  startOfWeek,
} from "@/lib/agenda/dates";
import { agendaTypeMeta } from "@/lib/agenda/types";
import {
  eventHasConflict,
  eventHref,
  eventsForResourceOnDay,
  filterPlanningEvents,
  planningBlockLabel,
  type PlanningResource,
} from "@/lib/planning/board";
import { cn } from "@/lib/cn";

type ViewMode = "day" | "week" | "fortnight";

type Props = {
  teamUsers: AgendaUserOption[];
  currentUserId: string;
};

function rangeFor(mode: ViewMode, cursor: Date): { from: Date; to: Date; days: Date[] } {
  if (mode === "day") {
    const d = startOfDay(cursor);
    return { from: d, to: endOfDay(cursor), days: [d] };
  }
  const weekStart = startOfWeek(cursor);
  const n = mode === "fortnight" ? 14 : 7;
  const days = Array.from({ length: n }, (_, i) => addDays(weekStart, i));
  // Semaine ouvratoire : lun–ven visibles en priorité (desktop)
  const workDays = mode === "week" ? days.slice(0, 5) : days;
  return {
    from: weekStart,
    to: endOfDay(addDays(weekStart, n - 1)),
    days: mode === "week" ? workDays : days.slice(0, mode === "fortnight" ? 10 : 7),
  };
}

export function PlanningBoard({ teamUsers, currentUserId }: Props) {
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState<AgendaEventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { from, to, days } = useMemo(() => rangeFor(view, cursor), [view, cursor]);

  const resources: PlanningResource[] = useMemo(() => {
    const people: PlanningResource[] = teamUsers.map((u) => ({
      id: u.id,
      name: u.name || u.email,
      email: u.email,
      kind: "person" as const,
    }));
    const hasUnassigned = events.some((e) => !e.responsibleId);
    if (hasUnassigned || people.length === 0) {
      people.push({
        id: "__unassigned",
        name: "Non affecté",
        email: "",
        kind: "unassigned",
      });
    }
    return people;
  }, [teamUsers, events]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
        scope: "all",
        linked: "1",
      });
      const res = await fetch(`/api/agenda/events?${qs}`, { cache: "no-store" });
      if (!res.ok) {
        setError("Impossible de charger le planning.");
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data.events) ? (data.events as AgendaEventDTO[]) : [];
      setEvents(filterPlanningEvents(list));
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = events.find((e) => e.id === selectedId) ?? null;

  const titleLabel =
    view === "day"
      ? cursor.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : view === "week"
        ? `Semaine du ${startOfWeek(cursor).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}`
        : `2 semaines · ${startOfWeek(cursor).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
          })}`;

  function shift(delta: number) {
    if (view === "day") setCursor((c) => addDays(c, delta));
    else if (view === "week") setCursor((c) => addDays(c, delta * 7));
    else setCursor((c) => addDays(c, delta * 14));
  }

  return (
    <div className="flex min-h-[70vh] flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#1e3a5f]/80">
            Planning opérationnel
          </p>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 capitalize">
            {titleLabel}
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">Qui est où · Qui est disponible</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {(
              [
                ["day", "Jour"],
                ["week", "Semaine"],
                ["fortnight", "2 semaines"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-bold",
                  view === id ? "bg-[#1e3a5f] text-white" : "text-slate-600 hover:bg-white",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => shift(-1)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setCursor(new Date())}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
          >
            Aujourd’hui
          </button>
          <button
            type="button"
            onClick={() => shift(1)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
          >
            →
          </button>
          <Link
            href="/dashboard/agenda"
            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#1e3a5f] hover:bg-slate-200"
          >
            Voir Agenda
          </Link>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {/* Mobile : timeline du jour */}
      <div className="lg:hidden">
        <MobileDayTimeline
          day={view === "day" ? startOfDay(cursor) : startOfDay(new Date())}
          events={events}
          onSelect={setSelectedId}
        />
      </div>

      {/* Desktop : grille ressources × jours */}
      <div className="hidden min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">
        {loading ? (
          <p className="p-8 text-center text-sm text-slate-500">Chargement du planning…</p>
        ) : (
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="sticky top-0 z-10 bg-[#f8fafc]">
              <tr>
                <th className="sticky left-0 z-20 w-44 border-b border-r border-slate-200 bg-[#f8fafc] px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Collaborateurs
                </th>
                {days.map((d) => (
                  <th
                    key={d.toISOString()}
                    className={cn(
                      "border-b border-slate-200 px-2 py-2 text-center text-xs font-bold uppercase tracking-wide text-slate-600",
                      isSameDay(d, new Date()) && "bg-sky-50 text-[#1e3a5f]",
                    )}
                  >
                    {formatDayShort(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-3 py-2">
                    <p className="text-sm font-bold text-slate-900">{r.name}</p>
                    <p className="text-[11px] text-slate-500">
                      {r.kind === "unassigned"
                        ? "Sans responsable"
                        : r.id === currentUserId
                          ? "Vous"
                          : "Collaborateur"}
                    </p>
                  </td>
                  {days.map((d) => {
                    const cell = eventsForResourceOnDay(events, r.id, d);
                    return (
                      <td
                        key={`${r.id}-${d.toISOString()}`}
                        className={cn(
                          "border-b border-slate-100 px-1.5 py-1.5",
                          isSameDay(d, new Date()) && "bg-sky-50/40",
                        )}
                      >
                        <div className="flex min-h-[4.5rem] flex-col gap-1">
                          {cell.length === 0 ? (
                            <span className="block h-full min-h-[3rem] rounded-lg border border-dashed border-slate-100" />
                          ) : (
                            cell.map((e) => {
                              const meta = agendaTypeMeta(e.type);
                              const label = planningBlockLabel(e);
                              const conflict = eventHasConflict(e, events);
                              return (
                                <button
                                  key={e.id}
                                  type="button"
                                  onClick={() => setSelectedId(e.id)}
                                  className="w-full rounded-lg border px-2 py-1.5 text-left shadow-sm transition hover:brightness-95"
                                  style={{
                                    background: meta.colors.bg,
                                    borderColor: conflict ? "#ef4444" : meta.colors.border,
                                    color: meta.colors.text,
                                  }}
                                >
                                  <p className="text-[10px] font-bold opacity-80">{label.time}</p>
                                  <p className="truncate text-[11px] font-extrabold uppercase leading-tight">
                                    {label.site}
                                  </p>
                                  <p className="truncate text-[10px] font-medium opacity-90">
                                    {label.type}
                                  </p>
                                  {conflict ? (
                                    <p className="mt-0.5 text-[10px] font-bold text-red-700">
                                      ⚠ Conflit
                                    </p>
                                  ) : null}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected ? (
        <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                {agendaTypeMeta(selected.type).label}
              </p>
              <h2 className="text-base font-extrabold text-slate-900">{selected.title}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {formatTime(new Date(selected.startAt))} — {formatTime(new Date(selected.endAt))}
                {selected.project ? ` · ${selected.project.title}` : ""}
              </p>
              {selected.responsible ? (
                <p className="mt-0.5 text-xs text-slate-500">
                  Responsable : {selected.responsible.name}
                </p>
              ) : null}
              {eventHasConflict(selected, events) ? (
                <p className="mt-2 text-xs font-bold text-red-700">⚠ Conflit d’affectation</p>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Link
                href={eventHref(selected)}
                className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white"
              >
                Ouvrir
              </Link>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500"
              >
                Fermer
              </button>
            </div>
          </div>
        </aside>
      ) : null}
    </div>
  );
}

function MobileDayTimeline({
  day,
  events,
  onSelect,
}: {
  day: Date;
  events: AgendaEventDTO[];
  onSelect: (id: string) => void;
}) {
  const dayEvents = events
    .filter((e) => isSameDay(new Date(e.startAt), day) || spans(e, day))
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        Aujourd’hui ·{" "}
        {day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })}
      </p>
      {dayEvents.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">Rien de planifié aujourd’hui.</p>
      ) : (
        <ul className="space-y-2">
          {dayEvents.map((e) => {
            const label = planningBlockLabel(e);
            const conflict = eventHasConflict(e, events);
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onSelect(e.id)}
                  className="flex w-full gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-left"
                >
                  <span className="w-14 shrink-0 text-sm font-extrabold text-[#1e3a5f]">
                    {e.allDay ? "Jour" : formatTime(new Date(e.startAt))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-slate-900">
                      {e.responsible?.name?.split(" ")[0] ?? "—"}
                    </span>
                    <span className="block truncate text-xs font-semibold uppercase text-slate-700">
                      {label.site}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">{label.type}</span>
                    {conflict ? (
                      <span className="text-[11px] font-bold text-red-700">⚠ Conflit</span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function spans(e: AgendaEventDTO, day: Date): boolean {
  const s = new Date(e.startAt).getTime();
  const en = new Date(e.endAt).getTime();
  const d0 = startOfDay(day).getTime();
  const d1 = endOfDay(day).getTime();
  return s <= d1 && en >= d0;
}
