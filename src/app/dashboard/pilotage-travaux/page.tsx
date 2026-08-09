import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { PilotageSubNav } from "@/components/pilotage/PilotageSubNav";
import { PilotagePortfolioView } from "@/components/pilotage/PilotagePortfolioView";
import {
  canEditPilotageOperational,
  requirePilotageSession,
} from "@/lib/pilotage/access";
import { isChantierStaff } from "@/lib/chantier-dossier/access";
import { projectWhereForClientUser } from "@/lib/organization/access";
import { loadPilotagePortfolio } from "@/lib/pilotage/load-pilotage-portfolio";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function first(sp: SP, key: string) {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function PilotageTravauxPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const session = await requirePilotageSession();
  const sp = await searchParams;
  const q = (first(sp, "q") ?? "").trim();

  const staff = isChantierStaff(session.user.role);
  const whereProject = staff
    ? session.user.role === "AGENT"
      ? { assignedToId: session.user.id }
      : {}
    : await projectWhereForClientUser(session.user.id);

  const portfolio = await loadPilotagePortfolio({
    user: {
      id: session.user.id,
      role: session.user.role,
      personType: session.user.personType,
      permissionProfile: session.user.permissionProfile,
    },
    whereProject,
    search: q || undefined,
  });

  const { rows, summary } = portfolio;
  const canEdit = canEditPilotageOperational(session.user.role);

  const summaryParts = [
    `${summary.chantiers} chantier${summary.chantiers !== 1 ? "s" : ""}`,
    summary.withAttention > 0 ? `${summary.withAttention} à surveiller` : null,
    summary.attentionItems > 0 ? `${summary.attentionItems} à traiter` : null,
    summary.weekDeadlines > 0
      ? `${summary.weekDeadlines} échéance${summary.weekDeadlines > 1 ? "s" : ""} cette semaine`
      : null,
    summary.deliveriesToConfirm > 0
      ? `${summary.deliveriesToConfirm} livraison${summary.deliveriesToConfirm > 1 ? "s" : ""} à confirmer`
      : null,
    summary.criticalBlockers > 0
      ? `${summary.criticalBlockers} blocage${summary.criticalBlockers > 1 ? "s" : ""} critique${summary.criticalBlockers > 1 ? "s" : ""}`
      : null,
    summary.visasPending > 0 ? `${summary.visasPending} visa${summary.visasPending > 1 ? "s" : ""}` : null,
    summary.doeAtRisk > 0 ? `${summary.doeAtRisk} DOE à risque` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Vue d’ensemble"
        title="Pilotage travaux"
        description="Supervisez l’ensemble de vos chantiers et repérez immédiatement les écarts — sans ressaisir un deuxième dossier."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/dashboard/a-traiter" className="btn-cc-secondary">
              À traiter
            </Link>
            <Link href="/dashboard/agenda" className="btn-cc-secondary">
              Agenda
            </Link>
            {canEdit ? (
              <details className="relative">
                <summary className="btn-cc-ghost cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                  •••
                </summary>
                <div className="absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded-[var(--bw-radius-panel,1.125rem)] border border-slate-200 bg-white py-1 shadow-lg">
                  <Link
                    href={`${PILOTAGE_LIST_PATH}/nouveau`}
                    className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                  >
                    Configurer suivi contractuel
                  </Link>
                  <Link
                    href={`${PILOTAGE_LIST_PATH}/blocages`}
                    className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                  >
                    Blocages contractuels
                  </Link>
                  <Link
                    href={`${PILOTAGE_LIST_PATH}/modeles`}
                    className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                  >
                    Modèles marché
                  </Link>
                  <Link
                    href={`${PILOTAGE_LIST_PATH}/calendrier`}
                    className="block px-3 py-2 text-sm text-slate-800 hover:bg-slate-50"
                  >
                    Calendrier contractuel
                  </Link>
                </div>
              </details>
            ) : null}
          </div>
        }
      />

      <PilotageSubNav />

      <p className="text-[13px] font-medium text-slate-600">
        {summaryParts.length > 0 ? summaryParts.join(" · ") : "Aucun chantier dans le périmètre."}
      </p>

      <PilotagePortfolioView rows={rows} canConfigureContractuel={canEdit} />
    </div>
  );
}
