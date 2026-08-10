import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveFollowUpOwnerUserId } from "@/lib/follow-up/access";
import { FollowUpCreateForm } from "@/components/follow-up/FollowUpCreateForm";
import { PageHeader } from "@/components/ui/PageHeader";
import { BackLink } from "@/components/ui/BackLink";
import { isBeworkStaff } from "@/lib/authz";
import { projectWhereForClientUser } from "@/lib/organization/access";

export const dynamic = "force-dynamic";

export default async function NouvelleFichePage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion?callbackUrl=/dashboard/fiches-suivi/nouvelle");

  const { projectId: projectIdParam } = await searchParams;

  const ownerUserId = await resolveFollowUpOwnerUserId(session.user.id);
  const projects = await prisma.project.findMany({
    where: isBeworkStaff(session.user)
      ? {}
      : await projectWhereForClientUser(session.user.id),
    select: {
      id: true,
      title: true,
      siteAddress: true,
      siteCity: true,
      assignedToId: true,
      client: { select: { name: true, company: true } },
    },
    orderBy: { title: "asc" },
    take: 80,
  });

  void ownerUserId;

  const projectsForForm = projects.map((p) => ({
    id: p.id,
    title: p.title,
    siteAddress: p.siteAddress,
    siteCity: p.siteCity,
    assignedToId: p.assignedToId,
    clientName: (p.client.company || p.client.name || "").trim() || null,
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
      <BackLink href="/dashboard/fiches-suivi">Retour aux fiches de suivi</BackLink>
      <PageHeader
        eyebrow="Création rapide"
        title="Nouvelle fiche"
        description="Choisissez le chantier — client et adresse sont repris. Le reste se complète ensuite."
      />
      <FollowUpCreateForm projects={projectsForForm} defaultProjectId={projectIdParam ?? null} />
    </div>
  );
}
