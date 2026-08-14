/**
 * GED-V2A — Hub documentaire (lecture unifiée, sans migration).
 * Source principale : ChantierFile
 * Compléments : PurchaseOrderDocument orphelin, Document legacy non synchronisé.
 */
import { prisma } from "@/lib/prisma";
import { projectWhereForClientUser, getUserOrganizationIds } from "@/lib/organization/access";
import {
  canListPurchaseOrders,
  isInternalPurchaseOrderActor,
  isSupplierPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
  type PurchaseOrderSessionUser,
} from "@/lib/purchase-orders/access";
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";
import { withPerfLog } from "@/lib/perf/server-timing";
import {
  DOC_TYPE_ALIASES,
  documentTypeMatches,
  hubGroupsForPersona,
  originActionLabel,
  type HubDocumentItem,
  type HubGroup,
  type HubSort,
  type HubView,
} from "@/lib/ged/document-hub-ui";
import {
  displayGedTypeLabel,
  isExpectedMissingDocument,
  stripMissingTitleSuffix,
} from "@/lib/ged/classify-document";
import { originFromLinks, originHref, type GedLinkLite } from "@/lib/ged/origin";

export type { HubGroup, HubSort, HubView, HubDocumentItem } from "@/lib/ged/document-hub-ui";
export { hubGroupsForPersona, hubEmptyCopy, hubViewsForPersona } from "@/lib/ged/document-hub-ui";

export type HubListResult = {
  items: HubDocumentItem[];
  total: number;
  page: number;
  pageSize: number;
  groups: { id: HubGroup; label: string; count?: number }[];
  classifyCount: number;
  missingCount: number;
  companies: string[];
};

const PAGE_SIZE = 50;

function inferGroup(opts: {
  category?: string | null;
  documentType?: string | null;
  folderCode?: string | null;
  name?: string | null;
  poKind?: string | null;
}): HubGroup {
  const blob = `${opts.category ?? ""} ${opts.documentType ?? ""} ${opts.name ?? ""} ${opts.poKind ?? ""}`.toLowerCase();
  const code = opts.folderCode ?? "";
  if (code === "11" || /doe/.test(blob)) return "doe";
  if (code === "07" || opts.category === "Photos" || /\.(jpe?g|png|webp|heic)$/i.test(opts.name ?? "")) {
    return "photos";
  }
  if (code === "05" || /fournisseur|bl\b|bon de livraison|facture/.test(blob) || opts.poKind === "BL") {
    return "fournisseurs";
  }
  if (opts.poKind || /commande|bc-|confirmation/.test(blob)) return "commandes";
  if (code === "12" || code === "02" || /marché|contrat|administratif|cctp|ccap|rh|fiscal/.test(blob)) {
    return "administratif";
  }
  return "chantiers";
}

function typeLabel(opts: {
  documentType?: string | null;
  category?: string | null;
  poKind?: string | null;
  name?: string | null;
  missing?: boolean;
}): string {
  if (opts.missing) return "À récupérer";
  if (opts.poKind === "BL" || opts.documentType === "BL" || opts.documentType === "BON_LIVRAISON") {
    return displayGedTypeLabel("BON_LIVRAISON");
  }
  if (opts.poKind === "BC" || opts.documentType === "BC" || opts.documentType === "BON_COMMANDE") {
    return displayGedTypeLabel("BON_COMMANDE");
  }
  if (opts.documentType) return displayGedTypeLabel(opts.documentType);
  if (opts.category === "Photos") return displayGedTypeLabel("PHOTO");
  if (opts.category === "Plans") return displayGedTypeLabel("PLAN");
  if (opts.category === "DOE") return displayGedTypeLabel("DOE");
  if (opts.category === "Fournisseurs") return "Fournisseur";
  if (opts.category === "Marché") return "Marché";
  if (/\.pdf$/i.test(opts.name ?? "")) return "PDF";
  return displayGedTypeLabel(opts.category) || "Document";
}

function visibilityShort(v: string | null | undefined): string {
  const s = (v ?? "").toLowerCase();
  if (s.includes("point.p") || (s.includes("fournisseur") && s.includes("partag"))) {
    return "Partagé fournisseur";
  }
  if (s.includes("partage") && s.includes("client")) return "Partagé client";
  if (s.includes("intervenant")) return "Partagé intervenants";
  if (s.includes("partage") || s.includes("temporaire")) return "Partagé";
  if (s.includes("interne")) return "Interne";
  return v?.trim() || "Interne";
}

