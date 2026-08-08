"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DeleteTaskButton } from "@/components/tasks/DeleteTaskButton";
import { documentDownloadHref } from "@/lib/documents/download-url";
import { SignedFileLink } from "@/components/files/SignedFileLink";
import { MessageBeworkActions } from "@/components/messagerie/MessageBeworkActions";
import { ConversationDossierPanel } from "@/components/messagerie/ConversationDossierPanel";
import { badgeIcon } from "@/lib/messagerie/message-links";

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
  kind?: string;
  linkedBadges?: string[];
  createdAt: string;
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
};

type MissionItem = {
  id: string;
  title: string;
  status: string;
  priority: string | null;
  projectId?: string | null;
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

type DirectMessageItem = {
  id: string;
  content: string;
  read: boolean;
  receiverId?: string;
  attachmentsJson?: { name: string; fileUrl: string; fileSize: number; mimeType?: string }[] | null;
  createdAt: string;
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
};

type AttachmentItem = { name: string; fileUrl: string; fileSize: number; mimeType?: string };

type FilterId = "envoyer" | "messages-directs" | "inbox" | "mes-missions" | "en-attente-client" | "en-cours" | "terminees";

const NAV_ITEMS: { id: FilterId; label: string }[] = [
  { id: "envoyer", label: "Envoyer un message" },
  { id: "messages-directs", label: "Messages directs" },
  { id: "inbox", label: "Boîte de réception" },
  { id: "mes-missions", label: "Mes missions" },
  { id: "en-attente-client", label: "En attente client" },
  { id: "en-cours", label: "En cours" },
  { id: "terminees", label: "Terminées" },
];

function railIcon(id: FilterId) {
  switch (id) {
    case "inbox":
      return "💬";
    case "messages-directs":
      return "👤";
    case "envoyer":
      return "✏️";
    case "mes-missions":
      return "📋";
    case "en-attente-client":
      return "⏳";
    case "en-cours":
      return "▶️";
    case "terminees":
      return "✅";
    default:
      return "•";
  }
}

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

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const dim = size === "sm" ? "h-10 w-10 text-[11px]" : "h-11 w-11 text-xs";
  const hues = ["bg-[#00a884]", "bg-[#027eb5]", "bg-[#7d4cdb]", "bg-[#e56717]", "bg-[#128c7e]"];
  const hue = hues[(name.charCodeAt(0) + name.length) % hues.length];
  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full font-semibold text-white ${hue}`}
    >
      {initials}
    </div>
  );
}

/** Fond type WhatsApp (motif discret, sans image externe). */
const CHAT_BG_STYLE: CSSProperties = {
  backgroundColor: "#efeae2",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d4cfc7' fill-opacity='0.35'%3E%3Ccircle cx='8' cy='8' r='1.2'/%3E%3Ccircle cx='32' cy='22' r='1'/%3E%3Ccircle cx='48' cy='40' r='1.3'/%3E%3Ccircle cx='18' cy='48' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
};

interface MessagerieMissionsViewProps {
  sessionUserId: string;
  isAgence: boolean;
  isAgent: boolean;
  isClient?: boolean;
  canChangeStatus: boolean;
  agents?: { id: string; name: string }[];
  managerId?: string | null;
  recipients?: { id: string; name: string; role: string }[];
}

export function MessagerieMissionsView({
  sessionUserId,
  isAgence,
  isAgent,
  isClient = false,
  canChangeStatus,
  agents = [],
  managerId,
  recipients = [],
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
  const [directRecipientId, setDirectRecipientId] = useState("");
  const [directContent, setDirectContent] = useState("");
  const [sendingDirect, setSendingDirect] = useState(false);
  const [directMessages, setDirectMessages] = useState<DirectMessageItem[]>([]);
  const [directThreadMessages, setDirectThreadMessages] = useState<DirectMessageItem[]>([]);
  const [loadingDirectMessages, setLoadingDirectMessages] = useState(false);
  const [loadingDirectThread, setLoadingDirectThread] = useState(false);
  const [selectedDirectContactId, setSelectedDirectContactId] = useState<string>("");
  const [replyDirectContent, setReplyDirectContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [directAttachments, setDirectAttachments] = useState<AttachmentItem[]>([]);
  const [replyAttachments, setReplyAttachments] = useState<AttachmentItem[]>([]);
  const [uploadingAttach, setUploadingAttach] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const directFileId = "direct-file-input";
  const replyFileId = "reply-file-input";
  const chatEndRef = useRef<HTMLDivElement>(null);
  const highlightMessageId = useRef<string | null>(null);

  const selectedMission = missions.find((m) => m.id === selectedTaskId);
  const showEnvoyerTab = isAgence || isAgent;
  const navItems = showEnvoyerTab ? NAV_ITEMS : NAV_ITEMS.filter((i) => i.id !== "envoyer" && i.id !== "messages-directs");

  const myDirectMessages = directMessages.filter(
    (m) => m.sender.id === sessionUserId || m.receiver.id === sessionUserId
  );

  // Conversations directes : regroupées par contact, avec dernier message et non-lus
  const directConversations = (() => {
    const byOther = new Map<string, { user: { id: string; name: string }; lastMessage: DirectMessageItem; unread: number }>();
    for (const m of myDirectMessages) {
      const other = m.sender.id === sessionUserId ? m.receiver : m.sender;
      if (other.id === sessionUserId) continue;
      const existing = byOther.get(other.id);
      const isNewer = !existing || new Date(m.createdAt) > new Date(existing.lastMessage.createdAt);
      const isToMe = (m.receiverId ?? m.receiver.id) === sessionUserId;
      const unreadIncr = isToMe && !m.read ? 1 : 0;
      if (!existing) {
        byOther.set(other.id, { user: other, lastMessage: m, unread: unreadIncr });
      } else if (isNewer) {
        byOther.set(other.id, { user: other, lastMessage: m, unread: existing.unread + unreadIncr });
      } else if (unreadIncr > 0) {
        byOther.set(other.id, { ...existing, unread: existing.unread + 1 });
      }
    }
    return Array.from(byOther.values()).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  })();

  const selectedDirectThread = directThreadMessages;

  async function refreshDirectIndex() {
    const res = await fetch("/api/messages/direct");
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? (data as DirectMessageItem[]) : [];
  }

  async function refreshDirectThread(contactId: string) {
    if (!contactId) {
      setDirectThreadMessages([]);
      return;
    }
    setLoadingDirectThread(true);
    try {
      const res = await fetch(`/api/messages/direct?with=${encodeURIComponent(contactId)}`);
      if (res.ok) {
        const data = await res.json();
        setDirectThreadMessages(Array.isArray(data) ? data : []);
      } else {
        setDirectThreadMessages([]);
      }
    } finally {
      setLoadingDirectThread(false);
    }
  }

  const selectedDirectContact = recipients.find((r) => r.id === selectedDirectContactId) ?? directConversations.find((c) => c.user.id === selectedDirectContactId)?.user;

  useEffect(() => {
    if (filter === "envoyer") {
      setLoading(false);
      return;
    }
    if (filter === "messages-directs") {
      setLoadingDirectMessages(true);
      refreshDirectIndex()
        .then((data) => {
          setDirectMessages(data);
          if (!selectedDirectContactId && data.length > 0) {
            const first = data[0] as DirectMessageItem;
            const other = first.sender.id === sessionUserId ? first.receiver : first.sender;
            if (other?.id && other.id !== sessionUserId) setSelectedDirectContactId(other.id);
          }
        })
        .finally(() => setLoadingDirectMessages(false));
      setLoading(false);
      return;
    }
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
    if (filter !== "messages-directs" || !selectedDirectContactId) {
      setDirectThreadMessages([]);
      return;
    }
    void refreshDirectThread(selectedDirectContactId);
  }, [filter, selectedDirectContactId]);

  // Marquer comme lus les messages directs du contact sélectionné
  useEffect(() => {
    if (filter !== "messages-directs" || !selectedDirectContactId) return;
    fetch("/api/messages/direct/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId: selectedDirectContactId }),
    })
      .then((r) => {
        if (r.ok) return refreshDirectIndex();
        return [];
      })
      .then((data) => {
        if (Array.isArray(data)) setDirectMessages(data);
      })
      .catch(() => {});
  }, [filter, selectedDirectContactId]);

  // Deep-link ?task=&messageId= / ?tab=messages-directs&with=&messageId=
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const task = params.get("task");
    const messageId = params.get("messageId");
    const withUser = params.get("with");
    if (tab === "messages-directs") {
      setFilter("messages-directs");
      if (withUser) setSelectedDirectContactId(withUser);
    }
    if (task) setSelectedTaskId(task);
    if (messageId) highlightMessageId.current = messageId;

    if (messageId && !task && tab !== "messages-directs") {
      void fetch(`/api/messages/locate?kind=TASK&id=${encodeURIComponent(messageId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.taskId) setSelectedTaskId(d.taskId);
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const mid = highlightMessageId.current;
    if (!mid) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(`msg-${mid}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("ring-2", "ring-amber-400", "rounded-2xl");
      highlightMessageId.current = null;
    }, 350);
    return () => window.clearTimeout(t);
  }, [messages, directThreadMessages, selectedTaskId, selectedDirectContactId]);

  // Rafraîchissement automatique des messages directs (toutes les 7 s)
  useEffect(() => {
    if (filter !== "messages-directs") return;
    const interval = setInterval(() => {
      void refreshDirectIndex().then((data) => setDirectMessages(data));
      if (selectedDirectContactId) {
        void refreshDirectThread(selectedDirectContactId);
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [filter, selectedDirectContactId]);

  // Rafraîchissement automatique des messages mission (toutes les 7 s)
  useEffect(() => {
    if (!selectedTaskId || filter === "envoyer" || filter === "messages-directs") return;
    const interval = setInterval(() => {
      fetch(`/api/tasks/${selectedTaskId}/messages`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setMessages(Array.isArray(data) ? data : []))
        .catch(() => {});
    }, 7000);
    return () => clearInterval(interval);
  }, [selectedTaskId, filter]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, directThreadMessages.length]);

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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, setAttachments: React.Dispatch<React.SetStateAction<AttachmentItem[]>>) {
    const input = e.target;
    const files = input.files;
    if (!files?.length) return;
    setUploadingAttach(true);
    const uploaded: AttachmentItem[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!(file instanceof File) || !file.size) continue;
        const fd = new FormData();
        fd.append("file", file);
        try {
          const res = await fetch("/api/messages/direct/upload", { method: "POST", body: fd });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.fileUrl) {
            uploaded.push({ name: data.name ?? file.name, fileUrl: data.fileUrl, fileSize: data.fileSize ?? file.size, mimeType: data.mimeType });
          } else {
            alert(data?.error ?? `Erreur lors du téléchargement de "${file.name}"`);
          }
        } catch {
          alert(`Erreur réseau pour "${file.name}". Vérifiez votre connexion.`);
        }
      }
      if (uploaded.length > 0) {
        setAttachments((prev) => [...prev, ...uploaded]);
      }
    } finally {
      setUploadingAttach(false);
      input.value = "";
    }
  }

  async function handleReplyDirect(e: React.FormEvent) {
    e.preventDefault();
    const content = replyDirectContent.trim();
    const hasContent = content.length > 0;
    const hasAttachments = replyAttachments.length > 0;
    if ((!hasContent && !hasAttachments) || !selectedDirectContactId || sendingReply) return;
    setSendingReply(true);
    try {
      const res = await fetch("/api/messages/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content || "",
          receiverId: selectedDirectContactId,
          attachments: hasAttachments ? replyAttachments : undefined,
        }),
      });
      if (res.ok) {
        setReplyDirectContent("");
        setReplyAttachments([]);
        const list = await refreshDirectIndex();
        setDirectMessages(list);
        await refreshDirectThread(selectedDirectContactId);
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Erreur lors de l'envoi");
      }
    } finally {
      setSendingReply(false);
    }
  }

  async function handleSendDirect(e: React.FormEvent) {
    e.preventDefault();
    const content = directContent.trim();
    const hasContent = content.length > 0;
    const hasAttachments = directAttachments.length > 0;
    if ((!hasContent && !hasAttachments) || !directRecipientId || sendingDirect) return;

    setSendingDirect(true);
    try {
      const res = await fetch("/api/messages/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content || "",
          receiverId: directRecipientId,
          attachments: hasAttachments ? directAttachments : undefined,
        }),
      });

      if (res.ok) {
        setDirectContent("");
        setDirectRecipientId("");
        setDirectAttachments([]);
        router.refresh();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err?.error ?? "Erreur lors de l'envoi");
      }
    } finally {
      setSendingDirect(false);
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

  const filteredMissions = listSearch.trim()
    ? missions.filter(
        (m) =>
          m.title.toLowerCase().includes(listSearch.toLowerCase()) ||
          m.client.name.toLowerCase().includes(listSearch.toLowerCase()),
      )
    : missions;

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-12rem)] items-center justify-center rounded-xl border border-[#d1d7db] bg-[#f0f2f5]">
        <p className="text-[#667781]">Chargement…</p>
      </div>
    );
  }

  const railBtn = (id: FilterId, label: string, active: boolean) => (
    <button
      key={id}
      type="button"
      title={label}
      onClick={() => setFilter(id)}
      className={`flex w-full flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[9px] font-medium transition ${
        active ? "bg-[#00a884]/15 text-[#008069]" : "text-[#54656f] hover:bg-black/5"
      }`}
    >
      <span className="text-base leading-none">{railIcon(id)}</span>
      <span className="max-w-[52px] truncate">{label.split(" ")[0]}</span>
    </button>
  );

  return (
    <div className="flex h-[calc(100vh-12rem)] overflow-hidden rounded-xl border border-[#d1d7db] bg-[#f0f2f5] shadow-sm">
      {/* Rail type WhatsApp */}
      <aside className="flex w-[58px] shrink-0 flex-col items-center border-r border-[#d1d7db] bg-[#f0f2f5] py-2">
        <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-1">
          {navItems.map((item) => railBtn(item.id, item.label, filter === item.id))}
        </div>
      </aside>

      {/* Colonne liste / formulaire */}
      {filter === "envoyer" ? (
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-[#111b21]">Nouveau message</h2>
          <p className="mb-4 text-sm text-[#667781]">
            Choisissez un destinataire et écrivez votre message.
          </p>
          <form onSubmit={handleSendDirect} className="space-y-4">
            <div>
              <label htmlFor="recipient" className="mb-1.5 block text-sm font-medium text-[#111b21]">
                Destinataire
              </label>
              <select
                id="recipient"
                value={directRecipientId}
                onChange={(e) => setDirectRecipientId(e.target.value)}
                required
                className="w-full rounded-lg border border-[#d1d7db] px-4 py-2.5 text-sm text-[#111b21] focus:border-[#00a884] focus:outline-none focus:ring-2 focus:ring-[#00a884]/20"
              >
                <option value="">Sélectionner un agent ou gérant…</option>
                {recipients
                  .filter((r) => r.id !== sessionUserId)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.role})
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label htmlFor="direct-content" className="mb-1.5 block text-sm font-medium text-[#111b21]">
                Message
              </label>
              <textarea
                id="direct-content"
                value={directContent}
                onChange={(e) => setDirectContent(e.target.value)}
                placeholder="Tapez un message"
                rows={5}
                disabled={sendingDirect}
                className="w-full rounded-lg border border-[#d1d7db] px-4 py-2.5 text-sm placeholder:text-[#8696a0] focus:border-[#00a884] focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 disabled:opacity-60"
              />
            </div>
            <div>
              <input
                id={directFileId}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.docx,.xlsx,.xls,.csv,.txt,.doc"
                className="sr-only"
                multiple
                onChange={(e) => handleFileUpload(e, setDirectAttachments)}
              />
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor={directFileId}
                  className={`flex cursor-pointer items-center gap-2 rounded-full border border-[#d1d7db] bg-white px-3 py-2 text-sm text-[#54656f] hover:bg-[#f0f2f5] ${(uploadingAttach || sendingDirect) ? "pointer-events-none opacity-50" : ""}`}
                >
                  + {uploadingAttach ? "Téléchargement…" : "Joindre"}
                </label>
                {directAttachments.map((a, i) => (
                  <span key={i} className="flex items-center gap-1 rounded-full bg-[#f0f2f5] px-2 py-1 text-xs text-[#111b21]">
                    {a.name}
                    <button type="button" onClick={() => setDirectAttachments((p) => p.filter((_, j) => j !== i))} className="text-[#667781] hover:text-red-600">×</button>
                  </span>
                ))}
              </div>
            </div>
            <button
              type="submit"
              disabled={sendingDirect || (!directContent.trim() && directAttachments.length === 0) || !directRecipientId}
              className="rounded-full bg-[#00a884] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#008f72] disabled:opacity-50"
            >
              {sendingDirect ? "Envoi…" : "Envoyer"}
            </button>
          </form>
          {recipients.length === 0 && (
            <p className="mt-4 text-sm text-[#667781]">Aucun agent ou gérant disponible.</p>
          )}
        </div>
      ) : filter === "messages-directs" ? (
        <>
          <aside className="flex w-80 shrink-0 flex-col border-r border-slate-200 bg-white">
            <div className="border-b border-slate-200 p-3">
              <h2 className="text-sm font-semibold text-slate-800">Conversations</h2>
            </div>
            <ul className="flex-1 overflow-y-auto">
              {loadingDirectMessages ? (
                <li className="p-4 text-sm text-slate-500">Chargement…</li>
              ) : directConversations.length === 0 ? (
                <li className="p-4 text-center">
                  <p className="text-sm text-slate-600">Aucun message direct</p>
                  <p className="mt-1 text-xs text-slate-500">Utilisez « Envoyer un message » pour démarrer une conversation.</p>
                </li>
              ) : (
                directConversations.map((conv) => (
                  <li key={conv.user.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedDirectContactId(conv.user.id)}
                      className={`w-full border-l-2 px-4 py-3 text-left transition ${
                        selectedDirectContactId === conv.user.id
                          ? "border-blue-600 bg-blue-50/60"
                          : "border-transparent hover:bg-slate-50"
                      }`}
                    >
                      <p className="truncate text-sm font-semibold text-slate-800">{conv.user.name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {conv.lastMessage.sender.id === sessionUserId ? "Vous : " : ""}
                        {conv.lastMessage.content.slice(0, 50)}
                        {conv.lastMessage.content.length > 50 ? "…" : ""}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        {conv.unread > 0 && (
                          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-medium text-white">
                            {conv.unread}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {formatRelativeTime(conv.lastMessage.createdAt)}
                        </span>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </aside>
          <div className="flex min-w-0 flex-1 flex-col">
            {selectedDirectContactId && selectedDirectContact ? (
              <>
                <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
                  <h3 className="font-semibold text-slate-800">
                    {(selectedDirectContact as { name?: string } | undefined)?.name ?? "Contact"}
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {loadingDirectThread ? (
                      <p className="text-sm text-slate-500">Chargement de la conversation…</p>
                    ) : null}
                    {selectedDirectThread.map((m) => {
                      const isMe = m.sender.id === sessionUserId;
                      return (
                        <div
                          key={m.id}
                          id={`msg-${m.id}`}
                          className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                        >
                          <Avatar name={m.sender.name} />
                          <div className={`flex max-w-[80%] flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div
                              className={`rounded-lg px-2.5 py-1.5 shadow-sm ${
                                isMe ? "rounded-tr-sm bg-[#d9fdd3] text-[#111b21]" : "rounded-tl-sm bg-white text-[#111b21]"
                              }`}
                            >
                              {!isMe ? (
                                <p className="text-[12px] font-semibold text-[#00a884]">{m.sender.name}</p>
                              ) : null}
                              {m.content && <p className="whitespace-pre-wrap break-words text-[14.2px]">{m.content}</p>}
                              {Array.isArray(m.attachmentsJson) && m.attachmentsJson.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  {m.attachmentsJson.map((a, i) => (
                                    <SignedFileLink
                                      key={i}
                                      url={a.fileUrl}
                                      className="flex items-center gap-2 rounded bg-black/5 px-2 py-1 text-xs text-[#111b21]"
                                    >
                                      📄 {a.name}
                                    </SignedFileLink>
                                  ))}
                                </div>
                              )}
                              <p className="mt-0.5 flex justify-end gap-1 text-[11px] text-[#667781]">
                                {formatMessageTime(m.createdAt)}
                                {isMe ? <span className="text-[#53bdeb]">✓✓</span> : null}
                              </p>
                            </div>
                            <MessageBeworkActions
                              messageId={m.id}
                              messageKind="DIRECT"
                              content={m.content || ""}
                              isMe={isMe}
                              agents={agents}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="shrink-0 border-t border-slate-200 bg-slate-50/60 p-4">
                  <form onSubmit={handleReplyDirect} className="space-y-2">
                    <input
                      id={replyFileId}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.docx,.xlsx,.xls,.csv,.txt,.doc"
                      className="sr-only"
                      multiple
                      onChange={(e) => handleFileUpload(e, setReplyAttachments)}
                    />
                    {replyAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {replyAttachments.map((a, i) => (
                          <span key={i} className="flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                            {a.name}
                            <button type="button" onClick={() => setReplyAttachments((p) => p.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-600">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <textarea
                        value={replyDirectContent}
                        onChange={(e) => setReplyDirectContent(e.target.value)}
                        placeholder="Répondre…"
                        rows={2}
                        disabled={sendingReply}
                        className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60"
                      />
                      <div className="flex shrink-0 flex-col gap-2">
                        <label
                          htmlFor={replyFileId}
                          className={`cursor-pointer rounded-lg border border-slate-300 bg-white p-2.5 text-slate-600 hover:bg-slate-50 ${(uploadingAttach || sendingReply) ? "pointer-events-none opacity-50" : ""}`}
                          title="Joindre un fichier"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        </label>
                        <button
                          type="submit"
                          disabled={sendingReply || (!replyDirectContent.trim() && replyAttachments.length === 0)}
                      className="shrink-0 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                            {sendingReply ? "Envoi…" : "Envoyer"}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <p className="text-sm font-medium text-slate-700">Sélectionnez une conversation</p>
                <p className="mt-2 max-w-sm text-sm text-slate-500">
                  Cliquez sur une conversation dans la liste à gauche pour afficher les messages et répondre.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
      <>
      <aside className="flex w-[360px] shrink-0 flex-col border-r border-[#d1d7db] bg-white">
        <div className="border-b border-[#e9edef] px-4 pb-3 pt-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#111b21]">Discussions</h2>
          </div>
          <input
            type="search"
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
            placeholder="Rechercher"
            className="w-full rounded-lg border-0 bg-[#f0f2f5] px-3 py-2 text-sm text-[#111b21] placeholder:text-[#667781] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
          />
        </div>
        <ul className="flex-1 overflow-y-auto">
          {filteredMissions.length === 0 ? (
            <li className="p-4">
              <div className="rounded-xl bg-[#f0f2f5] p-4 text-center">
                <p className="text-sm font-medium text-[#111b21]">Aucune discussion</p>
                <p className="mt-1 text-xs text-[#667781]">
                  {isClient
                    ? "Créez une mission pour démarrer une conversation."
                    : isAgent
                      ? "Aucune mission assignée pour le moment."
                      : "Les discussions apparaissent avec les missions."}
                </p>
                <Link
                  href={isClient ? "/dashboard/nouvelle-demande" : "/dashboard/taches"}
                  className="mt-3 inline-flex items-center justify-center rounded-full bg-[#00a884] px-4 py-2 text-sm font-medium text-white hover:bg-[#008f72]"
                >
                  {isClient ? "Créer une mission" : "Voir les missions"}
                </Link>
              </div>
            </li>
          ) : (
            filteredMissions.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelectedTaskId(m.id)}
                  className={`flex w-full gap-3 px-3 py-3 text-left transition ${
                    selectedTaskId === m.id ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"
                  }`}
                >
                  <Avatar name={m.client.name || m.title} size="sm" />
                  <div className="min-w-0 flex-1 border-b border-[#f0f2f5] pb-3">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-[15px] font-medium text-[#111b21]">{m.title}</p>
                      <span className="shrink-0 text-[11px] text-[#667781]">
                        {m.lastMessage ? formatRelativeTime(m.lastMessage.createdAt) : ""}
                      </span>
                    </div>
                    <p className="truncate text-[13px] text-[#667781]">{m.client.name}</p>
                    {m.lastMessage ? (
                      <p className="mt-0.5 truncate text-[13px] text-[#667781]">
                        {m.lastMessage.sender.id === sessionUserId ? "Vous : " : ""}
                        {m.lastMessage.content.slice(0, 48)}
                        {m.lastMessage.content.length > 48 ? "…" : ""}
                      </p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {(m.priority === "URGENT" || m.priority === "PRIORITAIRE") && (
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-[#ea0038]">
                          {m.priority === "URGENT" ? "Urgent" : "Prioritaire"}
                        </span>
                      )}
                      {m.unreadCount > 0 && (
                        <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#00a884] px-1.5 text-[10px] font-bold text-white">
                          {m.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      {/* Colonne droite : conversation type WhatsApp */}
      <div className="flex min-w-0 flex-1 flex-col">
        {selectedMission ? (
          <>
            <div className="flex shrink-0 items-center gap-3 border-b border-[#d1d7db] bg-[#f0f2f5] px-4 py-2.5">
              <Avatar name={selectedMission.client.name || selectedMission.title} size="sm" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[16px] font-medium text-[#111b21]">{selectedMission.title}</h3>
                <p className="truncate text-[12px] text-[#667781]">
                  {selectedMission.client.name}
                  {selectedMission.assignedTo ? ` · ${selectedMission.assignedTo.name}` : ""}
                  {" · "}
                  {STATUS_LABELS[selectedMission.status] ?? selectedMission.status}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {selectedMission.projectId ? (
                  <Link
                    href={`/dashboard/projets/${selectedMission.projectId}`}
                    className="hidden text-xs font-semibold text-[#00a884] hover:underline sm:inline"
                  >
                    Dossier chantier
                  </Link>
                ) : null}
                <ConversationDossierPanel
                  taskId={selectedTaskId}
                  projectId={selectedMission.projectId}
                />
                <DeleteTaskButton taskId={selectedTaskId} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3" style={CHAT_BG_STYLE}>
              {loadingMessages ? (
                <p className="text-sm text-[#667781]">Chargement…</p>
              ) : (
                <div className="space-y-1.5">
                  {visibleMessages.map((m) => {
                    const isMe = m.sender.id === sessionUserId;
                    const isSystem = m.kind === "SYSTEM";
                    return (
                      <div
                        key={m.id}
                        id={`msg-${m.id}`}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex max-w-[78%] flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <div
                            className={`relative rounded-lg px-2.5 py-1.5 shadow-sm ${
                              isSystem
                                ? "mx-auto rounded-md bg-[#fff5c4] text-center text-[#54656f]"
                                : isMe
                                  ? "rounded-tr-sm bg-[#d9fdd3] text-[#111b21]"
                                  : "rounded-tl-sm bg-white text-[#111b21]"
                            } ${m.isInternal ? "ring-1 ring-amber-400" : ""}`}
                          >
                            {!isSystem && !isMe ? (
                              <p className="text-[12px] font-semibold text-[#00a884]">{m.sender.name}</p>
                            ) : null}
                            {isSystem ? (
                              <p className="text-[12px] font-medium">BeWork · {m.content}</p>
                            ) : (
                              <p className="whitespace-pre-wrap break-words text-[14.2px] leading-[19px]">
                                {m.content}
                                {m.isInternal ? " (interne)" : ""}
                              </p>
                            )}
                            <p
                              className={`mt-0.5 flex items-center justify-end gap-1 text-[11px] ${
                                isMe ? "text-[#667781]" : "text-[#667781]"
                              }`}
                            >
                              {formatMessageTime(m.createdAt)}
                              {isMe && !isSystem ? (
                                <span className="text-[#53bdeb]" title="Envoyé">
                                  ✓✓
                                </span>
                              ) : null}
                            </p>
                          </div>
                          {!isSystem ? (
                            <MessageBeworkActions
                              messageId={m.id}
                              messageKind="TASK"
                              content={m.content}
                              isMe={isMe}
                              agents={agents}
                              initialBadges={m.linkedBadges}
                              onLinked={(badge) => {
                                setMessages((prev) =>
                                  prev.map((x) =>
                                    x.id === m.id
                                      ? {
                                          ...x,
                                          linkedBadges: Array.from(
                                            new Set([...(x.linkedBadges ?? []), badge]),
                                          ),
                                        }
                                      : x,
                                  ),
                                );
                              }}
                            />
                          ) : null}
                          {(m.linkedBadges?.length ?? 0) > 0 ? (
                            <div className={`mt-0.5 flex flex-wrap gap-1 ${isMe ? "justify-end" : ""}`}>
                              {m.linkedBadges!.map((b) => (
                                <span
                                  key={b}
                                  className="rounded-full bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-[#008069] shadow-sm"
                                >
                                  {badgeIcon(b)} {b}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
              )}

              {selectedMission.documents.length > 0 && (
                <div className="mt-4 rounded-lg bg-white/80 p-3 shadow-sm">
                  <h4 className="mb-2 text-xs font-semibold text-[#54656f]">Documents joints</h4>
                  <ul className="space-y-1">
                    {selectedMission.documents.map((d) => (
                      <li key={d.id}>
                        <a
                          href={documentDownloadHref(d.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[#111b21] hover:bg-[#f0f2f5]"
                        >
                          <span className="text-[#00a884]">📄</span>
                          <span className="truncate">{d.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="shrink-0 bg-[#f0f2f5] px-3 py-2">
              {(isAgence || isAgent) && (
                <label className="mb-1.5 flex items-center gap-2 px-1 text-xs text-[#667781]">
                  <input
                    type="checkbox"
                    checked={internalNote}
                    onChange={(e) => setInternalNote(e.target.checked)}
                    className="rounded border-[#d1d7db]"
                  />
                  Note interne
                </label>
              )}
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <Link
                  href={`/dashboard/taches/${selectedTaskId}#documents-section`}
                  className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl text-[#54656f] hover:bg-[#e9edef]"
                  title="Joindre"
                >
                  +
                </Link>
                <textarea
                  value={sendContent}
                  onChange={(e) => setSendContent(e.target.value)}
                  placeholder="Tapez un message"
                  rows={1}
                  className="min-h-[42px] max-h-28 min-w-0 flex-1 resize-none rounded-3xl border-0 bg-white px-4 py-2.5 text-[15px] text-[#111b21] placeholder:text-[#667781] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
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
                <button
                  type="submit"
                  disabled={sending || !sendContent.trim()}
                  className="mb-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white hover:bg-[#008f72] disabled:opacity-40"
                  title="Envoyer"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </form>

              {canChangeStatus && (
                <div className="mt-2 flex flex-wrap gap-2 px-1">
                  <select
                    onChange={(e) => e.target.value && handleStatusChange(e.target.value)}
                    className="rounded-lg border border-[#d1d7db] bg-white px-2 py-1 text-xs text-[#54656f]"
                  >
                    <option value="">Statut mission</option>
                    <option value="EN_ATTENTE">En attente</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="EN_ATTENTE_INFO">En attente client</option>
                    <option value="A_VALIDER">Terminer (à valider)</option>
                    {isAgence && <option value="COMPLETE">Valider</option>}
                  </select>
                  <Link
                    href={`/dashboard/taches/${selectedTaskId}`}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-[#00a884] hover:underline"
                  >
                    Ouvrir la mission
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center bg-[#f0f2f5] p-8 text-center">
            <p className="text-lg font-medium text-[#41525d]">BeWork Messagerie</p>
            <p className="mt-2 max-w-sm text-sm text-[#667781]">
              Sélectionnez une discussion à gauche pour afficher la conversation.
            </p>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}
