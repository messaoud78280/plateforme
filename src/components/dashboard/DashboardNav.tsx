"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linkBase =
  "inline-flex items-center rounded-md text-xs font-medium sm:text-sm transition-colors";
const activeClass = `${linkBase} bg-[#1d4ed8] px-2.5 py-1.5 font-semibold text-white hover:bg-[#1e40af]`;
const inactiveClass = `${linkBase} px-2.5 py-1.5 text-[#334155] hover:bg-[#e8ecf2] hover:text-[#0f172a]`;

function NavLink({
  href,
  children,
  pathname,
  matchExact = false,
}: {
  href: string;
  children: React.ReactNode;
  pathname: string;
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

  return (
    <nav className="border-b border-[#c8cdd6] bg-[#f8f9fb] px-3 sm:px-4" aria-label="Navigation tableau de bord">
      <div className="dashboard-nav__links mx-auto flex max-w-6xl flex-nowrap items-center justify-start gap-x-0 py-1.5 sm:py-2">
        <NavLink href="/dashboard" pathname={pathname} matchExact>Dashboard</NavLink>
        {isClient ? (
          <>
            <NavLink href="/dashboard/taches" pathname={pathname}>Mes missions</NavLink>
            <NavLink href="/dashboard/messagerie" pathname={pathname}>Messagerie</NavLink>
            <NavLink href="/dashboard/abonnement" pathname={pathname}>Abonnement</NavLink>
            <NavLink href="/dashboard/parametres" pathname={pathname}>Paramètres</NavLink>
          </>
        ) : isManager ? (
          <>
            <NavLink href="/dashboard/taches" pathname={pathname}>Missions</NavLink>
            <NavLink href="/dashboard/clients" pathname={pathname}>Clients</NavLink>
            <NavLink href="/dashboard/agents" pathname={pathname}>Agents</NavLink>
            <NavLink href="/dashboard/messagerie" pathname={pathname}>Messagerie</NavLink>
            <NavLink href="/dashboard/rapports" pathname={pathname}>Rapports</NavLink>
            <NavLink href="/dashboard/parametres" pathname={pathname}>Paramètres</NavLink>
          </>
        ) : isAgent ? (
          <>
            <NavLink href="/dashboard/taches" pathname={pathname}>Mes missions</NavLink>
            <NavLink href="/dashboard/messagerie" pathname={pathname}>Messagerie</NavLink>
            <NavLink href="/dashboard/taches?statut=COMPLETE" pathname={pathname}>Historique</NavLink>
            <NavLink href="/dashboard/parametres" pathname={pathname}>Paramètres</NavLink>
          </>
        ) : (
          <>
            <NavLink href="/dashboard/projets" pathname={pathname}>Projets</NavLink>
            <NavLink href="/dashboard/taches" pathname={pathname}>Mes tâches</NavLink>
            <NavLink href="/dashboard/documents" pathname={pathname}>Mes documents</NavLink>
            <NavLink href="/dashboard/messagerie" pathname={pathname}>Messagerie</NavLink>
            <NavLink href="/dashboard/messages" pathname={pathname}>RDV</NavLink>
            <NavLink href="/dashboard/rapports" pathname={pathname}>Rapports</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
