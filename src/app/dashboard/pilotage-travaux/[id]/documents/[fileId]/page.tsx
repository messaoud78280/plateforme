import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/ui/BackLink";
import { StatusBadge } from "@/components/pilotage/PilotageBadges";
import { GedViewerClient } from "@/components/pilotage/GedViewerClient";
import {
  canEditPilotageOperational,
  requirePilotageAccess,
  requirePilotageSession,
} from "@/lib/pilotage/access";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { CHANTIER_FILE_STATUS_LABELS } from "@/lib/chantier-dossier/constants";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";
import { formatDateFr } from "@/lib/pilotage/calculations";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PilotageDocumentViewerPage({
  params,
}: {
  params: Promise<{ id: string; fileId: string }>;
}) {
  const session = await requirePilotageSession();
  const { id: pilotageId, fileId } = await params;
  await requirePilotageAccess({ id: session.user.id, role: session.user.role }, pilotageId);

  const pilotage = await prisma.worksitePilotage.findUnique({
    where: { id: pilotageId },
    select: {
      id: true,
      projectId: true,
      project: { select: { title: true } },
    },
  });
  if (!pilotage) notFound();

  const access = await canAccessChantierProject(session.user, pilotage.projectId);
  if (!access.ok) notFound();

  const file = await prisma.chantierFile.findFirst({
    where: { id: fileId, projectId: pilotage.projectId },
    include: {
      folder: true,
      addedBy: { select: { name: true } },
      comments: { orderBy: { createdAt: "desc" }, take: 40 },
      links: { orderBy: { createdAt: "desc" }, take: 20 },
      replacesFile: { select: { id: true, name: true, indice: true, versionLabel: true } },
      replacedByFiles: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, name: true, indice: true, versionLabel: true, isCurrentVersion: true },
      },
    },
  });
  if (!file) notFound();

  const currentVersion = !file.isCurrentVersion
    ? await prisma.chantierFile.findFirst({
        where: {
          projectId: pilotage.projectId,
          OR: [{ replacesFileId: file.id }, { id: file.replacedByFiles.find((r) => r.isCurrentVersion)?.id }],
          isCurrentVersion: true,
          deletedAt: null,
        },
        select: { id: true, name: true, indice: true, versionLabel: true },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const canEdit = canEditPilotageOperational(session.user.role);
  const statusLabel =
    CHANTIER_FILE_STATUS_LABELS[file.status as keyof typeof CHANTIER_FILE_STATUS_LABELS] ?? file.status;

  return (
    <div className="space-y-4">
      <BackLink href={`${PILOTAGE_LIST_PATH}/${pilotageId}?onglet=documents`}>GED chantier</BackLink>

      {!file.isCurrentVersion ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Vous consultez une version obsolète.
          {currentVersion ? (
            <>
              {" "}
              La version en vigueur est{" "}
              <Link
                href={`${PILOTAGE_LIST_PATH}/${pilotageId}/documents/${currentVersion.id}`}
                className="font-semibold underline"
              >
                {currentVersion.indice
                  ? `indice ${currentVersion.indice}`
                  : `v${currentVersion.versionLabel ?? "?"}`}
              </Link>
              .
            </>
          ) : (
            " Vérifiez la version en vigueur dans la GED."
          )}
        </div>
      ) : null}

      <header className="pilotage-card p-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {pilotage.project.title} · {file.folder.label}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900">{file.name}</h1>
          <StatusBadge status={statusLabel} />
          {file.indice ? <StatusBadge status={`Indice ${file.indice}`} /> : null}
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {file.category ?? "Sans catégorie"}
          {file.documentType ? ` · ${file.documentType}` : ""} · Déposé le {formatDateFr(file.createdAt)}
          {file.addedBy?.name ? ` par ${file.addedBy.name}` : ""} · {file.visibility}
        </p>
        {file.previewStatus ? (
          <p className="mt-2 text-[11px] italic text-slate-500">{file.previewStatus}</p>
        ) : null}
      </header>

      <GedViewerClient
        pilotageId={pilotageId}
        canEdit={canEdit}
        file={{
          id: file.id,
          name: file.name,
          fileUrl: file.fileUrl,
          mimeType: file.mimeType,
          previewStatus: file.previewStatus,
        }}
        comments={file.comments.map((c) => ({
          id: c.id,
          content: c.content,
          authorName: c.authorName,
          pageNumber: c.pageNumber,
          status: c.status,
          createdAt: c.createdAt.toISOString(),
        }))}
        links={file.links.map((l) => ({
          id: l.id,
          entityType: l.entityType,
          entityLabel: l.entityLabel,
        }))}
        versions={[
          ...(file.replacesFile
            ? [
                {
                  id: file.replacesFile.id,
                  label: `Précédente · ${file.replacesFile.indice ?? `v${file.replacesFile.versionLabel}`}`,
                },
              ]
            : []),
          ...file.replacedByFiles.map((r) => ({
            id: r.id,
            label: `${r.isCurrentVersion ? "En vigueur" : "Plus récente"} · ${r.indice ?? `v${r.versionLabel}`}`,
          })),
        ]}
      />
    </div>
  );
}
