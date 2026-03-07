"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DEMANDE_CATEGORIES,
  DEMANDE_PRIORITIES,
  DEMANDE_ESTIMATION_OPTIONS,
  DEMANDE_TEMPLATES,
} from "./constants";

const DRAFT_KEY = "bework-nouvelle-demande-draft";
const ACCEPTED_EXT = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.zip";
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

type DraftData = {
  title: string;
  category: string;
  description: string;
  priority: string;
  desiredDate: string;
  estimatedActions: string;
};

type Props = {
  actionsRemaining: number;
};

export function NouvelleDemandeForm({ actionsRemaining }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("STANDARD");
  const [desiredDate, setDesiredDate] = useState("");
  const [estimatedActions, setEstimatedActions] = useState("1 action");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const [success, setSuccess] = useState(false);
  const [firstRequest, setFirstRequest] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const data = JSON.parse(raw) as DraftData;
        if (data.title) setTitle(data.title);
        if (data.category) setCategory(data.category);
        if (data.description) setDescription(data.description);
        if (data.priority) setPriority(data.priority);
        if (data.desiredDate) setDesiredDate(data.desiredDate);
        if (data.estimatedActions) setEstimatedActions(data.estimatedActions);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveDraft = () => {
    const data: DraftData = {
      title,
      category,
      description,
      priority,
      desiredDate,
      estimatedActions,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000);
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const list = Array.from(e.dataTransfer.files).filter((f) => f.size <= MAX_FILE_SIZE);
    setFiles((prev) => [...prev, ...list]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(e.target.files ?? []).filter((f) => f.size <= MAX_FILE_SIZE);
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
    setEstimatedActions("1 action");
    setFiles([]);
    setError("");
    setSuccess(false);
    clearDraft();
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
          estimatedActions: estimatedActions || undefined,
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
        await fetch("/api/documents/upload", { method: "POST", body: formData });
      }
      setUploadProgress("");
      clearDraft();
      setFirstRequest(Boolean(data.firstRequest));
      setSuccess(true);
      router.refresh();
    } catch {
      setError("Erreur de connexion.");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 mb-4">
            {firstRequest ? (
              <span className="text-3xl">🎉</span>
            ) : (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <h2 className="text-xl font-semibold text-slate-800">
            {firstRequest ? "Bravo !" : "Votre demande a bien été envoyée"}
          </h2>
          <p className="mt-2 text-slate-600">
            {firstRequest
              ? "Votre première demande a été envoyée. Votre assistant l'analyse actuellement."
              : "Votre assistant l'analyse et vous répond rapidement."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/dashboard/taches"
              className="inline-flex items-center rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af]"
            >
              Voir mes demandes
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Créer une nouvelle demande
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-800"
      >
        ← Retour au dashboard
      </Link>

      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Nouvelle demande</h1>
          <p className="mt-1 text-slate-600">
            Décrivez la tâche que vous souhaitez déléguer à votre assistant.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="text-sm font-medium text-slate-600">Actions restantes ce mois-ci</span>
          <span className="text-lg font-bold text-[#1d4ed8]">{actionsRemaining}</span>
        </div>
      </header>

      {/* Modèles / exemples de demandes */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-2">Exemples de demandes</h2>
        <p className="text-sm text-slate-500 mb-4">
          Cliquez sur un modèle pour pré-remplir le formulaire.
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMANDE_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => {
                setTitle(tpl.title);
                setCategory(tpl.category);
                setDescription(tpl.description);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 hover:border-[#1d4ed8] hover:bg-blue-50/50 hover:text-[#1d4ed8] transition"
            >
              {tpl.title}
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Bloc 1 : Informations principales */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Informations principales</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="nd-title" className="mb-1.5 block text-sm font-medium text-slate-700">
                Titre de la demande
              </label>
              <input
                id="nd-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex : Préparer un devis pour le client Dupont"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="nd-category" className="mb-1.5 block text-sm font-medium text-slate-700">
                Catégorie
              </label>
              <select
                id="nd-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20"
                disabled={loading}
              >
                <option value="">— Choisir une catégorie —</option>
                {DEMANDE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Bloc 2 : Description */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Description</h2>
          <div>
            <label htmlFor="nd-description" className="mb-1.5 block text-sm font-medium text-slate-700">
              Description détaillée
            </label>
            <textarea
              id="nd-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Décrivez précisément votre besoin, le résultat attendu et les éventuelles échéances."
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20 resize-y min-h-[120px]"
              disabled={loading}
            />
            <p className="mt-2 text-xs text-slate-500">
              Exemple : Client : Dupont BTP — Objectif : préparer un devis — Délai : avant vendredi — Documents joints : grille tarifaire
            </p>
          </div>
        </section>

        {/* Bloc 3 : Pièces jointes */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Pièces jointes</h2>
          <p className="mb-3 text-sm text-slate-500">
            PDF, Word, Excel, images, zip. Glissez-déposez ou cliquez pour ajouter.
          </p>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 transition ${dragOver ? "border-[#1d4ed8] bg-blue-50/50" : "border-slate-300 bg-slate-50/50 hover:border-slate-400 hover:bg-slate-100/50"}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_EXT}
              className="hidden"
              onChange={handleFileSelect}
            />
            <span className="text-3xl text-slate-400">📎</span>
            <p className="mt-2 text-sm font-medium text-slate-600">
              {dragOver ? "Déposez les fichiers ici" : "Glissez-déposez ou cliquez pour ajouter des fichiers"}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">Max 25 Mo par fichier</p>
          </div>
          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                >
                  <span className="min-w-0 truncate font-medium text-slate-800">{f.name}</span>
                  <span className="shrink-0 text-slate-500 ml-2">{formatSize(f.size)}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="shrink-0 ml-2 text-red-600 hover:underline font-medium"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Bloc 4 : Priorité */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Priorité</h2>
          <div className="space-y-3">
            {DEMANDE_PRIORITIES.map((p) => (
              <label
                key={p.value}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 transition has-[:checked]:border-[#1d4ed8] has-[:checked]:bg-blue-50/30"
              >
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  checked={priority === p.value}
                  onChange={() => setPriority(p.value)}
                  className="mt-1 h-4 w-4 border-slate-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
                  disabled={loading}
                />
                <div>
                  <span className="font-medium text-slate-800">{p.label}</span>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {p.value === "STANDARD" && "Traitement standard"}
                    {p.value === "PRIORITAIRE" && "Réponse sous 24h"}
                    {p.value === "URGENT" && "À confirmer avec l'assistant"}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Bloc 5 : Estimation d'actions */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Estimation d&apos;actions</h2>
          <div className="flex flex-wrap gap-3">
            {DEMANDE_ESTIMATION_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-4 py-3 transition has-[:checked]:border-[#1d4ed8] has-[:checked]:bg-blue-50/30"
              >
                <input
                  type="radio"
                  name="estimation"
                  value={opt.value}
                  checked={estimatedActions === opt.value}
                  onChange={() => setEstimatedActions(opt.value)}
                  className="h-4 w-4 border-slate-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
                  disabled={loading}
                />
                <span className="text-sm font-medium text-slate-800">{opt.label}</span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            L&apos;estimation est indicative et peut varier selon la complexité réelle de la demande.
          </p>
        </section>

        {/* Bloc 6 : Date souhaitée */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">Date limite souhaitée</h2>
          <div>
            <label htmlFor="nd-desired-date" className="mb-1.5 block text-sm font-medium text-slate-700">
              Facultatif
            </label>
            <input
              id="nd-desired-date"
              type="date"
              value={desiredDate}
              onChange={(e) => setDesiredDate(e.target.value)}
              className="w-full max-w-xs rounded-lg border border-slate-300 px-4 py-3 text-slate-800 focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20"
              disabled={loading}
            />
          </div>
        </section>

        {/* Messages + Boutons */}
        {uploadProgress && <p className="text-sm text-slate-600">{uploadProgress}</p>}
        {error && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        {draftSaved && (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
            Brouillon enregistré. Vous pourrez le reprendre au prochain chargement de cette page.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#1d4ed8] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2"
          >
            {loading ? "Envoi en cours…" : "Envoyer la demande"}
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Enregistrer en brouillon
          </button>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            Retour au dashboard
          </Link>
        </div>
      </form>
    </div>
  );
}
