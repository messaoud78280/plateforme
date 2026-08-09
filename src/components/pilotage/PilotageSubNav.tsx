"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";
import { cn } from "@/lib/cn";

const base =
  "inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm";

/** Navigation principale : vue Project. Chemins contractuels / modèles en secondaire. */
const links = [
  { href: PILOTAGE_LIST_PATH, label: "Portefeuille", exact: true },
  { href: "/dashboard/a-traiter", label: "À traiter", external: true },
  { href: "/dashboard/agenda", label: "Agenda", external: true },
  { href: "/dashboard/projets", label: "Chantiers", external: true },
];

export function PilotageSubNav() {
  const pathname = usePathname();
  return (
    <nav
      className="flex flex-wrap gap-1.5"
      aria-label="Navigation Pilotage travaux"
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
                ? "bg-[#eef2f7] text-[#1e3a5f]"
                : "text-bework-ink/70 hover:bg-slate-50 hover:text-bework-navy",
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
