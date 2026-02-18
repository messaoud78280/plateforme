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
  const sort = searchParams.get("sort") ?? "createdAt";
  const order = searchParams.get("order") ?? "desc";

  const where: Record<string, unknown> = { clientId: session.user.id };
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (category) {
    where.category = category;
  }
  if (status) {
    where.status = status;
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
