"use client";

import Link from "next/link";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  GitBranch,
  Percent,
  Receipt,
  Wallet,
} from "lucide-react";
import { HeaderDropdown } from "@/components/ui/HeaderDropdown";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import {
  COMMERCIAL_INVOICE_STATUS_LABELS,
  COMMERCIAL_QUOTE_STATUS_LABELS,
} from "@/lib/commercial/money";
import {
  badgeClassForTone,
  DEVIS_STATUS_TONE,
  FACTURE_STATUS_TONE,
  resolveTone,
} from "@/lib/design-system/semantic-colors";
import {
  DASHBOARD_PERIOD_OPTIONS,
  type DashboardPeriodPreset,
} from "@/lib/commercial/dashboard-periods";
import type { CommercialDashboardMetrics } from "@/lib/commercial/dashboard-metrics";
import { ELECTRONIC_REFORM_MILESTONES } from "@/lib/commercial/electronic-invoicing";
import {
  exclusiveToInclusive,
  fmtDate,
  fmtMoney,
  toInputDate,
} from "./format";

const AGING_COLORS: Record<string, string> = {
  not_due: "#2563eb",
  d1_30: "#f59e0b",
  d31_60: "#f97316",
  d61_90: "#ef4444",
  d90_plus: "#b91c1c",
};

const PRIORITY_CLASS: Record<string, string> = {
  critical: "bg-bework-critical/12 text-bework-critical",
  urgent: "bg-bework-watch/15 text-[#b45309]",
  watch: "bg-bework-watch/10 text-[#b45309]",
  info: "bg-bework-navy/8 text-bework-navy",
};

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2 || values.every((v) => v === 0)) {
    return <div className="h-8 w-full" />;
  }
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const w = 120;
  const h = 32;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - 2 - ((v - min) / span) * (h - 4);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-full" aria-hidden>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
    </svg>
  );
}

function TrendBadge({
  trend,
}: {
  trend: CommercialDashboardMetrics["summary"]["billedHtTrend"] | null;
}) {
  if (!trend || trend.kind === "na") {
    return <span className="text-[11px] text-bework-muted">—</span>;
  }
  if (trend.kind === "new") {
    return <span className="badge-cc badge-cc-info text-[10px]">{trend.label}</span>;
  }
  return (
    <span
      className={cn(
        "text-[11px] font-semibold tabular-nums",
        trend.kind === "up" && "text-bework-ok",
        trend.kind === "down" && "text-bework-critical",
        trend.kind === "flat" && "text-bework-muted",
      )}
    >
      {trend.label}
    </span>
  );
}

