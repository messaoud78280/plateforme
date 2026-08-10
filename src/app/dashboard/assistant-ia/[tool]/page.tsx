import { notFound, redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import { canAccessAssistantIa } from "@/lib/assistant-ia/access";
import { getAIProviderStatus } from "@/lib/assistant-ia/status";
import { getAssistantIaTool } from "@/lib/assistant-ia/tools";
import { AssistantIaToolDetail } from "@/components/assistant-ia/AssistantIaToolDetail";

export const dynamic = "force-dynamic";

export default async function AssistantIaToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
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

  const { tool: toolId } = await params;
  const tool = getAssistantIaTool(toolId);
  if (!tool) notFound();

  return <AssistantIaToolDetail tool={tool} status={getAIProviderStatus()} />;
}
