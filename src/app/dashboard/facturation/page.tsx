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
import { withReturnTo } from "@/lib/navigation/safe-return-to";
import { buildPrepareBillingHref } from "@/lib/facturation/prepare-billing";

export const dynamic = "force-dynamic";

const FILTERS: { id: BillingFilter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "a_facturer", label: "À facturer" },
  { id: "en_attente", label: "Suite client" },
  { id: "en_retard", label: "En retard" },
  { id: "soldes", label: "Clôturés" },
];

function urgencyBadgeClass(level: string): string {
  switch (level) {
    case "A_SURVEILLER":
      return "bg-amber-50 text-amber-900 ring-1 ring-amber-200/80";
    case "IMPORTANT":
      return "bg-orange-50 text-orange-900 ring-1 ring-orange-200/80";
    case "URGENT":
      return "bg-red-50 text-red-800 ring-1 ring-red-200/80";
    case "CRITIQUE":
      return "bg-red-900 text-white";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

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
        eyebrow="Pilotage chantier"
        title="À facturer"
        description="Besoins opérationnels à préparer dans Commercial — une fiche À facturer n’est pas du chiffre d’affaires."
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
                    k.key === "en_retard" ? "border-red-200/70" : null,
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

          {snap.watchSummary ? (
            <p className="text-sm text-amber-900/90" data-testid="facturation-watch-summary">
              {snap.watchSummary}
              {snap.totals.enRetard === 0
                ? " — pas encore hors délai."
                : "."}
            </p>
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
                Voir tout dans À traiter →
              </Link>
            </div>
            {snap.attention.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">
                Aucun dossier à relancer pour le moment.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100">
                {snap.attention.map((a) => (
                  <li key={a.id} className="py-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#1e3a5f]">
                            {a.headline}
                          </p>
                          <span
                            className={cn(
                              "rounded-md px-2 py-0.5 text-[10px] font-semibold",
                              urgencyBadgeClass(a.urgency),
                            )}
                          >
                            {a.urgencyLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-[15px] font-semibold text-slate-900">
                          {a.title}
                        </p>
                        {a.clientName ? (
                          <p className="mt-0.5 text-[13px] text-slate-600">{a.clientName}</p>
                        ) : null}
                        <p className="mt-1 text-[13px] text-slate-600">
                          {[a.sinceLabel, a.assigneeName].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <Link
                        href={a.href}
                        className="shrink-0 rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-semibold text-white hover:bg-[#152a45]"
                      >
                        {a.actionLabel} →
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.12em] text-[#1e3a5f]">
                Suivi
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((f) => {
                  const available = snap.filterAvailability[f.id];
                  const active = filter === f.id;
                  if (!available && !active && f.id !== "all") {
                    return (
                      <span
                        key={f.id}
                        className="cursor-not-allowed rounded-full px-3 py-1 text-xs font-semibold text-slate-300"
                        title="Aucun dossier dans cette catégorie"
                      >
                        {f.label}
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={f.id}
                      href={
                        f.id === "all"
                          ? "/dashboard/facturation"
                          : `/dashboard/facturation?filtre=${f.id}`
                      }
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        active
                          ? "bg-[#1e3a5f] text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                      )}
                    >
                      {f.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {snap.items.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Aucun dossier pour ce filtre.</p>
            ) : (
              <>
                <div className="mt-4 hidden md:block">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                        <th className="pb-2 pr-3 font-semibold">Chantier / client</th>
                        <th className="pb-2 pr-3 font-semibold">Étape</th>
                        <th className="pb-2 pr-3 font-semibold">Responsable</th>
                        <th className="pb-2 pr-3 font-semibold">Depuis</th>
                        <th className="pb-2 font-semibold">Prochaine action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snap.items.map((row) => {
                        const action = row.nextAction || row.primaryAction;
                        const prepareHref =
                          row.projectId &&
                          (row.status === "A_FACTURER" || row.bucket === "a_facturer")
                            ? buildPrepareBillingHref({
                                projectId: row.projectId,
                                sheetId: row.id,
                              })
                            : null;
                        return (
                          <tr key={row.id} className="border-b border-slate-100">
                            <td className="py-3 pr-3">
                              <Link href={row.href} className="block hover:opacity-90">
                                <span className="block font-semibold text-slate-900">
                                  {row.projectTitle || row.title}
                                </span>
                                <span className="mt-0.5 block text-[13px] text-slate-600">
                                  {row.clientName ?? "—"}
                                </span>
                              </Link>
                            </td>
                            <td className="py-3 pr-3 text-slate-700">{row.statusLabel}</td>
                            <td className="py-3 pr-3 text-slate-600">
                              {row.assigneeName ?? "—"}
                            </td>
                            <td className="py-3 pr-3 text-slate-600">
                              {row.sinceLabel ? `Depuis ${row.sinceLabel}` : "—"}
                            </td>
                            <td className="py-3">
                              {prepareHref ? (
                                <Link
                                  href={prepareHref}
                                  className="inline-flex rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white"
                                >
                                  Préparer la facturation
                                </Link>
                              ) : (
                                <Link
                                  href={row.href}
                                  className="font-medium text-[#1e3a5f]"
                                >
                                  {action} →
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <ul className="mt-3 space-y-2 md:hidden">
                  {snap.items.map((row) => {
                    const action = row.nextAction || row.primaryAction;
                    const prepareHref =
                      row.projectId &&
                      (row.status === "A_FACTURER" || row.bucket === "a_facturer")
                        ? buildPrepareBillingHref({
                            projectId: row.projectId,
                            sheetId: row.id,
                          })
                        : null;
                    return (
                      <li
                        key={row.id}
                        className="rounded-xl border border-slate-200 bg-slate-50/40 px-3 py-3"
                      >
                        <Link href={row.href} className="block min-h-[44px]">
                          <p className="text-[15px] font-semibold text-slate-900">
                            {row.projectTitle || row.title}
                          </p>
                          {row.clientName ? (
                            <p className="mt-0.5 text-[13px] text-slate-600">
                              {row.clientName}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[13px] text-slate-700">
                            {row.statusLabel}
                            {row.sinceLabel ? ` · Depuis ${row.sinceLabel}` : ""}
                          </p>
                        </Link>
                        {prepareHref ? (
                          <Link
                            href={prepareHref}
                            className="mt-2 inline-flex rounded-lg bg-[#1e3a5f] px-3 py-2 text-xs font-bold text-white"
                          >
                            Préparer la facturation
                          </Link>
                        ) : (
                          <p className="mt-2 text-[12px] font-semibold text-[#1e3a5f]">
                            {action} →
                          </p>
                        )}
                      </li>
                    );
                  })}
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
