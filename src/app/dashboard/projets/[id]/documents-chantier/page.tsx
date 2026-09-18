import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject, isChantierStaff } from "@/lib/chantier-dossier/access";
import { requireSiteDocumentAccess } from "@/lib/site-documents/access";
import { listSiteDocuments } from "@/lib/site-documents/service";
import { SiteDocumentsHub } from "@/components/site-documents/SiteDocumentsHub";

type Props = { params: Promise<{ id: string }> };

export default async function DocumentsChantierPage({ params }: Props) {
  const { id } = await params;
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

  const items = await listSiteDocuments(auth.orgId, id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <p className="mb-4 text-sm">
        <Link
          href={`/dashboard/projets/${id}`}
          className="font-semibold text-[#1d4ed8] hover:underline"
        >
          ← {project.title}
        </Link>
      </p>
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
