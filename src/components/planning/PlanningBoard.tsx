"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AgendaEventDTO } from "@/components/agenda/agenda-types";
import {
  addDays,
  endOfDay,
  formatDayShort,
  formatTime,
  isSameDay,
  isoWeekLabel,
  startOfDay,
  startOfWeek,
} from "@/lib/agenda/dates";
import { agendaTypeMeta } from "@/lib/agenda/types";
import {
  eventHref,
  eventsForResourceOnDay,
  filterPlanningEvents,
  initialsFromName,
  isDragBlocked,
  isResourceFreeOnDay,
  listEventConflicts,
  nextAssignmentAfter,
  planningBlockLabel,
  planningPeriodLabel,
  planningRoleLabel,
  planningSummary,
  shiftEventToDay,
  unassignedEventsInRange,
  visibleDaysForRange,
  type PlanningResource,
  type PlanningTeamUser,
  type PlanningWorkDays,
} from "@/lib/planning/board";
import {
  nextPlanningZoom,
  planningBlockTextPx,
  planningCellMinPx,
  prevPlanningZoom,
  readPlanningWorkDays,
  readPlanningZoom,
  writePlanningWorkDays,
  writePlanningZoom,
  type PlanningZoomLevel,
} from "@/lib/planning/zoom";
import { cn } from "@/lib/cn";

type ViewMode = "day" | "week" | "fortnight";

type Props = {
  teamUsers: PlanningTeamUser[];
  projects: { id: string; title: string }[];
  currentUserId: string;
};

const DAY_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

