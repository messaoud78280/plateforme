/**
 * Checklist / score d’activation — source unique client UX + BeWork Admin.
 * Basé sur les vraies données org (pas de cases artificielles).
 */

import { prisma } from "@/lib/prisma";

/** Pondération partagée (client + admin). Total = 100. */
export const ACTIVATION_WEIGHTS = {
  company: 15,
  client: 10,
  project: 20,
  quote: 20,
  member: 15,
  document: 10,
  multiDay: 10,
} as const;

export type ActivationChecklistItem = {
  id: keyof typeof ACTIVATION_WEIGHTS | string;
  label: string;
  description: string;
  ctaLabel: string;
  done: boolean;
  href?: string;
};

export type ActivationMaturity = "new" | "building" | "active" | "ready";

export type ActivationSnapshot = {
  organizationId: string;
  percent: number;
  maturity: ActivationMaturity;
  items: ActivationChecklistItem[];
  nextIncomplete: ActivationChecklistItem | null;
  counts: {
    clients: number;
    projects: number;
    quotes: number;
    documents: number;
    members: number;
    purchaseOrders: number;
  };
  flags: {
    company: boolean;
    client: boolean;
    project: boolean;
    quote: boolean;
    member: boolean;
    document: boolean;
    multiDay: boolean;
  };
};

export function activationMaturityFromPercent(percent: number): ActivationMaturity {
  if (percent >= 100) return "ready";
  if (percent >= 75) return "active";
  if (percent >= 40) return "building";
  return "new";
}

function computeWeightedPercent(flags: ActivationSnapshot["flags"]): number {
  let points = 0;
  const max = Object.values(ACTIVATION_WEIGHTS).reduce((a, b) => a + b, 0);
  (Object.keys(ACTIVATION_WEIGHTS) as (keyof typeof ACTIVATION_WEIGHTS)[]).forEach((k) => {
    if (flags[k]) points += ACTIVATION_WEIGHTS[k];
  });
  return Math.round((points / max) * 100);
}

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
        createdAt: true,
        commercialOrgSettings: { select: { id: true } },
        owner: { select: { lastLoginAt: true, createdAt: true } },
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

  const company = Boolean(
    org?.onboardingCompletedAt ||
      org?.siret ||
      org?.commercialOrgSettings?.id ||
      (org?.name && org.name.trim().length > 2 && org.name !== "Entreprise"),
  );
  const client = clientExtCount > 0 || projectCount > 0;
  const project = projectCount > 0;
  const quote = quoteCount > 0;
  const member = memberCount > 1;
  const document = documentCount > 0;
  const ownerCreated = org?.owner?.createdAt?.getTime() ?? org?.createdAt?.getTime() ?? 0;
  const ownerLogin = org?.owner?.lastLoginAt?.getTime() ?? 0;
  const multiDay =
    ownerLogin > 0 &&
    ownerCreated > 0 &&
    ownerLogin - ownerCreated > 20 * 60 * 60 * 1000;

  const flags = { company, client, project, quote, member, document, multiDay };
  const percent = computeWeightedPercent(flags);
  const maturity = activationMaturityFromPercent(percent);

  const items: ActivationChecklistItem[] = [
    {
      id: "company",
      label: "Configurez votre entreprise",
      description: "SIRET, logo et coordonnées pour vos devis et documents.",
      ctaLabel: "Configurer",
      done: company,
      href: "/dashboard/parametres/coordonnees",
    },
    {
      id: "client",
      label: "Créez votre premier client",
      description: "Ajoutez un client pour démarrer chantiers et devis.",
      ctaLabel: "Créer",
      done: client,
      href: "/dashboard/clients",
    },
    {
      id: "project",
      label: "Créez votre premier chantier",
      description: "Un chantier structure planning, documents et suivi.",
      ctaLabel: "Créer",
      done: project,
      href: "/dashboard/projets",
    },
    {
      id: "quote",
      label: "Créez votre premier devis",
      description: "Chiffrez clairement et suivez vos propositions.",
      ctaLabel: "Créer",
      done: quote,
      href: "/dashboard/devis-facturation",
    },
    {
      id: "member",
      label: "Invitez un collaborateur",
      description: "Partagez l’espace avec votre équipe.",
      ctaLabel: "Inviter",
      done: member,
      href: "/dashboard/equipe",
    },
    {
      id: "document",
      label: "Ajoutez un document",
      description: "Plans, CCTP, photos — tout reste classé par chantier.",
      ctaLabel: "Ajouter",
      done: document,
      href: "/dashboard/documents",
    },
  ];

  const nextIncomplete = items.find((i) => !i.done) ?? null;

  return {
    organizationId,
    percent,
    maturity,
    items,
    nextIncomplete,
    counts: {
      clients: clientExtCount,
      projects: projectCount,
      quotes: quoteCount,
      documents: documentCount,
      members: memberCount,
      purchaseOrders: poCount,
    },
    flags,
  };
}

/** CTA header contextuel — conservé pour compat ; préférer GlobalCreateMenu (+ Créer). */
export function contextualPrimaryCta(snapshot: ActivationSnapshot | null): {
  href: string;
  label: string;
} {
  void snapshot;
  return { href: "/dashboard/taches?nouvelle=1", label: "+ Créer" };
}
