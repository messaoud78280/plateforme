import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableRow,
  DataTableTd,
  DataTableTh,
} from "@/components/ui/DataTable";
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
      <PageHeader
        eyebrow="Espace commercial"
        title="Démonstrations"
        description="Liens Pilotage isolés et plateformes démo multi-tenant pour les rendez-vous commerciaux."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/demonstrations/plateformes" className="btn-cc-primary">
              Plateformes démo
            </Link>
            <Link href="/demo/pilotage-travaux" className="btn-cc-secondary">
              Démo Pilotage (RDV)
            </Link>
          </div>
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-bework-ink">
        <p className="font-semibold">Nouveau — Plateformes de démonstration</p>
        <p className="mt-1 text-bework-muted">
          Créez un environnement complet (identité, modules, données fictives, expiration) accessible via{" "}
          <Link href="/connexion/demo" className="font-semibold text-[#1d4ed8] hover:underline">
            /connexion/demo
          </Link>
          .
        </p>
        <Link
          href="/dashboard/demonstrations/plateformes/nouvelle"
          className="mt-2 inline-flex text-sm font-semibold text-[#1d4ed8] hover:underline"
        >
          Créer une démonstration →
        </Link>
      </div>

      <h2 className="text-base font-bold text-bework-ink">Liens Pilotage travaux (scénario isolé)</h2>

      <CreateDemoLinkForm scenarios={DEMO_SCENARIO_LIST.map((s) => ({ id: s.id, label: s.label }))} />

      {links.length === 0 ? (
        <EmptyState
          title="Aucune démonstration"
          description="Créez un lien prospect ci-dessus pour démarrer une démo sécurisée."
        />
      ) : (
        <DataTable minWidth="920px">
          <DataTableHead>
            <DataTableTh>Prospect</DataTableTh>
            <DataTableTh>Scénario</DataTableTh>
            <DataTableTh>Statut</DataTableTh>
            <DataTableTh>Vues</DataTableTh>
            <DataTableTh>Expiration</DataTableTh>
            <DataTableTh>Lien</DataTableTh>
            <DataTableTh>Actions</DataTableTh>
          </DataTableHead>
          <DataTableBody>
            {links.map((l) => {
              const url = `${baseUrl}/demo/pilotage-travaux/${l.token}`;
              return (
                <DataTableRow key={l.id}>
                  <DataTableTd>
                    <p className="font-semibold text-bework-ink">{l.prospectCompany ?? "—"}</p>
                    <p className="text-xs text-bework-muted">{l.prospectName ?? l.createdBy?.name ?? "—"}</p>
                  </DataTableTd>
                  <DataTableTd>
                    <span className="text-xs text-bework-muted">{l.scenarioId}</span>
                  </DataTableTd>
                  <DataTableTd>
                    <Badge
                      tone={
                        l.status === "ACTIVE" ? "ok" : l.status === "REVOKED" ? "critical" : "neutral"
                      }
                    >
                      {l.status}
                    </Badge>
                  </DataTableTd>
                  <DataTableTd>
                    <span className="tabular-nums">
                      {l.viewCount}
                      {l.maxViews != null ? ` / ${l.maxViews}` : ""}
                    </span>
                  </DataTableTd>
                  <DataTableTd>
                    <span className="text-xs">{l.expiresAt.toLocaleDateString("fr-FR")}</span>
                  </DataTableTd>
                  <DataTableTd>
                    {l.status === "ACTIVE" ? (
                      <a href={url} className="text-xs font-semibold text-bework-navy break-all hover:underline">
                        Ouvrir
                      </a>
                    ) : (
                      <span className="text-xs text-bework-muted">—</span>
                    )}
                  </DataTableTd>
                  <DataTableTd>
                    <DemoAdminActions
                      id={l.id}
                      status={l.status}
                      notes={l.commercialNotes}
                      interests={Array.isArray(l.interests) ? (l.interests as string[]) : []}
                      sections={Array.isArray(l.sectionsVisited) ? (l.sectionsVisited as string[]) : []}
                    />
                  </DataTableTd>
                </DataTableRow>
              );
            })}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
