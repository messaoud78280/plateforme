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
import { cn } from "@/lib/cn";

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

  const cards =
    scope.cards.length > 0
      ? scope.cards
      : [
          workspace.global.metre,
          workspace.global.devis,
          workspace.global.planning,
        ];

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
        <h1 className="mt-0.5 text-[1.6rem] font-semibold text-[#1e3a5f]">
          {scope.name}
        </h1>
        {scope.description ? (
          <p className="mt-1 text-[13px] text-slate-600">{scope.description}</p>
        ) : null}
      </header>

      <div className="rounded-2xl border border-[#1e3a5f]/15 bg-[rgba(30,58,95,0.03)] px-4 py-3">
        <p className="text-[13px] font-semibold text-[#1e3a5f]">
          Vue du lot dans le dossier chantier
        </p>
        <p className="mt-1 text-[12.5px] text-slate-600">
          Les éléments propres à ce lot sont affichés ici. Les éléments utilisés
          à l’échelle du chantier sont signalés comme globaux.
        </p>
        <Link
          href={chantierProjectHref(projectId)}
          className="mt-2 inline-flex text-[12.5px] font-semibold text-[#1e3a5f] hover:underline"
        >
          ← Retour à la chaîne chantier
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const isGlobal = card.relation === "GLOBAL_FALLBACK";
          const body = (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {card.label}
                  {card.ready && !isGlobal ? " · prêt" : ""}
                </p>
                {card.relationLabel ? (
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      isGlobal
                        ? "bg-slate-100 text-slate-600"
                        : card.relation === "SECTION_SPECIFIC"
                          ? "bg-[rgba(30,58,95,0.08)] text-[#1e3a5f]"
                          : "bg-slate-50 text-slate-500",
                    )}
                  >
                    {card.relationLabel}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-2 text-[15px] font-semibold text-[#1e3a5f]">
                {card.title}
              </p>
              {card.detail ? (
                <p className="mt-1 line-clamp-3 text-[12px] text-slate-600">
                  {card.detail}
                </p>
              ) : null}
              {card.secondaryDetail ? (
                <p className="mt-1 line-clamp-2 text-[11.5px] text-slate-500">
                  {card.secondaryDetail}
                </p>
              ) : null}
              {card.syncHint ? (
                <p className="mt-1.5 line-clamp-2 text-[11.5px] text-amber-800/80">
                  {card.syncHint}
                </p>
              ) : null}
              {card.kind === "plan" && card.planMeta?.openHref ? (
                <p className="mt-1 text-[12px] font-medium text-[#1e3a5f]">
                  Plan source · Ouvrir le plan
                </p>
              ) : null}
              <p className="mt-3 text-[12px] font-medium text-slate-500">
                {card.kind === "plan" && card.ready
                  ? "Ouvrir le plan →"
                  : card.actionLabel}
              </p>
            </>
          );
          const href = card.href ?? card.planMeta?.openHref ?? null;
          return href ? (
            <Link
              key={`${card.kind}-${card.title}`}
              href={href}
              className={cn(
                "rounded-2xl border bg-white p-4 transition hover:border-[#1e3a5f]/30",
                isGlobal
                  ? "border-slate-200 border-dashed"
                  : "border-[#1e3a5f]/10",
              )}
            >
              {body}
            </Link>
          ) : (
            <div
              key={`${card.kind}-${card.title}`}
              className={cn(
                "rounded-2xl border bg-white p-4 opacity-90",
                isGlobal
                  ? "border-dashed border-slate-200"
                  : "border-dashed border-slate-200",
              )}
            >
              {body}
            </div>
          );
        })}
      </div>

      {scope.alerts.length > 0 ? (
        <ul className="space-y-1 text-[12.5px] text-slate-600">
          {scope.alerts.map((a, i) => (
            <li key={i}>
              {a.level === "warning" ? "⚠ " : ""}
              {a.message}
            </li>
          ))}
        </ul>
      ) : null}

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
