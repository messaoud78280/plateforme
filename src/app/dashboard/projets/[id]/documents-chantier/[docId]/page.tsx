import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject, isChantierStaff } from "@/lib/chantier-dossier/access";
import { requireSiteDocumentAccess } from "@/lib/site-documents/access";
import { getSiteDocument } from "@/lib/site-documents/service";
import { SiteDocumentEditor } from "@/components/site-documents/SiteDocumentEditor";
import {
  ChantierHierarchyNav,
  chantierProjectHref,
  chantierProjectsHref,
} from "@/components/chantier/ChantierHierarchyNav";

type Props = {
  params: Promise<{ id: string; docId: string }>;
  searchParams: Promise<{ scopeId?: string }>;
};

export default async function SiteDocumentPage({ params, searchParams }: Props) {
  const { id, docId } = await params;
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

  const document = await getSiteDocument(auth.orgId, id, docId);
  if (!document) notFound();

  const scopeId = scopeIdRaw?.trim() || null;
  const scope = scopeId
    ? await prisma.projectScope.findFirst({
        where: { id: scopeId, projectId: id, status: "ACTIVE" },
        select: { id: true, name: true },
      })
    : null;

  const docsListHref = scope
    ? `/dashboard/projets/${id}/documents-chantier?scopeId=${encodeURIComponent(scope.id)}`
    : `/dashboard/projets/${id}/documents-chantier`;

  const nav = scope
    ? {
        backHref: docsListHref,
        backLabel: "Retour à Plans & documents",
        crumbs: [
          { label: "Chantiers", href: chantierProjectsHref() },
          { label: project.title, href: chantierProjectHref(id) },
          {
            label: scope.name,
            href: `/dashboard/projets/${id}/preparation/${scope.id}`,
          },
          { label: "Plans & documents", href: docsListHref },
          { label: document.title || "Document" },
        ],
      }
    : {
        backHref: docsListHref,
        backLabel: "Retour aux documents",
        crumbs: [
          { label: "Chantiers", href: chantierProjectsHref() },
          { label: project.title, href: chantierProjectHref(id) },
          { label: "Plans & documents", href: docsListHref },
          { label: document.title || "Document" },
        ],
      };

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-6 sm:px-6">
      <ChantierHierarchyNav
        backHref={nav.backHref}
        backLabel={nav.backLabel}
        crumbs={nav.crumbs}
      />
      <SiteDocumentEditor
        projectId={id}
        projectTitle={project.title}
        canWrite={isChantierStaff(session.user.role)}
        document={{
          id: document.id,
          kind: document.kind,
          number: document.number,
          versionNumber: document.versionNumber,
          status: document.status,
          title: document.title,
          visitDate: document.visitDate?.toISOString() ?? null,
          visitTime: document.visitTime,
          weather: document.weather,
          authorName: document.authorName,
          quickNotes: document.quickNotes,
          payloadJson: document.payloadJson,
          chatgptImports: document.chatgptImports.map((x) => ({ id: x.id })),
        }}
      />
    </div>
  );
}
