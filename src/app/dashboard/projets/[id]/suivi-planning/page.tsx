import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import {
  ChantierHierarchyNav,
  chantierProjectHref,
  chantierProjectsHref,
  workspaceHomeCrumb,
} from "@/components/chantier/ChantierHierarchyNav";
import { PlanningSuiviClient } from "@/components/chantier/PlanningSuiviClient";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }>; searchParams: Promise<{ planId?: string }> };

export default async function ProjectPlanningSuiviPage({ params, searchParams }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion");

  const { id: projectId } = await params;
  const sp = await searchParams;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, title: true, organizationId: true },
  });
  if (!project?.organizationId) notFound();

  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6">
      <ChantierHierarchyNav
        backHref={chantierProjectHref(projectId)}
        backLabel="Retour au dossier chantier"
        crumbs={[
          workspaceHomeCrumb(),
          { label: "Chantiers", href: chantierProjectsHref() },
          { label: project.title, href: chantierProjectHref(projectId) },
          { label: "Suivi planning" },
        ]}
      />
      <PlanningSuiviClient
        projectId={projectId}
        initialPlanId={sp.planId ?? null}
      />
    </div>
  );
}
