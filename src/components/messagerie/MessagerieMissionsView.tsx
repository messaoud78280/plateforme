"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = {
  NOUVEAU: "Nouvelle",
  EN_ATTENTE: "En attente",
  ASSIGNEE: "Assignée",
  EN_ANALYSE: "En analyse",
  EN_COURS: "En cours",
  EN_ATTENTE_INFO: "En attente client",
  A_VALIDER: "À valider",
  COMPLETE: "Terminée",
};

type TaskMessageItem = {
  id: string;
  content: string;
  read: boolean;
  isInternal: boolean;
  createdAt: string;
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
};

type MissionItem = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  client: { id: string; name: string };
  assignedTo: { id: string; name: string } | null;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    sender: { id: string; name: string };
  } | null;
  unreadCount: number;
  documents: { id: string; name: string; fileUrl: string }[];
};

type FilterId = "inbox" | "mes-missions" | "en-attente-client" | "en-cours" | "terminees";

const NAV_ITEMS: { id: FilterId; label: string }[] = [
  { id: "inbox", label: "Boîte de réception" },
  { id: "mes-missions", label: "Mes missions" },
  { id: "en-attente-client", label: "En attente client" },
  { id: "en-cours", label: "En cours" },
  { id: "terminees", label: "Terminées" },
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

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-500 text-xs font-semibold text-white">
      {initials}
    </div>
  );
}

interface MessagerieMissionsViewProps {
  sessionUserId: string;
  isAgence: boolean;
  isAgent: boolean;
  canChangeStatus: boolean;
  agents?: { id: string; name: string }[];
  managerId?: string | null;
}

