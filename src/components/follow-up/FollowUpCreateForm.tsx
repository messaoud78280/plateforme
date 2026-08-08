"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function FollowUpCreateForm({
  projects,
}: {
  projects: { id: string; title: string }[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      clientName: String(fd.get("clientName") || "").trim(),
      title: String(fd.get("title") || fd.get("clientName") || "").trim(),
      siteAddress: String(fd.get("siteAddress") || "").trim() || undefined,
      orderNumber: String(fd.get("orderNumber") || "").trim() || undefined,
      osNumber: String(fd.get("osNumber") || "").trim() || undefined,
      workObject: String(fd.get("workObject") || "").trim() || undefined,
      nextActionAt: String(fd.get("nextActionAt") || "") || undefined,
      projectId: String(fd.get("projectId") || "") || undefined,
      nextAction: "Analyser le dossier",
      status: "NOUVEAU",
    };
    try {
      const res = await fetch("/api/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Création impossible");
        return;
      }
      router.push(`/dashboard/fiches-suivi/${data.id}`);
      router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-600">
        Remplacez le geste « dossier + post-it » : seulement l’essentiel pour démarrer.
      </p>
      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700">Client / chantier *</span>
        <input
          name="clientName"
          required
          placeholder="Résidence Victor Hugo"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700">Titre affiché</span>
        <input
          name="title"
          placeholder="Identique au client si vide"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700">Adresse</span>
        <input name="siteAddress" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-700">N° commande</span>
          <input name="orderNumber" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-700">N° OS</span>
          <input name="osNumber" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700">Objet des travaux</span>
        <input
          name="workObject"
          placeholder="Réfection étanchéité terrasse"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-xs font-semibold text-slate-700">Date éventuelle</span>
        <input
          name="nextActionAt"
          type="datetime-local"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>
      {projects.length > 0 && (
        <label className="block space-y-1">
          <span className="text-xs font-semibold text-slate-700">Chantier lié (optionnel)</span>
          <select name="projectId" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
            <option value="">—</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-xl bg-[#1e3a5f] px-4 py-3 text-sm font-bold text-white hover:bg-[#16304f] disabled:opacity-60"
      >
        {saving ? "Création…" : "Créer la fiche"}
      </button>
    </form>
  );
}
