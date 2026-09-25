import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import { canAccessSiteVisits, resolveSiteVisitsOrgId } from "@/lib/site-visits/access";
import { listOrgProjectsForPrep, listPrepStudies } from "@/lib/preparation/service";
import { PrepStudiesHub } from "@/components/preparation/PrepStudiesHub";

export const dynamic = "force-dynamic";

export default async function EtudesMetrePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/visites-metres/etudes");
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

  const { projectId } = await searchParams;
  const [studies, projects] = await Promise.all([
    listPrepStudies(orgId, { projectId: projectId || null }),
    listOrgProjectsForPrep(orgId),
  ]);

  return <PrepStudiesHub studies={studies} projects={projects} projectId={projectId || null} />;
}
