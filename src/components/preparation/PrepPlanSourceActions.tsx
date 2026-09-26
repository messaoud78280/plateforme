"use client";

import { useEffect, useRef, useState } from "react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachOpen, setAttachOpen] = useState(autoOpenAttach);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [planNumber, setPlanNumber] = useState(
    planSource?.source.planNumber ?? "C-01",
  );
  const [revision, setRevision] = useState(planSource?.source.revision ?? "");

  useEffect(() => {
    setPlanNumber(planSource?.source.planNumber ?? "C-01");
    setRevision(planSource?.source.revision ?? "");
  }, [planSource?.source.planNumber, planSource?.source.revision]);

  useEffect(() => {
    if (!attachOpen) return;
    let cancelled = false;
    (async () => {
      setLoadingCandidates(true);
      setError(null);
      try {
        const res = await fetch(`/api/prep-studies/${studyId}/plan-source`);
        const data = await res.json().catch(() => null);
        if (cancelled) return;
        if (!res.ok) {
          setError(data?.error ?? "Chargement impossible");
          return;
        }
        setCandidates(data.candidates ?? []);
      } finally {
        if (!cancelled) setLoadingCandidates(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [attachOpen, studyId]);

  async function attach(
    fileId: string,
    meta?: { planNumber?: string; revision?: string | null },
  ): Promise<boolean> {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/prep-studies/${studyId}/plan-source`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chantierFileId: fileId,
          sourceId: planSource?.source.id,
          planNumber: meta?.planNumber ?? (planNumber.trim() || null),
          revision:
            meta && "revision" in meta
              ? meta.revision
              : revision.trim() || null,
          title: planSource?.source.title ?? null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Rattachement impossible");
      setAttachOpen(false);
      setSuccess("Plan source rattaché");
      router.refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function uploadAndAttach(file: File) {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      const ref = planNumber.trim() || planSource?.source.planNumber || "C-01";
      const rev = revision.trim() || null;
      const displayName =
        planSource?.source.filename?.trim() ||
        (ref ? `Plan d'exécution ${ref}.pdf` : file.name);

      const fd = new FormData();
      fd.set("projectId", projectId);
      fd.set("file", file);
      fd.set("name", displayName);
      fd.set("category", "Plans");
      fd.set(
        "documentType",
        ref ? `Plan d'exécution ${ref}` : "Plan d'exécution",
      );
      fd.set("subcategory", "Plan d'exécution");
      if (rev) fd.set("indice", rev);
      fd.set("versionLabel", rev || "1");
      fd.set("visibility", "Interne entreprise cliente");
      fd.set("linkEntityType", "PREP_STUDY");
      fd.set("linkEntityId", studyId);
      fd.set("linkEntityLabel", `Métré · plan source ${ref}`);

      const uploadRes = await fetch("/api/chantier/files/upload", {
        method: "POST",
        body: fd,
      });
      const uploadData = await uploadRes.json().catch(() => null);
      if (!uploadRes.ok) {
        throw new Error(uploadData?.error ?? "Échec de l'envoi du fichier");
      }
      const fileId = String(uploadData?.id ?? "").trim();
      if (!fileId) throw new Error("Identifiant document manquant après upload");

      const ok = await attach(fileId, { planNumber: ref, revision: rev });
      if (!ok) return;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setBusy(false);
    }
  }

  const viewHref =
    planSource?.file && !planSource.fileMissing
      ? `/dashboard/projets/${projectId}/plan-source?studyId=${encodeURIComponent(studyId)}&fileId=${encodeURIComponent(planSource.file.id)}&from=metre`
      : null;

  const planLabel =
    planSource?.displayTitle ??
    (planNumber.trim() ? `Plan d'exécution ${planNumber.trim()}` : "Plan source");

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
            Changer / rattacher une autre révision
          </button>
        ) : null}
      </div>

      {planSource && !planSource.fileMissing && planSource.file ? (
        <p className="text-[12px] text-emerald-800">
          {planLabel}
          {planSource.revisionLabel ? ` · révision ${planSource.revisionLabel}` : ""}
          {" · "}PDF rattaché
        </p>
      ) : null}

      {planSource && planSource.fileMissing ? (
        <p className="text-[12px] text-amber-800">
          Plan source identifié ({planLabel}
          {planSource.revisionLabel ? ` · ${planSource.revisionLabel}` : ""}) mais fichier non
          rattaché.
        </p>
      ) : null}

      {success ? (
        <p className="text-[12px] font-medium text-emerald-800">{success}</p>
      ) : null}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf,image/*,.dwg,.dxf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void uploadAndAttach(file);
        }}
      />

      {attachOpen ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-semibold text-[#1e3a5f]">
                Plan source — dépôt ou rattachement
              </p>
              <p className="mt-0.5 text-[12px] text-slate-500">
                Le fichier est stocké dans la GED du chantier, puis figé sur ce métré.
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => setAttachOpen(false)}
              className="text-[12px] text-slate-500 hover:text-slate-800 disabled:opacity-50"
            >
              Fermer
            </button>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="block text-[12px]">
              <span className="font-medium text-slate-600">Référence</span>
              <input
                value={planNumber}
                onChange={(e) => setPlanNumber(e.target.value)}
                placeholder="C-01"
                disabled={busy}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-[#1e3a5f]/40"
              />
            </label>
            <label className="block text-[12px]">
              <span className="font-medium text-slate-600">Révision (optionnel)</span>
              <input
                value={revision}
                onChange={(e) => setRevision(e.target.value)}
                placeholder="R1"
                disabled={busy}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-[#1e3a5f]/40"
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
            >
              {busy ? "Envoi…" : `Déposer le plan ${planNumber.trim() || "C-01"}`}
            </button>
            <Link
              href={`/dashboard/documents?projectId=${encodeURIComponent(projectId)}&returnTo=${encodeURIComponent(`/dashboard/visites-metres/etudes/${studyId}?attachPlan=1`)}&studyId=${encodeURIComponent(studyId)}&attachPlan=1${planSource?.source.id ? `&sourceId=${encodeURIComponent(planSource.source.id)}` : ""}`}
              className="rounded-full border border-slate-200 px-4 py-2 text-[13px] font-medium text-slate-700"
            >
              Choisir dans Plans & documents
            </Link>
          </div>

          {error ? (
            <p className="mt-2 text-[12px] text-red-700">{error}</p>
          ) : null}

          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="text-[12px] font-semibold text-slate-700">
              Ou rattacher un document existant
            </p>

            {loadingCandidates ? (
              <p className="mt-2 text-[12px] text-slate-500">Chargement…</p>
            ) : candidates.length === 0 ? (
              <div className="mt-2 space-y-2 text-[13px] text-slate-600">
                <p>Aucun plan n’est encore rattaché à ce chantier.</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-[12px] font-medium text-amber-950 disabled:opacity-50"
                >
                  Déposer le plan {planNumber.trim() || "C-01"}
                </button>
              </div>
            ) : (
              <ul className="mt-2 divide-y divide-slate-100">
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
        </div>
      ) : null}
    </div>
  );
}
