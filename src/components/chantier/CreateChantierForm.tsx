"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ClientOption = { id: string; name: string };

const CHANTIER_STATUSES = [
  { value: "ETUDE", label: "Étude" },
  { value: "EN_COURS", label: "En cours" },
  { value: "EN_ATTENTE", label: "En attente" },
  { value: "RECEPTION", label: "Réception" },
  { value: "TERMINE", label: "Terminé" },
] as const;

export function CreateChantierForm({
  clients,
  showClientPicker,
}: {
  clients?: ClientOption[];
  showClientPicker?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState(clients?.[0]?.id ?? "");
  const [siteAddress, setSiteAddress] = useState("");
  const [siteCity, setSiteCity] = useState("");
  const [internalManager, setInternalManager] = useState("");
  const [chantierStatus, setChantierStatus] = useState("ETUDE");
  const [signedQuoteAmount, setSignedQuoteAmount] = useState("");
  const [plannedStartDate, setPlannedStartDate] = useState("");
  const [plannedEndDate, setPlannedEndDate] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (showClientPicker && !clientId) {
      setError("Sélectionnez un client.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/projets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          clientId: showClientPicker ? clientId : undefined,
          siteAddress: siteAddress.trim() || null,
          siteCity: siteCity.trim() || null,
          internalManager: internalManager.trim() || null,
          chantierStatus,
          signedQuoteAmount: signedQuoteAmount ? Number(signedQuoteAmount) : null,
          plannedStartDate: plannedStartDate || null,
          plannedEndDate: plannedEndDate || null,
          description: description.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la création.");
        return;
      }
      router.push(`/dashboard/projets/${data.id}`);
      router.refresh();
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-[#1d4ed8] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af]"
      >
        + Nouveau chantier
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Créer un chantier</h2>
          <p className="mt-1 text-sm text-slate-600">
            Les 11 rubriques du dossier (devis, contrats, planning, DOE…) seront créées automatiquement.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          Fermer
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">
            Nom du chantier <span className="text-red-600">*</span>
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Ex. Résidence Les Hortensias — TCE"
          />
        </div>

        {showClientPicker && clients ? (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label className="block text-sm font-medium text-slate-700">Adresse chantier</label>
          <input
            value={siteAddress}
            onChange={(e) => setSiteAddress(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Ville</label>
          <input
            value={siteCity}
            onChange={(e) => setSiteCity(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Responsable interne</label>
          <input
            value={internalManager}
            onChange={(e) => setInternalManager(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="Conducteur de travaux, chef de chantier…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Statut chantier</label>
          <select
            value={chantierStatus}
            onChange={(e) => setChantierStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            {CHANTIER_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Montant devis signé (€ HT)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={signedQuoteAmount}
            onChange={(e) => setSignedQuoteAmount(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Démarrage prévu</label>
          <input
            type="date"
            value={plannedStartDate}
            onChange={(e) => setPlannedStartDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Fin prévue</label>
          <input
            type="date"
            value={plannedEndDate}
            onChange={(e) => setPlannedEndDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Description courte</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af] disabled:opacity-60"
        >
          {loading ? "Création…" : "Créer le chantier"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
