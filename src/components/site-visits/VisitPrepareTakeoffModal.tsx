"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { TakeoffCreateFromChatgptModal } from "@/components/chantier/TakeoffCreateFromChatgptModal";
import { CreateProjectFromVisitModal } from "@/components/site-visits/CreateProjectFromVisitModal";

/**
 * Préparer le métré depuis une visite.
 * - ChatGPT (contexte TAKEOFF CREATE) toujours disponible, même sans Project.
 * - Enregistrement PrepStudy : via Project (existant ou à créer).
 */
export function VisitPrepareTakeoffModal({
  visitId,
  projectId,
  onClose,
  onProjectLinked,
}: {
  visitId: string;
  projectId?: string | null;
  onClose: () => void;
  onProjectLinked?: (payload: {
    projectId: string;
    projectTitle: string | null;
    projectHref: string | null;
    visit: Record<string, unknown>;
  }) => void;
}) {
  const [linkedProjectId, setLinkedProjectId] = useState(projectId ?? null);
  const [step, setStep] = useState<"context" | "need_project" | "create_project">(
    projectId ? "context" : "context",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const effectiveProjectId = linkedProjectId || projectId || null;

  const copyContext = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      if (effectiveProjectId) {
        const res = await fetch(
          `/api/projets/${effectiveProjectId}/takeoff-create/context`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ visitId }),
          },
        );
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          if (data?.code === "STUDY_ALREADY_EXISTS" && data?.studyId) {
            throw new Error(
              "Un métré existe déjà — ouvrez-le depuis le dossier chantier.",
            );
          }
          throw new Error(data?.error ?? "Contexte indisponible");
        }
        await navigator.clipboard.writeText(data.text);
      } else {
        const res = await fetch(
          `/api/site-visits/${visitId}/takeoff-create/context`,
          { method: "POST" },
        );
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Contexte indisponible");
        await navigator.clipboard.writeText(data.text);
      }
      setCopied(true);
      setToast(
        "Contexte MÉTRÉ (TAKEOFF CREATE) copié — expected_output : bework_prep_bundle_v1",
      );
      window.setTimeout(() => setToast(null), 4500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Copie impossible");
    } finally {
      setBusy(false);
    }
  }, [effectiveProjectId, visitId]);

  useEffect(() => {
    if (effectiveProjectId) return;
    void copyContext();
  }, [copyContext, effectiveProjectId]);

  if (effectiveProjectId && step === "context") {
    return (
      <TakeoffCreateFromChatgptModal
        projectId={effectiveProjectId}
        visitId={visitId}
        onClose={onClose}
      />
    );
  }

  if (step === "create_project") {
    return (
      <CreateProjectFromVisitModal
        visitId={visitId}
        onClose={() => setStep("need_project")}
        onCreated={(payload) => {
          setLinkedProjectId(payload.projectId);
          onProjectLinked?.(payload);
          setStep("context");
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-[16px] font-semibold text-[#1e3a5f]">
            Préparer le métré avec ChatGPT
          </h2>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Sortie attendue : <code>bework_prep_bundle_v1</code> — pas un devis.
          </p>
        </div>
        <div className="space-y-3 px-4 py-3 text-[13px] text-slate-700">
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-800">
              {error}
            </p>
          ) : null}
          {toast ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900">
              {toast}
            </p>
          ) : null}
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>Copiez le contexte TAKEOFF CREATE (visite + sources).</li>
            <li>Discutez avec ChatGPT — aucune cote inventée.</li>
            <li>
              Récupérez un JSON <code>bework_prep_bundle_v1</code>.
            </li>
            <li>
              Pour l’enregistrer dans BeWork, un chantier est requis (PrepStudy
              lié au Project).
            </li>
          </ol>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => void copyContext()}
              className="rounded-xl bg-[#1e3a5f] px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
            >
              {busy
                ? "…"
                : copied
                  ? "Contexte métré recopié"
                  : "Copier le contexte métré"}
            </button>
            <button
              type="button"
              onClick={() => setStep("create_project")}
              className="rounded-xl border border-[#1e3a5f]/20 px-3.5 py-2 text-[13px] font-semibold text-[#1e3a5f]"
            >
              + Créer le chantier pour enregistrer
            </button>
            <Link
              href="/dashboard/visites-metres"
              className="rounded-xl px-3 py-2 text-[12px] font-medium text-slate-500 hover:underline"
              onClick={onClose}
            >
              Plus tard
            </Link>
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3.5 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
