"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBlockerFromTaskOrigin } from "@/lib/pilotage/blocker-links";

type InternalComment = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
};

interface TaskInternalNotesProps {
  taskId: string;
  /** Chantier lié à la mission — permet de signaler une note comme blocage Pilotage. */
  projectId?: string | null;
}

function formatDate(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TaskInternalNotes({ taskId, projectId }: TaskInternalNotesProps) {
  const router = useRouter();
  const [comments, setComments] = useState<InternalComment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [flaggingId, setFlaggingId] = useState<string | null>(null);
  const [blockerTitle, setBlockerTitle] = useState("");
  const [blockerError, setBlockerError] = useState<string | null>(null);
  const [blockerBusy, setBlockerBusy] = useState(false);
  const [blockerLinks, setBlockerLinks] = useState<Record<string, string>>({});

  function startFlagging(comment: InternalComment) {
    setFlaggingId(comment.id);
    setBlockerTitle(comment.content.slice(0, 120));
    setBlockerError(null);
  }

  async function submitBlocker(comment: InternalComment) {
    if (!blockerTitle.trim() || blockerBusy) return;
    setBlockerBusy(true);
    setBlockerError(null);
    try {
      const result = await createBlockerFromTaskOrigin({ taskId, title: blockerTitle.trim() });
      if (result.ok) {
        setBlockerLinks((prev) => ({ ...prev, [comment.id]: result.pilotageId }));
        setFlaggingId(null);
      } else {
        setBlockerError(result.error);
      }
    } catch {
      setBlockerError("Erreur réseau. Réessayez dans un instant.");
    } finally {
      setBlockerBusy(false);
    }
  }

  useEffect(() => {
    async function load() {
      setLoadError(null);
      try {
        const res = await fetch(`/api/tasks/${taskId}/comments?internal=true`);
        if (res.ok) {
          const data = await res.json();
          setComments(Array.isArray(data) ? data : []);
        } else {
          const body = await res.json().catch(() => ({}));
          setLoadError(
            (body as { error?: string }).error ??
              "Impossible de charger les notes internes."
          );
        }
      } catch {
        setLoadError("Erreur réseau lors du chargement des notes.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [taskId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), isInternal: true }),
      });
      if (res.ok) {
        setContent("");
        const refresh = await fetch(`/api/tasks/${taskId}/comments?internal=true`);
        if (refresh.ok) {
          const data = await refresh.json();
          setComments(Array.isArray(data) ? data : []);
        }
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(
          (body as { error?: string }).error ??
            "Impossible d'enregistrer la note. Vérifiez vos droits ou réessayez."
        );
      }
    } catch {
      setError("Erreur réseau. Réessayez dans un instant.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl surface-metallic-light p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Notes internes</h2>
        <p className="text-sm text-slate-500">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-6">
      <h2 className="mb-2 text-lg font-semibold text-slate-800">Notes internes</h2>
      <p className="mb-4 text-xs text-slate-500">
        Visible uniquement par la gérante et l&apos;agent assigné.
      </p>
      {loadError && (
        <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {loadError}
        </p>
      )}
      <ul className="mb-4 max-h-64 space-y-3 overflow-y-auto">
        {comments.length === 0 ? (
          <li className="text-sm text-slate-500">Aucune note pour le moment.</li>
        ) : (
          comments.map((c) => (
            <li
              key={c.id}
              className="rounded-lg border border-amber-100 bg-white px-4 py-2 text-sm"
            >
              <p className="whitespace-pre-wrap text-slate-800">{c.content}</p>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-slate-500">
                  {c.user.name} · {formatDate(c.createdAt)}
                </p>
                {projectId ? (
                  blockerLinks[c.id] ? (
                    <Link
                      href={`/dashboard/projets/${projectId}/suivi-contractuel?onglet=blocages`}
                      className="text-xs font-semibold text-red-700 hover:underline"
                    >
                      ✓ Blocage créé — voir sur le chantier
                    </Link>
                  ) : flaggingId !== c.id ? (
                    <button
                      type="button"
                      onClick={() => startFlagging(c)}
                      className="text-xs font-semibold text-red-700 hover:underline"
                    >
                      Signaler comme blocage pilotage
                    </button>
                  ) : null
                ) : null}
              </div>
              {flaggingId === c.id ? (
                <div className="mt-2 space-y-2 rounded-lg border border-red-200 bg-red-50/50 p-3">
                  <label className="block text-xs font-semibold text-red-800">
                    Titre du blocage (Pilotage travaux)
                    <input
                      value={blockerTitle}
                      onChange={(e) => setBlockerTitle(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm"
                    />
                  </label>
                  {blockerError && <p className="text-xs text-red-700">{blockerError}</p>}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={blockerBusy || !blockerTitle.trim()}
                      onClick={() => submitBlocker(c)}
                      className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {blockerBusy ? "Création…" : "Créer le blocage"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlaggingId(null)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : null}
            </li>
          ))
        )}
      </ul>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ajouter une note interne…"
          rows={2}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="w-fit rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {sending ? "Envoi…" : "Ajouter"}
        </button>
      </form>
    </div>
  );
}
