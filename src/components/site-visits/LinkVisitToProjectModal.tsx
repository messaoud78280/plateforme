"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import {
  visitProjectCoherenceWarning,
  type LinkableProject,
} from "@/lib/site-visits/link-project";

type VisitSnapshot = {
  id: string;
  clientName: string;
  siteAddress: string;
  visitCity?: string | null;
};

/**
 * Rattache une visite existante à un chantier de l'organisation courante.
 * N'écrit que projectId — aucune donnée visite n'est écrasée.
 */
export function LinkVisitToProjectModal({
  visit,
  onClose,
  onLinked,
}: {
  visit: VisitSnapshot;
  onClose: () => void;
  onLinked: (payload: {
    projectId: string;
    projectTitle: string | null;
    projectHref: string | null;
    visit: Record<string, unknown>;
  }) => void;
}) {
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<LinkableProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LinkableProject | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/site-visits/linkable-projects?q=${encodeURIComponent(q)}`,
      );
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Recherche impossible");
      setProjects((data?.projects as LinkableProject[]) ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(query), query ? 220 : 0);
    return () => window.clearTimeout(t);
  }, [query, load]);

  const warning = selected
    ? visitProjectCoherenceWarning({
        visitClientName: visit.clientName,
        visitAddress: visit.siteAddress,
        visitCity: visit.visitCity,
        projectTitle: selected.title,
        projectClientName: selected.clientName,
        projectAddress: selected.siteAddress,
        projectCity: selected.siteCity,
      })
    : null;

  async function confirmLink() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/site-visits/${visit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: selected.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Rattachement impossible");
      const linked = data?.visit as Record<string, unknown> | undefined;
      onLinked({
        projectId: selected.id,
        projectTitle:
          (typeof linked?.projectTitle === "string" && linked.projectTitle) ||
          selected.title,
        projectHref:
          (typeof linked?.projectHref === "string" && linked.projectHref) ||
          `/dashboard/projets/${selected.id}`,
        visit: linked ?? {},
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-visit-title"
        className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
      >
        <div className="border-b border-slate-100 px-4 py-3">
          <h2
            id="link-visit-title"
            className="text-[16px] font-semibold text-[#1e3a5f]"
          >
            {confirming ? "Confirmer le rattachement" : "Lier à un chantier"}
          </h2>
          <p className="mt-0.5 text-[12px] text-slate-500">
            La visite conserve ses données (client, adresse, mesures, photos…).
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-4 py-3">
          {error ? (
            <p className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              {error}
            </p>
          ) : null}

          {!confirming ? (
            <>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Rechercher
                </span>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelected(null);
                  }}
                  placeholder="Nom, client, ville, adresse…"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px] outline-none focus:border-[#1e3a5f]/40"
                />
              </label>

              <ul className="mt-3 space-y-1.5">
                {loading ? (
                  <li className="px-2 py-3 text-[13px] text-slate-500">
                    Recherche…
                  </li>
                ) : projects.length === 0 ? (
                  <li className="px-2 py-3 text-[13px] text-slate-500">
                    Aucun chantier trouvé dans votre organisation.
                  </li>
                ) : (
                  projects.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(p)}
                        className={cn(
                          "w-full rounded-xl border px-3 py-2.5 text-left transition",
                          selected?.id === p.id
                            ? "border-[#1e3a5f] bg-[#1e3a5f]/5"
                            : "border-slate-200 hover:bg-slate-50",
                        )}
                      >
                        <span className="block text-[14px] font-semibold text-[#1e3a5f]">
                          {p.title}
                        </span>
                        <span className="mt-0.5 block text-[12px] text-slate-600">
                          {[p.clientName, p.siteAddress, p.siteCity]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                        <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {p.statusLabel}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </>
          ) : selected ? (
            <div className="space-y-3">
              <p className="text-[14px] text-slate-800">
                Rattacher cette visite au chantier{" "}
                <span className="font-semibold text-[#1e3a5f]">
                  {selected.title}
                </span>{" "}
                ?
              </p>
              <dl className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] text-slate-700">
                <div className="flex justify-between gap-2 py-1">
                  <dt className="text-slate-500">Client chantier</dt>
                  <dd>{selected.clientName || "—"}</dd>
                </div>
                <div className="flex justify-between gap-2 py-1">
                  <dt className="text-slate-500">Adresse</dt>
                  <dd className="text-right">
                    {[selected.siteAddress, selected.siteCity]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 py-1">
                  <dt className="text-slate-500">Statut</dt>
                  <dd>{selected.statusLabel}</dd>
                </div>
              </dl>
              {warning ? (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
                  {warning}
                  <span className="mt-1 block text-[12px] text-amber-800">
                    Les données de la visite ne seront pas modifiées.
                  </span>
                </p>
              ) : null}
            </div>
          ) : null}
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
          {!confirming ? (
            <button
              type="button"
              disabled={!selected || busy}
              onClick={() => setConfirming(true)}
              className="rounded-xl bg-[#1e3a5f] px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
            >
              Continuer
            </button>
          ) : (
            <>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirming(false)}
                className="rounded-xl border border-slate-200 px-3.5 py-2 text-[13px] font-medium text-slate-700 hover:bg-slate-50"
              >
                Retour
              </button>
              <button
                type="button"
                disabled={busy || !selected}
                onClick={() => void confirmLink()}
                className="rounded-xl bg-[#1e3a5f] px-3.5 py-2 text-[13px] font-semibold text-white disabled:opacity-40"
              >
                {busy ? "Rattachement…" : "Confirmer"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
