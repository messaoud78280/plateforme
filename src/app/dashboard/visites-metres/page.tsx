import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import {
  canAccessSiteVisits,
  canCreateQuoteFromVisit,
  resolveSiteVisitsOrgId,
} from "@/lib/site-visits/access";
import { listSiteVisitKpis, listSiteVisits } from "@/lib/site-visits/service";
import { dateRangeFromPreset } from "@/lib/site-visits/types";
import { SiteVisitsWorkspace } from "@/components/site-visits/SiteVisitsWorkspace";
import type { SiteVisitStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function VisitesMetresPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    view?: string;
    date?: string;
    responsibleId?: string;
    projectId?: string;
    lot?: string;
    state?: string;
  }>;
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

  const sp = await searchParams;
  const range = dateRangeFromPreset(sp.date);
  const mine = sp.view === "mine";
  const [visits, kpis] = await Promise.all([
    listSiteVisits({
      organizationId: orgId,
      status: (sp.status as SiteVisitStatus) || null,
      q: sp.q,
      responsibleId: mine ? session.user.id : sp.responsibleId,
      from: range?.from ?? null,
      to: range?.to ?? null,
      projectId: sp.projectId,
      lot: sp.lot,
      state: sp.state,
    }),
    listSiteVisitKpis(orgId),
  ]);

  return (
    <SiteVisitsWorkspace
      initialVisits={visits}
      kpis={kpis}
      canCreateQuote={canCreateQuoteFromVisit(session.user)}
      currentUserId={session.user.id}
      initialView={sp.view === "pipeline" ? "pipeline" : mine ? "mine" : "list"}
      initialStatus={sp.status ?? ""}
      initialQ={sp.q ?? ""}
      initialDate={sp.date ?? ""}
      initialLot={sp.lot ?? ""}
      initialState={sp.state ?? ""}
    />
  );
}
