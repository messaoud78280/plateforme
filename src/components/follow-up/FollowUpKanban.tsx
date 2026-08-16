"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FollowUpUrgency } from "@prisma/client";
import { POSTIT_COLORS, URGENCY_LABELS, URGENCY_STYLES } from "@/lib/follow-up/types";
import {
  formatDaysInStepLabel,
  formatKanbanDueLabel,
  initialsFromName,
  urgencyRank,
} from "@/lib/follow-up/urgency";
import type { FollowUpCardData } from "@/components/follow-up/FollowUpPostItCard";
import type { SerializedAttention } from "@/lib/follow-up/attention";
import { isPhaseStart, phaseForStatus } from "@/lib/follow-up/phases";
import { isFollowUpUrgentLevel } from "@/lib/follow-up/kpi";
import { cn } from "@/lib/cn";

/** Sous-processus visibles discrètement (pas un 2e statut). */
const SUBPROCESS_CHIP: Partial<Record<string, string>> = {
  COMMANDE_FOURNISSEUR: "Commande",
  COMMANDE_PASSEE: "Commande",
  ATTENTE_FOURNISSEUR: "Fournisseur",
  AVENANT: "Avenant",
  A_FACTURER: "Facturation",
  FACTURE: "Facturation",
  ATTENTE_REGLEMENT: "Règlement",
};

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
}: {
  sheet: KanbanSheet;
  canEdit: boolean;
  columns: KanbanColumn[];
  onMove: (sheetId: string, toStatus: string, source: "kanban" | "menu") => void;
  dragging: boolean;
}) {
  const border = POSTIT_COLORS[sheet.colorKey]?.border ?? "border-slate-200";
  const urgencyKey = (sheet.attention?.effectiveUrgency ?? sheet.urgency) as FollowUpUrgency;
  const urgency = URGENCY_STYLES[urgencyKey] ?? URGENCY_STYLES.NORMAL;
  const primaryReason = sheet.attention?.primaryReason ?? null;
  const urgencyLabel =
    sheet.attention != null
      ? (URGENCY_LABELS[urgencyKey] ?? sheet.urgencyLabel)
      : sheet.urgencyLabel;
  const ref = sheet.osNumber
    ? `OS-${sheet.osNumber}`
    : sheet.orderNumber
      ? sheet.orderNumber
      : null;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const daysInStep = formatDaysInStepLabel(
    sheet.statusEnteredAt ? new Date(sheet.statusEnteredAt) : null,
  );
  const dueLabel = formatKanbanDueLabel(
    sheet.nextActionAt ? new Date(sheet.nextActionAt) : null,
  );
  const initials = initialsFromName(sheet.assignee?.name);
  const shortName = sheet.assignee?.name?.trim().split(/\s+/)[0] ?? null;

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
        "relative rounded-xl border border-bework-navy/10 bg-[linear-gradient(180deg,#ffffff_0%,#f7f9fc_100%)] px-2.5 py-2 shadow-sm transition",
        border,
        canEdit ? "cursor-grab active:cursor-grabbing" : "",
        dragging ? "opacity-40 ring-2 ring-[#1e3a5f]/40" : "hover:border-slate-300 hover:shadow",
      )}
    >
      <StepAccent colorKey={sheet.colorKey} />
      <div className="mt-0.5 flex items-start justify-between gap-1">
        <Link
          href={`/dashboard/fiches-suivi/${sheet.id}`}
          className="min-w-0 flex-1 text-[13px] font-bold leading-snug text-slate-900 line-clamp-2 hover:underline"
          onClick={(e) => {
            if (dragging) e.preventDefault();
          }}
        >
          {sheet.title}
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
              ···
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

      {(ref || sheet.workObject || sheet.clientName) && (
        <p className="mt-0.5 text-[11px] text-slate-500 line-clamp-1">
          {[sheet.clientName, ref, sheet.workObject].filter(Boolean).join(" · ")}
        </p>
      )}

      {SUBPROCESS_CHIP[sheet.status] ? (
        <p className="mt-1 text-[10px] font-medium text-slate-400">
          {SUBPROCESS_CHIP[sheet.status]}
        </p>
      ) : null}

      {sheet.nextAction ? (
        <p className="mt-1.5 text-xs leading-snug text-slate-800">
          <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Prochaine action
          </span>
          <span className="font-semibold line-clamp-2">{sheet.nextAction}</span>
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
              dueLabel.startsWith("En retard") ? "text-red-700" : "text-slate-700",
            )}
          >
            {dueLabel}
          </span>
        ) : null}
        {daysInStep ? <span className="text-slate-500">{daysInStep}</span> : null}
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold uppercase tracking-wide",
            urgencyKey === "NORMAL"
              ? "bg-slate-50 text-[10px] text-slate-500"
              : cn("text-[10px]", urgency.badge),
          )}
          title="Urgence BeWork (distincte de l’étape)"
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", urgency.dot)} aria-hidden />
          {urgencyLabel}
        </span>
      </div>
      {primaryReason && urgencyKey !== "NORMAL" ? (
        <p className="mt-1 text-[11px] leading-snug text-slate-600 line-clamp-2">{primaryReason}</p>
      ) : null}
    </div>
  );
}

