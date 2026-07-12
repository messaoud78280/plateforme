import { BackLink } from "@/components/ui/BackLink";
import { CreatePilotageForm } from "@/components/pilotage/CreatePilotageForm";
import {
  canEditPilotageOperational,
  requirePilotageSession,
} from "@/lib/pilotage/access";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NouveauPilotagePage() {
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role)) {
    redirect(PILOTAGE_LIST_PATH);
  }

  const existingIds = (
    await prisma.worksitePilotage.findMany({
      where: { archivedAt: null },
      select: { projectId: true },
    })
  ).map((p) => p.projectId);

  const projectWhere =
    session.user.role === "CLIENT"
      ? { clientId: session.user.id, id: { notIn: existingIds } }
      : session.user.role === "AGENT"
        ? { assignedToId: session.user.id, id: { notIn: existingIds } }
        : { id: { notIn: existingIds } };

  const [projects, staffUsers] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      include: { client: { select: { name: true, company: true } } },
      orderBy: { title: "asc" },
      take: 300,
    }),
    prisma.user.findMany({
      where: { role: { in: ["MANAGER", "AGENCE", "AGENT"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 200,
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <BackLink href={PILOTAGE_LIST_PATH}>Pilotage travaux</BackLink>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Nouveau pilotage chantier</h1>
        <p className="mt-1 text-sm text-slate-600">
          Rattachez le pilotage à un chantier existant. Les pièces et obligations pourront être complétées ensuite.
        </p>
      </div>
      <CreatePilotageForm
        projects={projects.map((p) => ({
          id: p.id,
          title: p.title,
          clientName: p.client.company ?? p.client.name,
        }))}
        staffUsers={staffUsers}
      />
    </div>
  );
}
