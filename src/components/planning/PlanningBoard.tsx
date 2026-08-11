"use client";

/**
 * PLANNING-V2C.1 — vue ressources simple (personnes × jours).
 * Intelligence V2C derrière l’UI — pas de timeline horaire type Agenda.
 */
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AgendaEventDTO } from "@/components/agenda/agenda-types";
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
  eventHref,
  eventsForResourceOnDay,
  filterPlanningEvents,
  filterResourcesByScope,
  hasTerrainPlanifiableUsers,
  initialsFromName,
  isDragBlocked,
  listEventConflicts,
  planningBlockLabel,
  planningPeriodLabel,
  planningRoleLabel,
  planningSummary,
  shiftEventToDay,
  unassignedEventsInRange,
  visibleDaysForRange,
  type PlanningResource,
  type PlanningResourceScope,
  type PlanningTeamUser,
  type PlanningWorkDays,
} from "@/lib/planning/board";
import {
  evaluatePlanningAssigneeSuggestions,
  type PlanningProjectHint,
} from "@/lib/planning/suggestions";
import {
  computeResourceWorkload,
  formatPlanningDuration,
  nextAssignmentForResource,
} from "@/lib/planning/workload";
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
  projectHints?: PlanningProjectHint[];
  currentUserId: string;
};

