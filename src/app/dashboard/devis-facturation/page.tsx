import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { canShowCommercialPurchases } from "@/lib/commercial/workspace-nav";
import { resolveDashboardPeriod } from "@/lib/commercial/dashboard-periods";
import { getCommercialDashboardMetrics } from "@/lib/commercial/dashboard-metrics";
import { CommercialDashboard } from "@/components/commercial/dashboard/CommercialDashboard";

export const dynamic = "force-dynamic";

export default async function DevisFacturationDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    from?: string;
    to?: string;
    clientId?: string;
    projectId?: string;
  }>;
}) {
  const session = await requireCommercialSession();
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;

  const sp = await searchParams;
  const period = resolveDashboardPeriod({
    preset: sp.period,
    from: sp.from,
    to: sp.to,
  });
  const clientId = sp.clientId?.trim() || undefined;
  const projectId = sp.projectId?.trim() || undefined;

  const metrics = await getCommercialDashboardMetrics({
    orgId,
    period,
    clientId,
    projectId,
    canSeePurchases: canShowCommercialPurchases({
      personType: session.user.personType,
      permissionProfile: session.user.permissionProfile,
    }),
  });

  return (
    <CommercialDashboard
      initial={metrics}
      initialClientId={clientId}
      initialProjectId={projectId}
    />
  );
}