export function MessagerieMissionsView({
  sessionUserId,
  isAgence,
  isAgent,
  canChangeStatus,
  agents = [],
  managerId,
}: MessagerieMissionsViewProps) {
  const router = useRouter();
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [filter, setFilter] = useState<FilterId>("inbox");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [messages, setMessages] = useState<TaskMessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendContent, setSendContent] = useState("");
  const [sending, setSending] = useState(false);
  const [internalNote, setInternalNote] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedMission = missions.find((m) => m.id === selectedTaskId);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/tasks/messagerie?filter=${filter}`);
        if (res.ok) {
          const data = await res.json();
          setMissions(Array.isArray(data) ? data : []);
          if (!selectedTaskId && data?.length > 0) {
            setSelectedTaskId(data[0].id);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter]);

  useEffect(() => {
    if (!selectedTaskId) {
      setMessages([]);
      return;
    }
    setLoadingMessages(true);
    fetch(`/api/tasks/${selectedTaskId}/messages`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoadingMessages(false));
  }, [selectedTaskId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = sendContent.trim();
    if (!content || !selectedTaskId || sending) return;

    setSending(true);
    try {
    const body: { content: string; receiverId?: string; isInternal?: boolean } = {
      content,
      isInternal: internalNote && (isAgence || isAgent),
    };
    if (internalNote) {
      if (isAgence && selectedMission?.assignedTo) {
        body.receiverId = selectedMission.assignedTo.id;
      } else if (isAgent && managerId) {
        body.receiverId = managerId;
      }
    }

      const res = await fetch(`/api/tasks/${selectedTaskId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSendContent("");
        const refresh = await fetch(`/api/tasks/${selectedTaskId}/messages`);
        if (refresh.ok) setMessages(await refresh.json());
        const listRes = await fetch(`/api/tasks/messagerie?filter=${filter}`);
        if (listRes.ok) setMissions(await listRes.json());
        router.refresh();
      }
    } finally {
      setSending(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (!selectedTaskId || !canChangeStatus) return;
    try {
      const body: { status: string; timeSpentMinutes?: number } = { status: newStatus };
      if (newStatus === "A_VALIDER" || newStatus === "COMPLETE") {
        body.timeSpentMinutes = 10;
      }
      const res = await fetch(`/api/tasks/${selectedTaskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const listRes = await fetch(`/api/tasks/messagerie?filter=${filter}`);
        if (listRes.ok) setMissions(await listRes.json());
        router.refresh();
      }
    } catch {
      // ignore
    }
  }

  const visibleMessages = messages.filter((m) => !m.isInternal || isAgence || isAgent);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-14rem)] items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <p className="text-slate-500">Chargement de la messagerie...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Colonne gauche : navigation */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-50/80">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-800">Filtres</h2>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                    filter === item.id
                      ? "bg-blue-100 text-blue-800"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Colonne centre : liste des missions */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-3">
          <h2 className="text-sm font-semibold text-slate-800">Missions</h2>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {missions.length === 0 ? (
            <li className="p-4 text-center text-sm text-slate-500">Aucune mission.</li>
          ) : (
            missions.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelectedTaskId(m.id)}
                  className={`w-full border-l-2 px-4 py-3 text-left transition ${
                    selectedTaskId === m.id
                      ? "border-blue-600 bg-blue-50/60"
                      : "border-transparent hover:bg-slate-50"
                  }`}
                >
                  <p className="truncate text-sm font-semibold text-slate-800">{m.title}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{m.client.name}</p>
                  {m.lastMessage && (
                    <p className="mt-0.5 truncate text-xs text-slate-400">
                      {m.lastMessage.sender.name} : {m.lastMessage.content.slice(0, 40)}
                      {m.lastMessage.content.length > 40 ? "…" : ""}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {(m.priority === "URGENT" || m.priority === "PRIORITAIRE") && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-800">
                        {m.priority === "URGENT" ? "Urgent" : "Prioritaire"}
                      </span>
                    )}
                    {m.unreadCount > 0 && (
                      <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-medium text-white">
                        {m.unreadCount}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {m.lastMessage ? formatRelativeTime(m.lastMessage.createdAt) : "—"}
                    </span>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      {/* Colonne droite : conversation */}
      <div className="flex min-w-0 flex-1 flex-col">
        {selectedMission ? (
          <>
            {/* En-tête mission */}
            <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
              <h3 className="font-semibold text-slate-800">{selectedMission.title}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span>Client : {selectedMission.client.name}</span>
                {selectedMission.assignedTo && (
                  <span>Agent : {selectedMission.assignedTo.name}</span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    selectedMission.status === "COMPLETE"
                      ? "bg-green-100 text-green-800"
                      : selectedMission.status === "A_VALIDER"
                        ? "bg-violet-100 text-violet-800"
                        : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {STATUS_LABELS[selectedMission.status] ?? selectedMission.status}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingMessages ? (
                <p className="text-sm text-slate-500">Chargement…</p>
              ) : (
                <div className="space-y-4">
                  {visibleMessages.map((m) => {
                    const isMe = m.sender.id === sessionUserId;
                    return (
                      <div
                        key={m.id}
                        className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                      >
                        <Avatar name={m.sender.name} />
                        <div className={`flex max-w-[80%] flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div
                            className={`rounded-2xl px-4 py-2.5 ${
                              isMe
                                ? "rounded-tr-md bg-blue-600 text-white"
                                : "rounded-tl-md bg-slate-100 text-slate-800"
                            } ${m.isInternal ? "border border-amber-300" : ""}`}
                          >
                            <p className="text-xs font-medium opacity-90">
                              {m.sender.name}
                              {m.isInternal && " (note interne)"}
                            </p>
                            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{m.content}</p>
                          </div>
                          <p className="mt-1 text-xs text-slate-400">{formatMessageTime(m.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              )}

              {/* Documents joints */}
              {selectedMission.documents.length > 0 && (
                <div className="mt-6 border-t border-slate-200 pt-4">
                  <h4 className="mb-2 text-sm font-semibold text-slate-800">Documents joints</h4>
                  <ul className="space-y-1">
                    {selectedMission.documents.map((d) => (
                      <li key={d.id}>
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="truncate">{d.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Zone d'écriture et actions */}
            <div className="shrink-0 border-t border-slate-200 bg-slate-50/60 p-4">
              {(isAgence || isAgent) && (
                <label className="mb-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={internalNote}
                    onChange={(e) => setInternalNote(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Note interne (visible uniquement gérante/agent)
                </label>
              )}
              <form onSubmit={handleSend} className="flex gap-2">
                <textarea
                  value={sendContent}
                  onChange={(e) => setSendContent(e.target.value)}
                  placeholder="Écrire un message..."
                  rows={2}
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  disabled={sending}
                />
                <div className="flex shrink-0 flex-col gap-2">
                  <Link
                    href={`/dashboard/taches/${selectedTaskId}#documents-section`}
                    className="rounded-lg border border-slate-300 bg-white p-2.5 text-slate-600 hover:bg-slate-50"
                    title="Joindre un document"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </Link>
                  <button
                    type="submit"
                    disabled={sending || !sendContent.trim()}
                    className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Envoyer
                  </button>
                </div>
              </form>

              {canChangeStatus && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <select
                    onChange={(e) => e.target.value && handleStatusChange(e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                  >
                    <option value="">Changer le statut</option>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="EN_ATTENTE_INFO">En attente client</option>
                    <option value="A_VALIDER">Terminer (à valider)</option>
                    {isAgence && <option value="COMPLETE">Valider</option>}
                  </select>
                  <Link
                    href={`/dashboard/taches/${selectedTaskId}`}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Ouvrir la mission
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <p className="text-slate-500">Sélectionnez une mission dans la liste.</p>
            {missions.length === 0 && (
              <Link
                href="/dashboard/taches"
                className="mt-4 text-sm font-medium text-blue-600 hover:underline"
              >
                Voir les missions →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
