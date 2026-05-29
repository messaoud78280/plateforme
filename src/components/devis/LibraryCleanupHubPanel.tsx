"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  applyHighConfidenceClassificationsBatch,
  listLibraryCleanupJobs,
  normalizeDesignationsBatch,
  runClassificationPreviewBatch,
} from "@/app/dashboard/devis/library-cleanup-actions";
import type { LibraryCleanupJob } from "@prisma/client";

type Props = {
  recentJobs: LibraryCleanupJob[];
};

export function LibraryCleanupHubPanel({ recentJobs: initialJobs }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState(initialJobs);
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);

  function run(fn: () => Promise<void>) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
        const next = await listLibraryCleanupJobs(10);
        setJobs(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur");
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-slate-900">Nettoyage bibliothèque</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600">
          Traitements par lots sécurisés (50–100 ouvrages max). Mode simulation par défaut — aucune fusion globale
          automatique. Les prix observés et variantes sont conservés.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ActionCard
            title="1. Analyser classifications"
            desc="Dry-run : propose reclassements depuis Divers / Non classé."
            href="/dashboard/devis/bibliotheque/nettoyage/reclasser"
            buttonLabel="Voir ouvrages à reclasser"
          />
          <ActionCard
            title="2. Voir doublons détectés"
            desc="Groupes probables, prix observés, ouvrage maître recommandé."
            href="/dashboard/devis/bibliotheque/nettoyage/doublons"
            buttonLabel="Contrôle doublons"
          />
          <ActionCard
            title="3. Recodification"
            desc="BW-MARTIN → BW-XXX-001 (existant)."
            href="/dashboard/devis/bibliotheque/recodification"
            buttonLabel="Recodification"
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const res = await runClassificationPreviewBatch({ batchSize: 50 });
                if (!res.ok) throw new Error(res.error);
                setPreviewJobId(res.jobId);
                setMessage(
                  `Lot analysé : ${res.processed} ouvrage(s), ${res.proposalsCreated} proposition(s)${res.hasMore ? " — cliquez pour le lot suivant" : ""}.`,
                );
              })
            }
            className="rounded-xl bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
          >
            Analyser classifications (lot 1)
          </button>
          {previewJobId ? (
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                run(async () => {
                  const res = await runClassificationPreviewBatch({ jobId: previewJobId, batchSize: 50 });
                  if (!res.ok) throw new Error(res.error);
                  setMessage(
                    `Lot suivant : ${res.processed} ouvrage(s), ${res.proposalsCreated} proposition(s)${res.hasMore ? " — encore des lots" : " — terminé"}.`,
                  );
                  if (!res.hasMore) setPreviewJobId(null);
                })
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              Traiter le lot suivant
            </button>
          ) : null}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const res = await applyHighConfidenceClassificationsBatch({ dryRun: true, batchSize: 50 });
                if (!res.ok) throw new Error(res.error);
                setMessage(`Simulation reclassements sûrs : ${res.applied} applicable(s), ${res.skipped} ignoré(s).`);
              })
            }
            className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
          >
            Simuler reclassements sûrs
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(async () => {
                if (!confirm("Appliquer les reclassements confiance HAUTE uniquement ?")) return;
                const res = await applyHighConfidenceClassificationsBatch({ dryRun: false, batchSize: 50 });
                if (!res.ok) throw new Error(res.error);
                setMessage(`${res.applied} reclassement(s) appliqué(s).`);
              })
            }
            className="rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50"
          >
            Appliquer reclassements sûrs
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(async () => {
                const res = await normalizeDesignationsBatch({ batchSize: 100 });
                if (!res.ok) throw new Error(res.error);
                setMessage(`${res.updated} désignation(s) normalisée(s)${res.hasMore ? " — relancer pour suite" : ""}.`);
              })
            }
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Normaliser désignations (lot)
          </button>
        </div>

        {error ? <p className="mt-4 text-sm font-medium text-red-700">{error}</p> : null}
        {message ? <p className="mt-4 text-sm font-medium text-emerald-800">{message}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="font-heading text-base font-bold text-slate-900">Historique nettoyage</h3>
        {jobs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">Aucun job enregistré.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 text-sm">
            {jobs.map((j) => (
              <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-slate-900">{j.jobType}</p>
                  <p className="text-xs text-slate-500">
                    {j.status} · {j.processedCount} traité(s) · {j.successCount} OK · {j.errorCount} err.
                    {j.dryRun ? " · dry-run" : ""}
                  </p>
                </div>
                <time className="text-xs text-slate-400">{new Date(j.createdAt).toLocaleString("fr-FR")}</time>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ActionCard({
  title,
  desc,
  href,
  buttonLabel,
}: {
  title: string;
  desc: string;
  href: string;
  buttonLabel: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{desc}</p>
      <Link
        href={href}
        className="mt-3 inline-flex text-xs font-semibold text-[#1d4ed8] underline-offset-2 hover:underline"
      >
        {buttonLabel} →
      </Link>
    </div>
  );
}
