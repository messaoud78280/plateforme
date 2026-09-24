import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { canShowCommercialPurchases } from "@/lib/commercial/workspace-nav";
import { resolveDashboardPeriod } from "@/lib/commercial/dashboard-periods";
import {
  getCommercialDashboardMetrics,
  type CommercialDashboardMetrics,
} from "@/lib/commercial/dashboard-metrics";
import { CommercialDashboard } from "@/components/commercial/dashboard/CommercialDashboard";

export const dynamic = "force-dynamic";

/** Garantit un payload JSON-safe pour le composant client (pas de Decimal / Date). */
function toClientMetrics(
  metrics: CommercialDashboardMetrics,
): CommercialDashboardMetrics {
  return JSON.parse(JSON.stringify(metrics)) as CommercialDashboardMetrics;
}

function DashboardLoadFallback({
  message,
  digest,
}: {
  message: string;
  digest?: string;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center"
    >
      <div className="w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-left text-red-900">
        <p className="font-semibold">Impossible de charger la vue d’ensemble</p>
        <p className="mt-2 text-sm opacity-90">{message}</p>
        {digest ? (
          <p className="mt-2 text-xs opacity-70">
            Référence : <code className="font-mono">{digest}</code>
          </p>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link
          href="/dashboard/devis-facturation"
          className="btn-cc-primary inline-flex h-10 items-center px-4"
        >
          Réessayer
        </Link>
        <Link
          href="/dashboard/devis-facturation/devis"
          className="btn-cc-secondary inline-flex h-10 items-center px-4"
        >
          Aller aux devis
        </Link>
      </div>
    </div>
  );
}

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
  try {
    const session = await requireCommercialSession();
    const orgId = await resolveCommercialOrgId(session.user);
    if (!orgId) {
      return (
        <DashboardLoadFallback message="Organisation introuvable pour ce compte. Reconnectez-vous ou contactez le support." />
      );
    }

    const sp = await searchParams;
    const period = resolveDashboardPeriod({
      preset: sp.period,
      from: sp.from,
      to: sp.to,
    });
    const clientId = sp.clientId?.trim() || undefined;
    const projectId = sp.projectId?.trim() || undefined;

    let metrics: CommercialDashboardMetrics;
    try {
      metrics = await getCommercialDashboardMetrics({
        orgId,
        period,
        clientId,
        projectId,
        canSeePurchases: canShowCommercialPurchases({
          personType: session.user.personType,
          permissionProfile: session.user.permissionProfile,
        }),
      });
    } catch (err) {
      console.error("[devis-facturation] metrics failed", {
        orgId,
        period: period.preset,
        err,
      });
      const msg = err instanceof Error ? err.message : String(err ?? "");
      const poolSaturated =
        /EMAXCONNSESSION|max clients reached|Can't reach database server|P1001|P2024/i.test(
          msg,
        );
      return (
        <DashboardLoadFallback
          message={
            poolSaturated
              ? "La base est temporairement saturée. Réessayez dans quelques secondes — les listes Devis et Factures restent accessibles."
              : "Le calcul des indicateurs a échoué. Réessayez dans un instant. Les listes Devis et Factures restent accessibles."
          }
        />
      );
    }

    let clientMetrics: CommercialDashboardMetrics;
    try {
      clientMetrics = toClientMetrics(metrics);
    } catch (err) {
      console.error("[devis-facturation] metrics serialize failed", err);
      return (
        <DashboardLoadFallback message="Les données du cockpit n’ont pas pu être préparées pour l’affichage." />
      );
    }

    return (
      <CommercialDashboard
        initial={clientMetrics}
        initialClientId={clientId}
        initialProjectId={projectId}
      />
    );
  } catch (err) {
    if (isRedirectError(err)) throw err;
    console.error("[devis-facturation] page failed", err);
    return (
      <DashboardLoadFallback message="Une erreur inattendue a empêché l’ouverture du cockpit. Réessayez ou ouvrez directement la liste des devis." />
    );
  }
}
