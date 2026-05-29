"use client";

import { useState, useRef } from "react";
import {
  MISSION_DOCUMENT_MAX_BYTES,
  MISSION_DOCUMENT_MAX_LABEL,
} from "@/lib/storage/document-upload-policy";

const CATEGORY_LABELS: Record<string, string> = {
  FACTURE: "Facture",
  CONTRAT: "Contrat",
  RH: "RH",
  FISCAL: "Fiscal",
  AUTRE: "Autre",
};

interface DocumentUploadZoneProps {
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
  category?: string;
  isAgent?: boolean;
  assignedTasks?: { id: string; title: string }[];
  /** Mission (tâche) pour associer les documents — utilisé côté client ou agent */
  taskId?: string;
}

export function DocumentUploadZone({
  onUploadStart,
  onUploadEnd,
  category = "AUTRE",
  isAgent = false,
  assignedTasks = [],
  taskId,
}: DocumentUploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const list = Array.from(e.dataTransfer.files).filter((f) => f.size <= MISSION_DOCUMENT_MAX_BYTES);
    setFiles((prev) => [...prev, ...list]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []).filter((f) => f.size <= MISSION_DOCUMENT_MAX_BYTES);
    setFiles((prev) => [...prev, ...list]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const upload = async () => {
    if (files.length === 0) return;
    if (isAgent && assignedTasks.length > 0 && !selectedTaskId) {
      setMessage({ type: "error", text: "Veuillez sélectionner une mission." });
      return;
    }
    setMessage(null);
    onUploadStart?.();
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("category", category);
      const tid = taskId || (isAgent && selectedTaskId ? selectedTaskId : null);
      if (tid) formData.set("taskId", tid);
      files.forEach((f) => formData.append("files", f));
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Erreur lors de l’envoi" });
        return;
      }
      setMessage({
        type: "ok",
        text: `${data.created?.length ?? 0} document(s) déposé(s).${data.errors?.length ? " " + data.errors.join(" ") : ""}`,
      });
      setFiles([]);
      onUploadEnd?.();
    } catch (e) {
      setMessage({ type: "error", text: (e as Error).message });
    } finally {
      setUploading(false);
      onUploadEnd?.();
    }
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6">
      {isAgent && assignedTasks.length === 0 && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Aucune mission assignée. Vous pourrez déposer des documents une fois qu’une mission vous sera attribuée.
        </p>
      )}
      {isAgent && assignedTasks.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700">Mission concernée</label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Sélectionner une mission</option>
            {assignedTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <p className="mb-2 text-sm font-medium text-slate-700">
        Déposer des fichiers (tous types — max {MISSION_DOCUMENT_MAX_LABEL})
      </p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition ${
          dragging ? "border-blue-400 bg-blue-50" : "border-slate-300 bg-white"
        }`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <span className="text-4xl">📁</span>
        <p className="mt-2 text-sm text-slate-600">
          Glissez-déposez ou cliquez pour sélectionner
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-slate-700">{files.length} fichier(s) sélectionné(s)</p>
          <ul className="max-h-32 space-y-1 overflow-y-auto text-sm text-slate-600">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-red-600 hover:underline"
                >
                  Retirer
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={upload}
            disabled={
              uploading ||
              (isAgent && assignedTasks.length > 0 && !selectedTaskId)
            }
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? "Envoi…" : "Déposer les documents"}
          </button>
        </div>
      )}

      {message && (
        <p
          className={`mt-4 text-sm ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
