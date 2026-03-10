"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type TaskMessageItem = {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
};

interface TaskMessageConversationProps {
  taskId: string;
  sessionUserId: string;
  isClient: boolean;
  isAgence: boolean;
  isAgent: boolean;
  assignedToName: string | null;
}

function formatDate(d: string) {
  const date = new Date(d);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function TaskMessageConversation({
  taskId,
  sessionUserId,
  isClient,
  isAgence,
  isAgent,
  assignedToName,
}: TaskMessageConversationProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<TaskMessageItem[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [internal, setInternal] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/tasks/${taskId}/messages`);
        if (res.ok) {
          const data = await res.json();
          setMessages(Array.isArray(data) ? data : []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [taskId]);

  // Si l'agent arrive via #messages-section-internal, cocher "Message interne" et scroller vers la zone messages
  useEffect(() => {
    if (typeof window === "undefined" || !isAgent) return;
    if (window.location.hash === "#messages-section-internal") {
      setInternal(true);
      document.getElementById("messages-section")?.scrollIntoView({ behavior: "smooth" });
      window.history.replaceState(null, "", window.location.pathname + window.location.search + "#messages-section");
    }
  }, [taskId, isAgent]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), isInternal: internal }),
      });
      if (res.ok) {
        setContent("");
        const refresh = await fetch(`/api/tasks/${taskId}/messages`);
        if (refresh.ok) {
          const data = await refresh.json();
          setMessages(Array.isArray(data) ? data : []);
        }
        router.refresh();
      }
    } finally {
      setSending(false);
    }
  }

  const showInternalToggle = (isAgence || isAgent) && !isClient;

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Messages mission</h2>
        <p className="text-sm text-slate-500">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">
        Messages mission {assignedToName ? `— ${assignedToName}` : ""}
      </h2>
      {isClient && (
        <p className="mb-3 text-sm text-slate-500">
          Échangez avec votre assistant assigné. Vos messages sont visibles par l&apos;agent et la gérante.
        </p>
      )}
      {isAgent && (
        <p className="mb-3 text-sm text-slate-500">
          Envoyez un message au client (décoché) ou à la gérante uniquement (cochez « Message interne »).
        </p>
      )}
      <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/50 p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun message. Envoyez le premier.</p>
        ) : (
          messages.map((m) => {
            const isMe = m.sender.id === sessionUserId;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 ${
                    m.isInternal
                      ? "bg-amber-50 border border-amber-200 text-amber-900"
                      : isMe
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-slate-200 text-slate-800"
                  }`}
                >
                  {m.isInternal && (
                    <span className="text-[10px] font-medium uppercase text-amber-700">Interne</span>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  <p className={`mt-1 text-[10px] ${m.isInternal ? "text-amber-600" : isMe ? "text-blue-100" : "text-slate-400"}`}>
                    {m.sender.name} · {formatDate(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={handleSend} className="mt-4">
        {showInternalToggle && (
          <label className="mb-2 flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={internal}
              onChange={(e) => setInternal(e.target.checked)}
              className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
            />
            Message interne (invisible pour le client)
          </label>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrivez votre message..."
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {sending ? "Envoi…" : "Envoyer message"}
        </button>
      </form>
    </div>
  );
}
