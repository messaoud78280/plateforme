"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Filter,
  MoreHorizontal,
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
  formatTime,
  isSameDay,
  isoWeekLabel,
  rangeForView,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "@/lib/agenda/dates";
import {
  findAgendaConflicts,
  formatAgendaConflictWarning,
} from "@/lib/agenda/conflicts";
import { AGENDA_LAYER_FILTERS, type AgendaLayerId } from "@/lib/agenda/serialize-event";
import {
  DEFAULT_AGENDA_ZOOM,
  agendaHourPx,
  nextAgendaZoom,
  prevAgendaZoom,
  readAgendaZoom,
  writeAgendaZoom,
  type AgendaZoomLevel,
} from "@/lib/agenda/zoom";
import type { AgendaScope } from "@/lib/agenda/types";
import { summarizePeriod } from "@/lib/agenda/period-summary";
import { canTrustPeriodSummary } from "@/lib/agenda/fetch-lite";
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

const QUICK_TYPES = [
  { type: "REUNION_CHANTIER", label: "Réunion chantier" },
  { type: "INTERVENTION", label: "Intervention" },
  { type: "RDV_CLIENT", label: "Rendez-vous" },
  { type: "ECHEANCE", label: "Échéance" },
] as const;

export function AgendaApp({ projects, teamUsers, currentUserId }: Props) {
  const [view, setView] = useState<AgendaView>("week");
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<AgendaEventDTO[]>([]);
  const [eventsComplete, setEventsComplete] = useState(true);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [scope, setScope] = useState<AgendaScope>("all");
  const [projectFilter, setProjectFilter] = useState("");
  const [layers, setLayers] = useState<Set<AgendaLayerId> | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<AgendaQuickCreateDraft | null>(null);
  const [quickType, setQuickType] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [zoom, setZoom] = useState<AgendaZoomLevel>(DEFAULT_AGENDA_ZOOM);
  const [zoomReady, setZoomReady] = useState(false);
  const [navOrigin, setNavOrigin] = useState<{ view: AgendaView; cursor: string } | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [duplicateFrom, setDuplicateFrom] = useState<AgendaEventDTO | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 640px)").matches) {
      setView("day");
    }
    setZoom(readAgendaZoom());
    setZoomReady(true);
  }, []);

  useEffect(() => {
    if (!zoomReady) return;
    writeAgendaZoom(zoom);
  }, [zoom, zoomReady]);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = e.state as { agendaView?: AgendaView; agendaDate?: string } | null;
      if (!st?.agendaView && !st?.agendaDate) return;
      if (st.agendaView) setView(st.agendaView);
      if (st.agendaDate) setCursor(startOfDay(new Date(st.agendaDate)));
      setNavOrigin(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

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
      if (projectFilter) params.set("projectId", projectFilter);
      if (view === "year") params.set("lite", "1");
      const res = await fetch(`/api/agenda/events?${params}`, {
        credentials: "same-origin",
      });
      if (!res.ok) {
        setEvents([]);
        setEventsComplete(true);
        return;
      }
      const data = await res.json();
      setEvents(Array.isArray(data.events) ? data.events : []);
      // Ne jamais présenter un résumé / radar comme complet si l’API a tronqué
      setEventsComplete(canTrustPeriodSummary(data.meta));
    } catch {
      setEvents([]);
      setEventsComplete(true);
    } finally {
      setLoading(false);
    }
  }, [view, cursor, scope, searchDebounced, projectFilter]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get("event");
    const projectId = params.get("projectId");
    const wantNew = params.get("new") === "1";
    if (eventId) {
      setSelectedEventId(eventId);
      setPanelOpen(true);
      setView("day");
    }
    if (projectId) {
      setProjectFilter(projectId);
      setFiltersOpen(true);
    }
    if (wantNew) {
      const start = new Date();
      start.setMinutes(0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      setDraft({
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        projectId: projectId || null,
      });
      setCreateOpen(true);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setCursor(startOfDay(new Date()));
        setSelectedEventId(null);
        setPanelOpen(true);
      }
      if (e.key === "Escape") {
        setSelectedEventId(null);
        setMoreOpen(false);
        setFiltersOpen(false);
        setPanelOpen(false);
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

  const visibleEvents = useMemo(() => {
    if (!layers || layers.size === 0) return events;
    const allowed = new Set<string>();
    for (const layer of AGENDA_LAYER_FILTERS) {
      if (layers.has(layer.id)) {
        for (const t of layer.types) allowed.add(t);
      }
    }
    // Si aucune couche cochée → tout (évite liste vide accidentelle)
    if (allowed.size === 0) return events;
    return events.filter((e) => allowed.has(e.type));
  }, [events, layers]);

  const selectedEvent = useMemo(
    () => visibleEvents.find((e) => e.id === selectedEventId) ?? events.find((e) => e.id === selectedEventId) ?? null,
    [visibleEvents, events, selectedEventId],
  );

  const conflictWarning = useMemo(() => {
    if (!selectedEvent || selectedEvent.status === "TERMINE") return null;
    const conflicts = findAgendaConflicts(
      {
        id: selectedEvent.id,
        startAt: selectedEvent.startAt,
        endAt: selectedEvent.endAt,
        responsibleId: selectedEvent.responsibleId,
        projectId: selectedEvent.projectId,
      },
      visibleEvents,
    );
    return formatAgendaConflictWarning(conflicts, selectedEvent.responsible?.name);
  }, [selectedEvent, visibleEvents]);

  const title = useMemo(() => {
    if (view === "day") {
      const t = formatDayTitle(cursor);
      return `${t.weekday} ${t.date}`;
    }
    if (view === "week") {
      const mon = startOfWeek(cursor);
      const sun = addDays(mon, 6);
      const week = isoWeekLabel(mon);
      const sameMonth = mon.getMonth() === sun.getMonth();
      if (sameMonth) {
        return `${week} · ${mon.getDate()} – ${sun.getDate()} ${formatMonthYear(mon)}`;
      }
      return `${week} · ${mon.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${sun.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`;
    }
    if (view === "year") return String(cursor.getFullYear());
    return formatMonthYear(cursor);
  }, [view, cursor]);

  function pushAgendaHistory(nextView: AgendaView, nextCursor: Date) {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("view", nextView);
    url.searchParams.set("date", nextCursor.toISOString().slice(0, 10));
    window.history.pushState(
      { agendaView: nextView, agendaDate: nextCursor.toISOString() },
      "",
      url.pathname + "?" + url.searchParams.toString(),
    );
  }

  function navigate(dir: -1 | 1) {
    if (view === "day") setCursor((c) => addDays(c, dir));
    else if (view === "week") setCursor((c) => addDays(c, dir * 7));
    else if (view === "month") setCursor((c) => addMonths(c, dir));
    else setCursor((c) => addYears(c, dir));
  }

  function goToday() {
    setCursor(startOfDay(new Date()));
    setSelectedEventId(null);
    setPanelOpen(true);
    setNavOrigin(null);
  }

  function setZoomLevel(next: AgendaZoomLevel) {
    setZoom(next);
  }

  function goBackContext() {
    if (!navOrigin) return;
    const d = startOfDay(new Date(navOrigin.cursor));
    setView(navOrigin.view);
    setCursor(d);
    setNavOrigin(null);
    setSelectedEventId(null);
  }

  const periodSummary = useMemo(() => summarizePeriod(visibleEvents), [visibleEvents]);
  const filtersActive =
    scope !== "all" || Boolean(projectFilter) || Boolean(layers) || Boolean(searchDebounced);

  function resetFilters() {
    setScope("all");
    setProjectFilter("");
    setLayers(null);
    setSearch("");
    setSearchDebounced("");
  }

  function openCreate(d?: AgendaQuickCreateDraft, typeHint?: string | null) {
    setDuplicateFrom(null);
    setDraft(d ?? null);
    setQuickType(typeHint ?? null);
    setCreateOpen(true);
  }

  async function confirmLinkedReschedule(
    ev: AgendaEventDTO,
    startAt: Date,
    _endAt: Date,
  ): Promise<boolean> {
    const po = ev.purchaseOrder;
    const poLabel = po?.number ?? "la commande";
    const supplier = po?.supplierName || "Le fournisseur";
    const confirmedAt = po?.confirmedDeliveryAt
      ? new Date(po.confirmedDeliveryAt)
      : null;
    const locked =
      po?.agendaRescheduleLocked ||
      (Boolean(confirmedAt) && Boolean(po?.sharedWithSupplier));

    // AGENDA-V2A.1 — date confirmée fournisseur : bloquer + orienter vers la commande
    if (locked && confirmedAt) {
      const when = confirmedAt.toLocaleString("fr-FR", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
      const nextWhen = startAt.toLocaleString("fr-FR", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
      const goToOrder = window.confirm(
        `MODIFIER UNE LIVRAISON CONFIRMÉE\n\n${supplier} a confirmé :\n${when}\n\nNouvel horaire demandé :\n${nextWhen}\n\nCette livraison a déjà été confirmée par ${supplier}.\nPour éviter une divergence avec le fournisseur, son horaire ne peut pas être modifié directement depuis l’Agenda.\n\nOK = Continuer depuis la commande\nAnnuler = rester sur l’Agenda`,
      );
      if (goToOrder && po?.id) {
        window.location.href = `/dashboard/commandes/${po.id}`;
      }
      return false;
    }

    const old = formatTime(new Date(ev.startAt));
    const next = formatTime(startAt);
    return window.confirm(
      `Modifier la livraison ?\n\n${poLabel}\nCréneau actuel : ${old}\nNouveau créneau : ${next}\n\nLa date demandée sur la commande sera mise à jour (pas seulement l’agenda).`,
    );
  }

  function toggleLayer(id: AgendaLayerId) {
    setLayers((prev) => {
      const next = new Set(prev ?? AGENDA_LAYER_FILTERS.map((l) => l.id));
      if (next.has(id)) next.delete(id);
      else next.add(id);
      // Toutes cochées → null (pas de filtre)
      if (next.size === AGENDA_LAYER_FILTERS.length) return null;
      return next;
    });
  }

  function handleSelectEvent(id: string) {
    setSelectedEventId(id);
    setPanelOpen(true);
    setPanelCollapsed(false);
    if (view === "year") {
      const baseId = id.includes("__") ? id.split("__")[0]! : id;
      void (async () => {
        try {
          const res = await fetch(`/api/agenda/events/${baseId}`, {
            credentials: "same-origin",
          });
          if (!res.ok) return;
          const data = await res.json();
          if (data.event) {
            upsertEvent({
              ...data.event,
              startAt:
                data.event.startAt instanceof Date
                  ? data.event.startAt.toISOString()
                  : String(data.event.startAt),
              endAt:
                data.event.endAt instanceof Date
                  ? data.event.endAt.toISOString()
                  : String(data.event.endAt),
              readOnly: false,
              source: "agenda",
              linkedPurchaseOrder: Boolean(data.event.purchaseOrderId || data.event.purchaseOrder),
              deliveryVisual: data.event.purchaseOrder?.deliveryVisual ?? null,
            });
          }
        } catch {
          /* ignore */
        }
      })();
    }
  }

  function selectDayKeepView(d: Date) {
    setCursor(startOfDay(d));
    setSelectedEventId(null);
    setPanelOpen(true);
    setPanelCollapsed(false);
  }

  function openDayView(d: Date) {
    const day = startOfDay(d);
    if (view !== "day") {
      setNavOrigin({ view, cursor: cursor.toISOString() });
      pushAgendaHistory("day", day);
    }
    setCursor(day);
    setSelectedEventId(null);
    setView("day");
    setPanelOpen(true);
  }

  function openMonthFromYear(d: Date) {
    const m = startOfMonth(d);
    setNavOrigin({ view: "year", cursor: cursor.toISOString() });
    pushAgendaHistory("month", m);
    setCursor(m);
    setView("month");
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
    return visibleEvents
      .filter((e) => e.status !== "ANNULE" && isSameDay(new Date(e.startAt), today))
      .sort((a, b) => a.startAt.localeCompare(b.startAt));
  }, [visibleEvents]);

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

  const hourPx = agendaHourPx(zoom);
  const backLabel =
    navOrigin?.view === "year"
      ? String(new Date(navOrigin.cursor).getFullYear())
      : navOrigin?.view === "month"
        ? formatMonthYear(new Date(navOrigin.cursor))
        : navOrigin?.view === "week"
          ? "Semaine"
          : null;

  return (
    <div
      className="flex h-[calc(100dvh-4.5rem)] min-h-[560px] w-full bg-[#eef2f7]/80"
      data-agenda-zoom={zoom}
      style={
        {
          "--agenda-hour-h": `${hourPx}px`,
          "--agenda-event-fs": `${Math.max(11, Math.round(12 * (zoom / 100)))}px`,
          "--agenda-event-title-fs": `${Math.max(11.5, 12.5 * (zoom / 100))}px`,
          "--agenda-cell-pad": `${Math.max(0.25, 0.35 * (zoom / 100))}rem`,
          "--agenda-day-num": `${Math.max(0.75, 0.8125 * (zoom / 100))}rem`,
          "--agenda-week-label": `${Math.max(0.625, 0.6875 * (zoom / 100))}rem`,
          "--agenda-panel-w": "300px",
        } as CSSProperties
      }
    >
      <div className="m-2 flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm sm:m-3 lg:m-3 lg:mr-2">
        {/* Ligne 1 — période + vues */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-3 py-2 sm:px-4">
          <div className="flex items-center gap-1">
            {navOrigin && backLabel ? (
              <button
                type="button"
                onClick={goBackContext}
                className="mr-1 inline-flex h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-[#1e3a5f]"
                title={`Retour · ${backLabel}`}
              >
                ← {backLabel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-xl font-semibold text-slate-600 hover:bg-slate-100 hover:text-[#1e3a5f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
              aria-label="Période précédente"
              title="Période précédente"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => navigate(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-xl font-semibold text-slate-600 hover:bg-slate-100 hover:text-[#1e3a5f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1d4ed8]"
              aria-label="Période suivante"
              title="Période suivante"
            >
              ›
            </button>
            <button
              type="button"
              onClick={goToday}
              className="ml-0.5 h-9 rounded-lg border border-[#1e3a5f]/30 bg-[#1e3a5f]/[0.07] px-3 text-xs font-semibold text-[#1e3a5f] hover:bg-[#1e3a5f]/12"
            >
              Aujourd&apos;hui
            </button>
            <h1 className="ml-2 text-base font-bold capitalize tracking-tight text-[#1e3a5f] sm:text-lg">
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

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div
              className="hidden items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 md:inline-flex"
              role="group"
              aria-label="Taille d’affichage"
            >
              <button
                type="button"
                disabled={!prevAgendaZoom(zoom)}
                onClick={() => {
                  const n = prevAgendaZoom(zoom);
                  if (n) setZoomLevel(n);
                }}
                className="inline-flex h-8 w-8 items-center justify-center text-sm font-bold text-slate-600 hover:bg-white disabled:opacity-30"
                title="Réduire"
                aria-label="Réduire"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(DEFAULT_AGENDA_ZOOM)}
                className="h-8 min-w-[3.25rem] border-x border-slate-200 px-1.5 text-[11px] font-bold tabular-nums text-slate-700 hover:bg-white"
                title="Réinitialiser l’affichage"
                aria-label="Réinitialiser l’affichage"
              >
                {zoom}&nbsp;%
              </button>
              <button
                type="button"
                disabled={!nextAgendaZoom(zoom)}
                onClick={() => {
                  const n = nextAgendaZoom(zoom);
                  if (n) setZoomLevel(n);
                }}
                className="inline-flex h-8 w-8 items-center justify-center text-sm font-bold text-slate-600 hover:bg-white disabled:opacity-30"
                title="Agrandir"
                aria-label="Agrandir"
              >
                +
              </button>
            </div>
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-28 rounded-lg border border-slate-200 py-1.5 pl-8 pr-2 text-sm outline-none transition-[width] focus:w-44 focus:border-[#1d4ed8] lg:w-36 lg:focus:w-52"
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((o) => !o)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                filtersOpen || scope !== "all" || projectFilter || layers
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
            <button
              type="button"
              onClick={() => setPanelCollapsed((c) => !c)}
              className="hidden rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 lg:inline-flex"
              aria-label={panelCollapsed ? "Afficher le panneau" : "Replier le panneau"}
              title={panelCollapsed ? "Afficher le panneau" : "Replier le panneau"}
            >
              <PanelRight className="h-4 w-4" />
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setMoreOpen((o) => !o)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                aria-expanded={moreOpen}
                aria-haspopup="menu"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Plus</span>
              </button>
              {moreOpen ? (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-30 cursor-default"
                    aria-label="Fermer"
                    onClick={() => setMoreOpen(false)}
                  />
                  <div
                    role="menu"
                    className="absolute right-0 z-40 mt-1 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                  >
                    <div className="border-b border-slate-100 px-3 py-2 md:hidden">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase text-slate-400">
                        Taille d’affichage
                      </p>
                      <div className="inline-flex overflow-hidden rounded-lg border border-slate-200">
                        <button
                          type="button"
                          role="menuitem"
                          disabled={!prevAgendaZoom(zoom)}
                          onClick={() => {
                            const n = prevAgendaZoom(zoom);
                            if (n) setZoomLevel(n);
                          }}
                          className="px-3 py-1.5 text-sm font-bold disabled:opacity-30"
                        >
                          −
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => setZoomLevel(DEFAULT_AGENDA_ZOOM)}
                          className="border-x border-slate-200 px-3 py-1.5 text-xs font-bold"
                        >
                          {zoom} %
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          disabled={!nextAgendaZoom(zoom)}
                          onClick={() => {
                            const n = nextAgendaZoom(zoom);
                            if (n) setZoomLevel(n);
                          }}
                          className="px-3 py-1.5 text-sm font-bold disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <a
                      role="menuitem"
                      href="/api/agenda/export.ics"
                      onClick={() => setMoreOpen(false)}
                      className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Exporter le calendrier
                      <span className="mt-0.5 block text-[11px] font-normal text-slate-400">
                        Fichier .ics (Apple, Google, Outlook)
                      </span>
                    </a>
                    <p
                      role="menuitem"
                      className="cursor-default border-t border-slate-100 px-3 py-2 text-sm text-slate-400"
                      title="Import calendrier externe non branché (volontaire)"
                    >
                      Importer un calendrier
                      <span className="mt-0.5 block text-[11px]">Bientôt</span>
                    </p>
                  </div>
                </>
              ) : null}
            </div>
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

        {/* Portée + couches — poids léger si rien d’actif */}
        <div
          className={`flex flex-wrap items-center gap-2 border-b border-slate-200/60 px-4 py-1.5 ${
            filtersActive ? "bg-slate-50/40" : ""
          }`}
        >
          <div
            className={`flex items-center gap-1 rounded-lg p-0.5 ${
              scope !== "all" ? "bg-slate-100" : "bg-transparent"
            }`}
          >
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
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  scope === s.id
                    ? "bg-white text-[#1e3a5f] shadow-sm ring-1 ring-[#1e3a5f]/20"
                    : "text-slate-500 hover:bg-white/80 hover:text-slate-700"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="h-4 w-px bg-slate-200/80" />
          {AGENDA_LAYER_FILTERS.map((layer) => {
            const active = !layers || layers.has(layer.id);
            const filtering = Boolean(layers);
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => toggleLayer(layer.id)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                  filtering && active
                    ? "bg-[#1e3a5f] text-white shadow-sm"
                    : active
                      ? "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80 hover:text-slate-800"
                      : "text-slate-300 line-through decoration-slate-300"
                }`}
              >
                {layer.label}
                {filtering && active ? " ✓" : ""}
              </button>
            );
          })}
          <div className="ml-auto flex items-center gap-1.5">
            <span
              className={`hidden text-[11px] font-semibold uppercase sm:inline ${
                projectFilter ? "text-[#1e3a5f]" : "text-slate-400"
              }`}
            >
              Chantier
            </span>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className={`max-w-[140px] rounded-lg bg-white px-2 py-1 text-[11px] outline-none sm:max-w-[180px] ${
                projectFilter
                  ? "border border-[#1e3a5f]/35 font-semibold text-[#1e3a5f]"
                  : "border border-transparent text-slate-500 hover:border-slate-200"
              }`}
            >
              <option value="">Tous</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtersActive ? (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/60 px-4 py-1.5">
            {scope !== "all" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1e3a5f]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1e3a5f]">
                {scope === "mine" ? "Moi" : "Équipe"}
                <button type="button" onClick={() => setScope("all")} aria-label="Retirer">
                  ×
                </button>
              </span>
            ) : null}
            {projectFilter ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1e3a5f]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1e3a5f]">
                Chantier : {projects.find((p) => p.id === projectFilter)?.title ?? "…"}
                <button type="button" onClick={() => setProjectFilter("")} aria-label="Retirer">
                  ×
                </button>
              </span>
            ) : null}
            {layers
              ? AGENDA_LAYER_FILTERS.filter((l) => layers.has(l.id)).map((l) => (
                  <span
                    key={l.id}
                    className="inline-flex items-center gap-1 rounded-full bg-[#1e3a5f]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1e3a5f]"
                  >
                    {l.label} ✓
                    <button type="button" onClick={() => toggleLayer(l.id)} aria-label="Retirer">
                      ×
                    </button>
                  </span>
                ))
              : null}
            {searchDebounced ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1e3a5f]/10 px-2 py-0.5 text-[11px] font-semibold text-[#1e3a5f]">
                « {searchDebounced} »
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSearchDebounced("");
                  }}
                  aria-label="Retirer"
                >
                  ×
                </button>
              </span>
            ) : null}
            <button
              type="button"
              onClick={resetFilters}
              className="ml-1 text-[11px] font-semibold text-slate-500 underline-offset-2 hover:text-[#1e3a5f] hover:underline"
            >
              Réinitialiser
            </button>
          </div>
        ) : null}

        {/* Résumé période — uniquement si jeu de données complet */}
        {!loading && eventsComplete && periodSummary.total > 0 ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-slate-200/80 bg-slate-50/60 px-4 py-1.5 text-[12px] text-slate-600">
            <span className="font-bold uppercase tracking-wide text-[#1e3a5f]/70">
              {view === "year"
                ? cursor.getFullYear()
                : view === "month"
                  ? formatMonthYear(cursor)
                  : view === "week"
                    ? isoWeekLabel(startOfWeek(cursor))
                    : "Jour"}
            </span>
            <span className="font-semibold text-slate-700">{periodSummary.total} événements</span>
            {periodSummary.interventions > 0 ? (
              <span>{periodSummary.interventions} interventions</span>
            ) : null}
            {periodSummary.livraisons > 0 ? (
              <span>{periodSummary.livraisons} livraisons</span>
            ) : null}
            {periodSummary.echeances > 0 ? (
              <span>{periodSummary.echeances} échéances</span>
            ) : null}
            {periodSummary.reunions > 0 ? (
              <span>{periodSummary.reunions} réunions</span>
            ) : null}
            {periodSummary.aConfirmer > 0 ? (
              <span className="font-medium text-amber-700">
                {periodSummary.aConfirmer} à confirmer
              </span>
            ) : null}
          </div>
        ) : null}

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
          <div className="space-y-2 border-b border-slate-200/80 bg-slate-50/80 px-4 py-2.5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative md:hidden">
                <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Point.P, BC, chantier…"
                  className="w-44 rounded-lg border border-slate-200 py-1 pl-7 pr-2 text-xs outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase text-slate-400">Créer</span>
                {QUICK_TYPES.map((q) => (
                  <button
                    key={q.type}
                    type="button"
                    onClick={() => openCreate(undefined, q.type)}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-[#1e3a5f]/30"
                  >
                    + {q.label}
                  </button>
                ))}
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
          </div>
        ) : null}

        {/*
          Conteneur calendrier : hauteur contrainte (parent overflow-hidden).
          Jour/Semaine/Année gèrent leur propre scroll interne.
          Mois : scroll via data-agenda-month-scroll (AGENDA-V2B.3).
        */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 text-sm text-slate-400">
              Chargement…
            </div>
          ) : null}

          {/*
            Jour/Semaine : absolute inset-0 + min-h-0 dans AgendaDayWeekView
            pour TimeGrid overflow-y-auto (06→22) sans clipping parent.
          */}
          {view === "day" || view === "week" ? (
            <AgendaDayWeekView
              mode={view}
              cursor={cursor}
              events={visibleEvents}
              selectedEventId={selectedEventId}
              pxPerHour={hourPx}
              onSelectEvent={handleSelectEvent}
              onQuickCreate={(d, typeHint) => openCreate(d, typeHint)}
              onEventMoved={upsertEvent}
              onConfirmLinkedReschedule={confirmLinkedReschedule}
            />
          ) : null}

          {view === "month" ? (
            <AgendaMonthView
              cursor={cursor}
              events={visibleEvents}
              selectedEventId={selectedEventId}
              selectedDay={cursor}
              zoom={zoom}
              onSelectEvent={handleSelectEvent}
              onSelectDay={selectDayKeepView}
              onOpenDay={openDayView}
              onQuickCreate={openCreate}
            />
          ) : null}

          {view === "year" ? (
            <AgendaYearView
              cursor={cursor}
              events={visibleEvents}
              selectedDay={cursor}
              onOpenMonth={openMonthFromYear}
              onSelectDay={selectDayKeepView}
              onOpenDay={openDayView}
            />
          ) : null}
        </div>
      </div>

      {/* Desktop side panel */}
      {panelCollapsed ? (
        <div className="m-3 ml-0 hidden shrink-0 lg:flex">
          <button
            type="button"
            onClick={() => setPanelCollapsed(false)}
            className="flex h-full min-h-[120px] w-9 flex-col items-center justify-start gap-2 rounded-xl border border-slate-200/80 bg-white py-3 text-slate-500 shadow-sm hover:bg-slate-50 hover:text-[#1e3a5f]"
            aria-label="Afficher le panneau"
            title="Afficher le panneau"
          >
            <PanelRight className="h-4 w-4" />
            <span className="rotate-180 text-[10px] font-semibold tracking-wide [writing-mode:vertical-rl]">
              Contexte
            </span>
          </button>
        </div>
      ) : (
        <div className="m-3 ml-0 hidden overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm lg:block">
          <AgendaSidePanel
            cursor={cursor}
            view={view}
            selectedEvent={selectedEvent}
            currentUserId={currentUserId}
            todayEvents={todayEvents}
            periodEvents={visibleEvents}
            conflictWarning={conflictWarning}
            onCursorChange={setCursor}
            onSelectDay={selectDayKeepView}
            onSelectEvent={handleSelectEvent}
            onClearSelection={() => setSelectedEventId(null)}
            onEdit={() => {
              if (selectedEvent?.readOnly || selectedEvent?.linkedPurchaseOrder) return;
              setEditOpen(true);
            }}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onRsvp={handleRsvp}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}

      {/* Mobile side panel — bottom sheet */}
      {panelOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/30"
            aria-label="Fermer"
            onClick={() => setPanelOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-hidden rounded-t-2xl bg-white shadow-xl">
            <div className="flex justify-center py-2">
              <span className="h-1 w-10 rounded-full bg-slate-200" />
            </div>
            <div className="max-h-[80dvh] overflow-y-auto">
              <AgendaSidePanel
                cursor={cursor}
                view={view}
                selectedEvent={selectedEvent}
                currentUserId={currentUserId}
                todayEvents={todayEvents}
                periodEvents={visibleEvents}
                conflictWarning={conflictWarning}
                onCursorChange={setCursor}
                onSelectDay={(d) => {
                  selectDayKeepView(d);
                }}
                onSelectEvent={handleSelectEvent}
                onClearSelection={() => setSelectedEventId(null)}
                onEdit={() => {
                  if (selectedEvent?.readOnly || selectedEvent?.linkedPurchaseOrder) return;
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
        </div>
      ) : null}

      <AgendaEventModal
        open={createOpen}
        mode="create"
        draft={draft}
        defaultType={quickType}
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
        existingEvents={visibleEvents}
        onClose={() => {
          setCreateOpen(false);
          setDraft(null);
          setDuplicateFrom(null);
          setQuickType(null);
        }}
        onSaved={(ev) => {
          upsertEvent(ev);
          setCreateOpen(false);
          setDraft(null);
          setDuplicateFrom(null);
          setQuickType(null);
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
