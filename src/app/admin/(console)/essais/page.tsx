import Link from "next/link";
import {
  listStandardOrganizations,
  activationBandLabel,
} from "@/lib/platform-admin/metrics";
import { SAAS_TRIAL_DAYS } from "@/lib/organization/lifecycle";

export default async function AdminEssaisPage() {
  const { rows } = await listStandardOrganizations({ trialOnly: true, take: 100 });
  const sorted = [...rows].sort(
    (a, b) => (a.trialDaysRemaining ?? 99) - (b.trialDaysRemaining ?? 99),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-bework-navy">Essais</h2>
        <p className="mt-1 text-[14px] text-slate-600">
          {sorted.length} essai{sorted.length !== 1 ? "s" : ""} en cours
        </p>
      </div>
      <ul className="space-y-2">
        {sorted.map((o) => (
          <li key={o.id}>
            <Link
              href={`/admin/organisations/${o.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-bework-navy/10 bg-white px-4 py-3 shadow-sm hover:border-bework-accent/30"
            >
              <div>
                <p className="font-semibold text-bework-ink">{o.name}</p>
                <p className="text-[12px] text-slate-500">
                  J{SAAS_TRIAL_DAYS - (o.trialDaysRemaining ?? 0)} / {SAAS_TRIAL_DAYS} · Activation{" "}
                  {o.activationPercent} % · {activationBandLabel(o.activationBand)}
                </p>
              </div>
              <span className="text-[13px] font-semibold text-bework-accent">
                {o.trialDaysRemaining ?? "—"} j restants
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {sorted.length === 0 ? (
        <p className="text-[14px] text-slate-500">Aucun essai actif.</p>
      ) : null}
    </div>
  );
}
