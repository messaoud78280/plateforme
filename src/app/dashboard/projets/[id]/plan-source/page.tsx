import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import {
  ChantierHierarchyNav,
  chantierProjectHref,
  chantierProjectsHref,
  chantierScopeHref,
} from "@/components/chantier/ChantierHierarchyNav";
import { PrepPlanSourceViewer } from "@/components/preparation/PrepPlanSourceViewer";
import { resolvePrepPlanSource } from "@/lib/preparation/plan-source";

export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ studyId?: string; fileId?: string; from?: string }>;
};

export default async function ProjectPlanSourcePage({ params, searchParams }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/connexion");

  const { id: projectId } = await params;
  const sp = await searchParams;

  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok) notFound();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, title: true, organizationId: true },
  });
  if (!project?.organizationId) notFound();

  const studyId = sp.studyId?.trim() || null;
  const study = studyId
    ? await prisma.prepStudy.findFirst({
        where: {
          id: studyId,
          projectId,
          organizationId: project.organizationId,
          archivedAt: null,
        },
        select: {
          id: true,
          title: true,
          version: true,
          scopeId: true,
          sourcesJson: true,
          scope: { select: { id: true, name: true } },
        },
      })
    : null;

  const resolved = study
    ? await resolvePrepPlanSource({
        projectId,
        sourcesJson: study.sourcesJson,
      })
    : null;

  const fileId = sp.fileId?.trim() || resolved?.file?.id || null;
  if (!fileId) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        <ChantierHierarchyNav
          backHref={
            study?.scopeId
              ? chantierScopeHref(projectId, study.scopeId)
              : chantierProjectHref(projectId)
          }
          backLabel={
            study?.scope
              ? `Retour à ${study.scope.name}`
              : "Retour au dossier chantier"
          }
          crumbs={[
            { label: "Chantiers", href: chantierProjectsHref() },
            { label: project.title, href: chantierProjectHref(projectId) },
            ...(study?.scope
              ? [{ label: study.scope.name, href: chantierScopeHref(projectId, study.scope.id) }]
              : []),
            { label: "Plan source" },
          ]}
        />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-[13px] text-amber-950">
          <p className="font-semibold">Plan source identifié mais fichier non rattaché</p>
          <p className="mt-1 text-amber-900/90">
            La référence existe sur le métré, mais aucun PDF n’est lié dans la GED chantier.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {study ? (
              <Link
                href={`/dashboard/visites-metres/etudes/${study.id}?attachPlan=1`}
                className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
              >
                Rattacher un document
              </Link>
            ) : null}
            <Link
              href={`/dashboard/documents?projectId=${encodeURIComponent(projectId)}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700"
            >
              Ouvrir Plans & documents
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const file = await prisma.chantierFile.findFirst({
    where: { id: fileId, projectId, deletedAt: null },
    select: {
      id: true,
      name: true,
      fileUrl: true,
      mimeType: true,
      status: true,
      documentType: true,
      versionLabel: true,
      indice: true,
      documentDate: true,
    },
  });
  if (!file?.fileUrl) notFound();

  const links = await prisma.chantierFileLink.findMany({
    where: { fileId: file.id },
    select: { entityType: true, entityId: true, entityLabel: true },
    take: 20,
  });

  const backHref =
    sp.from === "metre" && study
      ? `/dashboard/visites-metres/etudes/${study.id}`
      : study?.scopeId
        ? chantierScopeHref(projectId, study.scopeId)
        : chantierProjectHref(projectId);

  const backLabel =
    sp.from === "metre"
      ? "Retour au métré"
      : study?.scope
        ? `Retour à ${study.scope.name}`
        : "Retour au dossier chantier";

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6">
      <ChantierHierarchyNav
        backHref={backHref}
        backLabel={backLabel}
        crumbs={[
          { label: "Chantiers", href: chantierProjectsHref() },
          { label: project.title, href: chantierProjectHref(projectId) },
          ...(study?.scope
            ? [{ label: study.scope.name, href: chantierScopeHref(projectId, study.scope.id) }]
            : []),
          { label: resolved?.displayTitle ?? file.name },
        ]}
      />

      <header className="space-y-1">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
          Plan source
        </p>
        <h1 className="text-[1.5rem] font-semibold text-[#1e3a5f]">
          {resolved?.displayTitle ?? file.name}
        </h1>
        <p className="text-[13px] text-slate-600">
          {[
            resolved?.revisionLabel ? `Révision ${resolved.revisionLabel}` : null,
            file.documentType,
            file.documentDate
              ? `Date ${file.documentDate.toISOString().slice(0, 10)}`
              : null,
            file.status,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>

      {study ? (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] text-slate-700">
          <p className="font-semibold text-[#1e3a5f]">Utilisé dans</p>
          <ul className="mt-1 space-y-0.5">
            <li>
              <Link
                href={`/dashboard/visites-metres/etudes/${study.id}`}
                className="hover:underline"
              >
                Métré {study.title} — Version {study.version}
              </Link>
            </li>
            {links
              .filter((l) => l.entityType !== "PREP_STUDY")
              .map((l) => (
                <li key={`${l.entityType}-${l.entityId}`}>
                  {l.entityLabel ?? `${l.entityType} ${l.entityId ?? ""}`}
                </li>
              ))}
          </ul>
          <p className="mt-2 text-[12px] text-slate-500">
            Filiation : Plan → Métré → Devis / Planning (le devis et le planning ne
            dépendent pas directement du PDF).
          </p>
        </div>
      ) : null}

      <PrepPlanSourceViewer
        file={{
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
        }}
      />
    </div>
  );
}
