"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { documentDownloadHref } from "@/lib/documents/download-url";

type MessageChannel = "INTERNE" | "CLIENT" | "FOURNISSEUR";

type MessageItem = {
  id: string;
  content: string;
  read: boolean;
  channel?: string;
  createdAt: string;
  project: { id: string; title: string };
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
};

const CHANNEL_LABELS: Record<MessageChannel, string> = {
  INTERNE: "🔒 Interne",
  CLIENT: "🟠 Externe — Client",
  FOURNISSEUR: "🟠 Externe — Fournisseur",
};

const CHANNEL_HINT: Record<MessageChannel, string> = {
  INTERNE: "Visible uniquement par le personnel interne. Ne pas y écrire pour le client ou un fournisseur.",
  CLIENT: "Fil partagé avec le client du chantier uniquement.",
  FOURNISSEUR: "Fil partagé avec les fournisseurs du chantier uniquement.",
};

type ProjectItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  urgency?: string;
  clientId: string;
  assignedToId: string | null;
  assignedTo: { id: string; name: string } | null;
  createdAt: string;
  _count?: { tasks: number };
};

type DocumentItem = {
  id: string;
  name: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  EN_COURS: "En cours",
  EN_ATTENTE: "En attente",
  TERMINE: "Terminé",
};

const QUICK_REPLIES = [
  "Merci pour la mise à jour",
  "Parfait, c'est noté",
  "J'ai une question",
  "Peut-on en discuter ?",
];

function formatRelativeTime(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffHours < 24) return `il y a ${diffHours}h`;
  if (diffDays < 7) return `il y a ${diffDays} j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function formatMessageTime(d: string) {
  const date = new Date(d);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function Avatar({ name, isMe }: { name: string; isMe: boolean }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${
        isMe ? "bg-[#1d4ed8]" : "bg-slate-500"
      }`}
    >
      {initials}
    </div>
  );
}

