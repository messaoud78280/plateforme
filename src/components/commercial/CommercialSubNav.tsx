"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { HeaderDropdown } from "@/components/ui/HeaderDropdown";

const primary = [
  { href: "/dashboard/devis-facturation", label: "Vue d’ensemble", exact: true },
  { href: "/dashboard/devis-facturation/devis", label: "Devis" },
  { href: "/dashboard/devis-facturation/factures", label: "Factures" },
  { href: "/dashboard/devis-facturation/encaissements", label: "Encaissements" },
];

const referentiel = [
  { href: "/dashboard/devis-facturation/bibliotheque", label: "Bibliothèque" },
  { href: "/dashboard/devis-facturation/prix", label: "Prix" },
  { href: "/dashboard/devis-facturation/parametres", label: "Paramètres" },
];

export function CommercialSubNav() {
  const pathname = usePathname();
  const refActive = referentiel.some(
    (l) => pathname === l.href || pathname.startsWith(`${l.href}/`),
  );

  return (
    <nav
      className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
      aria-label="Devis & Facturation"
    >
      {primary.map((l) => {
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
      {/*
        Portal via HeaderDropdown : le menu absolute était masqué par le contenu
        frère (page) sous la barre — pas un overflow:hidden sur le nav.
      */}
      <HeaderDropdown
        key={pathname}
        panelId="commercial-referentiel-menu"
        align="left"
        width={176}
        zIndex={50}
        panelClassName="rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
        trigger={({ onClick, expanded, triggerRef }) => (
          <button
            ref={triggerRef}
            type="button"
            onClick={onClick}
            aria-expanded={expanded}
            aria-haspopup="menu"
            aria-controls="commercial-referentiel-menu"
            className={cn(
              "inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm",
              refActive || expanded
                ? "bg-slate-100 text-[#1e3a5f]"
                : "text-slate-600 hover:bg-slate-50",
            )}
          >
            Référentiel ▾
          </button>
        )}
      >
        {referentiel.map((l) => {
          const active =
            pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              role="menuitem"
              className={cn(
                "block rounded-lg px-3 py-2 text-xs font-semibold",
                active
                  ? "bg-slate-100 text-[#1e3a5f]"
                  : "text-slate-700 hover:bg-slate-50",
              )}
              aria-current={active ? "page" : undefined}
            >
              {l.label}
            </Link>
          );
        })}
      </HeaderDropdown>
    </nav>
  );
}
