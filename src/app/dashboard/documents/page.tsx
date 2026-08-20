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
  hubViewsForPersona,
  type HubGroup,
  type HubSort,
  type HubView,
} from "@/lib/ged/document-hub-ui";
import {
  canAccessCommercialModule,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import {
  getLibraryHubStats,
  listEquipmentResources,
  listLaborResources,
  listMaterials,
  listWorkItems,
} from "@/lib/commercial/library";
import { ensureCommercialOrgSettings } from "@/lib/commercial/settings";
import { d } from "@/lib/commercial/decimal";
import type { LibraryHubRow } from "@/components/commercial/LibraryHub";
import { DocumentsHubClient } from "./DocumentsHubClient";
import { DocumentsPageClient } from "./DocumentsPageClient";
import { OuvragesPrixUniverse } from "./OuvragesPrixUniverse";

const LEGACY_PER_PAGE = 20;
const CATEGORIES = ["FACTURE", "CONTRAT", "RH", "FISCAL", "AUTRE"] as const;
const STATUTS = ["EN_ATTENTE", "EN_TRAITEMENT", "TRAITE", "ARCHIVE"] as const;

const HUB_GROUPS = new Set<HubGroup>([
  "all",
  "devis_avenants",
  "factures_situations",
  "plans_techniques",
  "fiches_techniques",
  "commandes_bl",
  "fournisseurs",
  "comptes_rendus",
  "photos",
  "doe",
  "marche_dce",
  "securite_methodes",
  "qualite_controles",
  "autres",
]);

const HUB_SORTS = new Set<HubSort>([
  "recent",
  "oldest",
  "added",
  "name",
  "name_desc",
  "type",
  "project",
  "company",
  "origin",
]);
const HUB_VIEWS = new Set<HubView>([
  "all",
  "recent",
  "favorites",
  "missing",
  "categories",
  "classify",
]);

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
    view?: string;
    projectId?: string;
    origin?: string;
    docType?: string;
    company?: string;
    since?: string;
    legacy?: string;
    hub?: string;
    universe?: string;
    create?: string;
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

  const commercialUser = {
    id: session.user.id,
    role,
    personType: dbUser?.personType ?? session.user.personType,
    permissionProfile: dbUser?.permissionProfile ?? session.user.permissionProfile,
    isDemo: session.user.isDemo,
    demoRootUserId: session.user.demoRootUserId,
  };
  const canOuvrages = canAccessCommercialModule(commercialUser) && !external;
  const universeParam = (params.universe ?? "documents").toLowerCase();
  const universe =
    universeParam === "ouvrages" || universeParam === "prix" ? "ouvrages" : "documents";

  if (universe === "ouvrages" && canOuvrages) {
    const orgId = await resolveCommercialOrgId(commercialUser);
    if (orgId) {
      try {
        if (session.user.isDemo) {
          const { seedDemoCommercialLibrary } = await import(
            "@/lib/demo-environment/seed-library"
          );
          await seedDemoCommercialLibrary({
            organizationId: orgId,
            createdById: session.user.id,
          });
        }
      } catch (e) {
        console.error("[documents] seed library:", e);
      }

      const [activeItems, archivedItems, stats, materials, labor, equipment, settings] =
        await Promise.all([
          listWorkItems(orgId, { take: 300, active: true }),
          listWorkItems(orgId, { take: 100, active: false }),
          getLibraryHubStats(orgId),
          listMaterials(orgId, { take: 80 }),
          listLaborResources(orgId),
          listEquipmentResources(orgId),
          ensureCommercialOrgSettings(orgId),
        ]);

      const rows: LibraryHubRow[] = [...activeItems, ...archivedItems].map((w) => ({
        id: w.id,
        name: w.name,
        reference: w.reference,
        family: w.family,
        subFamily: w.subFamily,
        saleUnit: w.saleUnit,
        unitCostHt: w.unitCostHt,
        unitSellHt: w.unitSellHt,
        marginPercent: w.marginPercent,
        kind: w.kind,
        isActive: w.isActive,
        isFavorite: Boolean((w as { isFavorite?: boolean }).isFavorite),
        needsPriceRecalc: w.needsPriceRecalc,
        quoteLineCount: w.quoteLineCount,
        updatedAt: w.updatedAt,
        description: w.description,
      }));

      return (
        <OuvragesPrixUniverse
          canAccessOuvrages
          initialItems={rows}
          stats={stats}
          materialsPreview={materials.map((m) => ({
            id: m.id,
            name: m.name,
            unit: m.unit,
            family: m.family,
            currentPriceHt: m.currentPriceHt,
            supplierName: m.supplierName,
            preferredSupplierName: m.preferredSupplierName ?? m.supplierName,
            variationPercent: m.variationPercent ?? null,
            needsPriceReview: Boolean(m.needsPriceReview),
            updatedAt: m.updatedAt,
            referencePriceUpdatedAt: m.referencePriceUpdatedAt ?? null,
          }))}
          laborPreview={labor.slice(0, 80).map((l) => ({
            id: l.id,
            name: l.name,
            hourlyCostHt: l.hourlyCostHt,
            loadedCostHt: l.loadedCostHt,
          }))}
          equipmentPreview={equipment.slice(0, 80).map((e) => ({
            id: e.id,
            name: e.name,
            unit: e.unit,
            kind: e.kind,
            hourlyCostHt: e.hourlyCostHt,
            dailyCostHt: e.dailyCostHt,
          }))}
          minMarginPercent={
            settings.minMarginPercent != null ? d(settings.minMarginPercent) : null
          }
          targetMarginPercent={
            settings.targetMarginPercent != null
              ? d(settings.targetMarginPercent)
              : null
          }
        />
      );
    }
  }

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
    const viewParam = (params.view ?? "all") as HubView;
    const allowedViews = hubViewsForPersona(dbUser?.personType, dbUser?.permissionProfile);
    const view = allowedViews.some((v) => v.id === viewParam)
      ? viewParam
      : HUB_VIEWS.has(viewParam) && !external
        ? viewParam
        : "all";
    const filterProjectId = (params.projectId ?? "").trim();
    const origin = (params.origin ?? "").trim();
    const docType = (params.docType ?? "").trim();
    const company = (params.company ?? "").trim();
    const since = (params.since ?? "").trim();

    const projectWhere = await projectWhereForClientUser(session.user.id);
    const hostCompany = session.user.demoCompanyName ?? null;

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
        view,
        search,
        sort,
        projectId: filterProjectId || undefined,
        origin: origin || undefined,
        docType: docType || undefined,
        company: company || undefined,
        since: since || undefined,
      }),
      prisma.project.findMany({
        where: projectWhere,
        select: { id: true, title: true },
        orderBy: { updatedAt: "desc" },
        take: 80,
      }),
    ]);

    return (
      <DocumentsHubClient
        items={hub.items}
        total={hub.total}
        page={hub.page}
        pageSize={hub.pageSize}
        group={group}
        view={view}
        search={search}
        sort={sort}
        projectId={filterProjectId}
        origin={origin}
        docType={docType}
        company={company}
        since={since}
        views={allowedViews}
        projects={projects}
        companies={hub.companies}
        classifyCount={hub.classifyCount}
        missingCount={hub.missingCount}
        weekCount={hub.weekCount}
        totalAll={hub.totalAll}
        projectStats={hub.projectStats}
        categoryStats={hub.categoryStats}
        canUploadChantier={!external}
        canAccessOuvrages={canOuvrages}
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
