import {
  getOrganizationActivationSnapshot,
} from "@/lib/organization/activation";
import {
  requireOrganizationContext,
  TenantAccessError,
} from "@/lib/organization/tenant";
import { ActivationChecklistCard } from "@/components/saas/ActivationChecklistCard";
import { SpaceReadyBanner } from "@/components/saas/SpaceReadyBanner";

/** Guide d’activation facultatif sur l’accueil — n’autorise / n’interdit aucune fonction. */
export async function SaasActivationHomeBlock({
  user,
}: {
  user: {
    id: string;
    role?: string | null;
    personType?: string | null;
    permissionProfile?: string | null;
    isDemo?: boolean;
    demoRootUserId?: string | null;
  };
}) {
  if (user.isDemo) return null;

  let ctx;
  try {
    ctx = await requireOrganizationContext(user);
  } catch (e) {
    if (e instanceof TenantAccessError) return null;
    throw e;
  }

  if (ctx.organization.kind === "DEMO") return null;

  const snapshot = await getOrganizationActivationSnapshot(ctx.organizationId);

  if (snapshot.percent >= 100) {
    return <SpaceReadyBanner organizationId={ctx.organizationId} />;
  }

  if (ctx.organization.onboardingCompletedAt) return null;

  const show =
    ctx.effectiveStatus === "TRIAL" ||
    ctx.organization.onboardingStep != null ||
    snapshot.percent < 100;
  if (!show) return null;

  return (
    <ActivationChecklistCard
      percent={snapshot.percent}
      items={snapshot.items}
      companyName={ctx.organization.name}
      maturity={snapshot.maturity}
      organizationId={ctx.organizationId}
    />
  );
}
