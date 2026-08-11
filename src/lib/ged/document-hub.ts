/**
 * GED-V2A — Hub documentaire (lecture unifiée, sans migration).
 * Source principale : ChantierFile
 * Compléments : PurchaseOrderDocument orphelin, Document legacy non synchronisé.
 */
import { prisma } from "@/lib/prisma";
import { projectWhereForClientUser } from "@/lib/organization/access";
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
  hubGroupsForPersona,
  type HubDocumentItem,
  type HubGroup,
  type HubSort,
} from "@/lib/ged/document-hub-ui";

export type { HubGroup, HubSort, HubDocumentItem } from "@/lib/ged/document-hub-ui";
export { hubGroupsForPersona, hubEmptyCopy } from "@/lib/ged/document-hub-ui";

export type HubListResult = {
  items: HubDocumentItem[];
  total: number;
  page: number;
  pageSize: number;
  groups: { id: HubGroup; label: string; count?: number }[];
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
}): string {
  if (opts.poKind === "BL" || opts.documentType === "BL") return "BL";
  if (opts.documentType) return opts.documentType.toUpperCase();
  if (opts.category === "Photos") return "PHOTO";
  if (opts.category === "Plans") return "PLAN";
  if (opts.category === "DOE") return "DOE";
  if (opts.category === "Fournisseurs") return "FOURNISSEUR";
  if (opts.category === "Marché") return "MARCHÉ";
  if (/\.pdf$/i.test(opts.name ?? "")) return "PDF";
  return opts.category || "DOCUMENT";
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
  search?: string;
  projectId?: string;
  sort?: HubSort;
}): Promise<HubListResult> {
  return withPerfLog("loadDocumentHub", async () => {
    const page = Math.max(1, opts.page ?? 1);
    const group = opts.group ?? "all";
    const search = (opts.search ?? "").trim();
    const sort = opts.sort ?? "recent";
    const external = isExternalPortalUser(opts.user.personType);
    const internal = isInternalPurchaseOrderActor(opts.user);
    const isSupplier =
      opts.user.personType === "SUPPLIER" || opts.user.permissionProfile === "FOURNISSEUR";
    const projectWhere = await projectWhereForClientUser(opts.user.id);
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

    const chantierWhere = {
      deletedAt: null,
      archivedAt: null,
      isCurrentVersion: true,
      project: opts.projectId
        ? { id: opts.projectId, AND: [projectWhere] }
        : projectWhere,
      AND: [
        ...(externalVisibilityFilter ? [externalVisibilityFilter] : []),
        ...(search
          ? [
              {
                OR: [
                  { name: { contains: search, mode: "insensitive" as const } },
                  { documentType: { contains: search, mode: "insensitive" as const } },
                  { category: { contains: search, mode: "insensitive" as const } },
                  { emitterName: { contains: search, mode: "insensitive" as const } },
                  { project: { title: { contains: search, mode: "insensitive" as const } } },
                ],
              },
            ]
          : []),
      ],
    };

    const orderBy =
      sort === "oldest"
        ? { createdAt: "asc" as const }
        : sort === "name"
          ? { name: "asc" as const }
          : sort === "type"
            ? { documentType: "asc" as const }
            : { createdAt: "desc" as const };

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
          mimeType: true,
          isCurrentVersion: true,
          projectId: true,
          project: { select: { title: true } },
          folder: { select: { code: true, label: true } },
          addedBy: { select: { name: true } },
          links: {
            take: 4,
            select: { entityType: true, entityLabel: true, entityId: true },
          },
        },
      }),
      prisma.chantierFile.count({ where: chantierWhere }),
    ]);

    const items: HubDocumentItem[] = chantierFiles.map((f) => {
      const g = inferGroup({
        category: f.category,
        documentType: f.documentType,
        folderCode: f.folder.code,
        name: f.name,
      });
      const poLink = f.links.find((l) => l.entityType === "purchase_order");
      const context =
        poLink?.entityLabel ||
        f.links.find((l) => l.entityType === "supplier")?.entityLabel ||
        f.folder.label ||
        null;
      return {
        id: `cf:${f.id}`,
        source: "chantier" as const,
        title: f.name,
        typeLabel: typeLabel({
          documentType: f.documentType,
          category: f.category,
          name: f.name,
        }),
        group: g,
        projectId: f.projectId,
        projectTitle: f.project.title,
        contextLabel: context,
        visibility: visibilityShort(f.visibility),
        authorName: f.addedBy?.name ?? null,
        createdAt: f.createdAt.toISOString(),
        href:
          isSupplier || external
            ? poLink?.entityId
              ? `/dashboard/commandes/${poLink.entityId}?focus=documents`
              : `/dashboard/documents?q=${encodeURIComponent(f.name)}`
            : `/dashboard/projets/${f.projectId}#tab-documents`,
        mimeHint: f.mimeType,
        isCurrentVersion: f.isCurrentVersion,
      };
    });

    // Orphelins commande (BL sans lien classeur) — page 1 seulement, pour ne pas cacher la GED
    let orphanPo: HubDocumentItem[] = [];
    if (
      page === 1 &&
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
          };
        });
    }

    // Legacy Document (page 1) — hors sync classeur
    let legacy: HubDocumentItem[] = [];
    if (page === 1 && internal && (group === "all" || group === "administratif")) {
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
            typeLabel: typeLabel({ category: d.category, name: d.name }),
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

    const merged = [...items, ...orphanPo, ...legacy].filter(
      (it) => group === "all" || it.group === group,
    );
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
    };
  });
}
