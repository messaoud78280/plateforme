"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
import type { CommercialDashboardMetrics } from "@/lib/commercial/dashboard-metrics";

const Chart = dynamic(
  () =>
    import("./CommercialDashboardChart").then((m) => m.CommercialDashboardChart),
  {
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
  },
);

/** Wrapper client — `ssr: false` interdit dans les Server Components. */
export function CommercialDashboardChartLazy({
  seriesData,
  series,
}: {
  seriesData: CommercialDashboardMetrics["revenueSeries"];
  series: {
    billed: boolean;
    collected: boolean;
    accepted: boolean;
  };
}) {
  return <Chart seriesData={seriesData} series={series} />;
}
