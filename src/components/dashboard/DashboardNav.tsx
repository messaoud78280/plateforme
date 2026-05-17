"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkBase =
  "inline-flex items-center rounded-md text-xs font-medium sm:text-sm transition-colors";
const inactiveClass = `${linkBase} px-2.5 py-1.5 text-black hover:bg-[#e8ecf2] hover:text-black`;

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
    <Link href={href} className={isActive ? activeClass : inactiveClass}>
      {children}
    </Link>
  );
}

export function DashboardNav({ role }: { role?: string | null }) {
  const pathname = usePathname();
  const isClient = role === "CLIENT";
  const isManager = role === "MANAGER";
  const isAgent = role === "AGENT" || role === "AGENCE";
  const activeClass = `${linkBase} bg-[color:var(--accent-600)] px-2.5 py-1.5 font-semibold text-white hover:bg-[color:var(--accent-700)]`;
  const activeClassAgent = `${linkBase} bg-[color:var(--agent-600)] px-2.5 py-1.5 font-semibold text-white hover:bg-[color:var(--agent-700)]`;
  const activeClassClient = `${linkBase} bg-[color:var(--client-600)] px-2.5 py-1.5 font-semibold text-white hover:bg-[color:var(--client-700)]`;
  const active = isAgent ? activeClassAgent : isClient ? activeClassClient : activeClass;

  return (
    <nav className="border-b border-[#c8cdd6] bg-[#f8f9fb] px-3 sm:px-4" aria-label="Navigation tableau de bord">
      <div className="dashboard-nav__links mx-auto flex max-w-site flex-nowrap items-center justify-start gap-x-0 py-1.5 sm:py-2">
        <NavLink href="/dashboard" pathname={pathname} matchExact activeClass={active}>
          Dashboard
        </NavLink>
        {isClient ? (
          <>
            <NavLink href="/dashboard/taches" pathname={pathname} activeClass={active}>
              Mes missions
            </NavLink>
            <NavLink href="/dashboard/messagerie" pathname={pathname} activeClass={active}>
              Messagerie
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
            <NavLink href="/dashboard/taches" pathname={pathname} activeClass={active}>
              Missions
            </NavLink>
            <NavLink href="/dashboard/clients" pathname={pathname} activeClass={active}>
              Clients
            </NavLink>
            <NavLink href="/dashboard/agents" pathname={pathname} activeClass={active}>
              Agents
            </NavLink>
            <NavLink href="/dashboard/messagerie" pathname={pathname} activeClass={active}>
              Messagerie
            </NavLink>
            <NavLink href="/dashboard/rapports" pathname={pathname} activeClass={active}>
              Rapports
            </NavLink>
            <NavLink href="/dashboard/devis" pathname={pathname} activeClass={active}>
              Devis
            </NavLink>
            <NavLink href="/dashboard/skills" pathname={pathname} activeClass={active}>
              CCTP
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
            <NavLink href="/dashboard/messagerie" pathname={pathname} activeClass={active}>
              Messagerie
            </NavLink>
            <NavLink href="/dashboard/taches?statut=COMPLETE" pathname={pathname} activeClass={active}>
              Historique
            </NavLink>
            <NavLink href="/dashboard/devis" pathname={pathname} activeClass={active}>
              Devis
            </NavLink>
            <NavLink href="/dashboard/skills" pathname={pathname} activeClass={active}>
              CCTP
            </NavLink>
            <NavLink href="/dashboard/parametres" pathname={pathname} activeClass={active}>
              Paramètres
            </NavLink>
          </>
        ) : (
          <>
            <NavLink href="/dashboard/projets" pathname={pathname} activeClass={active}>
              Projets
            </NavLink>
            <NavLink href="/dashboard/taches" pathname={pathname} activeClass={active}>
              Mes tâches
            </NavLink>
            <NavLink href="/dashboard/documents" pathname={pathname} activeClass={active}>
              Mes documents
            </NavLink>
            <NavLink href="/dashboard/messagerie" pathname={pathname} activeClass={active}>
              Messagerie
            </NavLink>
            <NavLink href="/dashboard/messages" pathname={pathname} activeClass={active}>
              RDV
            </NavLink>
            <NavLink href="/dashboard/rapports" pathname={pathname} activeClass={active}>
              Rapports
            </NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
