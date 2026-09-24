"use client";

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
import type { CommercialDashboardMetrics } from "@/lib/commercial/dashboard-metrics";
import { fmtMoney } from "./format";

type SeriesFlags = {
  billed: boolean;
  collected: boolean;
  accepted: boolean;
};

/**
 * Graphique isolé — chargé uniquement côté client (Recharts + ResponsiveContainer).
 * Ne jamais importer ce module depuis un Server Component sans `dynamic(..., { ssr: false })`.
 */
export function CommercialDashboardChart({
  seriesData,
  series,
}: {
  seriesData: CommercialDashboardMetrics["revenueSeries"];
  series: SeriesFlags;
}) {
  if (
    seriesData.every(
      (p) => p.billedHt === 0 && p.collectedTtc === 0 && p.acceptedHt === 0,
    )
  ) {
    return (
      <p className="flex h-full items-center justify-center text-sm text-bework-muted">
        Pas encore d’activité sur cette période.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
      <ComposedChart data={seriesData}>
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
  );
}
