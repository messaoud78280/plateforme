import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject, isChantierStaff } from "@/lib/chantier-dossier/access";
import { requireSiteDocumentAccess } from "@/lib/site-documents/access";
import { getSiteDocument } from "@/lib/site-documents/service";
import { SiteDocumentEditor } from "@/components/site-documents/SiteDocumentEditor";

type Props = { params: Promise<{ id: string; docId: string }> };

export default async function SiteDocumentPage({ params }: Props) {
  const { id, docId } = await params;
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
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
      <p className="mt-6 text-center text-xs text-slate-400">
        <Link href={`/dashboard/projets/${id}/documents-chantier`} className="hover:underline">
          Retour aux documents
        </Link>
      </p>
    </div>
  );
}
