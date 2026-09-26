import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject, isChantierStaff } from "@/lib/chantier-dossier/access";
import { requireSiteDocumentAccess } from "@/lib/site-documents/access";
import { listSiteDocuments } from "@/lib/site-documents/service";
import { SiteDocumentsHub } from "@/components/site-documents/SiteDocumentsHub";
import {
  ChantierHierarchyNav,
  chantierProjectHref,
  chantierProjectsHref,
  moduleChantierNav,
} from "@/components/chantier/ChantierHierarchyNav";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ scopeId?: string }>;
};

export default async function DocumentsChantierPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { scopeId: scopeIdRaw } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();

  const access = await canAccessChantierProject(session.user, id);
  if (!access.ok) notFound();

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!project) notFound();

  const auth = await requireSiteDocumentAccess(id);
  if (!auth.ok) notFound();

  const scopeId = scopeIdRaw?.trim() || null;
  const scope = scopeId
    ? await prisma.projectScope.findFirst({
        where: { id: scopeId, projectId: id, status: "ACTIVE" },
        select: { id: true, name: true },
      })
    : null;

  const items = await listSiteDocuments(auth.orgId, id);

  const nav = scope
    ? moduleChantierNav({
        projectId: id,
        projectTitle: project.title,
        scope: { id: scope.id, name: scope.name },
        currentLabel: "Plans & documents",
      })
    : {
        backHref: chantierProjectHref(id),
        backLabel: "Retour au dossier chantier",
        crumbs: [
          { label: "Chantiers", href: chantierProjectsHref() },
          { label: project.title, href: chantierProjectHref(id) },
          { label: "Plans & documents" },
        ],
      };

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6">
      <ChantierHierarchyNav
        backHref={nav.backHref}
        backLabel={nav.backLabel}
        crumbs={nav.crumbs}
      />
      <SiteDocumentsHub
        projectId={id}
        canWrite={isChantierStaff(session.user.role)}
        initialItems={items.map((i) => ({
          ...i,
          visitDate: i.visitDate?.toISOString() ?? null,
          updatedAt: i.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
