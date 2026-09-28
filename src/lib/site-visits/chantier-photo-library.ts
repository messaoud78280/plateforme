import { prisma } from "@/lib/prisma";
import { photoCategoryLabel } from "@/lib/site-visits/survey-types";

export type ChantierPhotoRef = {
  siteVisitMediaId: string;
  visitId: string;
  visitLabel: string;
  linkedToProject: boolean;
  chantierFileId: string | null;
  photoCode: string;
  name: string;
  caption: string | null;
  category: string | null;
  categoryLabel: string | null;
  zone: string | null;
  observation: string | null;
  origin: "TERRAIN" | "DEMONSTRATION";
};

/** Photos de l'organisation : liées au dossier d'abord, puis les visites non rattachées. */
export async function listChantierPhotos(opts: {
  organizationId: string;
  projectId: string;
}): Promise<ChantierPhotoRef[]> {
  const visits = await prisma.siteVisit.findMany({
    where: { organizationId: opts.organizationId },
    orderBy: { updatedAt: "desc" },
    take: 80,
    select: {
      id: true,
      clientName: true,
      siteName: true,
      projectId: true,
      medias: {
        where: { kind: "PHOTO" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          caption: true,
          category: true,
          zone: true,
          observation: true,
          origin: true,
          chantierFileId: true,
        },
      },
    },
  });

  const rows: ChantierPhotoRef[] = [];
  for (const visit of visits) {
    visit.medias.forEach((media, index) => {
      rows.push({
        siteVisitMediaId: media.id,
        visitId: visit.id,
        visitLabel: visit.siteName?.trim() || visit.clientName,
        linkedToProject: visit.projectId === opts.projectId,
        chantierFileId: media.chantierFileId,
        photoCode: `PHOTO-${String(index + 1).padStart(3, "0")}`,
        name: media.name,
        caption: media.caption,
        category: media.category,
        categoryLabel: photoCategoryLabel(media.category),
        zone: media.zone,
        observation: media.observation,
        origin: media.origin === "DEMONSTRATION" ? "DEMONSTRATION" : "TERRAIN",
      });
    });
  }

  rows.sort((a, b) => Number(b.linkedToProject) - Number(a.linkedToProject));
  return rows;
}
