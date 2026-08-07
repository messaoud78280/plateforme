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
import { prisma } from "@/lib/prisma";
import { DEMO_TEMPLATES, isDemoTemplateKey } from "@/lib/demo-environment/constants";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PlatformDemosListPage() {
  const session = await requireDemoStaffSession();
  if ((session.user as { isDemo?: boolean }).isDemo) redirect("/dashboard");

  const demos = await prisma.demoEnvironment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { createdBy: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard/demonstrations">Démonstrations</BackLink>
      <PageHeader
        eyebrow="Espace commercial"
        title="Plateformes de démonstration"
        description="Un environnement isolé par prospect — même socle BeWork, configuration et données fictives dédiées."
        actions={
          <Link href="/dashboard/demonstrations/plateformes/nouvelle" className="btn-cc-primary">
            Créer une démonstration
          </Link>
        }
      />

      {demos.length === 0 ? (
        <EmptyState
          title="Aucune plateforme démo"
          description="Créez un environnement pour préparer un rendez-vous commercial."
          actionLabel="Créer une démonstration"
          actionHref="/dashboard/demonstrations/plateformes/nouvelle"
        />
      ) : (
        <DataTable minWidth="960px">
          <DataTableHead>
            <DataTableTh>Prospect</DataTableTh>
            <DataTableTh>Métier</DataTableTh>
            <DataTableTh>Template</DataTableTh>
            <DataTableTh>Statut</DataTableTh>
            <DataTableTh>Expiration</DataTableTh>
            <DataTableTh>Dernière connexion</DataTableTh>
            <DataTableTh>Identifiant</DataTableTh>
            <DataTableTh>Actions</DataTableTh>
          </DataTableHead>
          <DataTableBody>
            {demos.map((d) => {
              const templateLabel = isDemoTemplateKey(d.templateKey)
                ? DEMO_TEMPLATES[d.templateKey].label
                : d.templateKey;
              return (
                <DataTableRow key={d.id}>
                  <DataTableTd>
                    <p className="font-semibold text-bework-ink">{d.companyName}</p>
                    <p className="text-xs text-bework-muted">{d.internalName}</p>
                  </DataTableTd>
                  <DataTableTd>
                    <span className="text-sm">{d.sector ?? "—"}</span>
                  </DataTableTd>
                  <DataTableTd>
                    <span className="text-xs text-bework-muted">{templateLabel}</span>
                  </DataTableTd>
                  <DataTableTd>
                    <Badge
                      tone={
                        d.status === "ACTIVE"
                          ? "ok"
                          : d.status === "EXPIRED" || d.status === "DISABLED"
                            ? "critical"
                            : "neutral"
                      }
                    >
                      {d.status}
                    </Badge>
                  </DataTableTd>
                  <DataTableTd>
                    <span className="text-xs">
                      {d.expiresAt.toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </DataTableTd>
                  <DataTableTd>
                    <span className="text-xs text-bework-muted">
                      {d.lastLoginAt
                        ? d.lastLoginAt.toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </span>
                  </DataTableTd>
                  <DataTableTd>
                    <code className="text-xs">{d.loginIdentifier}</code>
                  </DataTableTd>
                  <DataTableTd>
                    <Link
                      href={`/dashboard/demonstrations/plateformes/${d.id}`}
                      className="text-sm font-semibold text-[#1d4ed8] hover:underline"
                    >
                      Ouvrir
                    </Link>
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
