import { getOrganizationActivationSnapshot } from "@/lib/organization/activation";
import {
  requireOrganizationContext,
  TenantAccessError,
} from "@/lib/organization/tenant";
import { ActivationChecklistCard } from "@/components/saas/ActivationChecklistCard";

/** Checklist d’activation sur l’accueil — uniquement trial / onboarding incomplet. */
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
  if (ctx.organization.onboardingCompletedAt) return null;

  const snapshot = await getOrganizationActivationSnapshot(ctx.organizationId);
  if (snapshot.percent >= 100) return null;

  // Afficher surtout en trial ou si onboarding démarré / incomplet
  const show =
    ctx.effectiveStatus === "TRIAL" ||
    ctx.organization.onboardingStep != null ||
    snapshot.percent < 50;
  if (!show) return null;

  return (
    <ActivationChecklistCard
      compact
      percent={snapshot.percent}
      items={snapshot.items}
      trialDaysRemaining={ctx.trialDaysRemaining}
      companyName={ctx.organization.name}
    />
  );
}
