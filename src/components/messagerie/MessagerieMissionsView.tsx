"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DeleteTaskButton } from "@/components/tasks/DeleteTaskButton";
import { documentDownloadHref } from "@/lib/documents/download-url";
import { SignedFileLink } from "@/components/files/SignedFileLink";
import { MessageBeworkActions } from "@/components/messagerie/MessageBeworkActions";
import { ConversationDossierPanel } from "@/components/messagerie/ConversationDossierPanel";
import { badgeIcon } from "@/lib/messagerie/message-links";
import { WA_CHAT_BG, waBubbleTime, waListTime } from "@/components/messagerie/wa-theme";

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
  attachmentsJson?: { name: string; fileUrl: string; fileSize: number; mimeType?: string }[] | null;
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
  senderId?: string;
  receiverId?: string;
  attachmentsJson?: { name: string; fileUrl: string; fileSize: number; mimeType?: string }[] | null;
  createdAt: string;
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
};

type AttachmentItem = { name: string; fileUrl: string; fileSize: number; mimeType?: string };

type FilterId = "envoyer" | "messages-directs" | "inbox" | "mes-missions" | "en-attente-client" | "en-cours" | "terminees";

const NAV_ITEMS: { id: FilterId; label: string }[] = [
  { id: "messages-directs", label: "Contacts" },
  { id: "inbox", label: "Discussions" },
  { id: "envoyer", label: "Nouveau" },
  { id: "mes-missions", label: "Mes missions" },
  { id: "en-attente-client", label: "En attente client" },
  { id: "en-cours", label: "En cours" },
  { id: "terminees", label: "Terminées" },
];

function railIcon(id: FilterId) {
  const common = "h-6 w-6";
  switch (id) {
    case "inbox":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      );
    case "messages-directs":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      );
    case "envoyer":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
        </svg>
      );
    case "mes-missions":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" />
        </svg>
      );
    case "en-attente-client":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
        </svg>
      );
    case "en-cours":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      );
    case "terminees":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      );
    default:
      return <span>•</span>;
  }
}

function formatRelativeTime(d: string) {
  return waListTime(d);
}

