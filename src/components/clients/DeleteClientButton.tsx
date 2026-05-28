"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  clientId: string;
  clientName: string;
  projectsCount: number;
  tasksCount: number;
  redirectTo?: string;
  label?: string;
  className?: string;
};

export function DeleteClientButton({
  clientId,
  clientName,
  projectsCount,
  tasksCount,
  redirectTo = "/dashboard/clients",
  label = "Supprimer",
  className = "",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    const ok = window.confirm(
      `Supprimer le client « ${clientName} » ?\n\n` +
        `Cette action est définitive :\n` +
        `• ${projectsCount} chantier(s) / projet(s)\n` +
        `• ${tasksCount} mission(s)\n` +
        `• compte, messages, documents et classeurs associés\n\n` +
        `Le compte ne pourra plus se connecter.`
    );
    if (!ok) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Impossible de supprimer ce client.");
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className={`rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50 ${className}`}
      >
        {loading ? "Suppression…" : label}
      </button>
      {error ? <span className="max-w-[14rem] text-right text-[11px] text-red-600">{error}</span> : null}
    </span>
  );
}
