"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const segmentLabels: Record<string, string> = {
  informations: "Informations personnelles",
  preferences: "Paramètres et préférences",
  "transfert-appels": "Transfert d'appels",
  securite: "Préférences de sécurité",
};

export function ProfilBreadcrumb() {
  const pathname = usePathname();
  const segment = pathname.replace("/dashboard/parametres", "").replace(/^\//, "").split("/")[0];
  const currentLabel = segment && segmentLabels[segment] ? segmentLabels[segment] : "Vue d'ensemble";
  const showSegment = segment && segmentLabels[segment];

  return (
    <nav aria-label="Fil d'Ariane" className="mb-4 text-sm text-[#64748b]">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/dashboard/parametres" className="hover:text-[#0f172a]">
            Votre profil
          </Link>
        </li>
        {showSegment && (
          <>
            <li aria-hidden>/</li>
            <li className="font-medium text-[#0f172a]">{currentLabel}</li>
          </>
        )}
      </ol>
    </nav>
  );
}
