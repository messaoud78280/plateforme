import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canAccessChantierProject } from "@/lib/chantier-dossier/access";
import { getProjectWorkspace } from "@/lib/chantier/project-workspace";
import {
  ChantierHierarchyNav,
  chantierProjectHref,
  chantierProjectsHref,
  workspaceHomeCrumb,
} from "@/components/chantier/ChantierHierarchyNav";
export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{ id: string; scopeId: string }>;
};

export default async function ProjectScopePreparationPage({ params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/connexion");
  }

  const { id: projectId, scopeId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, title: true, organizationId: true, clientId: true },
  });
  if (!project?.organizationId) notFound();

  const access = await canAccessChantierProject(session.user, projectId);
  if (!access.ok) redirect("/dashboard");

  const workspace = await getProjectWorkspace(project.organizationId, projectId);
  if (!workspace) notFound();

  const scope = workspace.scopes.find((s) => s.id === scopeId);
  if (!scope) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <ChantierHierarchyNav
        backHref={chantierProjectHref(projectId)}
        backLabel="Retour au dossier chantier"
        crumbs={[
          workspaceHomeCrumb(),
          { label: "Chantiers", href: chantierProjectsHref() },
          { label: workspace.title, href: chantierProjectHref(projectId) },
          { label: scope.name },
        ]}
      />

      <header>
        <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">
          {scope.code}
        </p>
        <h1 className="mt-0.5 text-[1.6rem] font-semibold text-[#1e3a5f]">{scope.name}</h1>
        {scope.description ? (
          <p className="mt-1 text-[13px] text-slate-600">{scope.description}</p>
        ) : null}
      </header>

      <div className="rounded-2xl border border-[#1e3a5f]/15 bg-[rgba(30,58,95,0.03)] px-4 py-3">
        <p className="text-[13px] font-semibold text-[#1e3a5f]">
          Phase du dossier chantier — pas un planning séparé
        </p>
        <p className="mt-1 text-[12.5px] text-slate-600">
          Métré, devis et planning sont globaux. Cette page filtre le contenu
          pour « {scope.name} ».
        </p>
        <Link
          href={chantierProjectHref(projectId)}
          className="mt-2 inline-flex text-[12.5px] font-semibold text-[#1e3a5f] hover:underline"
        >
          ← Retour à la chaîne chantier
        </Link>
      </div>

      {/* Chaîne globale (même dossier, pas de Nouvelle visite) */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(workspace.global.workflow ?? [])
          .filter((s) =>
            ["visite", "metre", "devis", "planning", "suivi"].includes(s.id),
          )
          .map((step) => {
            const body = (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {step.label}
                  {step.ready ? " · prêt" : ""}
                </p>
                <p className="mt-1 text-[15px] font-semibold text-[#1e3a5f] line-clamp-2">
                  {step.title}
                </p>
                {step.detail ? (
                  <p className="mt-1 text-[12px] text-slate-600 line-clamp-2">
                    {step.detail}
                  </p>
                ) : null}
                <p className="mt-3 text-[12px] font-medium text-slate-500">
                  {step.actionLabel}
                </p>
              </>
            );
            return step.href ? (
              <Link
                key={step.id}
                href={step.href}
                className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-4 hover:border-[#1e3a5f]/30"
              >
                {body}
              </Link>
            ) : (
              <div
                key={step.id}
                className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 opacity-80"
              >
                {body}
              </div>
            );
          })}
      </div>

      <details className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px]">
        <summary className="cursor-pointer font-medium text-[#1e3a5f]">
          Autres périmètres du chantier
        </summary>
        <ul className="mt-2 space-y-1 text-slate-600">
          {workspace.scopes.map((s) => (
            <li key={s.id}>
              <Link href={s.href} className="hover:underline">
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
