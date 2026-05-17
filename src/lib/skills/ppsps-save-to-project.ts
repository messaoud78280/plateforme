import { buildCctpPdfBuffer } from "@/lib/skills/cctp-export-pdf";
import { buildCctpWordBuffer } from "@/lib/skills/cctp-export-word";
import { canUserAccessPpspsProject } from "@/lib/skills/ppsps-projects";
import { getPpspsSessionMarkdownForExport } from "@/lib/skills/ppsps-session-service";
import type { PpspsExportFormat } from "@/lib/skills/ppsps-types";
import { createServiceRoleClient } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

const BUCKET = "documents";

export async function savePpspsSessionToProject(opts: {
  userId: string;
  role: string | null | undefined;
  sessionId: string;
  projectId: string;
  format?: PpspsExportFormat;
}): Promise<{ documentId: string; fileUrl: string; format: PpspsExportFormat }> {
  const format = opts.format === "pdf" ? "pdf" : "doc";
  const access = await canUserAccessPpspsProject(opts.userId, opts.role, opts.projectId);
  if (!access.ok || !access.clientId) {
    throw new Error("Projet introuvable ou non autorisé.");
  }

  const exportData = await getPpspsSessionMarkdownForExport(opts.userId, opts.sessionId);
  if (!exportData?.markdown.trim()) {
    throw new Error("Aucune analyse à enregistrer pour cette session.");
  }

  const siteLabel = exportData.siteName?.trim() || "chantier";
  const title = `PPSPS — ${siteLabel}`;
  const ext = format === "pdf" ? "pdf" : "doc";
  const fileName = `ppsps-${siteLabel.replace(/\s+/g, "-").slice(0, 40)}-${opts.sessionId.slice(-6)}.${ext}`;

  const buffer =
    format === "pdf"
      ? buildCctpPdfBuffer({
          title,
          markdown: exportData.markdown,
          lot: exportData.siteAddress ?? undefined,
        })
      : buildCctpWordBuffer(exportData.markdown, title);

  const mimeType = format === "pdf" ? "application/pdf" : "application/msword";

  const supabase = createServiceRoleClient();
  if (!supabase) {
    throw new Error("Stockage non configuré — impossible d'enregistrer dans le dossier.");
  }

  const storagePath = `projects/${opts.projectId}/ppsps/${Date.now()}-${fileName}`;
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: mimeType,
    upsert: false,
  });
  if (uploadError) {
    throw new Error(`Échec upload : ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const doc = await prisma.document.create({
    data: {
      name: `${title} (${format.toUpperCase()})`,
      category: "AUTRE",
      fileUrl: urlData.publicUrl,
      fileSize: buffer.length,
      mimeType,
      status: "TRAITE",
      clientId: access.clientId,
      projectId: opts.projectId,
    },
    select: { id: true },
  });

  await prisma.skillPpspsSession.updateMany({
    where: { id: opts.sessionId, userId: opts.userId },
    data: {
      projectId: opts.projectId,
      linkedDocumentId: doc.id,
      updatedAt: new Date(),
    },
  });

  return { documentId: doc.id, fileUrl: urlData.publicUrl, format };
}
