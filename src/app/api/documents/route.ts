import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DOCUMENTS_PER_PAGE = 20;

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Réservé aux clients" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const status = searchParams.get("status") ?? "";
  const projectId = searchParams.get("projectId") ?? "";
  const sort = searchParams.get("sort") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  const { projectWhereForClientUser, canClientAccessProject } = await import(
    "@/lib/organization/access"
  );
  const { userHasProjectScope } = await import("@/lib/equipe-acces/project-access");

  // Owner legacy : ses docs ; membre/externe : docs des chantiers accessibles avec scope documents
  const projectWhere = await projectWhereForClientUser(session.user.id);
  const accessibleProjects = await prisma.project.findMany({
    where: projectWhere,
    select: { id: true, clientId: true, organizationId: true },
    take: 200,
  });
  const docProjectIds: string[] = [];
  for (const p of accessibleProjects) {
    if (await userHasProjectScope(session.user.id, p, "documents")) {
      docProjectIds.push(p.id);
    }
  }

  const where: Record<string, unknown> = {
    OR: [
      { clientId: session.user.id },
      ...(docProjectIds.length ? [{ projectId: { in: docProjectIds } }] : []),
    ],
  };
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (category) {
    where.category = category;
  }
  if (status) {
    where.status = status;
  }
  if (projectId) {
    const project = accessibleProjects.find((p) => p.id === projectId);
    if (!project || !(await canClientAccessProject(session.user.id, project))) {
      return NextResponse.json({ error: "Chantier inaccessible" }, { status: 403 });
    }
    if (!(await userHasProjectScope(session.user.id, project, "documents"))) {
      return NextResponse.json({ error: "Documents non autorisés sur ce chantier" }, { status: 403 });
    }
    where.projectId = projectId;
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * DOCUMENTS_PER_PAGE,
      take: DOCUMENTS_PER_PAGE,
    }),
    prisma.document.count({ where }),
  ]);

  return NextResponse.json({
    documents,
    total,
    page,
    totalPages: Math.ceil(total / DOCUMENTS_PER_PAGE),
  });
}
