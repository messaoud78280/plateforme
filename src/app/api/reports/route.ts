import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAgencyOrManager } from "@/lib/authz";

// GET /api/reports?projectId=xxx — liste des rapports du projet
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim();
  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const isAgence = isAgencyOrManager(session.user);
  const canAccess = isAgence || project.clientId === session.user.id;
  if (!canAccess) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const reports = await prisma.report.findMany({
    where: { projectId },
    include: {
      author: { select: { id: true, name: true } },
      attachments: true,
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { periodStart: "desc" },
  });

  return NextResponse.json(reports);
}

// POST /api/reports — créer un rapport
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: {
    projectId?: string;
    reportType?: "JOURNALIER" | "HEBDOMADAIRE";
    periodStart?: string;
    periodEnd?: string;
    content?: string;
    attachments?: { name: string; fileUrl: string; fileSize: number; mimeType?: string | null }[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const projectId = body.projectId?.trim();
  const reportType = body.reportType === "JOURNALIER" ? "JOURNALIER" : "HEBDOMADAIRE";
  const periodStart = body.periodStart ? new Date(body.periodStart) : null;
  const periodEnd = body.periodEnd ? new Date(body.periodEnd) : null;
  const content = body.content?.trim() ?? "";
  const attachments = Array.isArray(body.attachments) ? body.attachments : [];

  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }
  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: "periodStart et periodEnd requis" }, { status: 400 });
  }
  if (!content) {
    return NextResponse.json({ error: "content requis" }, { status: 400 });
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { clientId: session.user.id },
        ...(isAgencyOrManager(session.user) ? [{}] : []),
      ],
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Projet introuvable ou non autorisé" }, { status: 404 });
  }

  const isAgence = isAgencyOrManager(session.user);
  const canAccess = isAgence || project.clientId === session.user.id;
  if (!canAccess) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const report = await prisma.report.create({
    data: {
      projectId,
      authorId: session.user.id,
      reportType,
      periodStart,
      periodEnd,
      content,
      attachments: {
        create: attachments
          .filter((a) => a.name && a.fileUrl && typeof a.fileSize === "number")
          .map((a) => ({
            name: a.name,
            fileUrl: a.fileUrl,
            fileSize: a.fileSize,
            mimeType: a.mimeType ?? null,
          })),
      },
    },
    include: {
      author: { select: { id: true, name: true } },
      attachments: true,
      comments: true,
    },
  });

  return NextResponse.json(report);
}
