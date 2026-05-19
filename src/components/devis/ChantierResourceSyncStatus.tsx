import Link from "next/link";
import { SITE_RESOURCE_TYPE_LABELS } from "@/lib/chantier-resources/labels";
import type { LibrarySyncStats } from "@/lib/chantier-resources/automated-library-sync";

type Props = {
  resourceTotal: number;
  ranNow: boolean;
  skippedBecauseRecent: boolean;
  lastRunAt: string | null;
  stats: LibrarySyncStats | null;
  forceSyncHref: string;
};

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-bold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}

export function ChantierResourceSyncStatus({
  resourceTotal,
  ranNow,
  skippedBecauseRecent,
  lastRunAt,
  stats,
  forceSyncHref,
}: Props) {
  const lastLabel = lastRunAt
    ? new Date(lastRunAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })
    : "Jamais";

  return (
    <div className="space-y-6">
      <div
        className={`rounded-xl border px-4 py-3 text-sm ${
          ranNow
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : skippedBecauseRecent
              ? "border-sky-200 bg-sky-50 text-sky-900"
              : "border-slate-200 bg-slate-50 text-slate-800"
        }`}
      >
        {ranNow ? (
          <p className="font-semibold">Synchronisation terminée à l&apos;instant.</p>
        ) : skippedBecauseRecent ? (
          <p>
            Dernière synchro récente ({lastLabel}) — pas de relance automatique (limite 1 h). Utilisez « Forcer la
            synchro » pour relancer.
          </p>
        ) : (
          <p>Dernière synchro : {lastLabel}</p>
        )}
      </div>

      {stats ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-heading text-lg font-bold text-slate-900">Résultat de la synchronisation</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Ouvrages parcourus" value={stats.workItemsProcessed} />
            <Stat label="Éléments extraits" value={stats.candidatesExtracted} />
            <Stat label="Alias regroupés" value={stats.aliasesMerged} />
            <Stat label="Nouvelles fiches" value={stats.resourcesCreated} />
            <Stat label="Fiches existantes enrichies" value={stats.resourcesMatched} />
            <Stat label="Variantes créées" value={stats.variantsCreated} />
            <Stat label="Alias doublons retirés" value={stats.aliasesRemoved} />
            <Stat label="Fiches fusionnées" value={stats.resourceFichesMerged} />
          </dl>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-slate-900">État du référentiel</h2>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{resourceTotal}</span> fiche
          {resourceTotal !== 1 ? "s" : ""} ressource active (hors fusionnées).
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Types couverts :{" "}
          {Object.entries(SITE_RESOURCE_TYPE_LABELS)
            .map(([k, v]) => v)
            .join(" · ")}
          , dont locations engins et locations outillage.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/devis/ressources-chantier"
            className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af]"
          >
            Voir les ressources chantier
          </Link>
          <Link
            href={forceSyncHref}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Forcer la synchro
          </Link>
        </div>
      </section>
    </div>
  );
}
