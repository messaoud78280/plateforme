import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { listChantierShareRecipients } from "@/lib/chantier-dossier/share-recipients";
import { createNotification } from "@/lib/notifications";
import { createServiceRoleClient } from "@/lib/supabase";
import { absoluteUrl } from "@/lib/site";
import {
  DOCUMENTS_BUCKET,
  downloadStorageObject,
  extractStoragePathFromUrl,
} from "@/lib/storage/supabase-object";
import { isBeworkStaff } from "@/lib/authz";

const DM_MAX_BYTES = 10 * 1024 * 1024;

function safeStorageName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/** POST — Transférer un document chantier via messagerie (projet ou message direct). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id: fileId } = await params;
  const file = await prisma.chantierFile.findUnique({
    where: { id: fileId },
    select: {
      id: true,
      projectId: true,
      name: true,
      fileUrl: true,
      fileSize: true,
      mimeType: true,
      project: { select: { title: true, clientId: true } },
    },
  });

  if (!file?.fileUrl) {
    return NextResponse.json({ error: "Fichier introuvable ou pièce non déposée" }, { status: 404 });
  }

  const access = await canAccessChantierProject(session.user, file.projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  let body: { recipientId?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const recipientId = String(body.recipientId ?? "").trim();
  const userMessage = String(body.message ?? "").trim();
  if (!recipientId) {
    return NextResponse.json({ error: "Destinataire requis" }, { status: 400 });
  }

  const allowed = await listChantierShareRecipients(
    file.projectId,
    session.user.id,
    session.user.role
  );
  const recipient = allowed.find((r) => r.id === recipientId);
  if (!recipient) {
    return NextResponse.json({ error: "Destinataire non autorisé pour ce chantier" }, { status: 400 });
  }

  const downloadLink = absoluteUrl(
    `/api/chantier/files/${fileId}/preview?download=original`
  );
  const dossierLink = absoluteUrl(`/dashboard/projets/${file.projectId}#dossier-chantier`);
  const senderName = session.user.name ?? "Un utilisateur";

  if (recipient.channel === "project") {
    const contentParts = [
      userMessage,
      `📎 Document chantier partagé : « ${file.name} »`,
      `Télécharger : ${downloadLink}`,
      `Voir le classeur : ${dossierLink}`,
    ].filter(Boolean);
    const content = contentParts.join("\n\n");

    const message = await prisma.message.create({
      data: {
        content,
        projectId: file.projectId,
        senderId: session.user.id,
        receiverId: recipient.id,
      },
    });

    await createNotification({
      userId: recipient.id,
      type: "MESSAGE_RECEIVED",
      title: "Document chantier partagé",
      message: `${senderName} vous a transféré « ${file.name} » sur le chantier « ${file.project.title} ».`,
      actionUrl: `/dashboard/messagerie?project=${file.projectId}`,
    });

    return NextResponse.json({
      ok: true,
      channel: "project",
      messageId: message.id,
      messagerieUrl: `/dashboard/messagerie?project=${file.projectId}`,
    });
  }

  const isStaff = isBeworkStaff(session.user);
  if (!isStaff) {
    return NextResponse.json({ error: "Messagerie directe réservée à l’équipe" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Stockage non configuré" }, { status: 503 });
  }

  const attachments: { name: string; fileUrl: string; fileSize: number; mimeType?: string }[] = [];
  const size = file.fileSize ?? 0;

  if (size > 0 && size <= DM_MAX_BYTES) {
    const sourcePath = extractStoragePathFromUrl(file.fileUrl, DOCUMENTS_BUCKET);
    if (sourcePath) {
      const downloaded = await downloadStorageObject(supabase, DOCUMENTS_BUCKET, sourcePath);
      if (downloaded) {
        const buf = Buffer.from(await downloaded.blob.arrayBuffer());
        const destPath = `dm/${session.user.id}/${Date.now()}-${safeStorageName(file.name)}`;
        const mime = file.mimeType || downloaded.contentType || "application/octet-stream";
        const { error: upErr } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(destPath, buf, {
          contentType: mime,
          upsert: false,
        });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(destPath);
          attachments.push({
            name: file.name,
            fileUrl: urlData.publicUrl,
            fileSize: buf.length,
            mimeType: mime,
          });
        }
      }
    }
  }

  const contentParts = [
    userMessage,
    attachments.length === 0
      ? `📎 Document chantier : « ${file.name} » (fichier volumineux — lien)\n${downloadLink}`
      : `📎 Document chantier : « ${file.name} »`,
    `Classeur : ${dossierLink}`,
  ].filter(Boolean);

  const direct = await prisma.directMessage.create({
    data: {
      senderId: session.user.id,
      receiverId: recipient.id,
      content: contentParts.join("\n\n"),
      attachmentsJson: attachments.length > 0 ? attachments : undefined,
    },
  });

  await createNotification({
    userId: recipient.id,
    type: "MESSAGE_RECEIVED",
    title: "Document chantier transféré",
    message: `${senderName} vous a envoyé « ${file.name} » en message direct.`,
    actionUrl: "/dashboard/messagerie?tab=envoyer",
  });

  return NextResponse.json({
    ok: true,
    channel: "direct",
    messageId: direct.id,
    messagerieUrl: "/dashboard/messagerie?tab=envoyer",
    attachmentIncluded: attachments.length > 0,
  });
}
