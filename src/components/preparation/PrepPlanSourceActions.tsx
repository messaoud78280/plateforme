"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { ResolvedPlanSource } from "@/lib/preparation/plan-source";

type Candidate = {
  id: string;
  name: string;
  documentType: string | null;
  indice: string | null;
  versionLabel: string | null;
  documentDate: Date | string | null;
  mimeType: string | null;
  isCurrentVersion: boolean;
};

export function PrepPlanSourceActions({
  studyId,
  projectId,
  planSource,
  autoOpenAttach = false,
}: {
  studyId: string;
  projectId: string;
  planSource: ResolvedPlanSource | null;
  autoOpenAttach?: boolean;
}) {
  const router = useRouter();
  const [attachOpen, setAttachOpen] = useState(autoOpenAttach);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attachOpen) return;
    let cancelled = false;
    (async () => {
      setError(null);
      const res = await fetch(`/api/prep-studies/${studyId}/plan-source`);
      const data = await res.json().catch(() => null);
      if (cancelled) return;
      if (!res.ok) {
        setError(data?.error ?? "Chargement impossible");
        return;
      }
      setCandidates(data.candidates ?? []);
    })();
    return () => {
      cancelled = true;
    };
  }, [attachOpen, studyId]);

  async function attach(fileId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/prep-studies/${studyId}/plan-source`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chantierFileId: fileId,
          sourceId: planSource?.source.id,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Rattachement impossible");
      setAttachOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const viewHref =
    planSource?.file && !planSource.fileMissing
      ? `/dashboard/projets/${projectId}/plan-source?studyId=${encodeURIComponent(studyId)}&fileId=${encodeURIComponent(planSource.file.id)}&from=metre`
      : null;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {viewHref ? (
          <Link
            href={viewHref}
            className="rounded-full border border-[#1e3a5f]/30 bg-white px-4 py-2 text-[13px] font-medium text-[#1e3a5f]"
          >
            Voir le plan source
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => setAttachOpen(true)}
            className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-[13px] font-medium text-amber-950"
          >
            Rattacher le plan source
          </button>
        )}
        {viewHref ? (
          <button
            type="button"
            onClick={() => setAttachOpen(true)}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] text-slate-700"
          >
            Changer le fichier
          </button>
        ) : null}
        <Link
          href={`/dashboard/documents?projectId=${encodeURIComponent(projectId)}`}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] text-slate-700"
        >
          Plans & documents
        </Link>
      </div>

      {planSource && planSource.fileMissing ? (
        <p className="text-[12px] text-amber-800">
          Plan source identifié ({planSource.displayTitle}
          {planSource.revisionLabel ? ` · ${planSource.revisionLabel}` : ""}) mais fichier non
          rattaché.
        </p>
      ) : null}

      {attachOpen ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-[#1e3a5f]">
                Rattacher un document existant
              </p>
              <p className="mt-0.5 text-[12px] text-slate-500">
                La révision choisie reste figée pour ce métré (pas de remplacement silencieux).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAttachOpen(false)}
              className="text-[12px] text-slate-500 hover:text-slate-800"
            >
              Fermer
            </button>
          </div>

          {error ? (
            <p className="mt-2 text-[12px] text-red-700">{error}</p>
          ) : null}

          {candidates.length === 0 ? (
            <div className="mt-3 space-y-2 text-[13px] text-slate-600">
              <p>Aucun plan trouvé dans la GED de ce chantier.</p>
              <Link
                href={`/dashboard/documents?projectId=${encodeURIComponent(projectId)}`}
                className="inline-flex rounded-full bg-[#1e3a5f] px-3 py-1.5 text-[12px] font-medium text-white"
              >
                Ajouter le plan source
              </Link>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {candidates.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-slate-800">{c.name}</p>
                    <p className="text-[11.5px] text-slate-500">
                      {[
                        c.documentType,
                        c.indice ? `Ind. ${c.indice}` : c.versionLabel,
                        c.isCurrentVersion ? "Version courante" : "Ancienne version",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void attach(c.id)}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-[12px] font-medium text-white disabled:opacity-50",
                      "bg-[#1e3a5f]",
                    )}
                  >
                    Rattacher
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
