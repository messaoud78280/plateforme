import { loadDocumentHub } from "@/lib/ged/document-hub";
import { ChantierDossierSection } from "@/components/chantier/ChantierDossierSection";
import type { Session } from "next-auth";

type FolderRow = {
  id: string;
  code: string;
  label: string;
  files: Array<{
    id: string;
    name: string;
    fileUrl: string;
    mimeType: string | null;
    documentType: string | null;
    status: string;
    comment: string | null;
    createdAt: string;
    addedBy: { name: string | null } | null;
    visibility: string;
  }>;
};

/** GED hub — chargé en Suspense (ne bloque pas le shell chantier). */
export async function ChantierDossierDeferred({
  projectId,
  projectTitle,
  folders,
  canEdit,
  user,
}: {
  projectId: string;
  projectTitle: string;
  folders: FolderRow[];
  canEdit: boolean;
  user: {
    id: string;
    role: Session["user"]["role"];
    personType: string | null;
    permissionProfile: string | null;
    name: string | null;
  };
}) {
  const t0 = Date.now();
  const hub = await loadDocumentHub({
    user: {
      id: user.id,
      role: user.role,
      personType: user.personType,
      permissionProfile: user.permissionProfile,
      name: user.name,
    },
    page: 1,
    projectId,
    view: "all",
    sort: "recent",
  }).catch((e) => {
    console.error("[ProjetDetail] GED hub deferred:", e);
    return {
      items: [] as never[],
      classifyCount: 0,
    };
  });
  if (
    process.env.BEWORK_PERF_LOG === "1" ||
    process.env.NODE_ENV === "development"
  ) {
    console.info(`[PROJECT PERF] documentHub Suspense: ${Date.now() - t0}ms`);
  }

  return (
    <div id="dossier-chantier">
      <ChantierDossierSection
        projectId={projectId}
        projectTitle={projectTitle}
        folders={folders}
        canEdit={canEdit}
        hubItems={hub.items}
        classifyCount={hub.classifyCount}
      />
    </div>
  );
}

export function ChantierDossierSkeleton() {
  return (
    <div
      id="dossier-chantier"
      className="animate-pulse rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="h-5 w-48 rounded bg-slate-200/80" />
      <div className="mt-4 space-y-2">
        <div className="h-10 rounded-lg bg-slate-50" />
        <div className="h-10 rounded-lg bg-slate-50" />
        <div className="h-10 rounded-lg bg-slate-50" />
      </div>
    </div>
  );
}
