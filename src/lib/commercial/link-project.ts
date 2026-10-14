/**
 * GESTION-COMMERCIALE-V1B — pont devis accepté ↔ chantier (org-scoped).
 */
import { prisma } from "@/lib/prisma";
import { mapChantierToProjectStatus } from "@/lib/chantier-lifecycle";
import { ensureChantierFolders } from "@/lib/chantier-dossier/folders";

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
  const project = await prisma.$transaction(async (tx) => {
    const quote = await tx.commercialQuote.findFirst({
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

    let clientUserId = opts.clientUserId;
    if (!clientUserId) {
      const org = await tx.organization.findUnique({
        where: { id: opts.organizationId },
        select: { ownerUserId: true },
      });
      if (!org?.ownerUserId) {
        throw new Error("Propriétaire organisation introuvable");
      }
      clientUserId = org.ownerUserId;
    }

    const address =
      opts.siteAddress !== undefined
        ? opts.siteAddress
        : quote.siteAddressSnapshot;

    const created = await tx.project.create({
      data: {
        title,
        clientId: clientUserId,
        organizationId: opts.organizationId,
        siteAddress: address?.trim() || null,
        siteCity: opts.siteCity?.trim() || null,
        chantierStatus: "ETUDE",
        status: mapChantierToProjectStatus("ETUDE"),
        signedQuoteAmount: quote.totalSellHt,
        description: "Créé depuis le devis commercial accepté.",
      },
    });

    const linked = await tx.commercialQuote.updateMany({
      where: {
        id: quote.id,
        organizationId: opts.organizationId,
        status: "ACCEPTED",
        projectId: null,
      },
      data: { projectId: created.id },
    });
    if (linked.count !== 1) {
      throw new Error("Ce devis vient d’être lié à un autre chantier");
    }
    return created;
  });

  // Les rubriques sont dérivées et réparables ; le lien devis↔chantier est déjà atomique.
  await ensureChantierFolders(project.id).catch((error) => {
    console.error("[link-project] Initialisation des rubriques:", error);
  });

  return project;
}
