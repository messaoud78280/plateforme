import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { projectWhereForClientUser } from "@/lib/organization/access";
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";
import { isInternalPurchaseOrderActor } from "@/lib/purchase-orders/access";
import { loadDocumentHub } from "@/lib/ged/document-hub";
import {
  hubGroupsForPersona,
  type HubGroup,
  type HubSort,
} from "@/lib/ged/document-hub-ui";
import { DocumentsHubClient } from "./DocumentsHubClient";
import { DocumentsPageClient } from "./DocumentsPageClient";

const LEGACY_PER_PAGE = 20;
const CATEGORIES = ["FACTURE", "CONTRAT", "RH", "FISCAL", "AUTRE"] as const;
const STATUTS = ["EN_ATTENTE", "EN_TRAITEMENT", "TRAITE", "ARCHIVE"] as const;

const HUB_GROUPS = new Set<HubGroup>([
  "all",
  "chantiers",
  "administratif",
  "commandes",
  "fournisseurs",
  "doe",
  "photos",
]);

const HUB_SORTS = new Set<HubSort>(["recent", "oldest", "name", "type"]);

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    q?: string;
    category?: string;
    statut?: string;
    sort?: string;
    order?: string;
    group?: string;
    legacy?: string;
    hub?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/documents");

  const params = await searchParams;
  const role = session.user.role ?? "CLIENT";
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { personType: true, permissionProfile: true, name: true, company: true },
  });

  const external = isExternalPortalUser(dbUser?.personType);
  const internal = isInternalPurchaseOrderActor({
    id: session.user.id,
    role,
    personType: dbUser?.personType,
    permissionProfile: dbUser?.permissionProfile,
  });

  const useHub =
    params.hub !== "0" &&
    (internal || external || role === "AGENT" || role === "AGENCE" || role === "MANAGER");

  if (useHub) {
    const allowedGroups = hubGroupsForPersona(
      dbUser?.personType,
      dbUser?.permissionProfile,
    );
    const groupParam = (params.group ?? "all") as HubGroup;
    const group = allowedGroups.some((g) => g.id === groupParam)
      ? groupParam
      : HUB_GROUPS.has(groupParam) && !external
        ? groupParam
        : "all";
    const search = (params.q ?? params.search ?? "").trim();
    const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
    const sortParam = (params.sort ?? "recent") as HubSort;
    const sort = HUB_SORTS.has(sortParam) ? sortParam : "recent";

    const projectWhere = await projectWhereForClientUser(session.user.id);
    const hostCompany =
      session.user.demoCompanyName ??
      (external ? "ABC Étanchéité" : null);

    const [hub, projects] = await Promise.all([
      loadDocumentHub({
        user: {
          id: session.user.id,
          role,
          personType: dbUser?.personType ?? null,
          permissionProfile: dbUser?.permissionProfile ?? null,
          name: dbUser?.name ?? session.user.name ?? null,
        },
        page,
        group,
        search,
        sort,
      }),
      prisma.project.findMany({
        where: projectWhere,
        select: { id: true, title: true },
        orderBy: { updatedAt: "desc" },
        take: 12,
      }),
    ]);

    return (
      <DocumentsHubClient
        items={hub.items}
        total={hub.total}
        page={hub.page}
        pageSize={hub.pageSize}
        group={group}
        search={search}
        sort={sort}
        groups={hub.groups}
        projects={projects}
        canUploadChantier={!external}
        personType={dbUser?.personType}
        permissionProfile={dbUser?.permissionProfile}
        hostCompany={hostCompany}
      />
    );
  }

  const isClient = role === "CLIENT";
  const isAgent = role === "AGENT";
  const isAgence = role === "AGENCE" || role === "MANAGER";

  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const search = (params.search ?? "").trim();
  const category = params.category ?? "";
  const statut = params.statut ?? "";
  const sort = params.sort ?? "createdAt";
  const order = params.order ?? "desc";

  let where: Record<string, unknown>;
  if (isClient) {
    where = { clientId: session.user.id };
  } else if (isAgent) {
    where = { task: { assignedToId: session.user.id } };
  } else if (isAgence) {
    where = {};
  } else {
    redirect("/dashboard");
  }

  if (search) where.name = { contains: search, mode: "insensitive" };
  if (category) where.category = category;
  if (statut) where.status = statut;

  let documents: Awaited<ReturnType<typeof prisma.document.findMany>> = [];
  let total = 0;
  let assignedTasks: { id: string; title: string }[] = [];

  try {
    if (isAgent) {
      assignedTasks = await prisma.task.findMany({
        where: { assignedToId: session.user.id },
        select: { id: true, title: true },
        orderBy: { title: "asc" },
        take: 100,
      });
    }
    const [docs, count] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { [sort]: order },
        skip: (page - 1) * LEGACY_PER_PAGE,
        take: LEGACY_PER_PAGE,
      }),
      prisma.document.count({ where }),
    ]);
    documents = docs;
    total = count;
  } catch {
    /* table absente */
  }

  const totalPages = Math.ceil(total / LEGACY_PER_PAGE) || 1;

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
      userRole={role}
      assignedTasks={assignedTasks}
    />
  );
}
