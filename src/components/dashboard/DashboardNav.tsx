"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const activeClass = "rounded-lg bg-[#1d4ed8] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]";
const inactiveClass = "rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]";

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
  const isAgent = role === "AGENT";
  const isAgence = role === "AGENCE" || role === "MANAGER";

  return (
    <nav className="border-b border-[#c8cdd6] bg-[#f8f9fb] px-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 py-2">
        <NavLink href="/dashboard" pathname={pathname} matchExact>Dashboard</NavLink>
        {isClient ? (
          <>
            <NavLink href="/dashboard/taches" pathname={pathname}>Mes missions</NavLink>
            <NavLink href="/dashboard/messagerie" pathname={pathname}>Messagerie</NavLink>
            <NavLink href="/dashboard/abonnement" pathname={pathname}>Abonnement</NavLink>
            <NavLink href="/dashboard/parametres" pathname={pathname}>Paramètres</NavLink>
          </>
        ) : isAgent ? (
          <>
            <NavLink href="/dashboard/taches" pathname={pathname}>Mes missions</NavLink>
            <NavLink href="/dashboard/messagerie" pathname={pathname}>Messagerie</NavLink>
            <NavLink href="/dashboard/taches?statut=COMPLETE" pathname={pathname}>Historique</NavLink>
            <NavLink href="/dashboard/parametres" pathname={pathname}>Paramètres</NavLink>
          </>
        ) : isAgence ? (
          <>
            <NavLink href="/dashboard/taches" pathname={pathname}>Missions</NavLink>
            <NavLink href="/dashboard/clients" pathname={pathname}>Clients</NavLink>
            <NavLink href="/dashboard/agents" pathname={pathname}>Agents</NavLink>
            <NavLink href="/dashboard/messagerie" pathname={pathname}>Messagerie</NavLink>
            <NavLink href="/dashboard/rapports" pathname={pathname}>Rapports</NavLink>
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
