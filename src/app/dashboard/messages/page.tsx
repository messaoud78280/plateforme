import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
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
import {
  formatAppointmentSlot,
  listUpcomingAppointments,
} from "@/lib/appointments/upcoming";

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouvelle",
  CONFIRME: "Confirmé",
  ANNULE: "Annulé",
};

export default async function MessagesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/connexion?callbackUrl=/dashboard");
  }

  const isAgence = session.user?.role === "AGENCE" || session.user?.role === "MANAGER";
  let contactRequests: {
    id: string;
    structure: string;
    contactName: string;
    email: string;
    rdvDate: Date | null;
    rdvTime: string | null;
    status: string;
    createdAt: Date;
  }[] = [];

  try {
    contactRequests = await prisma.contactRequest.findMany({
      where: isAgence ? undefined : { email: session.user?.email ?? "" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        structure: true,
        contactName: true,
        email: true,
        rdvDate: true,
        rdvTime: true,
        status: true,
        createdAt: true,
      },
    });
  } catch {
    // Table absente ou erreur
  }

  const upcoming = await listUpcomingAppointments(
    {
      id: session.user.id,
      role: session.user.role,
      email: session.user.email,
    },
    { take: 20 },
  );

  return (
    <div className="space-y-6">
      <BackLink href="/dashboard">Tableau de bord</BackLink>
      <PageHeader
        eyebrow="RDV"
        title="Rendez-vous & contact"
        description={
          isAgence
            ? "Ancienne vue RDV — prochains créneaux et demandes de contact. Le Planning opérationnel et l’Agenda sont des modules séparés."
            : "Vos rendez-vous à venir et l’historique de vos demandes de contact. Pour Qui / Où / Quand → Planning. Pour le calendrier → Agenda."
        }
      />
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/planning"
          className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-bold text-white"
        >
          Ouvrir le Planning
        </Link>
        <Link
          href="/dashboard/agenda"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#1e3a5f]"
        >
          Ouvrir l’Agenda
        </Link>
      </div>

      <Card hover={false} className="!p-0 overflow-hidden">
        <div className="border-b border-[color:var(--cc-chrome-border)] px-5 py-4">
          <h2 className="font-heading text-lg font-bold text-bework-ink">Prochains rendez-vous</h2>
          <p className="mt-0.5 text-sm text-bework-muted">Créneaux confirmés — à ne pas manquer.</p>
        </div>
        {upcoming.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title="Aucun RDV à venir"
              description="Dès qu’un créneau est confirmé, il s’affiche ici."
            />
          </div>
        ) : (
          <DataTable minWidth="560px" className="!rounded-none !border-0 !shadow-none">
            <DataTableHead>
              <DataTableTh>Titre</DataTableTh>
              <DataTableTh>Créneau</DataTableTh>
              <DataTableTh>Contact</DataTableTh>
              <DataTableTh>Chantier</DataTableTh>
              <DataTableTh>Statut</DataTableTh>
            </DataTableHead>
            <DataTableBody>
              {upcoming.map((a) => (
                <DataTableRow key={a.id}>
                  <DataTableTd>
                    <span className="font-semibold text-bework-ink">{a.title}</span>
                  </DataTableTd>
                  <DataTableTd>{formatAppointmentSlot(a.startAt, a.endAt)}</DataTableTd>
                  <DataTableTd>
                    {a.clientName ?? a.clientEmail ?? "—"}
                  </DataTableTd>
                  <DataTableTd>
                    {a.project ? (
                      <Link
                        href={`/dashboard/projets/${a.project.id}`}
                        className="text-bework-navy hover:underline"
                      >
                        {a.project.title}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </DataTableTd>
                  <DataTableTd>
                    <Badge tone="ok">Confirmé</Badge>
                  </DataTableTd>
                </DataTableRow>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </Card>

      <Card hover={false} className="!p-0 overflow-hidden">
        <div className="border-b border-[color:var(--cc-chrome-border)] px-5 py-4">
          <h2 className="font-heading text-lg font-bold text-bework-ink">
            {isAgence ? "Demandes de contact" : "Mes demandes de contact"}
          </h2>
        </div>
        {contactRequests.length === 0 ? (
          <div className="p-5">
            <EmptyState title="Aucune demande" description="Aucune demande enregistrée pour le moment." />
          </div>
        ) : (
          <DataTable minWidth="640px" className="!rounded-none !border-0 !shadow-none">
            <DataTableHead>
              <DataTableTh>Structure / Contact</DataTableTh>
              <DataTableTh>Email</DataTableTh>
              <DataTableTh>Créneau demandé</DataTableTh>
              <DataTableTh>Statut</DataTableTh>
              <DataTableTh>Reçu le</DataTableTh>
              <DataTableTh align="right">Action</DataTableTh>
            </DataTableHead>
            <DataTableBody>
              {contactRequests.map((r) => {
                const rdvLabel =
                  r.rdvDate && r.rdvTime
                    ? `${new Date(r.rdvDate).toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })} à ${r.rdvTime.replace(":", "h")}`
                    : r.rdvDate
                      ? new Date(r.rdvDate).toLocaleDateString("fr-FR")
                      : "—";
                return (
                  <DataTableRow key={r.id}>
                    <DataTableTd>
                      <span className="font-semibold text-bework-ink">{r.structure}</span>
                      <br />
                      <span className="text-bework-muted">{r.contactName}</span>
                    </DataTableTd>
                    <DataTableTd>
                      <a href={`mailto:${r.email}`} className="text-bework-navy hover:underline">
                        {r.email}
                      </a>
                    </DataTableTd>
                    <DataTableTd>{rdvLabel}</DataTableTd>
                    <DataTableTd>
                      <Badge
                        tone={
                          r.status === "CONFIRME" ? "ok" : r.status === "ANNULE" ? "neutral" : "info"
                        }
                      >
                        {STATUS_LABELS[r.status] ?? r.status}
                      </Badge>
                    </DataTableTd>
                    <DataTableTd>
                      {new Date(r.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </DataTableTd>
                    <DataTableTd align="right">
                      <Link
                        href={`/dashboard/messages/demandes/${r.id}`}
                        className="text-xs font-semibold text-bework-navy hover:underline"
                      >
                        {isAgence ? "Voir détail" : "Détail"}
                      </Link>
                    </DataTableTd>
                  </DataTableRow>
                );
              })}
            </DataTableBody>
          </DataTable>
        )}
      </Card>

      <div className="rounded-[var(--cc-radius-lg)] border border-dashed border-bework-navy/20 bg-bework-navy-soft/40 px-5 py-10 text-center">
        <p className="font-heading text-base font-bold text-bework-ink">Messages chantier</p>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-bework-muted">
          {isAgence
            ? "Sélectionnez un projet pour voir les messages d'échange avec les clients."
            : "Consultez vos projets pour voir les messages avec l'agence."}
        </p>
        <Link href="/dashboard/projets" className="btn-cc-primary mt-4 inline-flex">
          Voir les projets
        </Link>
      </div>
    </div>
  );
}
