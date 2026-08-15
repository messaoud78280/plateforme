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
  { href: "/dashboard/devis-facturation/bibliotheque", label: "Bibliothèque" },
];

const referentiel = [
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
      className="flex flex-nowrap items-center gap-0.5"
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
              "inline-flex shrink-0 items-center rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors duration-150",
              active
                ? "text-[#1e3a5f]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
            )}
            aria-current={active ? "page" : undefined}
          >
            {l.label}
          </Link>
        );
      })}
      <HeaderDropdown
        key={pathname}
        panelId="commercial-referentiel-menu"
        align="left"
        width={176}
        zIndex={50}
        panelClassName="rounded-xl border border-slate-200 bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
        trigger={({ onClick, expanded, triggerRef }) => (
          <button
            ref={triggerRef}
            type="button"
            onClick={onClick}
            aria-expanded={expanded}
            aria-haspopup="menu"
            aria-controls="commercial-referentiel-menu"
            className={cn(
              "inline-flex shrink-0 items-center rounded-md px-2.5 py-1.5 text-[13px] font-medium",
              refActive || expanded
                ? "text-[#1e3a5f]"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
            )}
          >
            Référentiel
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
                "block rounded-lg px-3 py-2 text-[13px] font-medium",
                active
                  ? "bg-slate-50 text-[#1e3a5f]"
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
