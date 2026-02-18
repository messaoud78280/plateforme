"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const ACCEPTED_EXT = ".pdf,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.docx,.xlsx,.xls,.csv,.txt,.mp4,.webm,.mov";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 Mo

interface DepotTacheFormProps {
  projects: { id: string; title: string }[];
}

export function DepotTacheForm({ projects = [] }: DepotTacheFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files).filter((f) => f.size <= MAX_FILE_SIZE);
    setFiles((prev) => [...prev, ...list]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []).filter((f) => f.size <= MAX_FILE_SIZE);
    setFiles((prev) => [...prev, ...list]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUploadProgress("");
    const t = title.trim();
    if (!t) {
      setError("Le titre est requis.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          description: description.trim() || undefined,
          projectId: projectId.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors du dépôt.");
        setLoading(false);
        return;
      }
      const taskId = data.id as string;

      if (files.length > 0) {
        setUploadProgress(`Envoi des pièces jointes (${files.length} fichier(s))…`);
        const formData = new FormData();
        formData.set("taskId", taskId);
        formData.set("category", "AUTRE");
        if (projectId.trim()) formData.set("projectId", projectId.trim());
        files.forEach((f) => formData.append("files", f));
        const uploadRes = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error ?? "Tâche créée mais erreur lors de l'envoi des pièces jointes.");
        } else if (uploadData.errors?.length) {
          setError(`Tâche créée. Pièces jointes : ${uploadData.errors.join(" ")}`);
        }
      }

      setTitle("");
      setDescription("");
      setProjectId("");
      setFiles([]);
      router.refresh();
    } catch {
      setError("Erreur de connexion.");
    }
    setLoading(false);
    setUploadProgress("");
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800">Déposer une tâche</h2>
      <p className="mt-1 text-sm text-slate-500">
        Décrivez votre demande. Vous pouvez la rattacher à un projet. L’agence assignera un agent après prise en charge.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {projects.length > 0 && (
          <div>
            <label htmlFor="depot-projet" className="mb-1 block text-sm font-medium text-slate-700">
              Projet (optionnel)
            </label>
            <select
              id="depot-projet"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
            >
              <option value="">— Aucun projet —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor="depot-titre" className="mb-1 block text-sm font-medium text-slate-700">
            Titre de la demande *
          </label>
          <input
            id="depot-titre"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
            placeholder="Ex. Déclaration TVA trimestrielle"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
          />
        </div>
        <div>
          <label htmlFor="depot-description" className="mb-1 block text-sm font-medium text-slate-700">
            Description (optionnel)
          </label>
          <textarea
            id="depot-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            rows={3}
            placeholder="Précisez le contexte, les délais ou les instructions."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Pièces jointes (optionnel)
          </label>
          <p className="mb-2 text-xs text-slate-500">
            Tableaux Excel, photos, captures d&apos;écran, PDF, tableau de suivi… — max 25 Mo par fichier
          </p>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-slate-400 hover:bg-slate-100"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_EXT}
              className="hidden"
              onChange={handleFileSelect}
            />
            <span className="text-2xl">📎</span>
            <p className="mt-1 text-sm text-slate-600">
              Glissez-déposez ou cliquez pour ajouter des fichiers
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              PDF, Excel, images, CSV, Word, vidéos
            </p>
          </div>
          {files.length > 0 && (
            <ul className="mt-3 space-y-2">
              {files.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate text-slate-800" title={f.name}>
                    {f.name}
                  </span>
                  <span className="shrink-0 text-slate-400">{formatSize(f.size)}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                    className="shrink-0 text-red-600 hover:underline"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {uploadProgress && (
          <p className="text-sm text-slate-600">{uploadProgress}</p>
        )}
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Dépôt en cours…" : "Déposer la tâche"}
        </button>
      </form>
    </div>
  );
}
