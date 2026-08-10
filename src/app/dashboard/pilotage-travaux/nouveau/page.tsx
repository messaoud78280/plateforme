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

export default async function NouveauPilotagePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requirePilotageSession();
  if (!canEditPilotageOperational(session.user.role)) {
    redirect(PILOTAGE_LIST_PATH);
  }

  const sp = await searchParams;
  const modeleRaw = sp.modele;
  const defaultTemplateId = Array.isArray(modeleRaw) ? modeleRaw[0] : modeleRaw;
  const projectRaw = sp.projectId;
  const defaultProjectId = Array.isArray(projectRaw) ? projectRaw[0] : projectRaw;

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
      <BackLink href={PILOTAGE_LIST_PATH}>Retour au pilotage</BackLink>
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Suivi contractuel du chantier</h1>
        <p className="mt-1 text-sm text-slate-600">
          Optionnel : obligations, visas, DOE et jalons marché sur un chantier déjà existant. Le chantier
          n’est pas recréé.
        </p>
      </div>
      <CreatePilotageForm
        projects={projects.map((p) => ({
          id: p.id,
          title: p.title,
          clientName: p.client.company ?? p.client.name,
        }))}
        staffUsers={staffUsers}
        defaultTemplateId={defaultTemplateId}
        defaultProjectId={defaultProjectId}
      />
    </div>
  );
}
