"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  projectId: string;
  projectTitle: string;
  redirectTo?: string;
  label?: string;
  className?: string;
};

export function DeleteChantierButton({
  projectId,
  projectTitle,
  redirectTo,
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
      `Supprimer le chantier « ${projectTitle} » ?\n\nTout le classeur (documents, rubriques, pièces) sera effacé définitivement. Les missions liées au chantier resteront mais ne seront plus rattachées à ce dossier.`
    );
    if (!ok) return;

    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/projets/${projectId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Impossible de supprimer ce chantier.");
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
        router.refresh();
      } else {
        router.refresh();
      }
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
