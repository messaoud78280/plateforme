import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAgencyOrManager } from "@/lib/authz";

// POST /api/reports/[id]/comments — ajouter un commentaire
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id: reportId } = await params;

  let body: { content?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const content = body.content?.trim() ?? "";
  if (!content) {
    return NextResponse.json({ error: "content requis" }, { status: 400 });
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { project: true },
  });

  if (!report) {
    return NextResponse.json({ error: "Rapport introuvable" }, { status: 404 });
  }

  const isAgence = isAgencyOrManager(session.user);
  const canAccess = isAgence || report.project.clientId === session.user.id;
  if (!canAccess) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const comment = await prisma.reportComment.create({
    data: {
      reportId,
      userId: session.user.id,
      content,
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(comment);
}
