import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { listQuotes } from "@/lib/commercial/quotes";
import { COMMERCIAL_QUOTE_STATUS_LABELS, roundMoney } from "@/lib/commercial/money";
import { quoteNextActionLabel } from "@/lib/commercial/dashboard-kpis";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "Tous" },
  { value: "DRAFT", label: "Brouillon" },
  { value: "TO_VALIDATE", label: "À valider" },
  { value: "VALIDATED", label: "Validé" },
  { value: "SENT", label: "Envoyé" },
  { value: "VIEWED", label: "Consulté" },
  { value: "ACCEPTED", label: "Accepté" },
  { value: "REFUSED", label: "Refusé" },
  { value: "EXPIRED", label: "Expiré" },
  { value: "CANCELLED", label: "Annulé" },
];

export default async function DevisListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; clientId?: string; projectId?: string }>;
}) {
  const session = await requireCommercialSession("/dashboard/devis-facturation/devis");
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;

  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const status = sp.status?.trim() || undefined;
  const clientId = sp.clientId?.trim() || undefined;
  const projectId = sp.projectId?.trim() || undefined;

  const [quotes, clients, projects] = await Promise.all([
    listQuotes(orgId, { q, status, clientId, projectId, take: 150 }),
    prisma.externalOrganization.findMany({
      where: {
        hostOrganizationId: orgId,
        type: { in: ["CLIENT_EXT", "CLIENT"] },
        status: "ACTIVE",
      },
      select: { id: true, name: true, tradeName: true },
      orderBy: { name: "asc" },
      take: 100,
    }),
    prisma.project.findMany({
      where: { organizationId: orgId },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
      take: 60,
    }),
  ]);

  function hrefWith(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const next = {
      q: overrides.q !== undefined ? overrides.q : q,
      status: overrides.status !== undefined ? overrides.status : status,
      clientId: overrides.clientId !== undefined ? overrides.clientId : clientId,
      projectId: overrides.projectId !== undefined ? overrides.projectId : projectId,
    };
    if (next.q) params.set("q", next.q);
    if (next.status) params.set("status", next.status);
    if (next.clientId) params.set("clientId", next.clientId);
    if (next.projectId) params.set("projectId", next.projectId);
    const s = params.toString();
    return `/dashboard/devis-facturation/devis${s ? `?${s}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Devis & Facturation"
          title="Devis commerciaux"
          description="Source de vérité financière — distincte de la bibliothèque Analyses."
        />
        <Link
          href="/dashboard/devis-facturation/devis/nouveau"
          className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white"
        >
          + Nouveau devis
        </Link>
      </div>

      <form
        method="get"
        className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <label className="min-w-[12rem] flex-1 text-sm">
          <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
            Recherche
          </span>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="N°, objet, client…"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
            Statut
          </span>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value || "all"} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[10rem] flex-1 text-sm">
          <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
            Client
          </span>
          <select
            name="clientId"
            defaultValue={clientId ?? ""}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.tradeName || c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[10rem] flex-1 text-sm">
          <span className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
            Chantier
          </span>
          <select
            name="projectId"
            defaultValue={projectId ?? ""}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">Tous</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-bold text-white"
        >
          Filtrer
        </button>
        {q || status || clientId || projectId ? (
          <Link
            href="/dashboard/devis-facturation/devis"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600"
          >
            Effacer
          </Link>
        ) : null}
      </form>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.slice(0, 7).map((s) => {
          const active = (status ?? "") === s.value;
          return (
            <Link
              key={s.value || "all"}
              href={hrefWith({ status: s.value || undefined })}
              className={
                active
                  ? "rounded-full bg-[#1e3a5f] px-2.5 py-1 text-[11px] font-bold text-white"
                  : "rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600"
              }
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {quotes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-900">
              {q || status || clientId || projectId
                ? "Aucun devis pour ces filtres."
                : "Aucun devis pour le moment."}
            </p>
            <Link
              href="/dashboard/devis-facturation/devis/nouveau"
              className="mt-4 inline-flex rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-bold text-white"
            >
              + Nouveau devis
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">N°</th>
                    <th className="px-4 py-2">Objet</th>
                    <th className="px-4 py-2">Client</th>
                    <th className="px-4 py-2">Chantier</th>
                    <th className="px-4 py-2">Ver.</th>
                    <th className="px-4 py-2">HT</th>
                    <th className="px-4 py-2">Statut</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Suite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/dashboard/devis-facturation/devis/${quote.id}`}
                          className="font-semibold text-[#1e3a5f] hover:underline"
                        >
                          {quote.number}
                        </Link>
                      </td>
                      <td className="max-w-[14rem] truncate px-4 py-2.5 text-slate-700">
                        {quote.subject}
                      </td>
                      <td className="px-4 py-2.5">
                        {quote.clientExternalOrg?.tradeName ||
                          quote.clientExternalOrg?.name ||
                          "—"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {quote.project?.title ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-slate-600">
                        V{quote.currentVersion?.versionNumber ?? 1}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums font-semibold">
                        {roundMoney(quote.totalSellHt, 2).toLocaleString("fr-FR")} €
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          {COMMERCIAL_QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {quote.updatedAt
                          ? new Date(quote.updatedAt).toLocaleDateString("fr-FR")
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs font-medium text-slate-700">
                        {quoteNextActionLabel({
                          status: quote.status,
                          projectId: quote.project?.id,
                          validityDate: quote.validityDate,
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-slate-100 md:hidden">
              {quotes.map((quote) => (
                <li key={quote.id}>
                  <Link
                    href={`/dashboard/devis-facturation/devis/${quote.id}`}
                    className="block px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">
                          {quote.number}
                          <span className="ml-1 text-xs font-normal text-slate-500">
                            · V{quote.currentVersion?.versionNumber ?? 1}
                          </span>
                        </p>
                        <p className="truncate text-sm text-slate-600">{quote.subject}</p>
                      </div>
                      <p className="shrink-0 tabular-nums text-sm font-semibold">
                        {roundMoney(quote.totalSellHt, 2).toLocaleString("fr-FR")} €
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {COMMERCIAL_QUOTE_STATUS_LABELS[quote.status] ?? quote.status}
                      {" · "}
                      {quote.clientExternalOrg?.tradeName ||
                        quote.clientExternalOrg?.name ||
                        "Client à préciser"}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
