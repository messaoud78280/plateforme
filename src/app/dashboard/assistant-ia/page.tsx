import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import { canAccessAssistantIa } from "@/lib/assistant-ia/access";
import { getAIProviderStatus } from "@/lib/assistant-ia/status";
import { AssistantIaHub } from "@/components/assistant-ia/AssistantIaHub";
import { BackLink } from "@/components/ui/BackLink";

export const dynamic = "force-dynamic";

export default async function AssistantIaPage() {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/assistant-ia");
  }

  if (
    !canAccessAssistantIa({
      role: session.user.role,
      personType: session.user.personType,
      permissionProfile: session.user.permissionProfile,
    })
  ) {
    redirect("/dashboard");
  }

  assertDashboardHrefAllowed({
    href: "/dashboard/assistant-ia",
    personType: session.user.personType,
    permissionProfile: session.user.permissionProfile,
  });

  const status = getAIProviderStatus();

  return (
    <div className="space-y-4">
      <BackLink href="/dashboard">Accueil</BackLink>
      <AssistantIaHub status={status} />
    </div>
  );
}
