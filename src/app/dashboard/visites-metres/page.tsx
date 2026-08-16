import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import {
  canAccessSiteVisits,
  canCreateQuoteFromVisit,
  resolveSiteVisitsOrgId,
} from "@/lib/site-visits/access";
import { listSiteVisits } from "@/lib/site-visits/service";
import { SiteVisitsWorkspace } from "@/components/site-visits/SiteVisitsWorkspace";

export const dynamic = "force-dynamic";

export default async function VisitesMetresPage() {
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

  const visits = await listSiteVisits({ organizationId: orgId });

  return (
    <SiteVisitsWorkspace
      initialVisits={visits}
      canCreateQuote={canCreateQuoteFromVisit(session.user)}
    />
  );
}
