"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";

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
  const [refOpen, setRefOpen] = useState(false);
  const refActive = referentiel.some(
    (l) => pathname === l.href || pathname.startsWith(`${l.href}/`),
  );

  return (
    <nav
      className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
      aria-label="Gestion commerciale"
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
      <div className="relative">
        <button
          type="button"
          onClick={() => setRefOpen((v) => !v)}
          className={cn(
            "inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm",
            refActive || refOpen
              ? "bg-slate-100 text-[#1e3a5f]"
              : "text-slate-600 hover:bg-slate-50",
          )}
        >
          Référentiel ▾
        </button>
        {refOpen ? (
          <div className="absolute left-0 z-20 mt-1 min-w-[11rem] rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
            {referentiel.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setRefOpen(false)}
                className="block rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {l.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
