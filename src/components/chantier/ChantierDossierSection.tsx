"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  CHANTIER_FILE_STATUS_COLORS,
  CHANTIER_FILE_STATUS_LABELS,
} from "@/lib/chantier-dossier/constants";

export type ChantierFolderWithFiles = {
  id: string;
  code: string;
  label: string;
  files: {
    id: string;
    name: string;
    fileUrl: string | null;
    documentType: string | null;
    status: keyof typeof CHANTIER_FILE_STATUS_LABELS;
    comment: string | null;
    createdAt: string;
    addedBy: { name: string } | null;
  }[];
};

export function ChantierDossierSection({
  projectId,
  folders,
  canEdit,
}: {
  projectId: string;
  folders: ChantierFolderWithFiles[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [expandedFolder, setExpandedFolder] = useState<string | null>(folders[0]?.id ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function uploadToFolder(folderId: string, file: File) {
    setBusy(folderId);
    setError("");
    const fd = new FormData();
    fd.set("projectId", projectId);
    fd.set("folderId", folderId);
    fd.set("file", file);
    try {
      const res = await fetch("/api/chantier/files/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erreur upload");
      else router.refresh();
    } catch {
      setError("Erreur réseau");
    } finally {
      setBusy(null);
    }
  }

  async function addPlaceholder(folderId: string) {
    const name = window.prompt("Intitulé de la pièce à récupérer (ex. Assurance décennale ST, BL livraison menuiseries…) :");
    if (!name?.trim()) return;
    setBusy(folderId);
    setError("");
    try {
      const res = await fetch("/api/chantier/files/placeholder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, folderId, name: name.trim(), status: "MANQUANT" }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Erreur");
      else router.refresh();
    } finally {
      setBusy(null);
    }
  }

  async function updateStatus(fileId: string, status: string) {
    setBusy(fileId);
    try {
      await fetch(`/api/chantier/files/${fileId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <section id="dossier-chantier" className="scroll-mt-24 rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-900">Classeur chantier (documents)</h2>
        <p className="mt-1 text-sm text-slate-600">
          11 rubriques standard BTP — déposez les pièces au bon endroit, ou marquez une pièce à récupérer.
        </p>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>

      <div className="divide-y divide-slate-100">
        {folders.map((folder) => {
          const open = expandedFolder === folder.id;
          const missingCount = folder.files.filter((f) => f.status === "MANQUANT" || f.status === "A_RELANCER").length;
          return (
            <div key={folder.id}>
              <button
                type="button"
                onClick={() => setExpandedFolder(open ? null : folder.id)}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left hover:bg-slate-50/80"
              >
                <span className="min-w-0">
                  <span className="font-mono text-xs font-semibold text-[#1d4ed8]">{folder.code}</span>
                  <span className="ml-2 font-medium text-slate-900">{folder.label}</span>
                  <span className="ml-2 text-sm text-slate-500">
                    ({folder.files.length} doc{folder.files.length !== 1 ? "s" : ""})
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {missingCount > 0 ? (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                      {missingCount} à récupérer
                    </span>
                  ) : null}
                  <span className="text-slate-400">{open ? "▾" : "▸"}</span>
                </span>
              </button>

              {open ? (
                <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                  {canEdit ? (
                    <div className="mb-4 flex flex-wrap gap-2">
                      <label className="cursor-pointer rounded-lg border border-dashed border-[#1d4ed8]/50 bg-white px-4 py-2 text-sm font-medium text-[#1d4ed8] hover:bg-[#eff6ff]">
                        {busy === folder.id ? "Envoi…" : "+ Déposer un fichier"}
                        <input
                          type="file"
                          className="sr-only"
                          disabled={busy === folder.id}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void uploadToFolder(folder.id, f);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        disabled={busy === folder.id}
                        onClick={() => void addPlaceholder(folder.id)}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        + Pièce à récupérer
                      </button>
                    </div>
                  ) : null}

                  {folder.files.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      Aucun document pour l’instant. Déposez une pièce ou marquez une pièce à récupérer.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {folder.files.map((file) => (
                        <li
                          key={file.id}
                          className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900">{file.name}</p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {file.documentType ? `${file.documentType} · ` : ""}
                              {new Date(file.createdAt).toLocaleDateString("fr-FR")}
                              {file.addedBy ? ` · ${file.addedBy.name}` : ""}
                            </p>
                            {file.comment ? (
                              <p className="mt-1 text-xs text-slate-600">{file.comment}</p>
                            ) : null}
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CHANTIER_FILE_STATUS_COLORS[file.status]}`}
                            >
                              {CHANTIER_FILE_STATUS_LABELS[file.status]}
                            </span>
                            {file.fileUrl ? (
                              <a
                                href={file.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-[#1d4ed8] hover:underline"
                              >
                                Ouvrir
                              </a>
                            ) : null}
                            {canEdit ? (
                              <select
                                value={file.status}
                                disabled={busy === file.id}
                                onChange={(e) => void updateStatus(file.id, e.target.value)}
                                className="rounded border border-slate-300 px-2 py-1 text-xs"
                                aria-label="Statut du document"
                              >
                                {Object.entries(CHANTIER_FILE_STATUS_LABELS).map(([k, label]) => (
                                  <option key={k} value={k}>
                                    {label}
                                  </option>
                                ))}
                              </select>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