export function CommercialDashboard({
  initial,
  initialClientId,
  initialProjectId,
}: {
  initial: CommercialDashboardMetrics;
  initialClientId?: string;
  initialProjectId?: string;
}) {
  const [metrics, setMetrics] = useState(initial);
  const [preset, setPreset] = useState<DashboardPeriodPreset>(
    initial.period.preset,
  );
  const [from, setFrom] = useState(toInputDate(initial.period.from));
  const [to, setTo] = useState(exclusiveToInclusive(initial.period.toExclusive));
  const [clientId, setClientId] = useState(initialClientId ?? "");
  const [projectId, setProjectId] = useState(initialProjectId ?? "");
  const [series, setSeries] = useState({
    billed: true,
    collected: true,
    accepted: false,
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (next: {
      preset: DashboardPeriodPreset;
      from: string;
      to: string;
      clientId: string;
      projectId: string;
    }) => {
      const params = new URLSearchParams();
      params.set("period", next.preset);
      if (next.preset === "custom") {
        if (next.from) params.set("from", next.from);
        if (next.to) params.set("to", next.to);
      }
      if (next.clientId) params.set("clientId", next.clientId);
      if (next.projectId) params.set("projectId", next.projectId);
      startTransition(async () => {
        setError(null);
        try {
          const res = await fetch(`/api/commercial/dashboard?${params.toString()}`);
          const data = await res.json();
          if (!res.ok || data.error) {
            setError(data.error || "Chargement impossible");
            return;
          }
          setMetrics(data.metrics as CommercialDashboardMetrics);
        } catch {
          setError("Chargement impossible");
        }
      });
    },
    [],
  );

  function applyPreset(next: DashboardPeriodPreset) {
    setPreset(next);
    load({ preset: next, from, to, clientId, projectId });
  }

  const agingTotal = Math.max(metrics.receivablesAging.totalTtc, 0.0001);
  const pipelineMax = Math.max(
    ...metrics.quotePipeline.stages.map((s) => s.amountHt),
    1,
  );

  const performanceItems = useMemo(() => {
    const p = metrics.salesPerformance;
    const items: Array<{ label: string; value: string; hint: string }> = [];
    if (p.conversionRate != null) {
      items.push({
        label: "Transformation",
        value: `${fmtMoney(p.conversionRate, 1)} %`,
        hint: "Acceptés / (acceptés + refusés)",
      });
    }
    if (p.avgQuoteBasketHt != null) {
      items.push({
        label: "Panier devis",
        value: `${fmtMoney(p.avgQuoteBasketHt)} €`,
        hint: "HT — devis acceptés de la période",
      });
    }
    if (p.avgInvoiceBasketHt != null) {
      items.push({
        label: "Panier facture",
        value: `${fmtMoney(p.avgInvoiceBasketHt)} €`,
        hint: "HT — factures émises de la période",
      });
    }
    if (p.avgAcceptanceDays != null) {
      items.push({
        label: "Délai d’acceptation",
        value: `${fmtMoney(p.avgAcceptanceDays, 1)} j`,
        hint: "Envoi → acceptation",
      });
    }
    if (p.avgCollectionDays != null) {
      items.push({
        label: "Délai d’encaissement",
        value: `${fmtMoney(p.avgCollectionDays, 1)} j`,
        hint: "Émission → dernier paiement",
      });
    }
    if (p.paidOnTimeRate != null) {
      items.push({
        label: "Payées dans les délais",
        value: `${fmtMoney(p.paidOnTimeRate, 1)} %`,
        hint: "Factures soldées avant ou à l’échéance",
      });
    }
    return items;
  }, [metrics.salesPerformance]);

  if (metrics.empty) {
    return (
      <div className="mx-auto w-full max-w-[1320px]">
        <EmptyState
          title="Votre activité apparaîtra ici dès vos premières factures."
          description="Créez un devis, préparez une facture, puis suivez encaissements et créances dans ce cockpit."
          actionLabel="+ Nouveau devis"
          actionHref="/dashboard/devis-facturation/devis/nouveau"
        />
      </div>
    );
  }

  const kpis = [
    {
      key: "billed",
      label: "CA facturé",
      value: fmtMoney(metrics.summary.billedHt),
      unit: "HT",
      trend: metrics.summary.billedHtTrend,
      spark: metrics.summary.billedSpark,
      href: "/dashboard/devis-facturation/factures",
      icon: Receipt,
      tone: "accent" as const,
      color: "#2563eb",
      tip: `Montant HT des factures émises sur ${metrics.period.label}, avoirs déduits.`,
      suffix: true,
    },
    {
      key: "collected",
      label: "Encaissé",
      value: fmtMoney(metrics.summary.collectedTtc),
      unit: "TTC",
      trend: metrics.summary.collectedTtcTrend,
      spark: metrics.summary.collectedSpark,
      href: "/dashboard/devis-facturation/encaissements",
      icon: Banknote,
      tone: "ok" as const,
      color: "#059669",
      tip: `Paiements clients enregistrés sur ${metrics.period.label}.`,
      suffix: true,
    },
    {
      key: "outstanding",
      label: "Reste à encaisser",
      value: fmtMoney(metrics.summary.outstandingTtc),
      unit: "TTC",
      trend: null,
      spark: [],
      href: "/dashboard/devis-facturation/encaissements",
      icon: Wallet,
      tone: "cyan" as const,
      color: "#0e7490",
      tip: "Stock actuel : reste dû de toutes les factures ouvertes.",
      suffix: true,
    },
    {
      key: "overdue",
      label: "En retard",
      value: fmtMoney(metrics.summary.overdueTtc),
      unit: "TTC",
      trend: null,
      spark: [],
      href: "/dashboard/devis-facturation/suivi/impayes",
      icon: AlertTriangle,
      tone: metrics.summary.overdueTtc > 0 ? ("critical" as const) : ("navy" as const),
      color: "#dc2626",
      tip: "Reste dû des factures arrivées à échéance et non soldées.",
      suffix: true,
    },
    {
      key: "conversion",
      label: "Transformation",
      value:
        metrics.summary.conversionRate != null
          ? `${fmtMoney(metrics.summary.conversionRate, 1)} %`
          : "—",
      unit: "devis décidés",
      trend: metrics.summary.conversionTrend,
      spark: [],
      href: "/dashboard/devis-facturation/devis?status=ACCEPTED",
      icon: Percent,
      tone: "violet" as const,
      color: "#6d28d9",
      tip: "Devis acceptés / (acceptés + refusés) sur la période. Les brouillons sont exclus.",
      suffix: false,
    },
    {
      key: "pipeline",
      label: "Pipeline devis",
      value: fmtMoney(metrics.summary.pipelineHt),
      unit: "HT",
      trend: null,
      spark: [],
      href: "/dashboard/devis-facturation/devis?status=SENT",
      icon: GitBranch,
      tone: "violet" as const,
      color: "#7c3aed",
      tip: "Montant HT des devis encore non contractualisés (brouillon + envoyés).",
      suffix: true,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[26px] font-semibold tracking-tight text-bework-navy sm:text-[28px]">
            Devis & Facturation
          </h1>
          <p className="mt-1 text-sm text-bework-muted">
            Vue financière et commerciale de votre activité
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={preset}
            onChange={(e) => applyPreset(e.target.value as DashboardPeriodPreset)}
            className="h-10 rounded-xl border border-bework-navy/15 bg-white px-3 text-sm font-medium text-bework-ink shadow-sm outline-none focus:border-bework-accent/40"
            aria-label="Période"
          >
            {DASHBOARD_PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {preset === "custom" ? (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-10 rounded-xl border border-bework-navy/15 px-2 text-sm"
              />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-10 rounded-xl border border-bework-navy/15 px-2 text-sm"
              />
              <button
                type="button"
                className="btn-cc-secondary h-10"
                onClick={() =>
                  load({ preset: "custom", from, to, clientId, projectId })
                }
              >
                OK
              </button>
            </div>
          ) : null}
          {metrics.filters.clients.length > 0 ? (
            <select
              value={clientId}
              onChange={(e) => {
                const v = e.target.value;
                setClientId(v);
                load({ preset, from, to, clientId: v, projectId });
              }}
              className="h-10 max-w-[160px] rounded-xl border border-bework-navy/15 bg-white px-3 text-sm"
              aria-label="Client"
            >
              <option value="">Tous les clients</option>
              {metrics.filters.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          ) : null}
          {metrics.filters.projects.length > 0 ? (
            <select
              value={projectId}
              onChange={(e) => {
                const v = e.target.value;
                setProjectId(v);
                load({ preset, from, to, clientId, projectId: v });
              }}
              className="h-10 max-w-[160px] rounded-xl border border-bework-navy/15 bg-white px-3 text-sm"
              aria-label="Chantier"
            >
              <option value="">Tous les chantiers</option>
              {metrics.filters.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          ) : null}
          <HeaderDropdown
            align="right"
            width={240}
            zIndex={50}
            panelClassName="rounded-xl border border-bework-navy/12 bg-white py-1 shadow-lg"
            trigger={({ onClick, expanded, triggerRef }) => (
              <button
                ref={triggerRef}
                type="button"
                onClick={onClick}
                aria-expanded={expanded}
                className="btn-cc-ghost h-10 px-3 text-sm font-semibold"
              >
                Actions
              </button>
            )}
          >
            <Link
              href="/dashboard/devis-facturation/devis/nouveau"
              className="block px-3 py-2 text-sm hover:bg-bework-soft-navy"
            >
              Créer un devis
            </Link>
            <Link
              href="/dashboard/devis-facturation/factures/preparer"
              className="block px-3 py-2 text-sm hover:bg-bework-soft-navy"
            >
              Préparer une facture
            </Link>
            <Link
              href="/dashboard/devis-facturation/encaissements"
              className="block px-3 py-2 text-sm hover:bg-bework-soft-navy"
            >
              Enregistrer un paiement
            </Link>
          </HeaderDropdown>
          <Link href="/dashboard/devis-facturation/devis/nouveau" className="btn-cc-primary h-10">
            + Nouveau devis
          </Link>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      {metrics.fiscalAlerts.length > 0 ? (
        <ul className="space-y-2">
          {metrics.fiscalAlerts.map((a) => (
            <li
              key={a.ruleId}
              className={cn(
                "rounded-xl border px-4 py-3 text-sm",
                a.tone === "critical" && "border-bework-critical/30 bg-bework-critical/8",
                a.tone === "watch" && "border-bework-watch/30 bg-bework-watch/10",
                a.tone === "info" && "border-bework-navy/15 bg-bework-soft-navy",
              )}
            >
              <p className="font-semibold text-bework-ink">{a.label}</p>
              <p className="mt-0.5 text-bework-muted">{a.message}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className={cn(
          "flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-6",
          pending && "opacity-70",
        )}
      >
        {kpis.map((k) => {
          const Icon = k.icon;
          const pill =
            k.tone === "critical"
              ? "bw-icon-pill-critical"
              : k.tone === "ok"
                ? "bw-icon-pill-ok"
                : k.tone === "cyan"
                  ? "bw-icon-pill-cyan"
                  : k.tone === "violet"
                    ? "bw-icon-pill-violet"
                    : k.tone === "navy"
                      ? "bw-icon-pill-navy"
                      : "bw-icon-pill-accent";
          return (
            <Link
              key={k.key}
              href={k.href}
              title={k.tip}
              className={cn(
                "min-w-[220px] overflow-hidden rounded-2xl border border-bework-navy/10 p-4 shadow-[var(--cc-shadow)] transition hover:-translate-y-0.5 hover:shadow-[var(--cc-shadow-hover)] sm:min-w-0",
                k.tone === "accent" && "bw-surface-tinted-accent",
                k.tone === "ok" && "bw-surface-tinted-ok",
                k.tone === "cyan" && "bw-surface-tinted-cyan",
                k.tone === "critical" && "bw-surface-tinted-critical",
                k.tone === "violet" && "bw-surface-tinted-violet",
                k.tone === "navy" && "bw-surface-tinted-navy",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className={cn("bw-icon-pill", pill)}>
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <TrendBadge trend={k.trend} />
              </div>
              <p className="mt-3 text-[12px] font-medium text-bework-muted">{k.label}</p>
              <p className="mt-0.5 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-bework-navy">
                {k.value}
                {k.suffix ? (
                  <span className="ml-1 text-[13px] font-medium text-bework-muted">€</span>
                ) : null}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-wide text-bework-muted">
                {k.unit}
              </p>
              {k.spark.length > 1 ? (
                <div className="mt-2">
                  <Sparkline values={k.spark} color={k.color} />
                </div>
              ) : null}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="rounded-2xl border border-bework-navy/10 bg-[linear-gradient(180deg,#ffffff_0%,#f5f8fc_100%)] p-5 shadow-[var(--cc-shadow)] lg:col-span-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-semibold text-bework-navy">Activité</h2>
              <p className="mt-0.5 text-[12px] text-bework-muted">
                {metrics.period.label} · facturé en HT, encaissements en TTC — bases distinctes
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["billed", "CA facturé HT", "#2563eb"],
                  ["collected", "Encaissé TTC", "#059669"],
                  ["accepted", "Devis acceptés HT", "#7c3aed"],
                ] as const
              ).map(([key, label, color]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSeries((s) => ({ ...s, [key]: !s[key] }))}
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                    series[key]
                      ? "border-transparent text-white"
                      : "border-bework-navy/15 bg-white text-bework-muted",
                  )}
                  style={series[key] ? { background: color } : undefined}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 h-[280px]">
            {pending ? (
              <Skeleton className="h-full w-full" />
            ) : metrics.revenueSeries.every(
                (p) => p.billedHt === 0 && p.collectedTtc === 0 && p.acceptedHt === 0,
              ) ? (
              <p className="flex h-full items-center justify-center text-sm text-bework-muted">
                Pas encore d’activité sur cette période.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={metrics.revenueSeries}>
                  <CartesianGrid stroke="#e8eef5" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) =>
                      Math.abs(v) >= 1000
                        ? `${Math.round(v / 1000)} k`
                        : `${Math.round(v)}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                    }}
                    formatter={(value, name) => [
                      `${fmtMoney(Number(value) || 0)} €`,
                      String(name),
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  {series.billed ? (
                    <Area
                      type="monotone"
                      dataKey="billedHt"
                      name="CA facturé HT"
                      stroke="#2563eb"
                      fill="#2563eb"
                      fillOpacity={0.12}
                      strokeWidth={2}
                    />
                  ) : null}
                  {series.collected ? (
                    <Line
                      type="monotone"
                      dataKey="collectedTtc"
                      name="Encaissé TTC"
                      stroke="#059669"
                      strokeWidth={2}
                      dot={false}
                    />
                  ) : null}
                  {series.accepted ? (
                    <Line
                      type="monotone"
                      dataKey="acceptedHt"
                      name="Devis acceptés HT"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="4 4"
                    />
                  ) : null}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-bework-navy/10 bw-surface-tinted-violet p-5 shadow-[var(--cc-shadow)] lg:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-bework-navy">
              Pipeline commercial
            </h2>
            <Link
              href="/dashboard/devis-facturation/devis"
              className="text-[12px] font-medium text-bework-navy hover:underline"
            >
              Tout voir
            </Link>
          </div>
          {metrics.quotePipeline.conversionRate != null ? (
            <p className="mt-1 text-[12px] text-bework-muted">
              Transformation {fmtMoney(metrics.quotePipeline.conversionRate, 1)} %
              {metrics.quotePipeline.avgBasketHt != null
                ? ` · panier ${fmtMoney(metrics.quotePipeline.avgBasketHt)} € HT`
                : ""}
              {metrics.quotePipeline.avgAcceptanceDays != null
                ? ` · ${fmtMoney(metrics.quotePipeline.avgAcceptanceDays, 1)} j`
                : ""}
            </p>
          ) : (
            <p className="mt-1 text-[12px] text-bework-muted">
              Pas encore de devis décidés sur la période.
            </p>
          )}
          <ul className="mt-4 space-y-2.5">
            {metrics.quotePipeline.stages.map((st) => (
              <li key={st.key}>
                <Link href={st.href} className="block rounded-xl hover:bg-white/60">
                  <div className="flex items-baseline justify-between gap-2 px-1">
                    <span className="text-[13px] font-medium text-bework-ink">{st.label}</span>
                    <span className="text-[12px] tabular-nums text-bework-muted">
                      {st.count} · {fmtMoney(st.amountHt)} € HT
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/70">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(4, (st.amountHt / pipelineMax) * 100)}%`,
                        background:
                          st.key === "accepted"
                            ? "#059669"
                            : st.key === "refused"
                              ? "#dc2626"
                              : st.key === "waiting"
                                ? "#d97706"
                                : "#7c3aed",
                      }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-[var(--cc-shadow)] lg:col-span-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-bework-navy">Créances clients</h2>
            <Link
              href="/dashboard/devis-facturation/encaissements"
              className="text-[12px] font-medium text-bework-navy hover:underline"
            >
              Encaissements
            </Link>
          </div>
          {metrics.receivablesAging.totalTtc <= 0 ? (
            <p className="mt-8 text-center text-sm text-bework-ok">Aucune créance ouverte.</p>
          ) : (
            <>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full">
                {metrics.receivablesAging.buckets
                  .filter((b) => b.amountTtc > 0)
                  .map((b) => (
                    <div
                      key={b.key}
                      title={`${b.label} · ${fmtMoney(b.amountTtc)} €`}
                      style={{
                        width: `${(b.amountTtc / agingTotal) * 100}%`,
                        background: AGING_COLORS[b.key],
                      }}
                    />
                  ))}
              </div>
              <ul className="mt-4 space-y-2">
                {metrics.receivablesAging.buckets.map((b) => (
                  <li key={b.key} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: AGING_COLORS[b.key] }}
                      />
                      {b.label}
                    </span>
                    <span className="tabular-nums text-bework-ink">
                      {fmtMoney(b.amountTtc)} €
                      <span className="ml-2 text-[11px] text-bework-muted">{b.count}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-bework-navy/10 bw-surface-tinted-watch p-5 shadow-[var(--cc-shadow)] lg:col-span-7">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-bework-navy">À traiter</h2>
            <Link
              href="/dashboard/devis-facturation/suivi/devis-a-relancer"
              className="text-[12px] font-medium text-bework-navy hover:underline"
            >
              Voir tout
            </Link>
          </div>
          {metrics.alerts.length === 0 ? (
            <p className="mt-8 text-center text-sm text-bework-ok">
              Rien d’urgent pour le moment.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-bework-navy/8">
              {metrics.alerts.slice(0, 6).map((a) => (
                <li key={a.id}>
                  <Link
                    href={a.href}
                    className="flex items-start justify-between gap-3 py-3 transition hover:bg-white/50"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            PRIORITY_CLASS[a.priority],
                          )}
                        >
                          {a.priority === "critical"
                            ? "Critique"
                            : a.priority === "urgent"
                              ? "Urgent"
                              : a.priority === "watch"
                                ? "Attention"
                                : "Info"}
                        </span>
                        <p className="text-[13px] font-semibold text-bework-ink">{a.title}</p>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-bework-muted">
                        {a.reference}
                        {a.client ? ` · ${a.client}` : ""}
                      </p>
                      <p className="text-[12px] text-bework-muted">{a.reason}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {a.amountLabel ? (
                        <p className="text-[13px] font-semibold tabular-nums">{a.amountLabel}</p>
                      ) : null}
                      <p className="mt-1 text-[12px] font-medium text-bework-accent">
                        {a.actionLabel}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <DocList
          className="lg:col-span-6"
          title="Derniers devis"
          href="/dashboard/devis-facturation/devis"
          kind="quote"
          rows={metrics.recentQuotes}
        />
        <DocList
          className="lg:col-span-6"
          title="Dernières factures"
          href="/dashboard/devis-facturation/factures"
          kind="invoice"
          rows={metrics.recentInvoices}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <section className="rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-[var(--cc-shadow)] lg:col-span-4">
          <h2 className="text-[16px] font-semibold text-bework-navy">
            Performance commerciale
          </h2>
          {performanceItems.length === 0 ? (
            <p className="mt-6 text-sm text-bework-muted">
              Les indicateurs apparaîtront dès que des devis seront décidés et des factures
              soldées.
            </p>
          ) : (
            <dl className="mt-4 grid grid-cols-2 gap-3">
              {performanceItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-bework-navy/8 bg-bework-soft-navy/40 px-3 py-3"
                  title={item.hint}
                >
                  <dt className="text-[11px] font-medium text-bework-muted">{item.label}</dt>
                  <dd className="mt-1 text-[18px] font-semibold tabular-nums text-bework-navy">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section className="rounded-2xl border border-bework-navy/10 bw-surface-tinted-cyan p-5 shadow-[var(--cc-shadow)] lg:col-span-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-bework-navy">TVA</h2>
            <span className="badge-cc badge-cc-cyan">Estimation</span>
          </div>
          <p className="mt-1 text-[11px] text-bework-muted" title={metrics.vat.method}>
            {metrics.vat.method}
          </p>
          <dl className="mt-4 space-y-3">
            <div className="flex items-baseline justify-between">
              <dt className="text-[13px] text-bework-ink">TVA facturée</dt>
              <dd className="text-[18px] font-semibold tabular-nums">
                {fmtMoney(metrics.vat.billedVat)} €
              </dd>
            </div>
            {metrics.vat.purchaseVatRecorded != null ? (
              <div className="flex items-baseline justify-between">
                <dt className="text-[13px] text-bework-ink">TVA enregistrée sur achats</dt>
                <dd className="text-[18px] font-semibold tabular-nums">
                  {fmtMoney(metrics.vat.purchaseVatRecorded)} €
                </dd>
              </div>
            ) : (
              <p className="text-[12px] text-bework-muted">
                TVA achats non affichée (accès Achats ou pièces manquantes).
              </p>
            )}
            {metrics.vat.estimatedBalance != null ? (
              <div className="flex items-baseline justify-between border-t border-bework-navy/10 pt-3">
                <dt className="text-[13px] font-medium text-bework-ink">Solde estimé</dt>
                <dd className="text-[20px] font-semibold tabular-nums text-bework-navy">
                  {fmtMoney(metrics.vat.estimatedBalance)} €
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-[var(--cc-shadow)] lg:col-span-4">
          <div className="flex items-start gap-3">
            <span className="bw-icon-pill bw-icon-pill-navy">
              <CalendarClock className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <h2 className="text-[16px] font-semibold text-bework-navy">
                Facturation électronique
              </h2>
              <p className="mt-1 text-[13px] font-medium text-bework-muted">
                {metrics.electronicInvoices.label}
              </p>
            </div>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-bework-muted">
            {metrics.electronicInvoices.hint}
          </p>
          <ul className="mt-4 space-y-2">
            {ELECTRONIC_REFORM_MILESTONES.map((m) => (
              <li key={m.id} className="rounded-xl border border-bework-navy/8 px-3 py-2">
                <p className="text-[12px] font-semibold text-bework-ink">
                  {new Date(m.at).toLocaleDateString("fr-FR")} · {m.title}
                </p>
                <p className="text-[11px] text-bework-muted">{m.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function DocList({
  title,
  href,
  rows,
  kind,
  className,
}: {
  title: string;
  href: string;
  kind: "quote" | "invoice";
  className?: string;
  rows: CommercialDashboardMetrics["recentQuotes"];
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-bework-navy/10 bg-[linear-gradient(180deg,#ffffff_0%,#f5f8fc_100%)] shadow-[var(--cc-shadow)]",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-bework-navy/8 px-4 py-3">
        <h2 className="text-[16px] font-semibold text-bework-navy">{title}</h2>
        <Link href={href} className="text-[12px] font-medium text-bework-navy hover:underline">
          Tout voir
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-bework-muted">
          Aucun document pour le moment.
        </p>
      ) : (
        <ul className="divide-y divide-bework-navy/8">
          {rows.map((r) => {
            const tone = resolveTone(
              kind === "quote" ? DEVIS_STATUS_TONE : FACTURE_STATUS_TONE,
              r.status,
            );
            const statusLabel =
              kind === "quote"
                ? (COMMERCIAL_QUOTE_STATUS_LABELS[r.status] ?? r.status)
                : (COMMERCIAL_INVOICE_STATUS_LABELS[r.status] ?? r.status);
            return (
              <li key={r.id}>
                <Link
                  href={r.href}
                  className={cn(
                    "block px-4 py-3 transition hover:bg-white/80",
                    r.overdue && "bg-bework-critical/[0.04]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[13px] font-semibold text-bework-navy">{r.number}</p>
                        <span className={badgeClassForTone(tone.tone)}>{statusLabel}</span>
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-bework-muted">
                        {r.client || "—"}
                        {r.project ? ` · ${r.project}` : ""}
                      </p>
                      <p className="text-[11px] text-bework-muted">
                        {fmtDate(r.date)}
                        {r.action ? ` · ${r.action}` : ""}
                        {r.overdue ? ` · ${r.daysLate} j de retard` : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[14px] font-semibold tabular-nums text-bework-ink">
                        {kind === "quote"
                          ? `${fmtMoney(r.amountHt ?? 0)} € HT`
                          : `${fmtMoney(r.amountTtc ?? 0)} € TTC`}
                      </p>
                      {kind === "invoice" && r.amountDue != null ? (
                        <p className="text-[11px] tabular-nums text-bework-muted">
                          Payé {fmtMoney(r.amountPaid ?? 0)} · reste {fmtMoney(r.amountDue)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
