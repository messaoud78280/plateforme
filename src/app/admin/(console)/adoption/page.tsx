import Link from "next/link";
import {
  listStandardOrganizations,
  activationBandLabel,
} from "@/lib/platform-admin/metrics";
import { SAAS_TRIAL_DAYS } from "@/lib/organization/lifecycle";

export default async function AdminAdoptionPage() {
  const { rows } = await listStandardOrganizations({ take: 100 });
  const trials = rows
    .filter((r) => r.effectiveStatus === "TRIAL")
    .sort((a, b) => b.activationPercent - a.activationPercent);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-bework-navy">Adoption</h2>
        <p className="mt-1 text-[14px] text-slate-600">
          Essais triés par score d’activation — repérer qui teste vraiment BeWork.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {trials.map((o) => (
          <Link
            key={o.id}
            href={`/admin/organisations/${o.id}`}
            className="rounded-2xl border border-bework-navy/10 bg-white p-4 shadow-sm hover:border-bework-accent/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-bework-ink">{o.name}</p>
                <p className="mt-1 text-[12px] text-slate-500">
                  J{SAAS_TRIAL_DAYS - (o.trialDaysRemaining ?? 0)} / {SAAS_TRIAL_DAYS}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold tabular-nums text-bework-navy">
                  {o.activationPercent} %
                </p>
                <p className="text-[11px] text-slate-500">
                  {activationBandLabel(o.activationBand)}
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-bework-accent"
                style={{ width: `${o.activationPercent}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
      {trials.length === 0 ? (
        <p className="text-[14px] text-slate-500">Aucun essai à analyser.</p>
      ) : null}
    </div>
  );
}
