import Link from "next/link";
import { redirect } from "next/navigation";
import { getCachedServerSession } from "@/lib/auth/cached-session";
import { assertDashboardHrefAllowed } from "@/lib/equipe-acces/assert-dashboard-access";
import { canAccessFacturation } from "@/lib/facturation/access";
import { getBillingSnapshot } from "@/lib/facturation/snapshot";
import type { BillingFilter } from "@/lib/facturation/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";
import { cn } from "@/lib/cn";
import { URGENCY_STYLES, type UrgencyLevel } from "@/lib/follow-up/types";
import { withReturnTo } from "@/lib/navigation/safe-return-to";

export const dynamic = "force-dynamic";

const FILTERS: { id: BillingFilter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "a_facturer", label: "À facturer" },
  { id: "en_attente", label: "En attente" },
  { id: "en_retard", label: "En retard" },
  { id: "soldes", label: "Soldés" },
];

export default async function FacturationPage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>;
}) {
  const session = await getCachedServerSession();
  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard/facturation");
  }

  if (
    !canAccessFacturation({
      role: session.user.role,
      personType: session.user.personType,
      permissionProfile: session.user.permissionProfile,
    })
  ) {
    redirect("/dashboard");
  }

  assertDashboardHrefAllowed({
    href: "/dashboard/facturation",
    personType: session.user.personType,
    permissionProfile: session.user.permissionProfile,
  });

  const sp = await searchParams;
  const filtreRaw = sp.filtre ?? "all";
  const filter: BillingFilter = FILTERS.some((f) => f.id === filtreRaw)
    ? (filtreRaw as BillingFilter)
    : "all";

  const snap = await getBillingSnapshot({
    user: {
      id: session.user.id,
      role: session.user.role,
      personType: session.user.personType ?? null,
    },
    filter,
  });

  const empty =
    snap.attention.length === 0 &&
    snap.items.filter((i) => i.bucket !== "soldes").length === 0 &&
    filter === "all";

  return (
    <div className="space-y-6" data-testid="facturation-page">
      <BackLink href="/dashboard">Accueil</BackLink>
      <PageHeader
        eyebrow="Pilotage"
        title="Facturation"
        description="Suivez ce qui risque d’être oublié : dossiers à facturer, actions en attente, retards."
        actions={
          <Link
            href={withReturnTo("/dashboard/a-traiter", "/dashboard/facturation")}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[#1e3a5f] hover:bg-slate-50"
          >
            Voir À traiter
          </Link>
        }
      />

      {empty ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
          <p className="text-base font-semibold text-slate-900">Tout est à jour.</p>
          <p className="mt-2 text-sm text-slate-600">
            Aucune action de facturation à traiter.
          </p>
        </div>
      ) : (
        <>
          {snap.kpis.length > 0 ? (
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {snap.kpis.map((k) => (
                <Link
                  key={k.key}
                  href={k.href}
                  className={cn(
                    "rounded-2xl border bg-white p-4 shadow-sm transition hover:border-[#1e3a5f]/30",
                    filter === k.key
                      ? "border-[#1e3a5f] ring-1 ring-[#1e3a5f]/20"
                      : "border-slate-200/90",
                    k.key === "en_retard" ? "border-red-200/80" : null,
                  )}
                >
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                    {k.label}
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-950">
                    {k.count}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">{k.hint}</p>
                </Link>
              ))}
            </section>
          ) : null}

          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#1e3a5f]">
                À traiter
                {snap.attention.length > 0 ? (
                  <span className="ml-2 tabular-nums text-slate-900">
                    {snap.attention.length}
                  </span>
                ) : null}
              </h2>
              <Link
                href="/dashboard/a-traiter?category=FACTURATION"
                className="text-xs font-semibold text-[#1d4ed8] hover:underline"
              >
                Board complet →
              </Link>
            </div>
            {snap.attention.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                Aucun oubli de facturation détecté pour le moment.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {snap.attention.map((a) => {
                  const style =
                    URGENCY_STYLES[(a.urgency as UrgencyLevel) ?? "IMPORTANT"] ??
                    URGENCY_STYLES.IMPORTANT;
                  return (
                    <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold text-slate-900">{a.title}</p>
                        <p className="mt-0.5 text-[13px] text-slate-600">{a.reason}</p>
                        <p className="mt-1 text-[12px] text-slate-500">
                          {[a.projectTitle, a.assigneeName].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                            style.badge,
                          )}
                        >
                          {a.urgency}
                        </span>
                        <Link
                          href={a.href}
                          className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#152a45]"
                        >
                          Ouvrir
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#1e3a5f]">
                Suivi
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                  <Link
                    key={f.id}
                    href={
                      f.id === "all"
                        ? "/dashboard/facturation"
                        : `/dashboard/facturation?filtre=${f.id}`
                    }
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold",
                      filter === f.id
                        ? "bg-[#1e3a5f] text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    )}
                  >
                    {f.label}
                  </Link>
                ))}
              </div>
            </div>

            {snap.items.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Aucun dossier pour ce filtre.</p>
            ) : (
              <>
                {/* Desktop table */}
                <div className="mt-4 hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                        <th className="pb-2 pr-3 font-semibold">Chantier</th>
                        <th className="pb-2 pr-3 font-semibold">Client</th>
                        <th className="pb-2 pr-3 font-semibold">Étape</th>
                        <th className="pb-2 pr-3 font-semibold">Responsable</th>
                        <th className="pb-2 pr-3 font-semibold">Depuis</th>
                        <th className="pb-2 pr-3 font-semibold">Prochaine action</th>
                        <th className="pb-2 font-semibold"> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {snap.items.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-slate-100 hover:bg-slate-50/80"
                        >
                          <td className="py-3 pr-3 font-semibold text-slate-900">
                            {row.projectTitle || row.title}
                          </td>
                          <td className="py-3 pr-3 text-slate-600">
                            {row.clientName ?? "—"}
                          </td>
                          <td className="py-3 pr-3 text-slate-700">{row.statusLabel}</td>
                          <td className="py-3 pr-3 text-slate-600">
                            {row.assigneeName ?? "—"}
                          </td>
                          <td className="py-3 pr-3 text-slate-600">
                            {row.sinceLabel ?? "—"}
                          </td>
                          <td className="py-3 pr-3 text-slate-800">
                            {row.nextAction || row.primaryAction}
                          </td>
                          <td className="py-3 text-right">
                            <Link
                              href={row.href}
                              className="text-xs font-semibold text-[#1d4ed8] hover:underline"
                            >
                              Ouvrir
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <ul className="mt-3 space-y-2 md:hidden">
                  {snap.items.map((row) => (
                    <li key={row.id}>
                      <Link
                        href={row.href}
                        className="block min-h-[52px] rounded-xl border border-slate-200 bg-slate-50/40 px-3 py-3"
                      >
                        <p className="text-[15px] font-semibold text-slate-900">
                          {row.projectTitle || row.title}
                        </p>
                        <p className="mt-0.5 text-[13px] text-slate-600">
                          {[row.clientName, row.statusLabel, row.sinceLabel]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                        <p className="mt-1 text-[12px] font-medium text-[#1e3a5f]">
                          {row.nextAction || row.primaryAction}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {snap.hasInvoiceRows || snap.hasSituationRows ? (
            <p className="text-[11px] text-slate-400">
              Données complémentaires présentes
              {snap.hasInvoiceRows ? ` · ${snap.invoiceCount} facture(s)` : ""}
              {snap.hasSituationRows ? ` · ${snap.situationCount} situation(s)` : ""}
              {" "}
              — montants détaillés en V1B.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
