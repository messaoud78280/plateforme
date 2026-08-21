/**
 * Checklist d’activation trial — basée sur les vraies données org (pas de cases artificielles).
 */

import { prisma } from "@/lib/prisma";

export type ActivationChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  href?: string;
};

export type ActivationSnapshot = {
  organizationId: string;
  percent: number;
  items: ActivationChecklistItem[];
  counts: {
    clients: number;
    projects: number;
    quotes: number;
    documents: number;
    members: number;
    purchaseOrders: number;
  };
};

/** Signaux d’activation réels pour une organisation. */
export async function getOrganizationActivationSnapshot(
  organizationId: string,
): Promise<ActivationSnapshot> {
  const [
    org,
    clientExtCount,
    projectCount,
    quoteCount,
    documentCount,
    memberCount,
    poCount,
  ] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        siret: true,
        onboardingCompletedAt: true,
        commercialOrgSettings: { select: { id: true, legalMentions: true } },
      },
    }),
    prisma.externalOrganization.count({
      where: { hostOrganizationId: organizationId, type: "CLIENT_EXT" },
    }),
    prisma.project.count({ where: { organizationId } }),
    prisma.commercialQuote.count({ where: { organizationId } }),
    prisma.chantierFile.count({
      where: {
        deletedAt: null,
        OR: [{ organizationId }, { project: { organizationId } }],
      },
    }),
    prisma.organizationMember.count({
      where: { organizationId, status: "ACTIVE" },
    }),
    prisma.purchaseOrder.count({ where: { organizationId } }),
  ]);

  const companyConfigured = Boolean(
    org?.onboardingCompletedAt ||
      org?.siret ||
      org?.commercialOrgSettings?.id ||
      (org?.name && org.name !== "Entreprise"),
  );

  const items: ActivationChecklistItem[] = [
    {
      id: "company",
      label: "Configurez votre entreprise",
      done: companyConfigured,
      href: "/dashboard/parametres",
    },
    {
      id: "client",
      label: "Créez votre premier client",
      done: clientExtCount > 0 || projectCount > 0,
      href: "/dashboard/clients",
    },
    {
      id: "project",
      label: "Créez votre premier chantier",
      done: projectCount > 0,
      href: "/dashboard/projets",
    },
    {
      id: "quote",
      label: "Créez votre premier devis",
      done: quoteCount > 0,
      href: "/dashboard/devis-facturation",
    },
    {
      id: "member",
      label: "Invitez un collaborateur",
      done: memberCount > 1,
      href: "/dashboard/equipe",
    },
    {
      id: "document",
      label: "Ajoutez un document",
      done: documentCount > 0,
      href: "/dashboard/documents",
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const percent = Math.round((doneCount / items.length) * 100);

  return {
    organizationId,
    percent,
    items,
    counts: {
      clients: clientExtCount,
      projects: projectCount,
      quotes: quoteCount,
      documents: documentCount,
      members: memberCount,
      purchaseOrders: poCount,
    },
  };
}
