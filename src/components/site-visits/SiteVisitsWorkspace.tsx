"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  MapPin,
  Ruler,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  SITE_VISIT_DATE_FILTERS,
  SITE_VISIT_FILTERS,
  SITE_VISIT_LOTS,
  SITE_VISIT_STATE_FILTERS,
  SITE_VISIT_STATUS_LABELS,
} from "@/lib/site-visits/types";
import { badgeClassForTone, type BwTone } from "@/lib/design-system/semantic-colors";
import type { SiteVisitStatus } from "@prisma/client";

const VISIT_STATUS_BADGE_TONE: Record<string, BwTone> = {
  TO_PLAN: "neutral",
  SCHEDULED: "accent",
  IN_PROGRESS: "cyan",
  INCOMPLETE: "watch",
  READY_TO_QUOTE: "ok",
  TRANSMITTED: "violet",
  CANCELLED: "neutral",
};

const PIPELINE: { id: SiteVisitStatus; label: string }[] = [
  { id: "TO_PLAN", label: "À planifier" },
  { id: "SCHEDULED", label: "Visite prévue" },
  { id: "IN_PROGRESS", label: "Relevé en cours" },
  { id: "INCOMPLETE", label: "Incomplet" },
  { id: "READY_TO_QUOTE", label: "Prêt à chiffrer" },
  { id: "TRANSMITTED", label: "Transmis au devis" },
];

export type VisitListItem = {
  id: string;
  clientName: string;
  siteName: string | null;
  siteAddress: string;
  scheduledAt: string | null;
  responsibleName: string | null;
  responsibleId?: string | null;
  status: string;
  statusLabel: string;
  subject?: string | null;
  estimatedCrewCount?: number | null;
  estimatedDuration?: string | null;
  lots?: string[];
  completeness?: { done: number; total: number; label: string };
  primaryAction?: { kind: string; label: string; href?: string | null };
  agendaHref?: string | null;
  documentsHref?: string | null;
  projectHref?: string | null;
  stats: {
    measurementCount: number;
    zoneCount?: number;
    lotCount?: number;
    photoCount: number;
    documentCount: number;
    missingOpenCount: number;
    constraintCount?: number;
    quantitySummary: string[];
    totalsByUnit?: string[];
    impactPreview?: string[];
  };
  commercialQuoteNumber: string | null;
  commercialQuoteHref: string | null;
};

export type VisitKpis = {
  toPlan: number;
  thisWeek: number;
  inProgress: number;
  incomplete: number;
  ready: number;
  toQuote: number;
};

function visitStatusBadgeClass(status: string): string {
  return badgeClassForTone(VISIT_STATUS_BADGE_TONE[status] ?? "neutral");
}

function formatWhen(iso: string | null): string {
  if (!iso) return "À planifier";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isTomorrow(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const t = new Date();
  const tom = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1);
  return (
    d.getFullYear() === tom.getFullYear() &&
    d.getMonth() === tom.getMonth() &&
    d.getDate() === tom.getDate()
  );
}

