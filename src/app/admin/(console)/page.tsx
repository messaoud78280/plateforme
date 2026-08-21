import Link from "next/link";
import {
  getPlatformOverviewKpis,
  listStandardOrganizations,
  activationBandLabel,
  formatRelativeActivity,
} from "@/lib/platform-admin/metrics";
import { daysRemainingInTrial, SAAS_TRIAL_DAYS } from "@/lib/organization/lifecycle";
import { prisma } from "@/lib/prisma";
import { effectiveSaasStatus } from "@/lib/organization/lifecycle";

export default async function AdminHomePage() {
  const kpis = await getPlatformOverviewKpis();

  const recent = await prisma.organization.findMany({
    where: { kind: "STANDARD" },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      id: true,
      name: true,
      createdAt: true,
      saasStatus: true,
      trialStartedAt: true,
      trialEndsAt: true,
    },
  });

  const { rows: trialRows } = await listStandardOrganizations({
    trialOnly: true,
    take: 40,
  });
  const watch = [...trialRows]
    .sort((a, b) => (a.trialDaysRemaining ?? 99) - (b.trialDaysRemaining ?? 99))
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-bework-navy">Vue d’ensemble</h2>
        <p className="mt-1 text-[14px] text-slate-600">
          Pilotage SaaS — organisations STANDARD uniquement (hors démo).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: "Entreprises", value: kpis.organizations },
          { label: "Essais actifs", value: kpis.trials },
          { label: "Actives", value: kpis.active },
          { label: "Essais expirés", value: kpis.expired },
          { label: "Suspendues", value: kpis.suspended },
          { label: "Utilisateurs", value: kpis.users },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-bework-navy/10 bg-white p-4 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {k.label}
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-bework-navy">{k.value}</p>
          </div>
        ))}
      </div>

      <p className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-3 text-[13px] text-slate-500">
        Abonnements / MRR / ARR — disponibles lorsque Stripe sera branché. Non simulé.
      </p>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-sm">
          <h3 className="text-[15px] font-semibold text-bework-navy">Essais à surveiller</h3>
          <ul className="mt-4 space-y-3">
            {watch.length === 0 ? (
              <li className="text-[13px] text-slate-500">Aucun essai en cours.</li>
            ) : (
              watch.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/organisations/${o.id}`}
                    className="flex items-start justify-between gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-bework-ink">{o.name}</p>
                      <p className="text-[12px] text-slate-500">
                        J{(SAAS_TRIAL_DAYS - (o.trialDaysRemaining ?? 0))} / {SAAS_TRIAL_DAYS} ·{" "}
                        Activation {o.activationPercent} % · {activationBandLabel(o.activationBand)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[12px] font-medium text-bework-accent">
                      {o.trialDaysRemaining ?? "—"} j
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-sm">
          <h3 className="text-[15px] font-semibold text-bework-navy">Dernières inscriptions</h3>
          <ul className="mt-4 space-y-3">
            {recent.map((o) => {
              const st = effectiveSaasStatus(o);
              const days = daysRemainingInTrial(o);
              return (
                <li key={o.id}>
                  <Link
                    href={`/admin/organisations/${o.id}`}
                    className="flex items-start justify-between gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-[14px] font-semibold text-bework-ink">{o.name}</p>
                      <p className="text-[12px] text-slate-500">
                        {formatRelativeActivity(o.createdAt)} · {st}
                        {days != null ? ` · J${SAAS_TRIAL_DAYS - days}/${SAAS_TRIAL_DAYS}` : ""}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
