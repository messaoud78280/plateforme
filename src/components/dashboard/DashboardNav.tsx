"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { ATraiterNavLink } from "@/components/dashboard/ATraiterNavLink";

const linkBase =
  "inline-flex items-center rounded-lg text-xs font-semibold sm:text-sm transition-colors duration-[var(--cc-transition)]";
const inactiveClass = `${linkBase} px-2.5 py-1.5 text-bework-ink/80 hover:bg-bework-navy-soft hover:text-bework-navy`;

function NavLink({
  href,
  children,
  pathname,
  activeClass,
  matchExact = false,
}: {
  href: string;
  children: React.ReactNode;
  pathname: string;
  activeClass: string;
  matchExact?: boolean;
}) {
  const isActive = matchExact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link href={href} className={isActive ? activeClass : inactiveClass} aria-current={isActive ? "page" : undefined}>
      {children}
    </Link>
  );
}

export function DashboardNav({ role }: { role?: string | null }) {
  const pathname = usePathname();
  const isClient = role === "CLIENT";
  const isManager = role === "MANAGER";
  const isAgent = role === "AGENT" || role === "AGENCE";

  const activeClass = cn(
    linkBase,
    "bg-bework-navy px-2.5 py-1.5 text-white shadow-sm hover:bg-bework-navy-deep",
  );
  const activeClassAgent = cn(
    linkBase,
    "bg-[color:var(--agent-600)] px-2.5 py-1.5 text-white shadow-sm hover:bg-[color:var(--agent-700)]",
  );
  const activeClassClient = cn(
    linkBase,
    "bg-[color:var(--client-600)] px-2.5 py-1.5 text-white shadow-sm hover:bg-[color:var(--client-700)]",
  );
  const active = isAgent ? activeClassAgent : isClient ? activeClassClient : activeClass;

  return (
    <nav
      className="relative z-30 shrink-0 border-b border-[color:var(--cc-chrome-border)] bg-[color:var(--cc-chrome)]/95 px-3 backdrop-blur-sm sm:px-4"
      aria-label="Navigation tableau de bord"
    >
      <div className="dashboard-nav__links mx-auto flex max-w-site flex-nowrap items-center justify-start gap-x-0.5 overflow-x-auto py-1.5 sm:py-2">
        <NavLink href="/dashboard" pathname={pathname} matchExact activeClass={active}>
          Accueil
        </NavLink>
        <ATraiterNavLink activeClass={active} />
        {isClient ? (
          <>
            <NavLink href="/dashboard/taches" pathname={pathname} activeClass={active}>
              Mes missions
            </NavLink>
            <NavLink href="/dashboard/projets" pathname={pathname} activeClass={activeClassClient}>
              Chantiers
            </NavLink>
            <NavLink href="/dashboard/pilotage-travaux" pathname={pathname} activeClass={active}>
              Pilotage
            </NavLink>
            <NavLink href="/dashboard/messagerie" pathname={pathname} activeClass={active}>
              Messagerie
            </NavLink>
            <NavLink href="/dashboard/documents" pathname={pathname} activeClass={active}>
              Documents
            </NavLink>
            <NavLink href="/dashboard/rapports" pathname={pathname} activeClass={active}>
              Reporting
            </NavLink>
            <NavLink href="/dashboard/equipe" pathname={pathname} activeClass={active}>
              Équipe
            </NavLink>
            <NavLink href="/dashboard/abonnement" pathname={pathname} activeClass={active}>
              Abonnement
            </NavLink>
            <NavLink href="/dashboard/parametres" pathname={pathname} activeClass={active}>
              Paramètres
            </NavLink>
          </>
        ) : isManager ? (
          <>
            <NavLink href="/dashboard/clients" pathname={pathname} activeClass={active}>
              Clients
            </NavLink>
            <NavLink href="/dashboard/projets" pathname={pathname} activeClass={active}>
              Chantiers
            </NavLink>
            <NavLink href="/dashboard/pilotage-travaux" pathname={pathname} activeClass={active}>
              Pilotage
            </NavLink>
            <NavLink href="/dashboard/demonstrations" pathname={pathname} activeClass={active}>
              Démos
            </NavLink>
            <NavLink href="/dashboard/taches" pathname={pathname} activeClass={active}>
              Missions
            </NavLink>
            <NavLink href="/dashboard/agents" pathname={pathname} activeClass={active}>
              Agents
            </NavLink>
            <NavLink href="/dashboard/devis" pathname={pathname} activeClass={active}>
              Analyses
            </NavLink>
            <NavLink href="/dashboard/skills" pathname={pathname} activeClass={active}>
              Skills
            </NavLink>
            <NavLink href="/dashboard/messagerie" pathname={pathname} activeClass={active}>
              Messagerie
            </NavLink>
            <NavLink href="/dashboard/rapports" pathname={pathname} activeClass={active}>
              Rapports
            </NavLink>
            <NavLink href="/dashboard/parametres" pathname={pathname} activeClass={active}>
              Paramètres
            </NavLink>
          </>
        ) : isAgent ? (
          <>
            <NavLink href="/dashboard/taches" pathname={pathname} activeClass={active}>
              Mes missions
            </NavLink>
            <NavLink href="/dashboard/projets" pathname={pathname} activeClass={active}>
              Chantiers
            </NavLink>
            <NavLink href="/dashboard/pilotage-travaux" pathname={pathname} activeClass={active}>
              Pilotage
            </NavLink>
            {role === "AGENCE" ? (
              <NavLink href="/dashboard/demonstrations" pathname={pathname} activeClass={active}>
                Démos
              </NavLink>
            ) : null}
            <NavLink href="/dashboard/messagerie" pathname={pathname} activeClass={active}>
              Messagerie
            </NavLink>
            <NavLink href="/dashboard/taches?statut=COMPLETE" pathname={pathname} activeClass={active}>
              Historique
            </NavLink>
            <NavLink href="/dashboard/devis" pathname={pathname} activeClass={active}>
              Analyses
            </NavLink>
            <NavLink href="/dashboard/skills" pathname={pathname} activeClass={active}>
              Skills
            </NavLink>
            <NavLink href="/dashboard/parametres" pathname={pathname} activeClass={active}>
              Paramètres
            </NavLink>
          </>
        ) : null}
      </div>
    </nav>
  );
}
