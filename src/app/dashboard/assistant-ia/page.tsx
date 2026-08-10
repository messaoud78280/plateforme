import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { getCachedDemoExpiry } from "@/lib/auth/cached-dashboard-user";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import { canAccessAssistantIa } from "@/lib/assistant-ia/access";
import { getAIProviderStatus } from "@/lib/assistant-ia/status";
import { filterAssistantIaToolsForPlatform } from "@/lib/assistant-ia/tools";
import { getCurrentPlatformConfig } from "@/lib/platform/config";
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

  const isDemo = Boolean(session.user.isDemo);
  let loginIdentifier: string | null = null;
  let organizationId: string | null = null;
  let logoUrl: string | null = null;
  if (isDemo && session.user.demoEnvironmentId) {
    const demo = await getCachedDemoExpiry(session.user.demoEnvironmentId);
    loginIdentifier = demo?.loginIdentifier ?? null;
    organizationId = demo?.organizationId ?? null;
    logoUrl = demo?.logoUrl ?? null;
  }

  const platform = getCurrentPlatformConfig({
    isDemo,
    organizationId,
    loginIdentifier,
    companyName: session.user.demoCompanyName ?? null,
    logoUrl,
  });

  const status = getAIProviderStatus();
  const tools = filterAssistantIaToolsForPlatform(platform.features.aiTools);

  return (
    <div className="space-y-4">
      <BackLink href="/dashboard">Accueil</BackLink>
      <AssistantIaHub status={status} tools={tools} />
    </div>
  );
}