export function SiteVisitsWorkspace({
  initialVisits,
  kpis,
  canCreateQuote,
  currentUserId,
  initialView = "list",
  initialStatus = "",
  initialQ = "",
  initialDate = "",
  initialLot = "",
  initialState = "",
}: {
  initialVisits: VisitListItem[];
  kpis: VisitKpis;
  canCreateQuote: boolean;
  currentUserId: string;
  initialView?: "list" | "pipeline" | "mine";
  initialStatus?: string;
  initialQ?: string;
  initialDate?: string;
  initialLot?: string;
  initialState?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [visits, setVisits] = useState(initialVisits);
  const [kpiState, setKpiState] = useState(kpis);
  const [view, setView] = useState<"list" | "pipeline" | "mine">(initialView);
  const [filter, setFilter] = useState(initialStatus || "all");
  const [q, setQ] = useState(initialQ);
  const [date, setDate] = useState(initialDate);
  const [lot, setLot] = useState(initialLot);
  const [state, setState] = useState(initialState);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [drawer, setDrawer] = useState<VisitListItem | null>(null);
  const [form, setForm] = useState({
    clientName: "",
    siteAddress: "",
    siteName: "",
    contactName: "",
    contactPhone: "",
    subject: "",
    scheduledAt: "",
  });
  const [message, setMessage] = useState<string | null>(null);

  function pushUrl(next: {
    view?: string;
    status?: string;
    q?: string;
    date?: string;
    lot?: string;
    state?: string;
  }) {
    const p = new URLSearchParams();
    const v = next.view ?? view;
    const st = next.status ?? (filter === "all" ? "" : filter);
    const qq = next.q !== undefined ? next.q : q;
    const d0 = next.date !== undefined ? next.date : date;
    const l = next.lot !== undefined ? next.lot : lot;
    const s = next.state !== undefined ? next.state : state;
    if (v && v !== "list") p.set("view", v);
    if (st) p.set("status", st);
    if (qq.trim()) p.set("q", qq.trim());
    if (d0) p.set("date", d0);
    if (l) p.set("lot", l);
    if (s) p.set("state", s);
    const qs = p.toString();
    startTransition(() => {
      router.replace(qs ? `/dashboard/visites-metres?${qs}` : "/dashboard/visites-metres");
    });
  }

  async function reload(overrides?: Record<string, string>) {
    const params = new URLSearchParams();
    const st = overrides?.status ?? (filter === "all" ? "" : filter);
    const qq = overrides?.q ?? q;
    const d0 = overrides?.date ?? date;
    const l = overrides?.lot ?? lot;
    const s = overrides?.state ?? state;
    const v = overrides?.view ?? view;
    if (st) params.set("status", st);
    if (qq.trim()) params.set("q", qq.trim());
    if (d0) params.set("date", d0);
    if (l) params.set("lot", l);
    if (s) params.set("state", s);
    if (v === "mine") params.set("responsibleId", currentUserId);
    const res = await fetch(`/api/site-visits?${params}`);
    if (!res.ok) return;
    const data = await res.json();
    setVisits(data.visits ?? []);
    if (data.kpis) setKpiState(data.kpis);
  }

  useEffect(() => {
    const t = window.setTimeout(() => {
      void reload();
      pushUrl({ q });
    }, 280);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const shown = useMemo(() => {
    if (view !== "mine") return visits;
    return visits.filter((v) => v.responsibleId === currentUserId);
  }, [visits, view, currentUserId]);

  const chips = useMemo(() => {
    const out: { key: string; label: string; clear: () => void }[] = [];
    if (filter !== "all") {
      out.push({
        key: "st",
        label: SITE_VISIT_STATUS_LABELS[filter as SiteVisitStatus] ?? filter,
        clear: () => {
          setFilter("all");
          pushUrl({ status: "" });
          void reload({ status: "" });
        },
      });
    }
    if (date) {
      out.push({
        key: "date",
        label: SITE_VISIT_DATE_FILTERS.find((d) => d.id === date)?.label ?? date,
        clear: () => {
          setDate("");
          pushUrl({ date: "" });
          void reload({ date: "" });
        },
      });
    }
    if (lot) {
      out.push({
        key: "lot",
        label: lot,
        clear: () => {
          setLot("");
          pushUrl({ lot: "" });
          void reload({ lot: "" });
        },
      });
    }
    if (state) {
      out.push({
        key: "state",
        label: SITE_VISIT_STATE_FILTERS.find((s) => s.id === state)?.label ?? state,
        clear: () => {
          setState("");
          pushUrl({ state: "" });
          void reload({ state: "" });
        },
      });
    }
    return out;
  }, [filter, date, lot, state]);

  const treat = useMemo(() => {
    const toPlan = kpiState.toPlan;
    const tomorrowUnprepared = shown.filter(
      (v) => v.status === "SCHEDULED" && isTomorrow(v.scheduledAt) && !v.stats.measurementCount,
    ).length;
    const incomplete = kpiState.incomplete;
    const ready = kpiState.ready;
    return { toPlan, tomorrowUnprepared, incomplete, ready };
  }, [kpiState, shown]);

  async function createVisit() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/site-visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, scheduledAt: form.scheduledAt || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      setCreateOpen(false);
      router.push(`/dashboard/visites-metres/${data.visit.id}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function createQuote(visitId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/site-visits/${visitId}/create-quote`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec");
      if (data.href) window.open(data.href, "_blank", "noopener,noreferrer");
      await reload();
      router.refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  function applyStatus(id: string) {
    setFilter(id);
    pushUrl({ status: id === "all" ? "" : id });
    void reload({ status: id === "all" ? "" : id });
  }

  function primaryClick(v: VisitListItem) {
    if (v.status === "READY_TO_QUOTE" && canCreateQuote) {
      void createQuote(v.id);
      return;
    }
    if (v.status === "TRANSMITTED" && v.commercialQuoteHref) {
      window.open(v.commercialQuoteHref, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(`/dashboard/visites-metres/${v.id}`);
  }

  const kpiItems = [
    { id: "TO_PLAN", value: kpiState.toPlan, label: "À planifier", tone: "neutral" as const, icon: ClipboardList },
    { id: "week", value: kpiState.thisWeek, label: "Cette semaine", tone: "accent" as const, icon: CalendarDays },
    { id: "IN_PROGRESS", value: kpiState.inProgress, label: "Relevés en cours", tone: "cyan" as const, icon: Ruler },
    { id: "INCOMPLETE", value: kpiState.incomplete, label: "Incomplets", tone: "watch" as const, icon: AlertTriangle },
    { id: "READY_TO_QUOTE", value: kpiState.ready, label: "Prêts à chiffrer", tone: "ok" as const, icon: CheckCircle2 },
    { id: "quote", value: kpiState.toQuote, label: "Devis à créer", tone: "violet" as const, icon: FileText },
  ];

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Visites & métrés"
        description="Du terrain au devis, sans ressaisie."
        actions={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
          >
            + Nouvelle visite
          </button>
        }
      />

      {(treat.toPlan > 0 || treat.tomorrowUnprepared > 0 || treat.incomplete > 0 || treat.ready > 0) ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-bework-navy/10 bg-white px-3 py-2 text-[13px]">
          <span className="font-semibold text-bework-navy">À traiter</span>
          {treat.toPlan > 0 ? (
            <button type="button" onClick={() => applyStatus("TO_PLAN")} className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
              {treat.toPlan} visite{treat.toPlan > 1 ? "s" : ""} à planifier
            </button>
          ) : null}
          {treat.tomorrowUnprepared > 0 ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-800">
              {treat.tomorrowUnprepared} visite{treat.tomorrowUnprepared > 1 ? "s" : ""} demain non préparée
              {treat.tomorrowUnprepared > 1 ? "s" : ""}
            </span>
          ) : null}
          {treat.incomplete > 0 ? (
            <button type="button" onClick={() => applyStatus("INCOMPLETE")} className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-800">
              {treat.incomplete} relevé{treat.incomplete > 1 ? "s" : ""} incomplet{treat.incomplete > 1 ? "s" : ""}
            </button>
          ) : null}
          {treat.ready > 0 ? (
            <button type="button" onClick={() => applyStatus("READY_TO_QUOTE")} className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800">
              {treat.ready} métré{treat.ready > 1 ? "s" : ""} prêt{treat.ready > 1 ? "s" : ""} à chiffrer
            </button>
          ) : null}
        </div>
      ) : kpiState.toPlan === 0 && kpiState.incomplete === 0 ? (
        <p className="text-[13px] font-medium text-emerald-700">✓ Aucun relevé bloqué</p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {kpiItems.map((k) => {
          const Icon = k.icon;
          const active = k.id === "week" ? date === "week" : filter === k.id || (k.id === "quote" && filter === "READY_TO_QUOTE");
          return (
            <button
              key={k.id}
              type="button"
              onClick={() => {
                if (k.id === "week") {
                  setDate("week");
                  setFilter("all");
                  pushUrl({ date: "week", status: "" });
                  void reload({ date: "week", status: "" });
                  return;
                }
                applyStatus(k.id === "quote" ? "READY_TO_QUOTE" : k.id);
              }}
              className={cn(
                "rounded-2xl border border-bework-navy/10 bg-white px-3 py-2.5 text-left shadow-[var(--cc-shadow)] transition hover:-translate-y-px",
                active && "ring-2 ring-bework-accent/25",
              )}
            >
              <div className="flex items-start justify-between">
                <p
                  className={cn(
                    "text-[1.35rem] font-semibold tabular-nums leading-none",
                    k.tone === "ok" && "text-bework-ok",
                    k.tone === "watch" && "text-[#b45309]",
                    k.tone === "cyan" && "text-bework-cyan",
                    k.tone === "accent" && "text-bework-accent",
                    k.tone === "violet" && "text-bework-intel",
                    k.tone === "neutral" && "text-bework-navy",
                  )}
                >
                  {k.value}
                </p>
                <Icon className="h-3.5 w-3.5 text-slate-400" strokeWidth={1.75} />
              </div>
              <p className="mt-1.5 text-[12px] font-medium text-slate-600">{k.label}</p>
            </button>
          );
        })}
      </div>

      <div className="sticky top-14 z-20 -mx-1 space-y-2 bg-[linear-gradient(180deg,#f8fafc_75%,rgba(248,250,252,0.8))] px-1 py-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Client, chantier, responsable…"
            className="min-w-[12rem] flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] outline-none focus:border-bework-accent/40"
          />
          <div className="flex rounded-full border border-slate-200 bg-white p-0.5">
            {(["list", "pipeline", "mine"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setView(id);
                  pushUrl({ view: id });
                  void reload({ view: id });
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-[12px] font-medium",
                  view === id ? "bg-bework-soft-navy text-bework-navy" : "text-slate-500",
                )}
              >
                {id === "list" ? "Liste" : id === "pipeline" ? "Pipeline" : "Mes visites"}
              </button>
            ))}
          </div>
          <select
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              pushUrl({ date: e.target.value });
              void reload({ date: e.target.value });
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px]"
          >
            {SITE_VISIT_DATE_FILTERS.map((d) => (
              <option key={d.id || "all"} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
          <select
            value={lot}
            onChange={(e) => {
              setLot(e.target.value);
              pushUrl({ lot: e.target.value });
              void reload({ lot: e.target.value });
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px]"
          >
            <option value="">Tous lots</option>
            {SITE_VISIT_LOTS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              pushUrl({ state: e.target.value });
              void reload({ state: e.target.value });
            }}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px]"
          >
            <option value="">Tous états</option>
            {SITE_VISIT_STATE_FILTERS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => applyStatus("all")}
            className={cn("bw-chip shrink-0", filter === "all" ? "bw-chip-active" : "bw-chip-idle")}
          >
            Tous
          </button>
          {SITE_VISIT_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => applyStatus(f.id)}
              className={cn("bw-chip shrink-0", filter === f.id ? "bw-chip-active" : "bw-chip-idle")}
            >
              {f.label}
            </button>
          ))}
        </div>
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.clear}
                className="inline-flex items-center gap-1 rounded-full bg-bework-soft-navy px-2.5 py-1 text-[12px] font-medium text-slate-700"
              >
                {c.label} <span className="text-slate-400">×</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {message ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{message}</p> : null}

      <div className={cn("flex gap-5", pending && "opacity-70")}>
        <div className="min-w-0 flex-1">
          {view === "pipeline" ? (
            <div className="flex gap-3 overflow-x-auto pb-4">
              {PIPELINE.map((col) => {
                const items = shown.filter((v) => v.status === col.id);
                return (
                  <section key={col.id} className="w-[260px] shrink-0">
                    <h2 className="mb-2 text-[13px] font-semibold text-bework-navy">
                      {col.label} · {items.length}
                    </h2>
                    <ul className="space-y-2">
                      {items.map((v) => (
                        <li key={v.id} className="rounded-xl border border-bework-navy/10 bg-white p-3">
                          <button type="button" className="w-full text-left" onClick={() => setDrawer(v)}>
                            <p className="truncate text-[14px] font-semibold text-bework-ink" title={v.siteName || v.clientName}>
                              {v.siteName || v.clientName}
                            </p>
                            {v.stats.totalsByUnit?.length ? (
                              <p className="mt-1 text-[13px] font-semibold tabular-nums text-bework-navy">
                                {v.stats.totalsByUnit.join(" · ")}
                              </p>
                            ) : null}
                            {v.stats.lotCount ? (
                              <p className="mt-0.5 text-[12px] text-slate-500">{v.stats.lotCount} lot{v.stats.lotCount > 1 ? "s" : ""}</p>
                            ) : null}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => primaryClick(v)}
                            className="mt-2 text-[12px] font-medium text-bework-navy hover:underline"
                          >
                            {v.primaryAction?.label ?? "Ouvrir"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-bework-navy/10 bg-white">
              {shown.map((v) => (
                <li key={v.id}>
                  <div className="group flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-bework-soft-navy/40 lg:flex-row lg:items-center">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left lg:max-w-[28%]"
                      onClick={() => setDrawer(v)}
                    >
                      <p className="truncate text-[16px] font-semibold text-bework-ink" title={v.siteName || v.clientName}>
                        {v.siteName || v.clientName}
                      </p>
                      <p className="truncate text-[13px] text-slate-600" title={v.siteAddress}>
                        <MapPin className="mr-1 inline h-3 w-3" />
                        {v.siteAddress}
                      </p>
                      {v.clientName && v.siteName ? (
                        <p className="truncate text-[13px] text-slate-500">{v.clientName}</p>
                      ) : null}
                      <p className="mt-1 text-[12px] text-slate-500">
                        {formatWhen(v.scheduledAt)}
                        {v.responsibleName ? ` · ${v.responsibleName}` : ""}
                      </p>
                    </button>
                    <div className="min-w-0 flex-1">
                      {v.stats.totalsByUnit?.length ? (
                        <p className="text-[16px] font-semibold tabular-nums text-bework-navy">
                          {v.stats.totalsByUnit.join(" · ")}
                        </p>
                      ) : (
                        <p className="text-[13px] text-slate-500">Pas encore de métré</p>
                      )}
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(v.lots ?? []).slice(0, 3).map((l) => (
                          <span key={l} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {l}
                          </span>
                        ))}
                      </div>
                      <p className="mt-1 text-[12px] text-slate-500">
                        {[
                          v.stats.zoneCount ? `${v.stats.zoneCount} zone${v.stats.zoneCount > 1 ? "s" : ""}` : null,
                          v.stats.photoCount ? `${v.stats.photoCount} photo${v.stats.photoCount > 1 ? "s" : ""}` : null,
                          v.stats.documentCount ? `${v.stats.documentCount} document${v.stats.documentCount > 1 ? "s" : ""}` : null,
                          v.estimatedCrewCount ? `${v.estimatedCrewCount} pers.` : null,
                          v.estimatedDuration ?? null,
                          v.stats.constraintCount ? `${v.stats.constraintCount} contrainte${v.stats.constraintCount > 1 ? "s" : ""}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5 lg:w-[220px]">
                      <span className={visitStatusBadgeClass(v.status)}>{v.statusLabel}</span>
                      {v.completeness ? (
                        <div className="w-full max-w-[11rem]">
                          <p className="text-[11px] font-medium text-slate-500">{v.completeness.label}</p>
                          <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-bework-ok"
                              style={{ width: `${Math.round((v.completeness.done / Math.max(1, v.completeness.total)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : null}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => primaryClick(v)}
                          className="rounded-full bg-[#1e3a5f] px-3 py-1 text-[12px] font-medium text-white disabled:opacity-40"
                        >
                          {v.primaryAction?.label ?? "Ouvrir"}
                        </button>
                        <details className="relative">
                          <summary className="cursor-pointer list-none rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100">
                            ⋯
                          </summary>
                          <div className="absolute right-0 z-10 mt-1 w-44 rounded-xl border border-slate-200 bg-white py-1 text-[12px] shadow-lg">
                            <Link href={`/dashboard/visites-metres/${v.id}`} className="block px-3 py-1.5 hover:bg-slate-50">
                              Ouvrir
                            </Link>
                            {v.agendaHref ? (
                              <Link href={v.agendaHref} className="block px-3 py-1.5 hover:bg-slate-50">
                                Voir Agenda
                              </Link>
                            ) : null}
                            {v.projectHref ? (
                              <Link href={v.projectHref} className="block px-3 py-1.5 hover:bg-slate-50">
                                Voir chantier
                              </Link>
                            ) : null}
                            {v.documentsHref ? (
                              <Link href={v.documentsHref} className="block px-3 py-1.5 hover:bg-slate-50">
                                Voir Documents
                              </Link>
                            ) : null}
                          </div>
                        </details>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {shown.length === 0 ? (
                <li className="px-4 py-12 text-center text-sm text-slate-500">Aucune visite dans ce filtre.</li>
              ) : null}
            </ul>
          )}
        </div>
      </div>

      {drawer ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20" onClick={() => setDrawer(null)}>
          <aside
            className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-[-8px_0_32px_rgba(15,23,42,0.12)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[16px] font-semibold text-bework-ink">{drawer.siteName || drawer.clientName}</p>
                <span className={cn("mt-1 inline-flex", visitStatusBadgeClass(drawer.status))}>{drawer.statusLabel}</span>
              </div>
              <button type="button" onClick={() => setDrawer(null)} className="text-slate-400" aria-label="Fermer">
                ×
              </button>
            </div>
            <dl className="mt-4 space-y-2 text-[13px]">
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-slate-400">Rendez-vous</dt>
                <dd>{formatWhen(drawer.scheduledAt)}{drawer.responsibleName ? ` · ${drawer.responsibleName}` : ""}</dd>
              </div>
              {drawer.stats.totalsByUnit?.length ? (
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">Métrés</dt>
                  <dd className="font-semibold tabular-nums text-bework-navy">{drawer.stats.totalsByUnit.join(" · ")}</dd>
                </div>
              ) : null}
              {drawer.stats.impactPreview?.length ? (
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">Contraintes</dt>
                  <dd>{drawer.stats.impactPreview.join(" · ")}</dd>
                </div>
              ) : null}
              {drawer.stats.photoCount || drawer.stats.documentCount ? (
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">Documents</dt>
                  <dd>
                    {drawer.stats.photoCount ? `${drawer.stats.photoCount} photos` : null}
                    {drawer.stats.photoCount && drawer.stats.documentCount ? " · " : null}
                    {drawer.stats.documentCount ? `${drawer.stats.documentCount} documents` : null}
                  </dd>
                </div>
              ) : null}
              {drawer.completeness ? (
                <div>
                  <dt className="text-[11px] uppercase tracking-wide text-slate-400">Points manquants</dt>
                  <dd>{drawer.completeness.label}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/dashboard/visites-metres/${drawer.id}`}
                className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
              >
                Ouvrir la visite
              </Link>
              <button
                type="button"
                disabled={busy}
                onClick={() => primaryClick(drawer)}
                className="rounded-full border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-700"
              >
                {drawer.primaryAction?.label}
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
            <h2 className="text-lg font-semibold text-[#1e3a5f]">Nouvelle visite</h2>
            <div className="mt-4 space-y-3">
              {(
                [
                  ["clientName", "Client / prospect *"],
                  ["siteName", "Site (nom)"],
                  ["siteAddress", "Adresse *"],
                  ["contactName", "Contact"],
                  ["contactPhone", "Téléphone"],
                  ["subject", "Objet de la visite *"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="block text-xs font-semibold text-slate-600">
                  {label}
                  <input
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                  />
                </label>
              ))}
              <label className="block text-xs font-semibold text-slate-600">
                Date / heure
                <input
                  type="datetime-local"
                  value={form.scheduledAt}
                  onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                />
              </label>
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold">
                Annuler
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void createVisit()}
                className="flex-1 rounded-xl bg-[#1e3a5f] py-3 text-sm font-bold text-white disabled:opacity-50"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
