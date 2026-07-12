import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { requireDemoStaffSession } from "@/lib/demo-pilotage/access";
import { DEMO_SCENARIO_LIST } from "@/lib/demo-pilotage/scenarios";
import { prisma } from "@/lib/prisma";
import { CreateDemoLinkForm } from "@/components/demo-pilotage/CreateDemoLinkForm";
import { DemoAdminActions } from "@/components/demo-pilotage/DemoAdminActions";

export const dynamic = "force-dynamic";

export default async function DemonstrationsAdminPage() {
  await requireDemoStaffSession();

  const links = await prisma.demoPilotageLink.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { createdBy: { select: { name: true } } },
  });

  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "https://www.bework.fr";

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Démonstrations Pilotage travaux</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Espace commercial isolé : données fictives uniquement. Générez un lien temporaire pour un prospect ou
            présentez en partage d’écran.
          </p>
        </div>
        <Link
          href="/demo/pilotage-travaux"
          className="rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white"
        >
          Lancer une démo (mode rendez-vous)
        </Link>
      </header>

      <CreateDemoLinkForm scenarios={DEMO_SCENARIO_LIST.map((s) => ({ id: s.id, label: s.label }))} />

      <section className="pilotage-card overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Prospect</th>
              <th className="px-4 py-3">Scénario</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Vues</th>
              <th className="px-4 py-3">Expiration</th>
              <th className="px-4 py-3">Lien</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {links.map((l) => {
              const url = `${baseUrl}/demo/pilotage-travaux/${l.token}`;
              return (
                <tr key={l.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{l.prospectCompany ?? "—"}</p>
                    <p className="text-xs text-slate-500">{l.prospectName ?? l.createdBy?.name ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">{l.scenarioId}</td>
                  <td className="px-4 py-3 text-xs font-semibold">{l.status}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {l.viewCount}
                    {l.maxViews != null ? ` / ${l.maxViews}` : ""}
                  </td>
                  <td className="px-4 py-3 text-xs">{l.expiresAt.toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3">
                    {l.status === "ACTIVE" ? (
                      <a href={url} className="text-xs font-semibold text-[#1e3a5f] break-all hover:underline">
                        Ouvrir
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <DemoAdminActions
                      id={l.id}
                      status={l.status}
                      notes={l.commercialNotes}
                      interests={Array.isArray(l.interests) ? (l.interests as string[]) : []}
                      sections={Array.isArray(l.sectionsVisited) ? (l.sectionsVisited as string[]) : []}
                    />
                  </td>
                </tr>
              );
            })}
            {links.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  Aucune démonstration créée.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
