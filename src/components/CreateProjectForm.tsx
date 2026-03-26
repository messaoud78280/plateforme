"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const URGENCY_LABELS: Record<string, string> = {
  BASSE: "Basse",
  MOYENNE: "Moyenne",
  HAUTE: "Haute",
  URGENTE: "Urgente",
};

export function CreateProjectForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [dateSouhaitee, setDateSouhaitee] = useState("");
  const [deadline, setDeadline] = useState("");
  const [urgency, setUrgency] = useState<"BASSE" | "MOYENNE" | "HAUTE" | "URGENTE">("MOYENNE");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    setFiles((prev) => [...prev, ...selected]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/projets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          notes: notes.trim() || null,
          dateSouhaitee: dateSouhaitee || null,
          deadline: deadline || null,
          urgency,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la création.");
        setLoading(false);
        return;
      }

      const projectId = data.id as string;

      if (files.length > 0) {
        const formData = new FormData();
        formData.set("projectId", projectId);
        formData.set("category", "AUTRE");
        files.forEach((f) => formData.append("files", f));

        const uploadRes = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error ?? "Projet créé mais erreur lors de l’envoi des fichiers.");
        }
        if (uploadData.errors?.length) {
          setError((err) => (err ? err + " " : "") + uploadData.errors.join(" "));
        }
      }

      setTitle("");
      setDescription("");
      setNotes("");
      setDateSouhaitee("");
      setDeadline("");
      setUrgency("MOYENNE");
      setFiles([]);
      setOpen(false);
      router.refresh();
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          + Nouveau projet
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl surface-metallic-light p-6"
        >
          <h3 className="text-lg font-semibold text-slate-800">Créer un projet</h3>
          <p className="mt-1 text-sm text-slate-500">
            Décrivez votre demande, les délais et joignez les pièces utiles (PDF, images, vidéos).
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Titre du projet *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Ex. Déclaration TVA, Dossier RH..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Contexte du projet..."
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Date souhaitée (début)</label>
                <input
                  type="date"
                  value={dateSouhaitee}
                  onChange={(e) => setDateSouhaitee(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Deadline d’exécution</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Urgence</label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as "BASSE" | "MOYENNE" | "HAUTE" | "URGENTE")}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {(["BASSE", "MOYENNE", "HAUTE", "URGENTE"] as const).map((u) => (
                  <option key={u} value={u}>
                    {URGENCY_LABELS[u]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Instructions ou détails importants
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Ex. Référence dossier, numéro SIRET, consignes particulières..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Pièces jointes</label>
              <p className="mb-2 text-xs text-slate-500">
                PDF, images (JPG, PNG, WebP), vidéos (MP4, WebM). Max 25 Mo par fichier.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.docx,.xlsx,.mp4,.webm,.mov"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Ajouter des fichiers
              </button>
              {files.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                      <span className="truncate">{f.name}</span>
                      <span className="text-slate-400">({(f.size / 1024).toFixed(1)} Ko)</span>
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
              )}
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Création en cours…" : "Créer le projet"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
