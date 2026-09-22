"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BibliothequeUniverseSwitcher,
  type BibliothequeUniverse,
} from "@/components/ged/BibliothequeUniverseSwitcher";
import {
  type LibraryHubRow,
  type LibraryHubStats,
} from "@/components/commercial/LibraryHub";
import { LibraryWorkspace } from "@/components/commercial/library/LibraryWorkspace";
import { GED_SHELL_CLASS, GedPageHeader } from "@/components/ged/GedUi";

type FamilyNode = {
  family: string;
  count: number;
  subFamilies: Array<{ name: string; count: number }>;
};

type Props = {
  initialItems: LibraryHubRow[];
  initialTotal: number;
  stats: LibraryHubStats;
  families: FamilyNode[];
  materialsPreview: Parameters<typeof LibraryWorkspace>[0]["materialsPreview"];
  laborPreview: Parameters<typeof LibraryWorkspace>[0]["laborPreview"];
  equipmentPreview?: Parameters<typeof LibraryWorkspace>[0]["equipmentPreview"];
  minMarginPercent: number | null;
  targetMarginPercent: number | null;
  canAccessOuvrages: boolean;
};

function OuvragesPrixUniverseInner(props: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createOpen =
    searchParams.get("create") === "ouvrage" || searchParams.get("create") === "1";

  const {
    initialItems,
    initialTotal,
    stats,
    families,
    materialsPreview,
    laborPreview,
    equipmentPreview,
    minMarginPercent,
    targetMarginPercent,
    canAccessOuvrages,
  } = props;

  if (!canAccessOuvrages) {
    return (
      <div className={GED_SHELL_CLASS}>
        <GedPageHeader
          title="Bibliothèque"
          subtitle="Votre catalogue d’ouvrages, matériaux, matériels et main-d’œuvre."
        />
        <BibliothequeUniverseSwitcher
          value="ouvrages"
          onChange={(u: BibliothequeUniverse) => {
            if (u === "documents") router.push("/dashboard/documents?universe=documents");
          }}
          showOuvrages
        />
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Le référentiel ouvrages &amp; prix n’est pas disponible pour ce profil.
        </p>
      </div>
    );
  }

  return (
    <div className={GED_SHELL_CLASS}>
      <div className="space-y-3">
        <GedPageHeader
          title="Bibliothèque"
          subtitle="Votre catalogue d’ouvrages, matériaux, matériels et main-d’œuvre."
        />
        <BibliothequeUniverseSwitcher
          value="ouvrages"
          onChange={(u) => {
            if (u === "documents") {
              router.push("/dashboard/documents?universe=documents");
            }
          }}
        />
      </div>
      <LibraryWorkspace
        initialCreateOpen={createOpen}
        initialItems={initialItems}
        initialTotal={initialTotal}
        stats={stats}
        families={families}
        materialsPreview={materialsPreview}
        laborPreview={laborPreview}
        equipmentPreview={equipmentPreview}
        minMarginPercent={minMarginPercent}
        targetMarginPercent={targetMarginPercent}
      />
    </div>
  );
}

export function OuvragesPrixUniverse(props: Props) {
  return (
    <Suspense
      fallback={
        <div className={GED_SHELL_CLASS}>
          <GedPageHeader
            title="Bibliothèque"
            subtitle="Votre catalogue d’ouvrages, matériaux, matériels et main-d’œuvre."
          />
          <p className="text-sm text-bework-muted">Chargement du référentiel…</p>
        </div>
      }
    >
      <OuvragesPrixUniverseInner {...props} />
    </Suspense>
  );
}
