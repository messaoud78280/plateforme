import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import {
  canAccessSiteVisits,
  resolveSiteVisitsOrgId,
} from "@/lib/site-visits/access";
import { prisma } from "@/lib/prisma";
import { SiteVisitCreateClient } from "@/components/site-visits/SiteVisitCreateClient";

export const dynamic = "force-dynamic";

export default async function NouvelleVisitePage() {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/visites-metres/nouveau");
  }
  if (!canAccessSiteVisits(session.user)) {
    redirect("/dashboard");
  }
  assertDashboardHrefAllowed({
    href: "/dashboard/visites-metres",
    personType: session.user.personType,
    permissionProfile: session.user.permissionProfile,
  });
  const orgId = await resolveSiteVisitsOrgId(session.user);
  if (!orgId) redirect("/dashboard");

  const [clients, projects, members] = await Promise.all([
    prisma.externalOrganization.findMany({
      where: {
        hostOrganizationId: orgId,
        status: "ACTIVE",
        type: { in: ["CLIENT_EXT", "CLIENT"] },
      },
      select: {
        id: true,
        name: true,
        tradeName: true,
        phone: true,
        address: true,
        city: true,
        zipCode: true,
        contacts: {
          take: 5,
          orderBy: { isPrimary: "desc" },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            jobTitle: true,
            isPrimary: true,
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
    prisma.organizationMember.findMany({
      where: { organizationId: orgId },
      select: {
        user: { select: { id: true, name: true, email: true } },
      },
      take: 80,
    }),
  ]);

  return (
    <SiteVisitCreateClient
      currentUserId={session.user.id}
      clients={clients.map((c) => ({
        id: c.id,
        name: c.tradeName || c.name,
        phone: c.phone,
        address: c.address,
        city: c.city,
        zipCode: c.zipCode,
        contacts: c.contacts.map((ct) => ({
          id: ct.id,
          name: [ct.firstName, ct.lastName].filter(Boolean).join(" ").trim(),
          phone: ct.phone,
          email: ct.email,
          jobTitle: ct.jobTitle,
          isPrimary: ct.isPrimary,
        })),
      }))}
      projects={projects}
      users={members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email ?? "",
      }))}
    />
  );
}
