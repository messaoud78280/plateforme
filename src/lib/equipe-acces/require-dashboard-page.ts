import { getCachedServerSession } from "@/lib/auth/cached-session";
import { redirect } from "next/navigation";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";

/** Auth + garde persona pour une page dashboard. */
export async function requireDashboardPageAccess(href: string) {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    redirect(`/connexion?callbackUrl=${encodeURIComponent(href)}`);
  }
  assertDashboardHrefAllowed({
    href,
    personType: session.user.personType,
    permissionProfile: session.user.permissionProfile,
  });
  return session;
}
