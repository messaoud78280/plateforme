"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { DeleteTaskButton } from "@/components/tasks/DeleteTaskButton";
import { documentDownloadHref } from "@/lib/documents/download-url";
import { badgeIcon } from "@/lib/messagerie/message-links";
import { WA_CHAT_BG, waBubbleTime, waListTime } from "@/components/messagerie/wa-theme";
import { subscribeMessagerieEvents } from "@/lib/perf/messagerie-unread-bus";
import { compressImageForMessagerie } from "@/lib/messagerie/compress-image";
import {
  formatMediaPreview,
  isAudioAttachment,
  isImageAttachment,
  type MsgAttachment,
} from "@/lib/messagerie/media-preview";
import { VoiceRecorderPanel } from "@/components/messagerie/VoiceRecorderPanel";
import { PhotoPreviewGrid } from "@/components/messagerie/PhotoPreviewGrid";
import { MessagerieAttachmentsBlock } from "@/components/messagerie/MessagerieSecureMedia";
import { MESSAGERIE_MEDIA_MAX_BYTES } from "@/lib/messagerie/media-storage";
import {
  formatPartyBadge,
  internalProfileLabel,
  messagingPartyToneClass,
  resolveMessagingPartyType,
  type MessagingPartyType,
} from "@/lib/messagerie/party-type";

const MessageBeworkActions = dynamic(
  () =>
    import("@/components/messagerie/MessageBeworkActions").then((m) => m.MessageBeworkActions),
  { ssr: false },
);
const ConversationDossierPanel = dynamic(
  () =>
    import("@/components/messagerie/ConversationDossierPanel").then(
      (m) => m.ConversationDossierPanel,
    ),
  { ssr: false },
);

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
  attachmentsJson?: MsgAttachment[] | null;
  createdAt: string;
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
};

type MissionItem = {
  id: string;
  title: string;
  status: string;
  category?: string | null;
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

type RecipientItem = {
  id: string;
  name: string;
  role: string;
  personType?: string | null;
  permissionProfile?: string | null;
  company?: string | null;
  partyType?: MessagingPartyType;
  shortLabel?: string;
};

function partyForMission(m: MissionItem) {
  return resolveMessagingPartyType({
    taskCategory: m.category,
    titleHint: m.title,
  });
}

function partyForRecipient(r: RecipientItem) {
  if (r.partyType && r.shortLabel) {
    return resolveMessagingPartyType({
      personType: r.personType,
      permissionProfile: r.permissionProfile,
      legacyRole: r.role,
    });
  }
  return resolveMessagingPartyType({
    personType: r.personType,
    permissionProfile: r.permissionProfile,
    legacyRole: r.role,
  });
}

type DirectMessageItem = {
  id: string;
  content: string;
  read: boolean;
  senderId?: string;
  receiverId?: string;
  attachmentsJson?: MsgAttachment[] | null;
  createdAt: string;
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
};

type AttachmentItem = MsgAttachment;

type FilterId = "envoyer" | "messages-directs" | "inbox" | "mes-missions" | "en-attente-client" | "en-cours" | "terminees";
type ListChip = "tous" | "non-lus" | "internes" | "externes" | "clients" | "fournisseurs";

const MORE_NAV: { id: FilterId; label: string }[] = [
  { id: "mes-missions", label: "Mes missions" },
  { id: "en-attente-client", label: "En attente client" },
  { id: "en-cours", label: "En cours" },
  { id: "terminees", label: "Terminées" },
];

const PINS_KEY = "bework.msg.pins";
const PINS_MAX = 5;

function loadPins(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PINS_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(arr) ? arr.slice(0, PINS_MAX) : [];
  } catch {
    return [];
  }
}

function savePins(ids: string[]) {
  try {
    localStorage.setItem(PINS_KEY, JSON.stringify(ids.slice(0, PINS_MAX)));
  } catch {
    /* ignore */
  }
}

function sortMissionsByLastMessage(list: MissionItem[]): MissionItem[] {
  return [...list].sort((a, b) => {
    const ta = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const tb = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
    return tb - ta;
  });
}

