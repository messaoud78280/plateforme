"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  LIBRARY_NOTE_KINDS,
  LIBRARY_NOTE_KIND_LABELS,
  type LibraryNoteKind,
} from "@/lib/commercial/library-notes";

type Note = {
  id: string;
  kind: string;
  body: string;
  createdAt: string | Date;
  createdBy: { id: string; name: string } | null;
};

export function WorkItemNotesPanel({
  workItemId,
  initialNotes,
}: {
  workItemId: string;
  initialNotes: Note[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [kind, setKind] = useState<LibraryNoteKind>("INTERNAL");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editKind, setEditKind] = useState<LibraryNoteKind>("COMMENT");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  async function create() {
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/commercial/library/work-items/${workItemId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setNotes((prev) => [data.note as Note, ...prev]);
      setBody("");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/commercial/library/work-items/${workItemId}/notes/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: editKind, body: editBody }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setNotes((prev) => prev.map((n) => (n.id === id ? (data.note as Note) : n)));
      setEditingId(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette note ?")) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/commercial/library/work-items/${workItemId}/notes/${id}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur");
      setNotes((prev) => prev.filter((n) => n.id !== id));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-4">
        <p className="text-sm font-semibold text-[#1e3a5f]">Nouvelle note</p>
        <p className="mt-1 text-[11px] text-slate-400">
          Les notes internes ne sont jamais reprises automatiquement dans les devis.
        </p>
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as LibraryNoteKind)}
          className="mt-3 rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          {LIBRARY_NOTE_KINDS.map((k) => (
            <option key={k} value={k}>
              {LIBRARY_NOTE_KIND_LABELS[k]}
            </option>
          ))}
        </select>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Contenu de la note…"
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1e3a5f]/40"
        />
        <button
          type="button"
          disabled={busy || !body.trim()}
          onClick={() => void create()}
          className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl bg-[#1e3a5f] px-4 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Ajouter
        </button>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      {notes.length === 0 ? (
        <p className="text-sm text-slate-500">Aucune note datée.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((n) => {
            const label =
              LIBRARY_NOTE_KIND_LABELS[n.kind as LibraryNoteKind] || n.kind;
            const isInternal = n.kind === "INTERNAL";
            return (
              <li
                key={n.id}
                className="rounded-2xl border border-[#1e3a5f]/10 bg-white p-4"
              >
                {editingId === n.id ? (
                  <div className="space-y-2">
                    <select
                      value={editKind}
                      onChange={(e) => setEditKind(e.target.value as LibraryNoteKind)}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    >
                      {LIBRARY_NOTE_KINDS.map((k) => (
                        <option key={k} value={k}>
                          {LIBRARY_NOTE_KIND_LABELS[k]}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void saveEdit(n.id)}
                        className="rounded-xl bg-[#1e3a5f] px-3 py-1.5 text-xs font-semibold text-white"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-xl border px-3 py-1.5 text-xs"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={
                          isInternal
                            ? "rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                            : "rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                        }
                      >
                        {label}
                        {isInternal ? " · confidentiel" : ""}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(n.id);
                            setEditBody(n.body);
                            setEditKind(
                              (LIBRARY_NOTE_KINDS as readonly string[]).includes(n.kind)
                                ? (n.kind as LibraryNoteKind)
                                : "OTHER",
                            );
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(n.id)}
                          className="rounded-lg p-1.5 text-red-400 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{n.body}</p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      {n.createdBy?.name || "Utilisateur"} ·{" "}
                      {new Date(n.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
