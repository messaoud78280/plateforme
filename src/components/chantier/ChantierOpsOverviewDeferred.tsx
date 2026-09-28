import { loadChantierCockpitOps } from "@/lib/chantier/cockpit-ops";
import { ChantierOpsOverview } from "@/components/chantier/ChantierOpsOverview";

export async function ChantierOpsOverviewDeferred({
  projectId,
  projectTitle,
  externalViewer,
  billingHint,
}: {
  projectId: string;
  projectTitle: string;
  externalViewer: boolean;
  billingHint: { label: string; count: number; href: string } | null;
}) {
  const t0 = Date.now();
  const ops = await loadChantierCockpitOps({
    projectId,
    projectTitle,
    externalViewer,
  }).catch((e) => {
    console.error("[ProjetDetail] cockpit ops deferred:", e);
    return null;
  });
  if (
    process.env.BEWORK_PERF_LOG === "1" ||
    process.env.NODE_ENV === "development"
  ) {
    console.info(`[PROJECT PERF] cockpitOps Suspense: ${Date.now() - t0}ms`);
  }
  if (!ops) return null;
  return (
    <ChantierOpsOverview
      ops={ops}
      mode={externalViewer ? "external" : "internal"}
      billingHint={billingHint}
    />
  );
}

export function ChantierOpsOverviewSkeleton() {
  return (
    <div className="animate-pulse space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
      <div className="h-4 w-40 rounded bg-slate-200/80" />
      <div className="h-16 rounded-lg bg-white" />
    </div>
  );
}
