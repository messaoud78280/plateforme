"use client";

import { useState, useEffect } from "react";

type MessageItem = {
  id: string;
  content: string;
  createdAt: string;
  project: { id: string; title: string };
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
};

function formatDate(d: string) {
  const date = new Date(d);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

interface TaskConversationProps {
  projectId: string;
  projectTitle: string;
  sessionUserId: string;
}

export function TaskConversation({ projectId, projectTitle, sessionUserId }: TaskConversationProps) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/messages?projectId=${encodeURIComponent(projectId)}`);
        if (res.ok) {
          const data = await res.json();
          const list = (Array.isArray(data) ? data : []) as MessageItem[];
          list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          setMessages(list);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || sending) return;
    const text = content.trim();
    const tempId = `temp-${Date.now()}`;
    const optimistic: MessageItem = {
      id: tempId,
      content: text,
      createdAt: new Date().toISOString(),
      project: { id: projectId, title: projectTitle },
      sender: { id: sessionUserId, name: "Vous" },
      receiver: { id: "", name: "" },
    };
    setSending(true);
    setContent("");
    setMessages((prev) => [...prev, optimistic]);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, content: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.id) {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...data } : m)));
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setContent(text);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setContent(text);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl surface-metallic-light p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Messagerie</h2>
        <p className="text-sm text-slate-500">Chargement des messages…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl surface-metallic-light p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Messagerie liée à la demande</h2>
      <p className="mb-4 text-sm text-slate-500">Projet : {projectTitle}</p>

      <div className="max-h-[320px] space-y-3 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/50 p-4">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-slate-500">Aucun message. Envoyez le premier.</p>
        ) : (
          messages.map((m) => {
            const isMe = m.sender.id === sessionUserId;
            return (
              <div
                key={m.id}
                className={`rounded-lg px-3 py-2 ${
                  isMe ? "ml-8 bg-[#1d4ed8]/10" : "mr-8 bg-white border border-slate-200"
                }`}
              >
                <p className="text-xs font-medium text-slate-600">{m.sender.name}</p>
                <p className="mt-0.5 text-sm text-slate-800">{m.content}</p>
                <p className="mt-1 text-xs text-slate-400">{formatDate(m.createdAt)}</p>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrire un message..."
          rows={2}
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20"
          disabled={sending}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (content.trim() && !sending) {
                void (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
              }
            }
          }}
        />
        <button
          type="submit"
          disabled={sending || !content.trim()}
          className="shrink-0 rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af] disabled:opacity-50"
        >
          {sending ? "Envoi…" : "Envoyer"}
        </button>
      </form>
    </div>
  );
}
