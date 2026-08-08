"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FollowUpUrgency } from "@prisma/client";
import { POSTIT_COLORS, URGENCY_STYLES } from "@/lib/follow-up/types";
import type { FollowUpCardData } from "@/components/follow-up/FollowUpPostItCard";
import { cn } from "@/lib/cn";

export type KanbanColumn = {
  statusKey: string;
  label: string;
  colorKey: string;
  sortOrder: number;
};

type Sheet = FollowUpCardData & {
  status: string;
  colorKey: string;
  nextActionAt?: string | null;
  nextActionAtLabel?: string | null;
};

type Props = {
  columns: KanbanColumn[];
  sheets: Sheet[];
  canEdit?: boolean;
};

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
): Promise<{ ok: true; sheet: Sheet } | { ok: false; error: string }> {
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
    return { ok: true, sheet: data as Sheet };
  } catch {
    return { ok: false, error: "Impossible de modifier l’étape." };
  }
}

function KanbanCard({
  sheet,
  canEdit,
  columns,
  onMove,
  dragging,
}: {
  sheet: Sheet;
  canEdit: boolean;
  columns: KanbanColumn[];
  onMove: (sheetId: string, toStatus: string, source: "kanban" | "menu") => void;
  dragging: boolean;
}) {
  const border = POSTIT_COLORS[sheet.colorKey]?.border ?? "border-slate-200";
  const urgencyKey = sheet.urgency as FollowUpUrgency;
  const urgency = URGENCY_STYLES[urgencyKey] ?? URGENCY_STYLES.NORMAL;
  const ref = sheet.osNumber
    ? `OS-${sheet.osNumber}`
    : sheet.orderNumber
      ? sheet.orderNumber
      : null;
  const [menuOpen, setMenuOpen] = useState(false);

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
        "relative rounded-xl border bg-white p-3 shadow-sm transition",
        border,
        canEdit ? "cursor-grab active:cursor-grabbing" : "",
        dragging ? "opacity-40 ring-2 ring-[#1e3a5f]/40" : "hover:border-slate-300 hover:shadow",
      )}
    >
      <StepAccent colorKey={sheet.colorKey} />
      <div className="mt-1 flex items-start justify-between gap-1">
        <Link
          href={`/dashboard/fiches-suivi/${sheet.id}`}
          className="min-w-0 flex-1 text-sm font-bold leading-snug text-slate-900 line-clamp-2 hover:underline"
          onClick={(e) => {
            if (dragging) e.preventDefault();
          }}
        >
          {sheet.title}
        </Link>
        {canEdit ? (
          <div className="relative shrink-0">
            <button
              type="button"
              aria-label="Actions fiche"
              aria-expanded={menuOpen}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="rounded px-1.5 py-0.5 text-xs font-bold text-slate-500 hover:bg-slate-100"
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
                  Ouvrir la fiche
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
      {ref ? <p className="mt-1 text-[11px] font-semibold text-slate-500">{ref}</p> : null}
      {sheet.workObject ? (
        <p className="mt-1 text-xs text-slate-600 line-clamp-2">{sheet.workObject}</p>
      ) : null}
      {sheet.nextAction ? (
        <p className="mt-2 text-xs text-slate-700">
          <span className="font-semibold text-slate-500">Prochaine action · </span>
          {sheet.nextAction}
        </p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-600">
        {sheet.assignee?.name ? <span>{sheet.assignee.name}</span> : null}
        {sheet.nextActionAtLabel ? (
          <span className="font-medium text-slate-700">{sheet.nextActionAtLabel}</span>
        ) : null}
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold",
            urgency.badge,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", urgency.dot)} aria-hidden />
          {sheet.urgencyLabel}
        </span>
      </div>
    </div>
  );
}

export function FollowUpKanban({ columns, sheets, canEdit = false }: Props) {
  const router = useRouter();
  const [localSheets, setLocalSheets] = useState<Sheet[]>(sheets);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const sheetsKey = sheets.map((s) => `${s.id}:${s.status}:${s.nextAction ?? ""}`).join("|");

  const syncFromProps = useCallback(() => {
    setLocalSheets(sheets);
  }, [sheets]);

  useEffect(() => {
    if (busyId === null && dragId === null) {
      setLocalSheets(sheets);
    }
  }, [sheets, sheetsKey, busyId, dragId]);

  const cols = useMemo(() => {
    const hasOrphan = localSheets.some((s) => !columns.some((c) => c.statusKey === s.status));
    if (!hasOrphan) return columns;
    return [
      ...columns,
      { statusKey: "__AUTRES__", label: "Autres", colorKey: "jaune", sortOrder: 9999 },
    ];
  }, [columns, localSheets]);

  const byStatus = useMemo(() => {
    const map = new Map<string, Sheet[]>();
    for (const col of cols) map.set(col.statusKey, []);
    for (const sheet of localSheets) {
      const key = map.has(sheet.status) ? sheet.status : "__AUTRES__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(sheet);
    }
    return map;
  }, [cols, localSheets]);

  const moveSheet = useCallback(
    async (sheetId: string, toStatus: string, source: "kanban" | "menu") => {
      if (!canEdit || toStatus === "__AUTRES__") return;
      const current = localSheets.find((s) => s.id === sheetId);
      if (!current || current.status === toStatus) return;

      const previous = localSheets;
      setError(null);
      setBusyId(sheetId);

      // Optimistic
      setLocalSheets((list) =>
        list.map((s) => (s.id === sheetId ? { ...s, status: toStatus } : s)),
      );

      const result = await patchStatus(sheetId, toStatus, source);
      if (!result.ok) {
        setLocalSheets(previous);
        setError(result.error);
        setBusyId(null);
        return;
      }

      // Merge server payload (prochaine action, couleur, etc.)
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
                nextActionAtLabel: result.sheet.nextActionAtLabel ?? s.nextActionAtLabel,
                urgency: result.sheet.urgency ?? s.urgency,
                urgencyLabel: result.sheet.urgencyLabel ?? s.urgencyLabel,
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
      {!canEdit ? (
        <p className="text-xs text-slate-500">
          Lecture seule — vous n’avez pas le droit de déplacer les fiches.
        </p>
      ) : (
        <p className="text-xs text-slate-500">
          Glissez une fiche vers une autre colonne, ou utilisez ··· → Changer d’étape.
        </p>
      )}

      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6">
        <div className="flex min-w-max gap-3">
          {cols.map((col) => {
            const items = byStatus.get(col.statusKey) ?? [];
            const accent = POSTIT_COLORS[col.colorKey] ?? POSTIT_COLORS.jaune;
            const isOver = overStatus === col.statusKey && canEdit;
            return (
              <section
                key={col.statusKey}
                className={cn(
                  "flex w-[280px] shrink-0 flex-col rounded-2xl border bg-slate-50/80 transition",
                  isOver ? "border-[#1e3a5f] bg-[#1e3a5f]/5 ring-2 ring-[#1e3a5f]/20" : "border-slate-200",
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
                <header className={cn("rounded-t-2xl border-b px-3 py-2.5", accent.bg, accent.border)}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={cn("text-xs font-bold uppercase tracking-wide", accent.text)}>
                      {col.label}
                    </h3>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700">
                      {items.length}
                    </span>
                  </div>
                </header>
                <ul className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto p-2">
                  {items.length === 0 ? (
                    <li className="rounded-lg border border-dashed border-slate-200 bg-white/60 px-3 py-6 text-center text-xs text-slate-400">
                      {isOver ? "Déposer ici" : "Aucune fiche"}
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
                          columns={cols}
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
        </div>
      </div>
    </div>
  );
}
