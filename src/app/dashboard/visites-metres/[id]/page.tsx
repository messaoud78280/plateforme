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

export const dynamic = "force-dynamic";

export default async function VisiteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
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
  const visit = await getSiteVisit(orgId, id);
  if (!visit) notFound();

  return (
    <SiteVisitDetailClient
      initial={visit}
      canCreateQuote={canCreateQuoteFromVisit(session.user)}
    />
  );
}
