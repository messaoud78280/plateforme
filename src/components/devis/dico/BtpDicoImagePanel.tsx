"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { removeBtpDicoImage } from "@/app/dashboard/devis/dico-btp-actions";

export function BtpDicoImagePanel({
  termId,
  imageUrl,
  canManage,
}: {
  termId: string;
  imageUrl: string | null;
  canManage: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingRemove, startRemove] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Lecture seule pour les non-gérants : image affichée si présente, sinon rien.
  if (!canManage) {
    if (!imageUrl) return null;
    return (
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h2 className="font-heading mb-3 text-sm font-bold text-slate-900">Image</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Illustration de la fiche"
          className="max-h-64 w-full rounded-xl border border-slate-200 object-contain"
        />
      </section>
    );
  }

  async function onSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de re-sélectionner le même fichier
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Seules les images sont acceptées.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image trop volumineuse (max 8 Mo).");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("termId", termId);
      fd.set("file", file);
      const res = await fetch("/api/dico-btp/image", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Échec de l'envoi.");
        return;
      }
      router.refresh();
    } catch {
      setError("Échec de l'envoi.");
    } finally {
      setUploading(false);
    }
  }

  function onRemove() {
    setError(null);
    startRemove(async () => {
      const res = await removeBtpDicoImage(termId);
      if (res.ok) {
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  const busy = uploading || pendingRemove;

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h2 className="font-heading mb-3 text-sm font-bold text-slate-900">Image</h2>

      {imageUrl ? (
        <div className="space-y-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Illustration de la fiche"
            className="max-h-64 w-full rounded-xl border border-slate-200 object-contain"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={busy}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {uploading ? "Envoi…" : "Remplacer"}
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={busy}
              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              {pendingRemove ? "Suppression…" : "Retirer"}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center hover:border-[#1e3a5f] hover:bg-slate-100 disabled:opacity-50"
        >
          <span className="text-sm font-semibold text-slate-700">
            {uploading ? "Envoi en cours…" : "Ajouter une image"}
          </span>
          <span className="text-xs text-slate-500">JPG, PNG, WEBP… — 8 Mo max</span>
        </button>
      )}

      {error ? <p className="mt-3 text-xs font-medium text-red-700">{error}</p> : null}

      <input ref={inputRef} type="file" accept="image/*" onChange={onSelect} className="hidden" />
    </section>
  );
}
