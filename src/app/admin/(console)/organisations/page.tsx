import Link from "next/link";
import {
  listStandardOrganizations,
  activationBandLabel,
} from "@/lib/platform-admin/metrics";

export default async function AdminOrganisationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; trial?: string }>;
}) {
  const sp = await searchParams;
  const { rows, total } = await listStandardOrganizations({
    q: sp.q,
    status: sp.status,
    trialOnly: sp.trial === "1",
    take: 80,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-bework-navy">Entreprises</h2>
          <p className="mt-1 text-[14px] text-slate-600">
            {total} organisation{total !== 1 ? "s" : ""} STANDARD
          </p>
        </div>
        <form className="flex flex-wrap gap-2" method="get">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Recherche nom / email…"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px]"
          />
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[14px]"
          >
            <option value="">Tous statuts</option>
            <option value="TRIAL">TRIAL</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="TRIAL_EXPIRED">TRIAL_EXPIRED</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px]">
            <input type="checkbox" name="trial" value="1" defaultChecked={sp.trial === "1"} />
            Essais seulement
          </label>
          <button
            type="submit"
            className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-semibold text-white"
          >
            Filtrer
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-bework-navy/10 bg-white shadow-sm">
        <table className="min-w-full text-left text-[13px]">
          <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Entreprise</th>
              <th className="px-4 py-3 font-semibold">Owner</th>
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold">Essai</th>
              <th className="px-4 py-3 font-semibold">Activation</th>
              <th className="px-4 py-3 font-semibold">Users</th>
              <th className="px-4 py-3 font-semibold">Activité</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-bework-ink">{o.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {o.createdAt.toLocaleDateString("fr-FR")}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p>{o.ownerName}</p>
                  <p className="text-[11px] text-slate-500">{o.ownerEmail}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold">
                    {o.effectiveStatus}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {o.trialDaysRemaining != null
                    ? `${o.trialDaysRemaining} j`
                    : o.trialEndsAt
                      ? o.trialEndsAt.toLocaleDateString("fr-FR")
                      : "—"}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium tabular-nums">{o.activationPercent} %</p>
                  <p className="text-[11px] text-slate-500">
                    {activationBandLabel(o.activationBand)}
                  </p>
                </td>
                <td className="px-4 py-3 tabular-nums">{o.memberCount}</td>
                <td className="px-4 py-3 text-slate-600">{o.lastActivityLabel}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/organisations/${o.id}`}
                    className="font-semibold text-bework-accent hover:underline"
                  >
                    Ouvrir
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-[14px] text-slate-500">
            Aucune entreprise pour ces filtres.
          </p>
        ) : null}
      </div>
    </div>
  );
}
