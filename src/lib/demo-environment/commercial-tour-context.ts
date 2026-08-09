/**
 * Résolution live du scénario commercial (BC-2026-043 / Les Lilas / Point.P).
 * Lecture seule — aucune mutation.
 */

import { prisma } from "@/lib/prisma";
import { projectSupplierHref } from "@/lib/messagerie/resolve-conversation";
import {
  DEMO_SCENARIO_ORDER_NUMBER,
  type DemoCommercialContext,
} from "./commercial-tour";
import { DEMO_SCENARIO, demoProjectTitleWhere } from "./scenario";

export async function loadDemoCommercialContext(
  organizationId: string,
): Promise<DemoCommercialContext> {
  const empty: DemoCommercialContext = {
    orderId: null,
    orderNumber: null,
    orderStatus: null,
    projectId: null,
    projectTitle: null,
    supplierName: null,
    agendaEventId: null,
    orderedQty: null,
    receivedQty: null,
    hasPartialReceipt: false,
    orderHref: null,
    receptionHref: null,
    messagerieHref: null,
    agendaHref: null,
    documentsHref: null,
    chantierHref: null,
  };

  const order = await prisma.purchaseOrder.findFirst({
    where: { organizationId, number: DEMO_SCENARIO_ORDER_NUMBER },
    select: {
      id: true,
      number: true,
      status: true,
      projectId: true,
      project: { select: { id: true, title: true } },
      externalOrganization: { select: { name: true, tradeName: true } },
      lines: { select: { quantity: true, receivedQty: true } },
      agendaEvents: {
        where: { type: "LIVRAISON", status: { not: "ANNULE" } },
        select: { id: true },
        orderBy: { startAt: "asc" },
        take: 1,
      },
    },
  });

  if (!order) {
    // Fallback chantier principal seul (parcours adapté, pas d’invention commande)
    const project = await prisma.project.findFirst({
      where: { organizationId, ...demoProjectTitleWhere("primary") },
      select: { id: true, title: true },
    });
    if (!project) return empty;
    const q = DEMO_SCENARIO.projects.primary.matchToken;
    return {
      ...empty,
      projectId: project.id,
      projectTitle: project.title,
      chantierHref: `/dashboard/projets/${project.id}`,
      messagerieHref: projectSupplierHref(project.id),
      documentsHref: `/dashboard/documents?q=${encodeURIComponent(q)}`,
      agendaHref: "/dashboard/agenda",
    };
  }

  const orderedQty = order.lines.reduce((s, l) => s + Number(l.quantity ?? 0), 0);
  const receivedQty = order.lines.reduce((s, l) => s + Number(l.receivedQty ?? 0), 0);
  const hasPartialReceipt =
    order.status === "PARTIELLEMENT_RECUE" ||
    (orderedQty > 0 && receivedQty > 0 && receivedQty < orderedQty);

  const projectId = order.projectId ?? order.project?.id ?? null;
  const agendaEventId = order.agendaEvents[0]?.id ?? null;
  const supplierName =
    order.externalOrganization?.tradeName?.trim() ||
    order.externalOrganization?.name?.trim() ||
    "Point.P";

  return {
    orderId: order.id,
    orderNumber: order.number,
    orderStatus: order.status,
    projectId,
    projectTitle: order.project?.title ?? null,
    supplierName,
    agendaEventId,
    orderedQty: orderedQty || null,
    receivedQty: receivedQty || null,
    hasPartialReceipt,
    orderHref: `/dashboard/commandes/${order.id}`,
    receptionHref: `/dashboard/commandes/${order.id}/reception`,
    messagerieHref: projectId ? projectSupplierHref(projectId) : null,
    agendaHref: agendaEventId
      ? `/dashboard/agenda?event=${agendaEventId}`
      : "/dashboard/agenda",
    documentsHref: `/dashboard/documents?q=${encodeURIComponent(order.number)}`,
    chantierHref: projectId ? `/dashboard/projets/${projectId}` : null,
  };
}
