import Link from "next/link";
import {
  requireCommercialSession,
  resolveCommercialOrgId,
} from "@/lib/commercial/access";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CommercialClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await requireCommercialSession(
    "/dashboard/devis-facturation/clients",
  );
  const orgId = await resolveCommercialOrgId(session.user);
  if (!orgId) return null;
  const q = ((await searchParams).q ?? "").trim();

  const clients = await prisma.externalOrganization.findMany({
    where: {
      hostOrganizationId: orgId,
      type: { in: ["CLIENT_EXT", "CLIENT"] },
      status: "ACTIVE",
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { tradeName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      tradeName: true,
      email: true,
      phone: true,
      city: true,
      _count: {
        select: {
          commercialQuotesAsClient: true,
          commercialInvoicesAsClient: true,
        },
      },
    },
    orderBy: { name: "asc" },
    take: 200,
  });

  return (
    <div className="space-y-4">
      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher un client…"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
        />
        <button
          type="submit"
          className="rounded-xl bg-[#1e3a5f] px-4 text-sm font-semibold text-white"
        >
          Chercher
        </button>
      </form>
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {clients.map((c) => (
          <li key={c.id}>
            <Link
              href={`/dashboard/devis-facturation/clients/${c.id}`}
              className="block px-4 py-3 hover:bg-slate-50/80"
            >
              <p className="font-semibold text-slate-900">
                {c.tradeName || c.name}
              </p>
              <p className="text-[12px] text-slate-500">
                {[c.city, c.email, c.phone].filter(Boolean).join(" · ") || "—"}
              </p>
              <p className="mt-1 text-[11px] text-slate-400">
                {c._count.commercialQuotesAsClient} devis ·{" "}
                {c._count.commercialInvoicesAsClient} factures
              </p>
            </Link>
          </li>
        ))}
        {clients.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-slate-500">
            Aucun client.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
