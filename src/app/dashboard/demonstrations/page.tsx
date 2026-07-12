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
        title="Démonstrations Pilotage travaux"
        description="Espace isolé : données fictives uniquement. Générez un lien temporaire pour un prospect ou présentez en partage d’écran."
        actions={
          <Link href="/demo/pilotage-travaux" className="btn-cc-primary">
            Lancer une démo (mode rendez-vous)
          </Link>
        }
      />

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
