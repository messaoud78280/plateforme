import { TableSkeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="cc-enter space-y-6" role="status" aria-label="Chargement du tableau de bord">
      <div className="cc-card space-y-3 p-5">
        <div className="h-3 w-24 animate-pulse rounded bg-bework-navy/10" />
        <div className="h-8 w-2/3 max-w-md animate-pulse rounded bg-bework-navy/10" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-bework-navy/10" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="cc-kpi h-20 animate-pulse bg-bework-navy/[0.06]" />
        ))}
      </div>
      <TableSkeleton rows={5} />
      <span className="sr-only">Chargement en cours…</span>
    </div>
  );
}
