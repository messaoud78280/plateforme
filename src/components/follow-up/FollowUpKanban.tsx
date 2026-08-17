"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FollowUpUrgency } from "@prisma/client";
import { POSTIT_COLORS, URGENCY_LABELS, URGENCY_STYLES } from "@/lib/follow-up/types";
import {
  formatKanbanDueLabel,
  initialsFromName,
  urgencyRank,
} from "@/lib/follow-up/urgency";
import type { FollowUpCardData } from "@/components/follow-up/FollowUpPostItCard";
import type { SerializedAttention } from "@/lib/follow-up/attention";
import { FOLLOW_UP_PHASES, isPhaseStart, phaseForStatus } from "@/lib/follow-up/phases";
import { isFollowUpUrgentLevel } from "@/lib/follow-up/kpi";
import { cn } from "@/lib/cn";

export type KanbanColumn = {
  statusKey: string;
  label: string;
  colorKey: string;
  sortOrder: number;
};

export type KanbanSheet = FollowUpCardData & {
  status: string;
  colorKey: string;
  clientName?: string | null;
  nextActionAt?: string | null;
  nextActionAtLabel?: string | null;
  /** ISO — dernière transition statut (timeline), sinon null */
  statusEnteredAt?: string | null;
  assigneeId?: string | null;
  /** W3-A — diagnostic d’attention (calculé serveur). */
  attention?: SerializedAttention | null;
};

type Props = {
  columns: KanbanColumn[];
  sheets: KanbanSheet[];
  canEdit?: boolean;
  currentUserId?: string | null;
  /** Mode allégé (moins de badges / colonnes plus étroites). */
  compact?: boolean;
};

const URGENCY_SORT: FollowUpUrgency[] = [
  "CRITIQUE",
  "URGENT",
  "IMPORTANT",
  "A_SURVEILLER",
  "NORMAL",
];

function StepAccent({ colorKey }: { colorKey: string }) {
  const map: Record<string, string> = {
    bleu: "bg-sky-400",
    jaune: "bg-amber-400",
    orange: "bg-orange-400",
    violet: "bg-violet-400",
    vert: "bg-emerald-400",
    rouge: "bg-red-400",
  };
  return <span className={cn("absolute inset-x-0 top-0 h-1 rounded-t-xl", map[colorKey] ?? "bg-slate-300")} />;
}

