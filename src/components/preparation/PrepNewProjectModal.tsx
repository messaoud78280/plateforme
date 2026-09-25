"use client";

import { useState } from "react";

const CHANTIER_STATUSES = [
  { value: "ETUDE", label: "Étude" },
  { value: "EN_COURS", label: "En cours" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "RECEPTION", label: "Réception" },
  { value: "TERMINE", label: "Terminé" },
] as const;

export type PrepCreatedProject = {
  id: string;
  title: string;
  siteCity: string | null;
};

/**
 * Création de projet depuis Études de métré.
 * Réutilise POST /api/projets (même table Project, même organisation connectée).
 */
export function PrepNewProjectModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (project: PrepCreatedProject) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [siteCity, setSiteCity] = useState("");
  const [chantierStatus, setChantierStatus] = useState("ETUDE");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Le nom du projet est obligatoire.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/projets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          siteAddress: siteAddress.trim() || null,
          siteCity: siteCity.trim() || null,
          chantierStatus,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.id) {
        setError(typeof data?.error === "string" ? data.error : "Création du projet impossible.");
        return;
      }
      onCreated({
        id: String(data.id),
        title: title.trim(),
        siteCity: siteCity.trim() || null,
      });
    } catch {
      setError("Connexion interrompue — le projet n'a pas été créé.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:p-8">
      <form
        onSubmit={(e) => void submit(e)}
        className="w-full max-w-lg rounded-2xl border border-[#1e3a5f]/10 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-[17px] font-semibold text-[#1e3a5f]">Nouveau projet</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Le projet est créé dans votre organisation. Les rubriques du dossier chantier sont préparées
              automatiquement.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full px-2 py-1 text-slate-400 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 px-5 py-4">
          <label className="block text-[13px] font-medium text-slate-700">
            Nom du projet <span className="text-red-600">*</span>
            <input
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. DÉMO — Fondations C-01"
              className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px]"
            />
          </label>

          <label className="block text-[13px] font-medium text-slate-700">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Facultatif — objet du chantier, lot, remarques…"
              className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px]"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-[13px] font-medium text-slate-700">
              Adresse du chantier
              <input
                value={siteAddress}
                onChange={(e) => setSiteAddress(e.target.value)}
                placeholder="Facultatif"
                className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px]"
              />
            </label>
            <label className="block text-[13px] font-medium text-slate-700">
              Ville
              <input
                value={siteCity}
                onChange={(e) => setSiteCity(e.target.value)}
                placeholder="Facultatif"
                className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px]"
              />
            </label>
          </div>

          <label className="block text-[13px] font-medium text-slate-700">
            Statut du chantier
            <select
              value={chantierStatus}
              onChange={(e) => setChantierStatus(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 px-3 py-2 text-[14px]"
            >
              {CHANTIER_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-800">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/80 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full px-4 py-2 text-[13px] text-slate-600"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white disabled:opacity-50"
          >
            {busy ? "Création…" : "Créer le projet"}
          </button>
        </div>
      </form>
    </div>
  );
}