function bumpMissionWithMessage(
  list: MissionItem[],
  taskId: string,
  lastMessage: MissionItem["lastMessage"],
  unreadDelta = 0,
): MissionItem[] {
  const next = list.map((m) =>
    m.id === taskId
      ? {
          ...m,
          lastMessage: lastMessage ?? m.lastMessage,
          unreadCount: Math.max(0, m.unreadCount + unreadDelta),
        }
      : m,
  );
  return sortMissionsByLastMessage(next);
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

function MissionRow({
  m,
  selected,
  sessionUserId,
  pinned,
  onSelect,
  onTogglePin,
  formatRelativeTime: fmt,
}: {
  m: MissionItem;
  selected: boolean;
  sessionUserId: string;
  pinned: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
  formatRelativeTime: (d: string) => string;
}) {
  const unread = m.unreadCount > 0;
  return (
    <li>
      <div
        className={`flex w-full gap-2 px-2 py-2 transition ${
          selected ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"
        }`}
      >
        <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 gap-3 px-1 py-1 text-left">
          <div className="relative">
            <Avatar name={m.client.name || m.title} size="sm" />
            {unread ? (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#00a884] ring-2 ring-white" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1 border-b border-[#f0f2f5] pb-3">
            <div className="flex items-baseline justify-between gap-2">
              <p
                className={`truncate text-[15px] ${
                  unread ? "font-bold text-[#111b21]" : "font-medium text-[#111b21]"
                }`}
              >
                {m.title}
              </p>
              <span
                className={`shrink-0 text-[11px] ${
                  unread ? "font-semibold text-[#00a884]" : "text-[#667781]"
                }`}
              >
                {m.lastMessage ? fmt(m.lastMessage.createdAt) : ""}
              </span>
            </div>
            <p
              className={`mt-0.5 truncate text-[12px] font-semibold ${messagingPartyToneClass(
                partyForMission(m).partyType,
              )}`}
            >
              {formatPartyBadge(partyForMission(m))}
            </p>
            {m.lastMessage ? (
              <p
                className={`mt-0.5 truncate text-[13px] ${
                  unread ? "font-semibold text-[#111b21]" : "text-[#667781]"
                }`}
              >
                {m.lastMessage.sender.id === sessionUserId
                  ? "Vous : "
                  : `${m.lastMessage.sender.name.split(/\s+/)[0] ?? ""} : `}
                {formatMediaPreview(m.lastMessage.content, null)}
              </p>
            ) : null}
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {(m.priority === "URGENT" || m.priority === "PRIORITAIRE") && (
                <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-[#ea0038]">
                  {m.priority === "URGENT" ? "Urgent" : "Prioritaire"}
                </span>
              )}
              {unread && (
                <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#00a884] px-1.5 text-[10px] font-bold text-white">
                  {m.unreadCount}
                </span>
              )}
            </div>
          </div>
        </button>
        <button
          type="button"
          title={pinned ? "Désépingler" : "Épingler"}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className={`mt-2 h-8 w-8 shrink-0 rounded-full text-xs ${
            pinned ? "bg-slate-100 text-slate-700" : "text-slate-300 hover:text-slate-500"
          }`}
        >
          {pinned ? "✦" : "☆"}
        </button>
      </div>
    </li>
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
  recipients?: RecipientItem[];
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
  const [listChip, setListChip] = useState<ListChip>("tous");
  const [moreOpen, setMoreOpen] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [messages, setMessages] = useState<TaskMessageItem[]>([]);
  const messagesRef = useRef<TaskMessageItem[]>([]);
  messagesRef.current = messages;
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const stickToBottomRef = useRef(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const [sendContent, setSendContent] = useState("");
  const [sending, setSending] = useState(false);
  const [internalNote, setInternalNote] = useState(false);
  const [directRecipientId, setDirectRecipientId] = useState("");
  const [directContent, setDirectContent] = useState("");
  const [sendingDirect, setSendingDirect] = useState(false);
  const [directAttemptedSend, setDirectAttemptedSend] = useState(false);
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
  const [recipientSearch, setRecipientSearch] = useState("");
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [pendingNewCount, setPendingNewCount] = useState(0);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<{
    files: File[];
    comment: string;
  } | null>(null);
  const sendLockRef = useRef(false);
  const directFileId = "direct-file-input";
  const missionFileId = "mission-file-input";
  const missionPhotoId = "mission-photo-input";
  const replyPhotoId = "reply-photo-input";
  const replyCameraId = "reply-camera-input";
  const replyDocId = "reply-doc-input";
  const [directAttachMenuOpen, setDirectAttachMenuOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const highlightMessageId = useRef<string | null>(null);

  useEffect(() => {
    setPinnedIds(loadPins());
  }, []);

  const selectedMission = missions.find((m) => m.id === selectedTaskId);
  const showEnvoyerTab = isAgence || isAgent || isClient;
  const moreNavActive = MORE_NAV.some((i) => i.id === filter);

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
          const list = Array.isArray(data) ? (data as MissionItem[]) : [];
          setMissions(sortMissionsByLastMessage(list));
          if (!selectedTaskId && list.length > 0) {
            setSelectedTaskId(list[0]!.id);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter]);

  // Realtime : remonter la conversation + rafraîchir le fil ouvert (TASK + DIRECT)
  useEffect(() => {
    return subscribeMessagerieEvents((ev) => {
      if (ev.kind === "TASK" && ev.conversationKey.startsWith("TASK:")) {
        const taskId = ev.conversationKey.slice(5);
        setMissions((prev) => {
          const idx = prev.findIndex((m) => m.id === taskId);
          if (idx < 0) {
            void fetch("/api/tasks/messagerie?filter=inbox")
              .then((r) => r.json())
              .then((data) => {
                if (Array.isArray(data)) setMissions(sortMissionsByLastMessage(data));
              });
            return prev;
          }
          const item = prev[idx]!;
          const next = [...prev];
          next.splice(idx, 1);
          next.unshift({
            ...item,
            unreadCount: selectedTaskId === taskId ? item.unreadCount : item.unreadCount + 1,
            lastMessage: {
              id: `rt-${ev.at}`,
              content: ev.preview,
              createdAt: ev.at,
              sender: { id: ev.senderId, name: ev.senderName },
            },
          });
          return next;
        });
        if (selectedTaskId === taskId) {
          if (!stickToBottomRef.current) {
            setPendingNewCount((n) => n + 1);
          }
          void fetch(`/api/tasks/${taskId}/messages?take=30&after=${encodeURIComponent(ev.at)}`)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              const list = Array.isArray(data) ? data : data?.messages;
              if (Array.isArray(list) && list.length) {
                setMessages((prev) => {
                  const ids = new Set(prev.map((m) => m.id));
                  return [...prev, ...list.filter((m: { id: string }) => !ids.has(m.id))];
                });
              }
            });
        }
      }
      if (ev.kind === "DIRECT") {
        const otherId =
          ev.senderId === sessionUserId ? ev.receiverId : ev.senderId;
        // Bump local immédiat (sans attendre le re-fetch)
        setDirectMessages((prev) => {
          const optimistic: DirectMessageItem = {
            id: `rt-${ev.at}`,
            content: ev.preview,
            read: false,
            senderId: ev.senderId,
            receiverId: ev.receiverId,
            createdAt: ev.at,
            sender: { id: ev.senderId, name: ev.senderName },
            receiver: { id: otherId, name: "" },
          };
          const withoutDup = prev.filter((m) => m.id !== optimistic.id);
          return [optimistic, ...withoutDup];
        });
        void refreshDirectIndex().then((data) => setDirectMessages(data));
        if (
          filter === "messages-directs" &&
          selectedDirectContactId &&
          (selectedDirectContactId === otherId ||
            selectedDirectContactId === ev.senderId ||
            selectedDirectContactId === ev.receiverId)
        ) {
          void refreshDirectThread(selectedDirectContactId);
        }
      }
    });
  }, [selectedTaskId, selectedDirectContactId, filter, sessionUserId]);

  useEffect(() => {
    if (!selectedTaskId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setMessages([]);
    setHasMoreMessages(false);
    setLoadingMessages(true);
    stickToBottomRef.current = true;
    setPendingNewCount(0);
    setMobileShowThread(true);

    // Optimistic WhatsApp : badge vert disparaît dès l’ouverture
    setMissions((prev) =>
      prev.map((m) => (m.id === selectedTaskId ? { ...m, unreadCount: 0 } : m)),
    );

    const taskId = selectedTaskId;
    Promise.all([
      fetch(`/api/tasks/${taskId}/messages?take=50`).then(async (r) => {
        if (!r.ok) return { messages: [] as TaskMessageItem[], hasMore: false };
        const messages = await r.json();
        return {
          messages: Array.isArray(messages) ? messages : [],
          hasMore: r.headers.get("X-Has-More") === "1",
        };
      }),
      fetch(`/api/tasks/${taskId}/messages/read`, { method: "POST" }).catch(() => null),
    ])
      .then(([payload]) => {
        if (cancelled) return;
        setMessages(payload.messages);
        setHasMoreMessages(payload.hasMore);
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

  // Poll incrémental mission (nouveaux messages seulement) + remonter conversation
  useEffect(() => {
    if (!selectedTaskId || filter === "envoyer" || filter === "messages-directs") return;
    const interval = setInterval(() => {
      const last = messagesRef.current[messagesRef.current.length - 1];
      const q = last?.id
        ? `?after=${encodeURIComponent(last.id)}&take=30`
        : "?take=50";
      fetch(`/api/tasks/${selectedTaskId}/messages${q}`)
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => {
          if (!Array.isArray(data) || data.length === 0) return;
          const newest = data[data.length - 1] as TaskMessageItem;
          setMessages((prev) => {
            const seen = new Set(prev.map((m) => m.id));
            const add = data.filter((m: TaskMessageItem) => !seen.has(m.id));
            return add.length ? [...prev, ...add] : prev;
          });
          setMissions((prev) =>
            bumpMissionWithMessage(
              prev,
              selectedTaskId,
              {
                id: newest.id,
                content: newest.content,
                createdAt: newest.createdAt,
                sender: newest.sender,
              },
              newest.sender.id === sessionUserId ? 0 : 0,
            ),
          );
        })
        .catch(() => {});
    }, 7000);
    return () => clearInterval(interval);
  }, [selectedTaskId, filter, sessionUserId]);

  // Poll liste conversations (ordre lastMessage) sans refresh page
  useEffect(() => {
    if (filter === "envoyer" || filter === "messages-directs") return;
    const interval = setInterval(() => {
      fetch(`/api/tasks/messagerie?filter=${filter}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!Array.isArray(data)) return;
          setMissions(sortMissionsByLastMessage(data as MissionItem[]));
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, directThreadMessages.length]);

  async function loadOlderMessages() {
    if (!selectedTaskId || loadingOlder || !hasMoreMessages || messages.length === 0) return;
    const oldest = messages[0];
    if (!oldest?.createdAt) return;
    const el = chatScrollRef.current;
    const prevHeight = el?.scrollHeight ?? 0;
    setLoadingOlder(true);
    stickToBottomRef.current = false;
    try {
      const res = await fetch(
        `/api/tasks/${selectedTaskId}/messages?take=50&before=${encodeURIComponent(oldest.createdAt)}`,
      );
      if (!res.ok) return;
      const older = await res.json();
      if (!Array.isArray(older) || older.length === 0) {
        setHasMoreMessages(false);
        return;
      }
      setHasMoreMessages(res.headers.get("X-Has-More") === "1");
      setMessages((prev) => {
        const seen = new Set(prev.map((m) => m.id));
        const add = older.filter((m: TaskMessageItem) => !seen.has(m.id));
        return [...add, ...prev];
      });
      requestAnimationFrame(() => {
        if (!el) return;
        el.scrollTop = el.scrollHeight - prevHeight;
      });
    } finally {
      setLoadingOlder(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    await sendMissionMessage(sendContent.trim(), missionAttachments);
  }

  async function sendMissionMessage(content: string, attachments: AttachmentItem[]) {
    if ((!content && attachments.length === 0) || !selectedTaskId || sending) return;
    if (sendLockRef.current) return;
    sendLockRef.current = true;

    const clientMessageId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `c-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tempId = `temp-${clientMessageId}`;
    const previewContent = formatMediaPreview(content, attachments) || content || "Pièce jointe";
    const optimistic: TaskMessageItem = {
      id: tempId,
      content: previewContent,
      read: false,
      isInternal: Boolean(internalNote && (isAgence || isAgent)),
      attachmentsJson: attachments.length > 0 ? attachments : null,
      createdAt: new Date().toISOString(),
      sender: { id: sessionUserId, name: "Vous" },
      receiver: {
        id: selectedMission?.client?.id ?? "",
        name: selectedMission?.client?.name ?? "",
      },
      linkedBadges: [],
      kind: "pending",
    };

    setSending(true);
    setSendContent("");
    setMissionAttachments([]);
    stickToBottomRef.current = true;
    setMessages((prev) => [...prev, optimistic]);
    setMissions((prev) =>
      bumpMissionWithMessage(prev, selectedTaskId, {
        id: tempId,
        content: previewContent,
        createdAt: optimistic.createdAt,
        sender: optimistic.sender,
      }),
    );

    try {
      const body: {
        content: string;
        receiverId?: string;
        isInternal?: boolean;
        attachments?: AttachmentItem[];
        clientMessageId?: string;
      } = {
        content,
        isInternal: internalNote && (isAgence || isAgent),
        attachments,
        clientMessageId,
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

      if (res.ok && data?.id) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...data, linkedBadges: [] } : m)),
        );
        setMissions((prev) =>
          bumpMissionWithMessage(prev, selectedTaskId, {
            id: data.id,
            content: formatMediaPreview(
              data.content,
              Array.isArray(data.attachmentsJson) ? data.attachmentsJson : attachments,
            ),
            createdAt: data.createdAt,
            sender: data.sender ?? optimistic.sender,
          }),
        );
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempId ? { ...m, kind: "failed" } : m,
          ),
        );
        setSendContent(content);
        setMissionAttachments(attachments);
        alert(data?.error ?? "Échec de l’envoi — réessayez");
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, kind: "failed" } : m,
        ),
      );
      setSendContent(content);
      setMissionAttachments(attachments);
      alert("Erreur réseau — réessayez");
    } finally {
      setSending(false);
      sendLockRef.current = false;
    }
  }

  async function uploadFiles(
    files: FileList | File[],
    setAttachments: React.Dispatch<React.SetStateAction<AttachmentItem[]>>,
    opts?: { durationSec?: number },
  ): Promise<AttachmentItem[]> {
    const list = Array.from(files);
    if (!list.length) return [];
    setUploadingAttach(true);
    setUploadProgress(`Envoi… 0/${list.length}`);
    const uploaded: AttachmentItem[] = [];
    try {
      let i = 0;
      for (const raw of list) {
        i += 1;
        if (!(raw instanceof File) || !raw.size) continue;
        setUploadProgress(`Envoi… ${i}/${list.length}`);
        let file = raw;
        if (file.size > MESSAGERIE_MEDIA_MAX_BYTES) {
          alert(
            `« ${file.name} » dépasse 15 Mo. Compressez la photo ou raccourcissez le vocal, puis réessayez.`,
          );
          continue;
        }
        if (file.type.startsWith("image/")) {
          file = await compressImageForMessagerie(file);
        }
        const fd = new FormData();
        fd.append("file", file);
        if (opts?.durationSec != null) {
          fd.append("durationSec", String(opts.durationSec));
        }
        try {
          const res = await fetch("/api/messages/direct/upload", { method: "POST", body: fd });
          const data = await res.json().catch(() => ({}));
          if (res.ok && data.fileUrl) {
            uploaded.push({
              name: data.name ?? file.name,
              fileUrl: data.fileUrl,
              fileSize: data.fileSize ?? file.size,
              mimeType: data.mimeType ?? file.type,
              kind: data.kind,
              durationSec: data.durationSec ?? opts?.durationSec,
              bucket: data.bucket,
              storagePath: data.storagePath,
            });
          } else {
            alert(data?.error ?? `Échec de l’envoi de « ${file.name} »`);
          }
        } catch {
          alert(`Échec réseau pour « ${file.name} ». Réessayez.`);
        }
      }
      if (uploaded.length > 0) {
        setAttachments((prev) => [...prev, ...uploaded]);
      }
      return uploaded;
    } finally {
      setUploadingAttach(false);
      setUploadProgress(null);
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
    await sendDirectReply(replyDirectContent.trim(), replyAttachments);
  }

  async function sendDirectReply(content: string, attachments: AttachmentItem[]) {
    const hasContent = content.length > 0;
    const hasAttachments = attachments.length > 0;
    if ((!hasContent && !hasAttachments) || !selectedDirectContactId || sendingReply) return;
    if (sendLockRef.current) return;
    sendLockRef.current = true;

    const tempId = `temp-d-${Date.now()}`;
    const preview =
      formatMediaPreview(content, attachments) || content || "Pièce jointe";
    const optimistic: DirectMessageItem = {
      id: tempId,
      content: preview,
      read: false,
      senderId: sessionUserId,
      receiverId: selectedDirectContactId,
      attachmentsJson: hasAttachments ? attachments : null,
      createdAt: new Date().toISOString(),
      sender: { id: sessionUserId, name: "Vous" },
      receiver: {
        id: selectedDirectContactId,
        name: selectedDirectContact?.name ?? "",
      },
    };

    setSendingReply(true);
    setReplyDirectContent("");
    setReplyAttachments([]);
    setDirectThreadMessages((prev) => [...prev, optimistic]);
    setDirectMessages((prev) => [optimistic, ...prev]);
    stickToBottomRef.current = true;

    try {
      const res = await fetch("/api/messages/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content || "",
          receiverId: selectedDirectContactId,
          attachments: hasAttachments ? attachments : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.id) {
        setDirectThreadMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...data } : m)),
        );
        setDirectMessages((prev) =>
          prev.map((m) => (m.id === tempId ? { ...data } : m)),
        );
      } else {
        setDirectThreadMessages((prev) => prev.filter((m) => m.id !== tempId));
        setReplyDirectContent(content);
        setReplyAttachments(attachments);
        alert(data?.error ?? "Échec de l’envoi — réessayez");
      }
    } catch {
      setDirectThreadMessages((prev) => prev.filter((m) => m.id !== tempId));
      setReplyDirectContent(content);
      setReplyAttachments(attachments);
      alert("Erreur réseau — réessayez");
    } finally {
      setSendingReply(false);
      sendLockRef.current = false;
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
        const recipientId = directRecipientId;
        setDirectContent("");
        setDirectRecipientId("");
        setDirectAttachments([]);
        setFilter("messages-directs");
        setSelectedDirectContactId(recipientId);
        const list = await refreshDirectIndex();
        setDirectMessages(list);
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
      }
    } catch {
      // ignore
    }
  }

  function onComposerKeyDown(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    submit: () => void,
  ) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  const visibleMessages = messages.filter((m) => !m.isInternal || isAgence || isAgent);

  const filteredMissions = (() => {
    let list = missions;
    if (listChip === "non-lus") list = list.filter((m) => m.unreadCount > 0);
    if (listChip === "clients") {
      list = list.filter((m) => partyForMission(m).partyType === "CLIENT");
    }
    if (listChip === "fournisseurs") {
      list = list.filter((m) => partyForMission(m).partyType === "SUPPLIER");
    }
    if (listChip === "externes") {
      list = list.filter((m) => partyForMission(m).external);
    }
    // externes / clients : fils mission ; internes → vue Contacts
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.client.name.toLowerCase().includes(q) ||
          (m.assignedTo?.name ?? "").toLowerCase().includes(q) ||
          (m.lastMessage?.content ?? "").toLowerCase().includes(q),
      );
    }
    return sortMissionsByLastMessage(list);
  })();

  const pinnedMissions = filteredMissions.filter((m) => pinnedIds.includes(m.id));
  const recentMissions = filteredMissions.filter((m) => !pinnedIds.includes(m.id));

  function togglePin(taskId: string) {
    setPinnedIds((prev) => {
      const next = prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [taskId, ...prev.filter((id) => id !== taskId)].slice(0, PINS_MAX);
      savePins(next);
      return next;
    });
  }

  function scrollToLatest() {
    stickToBottomRef.current = true;
    setPendingNewCount(0);
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f0f2f5]">
        <p className="text-[#667781]">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-[1600px] overflow-hidden bg-[#f0f2f5] shadow-2xl">
      {/* Pas de rail d’icônes abstraites — navigation dans la colonne liste */}
      {filter === "envoyer" ? (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-white p-6">
          <h2 className="mb-1 text-lg font-semibold text-[#111b21]">Nouveau message</h2>
          <p className="mb-4 text-sm text-[#667781]">À qui souhaitez-vous écrire ?</p>
          <form
            onSubmit={(e) => {
              setDirectAttemptedSend(true);
              void handleSendDirect(e);
            }}
            className="space-y-4"
          >
            <div>
              <input
                id="recipient-search"
                type="search"
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                placeholder="Rechercher Karim, Point.P, ABC Promotion, Victor Hugo…"
                autoFocus
                className="mb-3 w-full rounded-xl border border-[#d1d7db] px-4 py-3 text-sm text-[#111b21] focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/15"
              />
              <ul className="max-h-72 overflow-y-auto rounded-xl border border-[#e9edef]">
                {recipients
                  .filter((r) => r.id !== sessionUserId)
                  .filter((r) => {
                    if (!recipientSearch.trim()) return true;
                    const q = recipientSearch.toLowerCase();
                    const party = partyForRecipient(r);
                    return (
                      r.name.toLowerCase().includes(q) ||
                      (r.company ?? "").toLowerCase().includes(q) ||
                      party.shortLabel.toLowerCase().includes(q) ||
                      (r.permissionProfile ?? "").toLowerCase().includes(q)
                    );
                  })
                  .map((r) => {
                    const party = partyForRecipient(r);
                    const selected = directRecipientId === r.id;
                    const subtitle =
                      party.partyType === "INTERNAL"
                        ? `${internalProfileLabel(r.permissionProfile)} · Interne`
                        : [r.company, party.shortLabel].filter(Boolean).join(" · ");
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setDirectRecipientId(r.id);
                            setDirectAttemptedSend(false);
                            // Conversation existante → ouvrir le fil directement
                            const existing = directConversations.find((c) => c.user.id === r.id);
                            if (existing?.lastMessage) {
                              setSelectedDirectContactId(r.id);
                              setFilter("messages-directs");
                              setMobileShowThread(true);
                            }
                          }}
                          className={`flex w-full items-start gap-3 px-3 py-3 text-left text-sm ${
                            selected ? "bg-[#eef2f7]" : "hover:bg-[#f8fafc]"
                          }`}
                        >
                          <Avatar name={r.name} size="sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-[#111b21]">
                              {r.name}
                              {r.company && party.partyType !== "INTERNAL" ? (
                                <span className="font-normal text-slate-500"> — {r.company}</span>
                              ) : null}
                            </span>
                            <span
                              className={`mt-0.5 block text-[11px] font-semibold ${messagingPartyToneClass(
                                party.partyType,
                              )}`}
                            >
                              {formatPartyBadge(party)}
                              {party.partyType === "INTERNAL" ? ` · ${internalProfileLabel(r.permissionProfile)}` : null}
                            </span>
                            <span className="sr-only">{subtitle}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
              {directAttemptedSend && !directRecipientId ? (
                <p className="mt-2 text-xs text-red-600">Choisissez un destinataire pour envoyer.</p>
              ) : null}
            </div>
            {directRecipientId ? (
            <div>
              {(() => {
                const chosen = recipients.find((r) => r.id === directRecipientId);
                const party = chosen ? partyForRecipient(chosen) : null;
                return (
                  <p className={`mb-2 text-[11px] font-semibold ${party ? messagingPartyToneClass(party.partyType) : ""}`}>
                    {party
                      ? party.partyType === "INTERNAL"
                        ? "Message INTERNE"
                        : `Message à ${chosen?.company || chosen?.name} · EXTERNE`
                      : null}
                    {party ? ` — ${party.visibilityHint}` : null}
                  </p>
                );
              })()}
              <label htmlFor="direct-content" className="mb-1.5 block text-sm font-medium text-[#111b21]">
                Message
              </label>
              <textarea
                id="direct-content"
                value={directContent}
                onChange={(e) => setDirectContent(e.target.value)}
                placeholder="Tapez un message"
                rows={3}
                disabled={sendingDirect}
                className="w-full rounded-lg border border-[#d1d7db] px-4 py-2.5 text-sm placeholder:text-[#8696a0] focus:border-[#00a884] focus:outline-none focus:ring-2 focus:ring-[#00a884]/20 disabled:opacity-60"
              />
              <div className="mt-3">
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
                    className={`flex cursor-pointer items-center gap-2 rounded-full border border-[#d1d7db] bg-white px-3 py-2 text-sm text-[#54656f] hover:bg-[#f0f2f5] ${
                      uploadingAttach || sendingDirect ? "pointer-events-none opacity-50" : ""
                    }`}
                  >
                    + {uploadingAttach ? "Téléchargement…" : "Joindre"}
                  </label>
                  {directAttachments.map((a, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 rounded-full bg-[#f0f2f5] px-2 py-1 text-xs text-[#111b21]"
                    >
                      {a.name}
                      <button
                        type="button"
                        onClick={() => setDirectAttachments((p) => p.filter((_, j) => j !== i))}
                        className="text-[#667781] hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={
                  sendingDirect || (!directContent.trim() && directAttachments.length === 0)
                }
                className="mt-3 rounded-full bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#152a45] disabled:opacity-50"
              >
                {sendingDirect ? "Envoi…" : "Envoyer"}
              </button>
            </div>
            ) : null}
          </form>
          {recipients.length === 0 && (
            <p className="mt-4 text-sm text-[#667781]">Aucun contact disponible.</p>
          )}
        </div>
      ) : filter === "messages-directs" ? (
        <>
          <aside
            className={`min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-[#d1d7db] bg-white md:flex md:w-[min(100%,420px)] ${
              mobileShowThread && selectedDirectContactId ? "hidden" : "flex"
            }`}
          >
            <div className="border-b border-[#e9edef] px-4 pb-3 pt-3">
              <div className="mb-1 flex items-center justify-between">
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
              ) : (() => {
                const filtered = directConversations.filter(
                  (c) =>
                    !listSearch.trim() ||
                    c.user.name.toLowerCase().includes(listSearch.toLowerCase()),
                );
                if (filtered.length === 0) {
                  return (
                    <li className="p-4 text-center">
                      <p className="text-sm text-[#111b21]">Aucun contact</p>
                      <p className="mt-1 text-xs text-[#667781]">
                        Ajoutez des membres d’équipe ou créez un message.
                      </p>
                      <button
                        type="button"
                        onClick={() => setFilter("envoyer")}
                        className="mt-3 rounded-full bg-[#00a884] px-4 py-2 text-sm font-medium text-white"
                      >
                        Nouveau message
                      </button>
                    </li>
                  );
                }
                const groups: { key: MessagingPartyType; label: string; items: typeof filtered }[] = [
                  { key: "INTERNAL", label: "Internes", items: [] },
                  { key: "CLIENT", label: "Clients", items: [] },
                  { key: "SUPPLIER", label: "Fournisseurs", items: [] },
                  { key: "SUBCONTRACTOR", label: "Sous-traitants", items: [] },
                  { key: "PARTNER", label: "Autres externes", items: [] },
                ];
                for (const conv of filtered) {
                  const meta = recipients.find((r) => r.id === conv.user.id);
                  const party = meta
                    ? partyForRecipient(meta)
                    : resolveMessagingPartyType({});
                  const g = groups.find((x) => x.key === party.partyType) ?? groups[groups.length - 1]!;
                  g.items.push(conv);
                }
                return groups
                  .filter((g) => g.items.length > 0)
                  .flatMap((g) => [
                    <li
                      key={`h-${g.key}`}
                      className="sticky top-0 bg-[#f8fafc] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500"
                    >
                      {g.label}
                    </li>,
                    ...g.items.map((conv) => {
                      const meta = recipients.find((r) => r.id === conv.user.id);
                      const party = meta
                        ? partyForRecipient(meta)
                        : resolveMessagingPartyType({});
                      return (
                        <li key={conv.user.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDirectContactId(conv.user.id);
                              setMobileShowThread(true);
                            }}
                            className={`flex w-full gap-3 px-3 py-3 text-left transition ${
                              selectedDirectContactId === conv.user.id
                                ? "bg-[#f0f2f5]"
                                : "hover:bg-[#f5f6f6]"
                            }`}
                          >
                            <Avatar name={conv.user.name} size="sm" />
                            <div className="min-w-0 flex-1 border-b border-[#f0f2f5] pb-3">
                              <div className="flex items-baseline justify-between gap-2">
                                <p className="truncate text-[15px] font-medium text-[#111b21]">
                                  {conv.user.name}
                                  {meta?.company && party.partyType !== "INTERNAL" ? (
                                    <span className="font-normal text-slate-500">
                                      {" "}
                                      — {meta.company}
                                    </span>
                                  ) : null}
                                </p>
                                {conv.lastMessage ? (
                                  <span className="text-[11px] text-[#667781]">
                                    {formatRelativeTime(conv.lastMessage.createdAt)}
                                  </span>
                                ) : null}
                              </div>
                              <p
                                className={`mt-0.5 text-[11px] font-semibold ${messagingPartyToneClass(
                                  party.partyType,
                                )}`}
                              >
                                {formatPartyBadge(party)}
                                {party.partyType === "INTERNAL"
                                  ? ` · ${internalProfileLabel(meta?.permissionProfile)}`
                                  : null}
                              </p>
                              <p className="mt-0.5 truncate text-[13px] text-[#667781]">
                                {conv.lastMessage
                                  ? `${
                                      conv.lastMessage.sender.id === sessionUserId ? "Vous : " : ""
                                    }${formatMediaPreview(
                                      conv.lastMessage.content,
                                      Array.isArray(conv.lastMessage.attachmentsJson)
                                        ? (conv.lastMessage.attachmentsJson as MsgAttachment[])
                                        : null,
                                    )}`
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
                      );
                    }),
                  ]);
              })()}
            </ul>
          </aside>
          <div
            className={`min-h-0 min-w-0 flex-1 flex-col ${
              mobileShowThread && selectedDirectContactId ? "flex" : "hidden md:flex"
            }`}
          >
            {selectedDirectContactId && selectedDirectContact ? (
              <>
                <div className="flex shrink-0 items-center gap-3 border-b border-[#d1d7db] bg-[#f0f2f5] px-4 py-2">
                  <button
                    type="button"
                    className="rounded-full p-2 text-[#54656f] hover:bg-[#e9edef] md:hidden"
                    aria-label="Retour"
                    onClick={() => setMobileShowThread(false)}
                  >
                    ←
                  </button>
                  <Avatar
                    name={(selectedDirectContact as { name?: string } | undefined)?.name ?? "Contact"}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[16px] font-medium text-[#111b21]">
                      {(selectedDirectContact as { name?: string } | undefined)?.name ?? "Contact"}
                    </h3>
                    {(() => {
                      const meta = recipients.find((r) => r.id === selectedDirectContactId);
                      const party = meta
                        ? partyForRecipient(meta)
                        : resolveMessagingPartyType({});
                      return (
                        <p
                          className={`text-[13px] font-medium ${messagingPartyToneClass(
                            party.partyType,
                          )}`}
                        >
                          {formatPartyBadge(party)}
                          {meta?.company && party.partyType !== "INTERNAL"
                            ? ` · ${meta.company}`
                            : party.partyType === "INTERNAL"
                              ? ` · ${internalProfileLabel(meta?.permissionProfile)}`
                              : null}
                        </p>
                      );
                    })()}
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
                          className={`group flex ${isMe ? "justify-end" : "justify-start"}`}
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
                              {Array.isArray(m.attachmentsJson) && m.attachmentsJson.length > 0 ? (
                                <MessagerieAttachmentsBlock
                                  messageKind="DIRECT"
                                  messageId={m.id}
                                  attachments={m.attachmentsJson as MsgAttachment[]}
                                  isMe={isMe}
                                />
                              ) : null}
                              <p className="mt-0.5 flex justify-end gap-1 text-[11px] text-[#667781]">
                                {formatMessageTime(m.createdAt)}
                                {isMe ? <span className="text-[#53bdeb]">✓✓</span> : null}
                              </p>
                            </div>
                            <MessageBeworkActions
                              messageId={m.id}
                              messageKind="DIRECT"
                              content={m.content || ""}
                              hasMedia={
                                Array.isArray(m.attachmentsJson) &&
                                (m.attachmentsJson as MsgAttachment[]).some(
                                  (a) => isAudioAttachment(a) || isImageAttachment(a),
                                )
                              }
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
                  <p className="mb-1.5 px-1 text-[11px] font-semibold text-violet-800">
                    🔒 Message interne
                  </p>
                  <input
                    id={replyCameraId}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files?.length) return;
                      setPhotoPreview({ files: Array.from(files).slice(0, 6), comment: "" });
                      setDirectAttachMenuOpen(false);
                      e.target.value = "";
                    }}
                  />
                  <input
                    id={replyPhotoId}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files?.length) return;
                      setPhotoPreview({ files: Array.from(files).slice(0, 6), comment: "" });
                      setDirectAttachMenuOpen(false);
                      e.target.value = "";
                    }}
                  />
                  <input
                    id={replyDocId}
                    type="file"
                    accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.doc"
                    className="sr-only"
                    multiple
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        void uploadFiles(e.target.files, setReplyAttachments);
                      }
                      setDirectAttachMenuOpen(false);
                      e.target.value = "";
                    }}
                  />
                  {uploadProgress ? (
                    <p className="mb-1.5 px-1 text-xs font-semibold text-[#008069]">{uploadProgress}</p>
                  ) : null}
                  {voiceOpen && filter === "messages-directs" ? (
                    <div className="mb-2">
                      <VoiceRecorderPanel
                        sending={uploadingAttach || sendingReply}
                        onCancel={() => setVoiceOpen(false)}
                        onSend={async (file, durationSec) => {
                          const uploaded = await uploadFiles([file], setReplyAttachments, {
                            durationSec,
                          });
                          setVoiceOpen(false);
                          if (uploaded.length) {
                            await sendDirectReply("", uploaded);
                          }
                        }}
                      />
                    </div>
                  ) : null}
                  {photoPreview && filter === "messages-directs" ? (
                    <div className="mb-2 rounded-2xl border border-[#d1d7db] bg-white p-3 shadow-sm">
                      <p className="mb-2 text-sm font-semibold text-[#111b21]">
                        Aperçu · {photoPreview.files.length} photo
                        {photoPreview.files.length > 1 ? "s" : ""}
                      </p>
                      <PhotoPreviewGrid files={photoPreview.files} />
                      <input
                        value={photoPreview.comment}
                        onChange={(e) =>
                          setPhotoPreview((p) => (p ? { ...p, comment: e.target.value } : p))
                        }
                        placeholder="Commentaire (optionnel)"
                        className="mb-2 w-full rounded-lg border border-[#d1d7db] px-3 py-2 text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPhotoPreview(null)}
                          className="rounded-full border border-[#d1d7db] px-3 py-1.5 text-sm font-semibold text-[#54656f]"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          disabled={uploadingAttach || sendingReply}
                          onClick={async () => {
                            if (!photoPreview) return;
                            const comment = photoPreview.comment.trim();
                            const uploaded = await uploadFiles(
                              photoPreview.files,
                              setReplyAttachments,
                            );
                            setPhotoPreview(null);
                            if (uploaded.length) {
                              await sendDirectReply(comment, uploaded);
                            }
                          }}
                          className="rounded-full bg-[#00a884] px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
                        >
                          Envoyer
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <form id="direct-reply-form" onSubmit={handleReplyDirect} className="space-y-2">
                    {replyAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {replyAttachments.map((a, i) => (
                          <span
                            key={i}
                            className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-[#111b21]"
                          >
                            {isAudioAttachment(a) ? "🎤" : isImageAttachment(a) ? "📷" : "📄"}{" "}
                            {a.name}
                            <button
                              type="button"
                              onClick={() =>
                                setReplyAttachments((p) => p.filter((_, j) => j !== i))
                              }
                              className="text-[#667781] hover:text-red-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex items-end gap-2">
                      <div className="relative mb-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setVoiceOpen(false);
                            setDirectAttachMenuOpen((v) => !v);
                          }}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#54656f] hover:bg-[#e9edef]"
                          title="Joindre"
                        >
                          <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                          </svg>
                        </button>
                        {directAttachMenuOpen ? (
                          <div className="absolute bottom-12 left-0 z-30 w-48 overflow-hidden rounded-xl border border-[#d1d7db] bg-white shadow-lg">
                            <label
                              htmlFor={replyCameraId}
                              className="block cursor-pointer px-3 py-2.5 text-sm text-[#111b21] hover:bg-[#f5f6f6]"
                            >
                              Prendre une photo
                            </label>
                            <label
                              htmlFor={replyPhotoId}
                              className="block cursor-pointer px-3 py-2.5 text-sm text-[#111b21] hover:bg-[#f5f6f6]"
                            >
                              Choisir une photo
                            </label>
                            <label
                              htmlFor={replyDocId}
                              className="block cursor-pointer px-3 py-2.5 text-sm text-[#111b21] hover:bg-[#f5f6f6]"
                              onClick={() => setDirectAttachMenuOpen(false)}
                            >
                              Document
                            </label>
                          </div>
                        ) : null}
                      </div>
                      <textarea
                        value={replyDirectContent}
                        onChange={(e) => setReplyDirectContent(e.target.value)}
                        onKeyDown={(e) =>
                          onComposerKeyDown(e, () => {
                            const form = e.currentTarget.form;
                            if (form) form.requestSubmit();
                          })
                        }
                        placeholder="Écrire un message..."
                        rows={1}
                        disabled={sendingReply}
                        className="min-h-[44px] max-h-32 min-w-0 flex-1 resize-none rounded-[24px] border-0 bg-white px-4 py-3 text-[15px] text-[#111b21] placeholder:text-[#667781] focus:outline-none disabled:opacity-60"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setDirectAttachMenuOpen(false);
                          setVoiceOpen((v) => !v);
                        }}
                        className={`mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                          voiceOpen ? "bg-[#00a884] text-white" : "text-[#54656f] hover:bg-[#e9edef]"
                        }`}
                        title="Message vocal"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                        </svg>
                      </button>
                      <button
                        type="submit"
                        disabled={
                          sendingReply ||
                          (!replyDirectContent.trim() && replyAttachments.length === 0)
                        }
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
      <aside
        className={`min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-[#d1d7db] bg-white md:flex md:w-[min(100%,420px)] ${
          mobileShowThread && selectedTaskId ? "hidden" : "flex"
        }`}
      >
        <div className="border-b border-[#e9edef] px-4 pb-3 pt-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[22px] font-bold tracking-tight text-[#111b21]">Messagerie</h2>
            <div className="relative flex items-center gap-1">
              <button
                type="button"
                title="Contacts internes"
                onClick={() => {
                  setFilter("messages-directs");
                  setListChip("internes");
                }}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-[#008069] hover:bg-[#e7f8f3]"
              >
                Contacts
              </button>
              <button
                type="button"
                title="+ Nouveau message"
                onClick={() => setFilter(showEnvoyerTab ? "envoyer" : "inbox")}
                className="flex h-9 items-center gap-1 rounded-full bg-[#00a884] px-3 text-sm font-semibold text-white hover:bg-[#008f72]"
              >
                <span className="text-lg leading-none">+</span>
                <span className="hidden sm:inline">Nouveau</span>
              </button>
              <button
                type="button"
                title="Plus"
                onClick={() => setMoreOpen((v) => !v)}
                className={`rounded-full px-2.5 py-1.5 text-xs font-bold ${
                  moreOpen || moreNavActive ? "bg-[#e7f8f3] text-[#008069]" : "text-[#54656f] hover:bg-[#f0f2f5]"
                }`}
              >
                •••
              </button>
              {moreOpen ? (
                <div className="absolute right-0 top-10 z-40 w-52 rounded-xl border border-[#d1d7db] bg-white py-1 shadow-lg">
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#667781]">
                    Vues missions
                  </p>
                  {MORE_NAV.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setFilter(item.id);
                        setMoreOpen(false);
                        setListChip("tous");
                      }}
                      className={`block w-full px-3 py-2 text-left text-sm ${
                        filter === item.id
                          ? "bg-[#e7f8f3] font-semibold text-[#008069]"
                          : "text-[#111b21] hover:bg-[#f5f6f6]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      router.push("/dashboard/messagerie?view=chantiers");
                      setMoreOpen(false);
                    }}
                    className="block w-full border-t border-[#f0f2f5] px-3 py-2 text-left text-sm text-[#111b21] hover:bg-[#f5f6f6]"
                  >
                    Fils chantier
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="relative mb-2">
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
              placeholder="Rechercher…"
              className="w-full rounded-lg border-0 bg-[#f0f2f5] py-2 pl-10 pr-3 text-[14px] text-[#111b21] placeholder:text-[#667781] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                ["tous", "Tous"],
                ["non-lus", "Non lus"],
                ["internes", "Internes"],
                ["externes", "Externes"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setListChip(id);
                  if (id === "internes") setFilter("messages-directs");
                  else setFilter("inbox");
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  listChip === id || (id === "externes" && (listChip === "clients" || listChip === "fournisseurs"))
                    ? "bg-[#111b21] text-white"
                    : "bg-[#f0f2f5] text-[#54656f] hover:bg-[#e9edef]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {listChip === "externes" || listChip === "clients" || listChip === "fournisseurs" ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setListChip("clients");
                  setFilter("inbox");
                }}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  listChip === "clients" || listChip === "externes"
                    ? "bg-sky-100 text-sky-900"
                    : "text-[#667781] hover:bg-[#f0f2f5]"
                }`}
              >
                Clients
              </button>
              <button
                type="button"
                onClick={() => {
                  setListChip("fournisseurs");
                  setFilter("inbox");
                }}
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  listChip === "fournisseurs"
                    ? "bg-amber-100 text-amber-900"
                    : "text-[#667781] hover:bg-[#f0f2f5]"
                }`}
              >
                Fournisseurs
              </button>
            </div>
          ) : null}
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
            <>
              {pinnedMissions.length > 0 ? (
                <li className="sticky top-0 z-10 bg-[#f0f2f5] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#667781]">
                  Épinglées
                </li>
              ) : null}
              {pinnedMissions.map((m) => (
                <MissionRow
                  key={`pin-${m.id}`}
                  m={m}
                  selected={selectedTaskId === m.id}
                  sessionUserId={sessionUserId}
                  pinned
                  onSelect={() => {
                    setSelectedTaskId(m.id);
                    setMobileShowThread(true);
                  }}
                  onTogglePin={() => togglePin(m.id)}
                  formatRelativeTime={formatRelativeTime}
                />
              ))}
              {pinnedMissions.length > 0 ? (
                <li className="sticky top-0 z-10 bg-[#f0f2f5] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#667781]">
                  Récentes
                </li>
              ) : null}
              {recentMissions.map((m) => (
                <MissionRow
                  key={m.id}
                  m={m}
                  selected={selectedTaskId === m.id}
                  sessionUserId={sessionUserId}
                  pinned={false}
                  onSelect={() => {
                    setSelectedTaskId(m.id);
                    setMobileShowThread(true);
                  }}
                  onTogglePin={() => togglePin(m.id)}
                  formatRelativeTime={formatRelativeTime}
                />
              ))}
            </>
          )}
        </ul>
      </aside>

      {/* Colonne droite : conversation type WhatsApp */}
      <div
        className={`min-h-0 min-w-0 flex-1 flex-col ${
          mobileShowThread && selectedTaskId ? "flex" : "hidden md:flex"
        }`}
      >
        {selectedMission ? (
          <>
            <div className="relative flex shrink-0 items-center gap-3 border-b border-[#d1d7db] bg-[#f0f2f5] px-4 py-2">
              <button
                type="button"
                className="rounded-full p-2 text-[#54656f] hover:bg-[#e9edef] md:hidden"
                aria-label="Retour"
                onClick={() => setMobileShowThread(false)}
              >
                ←
              </button>
              <Avatar name={selectedMission.client.name || selectedMission.title} size="sm" />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[16px] font-medium text-[#111b21]">{selectedMission.title}</h3>
                <p className="truncate text-[13px] text-[#667781]">
                  <span
                    className={`font-semibold ${messagingPartyToneClass(
                      partyForMission(selectedMission).partyType,
                    )}`}
                  >
                    {formatPartyBadge(partyForMission(selectedMission))}
                  </span>
                  {selectedMission.assignedTo
                    ? ` · Responsable : ${selectedMission.assignedTo.name.split(/\s+/)[0]}`
                    : null}
                </p>
              </div>
              <div className="relative flex shrink-0 items-center gap-1 text-[#54656f]">
                <button
                  type="button"
                  className="rounded-full p-2 hover:bg-[#e9edef]"
                  title="Plus"
                  onClick={() => setHeaderMenuOpen((v) => !v)}
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>
                {headerMenuOpen ? (
                  <div className="absolute right-0 top-11 z-40 w-52 rounded-xl border border-[#d1d7db] bg-white py-1 shadow-lg">
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm text-[#111b21] hover:bg-[#f5f6f6]"
                      onClick={() => {
                        togglePin(selectedTaskId);
                        setHeaderMenuOpen(false);
                      }}
                    >
                      {pinnedIds.includes(selectedTaskId)
                        ? "Désépingler la conversation"
                        : "Épingler la conversation"}
                    </button>
                    {selectedMission.projectId ? (
                      <Link
                        href={`/dashboard/projets/${selectedMission.projectId}`}
                        className="block px-3 py-2 text-sm text-[#111b21] hover:bg-[#f5f6f6]"
                        onClick={() => setHeaderMenuOpen(false)}
                      >
                        Voir le chantier
                      </Link>
                    ) : null}
                    <div className="border-t border-[#f0f2f5] px-2 py-1">
                      <ConversationDossierPanel
                        taskId={selectedTaskId}
                        projectId={selectedMission.projectId}
                      />
                    </div>
                    <div className="border-t border-[#f0f2f5] px-2 py-1">
                      <DeleteTaskButton taskId={selectedTaskId} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div
              ref={chatScrollRef}
              className="relative min-h-0 flex-1 overflow-y-auto px-4 py-3"
              style={WA_CHAT_BG}
              onScroll={(e) => {
                const el = e.currentTarget;
                const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
                stickToBottomRef.current = nearBottom;
                if (nearBottom) setPendingNewCount(0);
                if (el.scrollTop < 48) void loadOlderMessages();
              }}
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
              {pendingNewCount > 0 ? (
                <div className="sticky bottom-3 z-20 flex justify-center">
                  <button
                    type="button"
                    onClick={scrollToLatest}
                    className="rounded-full bg-[#00a884] px-3 py-1.5 text-xs font-bold text-white shadow-lg"
                  >
                    ↓ {pendingNewCount} nouveau{pendingNewCount > 1 ? "x" : ""} message
                    {pendingNewCount > 1 ? "s" : ""}
                  </button>
                </div>
              ) : null}
              {hasMoreMessages ? (
                <div className="mb-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => void loadOlderMessages()}
                    disabled={loadingOlder}
                    className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#54656f] shadow-sm hover:bg-white disabled:opacity-50"
                  >
                    {loadingOlder ? "Chargement…" : "Messages précédents"}
                  </button>
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
                        className={`group flex ${isMe ? "justify-end" : "justify-start"}`}
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
                                  <MessagerieAttachmentsBlock
                                    messageKind="TASK"
                                    messageId={m.id}
                                    attachments={atts}
                                    isMe={isMe}
                                  />
                                ) : null}
                              </>
                            )}
                            <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-[#667781]">
                              {formatMessageTime(m.createdAt)}
                              {isMe && !isSystem ? (
                                m.kind === "pending" ? (
                                  <span className="text-[#8696a0]" title="Envoi…">
                                    Envoi…
                                  </span>
                                ) : m.kind === "failed" ? (
                                  <button
                                    type="button"
                                    className="font-medium text-red-600 underline"
                                    title="Échec — Réessayer"
                                    onClick={() => {
                                      const attsRetry = Array.isArray(m.attachmentsJson)
                                        ? m.attachmentsJson
                                        : [];
                                      const text = (m.content || "")
                                        .replace(/\s*—\s*Échec$/i, "")
                                        .trim();
                                      setMessages((prev) => prev.filter((x) => x.id !== m.id));
                                      void sendMissionMessage(
                                        text.startsWith("🎤") || text.startsWith("📷") || text.startsWith("📎")
                                          ? ""
                                          : text,
                                        attsRetry,
                                      );
                                    }}
                                  >
                                    Échec — Réessayer
                                  </button>
                                ) : (
                                  <span className="text-[#53bdeb]" title="Envoyé">
                                    ✓✓
                                  </span>
                                )
                              ) : null}
                            </p>
                          </div>
                          {!isSystem ? (
                            <MessageBeworkActions
                              messageId={m.id}
                              messageKind="TASK"
                              content={m.content}
                              hasMedia={atts.some(
                                (a) => isAudioAttachment(a) || isImageAttachment(a),
                              )}
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
              <p
                className={`mb-1.5 px-1 text-[11px] font-semibold ${messagingPartyToneClass(
                  partyForMission(selectedMission).partyType,
                )}`}
              >
                {partyForMission(selectedMission).partyType === "SUPPLIER"
                  ? "Message fournisseur · EXTERNE — visible par le fournisseur."
                  : partyForMission(selectedMission).partyType === "INTERNAL"
                    ? "Message INTERNE — visible uniquement par l’équipe autorisée."
                    : `Message client · EXTERNE — ${partyForMission(selectedMission).visibilityHint}`}
              </p>
              {(isAgence || isAgent) && (
                <label className="mb-1.5 flex items-center gap-2 px-1 text-xs text-[#667781]">
                  <input
                    type="checkbox"
                    checked={internalNote}
                    onChange={(e) => setInternalNote(e.target.checked)}
                    className="rounded border-[#d1d7db]"
                  />
                  Note interne (non visible client)
                </label>
              )}
              <input
                id={missionFileId}
                type="file"
                accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.doc"
                className="sr-only"
                multiple
                onChange={(e) => handleFileUpload(e, setMissionAttachments)}
              />
              <input
                id={missionPhotoId}
                type="file"
                accept="image/*"
                className="sr-only"
                multiple
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files?.length) return;
                  setPhotoPreview({ files: Array.from(files).slice(0, 6), comment: "" });
                  setAttachMenuOpen(false);
                  e.target.value = "";
                }}
              />
              <input
                id="mission-camera-input"
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files?.length) return;
                  setPhotoPreview({ files: Array.from(files).slice(0, 6), comment: "" });
                  setAttachMenuOpen(false);
                  e.target.value = "";
                }}
              />
              {uploadProgress ? (
                <p className="mb-1.5 px-1 text-xs font-semibold text-[#008069]">{uploadProgress}</p>
              ) : null}
              {voiceOpen ? (
                <div className="mb-2">
                  <VoiceRecorderPanel
                    sending={uploadingAttach || sending}
                    onCancel={() => setVoiceOpen(false)}
                    onSend={async (file, durationSec) => {
                      const uploaded = await uploadFiles([file], setMissionAttachments, {
                        durationSec,
                      });
                      setVoiceOpen(false);
                      if (uploaded.length) {
                        await sendMissionMessage("", uploaded);
                      }
                    }}
                  />
                </div>
              ) : null}
              {photoPreview ? (
                <div className="mb-2 rounded-2xl border border-[#d1d7db] bg-white p-3 shadow-sm">
                  <p className="mb-2 text-sm font-semibold text-[#111b21]">
                    Aperçu · {photoPreview.files.length} photo
                    {photoPreview.files.length > 1 ? "s" : ""}
                  </p>
                  <PhotoPreviewGrid files={photoPreview.files} />
                  <input
                    value={photoPreview.comment}
                    onChange={(e) =>
                      setPhotoPreview((p) => (p ? { ...p, comment: e.target.value } : p))
                    }
                    placeholder="Commentaire (optionnel)"
                    className="mb-2 w-full rounded-lg border border-[#d1d7db] px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="rounded-full border border-[#d1d7db] px-3 py-1.5 text-sm font-semibold text-[#54656f]"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={uploadingAttach || sending}
                      onClick={async () => {
                        if (!photoPreview) return;
                        const comment = photoPreview.comment.trim();
                        const uploaded = await uploadFiles(
                          photoPreview.files,
                          setMissionAttachments,
                        );
                        setPhotoPreview(null);
                        if (uploaded.length) {
                          await sendMissionMessage(comment, uploaded);
                        }
                      }}
                      className="rounded-full bg-[#00a884] px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      Envoyer
                    </button>
                  </div>
                </div>
              ) : null}
              {missionAttachments.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2 px-1">
                  {missionAttachments.map((a, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 rounded-full bg-white px-2 py-1 text-xs text-[#111b21] shadow-sm"
                    >
                      {isAudioAttachment(a) ? "🎤" : isImageAttachment(a) ? "🖼️" : "📄"} {a.name}
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
              <form id="mission-send-form" onSubmit={handleSend} className="flex items-end gap-2">
                <div className="relative mb-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceOpen(false);
                      setAttachMenuOpen((v) => !v);
                    }}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#54656f] hover:bg-[#e9edef]"
                    title="Joindre"
                  >
                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                  </button>
                  {attachMenuOpen ? (
                    <div className="absolute bottom-12 left-0 z-30 w-48 overflow-hidden rounded-xl border border-[#d1d7db] bg-white shadow-lg">
                      <label
                        htmlFor="mission-camera-input"
                        className="block cursor-pointer px-3 py-2.5 text-sm text-[#111b21] hover:bg-[#f5f6f6]"
                      >
                        Prendre une photo
                      </label>
                      <label
                        htmlFor={missionPhotoId}
                        className="block cursor-pointer px-3 py-2.5 text-sm text-[#111b21] hover:bg-[#f5f6f6]"
                      >
                        Choisir une photo
                      </label>
                      <label
                        htmlFor={missionFileId}
                        className="block cursor-pointer px-3 py-2.5 text-sm text-[#111b21] hover:bg-[#f5f6f6]"
                        onClick={() => setAttachMenuOpen(false)}
                      >
                        Document
                      </label>
                    </div>
                  ) : null}
                </div>
                <div className="relative min-w-0 flex-1">
                  <textarea
                    value={sendContent}
                    onChange={(e) => setSendContent(e.target.value)}
                    placeholder="Écrire un message..."
                    rows={1}
                    className="min-h-[44px] max-h-32 w-full resize-none rounded-[24px] border-0 bg-white py-3 pl-4 pr-4 text-[15px] text-[#111b21] placeholder:text-[#667781] focus:outline-none"
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
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachMenuOpen(false);
                    setVoiceOpen((v) => !v);
                  }}
                  className={`mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                    voiceOpen ? "bg-[#00a884] text-white" : "text-[#54656f] hover:bg-[#e9edef]"
                  }`}
                  title="Message vocal"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                  </svg>
                </button>
                <button
                  type="submit"
                  disabled={sending || (!sendContent.trim() && missionAttachments.length === 0)}
                  className="mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00a884] text-white hover:bg-[#008f72] disabled:bg-[#00a884]/40"
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
