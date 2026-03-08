import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@/lib/supabase";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB (vidéos)
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/svg+xml",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "text/plain",
  "video/mp4",
  "video/webm",
  "video/quicktime",
];

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

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Stockage non configuré (NEXT_PUBLIC_SUPABASE_URL et ANON_KEY)" },
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
  let taskForAlert: { clientId: string; projectId: string | null } | null = null;

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
      select: { clientId: true, projectId: true },
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

  const bucket = "documents";
  const clientId = clientIdForDoc;
  const created: { id: string; name: string }[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!(file instanceof File) || !file.size) continue;
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name} : taille max 10 MB`);
      continue;
    }
    const mime = file.type || "application/octet-stream";
    const allowedExt = /\.(pdf|jpg|jpeg|png|gif|webp|bmp|svg|docx|xlsx|xls|csv|txt|mp4|webm|mov)$/i;
    if (!ALLOWED_TYPES.includes(mime) && !file.name.match(allowedExt)) {
      errors.push(`${file.name} : type non accepté (PDF, images, Excel, CSV, DOCX, vidéos)`);
      continue;
    }

    const storagePath = `${clientId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
      contentType: mime,
      upsert: false,
    });

    if (uploadError) {
      errors.push(`${file.name} : ${uploadError.message}`);
      continue;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);
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

  return NextResponse.json({ created, errors });
}
