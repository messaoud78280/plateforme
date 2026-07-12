"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const base =
  "inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm";

export function DevisSubNav() {
  const pathname = usePathname();
  const links = [
    { href: "/dashboard/devis", label: "Vue d’ensemble", exact: true },
    { href: "/dashboard/devis/bibliotheque", label: "Ouvrages & prix" },
    { href: "/dashboard/devis/dce-remplissage", label: "DCE → BPU/DPGF" },
    { href: "/dashboard/devis/analyse-dpgf", label: "Analyse DPGF" },
    { href: "/dashboard/devis/dico-btp", label: "Dico BTP" },
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
      className="flex flex-wrap gap-1.5 rounded-xl border border-bework-navy/10 bg-white p-1.5 shadow-sm"
      aria-label="Navigation BeWork Devis"
    >
      {links.map((l) => {
        const active = l.exact
          ? pathname === l.href
          : pathname === l.href || pathname.startsWith(`${l.href}/`);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              base,
              active
                ? "bg-bework-navy text-white shadow-sm"
                : "text-bework-ink/80 hover:bg-bework-navy-soft hover:text-bework-navy",
            )}
            aria-current={active ? "page" : undefined}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