function formatMessageTime(d: string) {
  return waBubbleTime(d);
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const dim =
    size === "lg" ? "h-12 w-12 text-sm" : size === "sm" ? "h-12 w-12 text-[13px]" : "h-10 w-10 text-xs";
  const hues = ["bg-[#00a884]", "bg-[#027eb5]", "bg-[#7d4cdb]", "bg-[#e56717]", "bg-[#128c7e]", "bg-[#d3396d]"];
  const hue = hues[(name.charCodeAt(0) + name.length) % hues.length];
  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-full font-semibold text-white ${hue}`}
    >
      {initials}
    </div>
  );
}

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
  const [filter, setFilter] = useState<FilterId>(
    isClient ? "inbox" : "messages-directs",
  );
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
  const [missionAttachments, setMissionAttachments] = useState<AttachmentItem[]>([]);
  const [uploadingAttach, setUploadingAttach] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const directFileId = "direct-file-input";
  const replyFileId = "reply-file-input";
  const missionFileId = "mission-file-input";
  const chatEndRef = useRef<HTMLDivElement>(null);
  const highlightMessageId = useRef<string | null>(null);

  const selectedMission = missions.find((m) => m.id === selectedTaskId);
  const showEnvoyerTab = isAgence || isAgent || isClient;
  const navItems = NAV_ITEMS.filter((i) => {
    if (i.id === "envoyer") return showEnvoyerTab;
    if (i.id === "messages-directs") return true; // Contacts pour tous
    return true;
  });

  const myDirectMessages = directMessages.filter(
    (m) => m.sender.id === sessionUserId || m.receiver.id === sessionUserId
  );

  // Conversations directes : contacts connus + destinataires (même sans message)
  const directConversations = (() => {
    const byOther = new Map<string, { user: { id: string; name: string }; lastMessage: DirectMessageItem | null; unread: number }>();
    for (const m of myDirectMessages) {
      const other = m.sender.id === sessionUserId ? m.receiver : m.sender;
      if (other.id === sessionUserId) continue;
      const existing = byOther.get(other.id);
      const isNewer = !existing?.lastMessage || new Date(m.createdAt) > new Date(existing.lastMessage.createdAt);
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
    for (const r of recipients) {
      if (r.id === sessionUserId) continue;
      if (!byOther.has(r.id)) {
        byOther.set(r.id, { user: { id: r.id, name: r.name }, lastMessage: null, unread: 0 });
      }
    }
    return Array.from(byOther.values()).sort((a, b) => {
      const ta = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const tb = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      if (tb !== ta) return tb - ta;
      return a.user.name.localeCompare(b.user.name);
    });
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
          if (!selectedDirectContactId) {
            if (data.length > 0) {
              const first = data[0] as DirectMessageItem;
              const other = first.sender.id === sessionUserId ? first.receiver : first.sender;
              if (other?.id && other.id !== sessionUserId) setSelectedDirectContactId(other.id);
            } else if (recipients[0]?.id) {
              setSelectedDirectContactId(recipients[0].id);
            }
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
    let cancelled = false;
    setMessages([]);
    setLoadingMessages(true);

    // Optimistic WhatsApp : badge vert disparaît dès l’ouverture
    setMissions((prev) =>
      prev.map((m) => (m.id === selectedTaskId ? { ...m, unreadCount: 0 } : m)),
    );

    const taskId = selectedTaskId;
    Promise.all([
      fetch(`/api/tasks/${taskId}/messages`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/tasks/${taskId}/messages/read`, { method: "POST" }).catch(() => null),
    ])
      .then(([data]) => {
        if (cancelled) return;
        setMessages(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
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
    const contactId = selectedDirectContactId;
    fetch("/api/messages/direct/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId: contactId }),
    })
      .then((r) => {
        if (r.ok) return refreshDirectIndex();
        return null;
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setDirectMessages(
            data.map((m) =>
              (m.receiverId ?? m.receiver.id) === sessionUserId &&
              (m.senderId ?? m.sender.id) === contactId
                ? { ...m, read: true }
                : m,
            ),
          );
        } else {
          // Optimistic si refresh échoue
          setDirectMessages((prev) =>
            prev.map((m) =>
              (m.receiverId ?? m.receiver.id) === sessionUserId &&
              (m.senderId ?? m.sender.id) === contactId
                ? { ...m, read: true }
                : m,
            ),
          );
        }
      })
      .catch(() => {
        setDirectMessages((prev) =>
          prev.map((m) =>
            (m.receiverId ?? m.receiver.id) === sessionUserId &&
            (m.senderId ?? m.sender.id) === contactId
              ? { ...m, read: true }
              : m,
          ),
        );
      });
  }, [filter, selectedDirectContactId, sessionUserId]);

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
    if ((!content && missionAttachments.length === 0) || !selectedTaskId || sending) return;

    setSending(true);
    try {
      const body: {
        content: string;
        receiverId?: string;
        isInternal?: boolean;
        attachments?: AttachmentItem[];
      } = {
        content,
        isInternal: internalNote && (isAgence || isAgent),
        attachments: missionAttachments,
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
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSendContent("");
        setMissionAttachments([]);
        const refresh = await fetch(`/api/tasks/${selectedTaskId}/messages`);
        if (refresh.ok) setMessages(await refresh.json());
        const listRes = await fetch(`/api/tasks/messagerie?filter=${filter === "messages-directs" ? "inbox" : filter}`);
        if (listRes.ok) setMissions(await listRes.json());
        router.refresh();
      } else {
        alert(data?.error ?? "Impossible d’envoyer le message");
      }
    } catch {
      alert("Erreur réseau — réessayez");
    } finally {
      setSending(false);
    }
  }

  async function uploadFiles(files: FileList | File[], setAttachments: React.Dispatch<React.SetStateAction<AttachmentItem[]>>) {
    const list = Array.from(files);
    if (!list.length) return;
    setUploadingAttach(true);
    const uploaded: AttachmentItem[] = [];
    try {
      for (const file of list) {
        if (!(file instanceof File) || !file.size) continue;
        const fd = new FormData();
        fd.append("file", file);
        try {
          const res = await fetch("/api/messages/direct/upload", { method: "POST", body: fd });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.fileUrl) {
            uploaded.push({
              name: data.name ?? file.name,
              fileUrl: data.fileUrl,
              fileSize: data.fileSize ?? file.size,
              mimeType: data.mimeType ?? file.type,
            });
          } else {
            alert(data?.error ?? `Erreur lors du téléchargement de "${file.name}"`);
          }
        } catch {
          alert(`Erreur réseau pour "${file.name}".`);
        }
      }
      if (uploaded.length > 0) {
        setAttachments((prev) => [...prev, ...uploaded]);
      }
    } finally {
      setUploadingAttach(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, setAttachments: React.Dispatch<React.SetStateAction<AttachmentItem[]>>) {
    const input = e.target;
    const files = input.files;
    if (!files?.length) return;
    await uploadFiles(files, setAttachments);
    input.value = "";
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
      <div className="flex h-full items-center justify-center bg-[#f0f2f5]">
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
      className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
        active ? "bg-[#00a884]/20 text-[#008069]" : "text-[#54656f] hover:bg-black/5"
      }`}
    >
      {railIcon(id)}
    </button>
  );

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] overflow-hidden bg-[#f0f2f5] shadow-2xl">
      {/* Rail icônes — comme WhatsApp */}
      <aside className="flex w-[59px] shrink-0 flex-col items-center border-r border-[#d1d7db] bg-[#f0f2f5] py-3">
        <div className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto">
          {navItems.map((item) => railBtn(item.id, item.label, filter === item.id))}
        </div>
      </aside>

      {/* Colonne liste / formulaire */}
      {filter === "envoyer" ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-white p-6">
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
          <aside className="flex min-h-0 w-[min(100%,420px)] shrink-0 flex-col overflow-hidden border-r border-[#d1d7db] bg-white">
            <div className="border-b border-[#e9edef] px-4 pb-3 pt-3">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[22px] font-bold tracking-tight text-[#111b21]">Contacts</h2>
                <button
                  type="button"
                  title="Nouveau message"
                  onClick={() => setFilter("envoyer")}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656f] hover:bg-[#f0f2f5]"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </button>
              </div>
              <input
                type="search"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder="Rechercher un contact"
                className="w-full rounded-lg border-0 bg-[#f0f2f5] px-3 py-2 text-[14px] text-[#111b21] placeholder:text-[#667781] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
              />
            </div>
            <ul className="flex-1 overflow-y-auto">
              {loadingDirectMessages ? (
                <li className="p-4 text-sm text-[#667781]">Chargement…</li>
              ) : directConversations.filter((c) =>
                  !listSearch.trim() ||
                  c.user.name.toLowerCase().includes(listSearch.toLowerCase()),
                ).length === 0 ? (
                <li className="p-4 text-center">
                  <p className="text-sm text-[#111b21]">Aucun contact</p>
                  <p className="mt-1 text-xs text-[#667781]">Ajoutez des membres d’équipe ou créez un message.</p>
                  <button
                    type="button"
                    onClick={() => setFilter("envoyer")}
                    className="mt-3 rounded-full bg-[#00a884] px-4 py-2 text-sm font-medium text-white"
                  >
                    Nouveau message
                  </button>
                </li>
              ) : (
                directConversations
                  .filter(
                    (c) =>
                      !listSearch.trim() ||
                      c.user.name.toLowerCase().includes(listSearch.toLowerCase()),
                  )
                  .map((conv) => (
                  <li key={conv.user.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedDirectContactId(conv.user.id)}
                      className={`flex w-full gap-3 px-3 py-3 text-left transition ${
                        selectedDirectContactId === conv.user.id ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"
                      }`}
                    >
                      <Avatar name={conv.user.name} size="sm" />
                      <div className="min-w-0 flex-1 border-b border-[#f0f2f5] pb-3">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-[15px] font-medium text-[#111b21]">{conv.user.name}</p>
                          {conv.lastMessage ? (
                            <span className="text-[11px] text-[#667781]">
                              {formatRelativeTime(conv.lastMessage.createdAt)}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-[13px] text-[#667781]">
                          {conv.lastMessage
                            ? `${conv.lastMessage.sender.id === sessionUserId ? "Vous : " : ""}${conv.lastMessage.content.slice(0, 50)}${conv.lastMessage.content.length > 50 ? "…" : ""}`
                            : "Appuyez pour discuter"}
                        </p>
                        {conv.unread > 0 && (
                          <span className="mt-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#00a884] px-1.5 text-[10px] font-bold text-white">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </aside>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            {selectedDirectContactId && selectedDirectContact ? (
              <>
                <div className="flex shrink-0 items-center gap-3 border-b border-[#d1d7db] bg-[#f0f2f5] px-4 py-2">
                  <Avatar
                    name={(selectedDirectContact as { name?: string } | undefined)?.name ?? "Contact"}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[16px] font-medium text-[#111b21]">
                      {(selectedDirectContact as { name?: string } | undefined)?.name ?? "Contact"}
                    </h3>
                    <p className="text-[13px] text-[#667781]">Message direct</p>
                  </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3" style={WA_CHAT_BG}>
                  <div className="space-y-1.5">
                    {loadingDirectThread ? (
                      <p className="text-sm text-[#667781]">Chargement…</p>
                    ) : null}
                    {!loadingDirectThread && selectedDirectThread.length === 0 ? (
                      <div className="flex h-full items-center justify-center py-16">
                        <p className="rounded-lg bg-[#fff5c4] px-4 py-2 text-[13px] text-[#54656f] shadow-sm">
                          Début de la conversation avec{" "}
                          {(selectedDirectContact as { name?: string })?.name ?? "ce contact"}.
                        </p>
                      </div>
                    ) : null}
                    {selectedDirectThread.map((m) => {
                      const isMe = m.sender.id === sessionUserId;
                      return (
                        <div
                          key={m.id}
                          id={`msg-${m.id}`}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`flex max-w-[75%] flex-col ${isMe ? "items-end" : "items-start"}`}>
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
                <div className="z-20 shrink-0 border-t border-[#d1d7db] bg-[#f0f2f5] px-3 py-2.5">
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
                          <span key={i} className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-[#111b21]">
                            {a.name}
                            <button type="button" onClick={() => setReplyAttachments((p) => p.filter((_, j) => j !== i))} className="text-[#667781] hover:text-red-600">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <label
                        htmlFor={replyFileId}
                        className={`mb-0.5 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#54656f] hover:bg-[#e9edef] ${(uploadingAttach || sendingReply) ? "pointer-events-none opacity-50" : ""}`}
                        title="Joindre"
                      >
                        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                      </label>
                      <textarea
                        value={replyDirectContent}
                        onChange={(e) => setReplyDirectContent(e.target.value)}
                        placeholder="Tapez un message"
                        rows={1}
                        disabled={sendingReply}
                        className="min-h-[44px] max-h-32 min-w-0 flex-1 resize-none rounded-[24px] border-0 bg-white px-4 py-3 text-[15px] text-[#111b21] placeholder:text-[#667781] focus:outline-none disabled:opacity-60"
                      />
                      <button
                        type="submit"
                        disabled={sendingReply || (!replyDirectContent.trim() && replyAttachments.length === 0)}
                        className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white hover:bg-[#008f72] disabled:opacity-40"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </button>
                    </div>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center bg-[#f0f2f5] p-8 text-center">
                <p className="text-lg font-medium text-[#41525d]">BeWork Messagerie</p>
                <p className="mt-2 max-w-sm text-sm text-[#667781]">
                  Sélectionnez une conversation à gauche.
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
      <>
      <aside className="flex min-h-0 w-[min(100%,420px)] shrink-0 flex-col overflow-hidden border-r border-[#d1d7db] bg-white">
        <div className="border-b border-[#e9edef] px-4 pb-3 pt-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[22px] font-bold tracking-tight text-[#111b21]">Discussions</h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Contacts"
                onClick={() => setFilter("messages-directs")}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#008069] hover:bg-[#e7f8f3]"
              >
                Contacts
              </button>
              <button
                type="button"
                title="Nouvelle discussion"
                onClick={() => setFilter(showEnvoyerTab ? "envoyer" : "inbox")}
                className="flex h-9 w-9 items-center justify-center rounded-full text-[#54656f] hover:bg-[#f0f2f5]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#54656f]"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              type="search"
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Rechercher"
              className="w-full rounded-lg border-0 bg-[#f0f2f5] py-2 pl-10 pr-3 text-[14px] text-[#111b21] placeholder:text-[#667781] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
            />
          </div>
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
                    <p className="mt-0.5 truncate text-[13px] text-[#667781]">
                      {m.assignedTo?.name
                        ? `${m.assignedTo.name.split(" ")[0]} · `
                        : ""}
                      {STATUS_LABELS[m.status] ?? m.status}
                    </p>
                    {m.lastMessage ? (
                      <p
                        className={`mt-0.5 truncate text-[13px] ${
                          m.unreadCount > 0 ? "font-semibold text-[#111b21]" : "text-[#667781]"
                        }`}
                      >
                        {m.lastMessage.sender.id === sessionUserId
                          ? "Vous : "
                          : `${m.lastMessage.sender.name.split(/\s+/)[0] ?? ""} : `}
                        {m.lastMessage.content.slice(0, 52)}
                        {m.lastMessage.content.length > 52 ? "…" : ""}
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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {selectedMission ? (
          <>
            <div className="flex shrink-0 items-center gap-3 border-b border-[#d1d7db] bg-[#f0f2f5] px-4 py-2">
              <Avatar name={selectedMission.client.name || selectedMission.title} size="sm" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[16px] font-medium text-[#111b21]">{selectedMission.title}</h3>
                <p className="truncate text-[13px] text-[#667781]">
                  {selectedMission.client.name}
                  {selectedMission.assignedTo ? ` · ${selectedMission.assignedTo.name}` : ""}
                  {" · "}
                  {STATUS_LABELS[selectedMission.status] ?? selectedMission.status}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 text-[#54656f]">
                <ConversationDossierPanel
                  taskId={selectedTaskId}
                  projectId={selectedMission.projectId}
                />
                {selectedMission.projectId ? (
                  <Link
                    href={`/dashboard/projets/${selectedMission.projectId}`}
                    className="hidden rounded-full p-2 hover:bg-[#e9edef] sm:inline-flex"
                    title="Dossier chantier"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                    </svg>
                  </Link>
                ) : null}
                <button type="button" className="rounded-full p-2 hover:bg-[#e9edef]" title="Rechercher" tabIndex={-1}>
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                </button>
                <DeleteTaskButton taskId={selectedTaskId} />
              </div>
            </div>

            <div
              className="relative min-h-0 flex-1 overflow-y-auto px-4 py-3"
              style={WA_CHAT_BG}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.length) {
                  void uploadFiles(e.dataTransfer.files, setMissionAttachments);
                }
              }}
            >
              {dragOver ? (
                <div className="pointer-events-none absolute inset-4 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-[#00a884] bg-[#d9fdd3]/70 text-sm font-semibold text-[#008069]">
                  Déposez photos ou documents ici
                </div>
              ) : null}
              {loadingMessages ? (
                <p className="text-sm text-[#667781]">Chargement…</p>
              ) : visibleMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="rounded-lg bg-[#fff5c4] px-4 py-2 text-[13px] text-[#54656f] shadow-sm">
                    Aucun message pour l’instant — écrivez le premier, ou joignez une photo / un PDF.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {visibleMessages.map((m) => {
                    const isMe = m.sender.id === sessionUserId;
                    const isSystem = m.kind === "SYSTEM";
                    const atts = Array.isArray(m.attachmentsJson) ? m.attachmentsJson : [];
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
                              <>
                                {m.content && !atts.some((a) => a.name === m.content) ? (
                                  <p className="whitespace-pre-wrap break-words text-[14.2px] leading-[19px]">
                                    {m.content}
                                    {m.isInternal ? " (interne)" : ""}
                                  </p>
                                ) : null}
                                {atts.length > 0 ? (
                                  <div className="mt-1.5 space-y-1.5">
                                    {atts.map((a, i) => {
                                      const isImg = (a.mimeType || "").startsWith("image/") || /\.(jpe?g|png|gif|webp)$/i.test(a.name);
                                      return isImg ? (
                                        <a key={i} href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img
                                            src={a.fileUrl}
                                            alt={a.name}
                                            className="max-h-56 max-w-full rounded-lg object-cover"
                                          />
                                        </a>
                                      ) : (
                                        <SignedFileLink
                                          key={i}
                                          url={a.fileUrl}
                                          className="flex items-center gap-2 rounded-lg bg-black/5 px-2 py-2 text-xs text-[#111b21]"
                                        >
                                          📄 {a.name}
                                          <span className="text-[10px] text-[#667781]">
                                            {a.fileSize ? `${Math.max(1, Math.round(a.fileSize / 1024))} Ko` : ""}
                                          </span>
                                        </SignedFileLink>
                                      );
                                    })}
                                  </div>
                                ) : null}
                              </>
                            )}
                            <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-[#667781]">
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
                  <h4 className="mb-2 text-xs font-semibold text-[#54656f]">Documents mission</h4>
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

            <div className="z-20 shrink-0 border-t border-[#d1d7db] bg-[#f0f2f5] px-3 py-2.5">
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
              <input
                id={missionFileId}
                type="file"
                accept="image/*,.pdf,.jpg,.jpeg,.png,.gif,.webp,.docx,.xlsx,.xls,.csv,.txt,.doc"
                className="sr-only"
                multiple
                onChange={(e) => handleFileUpload(e, setMissionAttachments)}
              />
              {missionAttachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2 px-1">
                  {missionAttachments.map((a, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-[#111b21] shadow-sm"
                    >
                      {(a.mimeType || "").startsWith("image/") ? "🖼️" : "📄"} {a.name}
                      <button
                        type="button"
                        onClick={() => setMissionAttachments((p) => p.filter((_, j) => j !== i))}
                        className="text-[#667781] hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <form onSubmit={handleSend} className="flex items-end gap-2">
                <label
                  htmlFor={missionFileId}
                  className={`mb-0.5 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#54656f] hover:bg-[#e9edef] ${uploadingAttach || sending ? "pointer-events-none opacity-50" : ""}`}
                  title="Joindre photo ou document"
                >
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </label>
                <div className="relative min-w-0 flex-1">
                  <textarea
                    value={sendContent}
                    onChange={(e) => setSendContent(e.target.value)}
                    placeholder={uploadingAttach ? "Téléchargement…" : "Tapez un message"}
                    rows={1}
                    className="min-h-[44px] max-h-32 w-full resize-none rounded-[24px] border-0 bg-white py-3 pl-4 pr-10 text-[15px] text-[#111b21] placeholder:text-[#667781] focus:outline-none"
                    disabled={sending}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if ((sendContent.trim() || missionAttachments.length > 0) && !sending) {
                          void (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
                        }
                      }
                    }}
                  />
                  <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-[#54656f]"
                    aria-hidden
                  >
                    🙂
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={sending || (!sendContent.trim() && missionAttachments.length === 0)}
                  className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white hover:bg-[#008f72] disabled:bg-[#00a884]/40"
                  title={sendContent.trim() || missionAttachments.length ? "Envoyer" : "Message"}
                >
                  {sendContent.trim() || missionAttachments.length > 0 ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                    </svg>
                  )}
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