export async function loadDocumentHub(opts: {
  user: PurchaseOrderSessionUser & { name?: string | null };
  page?: number;
  group?: HubGroup;
  view?: HubView;
  search?: string;
  projectId?: string;
  origin?: string;
  sort?: HubSort;
  docType?: string;
  company?: string;
  since?: string;
}): Promise<HubListResult> {
  return withPerfLog("loadDocumentHub", async () => {
    const page = Math.max(1, opts.page ?? 1);
    const group = opts.group ?? "all";
    const view = opts.view ?? "all";
    const search = (opts.search ?? "").trim();
    const originFilter = (opts.origin ?? "").trim().toUpperCase();
    const sort = opts.sort ?? "recent";
    const docType = (opts.docType ?? "").trim().toUpperCase();
    const company = (opts.company ?? "").trim();
    const since = (opts.since ?? "").trim();
    const external = isExternalPortalUser(opts.user.personType);
    const internal = isInternalPurchaseOrderActor(opts.user);
    const isSupplier =
      opts.user.personType === "SUPPLIER" || opts.user.permissionProfile === "FOURNISSEUR";
    const projectWhere = await projectWhereForClientUser(opts.user.id);
    const userOrgIds = await getUserOrganizationIds(opts.user.id);
    const orgId = await resolvePurchaseOrderOrgId(opts.user);

    let supplierExtOrgId: string | null = null;
    let supplierOrderIds: string[] = [];
    if (external && isSupplier) {
      const u = await prisma.user.findUnique({
        where: { id: opts.user.id },
        select: { externalOrganizationId: true },
      });
      supplierExtOrgId = u?.externalOrganizationId ?? null;
      if (supplierExtOrgId) {
        supplierOrderIds = (
          await prisma.purchaseOrder.findMany({
            where: { externalOrganizationId: supplierExtOrgId },
            select: { id: true },
            take: 120,
          })
        ).map((o) => o.id);
      }
    }

    const externalVisibilityFilter =
      external && isSupplier
        ? {
            OR: [
              { visibility: { contains: "intervenant", mode: "insensitive" as const } },
              { visibility: { contains: "temporaire", mode: "insensitive" as const } },
              ...(supplierExtOrgId
                ? [
                    {
                      links: {
                        some: {
                          entityType: "supplier",
                          entityId: supplierExtOrgId,
                        },
                      },
                    },
                  ]
                : []),
              ...(supplierOrderIds.length > 0
                ? [
                    {
                      links: {
                        some: {
                          entityType: "purchase_order",
                          entityId: { in: supplierOrderIds },
                        },
                      },
                    },
                  ]
                : []),
            ],
          }
        : external
          ? {
              OR: [
                {
                  visibility: {
                    in: [
                      "BeWork et entreprise cliente",
                      "Intervenants autorisés",
                      "Partage temporaire",
                      "PARTAGE",
                      "PARTAGÉ",
                    ],
                  },
                },
                { visibility: { contains: "Partage", mode: "insensitive" as const } },
                { visibility: { contains: "client", mode: "insensitive" as const } },
              ],
            }
          : null;

    const searchTokens = search
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2)
      .slice(0, 6);

    const searchAnd =
      searchTokens.length === 0
        ? []
        : searchTokens.map((token) => ({
            OR: [
              { name: { contains: token, mode: "insensitive" as const } },
              { documentType: { contains: token, mode: "insensitive" as const } },
              { category: { contains: token, mode: "insensitive" as const } },
              { emitterName: { contains: token, mode: "insensitive" as const } },
              { tags: { contains: token, mode: "insensitive" as const } },
              { indice: { contains: token, mode: "insensitive" as const } },
              { versionLabel: { contains: token, mode: "insensitive" as const } },
              { project: { title: { contains: token, mode: "insensitive" as const } } },
              {
                links: {
                  some: { entityLabel: { contains: token, mode: "insensitive" as const } },
                },
              },
              {
                folder: { label: { contains: token, mode: "insensitive" as const } },
              },
            ],
          }));

    const viewAnd: object[] = [];
    if (view === "favorites") {
      viewAnd.push({ favorites: { some: { userId: opts.user.id } } });
    }
    if (view === "missing") {
      viewAnd.push({
        OR: [
          { status: { in: ["MANQUANT", "A_RELANCER"] } },
          { name: { contains: "(manquante)", mode: "insensitive" as const } },
          { fileUrl: null },
          { fileUrl: "" },
        ],
      });
    }
    if (view === "classify") {
      viewAnd.push({
        OR: [{ classificationStatus: "A_CLASSER" }, { folder: { code: "00" } }],
      });
    }
    if (view === "recent") {
      const recentSince = new Date();
      recentSince.setDate(recentSince.getDate() - 30);
      // Date du document si connue, sinon date d’arrivée dans BeWork.
      viewAnd.push({
        OR: [
          { documentDate: { gte: recentSince } },
          { AND: [{ documentDate: null }, { createdAt: { gte: recentSince } }] },
        ],
      });
    }
    if (docType) {
      const aliases = DOC_TYPE_ALIASES[docType] ?? [docType];
      viewAnd.push({
        OR: [
          { documentType: { in: aliases } },
          { documentType: { equals: docType, mode: "insensitive" as const } },
        ],
      });
    }
    if (company) {
      viewAnd.push({
        OR: [
          { emitterName: { contains: company, mode: "insensitive" as const } },
          {
            links: {
              some: { entityLabel: { contains: company, mode: "insensitive" as const } },
            },
          },
        ],
      });
    }
    if (since === "30" || since === "year") {
      const from =
        since === "year"
          ? new Date(new Date().getFullYear(), 0, 1)
          : (() => {
              const d = new Date();
              d.setDate(d.getDate() - 30);
              return d;
            })();
      viewAnd.push({
        OR: [
          { documentDate: { gte: from } },
          { AND: [{ documentDate: null }, { createdAt: { gte: from } }] },
        ],
      });
    }

    const scopeWhere = opts.projectId
      ? { projectId: opts.projectId, project: { is: { AND: [projectWhere] } } }
      : {
          OR: [
            { project: projectWhere },
            userOrgIds.length > 0
              ? { projectId: null, organizationId: { in: userOrgIds } }
              : { projectId: null, clientId: opts.user.id },
          ],
        };

    const chantierWhere = {
      deletedAt: null,
      archivedAt: null,
      ...(view === "missing" ? {} : { isCurrentVersion: true }),
      AND: [
        scopeWhere,
        ...(externalVisibilityFilter ? [externalVisibilityFilter] : []),
        ...searchAnd,
        ...viewAnd,
      ],
    };

    const orderBy =
      sort === "oldest"
        ? [
            { documentDate: { sort: "asc" as const, nulls: "last" as const } },
            { createdAt: "asc" as const },
          ]
        : sort === "name"
          ? { name: "asc" as const }
          : sort === "type"
            ? { documentType: "asc" as const }
            : [
                { documentDate: { sort: "desc" as const, nulls: "last" as const } },
                { createdAt: "desc" as const },
              ];

    const baseScope = {
      deletedAt: null,
      archivedAt: null,
      isCurrentVersion: true,
      AND: [scopeWhere, ...(externalVisibilityFilter ? [externalVisibilityFilter] : [])],
    };

    const [chantierFiles, chantierTotal] = await Promise.all([
      prisma.chantierFile.findMany({
        where: chantierWhere,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          name: true,
          documentType: true,
          category: true,
          visibility: true,
          createdAt: true,
          documentDate: true,
          mimeType: true,
          fileUrl: true,
          isCurrentVersion: true,
          projectId: true,
          project: { select: { title: true } },
          folder: { select: { code: true, label: true } },
          addedBy: { select: { name: true } },
          sourceDocumentId: true,
          status: true,
          classificationStatus: true,
          indice: true,
          versionLabel: true,
          emitterName: true,
          favorites: {
            where: { userId: opts.user.id },
            select: { id: true },
            take: 1,
          },
          links: {
            take: 8,
            select: { entityType: true, entityLabel: true, entityId: true },
          },
        },
      }),
      prisma.chantierFile.count({ where: chantierWhere }),
    ]);

    const [classifyCount, missingCount, companyRows] = await Promise.all([
      prisma.chantierFile.count({
        where: {
          ...baseScope,
          OR: [{ classificationStatus: "A_CLASSER" }, { folder: { code: "00" } }],
        },
      }),
      prisma.chantierFile.count({
        where: {
          ...baseScope,
          OR: [
            { status: { in: ["MANQUANT", "A_RELANCER"] } },
            { name: { contains: "(manquante)", mode: "insensitive" as const } },
            { fileUrl: null },
            { fileUrl: "" },
          ],
        },
      }),
      prisma.chantierFile.findMany({
        where: { ...baseScope, emitterName: { not: null } },
        select: { emitterName: true },
        distinct: ["emitterName"],
        take: 40,
      }),
    ]);

    const items: HubDocumentItem[] = chantierFiles.map((f) => {
      const g = inferGroup({
        category: f.category,
        documentType: f.documentType,
        folderCode: f.folder?.code,
        name: f.name,
      });
      const poLink = f.links.find((l) => l.entityType === "purchase_order");
      const supplierLink = f.links.find((l) => l.entityType === "supplier");
      const origin = originFromLinks({
        links: f.links as GedLinkLite[],
        folderCode: f.folder?.code,
        sourceDocumentId: f.sourceDocumentId,
      });
      const oHref = originHref({
        origin: origin.origin,
        links: f.links as GedLinkLite[],
        projectId: f.projectId,
      });
      const missing = isExpectedMissingDocument({
        status: f.status,
        name: f.name,
        fileUrl: f.fileUrl,
      });
      const displayDate = f.documentDate ?? f.createdAt;
      const context =
        origin.refLabel ||
        poLink?.entityLabel ||
        supplierLink?.entityLabel ||
        null;
      const chantierHref = f.projectId
        ? `/dashboard/projets/${f.projectId}#tab-documents`
        : oHref || `/dashboard/documents?q=${encodeURIComponent(f.name)}`;
      const href =
        isSupplier || external
          ? poLink?.entityId
            ? `/dashboard/commandes/${poLink.entityId}?focus=documents`
            : `/dashboard/documents?q=${encodeURIComponent(f.name)}`
          : origin.origin === "DEVIS" && oHref
            ? oHref
            : f.fileUrl?.startsWith("/api/")
              ? f.fileUrl
              : chantierHref;
      return {
        id: `cf:${f.id}`,
        source: "chantier" as const,
        title: stripMissingTitleSuffix(f.name),
        typeLabel: typeLabel({
          documentType: f.documentType,
          category: f.category,
          name: f.name,
          missing,
        }),
        group: g,
        projectId: f.projectId,
        projectTitle: f.project?.title ?? null,
        contextLabel: context,
        visibility: visibilityShort(f.visibility),
        authorName: f.addedBy?.name ?? null,
        createdAt: displayDate.toISOString(),
        href,
        mimeHint: missing ? null : f.mimeType,
        isCurrentVersion: f.isCurrentVersion,
        isExpectedMissing: missing,
        origin: origin.origin,
        originLabel: origin.label,
        originHref: oHref,
        originActionLabel: origin.actionLabel ?? originActionLabel(origin.origin),
        isFavorite: f.favorites.length > 0,
        versionLabel: f.versionLabel,
        indice: f.indice,
        companyLabel: supplierLink?.entityLabel ?? f.emitterName ?? null,
        chantierFileId: f.id,
      };
    });

    // Orphelins commande (BL sans lien classeur) — page 1 seulement, pour ne pas cacher la GED
    let orphanPo: HubDocumentItem[] = [];
    if (
      page === 1 &&
      (view === "all" || view === "recent") &&
      canListPurchaseOrders(opts.user) &&
      orgId &&
      (group === "all" || group === "commandes" || group === "fournisseurs")
    ) {
      const supplierActor = isSupplierPurchaseOrderActor(opts.user);

      const poDocs =
        supplierActor && !supplierExtOrgId
          ? []
          : await prisma.purchaseOrderDocument.findMany({
              where: {
                order: {
                  organizationId: orgId,
                  ...(opts.projectId ? { projectId: opts.projectId } : {}),
                  ...(supplierActor && supplierExtOrgId
                    ? {
                        sharedWithSupplier: true,
                        externalOrganizationId: supplierExtOrgId,
                      }
                    : {}),
                },
                ...(search
                  ? {
                      OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { order: { number: { contains: search, mode: "insensitive" } } },
                      ],
                    }
                  : {}),
              },
              orderBy: { createdAt: "desc" },
              take: 30,
              select: {
                id: true,
                name: true,
                kind: true,
                fileUrl: true,
                createdAt: true,
                order: {
                  select: {
                    id: true,
                    number: true,
                    projectId: true,
                    project: { select: { title: true } },
                    externalOrganization: { select: { tradeName: true, name: true } },
                  },
                },
              },
            });

      const linked = await prisma.chantierFileLink.findMany({
        where: {
          entityType: "purchase_order_document",
          entityId: { in: poDocs.map((d) => d.id) },
        },
        select: { entityId: true },
      });
      const linkedSet = new Set(linked.map((l) => l.entityId).filter(Boolean));

      orphanPo = poDocs
        .filter((d) => d.fileUrl && !linkedSet.has(d.id))
        .map((d) => {
          const supplier =
            d.order.externalOrganization.tradeName || d.order.externalOrganization.name;
          return {
            id: `po:${d.id}`,
            source: "purchase_order" as const,
            title: d.name,
            typeLabel: typeLabel({ poKind: d.kind, name: d.name }),
            group: inferGroup({ poKind: d.kind, name: d.name }),
            projectId: d.order.projectId,
            projectTitle: d.order.project?.title ?? null,
            contextLabel: `${d.order.number} · ${supplier}`,
            visibility: supplierActor ? "Partagé fournisseur" : "Interne",
            authorName: null,
            createdAt: d.createdAt.toISOString(),
            href: `/dashboard/commandes/${d.order.id}${d.kind === "BL" ? "?focus=receiving" : "?focus=documents"}`,
            mimeHint: null,
            isCurrentVersion: true,
            origin: "COMMANDE" as const,
            originLabel: "Commande",
            originHref: `/dashboard/commandes/${d.order.id}${d.kind === "BL" ? "?focus=receiving" : "?focus=documents"}`,
            originActionLabel: "Voir la commande",
            companyLabel: supplier,
            chantierFileId: null,
          };
        });
    }

    // Legacy Document (page 1) — hors sync classeur
    let legacy: HubDocumentItem[] = [];
    if (page === 1 && internal && view === "all" && (group === "all" || group === "administratif")) {
      const synced = await prisma.chantierFile.findMany({
        where: { sourceDocumentId: { not: null } },
        select: { sourceDocumentId: true },
        take: 3000,
      });
      const syncedSet = new Set(synced.map((s) => s.sourceDocumentId).filter(Boolean));

      const docs = await prisma.document.findMany({
        where: {
          ...(opts.projectId ? { projectId: opts.projectId } : { project: projectWhere }),
          ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          category: true,
          status: true,
          createdAt: true,
          mimeType: true,
          projectId: true,
          project: { select: { title: true } },
          client: { select: { name: true } },
        },
      });

      legacy = docs
        .filter((d) => !syncedSet.has(d.id))
        .map((d) => {
          const missingHint =
            /\(manquante\)/i.test(d.name) || d.status === "EN_ATTENTE";
          const cleanTitle = d.name.replace(/\s*\(manquante\)\s*/i, "").trim() || d.name;
          return {
            id: `doc:${d.id}`,
            source: "legacy" as const,
            title: missingHint ? cleanTitle : d.name,
            typeLabel: missingHint
              ? "À récupérer"
              : typeLabel({ category: d.category, name: d.name }),
            group: "administratif" as HubGroup,
            projectId: d.projectId,
            projectTitle: d.project?.title ?? null,
            contextLabel: missingHint ? "Document attendu" : typeLabel({ category: d.category, name: d.name }),
            visibility: "Interne",
            authorName: d.client.name,
            createdAt: d.createdAt.toISOString(),
            href: d.projectId
              ? `/dashboard/projets/${d.projectId}#tab-documents`
              : `/dashboard/documents?legacy=${d.id}`,
            mimeHint: missingHint ? null : d.mimeType,
            isCurrentVersion: true,
            isExpectedMissing: missingHint,
          };
        });
    }

    const merged = [...items, ...orphanPo, ...legacy].filter((it) => {
      if (group !== "all" && it.group !== group) return false;
      if (originFilter && it.origin && it.origin !== originFilter) return false;
      if (docType && !documentTypeMatches(it, docType)) return false;
      if (company) {
        const blob = `${it.companyLabel ?? ""} ${it.contextLabel ?? ""}`.toLowerCase();
        if (!blob.includes(company.toLowerCase())) return false;
      }
      return true;
    });
    merged.sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title, "fr");
      if (sort === "type") return a.typeLabel.localeCompare(b.typeLabel, "fr");
      if (sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
      return b.createdAt.localeCompare(a.createdAt);
    });

    return {
      items: merged,
      total: chantierTotal + (page === 1 ? orphanPo.length + legacy.length : 0),
      page,
      pageSize: PAGE_SIZE,
      groups: hubGroupsForPersona(opts.user.personType, opts.user.permissionProfile),
      classifyCount,
      missingCount,
      companies: companyRows
        .map((r) => r.emitterName?.trim() ?? "")
        .filter(Boolean)
        .slice(0, 40),
    };
  });
}
