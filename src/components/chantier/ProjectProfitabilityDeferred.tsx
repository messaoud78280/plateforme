import { loadProjectProfitability } from "@/lib/chantier/project-profitability";
import { ProjectProfitabilityPanel } from "@/components/chantier/ProjectProfitabilityPanel";

export async function ProjectProfitabilityDeferred({
  organizationId,
  projectId,
}: {
  organizationId: string;
  projectId: string;
}) {
  const t0 = Date.now();
  const data = await loadProjectProfitability(organizationId, projectId).catch(
    (e) => {
      console.error("[ProjetDetail] profitability deferred:", e);
      return null;
    },
  );
  if (
    process.env.BEWORK_PERF_LOG === "1" ||
    process.env.NODE_ENV === "development"
  ) {
    console.info(`[PROJECT PERF] profitability Suspense: ${Date.now() - t0}ms`);
  }
  if (!data) return null;
  return <ProjectProfitabilityPanel initial={data} />;
}

export function ProjectProfitabilitySkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4">
      <div className="h-4 w-40 rounded bg-slate-200/80" />
      <div className="mt-3 h-24 rounded-lg bg-slate-50" />
    </div>
  );
}
