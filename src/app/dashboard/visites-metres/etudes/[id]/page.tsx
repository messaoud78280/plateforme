import { notFound, redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import { canAccessSiteVisits, resolveSiteVisitsOrgId } from "@/lib/site-visits/access";
import { getPrepStudyView, listOrgProjectsForPrep } from "@/lib/preparation/service";
import { PrepStudyWorkspace } from "@/components/preparation/PrepStudyWorkspace";

export const dynamic = "force-dynamic";

export default async function EtudeMetreDetailPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;
  const [study, projects] = await Promise.all([getPrepStudyView(orgId, id), listOrgProjectsForPrep(orgId)]);
  if (!study) notFound();

  return <PrepStudyWorkspace initial={study} projects={projects} />;
}
