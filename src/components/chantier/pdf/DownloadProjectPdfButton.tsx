"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { ProjectPdfSection } from "@/lib/chantier/export-project-section-pdf";

type Props = {
  projectId: string;
  section: ProjectPdfSection | "DOSSIER";
  entityId?: string | null;
  label?: string;
  className?: string;
  variant?: "menu" | "button";
};

export function DownloadProjectPdfButton({
  projectId,
  section,
  entityId,
  label = "Télécharger PDF",
  className,
  variant = "button",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ section });
      if (entityId) params.set("entityId", entityId);
      const res = await fetch(
        `/api/projets/${projectId}/export-pdf?${params.toString()}`,
      );
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Génération PDF impossible.");
        return;
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const match = /filename="([^"]+)"/.exec(cd);
      const filename = match?.[1] ?? `${section}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-stretch gap-0.5">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={cn(
          variant === "menu"
            ? "block w-full px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            : "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-[#1e3a5f] shadow-sm hover:bg-slate-50 disabled:opacity-50",
          className,
        )}
      >
        {loading ? "Génération du PDF…" : label}
      </button>
      {error ? (
        <span className="px-1 text-[11px] text-rose-600">{error}</span>
      ) : null}
    </span>
  );
}
