import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import {
  canEditPilotageOperational,
  requirePilotageSession,
} from "@/lib/pilotage/access";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";
import { ChantierContractuelPanel } from "@/components/chantier/ChantierContractuelPanel";
import { BackLink } from "@/components/ui/BackLink";
import { projectContractuelTabHref } from "@/lib/pilotage/project-links";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;

function first(sp: SP, key: string) {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

/**
 * PILOTAGE-V2A.1 — Point d’entrée Project-first du suivi contractuel.
 * Redirige vers l’écran spécialisé WorksitePilotage (données conservées)
 * ou propose l’activation si l’extension n’existe pas.
 */
export default async function SuiviContractuelPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SP>;
}) {
  const session = await getServerSession(authOptions);
  const { id: projectId } = await params;
  const sp = await searchParams;
  const onglet = first(sp, "onglet") ?? "";

  if (!session?.user?.id) {
    redirect(`/connexion?callbackUrl=/dashboard/projets/${projectId}/suivi-contractuel`);
  }

  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok || !access.project) notFound();

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { personType: true, permissionProfile: true, role: true },
  });
  if (
    actor?.personType === "SUPPLIER" ||
    actor?.personType === "CLIENT_EXT" ||
    actor?.permissionProfile === "FOURNISSEUR"
  ) {
    redirect(`/dashboard/projets/${projectId}`);
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, title: true },
  });
  if (!project) notFound();

  const pilotage = await prisma.worksitePilotage.findUnique({
    where: { projectId },
    select: { id: true, archivedAt: true },
  });

  if (pilotage && !pilotage.archivedAt) {
    const tab = onglet && onglet !== "vue" ? onglet : "a-traiter";
    redirect(`${PILOTAGE_LIST_PATH}/${pilotage.id}?onglet=${encodeURIComponent(tab)}`);
  }

  // Extension absente — activation légère (pas le formulaire « Nouveau pilotage »)
  await requirePilotageSession();
  const canEdit = canEditPilotageOperational(session.user.role);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <BackLink href={projectContractuelTabHref(projectId)}>Retour au chantier</BackLink>
      <ChantierContractuelPanel
        projectId={project.id}
        projectTitle={project.title}
        canEdit={canEdit}
        summary={null}
      />
    </div>
  );
}
