import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

/** Rôles autorisés sur les skills internes BeWork (équipe bureau-chantier). */
export function canAccessBeWorkSkills(role: string | undefined | null): boolean {
  return role === "MANAGER" || role === "AGENCE" || role === "AGENT";
}

export async function requireBeWorkSkillsSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/skills/cctp");
  }
  if (!canAccessBeWorkSkills(session.user.role)) {
    redirect("/dashboard");
  }
  const { assertDashboardHrefAllowed } = await import(
    "@/lib/equipe-acces/assert-dashboard-access"
  );
  assertDashboardHrefAllowed({
    href: "/dashboard/skills",
    personType: session.user.personType,
    permissionProfile: session.user.permissionProfile,
  });
  return session;
}
