"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const links = [
  { href: "/dashboard/devis-facturation", label: "Vue d’ensemble", exact: true },
  { href: "/dashboard/devis-facturation/devis", label: "Devis" },
  { href: "/dashboard/devis-facturation/factures", label: "Factures" },
  { href: "/dashboard/devis-facturation/avenants", label: "Avenants" },
  { href: "/dashboard/devis-facturation/bibliotheque", label: "Bibliothèque" },
  { href: "/dashboard/devis-facturation/prix", label: "Prix" },
  { href: "/dashboard/devis-facturation/paiements", label: "Paiements" },
  { href: "/dashboard/devis-facturation/parametres", label: "Paramètres" },
];

export function CommercialSubNav() {
  const pathname = usePathname();
  return (
    <nav
      className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
      aria-label="Devis et facturation"
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
              "inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm",
              active
                ? "bg-[#1e3a5f] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50 hover:text-[#1e3a5f]",
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
