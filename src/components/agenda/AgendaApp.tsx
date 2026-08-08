"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Filter,
  PanelRight,
  Plus,
  Search,
  X,
} from "lucide-react";
import {
  addDays,
  addMonths,
  addYears,
  formatDayTitle,
  formatMonthYear,
  isSameDay,
  rangeForView,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "@/lib/agenda/dates";
import { AGENDA_EVENT_TYPES, type AgendaScope } from "@/lib/agenda/types";
import type {
  AgendaEventDTO,
  AgendaProjectOption,
  AgendaQuickCreateDraft,
  AgendaUserOption,
  AgendaView,
} from "./agenda-types";
import { AgendaDayWeekView } from "./AgendaDayWeekView";
import { AgendaEventModal } from "./AgendaEventModal";
import { AgendaMonthView } from "./AgendaMonthView";
import { AgendaSidePanel } from "./AgendaSidePanel";
import { AgendaYearView } from "./AgendaYearView";

type Props = {
  projects: AgendaProjectOption[];
  teamUsers: AgendaUserOption[];
  currentUserId: string;
};

const VIEW_LABELS: { id: AgendaView; label: string }[] = [
  { id: "day", label: "Jour" },
  { id: "week", label: "Semaine" },
  { id: "month", label: "Mois" },
  { id: "year", label: "Année" },
];

export function AgendaApp({ projects, teamUsers, currentUserId }: Props) {
  const [view, setView] = useState<AgendaView>("week");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<AgendaEventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [scope, setScope] = useState<AgendaScope>("all");
  const [typeFilter, setTypeFilter] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<AgendaQuickCreateDraft | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [duplicateFrom, setDuplicateFrom] = useState<AgendaEventDTO | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { from, to } = rangeForView(view, cursor);
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
        scope,
      });
      if (searchDebounced) params.set("q", searchDebounced);
      if (typeFilter) params.set("type", typeFilter);
      const res = await fetch(`/api/agenda/events?${params}`, {
        credentials: "same-origin",
      });
      if (!res.ok) {
        setEvents([]);
        return;
      }
      const data = await res.json();
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [view, cursor, scope, searchDebounced, typeFilter]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("event");
    const projectId = params.get("projectId");
    if (eventId) {
      setSelectedEventId(eventId);
      setPanelOpen(true);
      setView("day");
    }
    if (projectId) {
      setFiltersOpen(true);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setCursor(startOfDay(new Date()));
      }
      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setDraft(null);
        setDuplicateFrom(null);
        setCreateOpen(true);
      }
      if (e.key === "1") setView("day");
      if (e.key === "2") setView("week");
      if (e.key === "3") setView("month");
      if (e.key === "4") setView("year");
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (view === "day") setCursor((c) => addDays(c, -1));
        else if (view === "week") setCursor((c) => addDays(c, -7));
        else if (view === "month") setCursor((c) => addMonths(c, -1));
        else setCursor((c) => addYears(c, -1));
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        if (view === "day") setCursor((c) => addDays(c, 1));
        else if (view === "week") setCursor((c) => addDays(c, 7));
        else if (view === "month") setCursor((c) => addMonths(c, 1));
        else setCursor((c) => addYears(c, 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);

  const selectedEvent = useMemo(
    () => events.find((e) => e.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  const title = useMemo(() => {
    if (view === "day") {
      const t = formatDayTitle(cursor);
      return `${t.weekday} ${t.date}`;
    }
    if (view === "week") {
      const mon = startOfWeek(cursor);
      const sun = addDays(mon, 6);
      const sameMonth = mon.getMonth() === sun.getMonth();
      if (sameMonth) {
        return `${mon.getDate()} – ${sun.getDate()} ${formatMonthYear(mon)}`;
      }
      return `${mon.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${sun.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    if (view === "year") return String(cursor.getFullYear());
    return formatMonthYear(cursor);
  }, [view, cursor]);

  function navigate(dir: -1 | 1) {
    if (view === "day") setCursor((c) => addDays(c, dir));
    else if (view === "week") setCursor((c) => addDays(c, dir * 7));
    else if (view === "month") setCursor((c) => addMonths(c, dir));
    else setCursor((c) => addYears(c, dir));
  }

  function goToday() {
    setCursor(startOfDay(new Date()));
  }

  function openCreate(d?: AgendaQuickCreateDraft) {
    setDuplicateFrom(null);
    setDraft(d ?? null);
    setCreateOpen(true);
  }

  function handleSelectEvent(id: string) {
    setSelectedEventId(id);
    setPanelOpen(true);
  }

  function upsertEvent(event: AgendaEventDTO) {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === event.id);
      if (idx === -1) return [...prev, event].sort((a, b) => a.startAt.localeCompare(b.startAt));
      const next = [...prev];
      next[idx] = event;
      return next;
    });
    setSelectedEventId(event.id);
  }

  async function handleDelete() {
    if (!selectedEvent || selectedEvent.readOnly) return;
    const realId = selectedEvent.id.includes("__")
      ? selectedEvent.id.split("__")[0]!
      : selectedEvent.id;
    if (!window.confirm("Supprimer cet événement ?")) return;
    try {
      const res = await fetch(`/api/agenda/events/${realId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) return;
      setEvents((prev) => prev.filter((e) => e.id !== selectedEvent.id && !e.id.startsWith(`${realId}__`)));
      setSelectedEventId(null);
    } catch {
      /* ignore */
    }
  }

  async function handleRsvp(status: "ACCEPTE" | "REFUSE") {
    if (!selectedEvent || selectedEvent.readOnly) return;
    const realId = selectedEvent.id.includes("__")
      ? selectedEvent.id.split("__")[0]!
      : selectedEvent.id;
    try {
      const res = await fetch(`/api/agenda/events/${realId}/rsvp`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.event) {
        upsertEvent({ ...data.event, readOnly: false, source: "agenda" });
        void loadEvents();
      }
    } catch {
      /* ignore */
    }
  }

  async function handleStatusChange(status: "PLANIFIE" | "CONFIRME" | "TERMINE" | "ANNULE") {
    if (!selectedEvent || selectedEvent.readOnly) return;
    const realId = selectedEvent.id.includes("__")
      ? selectedEvent.id.split("__")[0]!
      : selectedEvent.id;
    try {
      const res = await fetch(`/api/agenda/events/${realId}`, {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.event) {
        if (status === "ANNULE") {
          setEvents((prev) =>
            prev.filter((e) => e.id !== selectedEvent.id && !e.id.startsWith(`${realId}__`)),
          );
          setSelectedEventId(null);
        } else {
          upsertEvent({ ...data.event, readOnly: false, source: "agenda" });
        }
        void loadEvents();
      }
    } catch {
      /* ignore */
    }
  }

  const todayEvents = useMemo(() => {
    const today = startOfDay(new Date());
    return events
      .filter((e) => e.status !== "ANNULE" && isSameDay(new Date(e.startAt), today))
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  }, [events]);

  function handleDuplicate() {
    if (!selectedEvent || selectedEvent.readOnly) return;
    setDuplicateFrom(selectedEvent);
    setDraft({
      startAt: selectedEvent.startAt,
      endAt: selectedEvent.endAt,
      allDay: selectedEvent.allDay,
    });
    setCreateOpen(true);
  }

  return (
    <div className="-mx-3 -my-6 flex h-[calc(100dvh-4.5rem)] min-h-[560px] bg-white sm:-mx-5 sm:-my-8">
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/80 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg px-2.5 py-1.5 text-lg text-slate-500 hover:bg-slate-100"
              aria-label="Précédent"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => navigate(1)}
              className="rounded-lg px-2.5 py-1.5 text-lg text-slate-500 hover:bg-slate-100"
              aria-label="Suivant"
            >
              ›
            </button>
            <button
              type="button"
              onClick={goToday}
              className="ml-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Aujourd&apos;hui
            </button>
            <h1 className="ml-2 text-base font-semibold capitalize text-[#1e3a5f] sm:text-lg">
              {title}
            </h1>
          </div>

          <div className="mx-auto hidden rounded-lg bg-slate-100 p-0.5 sm:flex">
            {VIEW_LABELS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                  view === v.id
                    ? "bg-white text-[#1e3a5f] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-44 rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-[#1d4ed8] lg:w-56"
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                filtersOpen || scope !== "all" || typeFilter
                  ? "border-[#1d4ed8]/40 bg-blue-50 text-[#1d4ed8]"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filtres
            </button>
            <button
              type="button"
              onClick={() => setPanelOpen((o) => !o)}
              className="inline-flex rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 lg:hidden"
              aria-label="Panneau latéral"
            >
              <PanelRight className="h-4 w-4" />
            </button>
            <a
              href="/api/agenda/export.ics"
              className="inline-flex items-center rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              title="Exporter en .ics (Google / Outlook / Apple)"
            >
              .ics
            </a>
            <button
              type="button"
              onClick={() => openCreate()}
              className="inline-flex items-center gap-1 rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#162d4a]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nouveau</span>
            </button>
          </div>
        </div>

        {/* Mobile view switcher */}
        <div className="flex border-b border-slate-200/80 px-4 py-2 sm:hidden">
          <div className="flex w-full rounded-lg bg-slate-100 p-0.5">
            {VIEW_LABELS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold ${
                  view === v.id
                    ? "bg-white text-[#1e3a5f] shadow-sm"
                    : "text-slate-500"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {filtersOpen ? (
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/80 bg-slate-50/80 px-4 py-2.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Portée</span>
              {(
                [
                  { id: "mine", label: "Moi" },
                  { id: "team", label: "Équipe" },
                  { id: "all", label: "Tout" },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScope(s.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                    scope === s.id
                      ? "bg-white text-[#1e3a5f] shadow-sm"
                      : "text-slate-500 hover:bg-white/60"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase text-slate-400">Type</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs outline-none"
              >
                <option value="">Tous</option>
                {AGENDA_EVENT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative md:hidden">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-40 rounded-lg border border-slate-200 py-1 pl-7 pr-2 text-xs outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="ml-auto rounded-md p-1 text-slate-400 hover:bg-white"
              aria-label="Fermer les filtres"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <div className="relative min-h-0 flex-1">
          {loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm text-slate-400">
              Chargement…
            </div>
          ) : null}

          {view === "day" || view === "week" ? (
            <AgendaDayWeekView
              mode={view}
              cursor={cursor}
              events={events}
              selectedEventId={selectedEventId}
              onSelectEvent={handleSelectEvent}
              onQuickCreate={openCreate}
              onEventMoved={upsertEvent}
            />
          ) : null}

          {view === "month" ? (
            <AgendaMonthView
              cursor={cursor}
              events={events}
              selectedEventId={selectedEventId}
              onSelectEvent={handleSelectEvent}
              onOpenDay={(d) => {
                setCursor(startOfDay(d));
                setView("day");
              }}
              onQuickCreate={openCreate}
            />
          ) : null}

          {view === "year" ? (
            <AgendaYearView
              cursor={cursor}
              events={events}
              onOpenMonth={(d) => {
                setCursor(startOfMonth(d));
                setView("month");
              }}
            />
          ) : null}
        </div>
      </div>

      {/* Desktop side panel */}
      <div className="hidden lg:block">
        <AgendaSidePanel
          cursor={cursor}
          selectedEvent={selectedEvent}
          currentUserId={currentUserId}
          todayEvents={todayEvents}
          onCursorChange={setCursor}
          onSelectDay={(d) => {
            setCursor(startOfDay(d));
            setView("day");
          }}
          onSelectEvent={setSelectedEventId}
          onEdit={() => {
            if (selectedEvent?.readOnly) return;
            setEditOpen(true);
          }}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          onRsvp={handleRsvp}
          onStatusChange={handleStatusChange}
        />
      </div>

      {/* Mobile side panel overlay */}
      {panelOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/30"
            aria-label="Fermer"
            onClick={() => setPanelOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 w-[300px] bg-white shadow-xl">
            <AgendaSidePanel
              cursor={cursor}
              selectedEvent={selectedEvent}
              currentUserId={currentUserId}
              todayEvents={todayEvents}
              onCursorChange={setCursor}
              onSelectDay={(d) => {
                setCursor(startOfDay(d));
                setView("day");
                setPanelOpen(false);
              }}
              onSelectEvent={setSelectedEventId}
              onEdit={() => {
                if (selectedEvent?.readOnly) return;
                setEditOpen(true);
                setPanelOpen(false);
              }}
              onDuplicate={() => {
                handleDuplicate();
                setPanelOpen(false);
              }}
              onDelete={async () => {
                await handleDelete();
                setPanelOpen(false);
              }}
              onRsvp={handleRsvp}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>
      ) : null}

      <AgendaEventModal
        open={createOpen}
        mode="create"
        draft={draft}
        event={
          duplicateFrom
            ? {
                ...duplicateFrom,
                id: "",
                title: `${duplicateFrom.title} (copie)`,
              }
            : null
        }
        projects={projects}
        teamUsers={teamUsers}
        existingEvents={events}
        onClose={() => {
          setCreateOpen(false);
          setDraft(null);
          setDuplicateFrom(null);
        }}
        onSaved={(ev) => {
          upsertEvent(ev);
          setCreateOpen(false);
          setDraft(null);
          setDuplicateFrom(null);
        }}
      />

      <AgendaEventModal
        open={editOpen && Boolean(selectedEvent)}
        mode="edit"
        event={selectedEvent}
        projects={projects}
        teamUsers={teamUsers}
        existingEvents={events}
        onClose={() => setEditOpen(false)}
        onSaved={(ev) => {
          upsertEvent(ev);
          setEditOpen(false);
        }}
      />
    </div>
  );
}
