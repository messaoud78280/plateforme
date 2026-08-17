/**
 * VISITES-METRES-1 — Upload photo/doc + index GED (sans faux chantier).
 */
import { prisma } from "@/lib/prisma";
import { createServiceRoleClient } from "@/lib/supabase";
import { buildDocumentsStorageRef } from "@/lib/storage/supabase-object";
import { indexSourceDocument } from "@/lib/ged/index-source-document";
import { getSiteVisit } from "@/lib/site-visits/service";

export async function uploadSiteVisitMedia(opts: {
  organizationId: string;
  visitId: string;
  actorUserId: string;
  file: File;
  kind: "PHOTO" | "DOCUMENT";
  caption?: string | null;
  measurementId?: string | null;
  zone?: string | null;
  name?: string | null;
}) {
  const visit = await prisma.siteVisit.findFirst({
    where: { id: opts.visitId, organizationId: opts.organizationId },
  });
  if (!visit) throw new Error("Visite introuvable");

  if (opts.measurementId) {
    const m = await prisma.siteVisitMeasurement.findFirst({
      where: {
        id: opts.measurementId,
        visitId: visit.id,
        organizationId: opts.organizationId,
      },
      select: { id: true },
    });
    if (!m) throw new Error("Relevé introuvable");
  }

  const supabase = createServiceRoleClient();
  if (!supabase) throw new Error("Stockage non configuré");

  const bytes = Buffer.from(await opts.file.arrayBuffer());
  const safeName = (opts.name?.trim() || opts.file.name || "fichier")
    .replace(/[^\w.\-àâäéèêëïîôùûüç ]+/gi, "_")
    .slice(0, 120);
  const storagePath = `orgs/${opts.organizationId}/site-visits/${visit.id}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(storagePath, bytes, {
      contentType: opts.file.type || "application/octet-stream",
      upsert: false,
    });
  if (error) throw new Error(`Upload échoué : ${error.message}`);

  const fileUrl = buildDocumentsStorageRef(storagePath);
  const media = await prisma.siteVisitMedia.create({
    data: {
      visitId: visit.id,
      organizationId: opts.organizationId,
      measurementId: opts.measurementId || null,
      zone: opts.zone?.trim() || null,
      kind: opts.kind,
      name: safeName,
      caption: opts.caption?.trim() || null,
      fileUrl,
      mimeType: opts.file.type || null,
      fileSize: opts.file.size,
      storagePath,
      createdById: opts.actorUserId,
    },
  });

  const org = await prisma.organization.findUnique({
    where: { id: opts.organizationId },
    select: { ownerUserId: true },
  });
  const clientId = org?.ownerUserId ?? opts.actorUserId;

  try {
    const ged = await indexSourceDocument({
      projectId: visit.projectId,
      organizationId: opts.organizationId,
      clientId,
      addedById: opts.actorUserId,
      name: safeName,
      fileUrl,
      fileSize: opts.file.size,
      mimeType: opts.file.type || null,
      storagePath,
      documentType: opts.kind === "PHOTO" ? "PHOTO_VISITE" : "DOCUMENT_VISITE",
      category: "Visites & métrés",
      subcategory: visit.clientName,
      folderCode: "00",
      classificationStatus: "CLASSE",
      emitterName: visit.clientName,
      comment: [
        visit.siteAddress,
        opts.caption,
        `Visite ${visit.id}`,
      ]
        .filter(Boolean)
        .join(" — "),
      primary: {
        entityType: "site_visit_media",
        entityId: media.id,
        entityLabel: safeName,
      },
      extraLinks: [
        {
          entityType: "site_visit",
          entityId: visit.id,
          entityLabel: visit.siteName || visit.clientName,
        },
      ],
    });
    if (ged.chantierFileId) {
      await prisma.siteVisitMedia.update({
        where: { id: media.id },
        data: { chantierFileId: ged.chantierFileId },
      });
    }
  } catch (e) {
    console.error("GED visite:", e);
  }

  return getSiteVisit(opts.organizationId, visit.id);
}
