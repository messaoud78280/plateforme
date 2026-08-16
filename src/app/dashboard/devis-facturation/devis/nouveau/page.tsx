import { redirect } from "next/navigation";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";
import { CreateQuoteForm } from "@/components/commercial/CreateQuoteForm";
import { ensureCommercialOrgSettings } from "@/lib/commercial/settings";
import { d } from "@/lib/commercial/decimal";

export const dynamic = "force-dynamic";

export default async function NouveauDevisPage() {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/devis/nouveau",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) redirect("/dashboard/devis-facturation");

  const [clients, projects, settings, quotesWithProjects] = await Promise.all([
    prisma.externalOrganization.findMany({
      where: {
        hostOrganizationId: orgId,
        type: { in: ["CLIENT_EXT", "CLIENT"] },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        tradeName: true,
        email: true,
        phone: true,
        city: true,
        address: true,
        zipCode: true,
        siret: true,
        contacts: {
          where: { isPrimary: true },
          take: 1,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            jobTitle: true,
          },
        },
      },
      orderBy: { name: "asc" },
      take: 200,
    }),
    prisma.project.findMany({
      where: { organizationId: orgId },
      select: { id: true, title: true, siteAddress: true, siteCity: true },
      orderBy: { updatedAt: "desc" },
      take: 80,
    }),
    ensureCommercialOrgSettings(orgId),
    prisma.commercialQuote.findMany({
      where: {
        organizationId: orgId,
        projectId: { not: null },
        clientExternalOrgId: { not: null },
      },
      select: { projectId: true, clientExternalOrgId: true },
      take: 500,
    }),
  ]);

  const clientsMapped = (
    clients.length > 0
      ? clients
      : await prisma.externalOrganization.findMany({
          where: { hostOrganizationId: orgId, status: "ACTIVE" },
          select: {
            id: true,
            name: true,
            tradeName: true,
            email: true,
            phone: true,
            city: true,
            address: true,
            zipCode: true,
            siret: true,
            contacts: {
              where: { isPrimary: true },
              take: 1,
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                jobTitle: true,
              },
            },
          },
          orderBy: { name: "asc" },
          take: 200,
        })
  ).map((c) => ({
    id: c.id,
    name: c.name,
    tradeName: c.tradeName,
    email: c.email,
    phone: c.phone,
    city: c.city,
    address: c.address,
    zipCode: c.zipCode,
    siret: c.siret,
    primaryContact: c.contacts[0]
      ? {
          id: c.contacts[0].id,
          firstName: c.contacts[0].firstName,
          lastName: c.contacts[0].lastName,
          email: c.contacts[0].email,
          phone: c.contacts[0].phone,
          jobTitle: c.contacts[0].jobTitle,
        }
      : null,
  }));

  const linkedByProject = new Map<string, Set<string>>();
  for (const q of quotesWithProjects) {
    if (!q.projectId || !q.clientExternalOrgId) continue;
    const set = linkedByProject.get(q.projectId) ?? new Set();
    set.add(q.clientExternalOrgId);
    linkedByProject.set(q.projectId, set);
  }

  const projectsWithLinks = projects.map((p) => ({
    ...p,
    linkedClientIds: [...(linkedByProject.get(p.id) ?? [])],
  }));

  const preparedByName =
    [session.user.name].filter(Boolean).join(" ").trim() ||
    session.user.email ||
    null;

  return (
    <CreateQuoteForm
      clients={clientsMapped}
      projects={projectsWithLinks}
      defaultValidityDays={settings.defaultValidityDays}
      defaultVatRate={d(settings.defaultVatRate)}
      defaultCurrency={settings.defaultCurrency}
      defaultPaymentTerms={settings.defaultPaymentTerms}
      preparedByName={preparedByName}
    />
  );
}
