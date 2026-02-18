import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DocumentsPageClient } from "./DocumentsPageClient";

const DOCUMENTS_PER_PAGE = 20;
const CATEGORIES = ["FACTURE", "CONTRAT", "RH", "FISCAL", "AUTRE"] as const;
const STATUTS = ["EN_ATTENTE", "EN_TRAITEMENT", "TRAITE", "ARCHIVE"] as const;

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; category?: string; statut?: string; sort?: string; order?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/documents");
  if (session.user.role !== "CLIENT") redirect("/dashboard");

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const search = (params.search ?? "").trim();
  const category = params.category ?? "";
  const statut = params.statut ?? "";
  const sort = params.sort ?? "createdAt";
  const order = params.order ?? "desc";

  const where: Record<string, unknown> = { clientId: session.user.id };
  if (search) where.name = { contains: search, mode: "insensitive" };
  if (category) where.category = category;
  if (statut) where.status = statut;

  let documents: Awaited<ReturnType<typeof prisma.document.findMany>> = [];
  let total = 0;
  try {
    if (prisma.document) {
      const [docs, count] = await Promise.all([
        prisma.document.findMany({
          where,
          orderBy: { [sort]: order },
          skip: (page - 1) * DOCUMENTS_PER_PAGE,
          take: DOCUMENTS_PER_PAGE,
        }),
        prisma.document.count({ where }),
      ]);
      documents = docs;
      total = count;
    }
  } catch {
    // Table absente ou client Prisma non régénéré
  }

  const totalPages = Math.ceil(total / DOCUMENTS_PER_PAGE) || 1;

  return (
    <DocumentsPageClient
      initialDocuments={documents}
      total={total}
      page={page}
      totalPages={totalPages}
      categories={CATEGORIES}
      statuts={STATUTS}
      currentSearch={search}
      currentCategory={category}
      currentStatut={statut}
      currentSort={sort}
      currentOrder={order}
    />
  );
}