async function patchStatus(
  sheetId: string,
  status: string,
  source: "kanban" | "menu",
): Promise<{ ok: true; sheet: KanbanSheet } | { ok: false; error: string }> {
  try {
    const res = await fetch(`/api/follow-up/${sheetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, source }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error:
          typeof data.error === "string"
            ? data.error
            : "Impossible de modifier l’étape.",
      };
    }
    return { ok: true, sheet: data as KanbanSheet };
  } catch {
    return { ok: false, error: "Impossible de modifier l’étape." };
  }
}

function sortSheets(a: KanbanSheet, b: KanbanSheet): number {
  const ua = urgencyRank(
    ((a.attention?.effectiveUrgency ?? a.urgency) as FollowUpUrgency) || "NORMAL",
  );
  const ub = urgencyRank(
    ((b.attention?.effectiveUrgency ?? b.urgency) as FollowUpUrgency) || "NORMAL",
  );
  if (ub !== ua) return ub - ua;
  const da = a.nextActionAt ? new Date(a.nextActionAt).getTime() : Number.POSITIVE_INFINITY;
  const db = b.nextActionAt ? new Date(b.nextActionAt).getTime() : Number.POSITIVE_INFINITY;
  if (da !== db) return da - db;
  const ea = a.statusEnteredAt ? new Date(a.statusEnteredAt).getTime() : 0;
  const eb = b.statusEnteredAt ? new Date(b.statusEnteredAt).getTime() : 0;
  return ea - eb; // plus ancien dans l’étape d’abord
}

function KanbanCard({
  sheet,
  canEdit,
  columns,
  onMove,
  dragging,
  compact,
}: {
  sheet: KanbanSheet;
  canEdit: boolean;
  columns: KanbanColumn[];
  onMove: (sheetId: string, toStatus: string, source: "kanban" | "menu") => void;
  dragging: boolean;
  compact?: boolean;
}) {
  const urgencyKey = (sheet.attention?.effectiveUrgency ?? sheet.urgency) as FollowUpUrgency;
  const urgency = URGENCY_STYLES[urgencyKey] ?? URGENCY_STYLES.NORMAL;
  const ref = sheet.osNumber
    ? `OS-${sheet.osNumber}`
    : sheet.orderNumber
      ? sheet.orderNumber
      : null;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const dueLabel = formatKanbanDueLabel(
    sheet.nextActionAt ? new Date(sheet.nextActionAt) : null,
  );
  const initials = initialsFromName(sheet.assignee?.name);
  const shortName = sheet.assignee?.name?.trim().split(/\s+/)[0] ?? null;
  const showUrgencyBadge =
    urgencyKey === "CRITIQUE" ||
    (urgencyKey === "URGENT" && !dueLabel?.startsWith("En retard")) ||
    (urgencyKey === "IMPORTANT" && !dueLabel?.startsWith("En retard"));

  useEffect(() => {
    if (!menuOpen) return;
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div
      draggable={canEdit}
      onDragStart={(e) => {
        if (!canEdit) return;
        e.dataTransfer.setData("text/plain", sheet.id);
        e.dataTransfer.setData("application/x-bework-status", sheet.status);
        e.dataTransfer.effectAllowed = "move";
      }}
      className={cn(
        "relative rounded-xl border border-slate-200/90 bg-white px-2.5 py-2 shadow-sm transition",
        canEdit ? "cursor-grab active:cursor-grabbing" : "",
        dragging ? "opacity-40 ring-2 ring-[#1e3a5f]/40" : "hover:border-slate-300 hover:shadow",
      )}
    >
      <StepAccent colorKey={sheet.colorKey} />
      <div className="mt-0.5 flex items-start justify-between gap-1">
        <Link
          href={`/dashboard/fiches-suivi/${sheet.id}`}
          className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-slate-900 line-clamp-2 hover:underline"
          onClick={(e) => {
            if (dragging) e.preventDefault();
          }}
        >
          {sheet.title}
          {ref ? <span className="font-medium text-slate-500"> — {ref}</span> : null}
        </Link>
        {canEdit ? (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              aria-label="Actions fiche"
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="rounded px-1 py-0.5 text-xs font-bold text-slate-500 hover:bg-slate-100"
            >
              …
            </button>
            {menuOpen ? (
              <div
                className="absolute right-0 z-20 mt-1 w-52 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <Link
                  href={`/dashboard/fiches-suivi/${sheet.id}`}
                  className="block px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Ouvrir
                </Link>
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Changer d’étape
                </p>
                <ul className="max-h-48 overflow-y-auto">
                  {columns
                    .filter((c) => c.statusKey !== sheet.status && c.statusKey !== "__AUTRES__")
                    .map((c) => (
                      <li key={c.statusKey}>
                        <button
                          type="button"
                          className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-slate-50"
                          onClick={() => {
                            setMenuOpen(false);
                            onMove(sheet.id, c.statusKey, "menu");
                          }}
                        >
                          {c.label}
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {sheet.nextAction ? (
        <p className="mt-1.5 text-[12px] font-semibold leading-snug text-slate-800 line-clamp-2">
          {sheet.nextAction}
        </p>
      ) : null}

      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
        {shortName ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 font-medium text-slate-700">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#1e3a5f] text-[9px] font-bold text-white">
              {initials}
            </span>
            {shortName}
          </span>
        ) : null}
        {dueLabel ? (
          <span
            className={cn(
              "font-semibold",
              dueLabel.startsWith("En retard") ? "text-orange-800" : "text-slate-700",
            )}
          >
            {dueLabel.startsWith("En retard")
              ? dueLabel.replace(/^En retard de\s+/i, "").replace(/jours?/i, "j") + " retard"
              : dueLabel}
          </span>
        ) : null}
        {showUrgencyBadge && !compact ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              urgency.badge,
            )}
          >
            {URGENCY_LABELS[urgencyKey]}
          </span>
        ) : null}
        {showUrgencyBadge && compact && urgencyKey === "CRITIQUE" ? (
          <span className="h-2 w-2 rounded-full bg-red-500" title="Critique" aria-label="Critique" />
        ) : null}
      </div>
    </div>
  );
}

export function FollowUpKanban({
  columns,
  sheets,
  canEdit = false,
  currentUserId = null,
  compact = false,
}: Props) {
  const router = useRouter();
  const [localSheets, setLocalSheets] = useState<KanbanSheet[]>(sheets);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [hideEmpty, setHideEmpty] = useState(true);
  const [forceShowEmpty, setForceShowEmpty] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const colWidth = compact ? "w-[200px] sm:w-[210px]" : "w-[260px]";

  const sheetsKey = sheets.map((s) => `${s.id}:${s.status}:${s.nextAction ?? ""}`).join("|");

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      if (!el) return;
      if (e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const syncFromProps = useCallback(() => {
    setLocalSheets(sheets);
  }, [sheets]);

  useEffect(() => {
    if (busyId === null && dragId === null) {
      setLocalSheets(sheets);
    }
  }, [sheets, sheetsKey, busyId, dragId]);

  const assignees = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of localSheets) {
      if (s.assigneeId && s.assignee?.name) map.set(s.assigneeId, s.assignee.name);
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "fr"));
  }, [localSheets]);

  const clients = useMemo(() => {
    const set = new Set<string>();
    for (const s of localSheets) {
      if (s.clientName?.trim()) set.add(s.clientName.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b, "fr"));
  }, [localSheets]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return localSheets.filter((s) => {
      if (mineOnly && currentUserId && s.assigneeId !== currentUserId) return false;
      if (filterAssignee !== "all" && s.assigneeId !== filterAssignee) return false;
      if (
        filterUrgency !== "all" &&
        (s.attention?.effectiveUrgency ?? s.urgency) !== filterUrgency
      ) {
        return false;
      }
      if (filterClient !== "all" && (s.clientName ?? "") !== filterClient) return false;
      if (!query) return true;
      const hay = [
        s.title,
        s.clientName,
        s.osNumber,
        s.orderNumber,
        s.workObject,
        s.nextAction,
        s.assignee?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [
    localSheets,
    q,
    mineOnly,
    currentUserId,
    filterAssignee,
    filterUrgency,
    filterClient,
  ]);

  const summary = useMemo(() => {
    const urgent = filtered.filter((s) =>
      isFollowUpUrgentLevel(s.attention?.effectiveUrgency ?? s.urgency),
    ).length;
    const aFacturer = filtered.filter(
      (s) => s.status === "A_FACTURER" || s.status === "TRAVAUX_TERMINES",
    ).length;
    return { total: filtered.length, urgent, aFacturer };
  }, [filtered]);

  const cols = useMemo(() => {
    const occupied = new Set(filtered.map((s) => s.status));
    let base = columns;
    const masking = hideEmpty && !forceShowEmpty && dragId === null;
    if (masking) {
      base = columns.filter(
        (c) => occupied.has(c.statusKey) || c.statusKey === "__AUTRES__",
      );
    }
    const hasOrphan = filtered.some((s) => !base.some((c) => c.statusKey === s.status));
    if (!hasOrphan) return base;
    return [
      ...base,
      { statusKey: "__AUTRES__", label: "Autres", colorKey: "jaune", sortOrder: 9999 },
    ];
  }, [columns, filtered, hideEmpty, forceShowEmpty, dragId]);

  const hiddenEmptyCount = useMemo(() => {
    if (!hideEmpty || forceShowEmpty || dragId !== null) return 0;
    const occupied = new Set(filtered.map((s) => s.status));
    return columns.filter(
      (c) => !occupied.has(c.statusKey) && c.statusKey !== "__AUTRES__",
    ).length;
  }, [columns, filtered, hideEmpty, forceShowEmpty, dragId]);

  function scrollByCols(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (compact ? 220 : 280), behavior: "smooth" });
  }

  function scrollToStatus(statusKey: string) {
    const el = scrollRef.current;
    if (!el) return;
    const target = el.querySelector(`[data-status-col="${statusKey}"]`);
    if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }

  const colKeys = useMemo(() => cols.map((c) => c.statusKey), [cols]);

  const byStatus = useMemo(() => {
    const map = new Map<string, KanbanSheet[]>();
    for (const col of cols) map.set(col.statusKey, []);
    for (const sheet of filtered) {
      const key = map.has(sheet.status) ? sheet.status : "__AUTRES__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(sheet);
    }
    for (const [k, list] of map) {
      map.set(k, list.slice().sort(sortSheets));
    }
    return map;
  }, [cols, filtered]);

  const moveSheet = useCallback(
    async (sheetId: string, toStatus: string, source: "kanban" | "menu") => {
      if (!canEdit || toStatus === "__AUTRES__") return;
      const current = localSheets.find((s) => s.id === sheetId);
      if (!current || current.status === toStatus) return;

      const previous = localSheets;
      setError(null);
      setBusyId(sheetId);

      setLocalSheets((list) =>
        list.map((s) =>
          s.id === sheetId
            ? { ...s, status: toStatus, statusEnteredAt: new Date().toISOString() }
            : s,
        ),
      );

      const result = await patchStatus(sheetId, toStatus, source);
      if (!result.ok) {
        setLocalSheets(previous);
        setError(result.error);
        setBusyId(null);
        return;
      }

      setLocalSheets((list) =>
        list.map((s) =>
          s.id === sheetId
            ? {
                ...s,
                ...result.sheet,
                status: result.sheet.status ?? toStatus,
                statusLabel: result.sheet.statusLabel ?? s.statusLabel,
                colorKey: result.sheet.colorKey ?? s.colorKey,
                nextAction: result.sheet.nextAction ?? s.nextAction,
                nextActionAt: result.sheet.nextActionAt ?? s.nextActionAt,
                nextActionAtLabel: result.sheet.nextActionAtLabel ?? s.nextActionAtLabel,
                urgency: result.sheet.urgency ?? s.urgency,
                urgencyLabel: result.sheet.urgencyLabel ?? s.urgencyLabel,
                statusEnteredAt: new Date().toISOString(),
              }
            : s,
        ),
      );
      setBusyId(null);
      router.refresh();
    },
    [canEdit, localSheets, router],
  );

  return (
    <div className="space-y-3">
      {error ? (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800"
          role="alert"
        >
          {error}
          <button
            type="button"
            className="ml-3 text-xs underline"
            onClick={() => {
              setError(null);
              syncFromProps();
            }}
          >
            Fermer
          </button>
        </div>
      ) : null}

      {!compact ? (
        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-3">
          <label className="min-w-[160px] flex-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Recherche
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Chantier, OS, client…"
              className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm font-normal text-slate-800"
            />
          </label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Responsable
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-normal text-slate-800"
            >
              <option value="all">Tous</option>
              {assignees.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Urgence
            <select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="mt-1 block rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-normal text-slate-800"
            >
              <option value="all">Toutes</option>
              {URGENCY_SORT.map((u) => (
                <option key={u} value={u}>
                  {URGENCY_LABELS[u]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Client
            <select
              value={filterClient}
              onChange={(e) => setFilterClient(e.target.value)}
              className="mt-1 block max-w-[160px] rounded-lg border border-slate-200 px-2 py-1.5 text-sm font-normal text-slate-800"
            >
              <option value="all">Tous</option>
              {clients.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 pb-1.5 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(e) => setMineOnly(e.target.checked)}
              className="rounded border-slate-300"
            />
            Mes fiches
          </label>
          <label className="flex items-center gap-1.5 pb-1.5 text-xs font-medium text-slate-700">
            <input
              type="checkbox"
              checked={hideEmpty}
              onChange={(e) => {
                setHideEmpty(e.target.checked);
                setForceShowEmpty(false);
              }}
              className="rounded border-slate-300"
            />
            Masquer les étapes vides
          </label>
          <p className="ml-auto pb-1.5 text-xs text-slate-600">
            <span className="font-bold text-slate-900">{summary.total}</span> dossiers
            {summary.urgent > 0 ? (
              <>
                {" · "}
                <span className="font-semibold text-orange-800">{summary.urgent} urgents</span>
              </>
            ) : null}
            {summary.aFacturer > 0 ? (
              <>
                {" · "}
                <span className="font-semibold text-slate-800">{summary.aFacturer} à facturer</span>
              </>
            ) : null}
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-[12px]">
          <label className="flex items-center gap-1.5 font-medium text-slate-700">
            <input
              type="checkbox"
              checked={hideEmpty}
              onChange={(e) => {
                setHideEmpty(e.target.checked);
                setForceShowEmpty(false);
              }}
              className="rounded border-slate-300"
            />
            Masquer étapes vides
          </label>
          {hiddenEmptyCount > 0 ? (
            <button
              type="button"
              onClick={() => setForceShowEmpty(true)}
              className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 hover:bg-slate-200"
            >
              + {hiddenEmptyCount} étape{hiddenEmptyCount > 1 ? "s" : ""} masquée
              {hiddenEmptyCount > 1 ? "s" : ""}
            </button>
          ) : null}
          <p className="ml-auto text-slate-600">
            <span className="font-semibold text-slate-900">{summary.total}</span> dossiers
          </p>
        </div>
      )}

      {compact ? (
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px]">
          {columns.map((c, i) => {
            const n = filtered.filter((s) => s.status === c.statusKey).length;
            return (
              <button
                key={c.statusKey}
                type="button"
                onClick={() => scrollToStatus(c.statusKey)}
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 font-medium",
                  n > 0 ? "bg-slate-100 text-slate-800" : "text-slate-400",
                )}
                title={c.label}
              >
                {i > 0 ? <span className="mr-1 text-slate-300">→</span> : null}
                {c.label}
                {n > 0 ? <span className="ml-1 tabular-nums text-slate-500">{n}</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {!canEdit ? (
          <p className="text-xs text-slate-500">
            Lecture seule — vous n’avez pas le droit de déplacer les fiches.
          </p>
        ) : (
          <p className="text-xs text-slate-500">
            Glissez une fiche, ou utilisez ··· / Changer d’étape.
          </p>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => scrollByCols(-1)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            aria-label="Étapes précédentes"
          >
            ←
          </button>
          <span className="hidden text-[11px] text-slate-500 sm:inline">
            {FOLLOW_UP_PHASES.map((p) => p.label).join(" · ")}
          </span>
          <button
            type="button"
            onClick={() => scrollByCols(1)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            aria-label="Étapes suivantes"
          >
            →
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="follow-up-kanban-scroll -mx-4 overflow-x-auto overscroll-x-contain px-4 pb-3 sm:-mx-6 sm:px-6"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#94a3b8 #e2e8f0",
          }}
        >
          <div className="flex min-w-max gap-2.5 pt-5">
            {cols.map((col) => {
              const items = byStatus.get(col.statusKey) ?? [];
              const accent = POSTIT_COLORS[col.colorKey] ?? POSTIT_COLORS.jaune;
              const isOver = overStatus === col.statusKey && canEdit;
              const phase = phaseForStatus(col.statusKey);
              const showPhase = isPhaseStart(col.statusKey, colKeys) && phase;
              return (
                <section
                  key={col.statusKey}
                  data-status-col={col.statusKey}
                  className={cn(
                    "relative flex shrink-0 flex-col rounded-2xl border border-bework-navy/12 bg-bework-soft-navy/35 transition",
                    colWidth,
                    isOver
                      ? "border-[#1e3a5f] bg-[#1e3a5f]/5 ring-2 ring-[#1e3a5f]/20"
                      : "border-slate-200",
                  )}
                  aria-label={`${col.label}, ${items.length} fiche(s)`}
                  onDragOver={(e) => {
                    if (!canEdit || col.statusKey === "__AUTRES__") return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setOverStatus(col.statusKey);
                  }}
                  onDragLeave={() => {
                    setOverStatus((s) => (s === col.statusKey ? null : s));
                  }}
                  onDrop={(e) => {
                    if (!canEdit || col.statusKey === "__AUTRES__") return;
                    e.preventDefault();
                    const id = e.dataTransfer.getData("text/plain");
                    setOverStatus(null);
                    setDragId(null);
                    if (id) void moveSheet(id, col.statusKey, "kanban");
                  }}
                >
                  {showPhase ? (
                    <span className="absolute -top-5 left-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {phase.label}
                    </span>
                  ) : null}
                  <header className={cn("rounded-t-2xl border-b px-2.5 py-1.5", accent.bg, accent.border)}>
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={cn(
                          "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide",
                          accent.text,
                        )}
                      >
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            col.colorKey === "bleu"
                              ? "bg-sky-500"
                              : col.colorKey === "jaune"
                                ? "bg-amber-500"
                                : col.colorKey === "orange"
                                  ? "bg-orange-500"
                                  : col.colorKey === "violet"
                                    ? "bg-violet-500"
                                    : col.colorKey === "vert"
                                      ? "bg-emerald-500"
                                      : "bg-slate-400",
                          )}
                          aria-hidden
                        />
                        {col.label}
                      </h3>
                      <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-slate-700">
                        {items.length}
                      </span>
                    </div>
                  </header>
                  <ul
                    className={cn(
                      "flex flex-col gap-1.5 overflow-y-auto p-1.5",
                      items.length === 0 ? "min-h-[2.5rem]" : "max-h-[70vh]",
                    )}
                  >
                    {items.length === 0 ? (
                      <li className="px-2 py-1.5 text-center text-[10px] text-slate-300">
                        {isOver ? "Déposer ici" : "—"}
                      </li>
                    ) : (
                      items.map((s) => (
                        <li
                          key={s.id}
                          onDragStart={() => setDragId(s.id)}
                          onDragEnd={() => {
                            setDragId(null);
                            setOverStatus(null);
                          }}
                        >
                          <KanbanCard
                            sheet={s}
                            canEdit={canEdit && busyId !== s.id}
                            columns={columns}
                            onMove={moveSheet}
                            dragging={dragId === s.id}
                            compact={compact}
                          />
                        </li>
                      ))
                    )}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
