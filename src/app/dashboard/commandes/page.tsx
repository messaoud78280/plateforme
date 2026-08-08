import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
import { mapTaskStatusToBcStep, BC_STEPS } from "@/lib/demo-environment/bon-commande";
import type { TaskStatus } from "@/types";
import { taskWhereForClientUser } from "@/lib/organization/access";
import { SupplierOrderActions } from "@/components/demo-environment/SupplierOrderActions";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

function stepLabel(status: string) {
  const key = mapTaskStatusToBcStep(status as TaskStatus);
  return BC_STEPS.find((s) => s.key === key)?.label ?? status;
}

export default async function CommandesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/commandes");

  const isStaff =
    session.user.role === "MANAGER" ||
    session.user.role === "AGENCE" ||
    session.user.role === "AGENT";

  const isSupplierDemo =
    Boolean(session.user.isDemo) &&
    (session.user.personType === "SUPPLIER" || session.user.permissionProfile === "FOURNISSEUR");
  const demoRootId = session.user.demoRootUserId ?? session.user.id;

  const where = isStaff
    ? {
        category: { contains: "Bon de commande", mode: "insensitive" as const },
      }
    : isSupplierDemo
      ? {
          clientId: demoRootId,
          OR: [
            { category: { contains: "Bon de commande", mode: "insensitive" as const } },
            { title: { contains: "POINT.P" } },
            { title: { contains: "BC-2026" } },
          ],
        }
      : {
          AND: [
            await taskWhereForClientUser(session.user.id),
            { category: { contains: "Bon de commande", mode: "insensitive" as const } },
          ],
        };

  const orders = await prisma.task.findMany({
    where,
    select: {
      id: true,
      title: true,
      status: true,
      desiredDate: true,
      description: true,
      project: { select: { id: true, title: true } },
      suppliersJson: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <PageHeader
        eyebrow="Gestion"
        title="Bons de commande"
        description="Suivi Demande → Validation → Commande → Livraison. Données fictives en démonstration."
      />

      {orders.length === 0 ? (
        <EmptyState
          title="Aucune commande"
          description="Les bons de commande du chantier apparaîtront ici."
        />
      ) : (
        <Suspense fallback={<p className="text-sm text-slate-500">Chargement…</p>}>
          <DataTable minWidth="880px">
            <DataTableHead>
              <DataTableTh>Commande</DataTableTh>
              <DataTableTh>Chantier</DataTableTh>
              <DataTableTh>Fournisseur</DataTableTh>
              <DataTableTh>Livraison</DataTableTh>
              <DataTableTh>Statut</DataTableTh>
              <DataTableTh>Action</DataTableTh>
            </DataTableHead>
            <DataTableBody>
              {orders.map((o) => {
                const supplier =
                  Array.isArray(o.suppliersJson) &&
                  o.suppliersJson[0] &&
                  typeof o.suppliersJson[0] === "object"
                    ? String((o.suppliersJson[0] as { name?: string }).name ?? "—")
                    : "—";
                const late =
                  o.desiredDate &&
                  o.desiredDate < new Date(new Date().setHours(0, 0, 0, 0)) &&
                  o.status !== "COMPLETE";
                return (
                  <DataTableRow key={o.id}>
                    <DataTableTd>
                      <p className="font-semibold text-bework-ink">{o.title}</p>
                    </DataTableTd>
                    <DataTableTd>
                      {o.project ? (
                        <Link
                          href={`/dashboard/projets/${o.project.id}`}
                          className="text-sm font-medium text-[#1d4ed8] hover:underline"
                        >
                          {o.project.title}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </DataTableTd>
                    <DataTableTd>
                      <span className="text-sm">{supplier}</span>
                    </DataTableTd>
                    <DataTableTd>
                      <span className={late ? "text-sm font-semibold text-red-700" : "text-sm"}>
                        {o.desiredDate
                          ? o.desiredDate.toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                            })
                          : "—"}
                      </span>
                    </DataTableTd>
                    <DataTableTd>
                      <Badge
                        tone={late ? "critical" : o.status === "A_VALIDER" ? "watch" : "neutral"}
                      >
                        {stepLabel(o.status)}
                      </Badge>
                    </DataTableTd>
                    <DataTableTd>
                      {isSupplierDemo ? (
                        <SupplierOrderActions orderId={o.id} />
                      ) : (
                        <Link
                          href={`/dashboard/taches/${o.id}`}
                          className="text-sm font-semibold text-[#1d4ed8] hover:underline"
                        >
                          Ouvrir
                        </Link>
                      )}
                    </DataTableTd>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        </Suspense>
      )}
    </div>
  );
}
