"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateBtpDicoNote } from "@/app/dashboard/devis/dico-btp-actions";

export function BtpDicoNoteEditor({
  termId,
  note,
  canManage,
}: {
  termId: string;
  note: string | null;
  canManage: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(note ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const hasNote = !!(note && note.trim());

  // Lecture seule pour les non-gérants : on n'affiche la note que si elle existe.
  if (!canManage) {
    if (!hasNote) return null;
    return (
      <section className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 shadow-sm">
        <h2 className="font-heading mb-3 text-sm font-bold text-slate-900">Note / définition</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{note}</p>
      </section>
    );
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const res = await updateBtpDicoNote(termId, value);
      if (res.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function cancel() {
    setValue(note ?? "");
    setError(null);
    setEditing(false);
  }

  return (
    <section className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-heading text-sm font-bold text-slate-900">Ma note / définition</h2>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {hasNote ? "Modifier" : "Ajouter une note"}
          </button>
        ) : null}
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={5}
            autoFocus
            placeholder="Ajoutez ici votre note personnelle, une précision terrain ou une définition complémentaire…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-800 outline-none focus:border-[#1e3a5f]"
          />
          {error ? <p className="text-xs font-medium text-red-700">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="rounded-lg bg-[#1e3a5f] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#162d4a] disabled:opacity-50"
            >
              {pending ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : hasNote ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{note}</p>
      ) : (
        <p className="text-sm text-slate-500">
          Aucune note pour l&apos;instant. Ajoutez vos remarques terrain ou une définition complémentaire.
        </p>
      )}
    </section>
  );
}
