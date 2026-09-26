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

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <ChantierHierarchyNav
        backHref={chantierProjectHref(projectId)}
        backLabel="Retour au dossier chantier"
        crumbs={[
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

      {/* Barre de filiation métier */}
      <div className="sticky top-0 z-20 overflow-x-auto rounded-2xl border border-[#1e3a5f]/15 bg-white/95 px-3 py-2 shadow-sm backdrop-blur">
        <div className="flex min-w-max items-center gap-1 text-[12px]">
          <span className="shrink-0 font-semibold text-[#1e3a5f]">
            {workspace.title.split("—").pop()?.trim() ?? workspace.title} /{" "}
            {scope.name.toUpperCase()}
          </span>
          <span className="mx-1 text-slate-300">|</span>
          {scope.cards.map((card, i) => (
            <span key={card.kind} className="flex items-center gap-1">
              {i > 0 ? <span className="text-slate-300">→</span> : null}
              {card.href ? (
                <Link
                  href={card.href}
                  className="rounded-full px-2 py-1 font-medium text-[#1e3a5f] hover:bg-[#1e3a5f]/5"
                >
                  {card.kind === "metre" || card.kind === "devis" || card.kind === "planning"
                    ? card.title
                    : card.label}
                </Link>
              ) : (
                <span className="rounded-full px-2 py-1 text-slate-400">{card.label}</span>
              )}
            </span>
          ))}
        </div>
      </div>

      {scope.alerts.length ? (
        <ul className="space-y-1">
          {scope.alerts.map((a) => (
            <li
              key={a.message}
              className={cn(
                "rounded-xl px-3 py-2 text-[13px]",
                a.level === "warning"
                  ? "border border-amber-200 bg-amber-50 text-amber-950"
                  : "border border-slate-200 bg-slate-50 text-slate-700",
              )}
            >
              {a.message}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {scope.cards.map((card) => {
          const body = (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {card.label}
                {card.isReference ? " · référence" : ""}
              </p>
              <p className="mt-1 text-[15px] font-semibold text-[#1e3a5f]">{card.title}</p>
              {card.detail ? (
                <p className="mt-1 text-[12px] text-slate-600">{card.detail}</p>
              ) : null}
              <p className="mt-3 text-[12px] font-medium text-slate-500">
                {card.href
                  ? card.syncState === "ABSENT"
                    ? "Créer / générer"
                    : "Ouvrir"
                  : "À créer"}
              </p>
            </>
          );
          return card.href ? (
            <Link
              key={card.kind}
              href={card.href}
              className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-4 hover:border-[#1e3a5f]/30"
            >
              {body}
            </Link>
          ) : (
            <div
              key={card.kind}
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
