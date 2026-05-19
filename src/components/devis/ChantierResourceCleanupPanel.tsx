"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  applyDuplicateResourceCleanup,
  dedupeAllSiteResourceAliases,
  previewDuplicateResourceCleanup,
} from "@/app/dashboard/devis/ressources-chantier-actions";
import type { DuplicateCleanupPreview } from "@/lib/chantier-resources/deduplication";

export function ChantierResourceCleanupPanel() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<DuplicateCleanupPreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function runPreview() {
    setError(null);
    setDone(null);
    startTransition(async () => {
      try {
        const p = await previewDuplicateResourceCleanup();
        setPreview(p);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur lors de l’analyse.");
      }
    });
  }

  function runAliasDedupe() {
    setError(null);
    setDone(null);
    startTransition(async () => {
      try {
        const res = await dedupeAllSiteResourceAliases();
        setDone(
          `${res.removed} alias en double supprimé(s) sur ${res.resourcesAffected} fiche(s) (un libellé normalisé = un alias).`,
        );
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur lors du nettoyage des alias.");
      }
    });
  }

  function runApply() {
    if (!preview) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await applyDuplicateResourceCleanup(preview);
        setDone(
          `${res.merged} fusion(s), ${res.removed} doublon(s) strict(s) retiré(s), ${res.pricesAdded} prix observé(s) conservé(s).`,
        );
        setPreview(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur lors du nettoyage.");
      }
    });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-heading text-lg font-bold text-slate-900">Nettoyer les doublons identiques</h2>
      <p className="mt-1 max-w-3xl text-sm text-slate-600">
        Analyse dry-run : fusion des fiches strictement identiques, conservation des prix, sources et ouvrages liés.
        Aucune suppression définitive — les doublons sont marqués « fusionné » vers la fiche principale.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={runPreview}
          className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
        >
          {pending && !preview ? "Analyse…" : "Analyser (dry-run)"}
        </button>
        {preview ? (
          <button
            type="button"
            disabled={pending || preview.groups.length === 0}
            onClick={runApply}
            className="rounded-xl bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50"
          >
            {pending ? "Fusion…" : "Valider le nettoyage"}
          </button>
        ) : null}
        <button
          type="button"
          disabled={pending}
          onClick={runAliasDedupe}
          className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-50"
        >
          Supprimer les alias en double (toutes fiches)
        </button>
      </div>

      {error ? <p className="mt-3 text-sm font-medium text-red-700">{error}</p> : null}
      {done ? <p className="mt-3 text-sm font-medium text-emerald-800">{done}</p> : null}

      {preview ? (
        <div className="mt-5 space-y-4">
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Ressources analysées" value={preview.totalAnalyzed} />
            <Stat label="Doublons stricts supprimables" value={preview.strictDuplicatesRemovable} />
            <Stat label="Groupes à fusionner" value={preview.groupingMergeGroups} />
            <Stat label="Ressources après nettoyage" value={preview.resourcesAfterGrouping} />
            <Stat label="Prix à conserver" value={preview.pricesToPreserve} />
            <Stat label="Sources distinctes" value={preview.sourcesPreserved} />
            <Stat label="Ouvrages liés" value={preview.workItemLinksPreserved} />
            <Stat label="Corrections classification" value={preview.classificationFixes.length} />
          </dl>

          {preview.groups.length > 0 ? (
            <details className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-sm">
              <summary className="cursor-pointer font-semibold text-slate-800">
                Détail des {preview.groups.length} groupe(s) de fusion
              </summary>
              <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                {preview.groups.slice(0, 40).map((g) => (
                  <li key={g.groupingKey} className="rounded border border-slate-200 bg-white px-3 py-2">
                    <p className="font-medium text-slate-900">{g.canonicalShortName}</p>
                    <p className="text-xs text-slate-500">
                      {g.strictDuplicateIds.length} doublon(s) strict(s) · {g.mergeWithPriceIds.length} avec prix
                      différent(s) · {g.priceObservationsToAdd.length} prix observé(s) · {g.memberIds.length} fiche(s)
                    </p>
                  </li>
                ))}
              </ul>
            </details>
          ) : (
            <p className="text-sm text-slate-600">Aucun groupe de fusion détecté sur le périmètre actuel.</p>
          )}

          {preview.classificationFixes.length > 0 ? (
            <details className="rounded-lg border border-amber-100 bg-amber-50/50 p-3 text-sm">
              <summary className="cursor-pointer font-semibold text-amber-950">
                {preview.classificationFixes.length} correction(s) de classification proposée(s)
              </summary>
              <ul className="mt-2 space-y-1 text-amber-950">
                {preview.classificationFixes.slice(0, 15).map((f) => (
                  <li key={f.id}>
                    {f.shortName} → {f.suggestedType} / {f.suggestedFamily}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">{value}</dd>
    </div>
  );
}