export function PlanningBoard({ teamUsers, projects, currentUserId }: Props) {
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState(() => new Date());
  const [events, setEvents] = useState<AgendaEventDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conflictFocusId, setConflictFocusId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [zoom, setZoom] = useState<PlanningZoomLevel>(100);
  const [workDays, setWorkDays] = useState<PlanningWorkDays>(5);
  const [q, setQ] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterAvailableOnly, setFilterAvailableOnly] = useState(false);
  const [filterConflictsOnly, setFilterConflictsOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [createDraft, setCreateDraft] = useState<{
    day: Date;
    resourceId: string;
  } | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [dragEventId, setDragEventId] = useState<string | null>(null);

  useEffect(() => {
    setZoom(readPlanningZoom());
    setWorkDays(readPlanningWorkDays());
  }, []);

  const weekStart = useMemo(() => startOfWeek(cursor), [cursor]);
  const days = useMemo(
    () => visibleDaysForRange(weekStart, view, workDays, cursor),
    [weekStart, view, workDays, cursor],
  );
  const from = useMemo(
    () => (view === "day" ? startOfDay(cursor) : weekStart),
    [view, cursor, weekStart],
  );
  const to = useMemo(() => {
    if (view === "day") return endOfDay(cursor);
    if (view === "fortnight") return endOfDay(addDays(weekStart, 13));
    return endOfDay(addDays(weekStart, 6));
  }, [view, cursor, weekStart]);

  const period = useMemo(
    () => planningPeriodLabel(view, cursor, days),
    [view, cursor, days],
  );

  const resources: PlanningResource[] = useMemo(() => {
    return teamUsers.map((u) => ({
      id: u.id,
      name: u.name || u.email,
      email: u.email,
      jobTitle: u.jobTitle,
      permissionProfile: u.permissionProfile,
      personType: u.personType,
      kind: "person" as const,
    }));
  }, [teamUsers]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
        scope: "all",
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

  const filteredEvents = useMemo(() => {
    let list = events;
    if (filterProjectId) {
      list = list.filter((e) => e.projectId === filterProjectId);
    }
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter((e) => {
        const blob = `${e.title} ${e.project?.title ?? ""} ${e.responsible?.name ?? ""} ${e.location ?? ""}`.toLowerCase();
        return blob.includes(qq);
      });
    }
    if (filterConflictsOnly) {
      list = list.filter((e) => listEventConflicts(e, events).length > 0);
    }
    return list;
  }, [events, filterProjectId, q, filterConflictsOnly]);

  const visibleResources = useMemo(() => {
    let list = resources;
    const qq = q.trim().toLowerCase();
    if (qq) {
      list = list.filter((r) => {
        if (r.name.toLowerCase().includes(qq) || r.email.toLowerCase().includes(qq)) {
          return true;
        }
        return days.some((d) =>
          eventsForResourceOnDay(filteredEvents, r.id, d).some((e) => {
            const blob = `${e.title} ${e.project?.title ?? ""}`.toLowerCase();
            return blob.includes(qq);
          }),
        );
      });
    }
    if (filterProjectId) {
      list = list.filter((r) =>
        days.some((d) =>
          eventsForResourceOnDay(filteredEvents, r.id, d).some(
            (e) => e.projectId === filterProjectId,
          ),
        ),
      );
    }
    if (filterAvailableOnly) {
      const focusDay = view === "day" ? startOfDay(cursor) : startOfDay(new Date());
      list = list.filter((r) => isResourceFreeOnDay(filteredEvents, r.id, focusDay));
    }
    if (filterConflictsOnly) {
      list = list.filter((r) =>
        days.some((d) =>
          eventsForResourceOnDay(filteredEvents, r.id, d).some(
            (e) => listEventConflicts(e, events).length > 0,
          ),
        ),
      );
    }
    return list;
  }, [
    resources,
    q,
    filterProjectId,
    filterAvailableOnly,
    filterConflictsOnly,
    filteredEvents,
    days,
    view,
    cursor,
    events,
  ]);

  const unassigned = useMemo(
    () => unassignedEventsInRange(filteredEvents, from, to),
    [filteredEvents, from, to],
  );

  const summary = useMemo(
    () => planningSummary(filteredEvents, resources, from, to),
    [filteredEvents, resources, from, to],
  );

  const nextEvt = useMemo(() => {
    if (filteredEvents.length > 0) return null;
    return nextAssignmentAfter(events, to);
  }, [filteredEvents.length, events, to]);

  const selected = events.find((e) => e.id === selectedId) ?? null;
  const conflictEvt = events.find((e) => e.id === conflictFocusId) ?? null;
  const conflictPeers = conflictEvt
    ? listEventConflicts(conflictEvt, events)
        .map((c) => events.find((e) => e.id === c.otherId || e.id.startsWith(c.otherId)))
        .filter(Boolean) as AgendaEventDTO[]
    : [];

  const cellMin = planningCellMinPx(zoom);
  const textPx = planningBlockTextPx(zoom);

  function shift(delta: number) {
    if (view === "day") setCursor((c) => addDays(c, delta));
    else if (view === "week") setCursor((c) => addDays(c, delta * 7));
    else setCursor((c) => addDays(c, delta * 14));
  }

  function applyZoom(next: PlanningZoomLevel) {
    setZoom(next);
    writePlanningZoom(next);
  }

  function applyWorkDays(n: PlanningWorkDays) {
    setWorkDays(n);
    writePlanningWorkDays(n);
  }

  async function patchEvent(
    id: string,
    body: Record<string, unknown>,
  ): Promise<{ ok: boolean; message?: string }> {
    const res = await fetch(`/api/agenda/events/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      orderUrl?: string;
    };
    if (!res.ok) {
      return {
        ok: false,
        message: data.message || data.error || "Modification refusée",
      };
    }
    return { ok: true };
  }

  async function onDropCell(resourceId: string, day: Date) {
    if (!dragEventId) return;
    const ev = events.find((e) => e.id === dragEventId);
    setDragEventId(null);
    if (!ev) return;
    const block = isDragBlocked(ev);
    if (block.blocked) {
      setToast(block.reason || "Déplacement bloqué");
      return;
    }
    const times = shiftEventToDay(ev, day);
    const body: Record<string, unknown> = {
      startAt: times.startAt,
      endAt: times.endAt,
    };
    if (resourceId !== "__unassigned" && resourceId !== ev.responsibleId) {
      body.responsibleId = resourceId;
    }
    const result = await patchEvent(ev.id, body);
    if (!result.ok) {
      setToast(result.message || "Échec");
      return;
    }
    setToast("Affectation mise à jour");
    await load();
  }

  async function submitCreate(form: FormData) {
    if (!createDraft) return;
    setCreateBusy(true);
    try {
      const type = String(form.get("type") || "INTERVENTION");
      const title = String(form.get("title") || "").trim() || agendaTypeMeta(type).label;
      const projectId = String(form.get("projectId") || "") || null;
      const startH = String(form.get("start") || "08:00");
      const endH = String(form.get("end") || "12:00");
      const [sh, sm] = startH.split(":").map(Number);
      const [eh, em] = endH.split(":").map(Number);
      const startAt = new Date(createDraft.day);
      startAt.setHours(sh || 8, sm || 0, 0, 0);
      const endAt = new Date(createDraft.day);
      endAt.setHours(eh || 12, em || 0, 0, 0);
      const res = await fetch("/api/agenda/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type,
          projectId,
          responsibleId:
            createDraft.resourceId === "__unassigned" ? null : createDraft.resourceId,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setToast(data.error || "Création impossible");
        return;
      }
      setCreateDraft(null);
      setToast("Affectation créée");
      await load();
    } finally {
      setCreateBusy(false);
    }
  }

  const emptyPeriod = !loading && filteredEvents.length === 0;

  return (
    <div
      className="flex min-h-[75vh] flex-col gap-3"
      style={
        {
          ["--pl-cell-min" as string]: `${cellMin}px`,
          ["--pl-site" as string]: `${textPx.site}px`,
          ["--pl-meta" as string]: `${textPx.meta}px`,
        } as React.CSSProperties
      }
    >
      <header className="rounded-2xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1e3a5f]/90">
              Planning équipe
            </p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
                {period.title}
              </h1>
              <span className="rounded-md bg-[#1e3a5f]/10 px-2 py-0.5 text-xs font-bold text-[#1e3a5f]">
                {isoWeekLabel(weekStart)}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-slate-600">{period.rangeLabel}</p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Qui est où · Qui est disponible
            </p>
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

            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-1 py-0.5">
              <button
                type="button"
                aria-label="Période précédente"
                onClick={() => shift(-1)}
                className="rounded-md px-2 py-1 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setCursor(new Date())}
                className="rounded-md px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Aujourd’hui
              </button>
              <button
                type="button"
                aria-label="Période suivante"
                onClick={() => shift(1)}
                className="rounded-md px-2 py-1 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                ›
              </button>
            </div>

            <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 py-0.5">
              <button
                type="button"
                disabled={!prevPlanningZoom(zoom)}
                onClick={() => {
                  const p = prevPlanningZoom(zoom);
                  if (p) applyZoom(p);
                }}
                className="rounded-md px-2 py-1 text-xs font-bold text-slate-600 disabled:opacity-40"
              >
                −
              </button>
              <span className="min-w-[3rem] text-center text-[11px] font-bold text-slate-700">
                {zoom} %
              </span>
              <button
                type="button"
                disabled={!nextPlanningZoom(zoom)}
                onClick={() => {
                  const n = nextPlanningZoom(zoom);
                  if (n) applyZoom(n);
                }}
                className="rounded-md px-2 py-1 text-xs font-bold text-slate-600 disabled:opacity-40"
              >
                +
              </button>
            </div>

            <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {([5, 6, 7] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  title={n === 5 ? "Lun–Ven" : n === 6 ? "Lun–Sam" : "Lun–Dim"}
                  onClick={() => applyWorkDays(n)}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-[11px] font-bold",
                    workDays === n ? "bg-white text-[#1e3a5f] shadow-sm" : "text-slate-500",
                  )}
                >
                  {n}j
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-bold",
                showFilters
                  ? "border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]"
                  : "border-slate-200 bg-white text-slate-700",
              )}
            >
              Filtres
            </button>

            <Link
              href="/dashboard/agenda"
              className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#16304f]"
            >
              Voir Agenda
            </Link>
          </div>
        </div>

        {showFilters ? (
          <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
            <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Recherche
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Karim, Les Lilas…"
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-800"
              />
            </label>
            <label className="flex min-w-[10rem] flex-col gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Chantier
              <select
                value={filterProjectId}
                onChange={(e) => setFilterProjectId(e.target.value)}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-800"
              >
                <option value="">Tous</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={filterAvailableOnly}
                onChange={(e) => setFilterAvailableOnly(e.target.checked)}
              />
              Disponibles
            </label>
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={filterConflictsOnly}
                onChange={(e) => setFilterConflictsOnly(e.target.checked)}
              />
              Conflits
            </label>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
          <SummaryChip label="Collaborateurs" value={summary.collaborators} />
          <SummaryChip label="Chantiers" value={summary.sites} />
          <SummaryChip label="Affectations" value={summary.assignments} />
          <SummaryChip
            label="Conflits"
            value={summary.conflicts}
            accent={summary.conflicts > 0 ? "danger" : undefined}
          />
          <SummaryChip
            label="À affecter"
            value={summary.unassigned}
            accent={summary.unassigned > 0 ? "warn" : undefined}
          />
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {toast ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {toast}
          <button
            type="button"
            className="ml-3 text-xs font-bold text-[#1e3a5f]"
            onClick={() => setToast("")}
          >
            OK
          </button>
        </p>
      ) : null}

      {unassigned.length > 0 ? (
        <section className="rounded-2xl border border-amber-200/80 bg-amber-50/60 px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wide text-amber-950">
              À affecter
            </h2>
            <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[11px] font-bold text-amber-950">
              {unassigned.length}
            </span>
          </div>
          <ul className="flex flex-wrap gap-2">
            {unassigned.slice(0, 8).map((e) => {
              const label = planningBlockLabel(e);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(e.id)}
                    className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-left shadow-sm hover:border-amber-300"
                  >
                    <p className="text-[11px] font-bold uppercase text-slate-800">{label.site}</p>
                    <p className="text-[10px] text-slate-600">
                      {label.type} ·{" "}
                      {new Date(e.startAt).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Mobile */}
      <div className="lg:hidden">
        <MobileDayPeople
          day={view === "day" ? startOfDay(cursor) : startOfDay(new Date())}
          resources={visibleResources}
          events={filteredEvents}
          allEvents={events}
          currentUserId={currentUserId}
          onSelect={setSelectedId}
          onConflict={setConflictFocusId}
          onCreate={(resourceId, day) => setCreateDraft({ resourceId, day })}
        />
      </div>

      {/* Desktop */}
      <div className="hidden min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm lg:block">
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">Chargement du planning…</p>
        ) : emptyPeriod ? (
          <EmptyPlanningState
            collaborators={resources.length}
            nextEvt={nextEvt}
            onNextWeek={() => shift(1)}
            onCreate={() =>
              setCreateDraft({
                day: startOfDay(new Date()),
                resourceId: resources[0]?.id ?? "__unassigned",
              })
            }
          />
        ) : view === "day" ? (
            <DayHourGrid
              day={startOfDay(cursor)}
              resources={visibleResources}
              events={filteredEvents}
              allEvents={events}
              currentUserId={currentUserId}
              cellMin={cellMin}
              onSelect={setSelectedId}
              onConflict={setConflictFocusId}
              onCreate={(resourceId) =>
                setCreateDraft({ resourceId, day: startOfDay(cursor) })
              }
              setDragEventId={setDragEventId}
              onDropCell={onDropCell}
            />
        ) : (
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead className="sticky top-0 z-20">
              <tr>
                <th className="sticky left-0 z-30 w-52 border-b border-r border-slate-200 bg-[#eef2f7] px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                  Collaborateurs
                </th>
                {days.map((d) => {
                  const today = isSameDay(d, new Date());
                  return (
                    <th
                      key={d.toISOString()}
                      className={cn(
                        "border-b border-slate-200 px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wide",
                        today
                          ? "bg-[#dbeafe] text-[#1e3a5f]"
                          : "bg-[#eef2f7] text-slate-600",
                      )}
                    >
                      <span className={cn(today && "underline decoration-2 underline-offset-4")}>
                        {formatDayShort(d)}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visibleResources.map((r, idx) => (
                <tr
                  key={r.id}
                  className={cn("align-top", idx % 2 === 0 ? "bg-white" : "bg-slate-50/40")}
                >
                  <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-inherit px-3 py-2.5">
                    <ResourceCell resource={r} currentUserId={currentUserId} />
                  </td>
                  {days.map((d) => {
                    const cell = eventsForResourceOnDay(filteredEvents, r.id, d);
                    const today = isSameDay(d, new Date());
                    const free = cell.length === 0;
                    return (
                      <td
                        key={`${r.id}-${d.toISOString()}`}
                        className={cn(
                          "border-b border-slate-200 px-1.5 py-1.5 align-top",
                          today && "bg-[#eff6ff]/70",
                        )}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => void onDropCell(r.id, d)}
                      >
                        <div
                          className="flex flex-col gap-1"
                          style={{ minHeight: "var(--pl-cell-min)" }}
                        >
                          {free ? (
                            <button
                              type="button"
                              onClick={() => setCreateDraft({ day: d, resourceId: r.id })}
                              className="flex h-full min-h-[3.5rem] flex-col items-start justify-center rounded-lg border border-dashed border-slate-200/90 bg-emerald-50/30 px-2 py-1.5 text-left transition hover:border-[#1e3a5f]/40 hover:bg-emerald-50/60"
                              title="Disponible — cliquer pour affecter"
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-800/70">
                                Disponible
                              </span>
                              <span className="text-[10px] font-semibold text-slate-400">
                                + Affecter
                              </span>
                            </button>
                          ) : (
                            cell.map((e) => (
                              <AssignmentBlock
                                key={e.id}
                                event={e}
                                allEvents={events}
                                onSelect={() => setSelectedId(e.id)}
                                onConflict={() => setConflictFocusId(e.id)}
                                draggable={!isDragBlocked(e).blocked}
                                onDragStart={() => setDragEventId(e.id)}
                              />
                            ))
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
        <DetailPanel
          event={selected}
          allEvents={events}
          onClose={() => setSelectedId(null)}
          onConflict={() => setConflictFocusId(selected.id)}
        />
      ) : null}

      {conflictEvt ? (
        <ConflictPanel
          event={conflictEvt}
          peers={conflictPeers}
          onClose={() => setConflictFocusId(null)}
          onOpen={(id) => {
            setConflictFocusId(null);
            setSelectedId(id);
          }}
        />
      ) : null}

      {createDraft ? (
        <CreateAssignModal
          draft={createDraft}
          resources={resources}
          projects={projects}
          busy={createBusy}
          onClose={() => setCreateDraft(null)}
          onSubmit={(fd) => void submitCreate(fd)}
        />
      ) : null}
    </div>
  );
}

function SummaryChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "danger" | "warn";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1",
        accent === "danger"
          ? "border-red-200 bg-red-50 text-red-800"
          : accent === "warn"
            ? "border-amber-200 bg-amber-50 text-amber-900"
            : "border-slate-200 bg-slate-50 text-slate-700",
      )}
    >
      <span className="font-extrabold tabular-nums">{value}</span>
      <span className="font-medium opacity-80">{label}</span>
    </span>
  );
}

function ResourceCell({
  resource,
  currentUserId,
}: {
  resource: PlanningResource;
  currentUserId: string;
}) {
  const initials = initialsFromName(resource.name);
  const role = planningRoleLabel({
    ...resource,
    currentUserId,
  });
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-[11px] font-extrabold text-white">
        {initials}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-slate-900">{resource.name}</p>
        <p className="truncate text-[11px] font-medium text-slate-500">{role}</p>
      </div>
    </div>
  );
}

function AssignmentBlock({
  event,
  allEvents,
  onSelect,
  onConflict,
  draggable,
  onDragStart,
}: {
  event: AgendaEventDTO;
  allEvents: AgendaEventDTO[];
  onSelect: () => void;
  onConflict: () => void;
  draggable: boolean;
  onDragStart: () => void;
}) {
  const meta = agendaTypeMeta(event.type);
  const label = planningBlockLabel(event);
  const conflict = listEventConflicts(event, allEvents).length > 0;
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      className="relative"
      title={`${label.time} · ${label.site} · ${label.type}`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full rounded-lg border px-2 py-1.5 text-left shadow-sm transition hover:brightness-[0.97]"
        style={{
          background: meta.colors.bg,
          borderColor: conflict ? "#ef4444" : meta.colors.border,
          color: meta.colors.text,
        }}
      >
        <p
          className="truncate font-extrabold uppercase leading-tight tracking-wide"
          style={{ fontSize: "var(--pl-site)" }}
        >
          {label.site}
        </p>
        <p className="truncate font-semibold opacity-90" style={{ fontSize: "var(--pl-meta)" }}>
          {label.type}
        </p>
        <p className="font-bold opacity-80" style={{ fontSize: "var(--pl-meta)" }}>
          {label.time}
        </p>
      </button>
      {conflict ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onConflict();
          }}
          className="mt-0.5 text-[10px] font-extrabold text-red-700 hover:underline"
        >
          ⚠ Conflit
        </button>
      ) : null}
    </div>
  );
}

function DayHourGrid({
  day,
  resources,
  events,
  allEvents,
  currentUserId,
  cellMin,
  onSelect,
  onConflict,
  onCreate,
  setDragEventId,
  onDropCell,
}: {
  day: Date;
  resources: PlanningResource[];
  events: AgendaEventDTO[];
  allEvents: AgendaEventDTO[];
  currentUserId: string;
  cellMin: number;
  onSelect: (id: string) => void;
  onConflict: (id: string) => void;
  onCreate: (resourceId: string) => void;
  setDragEventId: (id: string | null) => void;
  onDropCell: (resourceId: string, day: Date) => void | Promise<void>;
}) {
  const hourH = Math.max(36, Math.round(cellMin / 2.2));
  return (
    <div className="min-w-[720px]">
      <div
        className="sticky top-0 z-20 grid border-b border-slate-200 bg-[#eef2f7]"
        style={{ gridTemplateColumns: `3.5rem repeat(${resources.length}, minmax(9rem, 1fr))` }}
      >
        <div className="border-r border-slate-200 px-1 py-2 text-[10px] font-bold uppercase text-slate-500">
          Heure
        </div>
        {resources.map((r) => (
          <div key={r.id} className="border-r border-slate-200 px-2 py-2">
            <ResourceCell resource={r} currentUserId={currentUserId} />
          </div>
        ))}
      </div>
      <div
        className="relative grid"
        style={{ gridTemplateColumns: `3.5rem repeat(${resources.length}, minmax(9rem, 1fr))` }}
      >
        <div>
          {DAY_HOURS.map((h) => (
            <div
              key={h}
              className="border-b border-r border-slate-100 px-1 text-[10px] font-bold text-slate-500"
              style={{ height: hourH }}
            >
              {String(h).padStart(2, "0")}:00
            </div>
          ))}
        </div>
        {resources.map((r) => {
          const cell = eventsForResourceOnDay(events, r.id, day);
          const free = cell.length === 0;
          return (
            <div
              key={r.id}
              className="relative border-r border-slate-100"
              style={{ height: hourH * DAY_HOURS.length }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => void onDropCell(r.id, day)}
            >
              {DAY_HOURS.map((h) => (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-b border-slate-50"
                  style={{ top: (h - DAY_HOURS[0]!) * hourH, height: hourH }}
                />
              ))}
              {free ? (
                <button
                  type="button"
                  onClick={() => onCreate(r.id)}
                  className="absolute inset-1 flex items-center justify-center rounded-lg border border-dashed border-emerald-200/80 bg-emerald-50/40 text-[10px] font-bold uppercase text-emerald-800/70"
                >
                  Disponible
                </button>
              ) : (
                cell.map((e) => {
                  const start = new Date(e.startAt);
                  const end = new Date(e.endAt);
                  const startMin = Math.max(
                    0,
                    (start.getHours() - DAY_HOURS[0]!) * 60 + start.getMinutes(),
                  );
                  const endMin = Math.min(
                    DAY_HOURS.length * 60,
                    (end.getHours() - DAY_HOURS[0]!) * 60 + end.getMinutes(),
                  );
                  const top = (startMin / 60) * hourH;
                  const height = Math.max(28, ((endMin - startMin) / 60) * hourH);
                  const meta = agendaTypeMeta(e.type);
                  const label = planningBlockLabel(e);
                  const conflict = listEventConflicts(e, allEvents).length > 0;
                  return (
                    <button
                      key={e.id}
                      type="button"
                      draggable={!isDragBlocked(e).blocked}
                      onDragStart={() => setDragEventId(e.id)}
                      onClick={() => onSelect(e.id)}
                      className="absolute left-1 right-1 z-[1] overflow-hidden rounded-lg border px-1.5 py-1 text-left shadow-sm"
                      style={{
                        top,
                        height,
                        background: meta.colors.bg,
                        borderColor: conflict ? "#ef4444" : meta.colors.border,
                        color: meta.colors.text,
                      }}
                    >
                      <p className="truncate text-[10px] font-extrabold uppercase">{label.site}</p>
                      <p className="truncate text-[9px] font-semibold">{label.time}</p>
                      {conflict ? (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(ev) => {
                            ev.stopPropagation();
                            onConflict(e.id);
                          }}
                          className="text-[9px] font-extrabold text-red-700"
                        >
                          ⚠
                        </span>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileDayPeople({
  day,
  resources,
  events,
  allEvents,
  currentUserId,
  onSelect,
  onConflict,
  onCreate,
}: {
  day: Date;
  resources: PlanningResource[];
  events: AgendaEventDTO[];
  allEvents: AgendaEventDTO[];
  currentUserId: string;
  onSelect: (id: string) => void;
  onConflict: (id: string) => void;
  onCreate: (resourceId: string, day: Date) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {day.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "short",
        })}
      </p>
      <ul className="space-y-2">
        {resources.map((r) => {
          const cell = eventsForResourceOnDay(events, r.id, day);
          return (
            <li key={r.id} className="rounded-xl border border-slate-200 p-2.5">
              <ResourceCell resource={r} currentUserId={currentUserId} />
              <div className="mt-2 space-y-1.5">
                {cell.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => onCreate(r.id, day)}
                    className="w-full rounded-lg border border-dashed border-emerald-200 bg-emerald-50/50 px-2 py-2 text-left text-xs font-bold text-emerald-800"
                  >
                    Disponible · + Affecter
                  </button>
                ) : (
                  cell.map((e) => {
                    const label = planningBlockLabel(e);
                    const conflict = listEventConflicts(e, allEvents).length > 0;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => onSelect(e.id)}
                        className="flex w-full flex-col rounded-lg bg-slate-50 px-2.5 py-2 text-left"
                      >
                        <span className="text-xs font-extrabold uppercase text-slate-900">
                          {label.site}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-600">
                          {label.time} · {label.type}
                        </span>
                        {conflict ? (
                          <button
                            type="button"
                            className="mt-0.5 self-start text-[11px] font-bold text-red-700"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              onConflict(e.id);
                            }}
                          >
                            ⚠ Conflit
                          </button>
                        ) : null}
                      </button>
                    );
                  })
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EmptyPlanningState({
  collaborators,
  nextEvt,
  onNextWeek,
  onCreate,
}: {
  collaborators: number;
  nextEvt: AgendaEventDTO | null;
  onNextWeek: () => void;
  onCreate: () => void;
}) {
  const nextLabel = nextEvt ? planningBlockLabel(nextEvt) : null;
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <p className="text-base font-extrabold text-slate-900">Aucune affectation cette période</p>
      <p className="mt-1 text-sm text-slate-600">
        {collaborators} collaborateur{collaborators > 1 ? "s" : ""} disponible
        {collaborators > 1 ? "s" : ""}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onCreate}
          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-xs font-bold text-white"
        >
          + Planifier une intervention
        </button>
        <button
          type="button"
          onClick={onNextWeek}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700"
        >
          Voir la période suivante
        </button>
      </div>
      {nextEvt && nextLabel ? (
        <p className="mt-6 text-xs text-slate-500">
          Prochaine affectation :{" "}
          <span className="font-bold text-slate-800">
            {nextEvt.responsible?.name?.split(" ")[0]} · {nextLabel.site} ·{" "}
            {new Date(nextEvt.startAt).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </span>{" "}
          <Link
            href={eventHref(nextEvt)}
            className="font-bold text-[#1e3a5f] underline"
          >
            Voir
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function DetailPanel({
  event,
  allEvents,
  onClose,
  onConflict,
}: {
  event: AgendaEventDTO;
  allEvents: AgendaEventDTO[];
  onClose: () => void;
  onConflict: () => void;
}) {
  const conflict = listEventConflicts(event, allEvents).length > 0;
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {agendaTypeMeta(event.type).label}
          </p>
          <h2 className="text-base font-extrabold text-slate-900">
            {event.project?.title || event.title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {formatTime(new Date(event.startAt))} — {formatTime(new Date(event.endAt))}
            {event.title && event.project ? ` · ${event.title}` : ""}
          </p>
          {event.responsible ? (
            <p className="mt-0.5 text-xs text-slate-500">
              Responsable : {event.responsible.name}
            </p>
          ) : (
            <p className="mt-0.5 text-xs font-semibold text-amber-700">Non affecté</p>
          )}
          {conflict ? (
            <button
              type="button"
              onClick={onConflict}
              className="mt-2 text-xs font-bold text-red-700 underline"
            >
              ⚠ Voir le conflit
            </button>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Link
            href={eventHref(event)}
            className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white"
          >
            Ouvrir
          </Link>
          <Link
            href={`/dashboard/agenda?event=${encodeURIComponent(event.id)}`}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
          >
            Agenda
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500"
          >
            Fermer
          </button>
        </div>
      </div>
    </aside>
  );
}

function ConflictPanel({
  event,
  peers,
  onClose,
  onOpen,
}: {
  event: AgendaEventDTO;
  peers: AgendaEventDTO[];
  onClose: () => void;
  onOpen: (id: string) => void;
}) {
  const items = [event, ...peers];
  return (
    <aside className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-red-900">
          Conflit · {event.responsible?.name || "Ressource"}
        </h2>
        <button type="button" onClick={onClose} className="text-xs font-semibold text-slate-500">
          Fermer
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((e) => {
          const label = planningBlockLabel(e);
          return (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onOpen(e.id)}
                className="w-full rounded-xl border border-red-100 bg-white px-3 py-2 text-left"
              >
                <p className="text-xs font-bold text-slate-800">{label.time}</p>
                <p className="text-sm font-extrabold uppercase text-slate-900">{label.site}</p>
                <p className="text-[11px] text-slate-600">{label.type}</p>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex gap-2">
        <Link
          href={`/dashboard/agenda?event=${encodeURIComponent(event.id)}`}
          className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white"
        >
          Voir Agenda
        </Link>
      </div>
    </aside>
  );
}

function CreateAssignModal({
  draft,
  resources,
  projects,
  busy,
  onClose,
  onSubmit,
}: {
  draft: { day: Date; resourceId: string };
  resources: PlanningResource[];
  projects: { id: string; title: string }[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (fd: FormData) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <form
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(new FormData(e.currentTarget));
        }}
      >
        <h2 className="text-base font-extrabold text-slate-900">Affecter</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {draft.day.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <div className="mt-3 space-y-2">
          <label className="block text-[10px] font-bold uppercase text-slate-500">
            Type
            <select
              name="type"
              defaultValue="INTERVENTION"
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
            >
              <option value="INTERVENTION">Intervention</option>
              <option value="VISITE_CHANTIER">Visite chantier</option>
              <option value="REUNION_CHANTIER">Réunion</option>
              <option value="RDV_CLIENT">RDV client</option>
              <option value="CONTROLE">Contrôle</option>
              <option value="AUTRE">Autre</option>
            </select>
          </label>
          <label className="block text-[10px] font-bold uppercase text-slate-500">
            Titre
            <input
              name="title"
              placeholder="Ex. Intervention toiture"
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
            />
          </label>
          <label className="block text-[10px] font-bold uppercase text-slate-500">
            Chantier
            <select name="projectId" className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm">
              <option value="">—</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[10px] font-bold uppercase text-slate-500">
            Collaborateur
            <select
              name="responsible"
              defaultValue={draft.resourceId}
              disabled
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-[10px] font-bold uppercase text-slate-500">
              Début
              <input
                name="start"
                type="time"
                defaultValue="08:00"
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
              />
            </label>
            <label className="block text-[10px] font-bold uppercase text-slate-500">
              Fin
              <input
                name="end"
                type="time"
                defaultValue="12:00"
                className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm"
              />
            </label>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? "…" : "Créer"}
          </button>
        </div>
      </form>
    </div>
  );
}
