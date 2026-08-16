"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FollowUpPostItCard, type FollowUpCardData } from "@/components/follow-up/FollowUpPostItCard";
import { STATUS_LABELS, URGENCY_LABELS } from "@/lib/follow-up/types";
import { cn } from "@/lib/cn";

type Sheet = FollowUpCardData & {
  status: string;
  clientName?: string | null;
  nextActionAt?: string | null;
};

type Props = {
  sheets: Sheet[];
  activeFilter?: string | null;
};

type GroupMode = "none" | "urgency" | "status";
type DayPreset = "all" | "today" | "overdue";

const URGENCY_ORDER = ["CRITIQUE", "URGENT", "IMPORTANT", "A_SURVEILLER", "NORMAL"];

export function FollowUpBoard({ sheets, activeFilter }: Props) {
  const [q, setQ] = useState("");
  const [urgency, setUrgency] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<GroupMode>("none");
  const [mineOnly, setMineOnly] = useState(false);
  const [dayPreset, setDayPreset] = useState<DayPreset>(
    activeFilter === "today" ? "today" : activeFilter === "overdue" ? "overdue" : "all",
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const endToday = new Date(now);
    endToday.setHours(23, 59, 59, 999);

    return sheets.filter((s) => {
      if (urgency !== "all" && s.urgency !== urgency) return false;
      if (status !== "all" && s.status !== status) return false;
      if (mineOnly && !s.assignee) return false;
      if (dayPreset === "overdue" && !s.delayLabel) return false;
      if (dayPreset === "today") {
        if (s.nextActionDone) return false;
        const raw = (s as Sheet & { nextActionAt?: string | null }).nextActionAt;
        if (!raw) return false;
        const d = new Date(raw);
        if (d < startToday || d > endToday) return false;
      }
      if (!query) return true;
      const hay = [
        s.title,
        s.osNumber,
        s.orderNumber,
        s.workObject,
        s.nextAction,
        s.assignee?.name,
        s.statusLabel,
        s.clientName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(query);
    });
  }, [sheets, q, urgency, status, mineOnly, dayPreset]);

  const groups = useMemo(() => {
    if (groupBy === "none") return [{ key: "all", label: "Toutes les fiches", items: filtered }];
    if (groupBy === "urgency") {
      return URGENCY_ORDER.map((u) => ({
        key: u,
        label: URGENCY_LABELS[u as keyof typeof URGENCY_LABELS] ?? u,
        items: filtered.filter((s) => s.urgency === u),
      })).filter((g) => g.items.length > 0);
    }
    const byStatus = new Map<string, Sheet[]>();
    for (const s of filtered) {
      const list = byStatus.get(s.status) ?? [];
      list.push(s);
      byStatus.set(s.status, list);
    }
    return Array.from(byStatus.entries()).map(([st, items]) => ({
      key: st,
      label: STATUS_LABELS[st as keyof typeof STATUS_LABELS] ?? st,
      items,
    }));
  }, [filtered, groupBy]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl bw-surface-tinted-navy p-4 shadow-sm">
        <label className="min-w-[180px] flex-1 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-bework-navy/70">Recherche</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Chantier, OS, action, responsable…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Journée</span>
          <select
            value={dayPreset}
            onChange={(e) => setDayPreset(e.target.value as DayPreset)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">Toutes</option>
            <option value="today">Aujourd’hui</option>
            <option value="overdue">En retard</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Urgence</span>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">Toutes</option>
            {URGENCY_ORDER.map((u) => (
              <option key={u} value={u}>
                {URGENCY_LABELS[u as keyof typeof URGENCY_LABELS]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Statut</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">Tous</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Regrouper</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupMode)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="none">Mur libre</option>
            <option value="urgency">Par urgence</option>
            <option value="status">Par statut</option>
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-xs font-semibold text-slate-700">
          <input type="checkbox" checked={mineOnly} onChange={(e) => setMineOnly(e.target.checked)} />
          Avec responsable
        </label>
        {activeFilter ? (
          <Link
            href="/dashboard/fiches-suivi"
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Effacer filtre URL
          </Link>
        ) : null}
      </div>

      <p className="text-xs text-slate-500">
        {filtered.length} fiche{filtered.length === 1 ? "" : "s"}
        {filtered.length !== sheets.length ? ` sur ${sheets.length}` : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-slate-800">Aucune fiche ne correspond</p>
          <p className="mt-1 text-xs text-slate-500">Élargissez les filtres ou créez une nouvelle fiche.</p>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.key} className="space-y-3">
            {groupBy !== "none" ? (
              <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                {g.label}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {g.items.length}
                </span>
              </h2>
            ) : null}
            <div
              className={cn(
                "grid gap-3",
                groupBy === "urgency" ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {g.items.map((s) => (
                <FollowUpPostItCard key={s.id} sheet={s} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
