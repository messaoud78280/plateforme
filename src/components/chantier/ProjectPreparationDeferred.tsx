import { getProjectWorkspace } from "@/lib/chantier/project-workspace";
import { ProjectPreparationOverview } from "@/components/chantier/ProjectPreparationOverview";

/** Bloc préparation — chargé en Suspense (ne bloque pas le shell chantier). */
export async function ProjectPreparationDeferred({
  organizationId,
  projectId,
  canEdit,
  hasResponsible = true,
  missingDocumentsCount = 0,
}: {
  organizationId: string;
  projectId: string;
  canEdit: boolean;
  hasResponsible?: boolean;
  missingDocumentsCount?: number;
}) {
  const t0 = Date.now();
  const workspace = await getProjectWorkspace(
    organizationId,
    projectId,
    hasResponsible,
  ).catch(
    (e) => {
      console.error("[ProjetDetail] preparation workspace:", e);
      return null;
    },
  );
  if (
    process.env.BEWORK_PERF_LOG === "1" ||
    process.env.NODE_ENV === "development"
  ) {
    console.info(
      `[PROJECT PERF] preparation Suspense: ${Date.now() - t0}ms`,
    );
  }
  if (!workspace) return null;
  return (
    <div className="pt-1 pb-1">
      <ProjectPreparationOverview
        workspace={workspace}
        canEdit={canEdit}
        hasResponsible={hasResponsible}
        missingDocumentsCount={missingDocumentsCount}
      />
    </div>
  );
}

export function ProjectPreparationSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="rounded-2xl border border-slate-200/90 bg-white px-4 py-4">
        <div className="h-4 w-40 rounded bg-slate-200/80" />
        <div className="mt-3 h-8 w-48 rounded bg-slate-100" />
        <div className="mt-3 h-11 w-full max-w-xl rounded-xl bg-[#1e3a5f]/[0.06]" />
      </div>
      <div className="flex gap-2 overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-[4.25rem] min-w-[7rem] flex-1 rounded-xl bg-slate-50" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl border border-slate-200/90 bg-white" />
        ))}
      </div>
    </div>
  );
}
