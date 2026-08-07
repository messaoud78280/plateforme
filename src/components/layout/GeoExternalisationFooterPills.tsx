"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EXTERNALISATION_ADMIN_BT_NAV } from "@/lib/externalisation-administrative-btp-geo";

/** Pastilles pays — mise en évidence automatique selon la page SEO ouverte. */
export function GeoExternalisationFooterPills() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Déploiement plateforme BTP par pays">
      {EXTERNALISATION_ADMIN_BT_NAV.map((z) => {
        const active = pathname === z.href;
        return (
          <Link
            key={z.key}
            href={z.href}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
              active
                ? "border-sky-600 bg-sky-50 text-sky-700"
                : "border-slate-300 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            {z.title === "Suisse" ? "Suisse romande" : z.title}
          </Link>
        );
      })}
    </nav>
  );
}
