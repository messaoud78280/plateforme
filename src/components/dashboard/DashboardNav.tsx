"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const activeClass = "rounded-lg bg-[#1d4ed8] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]";
const inactiveClass = "rounded-lg px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#eef0f4] hover:text-[#0f172a]";

function NavLink({ href, children, matchExact = false }: { href: string; children: React.ReactNode; matchExact?: boolean }) {
  const pathname = usePathname();
  const isActive = matchExact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link href={href} className={isActive ? activeClass : inactiveClass}>
      {children}
    </Link>
  );
}

export function DashboardNav({ role }: { role?: string | null }) {
  const isClient = role === "CLIENT";

  return (
    <nav className="border-b border-[#c8cdd6] bg-[#f8f9fb] px-4">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 py-2">
        <NavLink href="/dashboard" matchExact>Dashboard</NavLink>
        {isClient ? (
          <>
            <NavLink href="/dashboard/nouvelle-demande">Nouvelle demande</NavLink>
            <NavLink href="/dashboard/taches">Mes demandes</NavLink>
            <NavLink href="/dashboard/messagerie">Messagerie</NavLink>
            <NavLink href="/dashboard/documents">Documents</NavLink>
            <NavLink href="/dashboard/abonnement">Abonnement</NavLink>
            <NavLink href="/dashboard/equipe">Équipe</NavLink>
            <NavLink href="/dashboard/parametres">Paramètres</NavLink>
          </>
        ) : (
          <>
            <NavLink href="/dashboard/projets">Projets</NavLink>
            <NavLink href="/dashboard/taches">Mes tâches</NavLink>
            <NavLink href="/dashboard/documents">Mes documents</NavLink>
            <NavLink href="/dashboard/messagerie">Messagerie</NavLink>
            <NavLink href="/dashboard/messages">RDV</NavLink>
            {(role === "AGENCE" || role === "MANAGER") && (
              <>
                <NavLink href="/dashboard/clients">Clients</NavLink>
                <NavLink href="/dashboard/simulation">Simulation</NavLink>
              </>
            )}
            <NavLink href="/dashboard/rapports">Rapports</NavLink>
            {role === "AGENT" && (
              <NavLink href="/dashboard/parametres">Paramètres</NavLink>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
