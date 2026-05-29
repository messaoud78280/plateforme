import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyManagers } from "@/lib/notifications";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  MISSION_DOCUMENT_MAX_BYTES,
  missionDocumentRejectReason,
} from "@/lib/storage/document-upload-policy";
import { DOCUMENTS_BUCKET } from "@/lib/storage/supabase-object";

const CATEGORY_MAP: Record<string, "FACTURE" | "CONTRAT" | "RH" | "FISCAL" | "AUTRE"> = {
  FACTURE: "FACTURE",
  CONTRAT: "CONTRAT",
  RH: "RH",
  FISCAL: "FISCAL",
  AUTRE: "AUTRE",
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const role = session.user.role ?? "CLIENT";
  const isClient = role === "CLIENT";
  const isAgent = role === "AGENT";
  if (!isClient && !isAgent) {
    return NextResponse.json({ error: "Réservé aux clients et aux agents" }, { status: 403 });
  }

  const supabase = createServiceRoleClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Stockage non configuré (service role)" },
      { status: 503 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Données formulaire invalides" }, { status: 400 });
  }

  const category = CATEGORY_MAP[String(formData.get("category") ?? "AUTRE")] ?? "AUTRE";
  const projectIdRaw = formData.get("projectId") as string | null;
  const projectIdTrimmed = projectIdRaw?.trim() || null;
  const taskIdRaw = formData.get("taskId") as string | null;
  const taskIdTrimmed = taskIdRaw?.trim() || null;

  let clientIdForDoc: string = session.user.id;
  let projectIdForDoc: string | null = projectIdTrimmed;
  let taskForAlert: { clientId: string; projectId: string | null; title?: string } | null = null;

  if (projectIdTrimmed) {
    const project = await prisma.project.findFirst({
      where: { id: projectIdTrimmed, clientId: session.user.id },
    });
    if (!project) {
      return NextResponse.json({ error: "Projet introuvable ou non autorisé" }, { status: 400 });
    }
  }

  if (taskIdTrimmed) {
    const task = await prisma.task.findFirst({
      where: isClient
        ? { id: taskIdTrimmed, clientId: session.user.id }
        : { id: taskIdTrimmed, assignedToId: session.user.id },
      select: { clientId: true, projectId: true, title: true },
    });
    if (!task) {
      return NextResponse.json({ error: "Tâche introuvable ou non autorisée" }, { status: 400 });
    }
    if (isAgent) {
      clientIdForDoc = task.clientId;
      projectIdForDoc = task.projectId;
    }
    taskForAlert = task;
  }

  if (isAgent && !taskIdTrimmed) {
    return NextResponse.json(
      { error: "En tant qu'agent, vous devez associer le document à une mission." },
      { status: 400 }
    );
  }

  const files = formData.getAll("files") as File[];

  if (!files?.length) {
    return NextResponse.json({ error: "Aucun fichier envoyé" }, { status: 400 });
  }

  const clientId = clientIdForDoc;
  const created: { id: string; name: string }[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!(file instanceof File) || !file.size) continue;
    if (file.size > MISSION_DOCUMENT_MAX_BYTES) {
      errors.push(`${file.name} : taille max 100 Mo`);
      continue;
    }
    const rejectReason = missionDocumentRejectReason(file);
    if (rejectReason) {
      errors.push(rejectReason);
      continue;
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${clientId}/${Date.now()}-${safeName}`;
    const mime = file.type || "application/octet-stream";

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(storagePath, buffer, {
      contentType: mime,
      upsert: false,
    });

    if (uploadError) {
      console.error("Upload document mission:", {
        message: uploadError.message,
        storagePath,
        mimeType: mime,
        fileSize: file.size,
      });
      errors.push(`${file.name} : échec de l'envoi (${uploadError.message})`);
      continue;
    }

    const { data: urlData } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(storagePath);
    const fileUrl = urlData.publicUrl;

    const doc = await prisma.document.create({
      data: {
        name: file.name,
        category,
        fileUrl,
        fileSize: file.size,
        mimeType: mime,
        status: "EN_ATTENTE",
        clientId,
        projectId: projectIdForDoc || undefined,
        taskId: taskIdTrimmed || undefined,
      },
    });
    created.push({ id: doc.id, name: doc.name });

    if (taskIdTrimmed && taskForAlert?.clientId) {
      try {
        await prisma.alert.create({
          data: {
            title: "Document ajouté à votre demande",
            message: `Un document "${file.name}" a été ajouté à l'une de vos demandes.`,
            clientId: taskForAlert.clientId,
            actionUrl: `/dashboard/taches/${taskIdTrimmed}#documents`,
          },
        });
      } catch {
        // ignore si table Alert absente
      }
    }
  }

  if (isClient && taskIdTrimmed && created.length > 0) {
    const taskTitle = taskForAlert?.title ?? "une mission";
    await notifyManagers({
      type: "NEW_TASK",
      title: "Pièces jointes reçues",
      message: `${created.length} document(s) joint(s) à la mission « ${taskTitle} ».`,
      actionUrl: `/dashboard/missions?task=${taskIdTrimmed}`,
    });
  }

  if (created.length === 0 && errors.length > 0) {
    return NextResponse.json(
      { error: errors.join(" "), created, errors },
      { status: 400 }
    );
  }

  return NextResponse.json({ created, errors });
}
