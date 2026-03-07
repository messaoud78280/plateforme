"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PLACEHOLDER = "ex: préparer devis client Dupont, relancer facture Martin, rechercher fournisseur Lyon";

export function QuickDelegationForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = value.trim();
    if (!title) {
      setError("Décrivez brièvement ce que vous souhaitez déléguer.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Erreur lors de l’envoi.");
        setLoading(false);
        return;
      }
      setValue("");
      setLoading(false);
      router.refresh();
      if (data?.id) {
        router.push(`/dashboard/taches/${data.id}`);
      }
    } catch {
      setError("Erreur de connexion.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={PLACEHOLDER}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-lg bg-[#1d4ed8] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#1e40af] disabled:opacity-60"
        >
          {loading ? "Envoi…" : "Envoyer la demande"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
