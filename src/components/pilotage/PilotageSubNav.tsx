"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PILOTAGE_LIST_PATH } from "@/lib/pilotage/constants";

const base =
  "inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm";

const links = [
  { href: PILOTAGE_LIST_PATH, label: "Portefeuille", exact: true },
  { href: `${PILOTAGE_LIST_PATH}/a-traiter`, label: "À traiter" },
  { href: `${PILOTAGE_LIST_PATH}/blocages`, label: "Blocages" },
  { href: `${PILOTAGE_LIST_PATH}/calendrier`, label: "Calendrier" },
  { href: `${PILOTAGE_LIST_PATH}/modeles`, label: "Modèles" },
  { href: `${PILOTAGE_LIST_PATH}/nouveau`, label: "Nouveau pilotage" },
];

export function PilotageSubNav() {
  const pathname = usePathname();
  return (
    <nav
      className="flex flex-wrap gap-1.5 rounded-xl border border-[#1e3a5f]/10 bg-white p-1.5 shadow-sm"
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
            className={
              active
                ? `${base} bg-[color:var(--pilotage-navy)] text-white shadow-sm`
                : `${base} text-slate-700 hover:bg-[color:var(--pilotage-navy-soft)]`
            }
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
