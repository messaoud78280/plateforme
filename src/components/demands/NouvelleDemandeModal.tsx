"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DEMANDE_CATEGORIES,
  DEMANDE_PRIORITIES,
  EXEMPLES_DEMANDES,
} from "./constants";

import {
  MISSION_DOCUMENT_MAX_BYTES,
  MISSION_DOCUMENT_MAX_LABEL,
} from "@/lib/storage/document-upload-policy";

type Props = {
  open: boolean;
  onClose: () => void;
};

function isVague(description: string): boolean {
  const d = description.trim().toLowerCase();
  if (d.length > 0 && d.length < 25) return true;
  if (/\b(tout|tous|divers|général|en continu|plusieurs choses|tout ce qui|global)\b/.test(d)) return true;
  if (/\b(permanence|suivi au quotidien|au jour le jour)\b/.test(d)) return true;
  return false;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function NouvelleDemandeModal({ open, onClose }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("STANDARD");
  const [desiredDate, setDesiredDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const [success, setSuccess] = useState(false);

  const showVagueWarning = useMemo(
    () => description.trim().length > 0 && isVague(description),
    [description],
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files).filter((f) => f.size <= MISSION_DOCUMENT_MAX_BYTES);
    setFiles((prev) => [...prev, ...list]);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []).filter((f) => f.size <= MISSION_DOCUMENT_MAX_BYTES);
    setFiles((prev) => [...prev, ...list]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setDescription("");
    setPriority("STANDARD");
    setDesiredDate("");
    setFiles([]);
    setError("");
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUploadProgress("");
    if (!title.trim()) {
      setError("Le titre est requis.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          category: category || undefined,
          priority: priority || undefined,
          desiredDate: desiredDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'envoi.");
        setLoading(false);
        return;
      }
      const taskId = data.id as string;

      if (files.length > 0) {
        setUploadProgress(`Envoi des pièces jointes (${files.length} fichier(s))…`);
        const formData = new FormData();
        formData.set("taskId", taskId);
        formData.set("category", "AUTRE");
        files.forEach((f) => formData.append("files", f));
        const uploadRes = await fetch("/api/documents/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          setError(
            typeof uploadData.error === "string"
              ? uploadData.error
              : "Mission créée mais échec de l'envoi des pièces jointes."
          );
          setLoading(false);
          setUploadProgress("");
          return;
        }
        if ((uploadData.created?.length ?? 0) === 0) {
          setError(
            uploadData.errors?.length
              ? `Pièces jointes non enregistrées : ${uploadData.errors.join(" ")}`
              : "Pièces jointes non enregistrées."
          );
          setLoading(false);
          setUploadProgress("");
          return;
        }
        if (uploadData.errors?.length) {
          setError(`Mission envoyée. Attention : ${uploadData.errors.join(" ")}`);
        }
      }
      setUploadProgress("");
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Erreur de connexion.");
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nouvelle-demande-title"
    >
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl surface-metallic-light shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 id="nouvelle-demande-title" className="text-xl font-bold text-slate-800">
            Nouvelle demande
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-6">
              <p className="text-lg font-medium text-slate-800">
                Votre demande a bien été envoyée à l&apos;équipe BeWork.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/dashboard/taches"
                  className="rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af]"
                >
                  Voir mes demandes
                </Link>
                <button
                  type="button"
                  onClick={() => { resetForm(); }}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Envoyer une autre demande
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="nd-title" className="mb-1 block text-sm font-medium text-slate-700">
                  Titre de la demande *
                </label>
                <input
                  id="nd-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex. Réservation hôtel Lyon"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="nd-category" className="mb-1 block text-sm font-medium text-slate-700">
                  Catégorie de tâche
                </label>
                <select
                  id="nd-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                  disabled={loading}
                >
                  <option value="">— Choisir —</option>
                  {DEMANDE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="nd-description" className="mb-1 block text-sm font-medium text-slate-700">
                  Description détaillée *
                </label>
                <p className="mb-2 text-xs text-slate-500">
                  Décrivez clairement votre besoin, le résultat attendu et les éventuelles échéances.
                </p>
                <textarea
                  id="nd-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Ex. Réserver un hôtel à Lyon pour 2 nuits, arrivée 12 avril, départ 14 avril, budget moyen."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Exemples de demandes bien formulées :
                </p>
                <ul className="mt-1 list-inside list-disc text-xs text-slate-600">
                  {EXEMPLES_DEMANDES.map((ex) => (
                    <li key={ex}>{ex}</li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="nd-priority" className="mb-1 block text-sm font-medium text-slate-700">
                    Niveau de priorité
                  </label>
                  <select
                    id="nd-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                    disabled={loading}
                  >
                    {DEMANDE_PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="nd-desired-date" className="mb-1 block text-sm font-medium text-slate-700">
                    Date souhaitée (optionnel)
                  </label>
                  <input
                    id="nd-desired-date"
                    type="date"
                    value={desiredDate}
                    onChange={(e) => setDesiredDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 focus:border-[#1d4ed8] focus:outline-none focus:ring-1 focus:ring-[#1d4ed8]"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                <p className="text-sm text-slate-700">
                  Les crédits seront évalués par votre assistant après réception, en fonction du temps de traitement estimé.
                </p>
              </div>

              {showVagueWarning && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm text-amber-800">
                    Votre demande semble assez large. Pour un traitement plus rapide, vous pouvez la préciser ou la découper en plusieurs demandes.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDescription(EXEMPLES_DEMANDES[0])}
                    className="mt-2 text-sm font-medium text-amber-800 underline hover:no-underline"
                  >
                    Voir un exemple
                  </button>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Fichiers joints (optionnel)
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex min-h-[80px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 hover:border-slate-400 hover:bg-slate-100"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <span className="text-xl">📎</span>
                  <p className="mt-1 text-sm text-slate-600">
                    Glissez-déposez ou cliquez — max {MISSION_DOCUMENT_MAX_LABEL} par fichier
                  </p>
                </div>
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {files.map((f, i) => (
                      <li key={i} className="flex items-center justify-between rounded-lg surface-metallic-light px-3 py-2 text-sm">
                        <span className="min-w-0 truncate text-slate-800">{f.name}</span>
                        <span className="shrink-0 text-slate-400">{formatSize(f.size)}</span>
                        <button type="button" onClick={() => removeFile(i)} className="shrink-0 text-red-600 hover:underline">Retirer</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-800">Récapitulatif</h3>
                <dl className="mt-2 space-y-1 text-sm text-slate-700">
                  <div><dt className="inline font-medium">Titre : </dt><dd className="inline">{title || "—"}</dd></div>
                  <div><dt className="inline font-medium">Catégorie : </dt><dd className="inline">{category || "—"}</dd></div>
                  <div><dt className="inline font-medium">Priorité : </dt><dd className="inline">{DEMANDE_PRIORITIES.find((p) => p.value === priority)?.label ?? priority}</dd></div>
                  <div><dt className="inline font-medium">Pièces jointes : </dt><dd className="inline">{files.length} fichier(s)</dd></div>
                  <div><dt className="inline font-medium">Délai demandé : </dt><dd className="inline">{desiredDate ? new Date(desiredDate + "T12:00:00").toLocaleDateString("fr-FR") : "—"}</dd></div>
                </dl>
              </div>

              {uploadProgress && <p className="text-sm text-slate-600">{uploadProgress}</p>}
              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50"
                >
                  {loading ? "Envoi en cours…" : "Envoyer ma demande"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
