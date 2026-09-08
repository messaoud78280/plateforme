"use client";

import { useEffect, useState } from "react";

type ClientForm = {
  name: string;
  email: string;
  phone: string;
  address: string;
  zipCode: string;
  city: string;
};

export function ClientCoordsEditModal({
  open,
  onClose,
  quoteId,
  clientExternalOrgId,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  quoteId: string;
  clientExternalOrgId: string | null;
  initial: ClientForm;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ClientForm>(initial);
  const [scope, setScope] = useState<"quote" | "client">("quote");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(initial);
    setScope("quote");
    setError(null);
  }, [open, initial]);

  if (!open) return null;

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const snapshot = {
        name: form.name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        addressLine1: form.address.trim() || null,
        zipCode: form.zipCode.trim() || null,
        postalCode: form.zipCode.trim() || null,
        city: form.city.trim() || null,
      };
      if (scope === "client" && clientExternalOrgId) {
        const res = await fetch(`/api/commercial/clients/${clientExternalOrgId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name.trim() || undefined,
            email: form.email.trim() || null,
            phone: form.phone.trim() || null,
            address: form.address.trim() || null,
            zipCode: form.zipCode.trim() || null,
            city: form.city.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Échec fiche client");
      }
      const resQ = await fetch(`/api/commercial/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientSnapshotJson: snapshot }),
      });
      const dataQ = await resQ.json();
      if (!resQ.ok) throw new Error(dataQ.error || "Échec devis");
      onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Fermer"
        className="fixed inset-0 z-40 bg-slate-900/35"
        onClick={() => !busy && onClose()}
      />
      <div className="fixed left-1/2 top-1/2 z-50 w-[min(100%-1.5rem,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <p className="text-sm font-bold text-[#1e3a5f]">Coordonnées client</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setScope("quote")}
            className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
              scope === "quote" ? "bg-[#1e3a5f] text-white" : "bg-slate-100"
            }`}
          >
            Modifier ce devis uniquement
          </button>
          {clientExternalOrgId ? (
            <button
              type="button"
              onClick={() => setScope("client")}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold ${
                scope === "client" ? "bg-[#1e3a5f] text-white" : "bg-slate-100"
              }`}
            >
              Mettre à jour la fiche client
            </button>
          ) : null}
        </div>
        {error ? (
          <p className="mt-2 text-xs text-red-700">{error}</p>
        ) : null}
        <div className="mt-3 space-y-2">
          {(
            [
              ["name", "Nom / société"],
              ["email", "Email"],
              ["phone", "Téléphone"],
              ["address", "Adresse"],
              ["zipCode", "Code postal"],
              ["city", "Ville"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                {label}
              </span>
              <input
                value={form[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
              />
            </label>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-slate-600"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void save()}
            className="rounded-lg bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </>
  );
}