export function MessagerieView({
  sessionUserId,
  initialProjectId,
  initialChannel,
  hideNewDemande,
}: {
  sessionUserId: string;
  initialProjectId?: string | null;
  initialChannel?: string | null;
  hideNewDemande?: boolean;
}) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [allowedChannels, setAllowedChannels] = useState<MessageChannel[]>(["CLIENT"]);
  const [channel, setChannel] = useState<MessageChannel>(
    initialChannel === "INTERNE" || initialChannel === "FOURNISSEUR" || initialChannel === "CLIENT"
      ? initialChannel
      : "CLIENT"
  );
  const [projectDocuments, setProjectDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId ?? "");
  const [sendContent, setSendContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  async function loadMessages(ch: MessageChannel) {
    const res = await fetch(`/api/messages?meta=1&channel=${ch}`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(Array.isArray(data.messages) ? data.messages : []);
    if (Array.isArray(data.channels) && data.channels.length) {
      setAllowedChannels(data.channels as MessageChannel[]);
      if (!data.channels.includes(ch)) {
        setChannel(data.channels[0] as MessageChannel);
      }
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const [msgRes, projRes] = await Promise.all([
          fetch(`/api/messages?meta=1&channel=${channel}`),
          fetch("/api/projets"),
        ]);
        let msgList: MessageItem[] = [];
        if (msgRes.ok) {
          const data = await msgRes.json();
          msgList = Array.isArray(data.messages) ? data.messages : [];
          setMessages(msgList);
          if (Array.isArray(data.channels) && data.channels.length) {
            setAllowedChannels(data.channels as MessageChannel[]);
            if (!data.channels.includes(channel)) {
              setChannel(data.channels[0] as MessageChannel);
            }
          }
        }
        if (projRes.ok) {
          const projs = await projRes.json();
          const list = Array.isArray(projs) ? projs : projs.projects ?? [];
          setProjects(list);
          if (!selectedProjectId) {
            const projectIdsWithMessages = [...new Set(msgList.map((m) => m.project.id))];
            const firstConversation =
              projectIdsWithMessages.length > 0
                ? list.find((p: ProjectItem) => projectIdsWithMessages.includes(p.id))
                : list[0];
            if (firstConversation) setSelectedProjectId(firstConversation.id);
          }
        }
      } catch {
        setError("Erreur lors du chargement.");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- charge initiale
  }, []);

  useEffect(() => {
    if (loading) return;
    loadMessages(channel).catch(() => undefined);
  }, [channel]);

  useEffect(() => {
    if (!selectedProjectId) {
      setProjectDocuments([]);
      return;
    }
    fetch(`/api/documents?projectId=${selectedProjectId}&page=1`)
      .then((r) => r.ok ? r.json() : { documents: [] })
      .then((data) => setProjectDocuments(data.documents ?? []))
      .catch(() => setProjectDocuments([]));
  }, [selectedProjectId]);

  const allMessages = messages
    .filter((m) => m.receiver.id === sessionUserId || m.sender.id === sessionUserId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const lastMessageByProject = allMessages.reduce<Record<string, string>>((acc, m) => {
    const pid = m.project.id;
    const existing = acc[pid];
    if (!existing || new Date(m.createdAt) > new Date(existing)) acc[pid] = m.createdAt;
    return acc;
  }, {});
  const conversationProjectIds = Object.keys(lastMessageByProject);
  const conversationsList = projects
    .filter((p) => conversationProjectIds.includes(p.id))
    .sort((a, b) => (new Date(lastMessageByProject[b.id] ?? 0).getTime() - new Date(lastMessageByProject[a.id] ?? 0).getTime()));
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const conversationMessages = selectedProjectId
    ? allMessages.filter(
        (m) => m.project.id === selectedProjectId && (m.channel ?? "CLIENT") === channel
      )
    : [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages.length]);

  async function markAsRead(id: string) {
    try {
      await fetch(`/api/messages/${id}`, { method: "PATCH" });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!selectedProjectId || conversationMessages.length === 0) return;
    const last = conversationMessages[conversationMessages.length - 1];
    if (last.receiver.id === sessionUserId && !last.read) markAsRead(last.id);
  }, [selectedProjectId, conversationMessages.length]);

  const recipientForProject = selectedProject?.assignedTo
    ? selectedProject.assignedTo
    : null;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = sendContent.trim();
    if (!content || !selectedProjectId || sending) return;
    setError("");
    const tempId = `temp-${Date.now()}`;
    const optimistic: MessageItem = {
      id: tempId,
      content,
      read: false,
      channel,
      createdAt: new Date().toISOString(),
      project: {
        id: selectedProjectId,
        title: selectedProject?.title ?? "",
      },
      sender: { id: sessionUserId, name: "Vous" },
      receiver: {
        id: recipientForProject?.id ?? "",
        name: recipientForProject?.name ?? "",
      },
    };
    setSending(true);
    setSendContent("");
    setMessages((prev) => [optimistic, ...prev]);
    try {
      const body: {
        projectId: string;
        content: string;
        channel: MessageChannel;
        receiverId?: string;
      } = {
        projectId: selectedProjectId,
        content,
        channel,
      };
      if (recipientForProject) body.receiverId = recipientForProject.id;

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setSendContent(content);
        setError(data.error ?? "Erreur lors de l'envoi.");
        return;
      }
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...data, channel: data.channel ?? channel } : m)),
      );
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setSendContent(content);
      setError("Erreur de connexion.");
    } finally {
      setSending(false);
    }
  }

  function setQuickReply(text: string) {
    setSendContent((prev) => (prev ? `${prev} ${text}` : text));
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-12rem)] items-center justify-center rounded-2xl surface-metallic-light">
        <p className="text-slate-500">Chargement de la messagerie...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-2xl surface-metallic-light">
      {/* Colonne gauche : conversations */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-slate-50/60">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-800">Chantiers</h2>
          <p className="mt-0.5 text-xs text-slate-500">Fils par chantier</p>
          <div className="mt-3 flex flex-wrap gap-1">
            {allowedChannels.map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => setChannel(ch)}
                className={`rounded-md px-2 py-1 text-xs font-semibold ${
                  channel === ch
                    ? "bg-[#1e3a5f] text-white"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                {CHANNEL_LABELS[ch]}
              </button>
            ))}
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {conversationsList.length === 0 ? (
            <li className="p-4 text-center text-sm text-slate-500">Aucune conversation.</li>
          ) : (
            conversationsList.map((p) => {
              const lastMsg = [...allMessages].reverse().find((m) => m.project.id === p.id);
              const unread = messages.filter(
                (m) => m.project.id === p.id && m.receiver.id === sessionUserId && !m.read
              ).length;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedProjectId(p.id)}
                    className={`w-full border-l-2 px-4 py-3 text-left transition ${
                      selectedProjectId === p.id
                        ? "border-[#1d4ed8] bg-white shadow-sm"
                        : "border-transparent hover:bg-slate-100/80"
                    }`}
                  >
                    <p className="truncate text-sm font-semibold text-slate-800">{p.title}</p>
                    {lastMsg && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {lastMsg.sender.name} : {lastMsg.content.slice(0, 40)}
                        {lastMsg.content.length > 40 ? "…" : ""}
                      </p>
                    )}
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {lastMsg ? formatRelativeTime(lastMsg.createdAt) : "—"}
                      </span>
                      {unread > 0 && (
                        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#1d4ed8] px-1.5 text-xs font-medium text-white">
                          {unread}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
        {!hideNewDemande ? (
          <div className="border-t border-slate-200 p-3">
            <Link
              href="/dashboard/nouvelle-demande"
              className="block w-full rounded-lg bg-[#1d4ed8] py-2.5 text-center text-sm font-medium text-white hover:bg-[#1e40af]"
            >
              Créer une demande
            </Link>
          </div>
        ) : null}
      </aside>

      {/* Zone centrale : chat */}
      <div className="flex min-w-0 flex-1 flex-col">
        {selectedProjectId && selectedProject ? (
          <>
            <div className="shrink-0 border-b border-slate-200 px-4 py-3">
              <h3 className="font-semibold text-slate-800">{selectedProject.title}</h3>
              {recipientForProject && (
                <p className="text-xs text-slate-500">Assistant : {recipientForProject.name}</p>
              )}
              <div
                className={`mt-2 rounded-lg border px-3 py-2 text-sm font-semibold ${
                  channel === "INTERNE"
                    ? "border-violet-300 bg-violet-100 text-violet-950"
                    : channel === "FOURNISSEUR"
                      ? "border-amber-300 bg-amber-100 text-amber-950"
                      : "border-orange-300 bg-orange-100 text-orange-950"
                }`}
              >
                {CHANNEL_LABELS[channel]}
                <p className="mt-1 text-xs font-normal opacity-90">{CHANNEL_HINT[channel]}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {conversationMessages.map((m) => {
                  const isMe = m.sender.id === sessionUserId;
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar name={m.sender.name} isMe={isMe} />
                      <div
                        className={`flex max-w-[75%] flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-2.5 ${
                            isMe
                              ? "rounded-tr-md bg-[#1d4ed8] text-white"
                              : "rounded-tl-md bg-slate-100 text-slate-800"
                          }`}
                        >
                          <p className="text-xs font-medium opacity-90">{m.sender.name}</p>
                          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{m.content}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {formatMessageTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-200 p-4">
              <div className="mb-2 flex flex-wrap gap-1">
                {QUICK_REPLIES.map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() => setQuickReply(text)}
                    className="rounded-full surface-metallic-light px-3 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    {text}
                  </button>
                ))}
              </div>
              <form onSubmit={handleSend} className="flex gap-2">
                <div className="flex min-w-0 flex-1 items-end gap-2">
                  <textarea
                    value={sendContent}
                    onChange={(e) => setSendContent(e.target.value)}
                    placeholder="Écrire un message..."
                    rows={2}
                    className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-[#1d4ed8] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/20"
                    disabled={sending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (sendContent.trim() && !sending) {
                          void (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
                        }
                      }
                    }}
                  />
                  <Link
                    href="/dashboard/documents"
                    className="shrink-0 rounded-lg border border-slate-300 bg-white p-2.5 text-slate-600 hover:bg-slate-50"
                    title="Joindre un document"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </Link>
                  <button
                    type="submit"
                    disabled={sending || !sendContent.trim()}
                    className="shrink-0 rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50"
                  >
                    Envoyer
                  </button>
                </div>
              </form>
              {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <p className="text-slate-500">Sélectionnez une conversation.</p>
            {projects.length > 0 && conversationsList.length === 0 && (
              <p className="mt-2 text-sm text-slate-500">
                Envoyez un premier message depuis un projet pour démarrer.
              </p>
            )}
            <Link
              href="/dashboard/nouvelle-demande"
              className="mt-4 text-sm font-medium text-[#1d4ed8] hover:underline"
            >
              Créer une demande →
            </Link>
          </div>
        )}
      </div>

      {/* Colonne droite : informations mission */}
      <aside className="flex w-72 shrink-0 flex-col border-l border-slate-200 bg-slate-50/40">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-800">Mission</h2>
        </div>
        {selectedProject ? (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Titre</p>
                <p className="mt-0.5 font-medium text-slate-800">{selectedProject.title}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Statut</p>
                <span className="mt-1 inline-flex rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                  {PROJECT_STATUS_LABELS[selectedProject.status] ?? selectedProject.status}
                </span>
              </div>
              {selectedProject.assignedTo && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Assistant assigné</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">{selectedProject.assignedTo.name}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Date de création</p>
                <p className="mt-0.5 text-sm text-slate-700">
                  {new Date(selectedProject.createdAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Crédits estimés</p>
                <p className="mt-0.5 text-sm text-slate-700">—</p>
              </div>

              {projectDocuments.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Pièces jointes</p>
                  <ul className="mt-2 space-y-1">
                    {projectDocuments.map((doc) => (
                      <li key={doc.id}>
                        <a
                          href={documentDownloadHref(doc.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate rounded surface-metallic-light px-2 py-1.5 text-xs text-[#1d4ed8] hover:underline"
                        >
                          {doc.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2 border-t border-slate-200 pt-4">
                <Link
                  href={`/dashboard/projets/${selectedProject.id}`}
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Voir la demande
                </Link>
                <Link
                  href="/dashboard/documents"
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Ajouter un document
                </Link>
                <Link
                  href={`/dashboard/projets/${selectedProject.id}`}
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Changer priorité
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-slate-500">
            Sélectionnez une conversation pour voir les détails de la mission.
          </div>
        )}
      </aside>
    </div>
  );
}
