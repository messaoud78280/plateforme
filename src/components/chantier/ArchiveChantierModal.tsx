"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";

type Mode = "archive" | "restore" | "hard-delete";

type Props = {
  projectId: string;
  projectTitle: string;
  mode: Mode;
  open: boolean;
  onClose: () => void;
  redirectTo?: string;
  commercialLock?: boolean;
  commercialReasons?: string[];
};

export function ArchiveChantierModal({
  projectId,
  projectTitle,
  mode,
  open,
  onClose,
  redirectTo,
  commercialLock = false,
  commercialReasons = [],
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");

  useEffect(() => {
    if (!open) {
      setError("");
      setConfirmation("");
      setLoading(false);
    }
  }, [open]);

  if (!open) return null;

  const title =
    mode === "archive"
      ? "Supprimer ce chantier ?"
      : mode === "restore"
        ? "Restaurer ce chantier ?"
        : "Supprimer définitivement ?";

  const explain =
    mode === "archive"
      ? "Le chantier sera retiré des listes actives. Les éléments du dossier resteront conservés tant qu’il n’est pas supprimé définitivement."
      : mode === "restore"
        ? "Le chantier réapparaîtra dans les listes actives (Chantiers, Planning, Visites, Devis…)."
        : commercialLock
          ? "Ce chantier contient des documents commerciaux et ne peut pas être supprimé définitivement."
          : "Cette action est irréversible. Visite, photos, métré, devis, planning et documents seront effacés.";

  async function submit() {
    if (loading) return;
    if (mode === "hard-delete" && commercialLock) return;
    setLoading(true);
    setError("");
    try {
      const action =
        mode === "archive"
          ? "archive"
          : mode === "restore"
            ? "restore"
            : "hard-delete";
      const res = await fetch(`/api/projets/${projectId}/archive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          confirmation: mode === "hard-delete" ? confirmation : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Action impossible.");
        return;
      }
      onClose();
      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-chantier-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2
            id="archive-chantier-title"
            className="text-[1.05rem] font-semibold tracking-tight text-slate-900"
          >
            {title}
          </h2>
          <p className="mt-2 text-[13.5px] font-medium leading-snug text-[#1e3a5f]">
            {projectTitle}
          </p>
        </div>
        <div className="space-y-3 px-5 py-4">
          <p className="text-[13.5px] leading-relaxed text-slate-600">{explain}</p>
          {commercialReasons.length > 0 ? (
            <ul className="rounded-xl bg-amber-50/80 px-3 py-2.5 text-[12.5px] text-amber-950 ring-1 ring-amber-200/70">
              {commercialReasons.map((r) => (
                <li key={r} className="list-disc list-inside">
                  {r}
                </li>
              ))}
            </ul>
          ) : null}
          {mode === "hard-delete" && !commercialLock ? (
            <label className="block space-y-1.5">
              <span className="text-[12px] font-medium text-slate-600">
                Saisissez <span className="font-semibold">SUPPRIMER</span> ou le
                nom du chantier
              </span>
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                placeholder="SUPPRIMER"
                autoComplete="off"
              />
            </label>
          ) : null}
          {error ? (
            <p className="text-[12.5px] font-medium text-rose-700">{error}</p>
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl px-3.5 py-2 text-[13px] font-medium text-slate-600 hover:bg-white hover:text-slate-900 disabled:opacity-50"
          >
            Annuler
          </button>
          {mode === "hard-delete" && commercialLock ? null : (
            <button
              type="button"
              onClick={submit}
              disabled={
                loading ||
                (mode === "hard-delete" && confirmation.trim().length < 3)
              }
              className={cn(
                "rounded-xl px-3.5 py-2 text-[13px] font-semibold text-white shadow-sm disabled:opacity-50",
                mode === "restore"
                  ? "bg-[#1e3a5f] hover:bg-[#163050]"
                  : "bg-rose-600/90 hover:bg-rose-600",
              )}
            >
              {loading
                ? "…"
                : mode === "archive"
                  ? "Supprimer le chantier"
                  : mode === "restore"
                    ? "Restaurer"
                    : "Supprimer définitivement"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
