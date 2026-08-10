"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  taskId: string;
  className?: string;
  size?: "sm" | "md";
  /** menu = libellé destructif explicite (Messagerie •••). */
  variant?: "icon" | "menu";
  confirmText?: string;
  onDeleted?: () => void;
};

export function DeleteTaskButton({
  taskId,
  className = "",
  size = "sm",
  variant = "icon",
  confirmText = "Supprimer cette mission ? Cette opération est irréversible.",
  onDeleted,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    const ok = window.confirm(confirmText);
    if (!ok) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (res.ok) {
        onDeleted?.();
        if (!onDeleted) router.push("/dashboard/taches");
      }
    } finally {
      setLoading(false);
    }
  }

  if (variant === "menu") {
    return (
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className={`block w-full px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 ${className}`}
      >
        {loading ? "Suppression…" : "Supprimer la mission"}
      </button>
    );
  }

  const pad = size === "md" ? "px-3 py-2" : "px-2.5 py-2";
  const icon = size === "md" ? "h-4 w-4" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className={`inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white ${pad} text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 ${className}`}
      title="Supprimer la mission"
      aria-label="Supprimer la mission"
    >
      <svg className={icon} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M9 3h6m-7 4h8m-9 0 1 14h8l1-14M10 11v7m4-7v7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

