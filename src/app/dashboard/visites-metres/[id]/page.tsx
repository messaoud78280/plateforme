import { redirect, notFound } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import {
  canAccessSiteVisits,
  canCreateQuoteFromVisit,
  resolveSiteVisitsOrgId,
} from "@/lib/site-visits/access";
import { getSiteVisit } from "@/lib/site-visits/service";
import { SiteVisitDetailClient } from "@/components/site-visits/SiteVisitDetailClient";
import { SiteVisitSimpleClient } from "@/components/site-visits/SiteVisitSimpleClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VisiteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; vue?: string }>;
}) {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/visites-metres");
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

  const { id } = await params;
  const { tab, vue } = await searchParams;
  const visit = await getSiteVisit(orgId, id);
  if (!visit) notFound();

  if (vue === "avancee") {
    return (
      <SiteVisitDetailClient
        initial={visit}
        canCreateQuote={canCreateQuoteFromVisit(session.user)}
        initialTab={tab}
      />
    );
  }

  const [clients, members] = await Promise.all([
    prisma.externalOrganization.findMany({
      where: {
        hostOrganizationId: orgId,
        status: "ACTIVE",
        type: { in: ["CLIENT_EXT", "CLIENT"] },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        address: true,
        city: true,
        zipCode: true,
        contacts: {
          take: 5,
          orderBy: { isPrimary: "desc" },
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            isPrimary: true,
          },
        },
      },
      orderBy: { name: "asc" },
      take: 200,
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
    <SiteVisitSimpleClient
      initial={visit}
      canCreateQuote={canCreateQuoteFromVisit(session.user)}
      clients={clients.map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        address: c.address,
        city: c.city,
        zipCode: c.zipCode,
        contacts: c.contacts.map((ct) => ({
          name: [ct.firstName, ct.lastName].filter(Boolean).join(" ").trim() || "Contact",
          phone: ct.phone,
          email: ct.email,
          isPrimary: ct.isPrimary,
        })),
      }))}
      users={members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
      }))}
    />
  );
}
