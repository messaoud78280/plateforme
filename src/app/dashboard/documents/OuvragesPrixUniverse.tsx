"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BibliothequeUniverseSwitcher,
  type BibliothequeUniverse,
} from "@/components/ged/BibliothequeUniverseSwitcher";
import {
  LibraryHub,
  type LibraryHubRow,
  type LibraryHubStats,
} from "@/components/commercial/LibraryHub";
import { GED_SHELL_CLASS, GedPageHeader } from "@/components/ged/GedUi";

type Props = {
  initialItems: LibraryHubRow[];
  stats: LibraryHubStats;
  materialsPreview: Parameters<typeof LibraryHub>[0]["materialsPreview"];
  laborPreview: Parameters<typeof LibraryHub>[0]["laborPreview"];
  equipmentPreview?: Array<{
    id: string;
    name: string;
    unit: string;
    kind: string;
    hourlyCostHt: number | null;
    dailyCostHt: number | null;
  }>;
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
    stats,
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
          subtitle="Ce qui est rangé, ce qui attend une action, et où retrouver chaque pièce."
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
          subtitle="Ce qui est rangé, ce qui attend une action, et où retrouver chaque pièce."
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
      <LibraryHub
        embedded
        initialCreateOpen={createOpen}
        initialItems={initialItems}
        stats={stats}
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
            subtitle="Ce qui est rangé, ce qui attend une action, et où retrouver chaque pièce."
          />
          <p className="text-sm text-bework-muted">Chargement du référentiel…</p>
        </div>
      }
    >
      <OuvragesPrixUniverseInner {...props} />
    </Suspense>
  );
}
