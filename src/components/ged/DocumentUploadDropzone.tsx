"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type UploadState = {
  name: string;
  status: "pending" | "uploading" | "ok" | "error";
  error?: string;
};

export function DocumentUploadDropzone({
  open,
  onClose,
  projects,
  defaultProjectId,
  canUpload,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  projects: { id: string; title: string }[];
  defaultProjectId?: string;
  canUpload: boolean;
  onUploaded?: () => void;
}) {
  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || "");
  const [drag, setDrag] = useState(false);
  const [rows, setRows] = useState<UploadState[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && defaultProjectId) setProjectId(defaultProjectId);
  }, [open, defaultProjectId]);

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!canUpload || !projectId || files.length === 0) return;
      setBusy(true);
      const next: UploadState[] = files.map((f) => ({ name: f.name, status: "pending" }));
      setRows(next);
      for (let i = 0; i < files.length; i++) {
        setRows((prev) =>
          prev.map((r, idx) => (idx === i ? { ...r, status: "uploading" } : r)),
        );
        const fd = new FormData();
        fd.set("projectId", projectId);
        fd.set("file", files[i]);
        try {
          const res = await fetch("/api/chantier/files/upload", { method: "POST", body: fd });
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          setRows((prev) =>
            prev.map((r, idx) =>
              idx === i
                ? res.ok
                  ? { ...r, status: "ok" }
                  : { ...r, status: "error", error: data.error ?? "Échec" }
                : r,
            ),
          );
        } catch {
          setRows((prev) =>
            prev.map((r, idx) =>
              idx === i ? { ...r, status: "error", error: "Erreur réseau" } : r,
            ),
          );
        }
      }
      setBusy(false);
      if (files.length > 0) onUploaded?.();
    },
    [canUpload, projectId, onUploaded],
  );

  if (!open) return null;

  const done = rows.filter((r) => r.status === "ok").length;
  const failed = rows.filter((r) => r.status === "error").length;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 p-4 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-bework-navy/10 bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Ajouter des documents"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-bework-navy">Ajouter des documents</h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Les fichiers sont classés automatiquement à partir du chantier et du nom.
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Fermer">
            ×
          </button>
        </div>

        {projects.length > 1 ? (
          <label className="mt-4 block text-[12px] font-medium text-slate-500">
            Chantier
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              disabled={busy}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="mt-3 text-[13px] text-slate-600">{projects[0]?.title}</p>
        )}

        <button
          type="button"
          disabled={!projectId || busy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            void uploadFiles(Array.from(e.dataTransfer.files));
          }}
          className={cn(
            "mt-4 flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-10 text-center transition",
            drag
              ? "border-bework-accent bg-bework-soft-accent/50"
              : "border-bework-navy/20 bg-bework-soft-navy/40 hover:border-bework-navy/35",
            (!projectId || busy) && "opacity-60",
          )}
        >
          <p className="text-[15px] font-semibold text-bework-navy">Déposez vos documents ici</p>
          <p className="mt-1 text-[13px] text-slate-500">ou cliquez pour parcourir — plusieurs fichiers possibles</p>
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            void uploadFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />

        {rows.length > 0 ? (
          <ul className="mt-4 max-h-40 space-y-1.5 overflow-y-auto text-[13px]">
            {rows.map((r, i) => (
              <li key={`${r.name}-${i}`} className="flex items-center justify-between gap-2">
                <span className="truncate text-slate-700">{r.name}</span>
                <span
                  className={cn(
                    "shrink-0 text-[12px] font-medium",
                    r.status === "ok" && "text-bework-ok",
                    r.status === "error" && "text-bework-critical",
                    r.status === "uploading" && "text-bework-accent",
                    r.status === "pending" && "text-slate-400",
                  )}
                >
                  {r.status === "ok"
                    ? "Ajouté"
                    : r.status === "error"
                      ? r.error
                      : r.status === "uploading"
                        ? "Envoi…"
                        : "En attente"}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {rows.length > 0 && !busy ? (
          <p className="mt-3 text-[12px] text-slate-500">
            {done} ajouté{done > 1 ? "s" : ""}
            {failed ? ` · ${failed} erreur${failed > 1 ? "s" : ""}` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}
