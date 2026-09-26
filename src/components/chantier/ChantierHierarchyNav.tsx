import Link from "next/link";
import { BackLink } from "@/components/ui/BackLink";
import { cn } from "@/lib/cn";

export type ChantierCrumb = {
  label: string;
  href?: string | null;
};

type Props = {
  /** Destination métier explicite (jamais router.back comme logique principale). */
  backHref: string;
  backLabel: string;
  crumbs: ChantierCrumb[];
  className?: string;
};

/**
 * Navigation hiérarchique chantier : bouton retour explicite + fil d'Ariane cliquable.
 */
export function ChantierHierarchyNav({
  backHref,
  backLabel,
  crumbs,
  className,
}: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      <BackLink href={backHref}>{backLabel}</BackLink>
      {crumbs.length > 0 ? (
        <nav aria-label="Fil d'Ariane" className="text-[12px] text-slate-500">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <li key={`${c.label}-${i}`} className="inline-flex items-center gap-1.5">
                  {i > 0 ? <span className="text-slate-300" aria-hidden>{">"}</span> : null}
                  {c.href && !isLast ? (
                    <Link href={c.href} className="hover:text-[#1e3a5f] hover:underline">
                      {c.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(isLast ? "font-medium text-slate-700" : undefined)}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {c.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      ) : null}
    </div>
  );
}

export function chantierProjectsHref() {
  return "/dashboard/projets";
}

export function chantierProjectHref(projectId: string) {
  return `/dashboard/projets/${projectId}`;
}

export function chantierScopeHref(projectId: string, scopeId: string) {
  return `/dashboard/projets/${projectId}/preparation/${scopeId}`;
}

/** Navigation pour un module métier rattaché à un périmètre (ou au projet seul). */
export function moduleChantierNav(input: {
  projectId: string;
  projectTitle: string;
  scope: { id: string; name: string } | null;
  currentLabel: string;
}): Pick<Props, "backHref" | "backLabel" | "crumbs"> {
  const projectHref = chantierProjectHref(input.projectId);
  if (input.scope) {
    const scopeHref = chantierScopeHref(input.projectId, input.scope.id);
    return {
      backHref: scopeHref,
      backLabel: `Retour à ${input.scope.name}`,
      crumbs: [
        { label: "Chantiers", href: chantierProjectsHref() },
        { label: input.projectTitle, href: projectHref },
        { label: input.scope.name, href: scopeHref },
        { label: input.currentLabel },
      ],
    };
  }
  return {
    backHref: projectHref,
    backLabel: "Retour au dossier chantier",
    crumbs: [
      { label: "Chantiers", href: chantierProjectsHref() },
      { label: input.projectTitle, href: projectHref },
      { label: input.currentLabel },
    ],
  };
}
