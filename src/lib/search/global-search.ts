/**
 * RECHERCHE-GLOBALE-V1 — Loader central (métadonnées uniquement, pas d’IA).
 * Permissions : projectWhere + org + personType — jamais d’objet hors scope.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { projectWhereForClientUser } from "@/lib/organization/access";
import {
  canListPurchaseOrders,
  isInternalPurchaseOrderActor,
  isSupplierPurchaseOrderActor,
  resolvePurchaseOrderOrgId,
  type PurchaseOrderSessionUser,
} from "@/lib/purchase-orders/access";
import { searchSuppliers } from "@/lib/suppliers/service";
import { PURCHASE_ORDER_STATUS_LABELS } from "@/lib/purchase-orders/status";
import { resolveConversationHref } from "@/lib/messagerie/resolve-conversation";
import { isExternalPortalUser } from "@/lib/equipe-acces/nav-by-persona";
import { withPerfLog } from "@/lib/perf/server-timing";

export type SearchResultKind =
  | "project"
  | "order"
  | "supplier"
  | "user"
  | "task"
  | "follow_up"
  | "document"
  | "agenda"
  | "conversation"
  | "nav"
  | "action";

export type GlobalSearchItem = {
  id: string;
  kind: SearchResultKind;
  title: string;
  subtitle: string;
  meta: string | null;
  href: string;
  score: number;
};

export type GlobalSearchResponse = {
  query: string;
  items: GlobalSearchItem[];
  actions: GlobalSearchItem[];
  nav: GlobalSearchItem[];
};

type SearchUser = PurchaseOrderSessionUser & {
  name?: string | null;
  role?: string | null;
};

const NAV_ITEMS: { id: string; title: string; href: string; keywords: string[] }[] = [
  { id: "nav-home", title: "Accueil", href: "/dashboard", keywords: ["accueil", "home", "dashboard"] },
  {
    id: "nav-atraiter",
    title: "À traiter",
    href: "/dashboard/a-traiter",
    keywords: ["a traiter", "à traiter", "attention", "urgences"],
  },
  {
    id: "nav-msg",
    title: "Messagerie",
    href: "/dashboard/messagerie",
    keywords: ["messagerie", "messages", "chat"],
  },
  {
    id: "nav-projets",
    title: "Chantiers",
    href: "/dashboard/projets",
    keywords: ["chantiers", "projets", "sites"],
  },
  {
    id: "nav-planning",
    title: "Planning",
    href: "/dashboard/planning",
    keywords: ["planning", "ressources"],
  },
  {
    id: "nav-agenda",
    title: "Agenda",
    href: "/dashboard/agenda",
    keywords: ["agenda", "calendrier", "réunions"],
  },
  {
    id: "nav-commandes",
    title: "Commandes",
    href: "/dashboard/commandes",
    keywords: ["commandes", "livraisons", "bc"],
  },
  {
    id: "nav-docs",
    title: "Documents",
    href: "/dashboard/documents",
    keywords: ["documents", "fichiers", "ged"],
  },
  {
    id: "nav-taches",
    title: "Tâches",
    href: "/dashboard/taches",
    keywords: ["taches", "tâches", "missions"],
  },
  {
    id: "nav-fournisseurs",
    title: "Fournisseurs",
    href: "/dashboard/fournisseurs",
    keywords: ["fournisseurs", "suppliers"],
  },
];

const ACTION_ITEMS: { id: string; title: string; href: string; keywords: string[]; internalOnly?: boolean }[] =
  [
    {
      id: "act-task",
      title: "Créer une tâche",
      href: "/dashboard/taches?nouvelle=1",
      keywords: ["nouvelle tâche", "nouvelle tache", "créer tâche", "creer tache"],
    },
    {
      id: "act-event",
      title: "Créer un événement",
      href: "/dashboard/agenda?new=1",
      keywords: ["nouvel événement", "nouvel evenement", "créer événement"],
    },
    {
      id: "act-order",
      title: "Créer une commande",
      href: "/dashboard/commandes/nouvelle",
      keywords: ["nouvelle commande", "créer commande", "nouveau bc"],
      internalOnly: true,
    },
    {
      id: "act-msg",
      title: "Nouveau message",
      href: "/dashboard/messagerie",
      keywords: ["nouveau message", "écrire", "ecrire"],
    },
    {
      id: "act-doc",
      title: "Ajouter un document",
      href: "/dashboard/documents",
      keywords: ["ajouter document", "nouveau document", "upload"],
    },
    {
      id: "act-fiche",
      title: "Créer une fiche",
      href: "/dashboard/fiches-suivi/nouvelle",
      keywords: ["nouvelle fiche", "fiche de suivi"],
      internalOnly: true,
    },
  ];

function norm(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function scoreMatch(query: string, ...fields: Array<string | null | undefined>): number {
  const q = norm(query);
  if (!q) return 0;
  let best = 0;
  for (const raw of fields) {
    if (!raw) continue;
    const f = norm(raw);
    if (f === q) best = Math.max(best, 100);
    else if (f.startsWith(q)) best = Math.max(best, 70);
    else if (f.includes(q)) best = Math.max(best, 40);
    else {
      // multi-token : tous les tokens présents
      const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
      if (tokens.length > 1 && tokens.every((t) => f.includes(t))) {
        best = Math.max(best, 55);
      }
    }
  }
  return best;
}

function recencyBoost(d: Date | null | undefined, now: Date): number {
  if (!d) return 0;
  const days = (now.getTime() - d.getTime()) / 86_400_000;
  if (days < 7) return 8;
  if (days < 30) return 4;
  if (days < 90) return 2;
  return 0;
}

function contains(q: string): Prisma.StringFilter {
  return { contains: q, mode: "insensitive" };
}

export async function searchGlobal(opts: {
  user: SearchUser;
  query: string;
  now?: Date;
}): Promise<GlobalSearchResponse> {
  return withPerfLog("searchGlobal", async () => {
    const now = opts.now ?? new Date();
    const qRaw = opts.query.trim();
    const q = qRaw.slice(0, 80);
    const external = isExternalPortalUser(opts.user.personType);
    const internal = isInternalPurchaseOrderActor(opts.user);
    const supplier = isSupplierPurchaseOrderActor(opts.user);

    const actionsEmpty = ACTION_ITEMS.filter((a) => !a.internalOnly || internal).map(
      (a): GlobalSearchItem => ({
        id: a.id,
        kind: "action",
        title: a.title,
        subtitle: "Action rapide",
        meta: null,
        href: a.href,
        score: 0,
      }),
    );

    const navEmpty = NAV_ITEMS.filter((n) => {
      if (external && (n.id === "nav-atraiter" || n.id === "nav-fournisseurs" || n.id === "nav-planning")) {
        return false;
      }
      if (!canListPurchaseOrders(opts.user) && n.id === "nav-commandes") return false;
      return true;
    }).map(
      (n): GlobalSearchItem => ({
        id: n.id,
        kind: "nav",
        title: `Aller à ${n.title}`,
        subtitle: "Navigation",
        meta: null,
        href: n.href,
        score: 0,
      }),
    );

    if (q.length < 2) {
      return { query: q, items: [], actions: actionsEmpty, nav: navEmpty };
    }

    const qn = norm(q);

    // Actions / nav filtrés par texte
    const actions = ACTION_ITEMS.filter((a) => {
      if (a.internalOnly && !internal) return false;
      return a.keywords.some((k) => norm(k).includes(qn) || qn.includes(norm(k))) ||
        scoreMatch(q, a.title) > 0;
    }).map(
      (a): GlobalSearchItem => ({
        id: a.id,
        kind: "action",
        title: a.title,
        subtitle: "Action rapide",
        meta: null,
        href: a.href,
        score: Math.max(60, scoreMatch(q, a.title, ...a.keywords)),
      }),
    );

    const nav = NAV_ITEMS.filter((n) => {
      if (external && (n.id === "nav-atraiter" || n.id === "nav-fournisseurs" || n.id === "nav-planning")) {
        return false;
      }
      if (!canListPurchaseOrders(opts.user) && n.id === "nav-commandes") return false;
      return scoreMatch(q, n.title, ...n.keywords) > 0;
    }).map(
      (n): GlobalSearchItem => ({
        id: n.id,
        kind: "nav",
        title: `Aller à ${n.title}`,
        subtitle: "Navigation",
        meta: null,
        href: n.href,
        score: Math.max(50, scoreMatch(q, n.title, ...n.keywords)),
      }),
    );

    const projectWhere = await projectWhereForClientUser(opts.user.id);
    const orgId = await resolvePurchaseOrderOrgId(opts.user);

    const take = 5;

    const projectPromise = prisma.project.findMany({
      where: {
        AND: [
          projectWhere,
          {
            OR: [
              { title: contains(q) },
              { description: contains(q) },
              { siteCity: contains(q) },
              { siteAddress: contains(q) },
              { client: { name: contains(q) } },
              { client: { company: contains(q) } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        siteCity: true,
        siteAddress: true,
        chantierStatus: true,
        updatedAt: true,
        client: { select: { name: true, company: true } },
      },
      orderBy: { updatedAt: "desc" },
      take,
    });

    const ordersPromise =
      canListPurchaseOrders(opts.user) && orgId
        ? prisma.purchaseOrder.findMany({
            where: {
              organizationId: orgId,
              ...(supplier
                ? {
                    sharedWithSupplier: true,
                    externalOrganization: {
                      people: { some: { id: opts.user.id } },
                    },
                  }
                : {}),
              OR: [
                { number: contains(q) },
                { subject: contains(q) },
                { supplierRef: contains(q) },
                { externalOrganization: { name: contains(q) } },
                { externalOrganization: { tradeName: contains(q) } },
                { project: { title: contains(q) } },
              ],
            },
            select: {
              id: true,
              number: true,
              status: true,
              updatedAt: true,
              project: { select: { title: true } },
              externalOrganization: { select: { name: true, tradeName: true } },
            },
            orderBy: { updatedAt: "desc" },
            take,
          })
        : Promise.resolve([]);

    const suppliersPromise =
      internal && orgId
        ? searchSuppliers({ hostOrganizationId: orgId, query: q, take })
        : Promise.resolve([]);

    const usersPromise =
      internal && orgId
        ? prisma.organizationMember.findMany({
            where: {
              organizationId: orgId,
              user: {
                OR: [{ name: contains(q) }, { email: contains(q) }, { company: contains(q) }],
              },
            },
            select: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  permissionProfile: true,
                  personType: true,
                  company: true,
                },
              },
            },
            take,
          })
        : Promise.resolve([]);

    const tasksPromise = prisma.task.findMany({
      where: {
        AND: [
          {
            OR: [
              { project: projectWhere },
              { clientId: opts.user.id },
              { assignedToId: opts.user.id },
              ...(orgId ? [{ organizationId: orgId }] : []),
            ],
          },
          {
            OR: [
              { title: contains(q) },
              { description: contains(q) },
              { project: { title: contains(q) } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        desiredDate: true,
        updatedAt: true,
        assignedTo: { select: { name: true } },
        project: { select: { title: true } },
      },
      orderBy: { updatedAt: "desc" },
      take,
    });

    const followUpsPromise = internal
      ? prisma.followUpSheet.findMany({
          where: {
            AND: [
              {
                OR: [
                  { ownerUserId: opts.user.id },
                  { assigneeId: opts.user.id },
                  { createdById: opts.user.id },
                  ...(orgId ? [{ organizationId: orgId }] : []),
                  { project: projectWhere },
                ],
              },
              {
                OR: [
                  { title: contains(q) },
                  { clientName: contains(q) },
                  { orderNumber: contains(q) },
                  { osNumber: contains(q) },
                  { workObject: contains(q) },
                  { nextAction: contains(q) },
                  { project: { title: contains(q) } },
                ],
              },
            ],
          },
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
            project: { select: { title: true } },
          },
          orderBy: { updatedAt: "desc" },
          take,
        })
      : Promise.resolve([]);

    const documentsPromise = prisma.document.findMany({
      where: {
        AND: [
          {
            OR: [{ project: projectWhere }, { clientId: opts.user.id }],
          },
          {
            OR: [{ name: contains(q) }, { project: { title: contains(q) } }],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        category: true,
        updatedAt: true,
        projectId: true,
        project: { select: { id: true, title: true } },
        taskId: true,
      },
      orderBy: { updatedAt: "desc" },
      take,
    });

    const chantierFilesPromise = prisma.chantierFile.findMany({
      where: {
        deletedAt: null,
        isCurrentVersion: true,
        project: projectWhere,
        OR: [
          { name: contains(q) },
          { documentType: contains(q) },
          { category: contains(q) },
          { emitterName: contains(q) },
          { project: { title: contains(q) } },
        ],
      },
      select: {
        id: true,
        name: true,
        documentType: true,
        category: true,
        emitterName: true,
        updatedAt: true,
        projectId: true,
        project: { select: { title: true } },
        links: {
          take: 2,
          select: { entityType: true, entityLabel: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take,
    });

    const agendaPromise = prisma.agendaEvent.findMany({
      where: {
        project: projectWhere,
        status: { not: "ANNULE" },
        OR: [
          { title: contains(q) },
          { description: contains(q) },
          { location: contains(q) },
          { project: { title: contains(q) } },
          { purchaseOrder: { number: contains(q) } },
        ],
      },
      select: {
        id: true,
        title: true,
        type: true,
        startAt: true,
        updatedAt: true,
        project: { select: { title: true } },
      },
      orderBy: { startAt: "desc" },
      take,
    });

    // Conversations : projets match + commandes fournisseur match (pas contenu messages)
    const conversationsPromise = prisma.project.findMany({
      where: {
        AND: [
          projectWhere,
          {
            OR: [
              { title: contains(q) },
              {
                purchaseOrders: {
                  some: {
                    OR: [
                      { externalOrganization: { name: contains(q) } },
                      { externalOrganization: { tradeName: contains(q) } },
                      { number: contains(q) },
                    ],
                  },
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        purchaseOrders: {
          where: {
            OR: [
              { externalOrganization: { name: contains(q) } },
              { externalOrganization: { tradeName: contains(q) } },
            ],
          },
          take: 1,
          select: {
            externalOrganization: { select: { name: true, tradeName: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take,
    });

    const [
      projects,
      orders,
      suppliers,
      members,
      tasks,
      followUps,
      documents,
      chantierFiles,
      agenda,
      convProjects,
    ] = await Promise.all([
      projectPromise,
      ordersPromise,
      suppliersPromise,
      usersPromise,
      tasksPromise,
      followUpsPromise,
      documentsPromise,
      chantierFilesPromise,
      agendaPromise,
      conversationsPromise,
    ]);

    const items: GlobalSearchItem[] = [];

    for (const p of projects) {
      const clientLabel = p.client.company || p.client.name;
      const s =
        scoreMatch(q, p.title, p.siteCity, p.siteAddress, clientLabel) +
        recencyBoost(p.updatedAt, now) +
        (p.chantierStatus === "EN_COURS" ? 3 : 0);
      items.push({
        id: `project:${p.id}`,
        kind: "project",
        title: p.title,
        subtitle: `Chantier${clientLabel ? ` · ${clientLabel}` : ""}`,
        meta: p.siteCity,
        href: `/dashboard/projets/${p.id}`,
        score: s,
      });
    }

    for (const o of orders) {
      const supplierName = o.externalOrganization.tradeName || o.externalOrganization.name;
      const s =
        scoreMatch(q, o.number, supplierName, o.project?.title) +
        recencyBoost(o.updatedAt, now) +
        (norm(o.number) === qn ? 40 : 0);
      items.push({
        id: `order:${o.id}`,
        kind: "order",
        title: o.number,
        subtitle: [supplierName, o.project?.title].filter(Boolean).join(" · "),
        meta: PURCHASE_ORDER_STATUS_LABELS[o.status] ?? o.status,
        href: `/dashboard/commandes/${o.id}`,
        score: s,
      });
    }

    for (const s of suppliers) {
      const name = s.tradeName || s.name;
      items.push({
        id: `supplier:${s.id}`,
        kind: "supplier",
        title: name,
        subtitle: "Fournisseur",
        meta: s.city || s.activity,
        href: `/dashboard/fournisseurs/${s.id}`,
        score: scoreMatch(q, s.name, s.tradeName, s.activity) + 5,
      });
    }

    for (const m of members) {
      const u = m.user;
      if (!u || u.id === opts.user.id) continue;
      const profile = u.permissionProfile || "Équipe";
      items.push({
        id: `user:${u.id}`,
        kind: "user",
        title: u.name,
        subtitle: `${profile}${u.company ? ` · ${u.company}` : ""}`,
        meta: u.email,
        href: resolveConversationHref({ kind: "direct", userId: u.id }),
        score: scoreMatch(q, u.name, u.email),
      });
    }

    for (const t of tasks) {
      const due = t.desiredDate
        ? t.desiredDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
        : null;
      items.push({
        id: `task:${t.id}`,
        kind: "task",
        title: t.title,
        subtitle: `Tâche${t.project?.title ? ` · ${t.project.title}` : ""}`,
        meta: [t.assignedTo?.name?.split(" ")[0], due].filter(Boolean).join(" · ") || null,
        href: `/dashboard/taches/${t.id}`,
        score: scoreMatch(q, t.title, t.project?.title) + recencyBoost(t.updatedAt, now),
      });
    }

    for (const f of followUps) {
      items.push({
        id: `follow_up:${f.id}`,
        kind: "follow_up",
        title: f.title,
        subtitle: `Fiche de suivi${f.project?.title ? ` · ${f.project.title}` : ""}`,
        meta: f.status,
        href: `/dashboard/fiches-suivi/${f.id}`,
        score: scoreMatch(q, f.title, f.project?.title) + recencyBoost(f.updatedAt, now),
      });
    }

    for (const d of documents) {
      const href = d.projectId
        ? `/dashboard/projets/${d.projectId}#tab-documents`
        : d.taskId
          ? `/dashboard/taches/${d.taskId}`
          : `/dashboard/documents?search=${encodeURIComponent(d.name)}`;
      items.push({
        id: `document:${d.id}`,
        kind: "document",
        title: d.name,
        subtitle: `Document${d.project?.title ? ` · ${d.project.title}` : ""}`,
        meta: d.category,
        href,
        score: scoreMatch(q, d.name, d.project?.title) + recencyBoost(d.updatedAt, now),
      });
    }

    for (const f of chantierFiles) {
      const ctx =
        f.links.find((l) => l.entityType === "purchase_order")?.entityLabel ||
        f.links.find((l) => l.entityType === "supplier")?.entityLabel ||
        f.category;
      items.push({
        id: `chantier_file:${f.id}`,
        kind: "document",
        title: f.name,
        subtitle: `Document${f.project?.title ? ` · ${f.project.title}` : ""}`,
        meta: [f.documentType || ctx].filter(Boolean).join(" · ") || null,
        href: `/dashboard/projets/${f.projectId}#tab-documents`,
        score:
          scoreMatch(q, f.name, f.documentType, f.category, f.emitterName, f.project?.title) +
          recencyBoost(f.updatedAt, now) +
          3,
      });
    }

    for (const e of agenda) {
      const when = e.startAt.toLocaleString("fr-FR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
      items.push({
        id: `agenda:${e.id}`,
        kind: "agenda",
        title: e.title,
        subtitle: `Agenda${e.project?.title ? ` · ${e.project.title}` : ""}`,
        meta: when,
        href: `/dashboard/agenda?event=${e.id}`,
        score: scoreMatch(q, e.title, e.project?.title) + recencyBoost(e.startAt, now),
      });
    }

    for (const p of convProjects) {
      const po = p.purchaseOrders[0];
      if (po) {
        const supplierName =
          po.externalOrganization.tradeName || po.externalOrganization.name;
        items.push({
          id: `conversation:sup:${p.id}`,
          kind: "conversation",
          title: `${supplierName} — ${p.title}`,
          subtitle: "Conversation fournisseur",
          meta: "Externe",
          href: resolveConversationHref({
            kind: "project_channel",
            projectId: p.id,
            channel: "FOURNISSEUR",
          }),
          score: scoreMatch(q, supplierName, p.title) + recencyBoost(p.updatedAt, now) + 2,
        });
      } else {
        items.push({
          id: `conversation:int:${p.id}`,
          kind: "conversation",
          title: p.title,
          subtitle: "Conversation chantier",
          meta: "Interne",
          href: resolveConversationHref({
            kind: "project_channel",
            projectId: p.id,
            channel: "INTERNE",
          }),
          score: scoreMatch(q, p.title) + recencyBoost(p.updatedAt, now),
        });
      }
    }

    // Dédupliquer par href+kind, garder meilleur score
    const byKey = new Map<string, GlobalSearchItem>();
    for (const it of items) {
      const key = `${it.kind}:${it.href}`;
      const prev = byKey.get(key);
      if (!prev || it.score > prev.score) byKey.set(key, it);
    }

    const ranked = Array.from(byKey.values())
      .filter((it) => it.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 18);

    return {
      query: q,
      items: ranked,
      actions: actions.sort((a, b) => b.score - a.score).slice(0, 4),
      nav: nav.sort((a, b) => b.score - a.score).slice(0, 4),
    };
  });
}
