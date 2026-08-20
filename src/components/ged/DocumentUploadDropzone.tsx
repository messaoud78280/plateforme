"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { HUB_CATEGORY_DEFS } from "@/lib/ged/document-hub-ui";

type UploadState = {
  name: string;
  status: "pending" | "uploading" | "ok" | "error";
  error?: string;
};

const NONE = "__none__";

export function DocumentUploadDropzone({
  open,
  onClose,
  projects,
  defaultProjectId,
  canUpload,
  allowWithoutProject = false,
  onUploaded,
}: {
  open: boolean;
  onClose: () => void;
  projects: { id: string; title: string }[];
  defaultProjectId?: string;
  canUpload: boolean;
  allowWithoutProject?: boolean;
  onUploaded?: () => void;
}) {
  const [projectId, setProjectId] = useState(
    defaultProjectId || projects[0]?.id || (allowWithoutProject ? NONE : ""),
  );
  const [emitterName, setEmitterName] = useState("");
  const [category, setCategory] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [drag, setDrag] = useState(false);
  const [rows, setRows] = useState<UploadState[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setProjectId(defaultProjectId || projects[0]?.id || (allowWithoutProject ? NONE : ""));
    setEmitterName("");
    setCategory("");
    setDocumentType("");
    setRows([]);
  }, [open, defaultProjectId, projects, allowWithoutProject]);

  const canSubmit = Boolean(canUpload && (projectId === NONE ? allowWithoutProject : projectId));

  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (!canSubmit || files.length === 0) return;
      setBusy(true);
      const next: UploadState[] = files.map((f) => ({ name: f.name, status: "pending" }));
      setRows(next);
      for (let i = 0; i < files.length; i++) {
        setRows((prev) =>
          prev.map((r, idx) => (idx === i ? { ...r, status: "uploading" } : r)),
        );
        const fd = new FormData();
        if (projectId === NONE) {
          fd.set("projectId", "");
          fd.set("organizationOnly", "1");
        } else {
          fd.set("projectId", projectId);
        }
        fd.set("file", files[i]);
        if (emitterName.trim()) fd.set("emitterName", emitterName.trim());
        if (category) {
          const def = HUB_CATEGORY_DEFS.find((c) => c.id === category);
          if (def) {
            fd.set("category", def.label);
            fd.set("documentType", documentType || def.label);
          }
        } else if (documentType.trim()) {
          fd.set("documentType", documentType.trim());
        }
        if (!category && !documentType) {
          /* classification auto côté API */
        }
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
    [canSubmit, projectId, emitterName, category, documentType, onUploaded],
  );

  if (!open) return null;

  const done = rows.filter((r) => r.status === "ok").length;
  const failed = rows.filter((r) => r.status === "error").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 p-4 sm:items-center"
      onClick={onClose}
    >
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
              Classement automatique à partir du chantier, du type et du nom. Les champs ci-dessous
              sont optionnels.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-[12px] font-medium text-slate-500 sm:col-span-2">
            Chantier
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              disabled={busy}
            >
              {allowWithoutProject ? <option value={NONE}>Sans chantier</option> : null}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] font-medium text-slate-500">
            Client / émetteur
            <input
              value={emitterName}
              onChange={(e) => setEmitterName(e.target.value)}
              placeholder="Optionnel"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              disabled={busy}
            />
          </label>
          <label className="block text-[12px] font-medium text-slate-500">
            Catégorie
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              disabled={busy}
            >
              <option value="">Auto</option>
              {HUB_CATEGORY_DEFS.filter((c) => c.id !== "autres").map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] font-medium text-slate-500 sm:col-span-2">
            Type de document
            <input
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              placeholder="Ex. Facture, BL, Plan… (optionnel)"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
              disabled={busy}
            />
          </label>
        </div>

        <button
          type="button"
          disabled={!canSubmit || busy}
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
            (!canSubmit || busy) && "opacity-60",
          )}
        >
          <p className="text-[15px] font-semibold text-bework-navy">Déposez vos documents ici</p>
          <p className="mt-1 text-[13px] text-slate-500">
            ou cliquez pour parcourir — plusieurs fichiers possibles
          </p>
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

        {done + failed > 0 ? (
          <p className="mt-3 text-[12px] text-slate-500">
            {done} ajouté{done !== 1 ? "s" : ""}
            {failed > 0 ? ` · ${failed} échec${failed !== 1 ? "s" : ""}` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}
