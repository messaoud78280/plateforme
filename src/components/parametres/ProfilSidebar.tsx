"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { label: "Informations personnelles", href: "/dashboard/parametres/informations" },
  { label: "Paramètres et préférences", href: "/dashboard/parametres/preferences" },
  { label: "Transfert d'appels", href: "/dashboard/parametres/transfert-appels" },
  { label: "Préférences de sécurité", href: "/dashboard/parametres/securite" },
];

export function ProfilSidebar() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 w-56 shrink-0" aria-label="Dans cette section">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[#64748b]">
        Dans cette section
      </h2>
      <ul className="space-y-0.5">
        {sections.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "font-medium text-[#0f172a] bg-[#f1f5f9]"
                    : "text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]"
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
