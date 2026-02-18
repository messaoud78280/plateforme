"use client";

import { useState, useRef } from "react";

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
}

export function DocumentUploadZone({
  onUploadStart,
  onUploadEnd,
  category = "AUTRE",
}: DocumentUploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const list = Array.from(e.dataTransfer.files).filter(
      (f) => f.size <= 10 * 1024 * 1024 && /\.(pdf|jpg|jpeg|png|docx|xlsx)$/i.test(f.name)
    );
    setFiles((prev) => [...prev, ...list]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []).filter(
      (f) => f.size <= 10 * 1024 * 1024 && /\.(pdf|jpg|jpeg|png|docx|xlsx)$/i.test(f.name)
    );
    setFiles((prev) => [...prev, ...list]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const upload = async () => {
    if (files.length === 0) return;
    setMessage(null);
    onUploadStart?.();
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("category", category);
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
      <p className="mb-2 text-sm font-medium text-slate-700">
        Déposer des fichiers (PDF, JPG, PNG, DOCX, XLSX — max 10 Mo)
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
          accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
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
            disabled={uploading}
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
