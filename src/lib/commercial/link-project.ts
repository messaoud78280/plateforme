/**
 * GESTION-COMMERCIALE-V1B — pont devis accepté ↔ chantier (org-scoped).
 */
import { prisma } from "@/lib/prisma";
import { mapChantierToProjectStatus } from "@/lib/chantier-lifecycle";
import { ensureChantierFolders } from "@/lib/chantier-dossier/folders";

async function resolveOrgOwnerUserId(organizationId: string): Promise<string> {
  const org = await prisma.organization.findFirst({
    where: { id: organizationId },
    select: { ownerUserId: true },
  });
  if (!org?.ownerUserId) throw new Error("Propriétaire organisation introuvable");
  return org.ownerUserId;
}

export async function linkAcceptedQuoteToProject(opts: {
  organizationId: string;
  quoteId: string;
  projectId: string;
}) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: opts.quoteId, organizationId: opts.organizationId },
    select: { id: true, status: true, projectId: true },
  });
  if (!quote) throw new Error("Devis introuvable");
  if (quote.status !== "ACCEPTED") {
    throw new Error("Seuls les devis acceptés peuvent être rattachés à un chantier");
  }

  const project = await prisma.project.findFirst({
    where: { id: opts.projectId, organizationId: opts.organizationId },
    select: { id: true, title: true },
  });
  if (!project) throw new Error("Chantier introuvable ou hors organisation");

  const updated = await prisma.commercialQuote.update({
    where: { id: quote.id },
    data: { projectId: project.id },
  });

  return { quote: updated, project };
}

export async function createProjectFromAcceptedQuote(opts: {
  organizationId: string;
  quoteId: string;
  /** User propriétaire du Project (role CLIENT / owner org). */
  clientUserId?: string;
  title?: string;
  siteAddress?: string | null;
  siteCity?: string | null;
}) {
  const quote = await prisma.commercialQuote.findFirst({
    where: { id: opts.quoteId, organizationId: opts.organizationId },
    select: {
      id: true,
      status: true,
      projectId: true,
      subject: true,
      siteAddressSnapshot: true,
      totalSellHt: true,
    },
  });
  if (!quote) throw new Error("Devis introuvable");
  if (quote.status !== "ACCEPTED") {
    throw new Error("Seuls les devis acceptés peuvent créer un chantier");
  }
  if (quote.projectId) {
    throw new Error("Ce devis est déjà lié à un chantier");
  }

  const title = (opts.title ?? quote.subject).trim();
  if (!title) throw new Error("Nom du chantier obligatoire");

  const clientUserId =
    opts.clientUserId ?? (await resolveOrgOwnerUserId(opts.organizationId));

  const address =
    opts.siteAddress !== undefined
      ? opts.siteAddress
      : quote.siteAddressSnapshot;

  const project = await prisma.project.create({
    data: {
      title,
      clientId: clientUserId,
      organizationId: opts.organizationId,
      siteAddress: address?.trim() || null,
      siteCity: opts.siteCity?.trim() || null,
      chantierStatus: "ETUDE",
      status: mapChantierToProjectStatus("ETUDE"),
      signedQuoteAmount: quote.totalSellHt,
      description: `Créé depuis le devis commercial accepté.`,
    },
  });

  await ensureChantierFolders(project.id).catch(() => null);

  await prisma.commercialQuote.update({
    where: { id: quote.id },
    data: { projectId: project.id },
  });

  return project;
}
