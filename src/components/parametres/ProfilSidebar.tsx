"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { label: "Vue d'ensemble", href: "/dashboard/parametres" },
  { label: "Informations personnelles", href: "/dashboard/parametres/informations" },
  { label: "Paramètres et préférences", href: "/dashboard/parametres/preferences" },
  { label: "Transfert d'appels", href: "/dashboard/parametres/transfert-appels" },
  { label: "Préférences de sécurité", href: "/dashboard/parametres/securite" },
];

export function ProfilSidebar() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 w-56 shrink-0" aria-label="Dans cette section">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-black">
        Dans cette section
      </h2>
      <ul className="space-y-0.5">
        {sections.map((item) => {
          const isActive = item.href === "/dashboard/parametres"
            ? pathname === "/dashboard/parametres"
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "font-medium text-black bg-[#f1f5f9]"
                    : "text-black hover:bg-[#f8fafc] hover:text-black"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