export function PlanningBoard({
  teamUsers,
  projects,
  projectHints = [],
  currentUserId,
}: Props) {
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
  /** all | conflicts | unassigned — filtres naturels V2C */
  const [filterState, setFilterState] = useState<"all" | "conflicts" | "unassigned">("all");
  const [showFilters, setShowFilters] = useState(false);
  const canUseTerrainScope = useMemo(() => hasTerrainPlanifiableUsers(teamUsers), [teamUsers]);
  const [resourceScope, setResourceScope] = useState<PlanningResourceScope>("terrain");
  const [createDraft, setCreateDraft] = useState<{
    day: Date;
    resourceId: string;
  } | null>(null);
  const [assignEvent, setAssignEvent] = useState<AgendaEventDTO | null>(null);
  const [conflictConfirm, setConflictConfirm] = useState<{
    event: AgendaEventDTO;
    userId: string;
    userName: string;
    warning: string;
  } | null>(null);
  const [personPanelId, setPersonPanelId] = useState<string | null>(null);
  const [createBusy, setCreateBusy] = useState(false);
  const [dragEventId, setDragEventId] = useState<string | null>(null);

  useEffect(() => {
    setZoom(readPlanningZoom());
    setWorkDays(readPlanningWorkDays());
  }, []);

  useEffect(() => {
    if (!canUseTerrainScope && resourceScope === "terrain") {
      setResourceScope("all");
    }
  }, [canUseTerrainScope, resourceScope]);

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
    const mapped = teamUsers.map((u) => ({
      id: u.id,
      name: u.name || u.email,
      email: u.email,
      jobTitle: u.jobTitle,
      permissionProfile: u.permissionProfile,
      personType: u.personType,
      kind: "person" as const,
    }));
    return filterResourcesByScope(mapped, canUseTerrainScope ? resourceScope : "all").sort((a, b) =>
      a.name.localeCompare(b.name, "fr", { sensitivity: "base" }),
    );
  }, [teamUsers, resourceScope, canUseTerrainScope]);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
        scope: "all",
      });
      const res = await fetch(`/api/agenda/events?${qs}`, { cache: "no-store" });
      if (!res.ok) {
        if (!opts?.silent) setError("Impossible de charger le planning.");
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data.events) ? (data.events as AgendaEventDTO[]) : [];
      setEvents(filterPlanningEvents(list));
    } catch {
      if (!opts?.silent) setError("Erreur réseau.");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  const projectHintById = useMemo(() => {
    const map = new Map<string, PlanningProjectHint>();
    for (const h of projectHints) map.set(h.id, h);
    return map;
  }, [projectHints]);

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
    if (filterState === "conflicts") {
      list = list.filter((e) => listEventConflicts(e, events).length > 0);
    }
    if (filterState === "unassigned") {
      list = list.filter((e) => !e.responsibleId);
    }
    return list;
  }, [events, filterProjectId, q, filterState]);

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
    if (filterState === "conflicts") {
      list = list.filter((r) =>
        days.some((d) =>
          eventsForResourceOnDay(filteredEvents, r.id, d).some(
            (e) => listEventConflicts(e, events).length > 0,
          ),
        ),
      );
    }
    // « Sans responsable » : on garde toute l'équipe visible (affectation depuis À organiser)
    return list;
  }, [resources, q, filterProjectId, filterState, filteredEvents, days, events]);

  const unassigned = useMemo(
    () => unassignedEventsInRange(
      filterState === "unassigned" ? events.filter((e) => !e.responsibleId) : filteredEvents,
      from,
      to,
    ),
    [filteredEvents, events, filterState, from, to],
  );

  const summary = useMemo(
    () => planningSummary(filteredEvents, visibleResources, from, to),
    [filteredEvents, visibleResources, from, to],
  );

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

  /** Optimistic UI — pas de router.refresh ; rollback si API échoue. */
  async function patchEventOptimistic(
    id: string,
    body: Record<string, unknown>,
    applyLocal: (prev: AgendaEventDTO[]) => AgendaEventDTO[],
    successMsg: string,
  ): Promise<boolean> {
    const snapshot = events;
    setEvents(applyLocal(events));
    const result = await patchEvent(id, body);
    if (!result.ok) {
      setEvents(snapshot);
      setToast(result.message || "Échec");
      return false;
    }
    setToast(successMsg);
    void load({ silent: true });
    return true;
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
    const person =
      resourceId !== "__unassigned"
        ? resources.find((r) => r.id === resourceId)
        : null;
    if (resourceId !== "__unassigned" && resourceId !== ev.responsibleId) {
      body.responsibleId = resourceId;
    }
    const dayLabel = day.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const msg = person
      ? `Affecté à ${person.name.split(" ")[0]} · ${dayLabel}`
      : `Déplacé au ${dayLabel}`;
    await patchEventOptimistic(
      ev.id,
      body,
      (prev) =>
        prev.map((e) =>
          e.id === ev.id
            ? {
                ...e,
                startAt: times.startAt,
                endAt: times.endAt,
                responsibleId:
                  typeof body.responsibleId === "string"
                    ? body.responsibleId
                    : e.responsibleId,
                responsible:
                  person
                    ? { id: person.id, name: person.name, email: person.email }
                    : e.responsible,
              }
            : e,
        ),
      msg,
    );
  }

  async function assignToUser(event: AgendaEventDTO, userId: string, force = false) {
    const user = teamUsers.find((u) => u.id === userId);
    if (!user) return;
    const probeConflicts = listEventConflicts(
      { ...event, responsibleId: userId },
      events,
    );
    if (probeConflicts.length > 0 && !force) {
      const peer = probeConflicts[0]!;
      const when = peer.otherStartAt
        ? new Date(peer.otherStartAt).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";
      setConflictConfirm({
        event,
        userId,
        userName: user.name,
        warning: `${user.name.split(" ")[0]} a déjà « ${peer.otherTitle} »${when ? ` (${when})` : ""}.`,
      });
      return;
    }
    setConflictConfirm(null);
    setAssignEvent(null);
    const ok = await patchEventOptimistic(
      event.id,
      { responsibleId: userId },
      (prev) =>
        prev.map((e) =>
          e.id === event.id
            ? {
                ...e,
                responsibleId: userId,
                responsible: { id: user.id, name: user.name, email: user.email },
              }
            : e,
        ),
      `Affecté à ${user.name.split(" ")[0]}`,
    );
    if (!ok) setAssignEvent(event);
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
      await load({ silent: true });
    } finally {
      setCreateBusy(false);
    }
  }

  const emptyPeriod = !loading && filteredEvents.length === 0;
  const personPanel = personPanelId
    ? resources.find((r) => r.id === personPanelId) ?? null
    : null;
  const activeFilterCount =
    (q.trim() ? 1 : 0) + (filterProjectId ? 1 : 0) + (filterState !== "all" ? 1 : 0);
  const searchQuery = q.trim();

  function resetFilters() {
    setQ("");
    setFilterProjectId("");
    setFilterState("all");
  }

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
            <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              {period.title}
            </h1>
            {period.rangeLabel ? (
              <p className="mt-0.5 text-sm text-slate-600">{period.rangeLabel}</p>
            ) : null}
            <p className="mt-1 text-xs font-medium text-slate-500">
              {summary.collaborators} collaborateur{summary.collaborators > 1 ? "s" : ""}
              {" · "}
              {summary.assignments} affectation{summary.assignments > 1 ? "s" : ""}
              {" · "}
              {summary.conflicts} conflit{summary.conflicts > 1 ? "s" : ""}
              {summary.sites > 0
                ? ` · ${summary.sites} chantier${summary.sites > 1 ? "s" : ""}`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canUseTerrainScope ? (
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                {(
                  [
                    ["terrain", "Équipe terrain"],
                    ["all", "Toute l'équipe"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setResourceScope(id)}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-[11px] font-bold",
                      resourceScope === id
                        ? "bg-[#1e3a5f] text-white"
                        : "text-slate-600 hover:bg-white",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}

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

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-bold",
                  showFilters || activeFilterCount > 0
                    ? "border-[#1e3a5f] bg-[#1e3a5f]/5 text-[#1e3a5f]"
                    : "border-slate-200 bg-white text-slate-700",
                )}
              >
                {activeFilterCount > 0 ? `Filtres · ${activeFilterCount}` : "Filtres"}
              </button>
              {showFilters ? (
                <div className="absolute right-0 z-40 mt-1.5 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Recherche
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Karim, Les Lilas…"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-800"
                    />
                  </label>
                  <label className="mt-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    Chantier
                    <select
                      value={filterProjectId}
                      onChange={(e) => setFilterProjectId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-800"
                    >
                      <option value="">Tous</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="mt-2 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    État
                    <select
                      value={filterState}
                      onChange={(e) =>
                        setFilterState(e.target.value as "all" | "conflicts" | "unassigned")
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-800"
                    >
                      <option value="all">Tous</option>
                      <option value="conflicts">Conflits</option>
                      <option value="unassigned">Sans responsable</option>
                    </select>
                  </label>
                  {view !== "day" ? (
                    <div className="mt-3 border-t border-slate-100 pt-2">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        Affichage
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {([5, 6, 7] as const).map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => applyWorkDays(n)}
                            className={cn(
                              "rounded-md px-2 py-1 text-[11px] font-bold",
                              workDays === n
                                ? "bg-[#1e3a5f] text-white"
                                : "bg-slate-50 text-slate-600",
                            )}
                          >
                            {n}j
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center gap-1">
                        <button
                          type="button"
                          disabled={!prevPlanningZoom(zoom)}
                          onClick={() => {
                            const p = prevPlanningZoom(zoom);
                            if (p) applyZoom(p);
                          }}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600 disabled:opacity-40"
                        >
                          −
                        </button>
                        <span className="text-[11px] font-bold text-slate-600">{zoom} %</span>
                        <button
                          type="button"
                          disabled={!nextPlanningZoom(zoom)}
                          onClick={() => {
                            const n = nextPlanningZoom(zoom);
                            if (n) applyZoom(n);
                          }}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600 disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ) : null}
                  {activeFilterCount > 0 ? (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-3 text-[11px] font-bold text-[#1e3a5f] hover:underline"
                    >
                      Réinitialiser
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() =>
                setCreateDraft({
                  day: startOfDay(cursor),
                  resourceId: resources[0]?.id ?? "__unassigned",
                })
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50"
            >
              + Planifier
            </button>

            <Link
              href="/dashboard/agenda"
              className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#16304f]"
            >
              Voir Agenda
            </Link>
          </div>
        </div>

        {searchQuery ? (
          <p className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
            <span>
              {visibleResources.length} résultat{visibleResources.length > 1 ? "s" : ""} pour «{" "}
              {searchQuery} »
            </span>
            <button
              type="button"
              onClick={() => setQ("")}
              className="rounded-md border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
            >
              × Effacer
            </button>
          </p>
        ) : null}
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
        <section className="rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <h2 className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
              À organiser
            </h2>
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
              {unassigned.length}
            </span>
          </div>
          <ul className="space-y-1.5">
            {unassigned.slice(0, 6).map((e) => {
              const label = planningBlockLabel(e);
              const day = new Date(e.startAt);
              return (
                <li
                  key={e.id}
                  draggable={!isDragBlocked(e).blocked}
                  onDragStart={() => setDragEventId(e.id)}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-2.5 py-2"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(e.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="truncate text-xs font-extrabold uppercase text-slate-900">
                      {label.site}
                    </p>
                    <p className="text-[11px] font-medium text-slate-600">
                      {label.type}
                      {" · "}
                      {day.toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                      {!e.allDay ? ` · ${formatTime(day)}` : ""}
                      {" · Sans responsable"}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignEvent(e)}
                    className="shrink-0 rounded-md bg-[#1e3a5f] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#16304f]"
                  >
                    Affecter →
                  </button>
                </li>
              );
            })}
          </ul>
          {unassigned.length > 6 ? (
            <p className="mt-1.5 text-[10px] font-medium text-slate-500">
              +{unassigned.length - 6} autre{unassigned.length - 6 > 1 ? "s" : ""}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* Mobile — liste collaborateurs + à organiser */}
      <div className="lg:hidden">
        <DayPeopleList
          day={startOfDay(cursor)}
          resources={visibleResources}
          events={filteredEvents}
          allEvents={events}
          currentUserId={currentUserId}
          onSelect={setSelectedId}
          onConflict={setConflictFocusId}
          onCreate={(resourceId, day) => setCreateDraft({ resourceId, day })}
          onOpenPerson={setPersonPanelId}
        />
      </div>

      {emptyPeriod && !loading ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-center text-xs font-medium text-slate-600">
          Aucune affectation planifiée{" "}
          {view === "day" ? "ce jour" : "cette période"}.
        </p>
      ) : null}

      {/* Desktop — board = collaborateurs × période, enrichi par AgendaEvent */}
      <div className="hidden max-h-[min(70vh,52rem)] min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm lg:block">
        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">Chargement du planning…</p>
        ) : view === "day" ? (
          <div className="p-3">
            <DayPeopleList
              day={startOfDay(cursor)}
              resources={visibleResources}
              events={filteredEvents}
              allEvents={events}
              currentUserId={currentUserId}
              onSelect={setSelectedId}
              onConflict={setConflictFocusId}
              onCreate={(resourceId, day) => setCreateDraft({ resourceId, day })}
              onOpenPerson={setPersonPanelId}
            />
          </div>
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
                    <ResourceCell
                      resource={r}
                      currentUserId={currentUserId}
                      workload={computeResourceWorkload(filteredEvents, r.id, days)}
                      onOpen={() => setPersonPanelId(r.id)}
                    />
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
                            <EmptyAssignCell
                              onClick={() => setCreateDraft({ day: d, resourceId: r.id })}
                            />
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
          onAssign={
            !selected.responsibleId
              ? () => {
                  setAssignEvent(selected);
                  setSelectedId(null);
                }
              : undefined
          }
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

      {assignEvent ? (
        <AssignExistingModal
          event={assignEvent}
          candidates={teamUsers}
          allEvents={events}
          projectHint={
            assignEvent.projectId
              ? projectHintById.get(assignEvent.projectId) ?? null
              : null
          }
          onClose={() => setAssignEvent(null)}
          onPick={(userId) => void assignToUser(assignEvent, userId)}
        />
      ) : null}

      {conflictConfirm ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
            <p className="text-sm font-extrabold text-slate-900">⚠ Conflit</p>
            <p className="mt-2 text-sm text-slate-600">{conflictConfirm.warning}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700"
                onClick={() => setConflictConfirm(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
                onClick={() =>
                  void assignToUser(conflictConfirm.event, conflictConfirm.userId, true)
                }
              >
                Affecter quand même
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {personPanel ? (
        <CollaboratorPanel
          resource={personPanel}
          currentUserId={currentUserId}
          workload={computeResourceWorkload(filteredEvents, personPanel.id, days)}
          next={nextAssignmentForResource(filteredEvents, personPanel.id, from)}
          onClose={() => setPersonPanelId(null)}
          onFilterOnly={() => {
            setQ(personPanel.name.split(" ")[0] || personPanel.name);
            setShowFilters(true);
            setPersonPanelId(null);
          }}
        />
      ) : null}
    </div>
  );
}

function EmptyAssignCell({
  onClick,
  className,
  dense,
  mobile,
}: {
  onClick: () => void;
  className?: string;
  dense?: boolean;
  mobile?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Aucune affectation planifiée — cliquer pour affecter"
      className={cn(
        "group flex w-full flex-col items-start justify-center rounded-md bg-slate-50/50 px-2 text-left transition",
        "hover:bg-slate-100/90",
        dense ? "min-h-[2.5rem] py-1.5" : "min-h-[2.75rem] py-1.5",
        mobile && "border border-transparent py-2",
        className,
      )}
    >
      <span className="text-[9px] font-medium uppercase tracking-wide text-slate-400">
        Sans affectation
      </span>
      <span
        className={cn(
          "text-[10px] font-semibold text-[#1e3a5f]",
          mobile
            ? "opacity-100"
            : "opacity-55 group-hover:opacity-100 group-focus-visible:opacity-100",
        )}
      >
        + Affecter
      </span>
    </button>
  );
}

function ResourceCell({
  resource,
  currentUserId,
  workload,
  onOpen,
}: {
  resource: PlanningResource;
  currentUserId: string;
  workload?: { assignments: number; minutes: number | null };
  onOpen?: () => void;
}) {
  const initials = initialsFromName(resource.name);
  const role = planningRoleLabel({
    ...resource,
    currentUserId,
  });
  const duration = formatPlanningDuration(workload?.minutes ?? null);
  const loadLine =
    workload == null
      ? null
      : workload.assignments === 0
        ? "Sans affectation"
        : duration
          ? `${workload.assignments} affectation${workload.assignments > 1 ? "s" : ""} · ${duration}`
          : `${workload.assignments} affectation${workload.assignments > 1 ? "s" : ""}`;

  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-[11px] font-extrabold text-white">
        {initials}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-extrabold text-slate-900">{resource.name}</p>
        <p className="truncate text-[11px] font-medium text-slate-500">{role}</p>
        {loadLine ? (
          <p className="truncate text-[10px] font-semibold text-slate-400">{loadLine}</p>
        ) : null}
      </div>
    </>
  );

  if (onOpen) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-2.5 rounded-lg text-left hover:bg-slate-50/80"
      >
        {inner}
      </button>
    );
  }

  return <div className="flex items-center gap-2.5">{inner}</div>;
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

function DayPeopleList({
  day,
  resources,
  events,
  allEvents,
  currentUserId,
  onSelect,
  onConflict,
  onCreate,
  onOpenPerson,
}: {
  day: Date;
  resources: PlanningResource[];
  events: AgendaEventDTO[];
  allEvents: AgendaEventDTO[];
  currentUserId: string;
  onSelect: (id: string) => void;
  onConflict: (id: string) => void;
  onCreate: (resourceId: string, day: Date) => void;
  onOpenPerson?: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="px-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {day.toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </p>
      <ul className="space-y-2">
        {resources.map((r) => {
          const cell = eventsForResourceOnDay(events, r.id, day);
          const wl = computeResourceWorkload(events, r.id, [day]);
          return (
            <li key={r.id} className="rounded-xl border border-slate-200/80 bg-white px-3 py-2.5">
              <ResourceCell
                resource={r}
                currentUserId={currentUserId}
                workload={wl}
                onOpen={onOpenPerson ? () => onOpenPerson(r.id) : undefined}
              />
              <div className="mt-2 space-y-1.5">
                {cell.length === 0 ? (
                  <EmptyAssignCell mobile onClick={() => onCreate(r.id, day)} />
                ) : (
                  cell.map((e) => {
                    const label = planningBlockLabel(e);
                    const conflict = listEventConflicts(e, allEvents).length > 0;
                    return (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => onSelect(e.id)}
                        className="flex w-full flex-col rounded-lg bg-slate-50 px-2.5 py-2 text-left hover:bg-slate-100/80"
                      >
                        <span className="text-[11px] font-bold text-slate-500">{label.time}</span>
                        <span className="text-xs font-extrabold uppercase text-slate-900">
                          {label.site}
                        </span>
                        <span className="text-[11px] font-medium text-slate-600">{label.type}</span>
                        {conflict ? (
                          <span
                            role="button"
                            tabIndex={0}
                            className="mt-0.5 self-start text-[11px] font-bold text-red-700"
                            onClick={(ev) => {
                              ev.stopPropagation();
                              onConflict(e.id);
                            }}
                            onKeyDown={(ev) => {
                              if (ev.key === "Enter") {
                                ev.stopPropagation();
                                onConflict(e.id);
                              }
                            }}
                          >
                            ⚠ Conflit
                          </span>
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


function DetailPanel({
  event,
  allEvents,
  onClose,
  onConflict,
  onAssign,
}: {
  event: AgendaEventDTO;
  allEvents: AgendaEventDTO[];
  onClose: () => void;
  onConflict: () => void;
  onAssign?: () => void;
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
              ⚠ Voir le chevauchement
            </button>
          ) : null}
        </div>
        <div className="flex gap-2">
          {!event.responsibleId && onAssign ? (
            <button
              type="button"
              onClick={onAssign}
              className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white"
            >
              Affecter
            </button>
          ) : null}
          <Link
            href={eventHref(event)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
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

function AssignExistingModal({
  event,
  candidates,
  allEvents,
  projectHint,
  onClose,
  onPick,
}: {
  event: AgendaEventDTO;
  candidates: PlanningTeamUser[];
  allEvents: AgendaEventDTO[];
  projectHint: PlanningProjectHint | null;
  onClose: () => void;
  onPick: (userId: string) => void;
}) {
  const label = planningBlockLabel(event);
  const suggestions = useMemo(
    () =>
      evaluatePlanningAssigneeSuggestions({
        event,
        candidates,
        allEvents,
        projectHint,
      }),
    [event, candidates, allEvents, projectHint],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-md overflow-auto rounded-2xl bg-white p-4 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Affecter
            </p>
            <h2 className="truncate text-base font-extrabold text-slate-900">{label.site}</h2>
            <p className="text-xs font-medium text-slate-600">
              {label.type}
              {" · "}
              {new Date(event.startAt).toLocaleDateString("fr-FR", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
              {!event.allDay
                ? ` · ${formatTime(new Date(event.startAt))}–${formatTime(new Date(event.endAt))}`
                : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 text-xs font-semibold text-slate-500"
          >
            Fermer
          </button>
        </div>

        <ul className="mt-3 space-y-1.5">
          {suggestions.slice(0, 8).map((s) => (
            <li key={s.userId}>
              <button
                type="button"
                onClick={() => onPick(s.userId)}
                className={cn(
                  "flex w-full flex-col rounded-xl border px-3 py-2.5 text-left transition hover:border-[#1e3a5f]/40",
                  s.suggested
                    ? "border-[#1e3a5f]/35 bg-[#1e3a5f]/[0.04]"
                    : "border-slate-200 bg-white",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-extrabold text-slate-900">{s.name}</p>
                  {s.suggested ? (
                    <span className="rounded-full bg-[#1e3a5f] px-2 py-0.5 text-[10px] font-bold text-white">
                      Recommandé
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] font-medium text-slate-500">{s.roleLabel}</p>
                <p className="mt-1 text-[11px] font-medium text-slate-600">
                  {s.hasConflict
                    ? "⚠ Conflit horaire"
                    : s.reasonLabels
                        .filter((r) => r !== "Rôle moins adapté" && r !== "Conflit horaire")
                        .slice(0, 2)
                        .join(" · ") || (s.reasons.includes("role_moins_adapte") ? "Rôle moins adapté" : "")}
                </p>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[10px] font-medium text-slate-400">
          BeWork propose — vous validez.
        </p>
      </div>
    </div>
  );
}

function CollaboratorPanel({
  resource,
  currentUserId,
  workload,
  next,
  onClose,
  onFilterOnly,
}: {
  resource: PlanningResource;
  currentUserId: string;
  workload: { assignments: number; minutes: number | null; projectIds: string[] };
  next: AgendaEventDTO | null;
  onClose: () => void;
  onFilterOnly: () => void;
}) {
  const role = planningRoleLabel({ ...resource, currentUserId });
  const duration = formatPlanningDuration(workload.minutes);
  const nextLabel = next ? planningBlockLabel(next) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <aside className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">{resource.name}</h2>
            <p className="text-xs font-medium text-slate-500">{role}</p>
          </div>
          <button type="button" onClick={onClose} className="text-xs font-semibold text-slate-500">
            Fermer
          </button>
        </div>

        <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
            Cette période
          </p>
          <p className="mt-1 text-sm font-bold text-slate-800">
            {workload.assignments} affectation{workload.assignments > 1 ? "s" : ""}
            {duration ? ` · ${duration} planifiées` : ""}
          </p>
          <p className="text-xs font-medium text-slate-600">
            {workload.projectIds.length} chantier{workload.projectIds.length > 1 ? "s" : ""}
          </p>
        </div>

        {next && nextLabel ? (
          <div className="mt-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500">
              Prochain
            </p>
            <p className="mt-1 text-sm font-extrabold uppercase text-slate-900">{nextLabel.site}</p>
            <p className="text-xs font-medium text-slate-600">
              {new Date(next.startAt).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "short",
              })}
              {" · "}
              {nextLabel.time}
            </p>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onFilterOnly}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700"
          >
            Voir uniquement
          </button>
          <Link
            href={`/dashboard/agenda?q=${encodeURIComponent(resource.name)}`}
            className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white"
          >
            Agenda
          </Link>
        </div>
      </aside>
    </div>
  );
}
