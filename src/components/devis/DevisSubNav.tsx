"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const base =
  "inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm";

export function DevisSubNav() {
  const pathname = usePathname();
  const links = [
    { href: "/dashboard/devis", label: "Vue d’ensemble", exact: true },
    { href: "/dashboard/devis/bibliotheque", label: "Ouvrages & prix" },
    { href: "/dashboard/devis/ressources-chantier", label: "Ressources chantier" },
    { href: "/dashboard/devis/creer", label: "Créer un devis" },
    { href: "/dashboard/devis/projets", label: "Projets" },
    { href: "/dashboard/devis/documents", label: "Documents" },
    { href: "/dashboard/devis/prix", label: "Prix observés" },
    { href: "/dashboard/devis/sources", label: "Sources" },
    { href: "/dashboard/devis/recherche", label: "Recherche" },
  ];

  return (
    <nav
      className="flex flex-wrap gap-2 rounded-xl border border-slate-200/80 bg-white p-2 shadow-sm"
      aria-label="Navigation BeWork Devis"
    >
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={
              active
                ? `${base} bg-[#1e3a5f] text-white shadow-sm`
                : `${base} bg-slate-50 text-slate-700 hover:bg-slate-100`
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
