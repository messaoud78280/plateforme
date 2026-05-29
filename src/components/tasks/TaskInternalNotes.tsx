"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type InternalComment = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string };
};

interface TaskInternalNotesProps {
  taskId: string;
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

export function TaskInternalNotes({ taskId }: TaskInternalNotesProps) {
  const router = useRouter();
  const [comments, setComments] = useState<InternalComment[]>([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

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
              <p className="mt-1 text-xs text-slate-500">
                {c.user.name} · {formatDate(c.createdAt)}
              </p>
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
