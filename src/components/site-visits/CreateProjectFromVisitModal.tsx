"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { CreateProjectFromVisitDraft } from "@/lib/site-visits/create-project-from-visit";

/**
 * Prévisualisation + création d’un chantier depuis une visite (sans ressaisie).
 */
export function CreateProjectFromVisitModal({
  visitId,
  onClose,
  onCreated,
}: {
  visitId: string;
  onClose: () => void;
  onCreated: (payload: {
    projectId: string;
    projectTitle: string;
    projectHref: string;
    visit: Record<string, unknown>;
  }) => void;
}) {
  const [draft, setDraft] = useState<CreateProjectFromVisitDraft | null>(null);
  const [title, setTitle] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/site-visits/${visitId}/create-project`);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Chargement impossible");
        if (cancelled) return;
        const d = data.draft as CreateProjectFromVisitDraft;
        setDraft(d);
        setTitle(d.proposedTitle);
        setScopes(
          d.proposedScopes.length === 1
            ? [...d.proposedScopes]
            : d.proposedScopes.length > 1
              ? [...d.proposedScopes]
              : [],
        );
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erreur");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visitId]);

  function toggleScope(name: string) {
    setScopes((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  }

  async function confirmCreate() {
    if (submitting.current || busy) return;
    if (!title.trim()) {
      setError("Indiquez un titre de chantier.");
      return;
    }
    if (draft && draft.proposedScopes.length > 1 && scopes.length === 0) {
      setError("Confirmez au moins un métier / périmètre.");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/site-visits/${visitId}/create-project`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: draft?.worksDescription ?? null,
          siteAddress: draft?.siteAddress ?? null,
          siteCity: draft?.city ?? null,
          zipCode: draft?.zipCode ?? null,
          scopes:
            scopes.length > 0
              ? scopes
              : draft?.proposedScopes.length === 1
                ? draft.proposedScopes
                : [],
          assignedToId: draft?.responsibleId ?? null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Création impossible");
      onCreated({
        projectId: data.projectId,
        projectTitle: data.projectTitle,
        projectHref: data.projectHref,
        visit: (data.visit as Record<string, unknown>) ?? {},
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      submitting.current = false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-from-visit-title"
        className="max-h-[92vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <h2
            id="create-project-from-visit-title"
            className="text-[16px] font-semibold text-[#1e3a5f]"
          >
            Créer un chantier depuis cette visite
          </h2>
          <p className="mt-0.5 text-[12px] text-slate-500">
            Les données de la visite restent inchangées — le chantier est créé
            puis rattaché automatiquement.
          </p>
        </div>

        <div className="max-h-[65vh] space-y-4 overflow-y-auto px-4 py-3">
          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              {error}
            </p>
          ) : null}

          {loading || !draft ? (
            <p className="py-6 text-center text-[13px] text-slate-500">
              Préparation…
            </p>
          ) : draft.alreadyLinked ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900">
              Cette visite est déjà liée à un chantier.
            </p>
          ) : (
            <>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Titre du chantier
                </span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px] outline-none focus:border-[#1e3a5f]/40"
                />
              </label>

              <section className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px]">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Client
                </p>
                <p className="mt-1 font-medium text-slate-900">{draft.clientName}</p>
                <p className="text-[12px] text-slate-600">
                  {[draft.contactPhone, draft.contactEmail]
                    .filter(Boolean)
                    .join(" · ") || "Coordonnées non renseignées"}
                </p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px]">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Chantier
                </p>
                <p className="mt-1 text-slate-900">{draft.siteAddress || "—"}</p>
                <p className="text-[12px] text-slate-600">
                  {[draft.zipCode, draft.city].filter(Boolean).join(" ") || "—"}
                </p>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[13px]">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Travaux
                </p>
                <p className="mt-1 whitespace-pre-wrap text-slate-800">
                  {draft.worksDescription || "Non renseignés"}
                </p>
                {draft.lots.length > 0 ? (
                  <p className="mt-1 text-[12px] text-slate-600">
                    Types : {draft.lots.join(", ")}
                  </p>
                ) : null}
              </section>

              {draft.proposedScopes.length > 0 ? (
                <section>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Métiers / périmètres
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    {draft.proposedScopes.length > 1
                      ? "Plusieurs métiers détectés — confirmez ceux à créer sur le chantier."
                      : "Périmètre proposé depuis la visite."}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {draft.proposedScopes.map((s) => {
                      const active = scopes.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleScope(s)}
                          className={cn(
                            "rounded-full px-3 py-1.5 text-[12px] font-medium",
                            active
                              ? "bg-[#1e3a5f] text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                          )}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null}

              {draft.responsibleName ? (
                <p className="text-[12px] text-slate-600">
                  Responsable :{" "}
                  <span className="font-medium text-slate-800">
                    {draft.responsibleName}
                  </span>
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl px-3.5 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={
              busy ||
              loading ||
              !draft ||
              draft.alreadyLinked ||
              !title.trim()
            }
            onClick={() => void confirmCreate()}
            className="rounded-xl bg-[#1e3a5f] px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            {busy ? "Création…" : "Créer le chantier"}
          </button>
        </div>
      </div>
    </div>
  );
}