export function FollowUpKanban({
  columns,
  sheets,
  canEdit = false,
  currentUserId = null,
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
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (hideEmpty && dragId === null) {
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
  }, [columns, filtered, hideEmpty, dragId]);

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
            onChange={(e) => setHideEmpty(e.target.checked)}
            className="rounded border-slate-300"
          />
          Masquer les étapes vides
        </label>
        <p className="ml-auto pb-1.5 text-xs text-slate-600">
          <span className="font-bold text-slate-900">{summary.total}</span> dossiers
          {summary.urgent > 0 ? (
            <>
              {" · "}
              <span className="font-semibold text-red-700">{summary.urgent} urgents</span>
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

      {!canEdit ? (
        <p className="text-xs text-slate-500">
          Lecture seule — vous n’avez pas le droit de déplacer les fiches.
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          Glissez une fiche vers une autre colonne, ou utilisez ··· → Changer d’étape.
          {hideEmpty ? " Pendant un glisser-déposer, toutes les étapes réapparaissent." : null}
        </p>
      )}

      <div className="relative">
        <div
          ref={scrollRef}
          className="follow-up-kanban-scroll -mx-4 overflow-x-auto overscroll-x-contain px-4 pb-3 sm:-mx-6 sm:px-6"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#94a3b8 #e2e8f0",
          }}
        >
          <div className="flex min-w-max gap-3 pt-5">
            {cols.map((col) => {
              const items = byStatus.get(col.statusKey) ?? [];
              const accent = POSTIT_COLORS[col.colorKey] ?? POSTIT_COLORS.jaune;
              const isOver = overStatus === col.statusKey && canEdit;
              const phase = phaseForStatus(col.statusKey);
              const showPhase = isPhaseStart(col.statusKey, colKeys) && phase;
              return (
                <section
                  key={col.statusKey}
                  className={cn(
                    "relative flex w-[260px] shrink-0 flex-col rounded-2xl border border-bework-navy/12 bg-bework-soft-navy/35 transition",
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
                  <header className={cn("rounded-t-2xl border-b px-3 py-2", accent.bg, accent.border)}>
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={cn(
                          "flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide",
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
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700">
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
                          />
                        </li>
                      ))
                    )}
                  </ul>
                </section>
              );
            })}
            {/* Indicateur de suite horizontale */}
            <div
              className="flex w-8 shrink-0 items-center justify-center self-stretch text-slate-300"
              aria-hidden
            >
              <span className="text-lg font-light">›</span>
            </div>
          </div>
        </div>
        <p className="mt-1 text-center text-[10px] text-slate-400 sm:hidden">
          Faites glisser horizontalement pour voir les autres étapes
        </p>
        <p className="mt-1 hidden text-center text-[10px] text-slate-400 sm:block">
          Défilement horizontal · trackpad · Shift + molette
        </p>
      </div>
    </div>
  );
}
