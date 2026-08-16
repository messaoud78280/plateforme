"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { DeleteTaskButton } from "@/components/tasks/DeleteTaskButton";
import { documentDownloadHref } from "@/lib/documents/download-url";
import { badgeIcon } from "@/lib/messagerie/message-links";
import { WA_CHAT_BG, waBubbleTime, waListTime } from "@/components/messagerie/wa-theme";
import { getMessagerieUnread, subscribeMessagerieEvents } from "@/lib/perf/messagerie-unread-bus";
import {
  buildMessagerieChantierUrl,
  buildMessagerieMissionsUrl,
} from "@/lib/messagerie/messaging-url";
import { compressImageForMessagerie } from "@/lib/messagerie/compress-image";
import {
  formatMediaPreview,
  isAudioAttachment,
  isImageAttachment,
  type MsgAttachment,
} from "@/lib/messagerie/media-preview";
import {
  MESSAGERIE_DOC_ACCEPT,
  MESSAGERIE_PHOTO_ACCEPT,
  MessagerieAttachMenu,
  pickMessagerieDocFiles,
  pickMessageriePhotoFiles,
} from "@/components/messagerie/MessagerieAttachMenu";
import {
  MessagerieComposerAttachments,
  useAttachmentPreviewUrls,
} from "@/components/messagerie/MessagerieComposerAttachments";
import { MessagerieAttachmentsBlock } from "@/components/messagerie/MessagerieSecureMedia";
import { MESSAGERIE_MEDIA_MAX_BYTES } from "@/lib/messagerie/media-storage";
import {
  formatPartyBadge,
  internalProfileLabel,
  messagingPartyToneClass,
  resolveMessagingPartyType,
  type MessagingPartyType,
} from "@/lib/messagerie/party-type";
import {
  getReplyFromPayload,
  makeReplyExcerpt,
  type MessageReplyMeta,
} from "@/lib/messagerie/message-reply";
import { getReactionsFromPayload } from "@/lib/messagerie/message-reactions";
import {
  isMessageImportant,
  isMessagePinnedPersonal,
  setMessagesImportant,
  toggleMessageImportant,
  toggleMessagePinnedPersonal,
} from "@/lib/messagerie/message-personal-flags";
import { scopeFromPartyExternal, scopeFromTaskInternal } from "@/lib/messagerie/forward-safety";
import { MessageExpandableBody } from "@/components/messagerie/MessageExpandableBody";
import {
  MessageReplyComposerBanner,
  MessageReplyQuote,
} from "@/components/messagerie/MessageReplyQuote";
import { MessageBubbleChrome } from "@/components/messagerie/MessageBubbleChrome";
import { MessageInfosPanel } from "@/components/messagerie/MessageInfosPanel";
import type { InboxProjectChannelItem } from "@/lib/messagerie/project-channels";
import { shouldHideTaskAgainstProjectChannels } from "@/lib/tasks/legacy-purchase-order";
import {
  MessageForwardDialog,
  type ForwardDestOption,
} from "@/components/messagerie/MessageForwardDialog";
import { MessageSelectionBar } from "@/components/messagerie/MessageSelectionBar";
import { MessageDeleteDialog } from "@/components/messagerie/MessageDeleteDialog";
import type { MessageMenuActionId } from "@/components/messagerie/MessageContextMenu";
import {
  deletedMessageLabel,
  maybeRedactReplyExcerpt,
  type MessageDeleteMode,
} from "@/lib/messagerie/message-delete";
import {
  messagerieReturnTo,
  withReturnTo,
} from "@/lib/navigation/safe-return-to";
import { ContextBackButton } from "@/components/ui/ContextBackButton";
import { DEMO_PERSONAS } from "@/lib/demo-environment/personas";

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
  payloadJson?: unknown;
  deletedAt?: string | null;
  deletedById?: string | null;
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
  projectName?: string | null;
  client: { id: string; name: string; personType?: string | null };
  assignedTo: { id: string; name: string } | null;
  lastMessage: {
    id: string;
    content: string;
    createdAt: string;
    isInternal?: boolean;
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
  // V2C.7 — périmètre = qui peut lire, pas le sujet de la tâche.
  // Un fil TaskMessage interne (staff ↔ staff) reste INTERNE même si le sujet
  // concerne un fournisseur / client (ex. « Relancer Point.P »).
  if (m.lastMessage?.isInternal) {
    return resolveMessagingPartyType({ personType: "INTERNAL" });
  }
  return resolveMessagingPartyType({
    personType: m.client.personType ?? null,
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
  payloadJson?: unknown;
  deletedAt?: string | null;
  deletedById?: string | null;
  createdAt: string;
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
  /** Optimistic / échec envoi */
  kind?: "pending" | "failed" | string;
  /** Texte saisi (hors preview média) pour Réessayer */
  originalContent?: string;
};

type AttachmentItem = MsgAttachment;

/** Conserve les messages temp/failed pendant un refetch serveur (évite disparition après envoi). */
function mergeServerMessagesWithPending<
  T extends {
    id: string;
    content?: string;
    createdAt: string;
    senderId?: string;
    sender?: { id: string };
    kind?: string;
  },
>(server: T[], prev: T[], sessionUserId: string): T[] {
  const pending = prev.filter(
    (m) =>
      String(m.id).startsWith("temp-") ||
      m.kind === "pending" ||
      m.kind === "failed",
  );
  if (pending.length === 0) return server;

  const serverIds = new Set(server.map((m) => m.id));
  const kept: T[] = [];
  for (const p of pending) {
    if (serverIds.has(p.id)) continue;
    if (p.kind === "failed") {
      kept.push(p);
      continue;
    }
    const matched = server.some((s) => {
      const sid = s.senderId ?? s.sender?.id;
      return (
        sid === sessionUserId &&
        (s.content ?? "") === (p.content ?? "") &&
        Math.abs(new Date(s.createdAt).getTime() - new Date(p.createdAt).getTime()) < 120_000
      );
    });
    if (!matched) kept.push(p);
  }
  const merged = [...server, ...kept];
  merged.sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    if (ta !== tb) return ta - tb;
    return String(a.id).localeCompare(String(b.id));
  });
  return merged;
}

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
              {" · Tâche"}
              {m.projectName ? ` · ${m.projectName}` : null}
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
              <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-[#667781] bg-[#f0f2f5]">
                Tâche
              </span>
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

function DirectRow({
  conv,
  selected,
  sessionUserId,
  recipient,
  onSelect,
  formatRelativeTime: fmt,
}: {
  conv: {
    user: { id: string; name: string };
    lastMessage: DirectMessageItem | null;
    unread: number;
  };
  selected: boolean;
  sessionUserId: string;
  recipient?: RecipientItem;
  onSelect: () => void;
  formatRelativeTime: (d: string) => string;
}) {
  const unread = conv.unread > 0;
  const party = recipient
    ? partyForRecipient(recipient)
    : resolveMessagingPartyType({ personType: "INTERNAL" });
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex min-h-[52px] w-full gap-3 px-3 py-2.5 text-left transition ${
          selected ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"
        }`}
      >
        <div className="relative">
          <Avatar name={conv.user.name} size="sm" />
          {unread ? (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#00a884] ring-2 ring-white" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 border-b border-[#f0f2f5] pb-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={`truncate text-[16px] ${
                unread ? "font-bold text-[#111b21]" : "font-semibold text-[#111b21]"
              }`}
            >
              {conv.user.name}
            </p>
            <span
              className={`shrink-0 text-[12px] ${
                unread ? "font-semibold text-[#00a884]" : "text-[#667781]"
              }`}
            >
              {conv.lastMessage ? fmt(conv.lastMessage.createdAt) : ""}
            </span>
          </div>
          <p className={`mt-0.5 truncate text-[12px] font-semibold ${messagingPartyToneClass(party.partyType)}`}>
            {formatPartyBadge(party)}
            {party.partyType === "INTERNAL"
              ? null
              : recipient?.company
                ? ` · ${recipient.company}`
                : null}
          </p>
          {conv.lastMessage ? (
            <p
              className={`mt-0.5 truncate text-[13px] ${
                unread ? "font-semibold text-[#111b21]" : "text-[#667781]"
              }`}
            >
              {conv.lastMessage.sender.id === sessionUserId
                ? "Vous : "
                : `${conv.lastMessage.sender.name.split(/\s+/)[0] ?? ""} : `}
              {formatMediaPreview(conv.lastMessage.content, null)}
            </p>
          ) : null}
          {unread ? (
            <span className="mt-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#00a884] px-1.5 text-[10px] font-bold text-white">
              {conv.unread}
            </span>
          ) : null}
        </div>
      </button>
    </li>
  );
}

function partyTypeFromChannelType(type: string): MessagingPartyType {
  switch (type) {
    case "INTERNAL":
      return "INTERNAL";
    case "CLIENT":
      return "CLIENT";
    case "SUPPLIER":
      return "SUPPLIER";
    case "SUBCONTRACTOR":
      return "SUBCONTRACTOR";
    default:
      return "PARTNER";
  }
}

function ChannelRow({
  ch,
  selected,
  onSelect,
  formatRelativeTime: fmt,
}: {
  ch: InboxProjectChannelItem;
  selected: boolean;
  onSelect: () => void;
  formatRelativeTime: (d: string) => string;
}) {
  const unread = ch.unreadCount > 0;
  const party = partyTypeFromChannelType(ch.type);
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={`flex min-h-[52px] w-full gap-3 px-3 py-2.5 text-left transition ${
          selected ? "bg-[#f0f2f5]" : "hover:bg-[#f5f6f6]"
        }`}
      >
        <div className="relative">
          <Avatar name={ch.title} size="sm" />
          {unread ? (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#00a884] ring-2 ring-white" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1 border-b border-[#f0f2f5] pb-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={`truncate text-[16px] ${
                unread ? "font-bold text-[#111b21]" : "font-semibold text-[#111b21]"
              }`}
            >
              {ch.listTitle}
            </p>
            <span
              className={`shrink-0 text-[12px] ${
                unread ? "font-semibold text-[#00a884]" : "text-[#667781]"
              }`}
            >
              {ch.lastMessageAt ? fmt(ch.lastMessageAt) : ""}
            </span>
          </div>
          <p className={`mt-0.5 truncate text-[12px] font-semibold ${messagingPartyToneClass(party)}`}>
            {ch.type === "INTERNAL" ? `🔒 ${ch.metaLabel}` : ch.metaLabel}
          </p>
          {ch.lastMessage ? (
            <p
              className={`mt-0.5 truncate text-[13px] ${
                unread ? "font-semibold text-[#111b21]" : "text-[#667781]"
              }`}
            >
              {`${ch.lastMessage.senderName.split(/\s+/)[0] ?? ""} : `}
              {formatMediaPreview(ch.lastMessage.content, null)}
            </p>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium text-[#667781] bg-[#f0f2f5]">
              Chantier
            </span>
            {unread ? (
              <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#00a884] px-1.5 text-[10px] font-bold text-white">
                {ch.unreadCount}
              </span>
            ) : null}
          </div>
        </div>
      </button>
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
  const searchParams = useSearchParams();
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [projectChannels, setProjectChannels] = useState<InboxProjectChannelItem[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>("");
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
  const mobileShowThreadRef = useRef(mobileShowThread);
  mobileShowThreadRef.current = mobileShowThread;
  const stickToBottomRef = useRef(true);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const selectedTaskIdRef = useRef(selectedTaskId);
  selectedTaskIdRef.current = selectedTaskId;
  const syncingUrlRef = useRef(false);
  const [sendContent, setSendContent] = useState("");
  const [sending, setSending] = useState(false);
  const [internalNote, setInternalNote] = useState(false);
  const [directRecipientId, setDirectRecipientId] = useState("");
  const [directContent, setDirectContent] = useState("");
  const [sendingDirect, setSendingDirect] = useState(false);
  const [directAttemptedSend, setDirectAttemptedSend] = useState(false);
  const [directSendError, setDirectSendError] = useState<string | null>(null);
  const [directMessages, setDirectMessages] = useState<DirectMessageItem[]>([]);
  const [directThreadMessages, setDirectThreadMessages] = useState<DirectMessageItem[]>([]);
  const [loadingDirectMessages, setLoadingDirectMessages] = useState(false);
  const [loadingDirectThread, setLoadingDirectThread] = useState(false);
  const [selectedDirectContactId, setSelectedDirectContactId] = useState<string>("");
  const selectedDirectContactIdRef = useRef(selectedDirectContactId);
  selectedDirectContactIdRef.current = selectedDirectContactId;
  const [replyDirectContent, setReplyDirectContent] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [directAttachments, setDirectAttachments] = useState<AttachmentItem[]>([]);
  const [replyAttachments, setReplyAttachments] = useState<AttachmentItem[]>([]);
  const [missionAttachments, setMissionAttachments] = useState<AttachmentItem[]>([]);
  const [uploadingAttach, setUploadingAttach] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [listSearch, setListSearch] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  /** Après sélection : replier la liste au profit de la fiche destinataire. */
  const [recipientPickerOpen, setRecipientPickerOpen] = useState(true);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [pendingNewCount, setPendingNewCount] = useState(0);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const { previewUrls, rememberPreview, forgetPreview, clearPreviews } =
    useAttachmentPreviewUrls();
  const sendLockRef = useRef(false);
  const directFileId = "direct-file-input";
  const missionFileId = "mission-file-input";
  const missionPhotoId = "mission-photo-input";
  const replyPhotoId = "reply-photo-input";
  const replyDocId = "reply-doc-input";
  const [directAttachMenuOpen, setDirectAttachMenuOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const highlightMessageId = useRef<string | null>(null);
  const [replyTarget, setReplyTarget] = useState<MessageReplyMeta | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMsgIds, setSelectedMsgIds] = useState<Set<string>>(new Set());
  const [personalTick, setPersonalTick] = useState(0);
  const [copiedHint, setCopiedHint] = useState(false);
  const [infosOpen, setInfosOpen] = useState(false);
  const [infosData, setInfosData] = useState<{
    senderName: string;
    conversationLabel: string;
    partyLabel: string;
    sentAt: string;
    attachmentSummary?: string;
    replyToLabel?: string | null;
  } | null>(null);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardSource, setForwardSource] = useState<{
    kind: "DIRECT" | "TASK";
    id: string;
    scope: "INTERNAL" | "EXTERNAL";
  } | null>(null);
  const [threadMsgFilter, setThreadMsgFilter] = useState<"all" | "important" | "pinned">("all");
  const [flashMsgId, setFlashMsgId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    kind: "DIRECT" | "TASK";
    ids: string[];
    isMine: boolean;
    forceMeOnly: boolean;
  } | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setPinnedIds(loadPins());
  }, []);

  useEffect(() => {
    setReplyTarget(null);
    setSelectionMode(false);
    setSelectedMsgIds(new Set());
    setThreadMsgFilter("all");
  }, [selectedTaskId, selectedDirectContactId]);

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
    // Ne pas vider le fil déjà affiché (évite flash « Chargement… » + message visible).
    setLoadingDirectThread(true);
    try {
      const res = await fetch(`/api/messages/direct?with=${encodeURIComponent(contactId)}`);
      if (res.ok) {
        const data = await res.json();
        const server = Array.isArray(data) ? (data as DirectMessageItem[]) : [];
        setDirectThreadMessages((prev) =>
          mergeServerMessagesWithPending(server, prev, sessionUserId),
        );
      }
    } finally {
      setLoadingDirectThread(false);
    }
  }

  /** URL = source de vérité conversation (mobile + partage de lien). */
  function replaceMessagerieQuery(next: { task?: string | null; with?: string | null }) {
    syncingUrlRef.current = true;
    router.replace(
      buildMessagerieMissionsUrl({
        task: next.task ?? null,
        with: next.with ?? null,
      }),
      { scroll: false },
    );
    window.setTimeout(() => {
      syncingUrlRef.current = false;
    }, 0);
  }

  function closeMobileThread() {
    setMobileShowThread(false);
    setSelectedTaskId("");
    setSelectedDirectContactId("");
    setSelectedChannelId("");
    replaceMessagerieQuery({});
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("bework:messagerie-thread-close"));
    }
  }

  function openMissionDiscussion(missionId: string) {
    setSelectedDirectContactId("");
    setSelectedChannelId("");
    setSelectedTaskId(missionId);
    setMobileShowThread(true);
    replaceMessagerieQuery({ task: missionId });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("bework:messagerie-thread-open"));
    }
  }

  const selectedDirectContact = recipients.find((r) => r.id === selectedDirectContactId) ?? directConversations.find((c) => c.user.id === selectedDirectContactId)?.user;

  useEffect(() => {
    if (filter === "envoyer") {
      setLoading(false);
      return;
    }
    async function load() {
      try {
        const missionFilter = filter === "messages-directs" ? "inbox" : filter;
        const [missionsRes, directsData, channelsRes] = await Promise.all([
          fetch(`/api/tasks/messagerie?filter=${missionFilter}`),
          refreshDirectIndex().catch(() => [] as DirectMessageItem[]),
          fetch("/api/messages/channels/inbox").catch(() => null),
        ]);
        if (missionsRes.ok) {
          const data = await missionsRes.json();
          const list = Array.isArray(data) ? (data as MissionItem[]) : [];
          setMissions(sortMissionsByLastMessage(list));
          // Mobile : jamais d’auto-sélection — liste seule tant que l’utilisateur / deep-link n’ouvre pas.
        }
        if (Array.isArray(directsData)) setDirectMessages(directsData);
        if (channelsRes && channelsRes.ok) {
          const data = await channelsRes.json();
          const list = Array.isArray(data?.channels) ? (data.channels as InboxProjectChannelItem[]) : [];
          setProjectChannels(list);
        }
      } finally {
        setLoading(false);
        setLoadingDirectMessages(false);
      }
    }
    setLoadingDirectMessages(true);
    void load();
  }, [filter]);

  // Realtime : remonter la conversation + rafraîchir le fil ouvert (TASK + DIRECT)
  useEffect(() => {
    return subscribeMessagerieEvents((ev) => {
      if (ev.op === "deleted_everyone" && ev.messageId) {
        const patch = (m: TaskMessageItem | DirectMessageItem) =>
          m.id === ev.messageId
            ? {
                ...m,
                content: "",
                attachmentsJson: null,
                deletedAt: ev.at,
                deletedById: ev.senderId,
              }
            : m;
        if (ev.kind === "TASK") {
          setMessages((prev) => prev.map(patch as (m: TaskMessageItem) => TaskMessageItem));
        }
        if (ev.kind === "DIRECT") {
          setDirectThreadMessages((prev) =>
            prev.map(patch as (m: DirectMessageItem) => DirectMessageItem),
          );
          setDirectMessages((prev) =>
            prev.map(patch as (m: DirectMessageItem) => DirectMessageItem),
          );
        }
        return;
      }
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
          selectedDirectContactId &&
          (selectedDirectContactId === otherId ||
            selectedDirectContactId === ev.senderId ||
            selectedDirectContactId === ev.receiverId)
        ) {
          void refreshDirectThread(selectedDirectContactId);
        }
      }
      if (ev.kind === "PROJECT") {
        // conversationKey = PROJECT:{projectId}:{channelId}
        const parts = ev.conversationKey.split(":");
        const channelId = parts[2] ?? "";
        const projectId = parts[1] ?? "";
        if (!channelId) {
          void fetch("/api/messages/channels/inbox")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (Array.isArray(data?.channels)) setProjectChannels(data.channels);
            });
          return;
        }
        setProjectChannels((prev) => {
          const idx = prev.findIndex((c) => c.id === channelId);
          if (idx < 0) {
            void fetch("/api/messages/channels/inbox")
              .then((r) => (r.ok ? r.json() : null))
              .then((data) => {
                if (Array.isArray(data?.channels)) setProjectChannels(data.channels);
              });
            return prev;
          }
          const item = prev[idx]!;
          const next = [...prev];
          next.splice(idx, 1);
          next.unshift({
            ...item,
            unreadCount:
              selectedChannelId === channelId ? item.unreadCount : item.unreadCount + 1,
            lastMessageAt: ev.at,
            lastMessage: {
              content: ev.preview,
              createdAt: ev.at,
              senderName: ev.senderName,
            },
          });
          return next;
        });
        void projectId;
      }
    });
  }, [selectedTaskId, selectedDirectContactId, selectedChannelId, filter, sessionUserId]);

  useEffect(() => {
    if (!selectedTaskId) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    setHasMoreMessages(false);
    setLoadingMessages(true);
    stickToBottomRef.current = true;
    setPendingNewCount(0);
    // Ne PAS forcer mobileShowThread ici — uniquement clic / deep-link URL.

    // Optimistic WhatsApp : badge vert disparaît dès l’ouverture
    setMissions((prev) =>
      prev.map((m) => (m.id === selectedTaskId ? { ...m, unreadCount: 0 } : m)),
    );

    const taskId = selectedTaskId;
    setMessages([]);

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
        setMessages((prev) =>
          mergeServerMessagesWithPending(payload.messages, prev, sessionUserId),
        );
        setHasMoreMessages(payload.hasMore);
        void getMessagerieUnread(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingMessages(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTaskId, sessionUserId]);

  useEffect(() => {
    if (filter === "envoyer" || !selectedDirectContactId) {
      if (!selectedDirectContactId) setDirectThreadMessages([]);
      return;
    }
    setDirectThreadMessages([]);
    void refreshDirectThread(selectedDirectContactId);
  }, [filter, selectedDirectContactId]);

  // Marquer comme lus les messages directs du contact sélectionné
  useEffect(() => {
    if (filter === "envoyer" || !selectedDirectContactId) return;
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
          setDirectMessages((prev) =>
            prev.map((m) =>
              (m.receiverId ?? m.receiver.id) === sessionUserId &&
              (m.senderId ?? m.sender.id) === contactId
                ? { ...m, read: true }
                : m,
            ),
          );
        }
        void getMessagerieUnread(true);
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

  // Deep-link / sync URL → state (source de vérité = conversationId dans l’URL)
  useEffect(() => {
    if (syncingUrlRef.current) return;
    const task = searchParams.get("task");
    const withUser = searchParams.get("with");
    const messageId = searchParams.get("messageId");
    const tab = searchParams.get("tab");

    if (messageId) highlightMessageId.current = messageId;

    if (task) {
      setFilter("inbox");
      setSelectedDirectContactId("");
      setSelectedChannelId("");
      if (selectedTaskIdRef.current !== task) setSelectedTaskId(task);
      setMobileShowThread(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bework:messagerie-thread-open"));
      }
      return;
    }

    if (withUser) {
      setFilter("inbox");
      setSelectedTaskId("");
      setSelectedChannelId("");
      if (selectedDirectContactIdRef.current !== withUser) {
        setSelectedDirectContactId(withUser);
      }
      setMobileShowThread(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bework:messagerie-thread-open"));
      }
      return;
    }

    // Ancien deep-link générique (notif legacy) — liste, jamais conserver un task stale
    if (tab === "messages-directs") {
      setFilter("inbox");
      setSelectedTaskId("");
      setSelectedChannelId("");
      setSelectedDirectContactId("");
      setMobileShowThread(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bework:messagerie-thread-close"));
      }
      return;
    }

    // Pas de conversation dans l’URL → liste (surtout mobile / clic Messages)
    if (
      selectedTaskIdRef.current ||
      selectedDirectContactIdRef.current ||
      mobileShowThreadRef.current
    ) {
      setSelectedTaskId("");
      setSelectedDirectContactId("");
      setSelectedChannelId("");
      setMobileShowThread(false);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("bework:messagerie-thread-close"));
      }
    }

    if (messageId && !task) {
      void fetch(`/api/messages/locate?kind=TASK&id=${encodeURIComponent(messageId)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (d?.taskId) {
            setSelectedTaskId(d.taskId);
            setSelectedDirectContactId("");
            setMobileShowThread(true);
            replaceMessagerieQuery({ task: d.taskId });
          }
        })
        .catch(() => {});
    }
  }, [searchParams]);

  // Clic « Messages » bottom nav / demande explicite de revenir à la liste
  useEffect(() => {
    const onShowList = () => {
      setMobileShowThread(false);
      setSelectedTaskId("");
      setSelectedDirectContactId("");
      setSelectedChannelId("");
      replaceMessagerieQuery({});
    };
    window.addEventListener("bework:messagerie-show-list", onShowList);
    return () => window.removeEventListener("bework:messagerie-show-list", onShowList);
  }, []);

  useEffect(() => {
    const mid = highlightMessageId.current;
    if (!mid) return;
    let clearTimer: number | undefined;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = window.setTimeout(() => {
      const el = document.getElementById(`msg-${mid}`);
      if (!el) {
        // Message hors page chargée / inaccessible — pas de surbrillance arbitraire
        highlightMessageId.current = null;
        return;
      }
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
      setFlashMsgId(mid);
      highlightMessageId.current = null;
      clearTimer = window.setTimeout(() => setFlashMsgId(null), reduceMotion ? 1600 : 2200);
    }, 350);
    return () => {
      window.clearTimeout(t);
      if (clearTimer) window.clearTimeout(clearTimer);
    };
  }, [messages, directThreadMessages, selectedTaskId, selectedDirectContactId]);

  // Rafraîchissement secours (realtime = source principale). Pause onglet caché.
  useEffect(() => {
    if (filter === "envoyer" || !selectedDirectContactId) return;
    const tick = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      void refreshDirectIndex().then((data) => setDirectMessages(data));
      void refreshDirectThread(selectedDirectContactId);
    };
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [filter, selectedDirectContactId]);

  // Poll incrémental mission (nouveaux messages seulement) + remonter conversation
  useEffect(() => {
    if (!selectedTaskId || filter === "envoyer") return;
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      const lastReal = [...messagesRef.current]
        .reverse()
        .find((m) => !String(m.id).startsWith("temp-"));
      const q = lastReal?.id
        ? `?after=${encodeURIComponent(lastReal.id)}&take=30`
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
    }, 30_000);
    return () => clearInterval(interval);
  }, [selectedTaskId, filter, sessionUserId]);

  // Poll liste conversations (ordre lastMessage) sans refresh page
  useEffect(() => {
    if (filter === "envoyer" || filter === "messages-directs") return;
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetch(`/api/tasks/messagerie?filter=${filter}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!Array.isArray(data)) return;
          setMissions(sortMissionsByLastMessage(data as MissionItem[]));
        })
        .catch(() => {});
    }, 45_000);
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
    const replySnapshot = replyTarget;
    const optimistic: TaskMessageItem = {
      id: tempId,
      content: previewContent,
      read: false,
      isInternal: Boolean(internalNote && (isAgence || isAgent)),
      attachmentsJson: attachments.length > 0 ? attachments : null,
      payloadJson: replySnapshot ? { replyTo: replySnapshot } : undefined,
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
    clearPreviews();
    setReplyTarget(null);
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
        replyTo?: MessageReplyMeta;
      } = {
        content,
        isInternal: internalNote && (isAgence || isAgent),
        attachments,
        clientMessageId,
        ...(replySnapshot ? { replyTo: replySnapshot } : {}),
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
          alert("Impossible d’envoyer ce fichier.");
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
            const att: AttachmentItem = {
              name: data.name ?? file.name,
              fileUrl: data.fileUrl,
              fileSize: data.fileSize ?? file.size,
              mimeType: data.mimeType ?? file.type,
              kind: data.kind,
              durationSec: data.durationSec ?? opts?.durationSec,
              bucket: data.bucket,
              storagePath: data.storagePath,
            };
            rememberPreview(att.fileUrl, raw);
            rememberPreview(att.name, raw);
            uploaded.push(att);
          } else {
            alert("Impossible d’envoyer ce fichier.");
          }
        } catch {
          alert("Impossible d’envoyer ce fichier.");
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

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    setAttachments: React.Dispatch<React.SetStateAction<AttachmentItem[]>>,
  ) {
    const input = e.target;
    const files = pickMessagerieDocFiles(input.files);
    input.value = "";
    if (!files.length) {
      if (e.target.files?.length) alert("Impossible d’envoyer ce fichier.");
      return;
    }
    await uploadFiles(files, setAttachments);
  }

  async function handleReplyDirect(e: React.FormEvent) {
    e.preventDefault();
    await sendDirectReply(replyDirectContent.trim(), replyAttachments);
  }

  async function sendDirectReply(
    content: string,
    attachments: AttachmentItem[],
    opts?: { retryTempId?: string },
  ) {
    const hasContent = content.length > 0;
    const hasAttachments = attachments.length > 0;
    if ((!hasContent && !hasAttachments) || !selectedDirectContactId || sendingReply) return;
    if (sendLockRef.current) return;
    sendLockRef.current = true;

    const replySnapshot = replyTarget;
    const tempId = opts?.retryTempId ?? `temp-d-${Date.now()}`;
    const preview =
      formatMediaPreview(content, attachments) || content || "Pièce jointe";
    const optimistic: DirectMessageItem = {
      id: tempId,
      content: preview,
      read: false,
      senderId: sessionUserId,
      receiverId: selectedDirectContactId,
      attachmentsJson: hasAttachments ? attachments : null,
      payloadJson: replySnapshot ? { replyTo: replySnapshot } : undefined,
      createdAt: new Date().toISOString(),
      sender: { id: sessionUserId, name: "Vous" },
      receiver: {
        id: selectedDirectContactId,
        name: selectedDirectContact?.name ?? "",
      },
      kind: "pending",
      originalContent: content,
    };

    setSendingReply(true);
    setDirectSendError(null);
    if (!opts?.retryTempId) {
      setReplyDirectContent("");
      setReplyAttachments([]);
      clearPreviews();
      setReplyTarget(null);
      setDirectThreadMessages((prev) => [...prev, optimistic]);
      setDirectMessages((prev) => [optimistic, ...prev]);
    } else {
      setDirectThreadMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...optimistic, createdAt: m.createdAt } : m)),
      );
      setDirectMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...optimistic, createdAt: m.createdAt } : m)),
      );
    }
    stickToBottomRef.current = true;

    try {
      const res = await fetch("/api/messages/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content || "",
          receiverId: selectedDirectContactId,
          attachments: hasAttachments ? attachments : undefined,
          ...(replySnapshot ? { replyTo: replySnapshot } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.id) {
        setDirectThreadMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempId && m.id !== data.id);
          return [...withoutTemp, data as DirectMessageItem].sort((a, b) => {
            const ta = new Date(a.createdAt).getTime();
            const tb = new Date(b.createdAt).getTime();
            if (ta !== tb) return ta - tb;
            return String(a.id).localeCompare(String(b.id));
          });
        });
        setDirectMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempId && m.id !== data.id);
          return [data as DirectMessageItem, ...withoutTemp];
        });
      } else {
        setDirectThreadMessages((prev) =>
          prev.map((m) =>
            m.id === tempId
              ? {
                  ...m,
                  kind: "failed",
                  originalContent: content,
                  attachmentsJson: hasAttachments ? attachments : null,
                }
              : m,
          ),
        );
        setDirectSendError(data?.error ?? "Échec de l’envoi — réessayez");
      }
    } catch {
      setDirectThreadMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                ...m,
                kind: "failed",
                originalContent: content,
                attachmentsJson: hasAttachments ? attachments : null,
              }
            : m,
        ),
      );
      setDirectSendError("Erreur réseau — réessayez");
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

    setDirectAttemptedSend(true);
    setDirectSendError(null);
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
        setDirectSendError(null);
        openDirectDiscussion(recipientId);
        const list = await refreshDirectIndex();
        setDirectMessages(list);
      } else {
        const err = await res.json().catch(() => ({}));
        setDirectSendError(
          typeof err?.error === "string" && err.error.trim()
            ? err.error
            : "Impossible d’envoyer ce message. Ce destinataire n’est plus disponible.",
        );
      }
    } catch {
      setDirectSendError("Erreur réseau — réessayez.");
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

  function jumpToMessage(messageId: string) {
    highlightMessageId.current = messageId;
    setFlashMsgId(messageId);
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
      window.setTimeout(() => setFlashMsgId(null), reduceMotion ? 1600 : 2200);
      return;
    }
    // Message plus ancien : charger une page supplémentaire si possible
    if (selectedTaskId) {
      const oldest = messages[0]?.createdAt;
      if (oldest) {
        void fetch(
          `/api/tasks/${selectedTaskId}/messages?take=50&before=${encodeURIComponent(oldest)}`,
        )
          .then((r) => (r.ok ? r.json() : []))
          .then((data) => {
            if (!Array.isArray(data) || !data.length) return;
            setMessages((prev) => {
              const seen = new Set(prev.map((x) => x.id));
              const older = (data as TaskMessageItem[]).filter((x) => !seen.has(x.id));
              return older.length ? [...older, ...prev] : prev;
            });
            window.setTimeout(() => {
              document.getElementById(`msg-${messageId}`)?.scrollIntoView({
                behavior: reduceMotion ? "auto" : "smooth",
                block: "center",
              });
              setFlashMsgId(messageId);
              window.setTimeout(() => setFlashMsgId(null), reduceMotion ? 1600 : 2200);
            }, 200);
          });
      }
    }
  }

  async function reactToMessage(
    kind: "DIRECT" | "TASK",
    messageId: string,
    emoji: string | null,
  ) {
    const applyLocal = (payload: unknown) => {
      const reactions = getReactionsFromPayload(payload);
      if (kind === "TASK") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  payloadJson: { ...(m.payloadJson as object), reactions },
                }
              : m,
          ),
        );
      } else {
        setDirectThreadMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  payloadJson: { ...(m.payloadJson as object), reactions },
                }
              : m,
          ),
        );
      }
    };

    const list = kind === "TASK" ? messages : directThreadMessages;
    const current = list.find((m) => m.id === messageId);
    const prevMap = getReactionsFromPayload(current?.payloadJson);
    const optimistic = { ...prevMap };
    if (!emoji) delete optimistic[sessionUserId];
    else optimistic[sessionUserId] = emoji;
    applyLocal({ reactions: optimistic });

    try {
      const res = await fetch("/api/messages/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageKind: kind, messageId, emoji }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        applyLocal({ reactions: prevMap });
        return;
      }
      applyLocal({ reactions: data.reactions ?? optimistic });
    } catch {
      applyLocal({ reactions: prevMap });
    }
  }

  function copyMessageText(text: string) {
    if (!text.trim()) return;
    void navigator.clipboard?.writeText(text).then(() => {
      setCopiedHint(true);
      window.setTimeout(() => setCopiedHint(false), 1500);
    });
  }

  function handleMessageMenuAction(
    kind: "DIRECT" | "TASK",
    m: TaskMessageItem | DirectMessageItem,
    action: MessageMenuActionId,
    ctx: {
      conversationLabel: string;
      partyLabel: string;
      isInternalScope: boolean;
    },
  ) {
    const content = m.content || "";
    const atts = Array.isArray(m.attachmentsJson) ? m.attachmentsJson : [];
    if (action === "reply") {
      setReplyTarget({
        id: m.id,
        senderName: m.sender.name,
        excerpt: makeReplyExcerpt(content || (atts[0]?.name ?? "Pièce jointe")),
      });
      return;
    }
    if (action === "important") {
      toggleMessageImportant(kind, m.id);
      setPersonalTick((t) => t + 1);
      return;
    }
    if (action === "pin") {
      toggleMessagePinnedPersonal(kind, m.id);
      setPersonalTick((t) => t + 1);
      return;
    }
    if (action === "copy") {
      copyMessageText(content);
      return;
    }
    if (action === "select") {
      setSelectionMode(true);
      setSelectedMsgIds(new Set([m.id]));
      return;
    }
    if (action === "forward") {
      setForwardSource({
        kind,
        id: m.id,
        scope: ctx.isInternalScope ? "INTERNAL" : "EXTERNAL",
      });
      setForwardOpen(true);
      return;
    }
    if (action === "infos") {
      const soft = Boolean(m.deletedAt);
      const reply = soft
        ? null
        : getReplyFromPayload("payloadJson" in m ? m.payloadJson : null);
      setInfosData({
        senderName: m.sender.name,
        conversationLabel: ctx.conversationLabel,
        partyLabel: ctx.partyLabel,
        sentAt: new Date(m.createdAt).toLocaleString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        attachmentSummary: soft
          ? "Message supprimé"
          : atts.length
            ? `${atts.length} pièce${atts.length > 1 ? "s" : ""} jointe${atts.length > 1 ? "s" : ""}`
            : undefined,
        replyToLabel: reply
          ? `${reply.senderName} — ${reply.excerpt}`
          : soft
            ? deletedMessageLabel(m, sessionUserId)
            : null,
      });
      setInfosOpen(true);
      return;
    }
    if (action === "bework") {
      // Ouverture via MessageBeworkActions déjà sous la bulle — focus discret
      document
        .querySelector(`[data-bework-for="${m.id}"] button`)
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return;
    }
    if (action === "delete") {
      if (m.deletedAt) return;
      const isMine = m.sender.id === sessionUserId;
      setDeleteError(null);
      setDeleteDialog({
        kind,
        ids: [m.id],
        isMine,
        forceMeOnly: false,
      });
    }
  }

  async function confirmDelete(mode: MessageDeleteMode) {
    if (!deleteDialog) return;
    setDeletePending(true);
    setDeleteError(null);
    const { kind, ids } = deleteDialog;
    const snapshotDirect = [...selectedDirectThread];
    const snapshotTask = [...messages];

    // Optimistic UI
    if (mode === "me") {
      if (kind === "DIRECT") {
        setDirectThreadMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
        setDirectMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
      } else {
        setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
      }
    } else {
      const soft = (m: TaskMessageItem | DirectMessageItem) =>
        ids.includes(m.id)
          ? {
              ...m,
              content: "",
              attachmentsJson: null,
              deletedAt: new Date().toISOString(),
              deletedById: sessionUserId,
            }
          : m;
      if (kind === "DIRECT") {
        setDirectThreadMessages((prev) =>
          prev.map(soft as (m: DirectMessageItem) => DirectMessageItem),
        );
      } else {
        setMessages((prev) => prev.map(soft as (m: TaskMessageItem) => TaskMessageItem));
      }
    }

    try {
      const res = await fetch("/api/messages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageKind: kind,
          messageIds: ids,
          mode,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Suppression impossible");
      }
      setDeleteDialog(null);
      setSelectionMode(false);
      setSelectedMsgIds(new Set());
    } catch (e) {
      // Restaurer
      if (kind === "DIRECT") setDirectThreadMessages(snapshotDirect);
      else setMessages(snapshotTask);
      setDeleteError(e instanceof Error ? e.message : "Erreur de suppression");
    } finally {
      setDeletePending(false);
    }
  }

  const forwardDestinations: ForwardDestOption[] = (() => {
    const dests: ForwardDestOption[] = [];
    for (const c of directConversations) {
      dests.push({
        id: c.user.id,
        kind: "DIRECT",
        label: c.user.name,
        sublabel: "🔒 Interne",
        scope: "INTERNAL",
      });
    }
    for (const mission of missions.slice(0, 40)) {
      const party = partyForMission(mission);
      dests.push({
        id: mission.id,
        kind: "TASK",
        label: mission.title,
        sublabel: formatPartyBadge(party),
        scope: scopeFromPartyExternal(party.external),
      });
    }
    return dests;
  })();

  void personalTick;

  const visibleMessages = messages
    .filter((m) => !m.isInternal || isAgence || isAgent)
    .filter((m) => {
      if (threadMsgFilter === "important") return isMessageImportant("TASK", m.id);
      if (threadMsgFilter === "pinned") return isMessagePinnedPersonal("TASK", m.id);
      return true;
    });

  const filteredMissions = (() => {
    let list = missions.filter(
      (m) =>
        !shouldHideTaskAgainstProjectChannels(
          {
            id: m.id,
            title: m.title,
            category: m.category,
            projectId: m.projectId,
          },
          projectChannels.map((c) => ({
            projectId: c.projectId,
            type: c.type,
            title: c.title,
          })),
        ),
    );
    if (listChip === "non-lus") list = list.filter((m) => m.unreadCount > 0);
    if (listChip === "internes") {
      list = list.filter((m) => !partyForMission(m).external);
    }
    if (listChip === "clients") {
      list = list.filter((m) => partyForMission(m).partyType === "CLIENT");
    }
    if (listChip === "fournisseurs") {
      list = list.filter((m) => partyForMission(m).partyType === "SUPPLIER");
    }
    if (listChip === "externes") {
      list = list.filter((m) => partyForMission(m).external);
    }
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.client.name.toLowerCase().includes(q) ||
          (m.projectName ?? "").toLowerCase().includes(q) ||
          (m.assignedTo?.name ?? "").toLowerCase().includes(q) ||
          (m.lastMessage?.content ?? "").toLowerCase().includes(q),
      );
    }
    return sortMissionsByLastMessage(list);
  })();

  /** Discussions = directs + missions + channels chantier (même tri lastMessageAt). */
  const filteredDirectConversations = (() => {
    let list = directConversations.filter((c) => c.lastMessage != null);
    if (listChip === "non-lus") list = list.filter((c) => c.unread > 0);
    if (listChip === "externes" || listChip === "clients" || listChip === "fournisseurs") {
      list = list.filter((c) => {
        const r = recipients.find((x) => x.id === c.user.id);
        const party = r ? partyForRecipient(r) : resolveMessagingPartyType({ personType: "INTERNAL" });
        if (listChip === "clients") return party.partyType === "CLIENT";
        if (listChip === "fournisseurs") return party.partyType === "SUPPLIER";
        return party.external;
      });
    }
    if (listChip === "internes") {
      list = list.filter((c) => {
        const r = recipients.find((x) => x.id === c.user.id);
        const party = r ? partyForRecipient(r) : resolveMessagingPartyType({ personType: "INTERNAL" });
        return !party.external;
      });
    }
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.user.name.toLowerCase().includes(q) ||
          (c.lastMessage?.content ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  })();

  const filteredProjectChannels = (() => {
    let list = projectChannels;
    if (listChip === "non-lus") list = list.filter((c) => c.unreadCount > 0);
    if (listChip === "internes") list = list.filter((c) => !c.external);
    if (listChip === "externes") list = list.filter((c) => c.external);
    if (listChip === "clients") list = list.filter((c) => c.type === "CLIENT");
    if (listChip === "fournisseurs") list = list.filter((c) => c.type === "SUPPLIER");
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.listTitle.toLowerCase().includes(q) ||
          c.projectTitle.toLowerCase().includes(q) ||
          (c.lastMessage?.content ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  })();

  type UnifiedDiscussion =
    | { kind: "DIRECT"; at: number; conv: (typeof filteredDirectConversations)[number] }
    | { kind: "TASK"; at: number; mission: MissionItem }
    | { kind: "CHANNEL"; at: number; channel: InboxProjectChannelItem };

  const unifiedDiscussions: UnifiedDiscussion[] = (() => {
    const items: UnifiedDiscussion[] = [];
    for (const conv of filteredDirectConversations) {
      items.push({
        kind: "DIRECT",
        at: conv.lastMessage ? new Date(conv.lastMessage.createdAt).getTime() : 0,
        conv,
      });
    }
    for (const mission of filteredMissions) {
      items.push({
        kind: "TASK",
        at: mission.lastMessage ? new Date(mission.lastMessage.createdAt).getTime() : 0,
        mission,
      });
    }
    for (const channel of filteredProjectChannels) {
      items.push({
        kind: "CHANNEL",
        at: channel.lastMessageAt ? new Date(channel.lastMessageAt).getTime() : 0,
        channel,
      });
    }
    items.sort((a, b) => b.at - a.at);
    return items;
  })();

  function discussionPinKey(d: UnifiedDiscussion): string {
    if (d.kind === "TASK") return d.mission.id;
    if (d.kind === "DIRECT") return `direct:${d.conv.user.id}`;
    return `channel:${d.channel.id}`;
  }

  const pinnedDiscussions = unifiedDiscussions.filter((d) =>
    pinnedIds.includes(discussionPinKey(d)),
  );
  const recentDiscussions = unifiedDiscussions.filter(
    (d) => !pinnedIds.includes(discussionPinKey(d)),
  );

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

  function openDirectDiscussion(userId: string) {
    setSelectedTaskId("");
    setSelectedChannelId("");
    setSelectedDirectContactId(userId);
    setFilter("inbox");
    setMobileShowThread(true);
    setDirectAttemptedSend(false);
    setDirectSendError(null);
    replaceMessagerieQuery({ with: userId });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("bework:messagerie-thread-open"));
    }
  }

  function openChannelDiscussion(ch: InboxProjectChannelItem) {
    setSelectedTaskId("");
    setSelectedDirectContactId("");
    setSelectedChannelId(ch.id);
    // Même historique / unread que Par chantier (pas de clone).
    router.push(ch.href);
  }

  function renderUnifiedRow(d: UnifiedDiscussion, pinned: boolean) {
    if (d.kind === "DIRECT") {
      return (
        <DirectRow
          key={`${pinned ? "pin-" : ""}direct-${d.conv.user.id}`}
          conv={d.conv}
          selected={selectedDirectContactId === d.conv.user.id && !selectedTaskId}
          sessionUserId={sessionUserId}
          recipient={recipients.find((r) => r.id === d.conv.user.id)}
          onSelect={() => openDirectDiscussion(d.conv.user.id)}
          formatRelativeTime={formatRelativeTime}
        />
      );
    }
    if (d.kind === "CHANNEL") {
      return (
        <ChannelRow
          key={`${pinned ? "pin-" : ""}channel-${d.channel.id}`}
          ch={d.channel}
          selected={selectedChannelId === d.channel.id}
          onSelect={() => openChannelDiscussion(d.channel)}
          formatRelativeTime={formatRelativeTime}
        />
      );
    }
    return (
      <MissionRow
        key={`${pinned ? "pin-" : ""}${d.mission.id}`}
        m={d.mission}
        selected={selectedTaskId === d.mission.id}
        sessionUserId={sessionUserId}
        pinned={pinned}
        onSelect={() => openMissionDiscussion(d.mission.id)}
        onTogglePin={() => togglePin(d.mission.id)}
        formatRelativeTime={formatRelativeTime}
      />
    );
  }

  function openNewMessageComposer() {
    setFilter("envoyer");
    setDirectRecipientId("");
    setRecipientPickerOpen(true);
    setRecipientSearch("");
    setDirectAttemptedSend(false);
    setDirectSendError(null);
    setMobileShowThread(false);
  }

  // V2C.7 — ne jamais rester bloqué dans un mode « Contacts » permanent
  useEffect(() => {
    if (filter === "messages-directs") {
      setFilter("inbox");
    }
  }, [filter]);

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
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-white p-4 sm:p-6">
          <ContextBackButton
            label="Retour aux discussions"
            fallbackHref="/dashboard/messagerie"
            onBack={() => {
              setFilter("inbox");
              setDirectRecipientId("");
              setRecipientPickerOpen(true);
              setRecipientSearch("");
              setDirectAttemptedSend(false);
              setDirectSendError(null);
              setMobileShowThread(false);
            }}
            className="mb-3"
          />
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">À</p>
              {directRecipientId && !recipientPickerOpen ? (
                (() => {
                  const chosen = recipients.find((r) => r.id === directRecipientId);
                  if (!chosen) return null;
                  const party = partyForRecipient(chosen);
                  const initials = chosen.name
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? "")
                    .join("");
                  const subtitle =
                    party.partyType === "INTERNAL"
                      ? `${internalProfileLabel(chosen.permissionProfile)} · Interne`
                      : [chosen.company, party.shortLabel].filter(Boolean).join(" · ");
                  return (
                    <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#1e3a5f]/25 bg-[#eef2f7] px-3 py-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-xs font-bold text-white"
                        aria-hidden
                      >
                        {initials || "?"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[#111b21]">{chosen.name}</p>
                        <p className="text-[11px] font-medium text-slate-500">{subtitle}</p>
                      </div>
                      <button
                        type="button"
                        aria-label="Retirer le destinataire"
                        onClick={() => {
                          setDirectRecipientId("");
                          setRecipientPickerOpen(true);
                          setDirectAttemptedSend(false);
                          setDirectSendError(null);
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-red-600"
                      >
                        ×
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientPickerOpen(true)}
                        className="rounded-lg px-2.5 py-2 text-xs font-semibold text-[#1e3a5f] hover:bg-white"
                      >
                        Changer
                      </button>
                    </div>
                  );
                })()
              ) : null}

              {recipientPickerOpen || !directRecipientId ? (
                <>
                  <input
                    id="recipient-search"
                    type="search"
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    placeholder="Rechercher Karim, Point.P, un client, un chantier…"
                    autoFocus
                    className="mb-3 w-full rounded-xl border border-[#d1d7db] px-4 py-3 text-sm text-[#111b21] focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/15"
                  />
                  {(() => {
                    const priorityNames = new Set([
                      DEMO_PERSONAS.administratif.name,
                      DEMO_PERSONAS.conducteur.name,
                    ]);
                    const q = recipientSearch.trim().toLowerCase();
                    const filtered = recipients
                      .filter((r) => r.id !== sessionUserId)
                      .filter((r) => {
                        if (!q) return true;
                        const party = partyForRecipient(r);
                        return (
                          r.name.toLowerCase().includes(q) ||
                          (r.company ?? "").toLowerCase().includes(q) ||
                          party.shortLabel.toLowerCase().includes(q) ||
                          (r.permissionProfile ?? "").toLowerCase().includes(q)
                        );
                      })
                      .sort((a, b) => {
                        if (!q) {
                          const ta = partyForRecipient(a).partyType;
                          const tb = partyForRecipient(b).partyType;
                          const pa = priorityNames.has(a.name) ? 0 : ta === "INTERNAL" ? 1 : 2;
                          const pb = priorityNames.has(b.name) ? 0 : tb === "INTERNAL" ? 1 : 2;
                          if (pa !== pb) return pa - pb;
                          if (priorityNames.has(a.name) && priorityNames.has(b.name)) {
                            if (a.name === DEMO_PERSONAS.administratif.name) return -1;
                            if (b.name === DEMO_PERSONAS.administratif.name) return 1;
                          }
                        }
                        return a.name.localeCompare(b.name, "fr");
                      });

                    const groups: { key: string; label: string; items: typeof filtered }[] = [
                      { key: "team", label: "Équipe", items: [] },
                      { key: "clients", label: "Clients", items: [] },
                      { key: "suppliers", label: "Fournisseurs", items: [] },
                      { key: "other", label: "Autres", items: [] },
                    ];
                    for (const r of filtered) {
                      const party = partyForRecipient(r);
                      if (party.partyType === "INTERNAL") groups[0].items.push(r);
                      else if (party.partyType === "CLIENT") groups[1].items.push(r);
                      else if (party.partyType === "SUPPLIER") groups[2].items.push(r);
                      else groups[3].items.push(r);
                    }
                    const visibleGroups = groups.filter((g) => g.items.length > 0);
                    const showGroupHeaders = visibleGroups.length > 1 && filtered.length >= 4;

                    return (
                      <ul className="max-h-72 overflow-y-auto rounded-xl border border-[#e9edef]">
                        {filtered.length === 0 ? (
                          <li className="px-3 py-4 text-sm text-[#667781]">Aucun contact trouvé.</li>
                        ) : (
                          visibleGroups.map((group) => (
                            <li key={group.key} className="list-none">
                              {showGroupHeaders ? (
                                <p className="sticky top-0 bg-[#f8fafc] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                  {group.label}
                                </p>
                              ) : null}
                              <ul>
                                {group.items.map((r) => {
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
                                          setDirectSendError(null);
                                          const existing = directConversations.find(
                                            (c) => c.user.id === r.id,
                                          );
                                          if (existing?.lastMessage) {
                                            openDirectDiscussion(r.id);
                                            return;
                                          }
                                          setRecipientPickerOpen(false);
                                          setRecipientSearch("");
                                        }}
                                        className={`flex w-full items-start gap-3 px-3 py-3 text-left text-sm transition-colors ${
                                          selected
                                            ? "bg-[#dbe7f3] ring-1 ring-inset ring-[#1e3a5f]/20"
                                            : "hover:bg-[#f8fafc]"
                                        }`}
                                      >
                                        <Avatar name={r.name} size="sm" />
                                        <span className="min-w-0 flex-1">
                                          <span className="flex items-center gap-2">
                                            <span className="block font-semibold text-[#111b21]">
                                              {r.name}
                                              {r.company && party.partyType !== "INTERNAL" ? (
                                                <span className="font-normal text-slate-500">
                                                  {" "}
                                                  — {r.company}
                                                </span>
                                              ) : null}
                                            </span>
                                            {selected ? (
                                              <span
                                                className="ml-auto shrink-0 text-[#1e3a5f]"
                                                aria-hidden
                                              >
                                                ✓
                                              </span>
                                            ) : null}
                                          </span>
                                          <span
                                            className={`mt-0.5 block text-[11px] font-semibold ${messagingPartyToneClass(
                                              party.partyType,
                                            )}`}
                                          >
                                            {formatPartyBadge(party)}
                                            {party.partyType === "INTERNAL"
                                              ? ` · ${internalProfileLabel(r.permissionProfile)}`
                                              : null}
                                          </span>
                                          <span className="sr-only">{subtitle}</span>
                                        </span>
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            </li>
                          ))
                        )}
                      </ul>
                    );
                  })()}
                </>
              ) : null}

              {directAttemptedSend && !directRecipientId ? (
                <p className="mt-2 text-xs text-red-600">Choisissez un destinataire pour envoyer.</p>
              ) : null}
              {directSendError ? (
                <p
                  role="alert"
                  className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800"
                >
                  {directSendError}
                </p>
              ) : null}
            </div>
            {directRecipientId ? (
            <div>
              {(() => {
                const chosen = recipients.find((r) => r.id === directRecipientId);
                const party = chosen ? partyForRecipient(chosen) : null;
                if (!party) return null;
                const visibility =
                  party.partyType === "INTERNAL"
                    ? "Visible uniquement par les participants autorisés."
                    : chosen?.company
                      ? `Visible par ${chosen.company}`
                      : party.visibilityHint;
                return (
                  <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <p
                      className={`text-[12px] font-semibold ${messagingPartyToneClass(party.partyType)}`}
                    >
                      {party.partyType === "INTERNAL" ? "🔒 Interne" : party.shortLabel}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{visibility}</p>
                  </div>
                );
              })()}
              <label htmlFor="direct-content" className="mb-1.5 block text-sm font-medium text-[#111b21]">
                Message
              </label>
              <textarea
                id="direct-content"
                value={directContent}
                onChange={(e) => setDirectContent(e.target.value)}
                placeholder="Écrire un message..."
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
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[#d1d7db] bg-white px-3 py-2 text-sm text-[#54656f] hover:bg-[#f0f2f5] ${
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
                  sendingDirect ||
                  !directRecipientId ||
                  (!directContent.trim() && directAttachments.length === 0)
                }
                className="mt-3 min-h-11 rounded-full bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#152a45] disabled:opacity-50"
              >
                {sendingDirect ? "Envoi…" : "Envoyer"}
              </button>
              {directSendError ? (
                <p
                  role="alert"
                  className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800"
                >
                  {directSendError}
                </p>
              ) : null}
            </div>
            ) : null}
          </form>
          {recipients.length === 0 && (
            <p className="mt-4 text-sm text-[#667781]">Aucun contact disponible.</p>
          )}
        </div>
      ) : (
      <>
      <aside
        className={`min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-[#d1d7db] bg-white md:flex md:w-[min(100%,420px)] ${
          mobileShowThread && (selectedTaskId || selectedDirectContactId) ? "hidden" : "flex"
        }`}
      >
        <div className="border-b border-[#e9edef] px-4 pb-3 pt-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-[20px] font-bold tracking-tight text-[#111b21] md:text-[22px]">
              Discussions
            </h2>
            <div className="relative flex items-center gap-1">
              <button
                type="button"
                title="+ Nouveau message"
                onClick={() => {
                  if (showEnvoyerTab) openNewMessageComposer();
                  else setFilter("inbox");
                }}
                className="flex h-10 min-w-10 items-center justify-center gap-1 rounded-full bg-[#00a884] px-3 text-sm font-semibold text-white hover:bg-[#008f72]"
              >
                <span className="text-lg leading-none">+</span>
                <span>Nouveau</span>
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
                      openNewMessageComposer();
                      setMoreOpen(false);
                    }}
                    className="block w-full border-t border-[#f0f2f5] px-3 py-2 text-left text-sm text-[#111b21] hover:bg-[#f5f6f6]"
                  >
                    Contacts (nouveau message)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      router.push(buildMessagerieChantierUrl());
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
                  setFilter("inbox");
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
          {unifiedDiscussions.length === 0 ? (
            <li className="p-4">
              <div className="rounded-xl bg-[#f0f2f5] p-4 text-center">
                <p className="text-sm font-medium text-[#111b21]">Aucun message pour le moment.</p>
                <p className="mt-1 text-xs text-[#667781]">
                  {isClient
                    ? "Créez une mission ou écrivez à un contact pour démarrer."
                    : "Touchez + Nouveau pour démarrer une discussion."}
                </p>
                <button
                  type="button"
                  onClick={() => openNewMessageComposer()}
                  className="mt-3 inline-flex items-center justify-center rounded-full bg-[#00a884] px-4 py-2 text-sm font-medium text-white hover:bg-[#008f72]"
                >
                  + Nouveau
                </button>
              </div>
            </li>
          ) : (
            <>
              {pinnedDiscussions.length > 0 ? (
                <li className="sticky top-0 z-10 bg-[#f0f2f5] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#667781]">
                  Épinglées
                </li>
              ) : null}
              {pinnedDiscussions.map((d) => renderUnifiedRow(d, true))}
              {pinnedDiscussions.length > 0 ? (
                <li className="sticky top-0 z-10 bg-[#f0f2f5] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#667781]">
                  Récentes
                </li>
              ) : null}
              {recentDiscussions.map((d) => renderUnifiedRow(d, false))}
            </>
          )}
        </ul>
      </aside>

      {/* Colonne droite : conversation type WhatsApp */}
      <div
        className={`min-h-0 min-w-0 flex-1 flex-col ${
          mobileShowThread && (selectedTaskId || selectedDirectContactId) ? "flex" : "hidden md:flex"
        }`}
      >
            {selectedDirectContactId && selectedDirectContact && !selectedTaskId ? (
              <>
                <div className="flex shrink-0 items-center gap-3 border-b border-[#d1d7db] bg-[#f0f2f5] px-4 py-2">
                  <button
                    type="button"
                    className="rounded-full p-2 text-[#54656f] hover:bg-[#e9edef] md:hidden"
                    aria-label="Retour aux discussions"
                    onClick={() => closeMobileThread()}
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
                    {loadingDirectThread && selectedDirectThread.length === 0 ? (
                      <div className="space-y-2 py-2" aria-hidden>
                        <div className="h-10 w-3/5 animate-pulse rounded-2xl bg-[#e9edef]" />
                        <div className="ml-auto h-10 w-2/5 animate-pulse rounded-2xl bg-[#e9edef]" />
                        <div className="h-10 w-1/2 animate-pulse rounded-2xl bg-[#e9edef]" />
                      </div>
                    ) : null}
                    {!loadingDirectThread && selectedDirectThread.length === 0 ? (
                      <div className="flex h-full items-center justify-center py-16">
                        <p className="rounded-lg bg-[#fff5c4] px-4 py-2 text-[13px] text-[#54656f] shadow-sm">
                          Début de la conversation avec{" "}
                          {(selectedDirectContact as { name?: string })?.name ?? "ce contact"}.
                        </p>
                      </div>
                    ) : null}
                    <MessageSelectionBar
                      count={selectionMode ? selectedMsgIds.size : 0}
                      canDelete={selectedMsgIds.size > 0}
                      onImportant={() => {
                        setMessagesImportant(
                          [...selectedMsgIds].map((id) => ({ kind: "DIRECT", messageId: id })),
                          true,
                        );
                        setPersonalTick((t) => t + 1);
                        setSelectionMode(false);
                        setSelectedMsgIds(new Set());
                      }}
                      onForward={() => {
                        const first = [...selectedMsgIds][0];
                        if (!first) return;
                        setForwardSource({ kind: "DIRECT", id: first, scope: "INTERNAL" });
                        setForwardOpen(true);
                      }}
                      onDelete={() => {
                        const ids = [...selectedMsgIds];
                        const selected = selectedDirectThread.filter((m) => ids.includes(m.id));
                        const allMine = selected.every((m) => m.sender.id === sessionUserId);
                        setDeleteError(null);
                        setDeleteDialog({
                          kind: "DIRECT",
                          ids,
                          isMine: allMine,
                          forceMeOnly: true,
                        });
                      }}
                      onCancel={() => {
                        setSelectionMode(false);
                        setSelectedMsgIds(new Set());
                      }}
                    />
                    {selectedDirectThread
                      .filter((m) => {
                        if (threadMsgFilter === "important")
                          return isMessageImportant("DIRECT", m.id);
                        if (threadMsgFilter === "pinned")
                          return isMessagePinnedPersonal("DIRECT", m.id);
                        return true;
                      })
                      .map((m) => {
                      const isMe = m.sender.id === sessionUserId;
                      const atts = Array.isArray(m.attachmentsJson)
                        ? (m.attachmentsJson as MsgAttachment[])
                        : [];
                      const deletedIds = new Set(
                        selectedDirectThread
                          .filter((x) => x.deletedAt)
                          .map((x) => x.id),
                      );
                      const reply = maybeRedactReplyExcerpt(
                        getReplyFromPayload(m.payloadJson),
                        deletedIds,
                      );
                      const reactions = getReactionsFromPayload(m.payloadJson);
                      const hasText = Boolean(m.content?.trim());
                      const deletedLabel = deletedMessageLabel(m, sessionUserId);
                      return (
                        <div
                          key={m.id}
                          id={`msg-${m.id}`}
                          className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`flex max-w-[75%] flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <MessageBubbleChrome
                              messageId={m.id}
                              isMe={isMe}
                              myUserId={sessionUserId}
                              capabilities={{
                                reply: !m.deletedAt,
                                react: !m.deletedAt,
                                bework: !m.deletedAt,
                                important: true,
                                pin: true,
                                forward: !m.deletedAt,
                                copy: hasText && !m.deletedAt,
                                infos: true,
                                delete: !m.deletedAt,
                                select: true,
                              }}
                              isImportant={isMessageImportant("DIRECT", m.id)}
                              isPinned={isMessagePinnedPersonal("DIRECT", m.id)}
                              selectionMode={selectionMode}
                              selected={selectedMsgIds.has(m.id)}
                              highlighted={flashMsgId === m.id}
                              reactions={m.deletedAt ? undefined : reactions}
                              onToggleSelect={() => {
                                setSelectedMsgIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(m.id)) next.delete(m.id);
                                  else next.add(m.id);
                                  return next;
                                });
                              }}
                              onAction={(id) =>
                                handleMessageMenuAction("DIRECT", m, id, {
                                  conversationLabel:
                                    (selectedDirectContact as { name?: string })?.name ??
                                    "Message direct",
                                  partyLabel: "🔒 Interne",
                                  isInternalScope: true,
                                })
                              }
                              onReact={(emoji) => void reactToMessage("DIRECT", m.id, emoji)}
                              footer={
                                deletedLabel ? null : (
                                <div data-bework-for={m.id}>
                                  <MessageBeworkActions
                                    messageId={m.id}
                                    messageKind="DIRECT"
                                    content={m.content || ""}
                                    hasMedia={atts.some(
                                      (a) => isAudioAttachment(a) || isImageAttachment(a),
                                    )}
                                    isMe={isMe}
                                    agents={agents}
                                  />
                                </div>
                                )
                              }
                            >
                              <div
                                className={`rounded-lg px-2.5 py-1.5 shadow-sm ${
                                  isMe
                                    ? "rounded-tr-sm bg-[#e0f4fb] text-[#111b21]"
                                    : "rounded-tl-sm bg-white text-[#111b21]"
                                }`}
                              >
                                {deletedLabel ? (
                                  <p className="italic text-[13px] text-[#667781]">{deletedLabel}</p>
                                ) : (
                                  <>
                                {!isMe ? (
                                  <p className="text-[12px] font-semibold text-[#00a884]">
                                    {m.sender.name}
                                  </p>
                                ) : null}
                                {reply ? (
                                  <MessageReplyQuote reply={reply} onJump={jumpToMessage} />
                                ) : null}
                                {hasText ? <MessageExpandableBody text={m.content} /> : null}
                                {atts.length > 0 ? (
                                  <MessagerieAttachmentsBlock
                                    messageKind="DIRECT"
                                    messageId={m.id}
                                    attachments={atts}
                                    isMe={isMe}
                                  />
                                ) : null}
                                  </>
                                )}
                                <p className="mt-0.5 flex flex-wrap items-center justify-end gap-1 text-[11px] text-[#667781]">
                                  {formatMessageTime(m.createdAt)}
                                  {isMe ? (
                                    m.kind === "pending" ? (
                                      <span className="text-[#8696a0]" title="Envoi…">
                                        Envoi…
                                      </span>
                                    ) : m.kind === "failed" ? (
                                      <span className="inline-flex items-center gap-1.5">
                                        <span className="font-medium text-red-600">Non envoyé</span>
                                        <button
                                          type="button"
                                          className="font-semibold text-[#00a884] underline"
                                          disabled={sendingReply}
                                          onClick={() => {
                                            const attsRetry = Array.isArray(m.attachmentsJson)
                                              ? m.attachmentsJson
                                              : [];
                                            const text =
                                              typeof m.originalContent === "string"
                                                ? m.originalContent
                                                : (m.content || "")
                                                    .replace(/\s*—\s*Échec$/i, "")
                                                    .trim();
                                            const isMediaPreview =
                                              text.startsWith("🎤") ||
                                              text.startsWith("📷") ||
                                              text.startsWith("📎");
                                            void sendDirectReply(
                                              isMediaPreview && attsRetry.length ? "" : text,
                                              attsRetry,
                                              { retryTempId: m.id },
                                            );
                                          }}
                                        >
                                          Réessayer
                                        </button>
                                      </span>
                                    ) : (
                                      <span className="text-[#53bdeb]" title="Envoyé">
                                        ✓
                                      </span>
                                    )
                                  ) : null}
                                </p>
                              </div>
                            </MessageBubbleChrome>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="z-20 shrink-0 border-t border-[#d1d7db] bg-[#f0f2f5] px-3 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] md:pb-2.5">
                  {replyTarget ? (
                    <MessageReplyComposerBanner
                      reply={replyTarget}
                      onClear={() => setReplyTarget(null)}
                    />
                  ) : null}
                  <p className="mb-1.5 hidden px-1 text-[11px] font-semibold text-violet-800 md:block">
                    🔒 Message interne
                  </p>
                  <input
                    id={replyPhotoId}
                    type="file"
                    accept={MESSAGERIE_PHOTO_ACCEPT}
                    className="sr-only"
                    multiple
                    onChange={(e) => {
                      const files = pickMessageriePhotoFiles(e.target.files);
                      setDirectAttachMenuOpen(false);
                      e.target.value = "";
                      if (files.length) {
                        void uploadFiles(files, setReplyAttachments).then(() => {
                          composerRef.current?.focus();
                        });
                      } else if (e.target.files?.length) {
                        alert("Impossible d’envoyer ce fichier.");
                      }
                    }}
                  />
                  <input
                    id={replyDocId}
                    type="file"
                    accept={MESSAGERIE_DOC_ACCEPT}
                    className="sr-only"
                    multiple
                    onChange={(e) => {
                      const files = pickMessagerieDocFiles(e.target.files);
                      setDirectAttachMenuOpen(false);
                      e.target.value = "";
                      if (files.length) {
                        void uploadFiles(files, setReplyAttachments).then(() => {
                          composerRef.current?.focus();
                        });
                      } else if (e.target.files?.length) {
                        alert("Impossible d’envoyer ce fichier.");
                      }
                    }}
                  />
                  {uploadProgress ? (
                    <p className="mb-1.5 px-1 text-xs font-semibold text-[#008069]">{uploadProgress}</p>
                  ) : null}
                  <form id="direct-reply-form" onSubmit={handleReplyDirect} className="space-y-2">
                    <MessagerieComposerAttachments
                      attachments={replyAttachments}
                      previewUrls={previewUrls}
                      onRemove={(i) => {
                        setReplyAttachments((p) => {
                          const removed = p[i];
                          if (removed) {
                            forgetPreview(removed.fileUrl);
                            forgetPreview(removed.name);
                          }
                          return p.filter((_, j) => j !== i);
                        });
                      }}
                    />
                    <div className="flex items-end gap-2">
                      <div className="mb-0.5">
                        <MessagerieAttachMenu
                          open={directAttachMenuOpen}
                          onOpenChange={setDirectAttachMenuOpen}
                          photoInputId={replyPhotoId}
                          docInputId={replyDocId}
                        />
                      </div>
                      <textarea
                        ref={composerRef}
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
        ) : selectedMission ? (
          <>
            <div className="relative flex shrink-0 items-center gap-3 border-b border-[#d1d7db] bg-[#f0f2f5] px-4 py-2">
              <button
                type="button"
                className="rounded-full p-2 text-[#54656f] hover:bg-[#e9edef] md:hidden"
                aria-label="Retour aux discussions"
                onClick={() => closeMobileThread()}
              >
                ←
              </button>
              <Avatar name={selectedMission.client.name || selectedMission.title} size="sm" />
              <div className="min-w-0 flex-1">
                <h3 className="text-[16px] font-medium text-[#111b21]">{selectedMission.title}</h3>
                <p className="truncate text-[13px] text-[#667781]">
                  <span
                    className={`font-semibold ${messagingPartyToneClass(
                      partyForMission(selectedMission).partyType,
                    )}`}
                  >
                    {formatPartyBadge(partyForMission(selectedMission))}
                  </span>
                  {selectedMission.projectName ? ` · ${selectedMission.projectName}` : null}
                  {" · Tâche"}
                  {selectedMission.assignedTo
                    ? ` · ${selectedMission.assignedTo.name.split(/\s+/)[0]}`
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
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm text-[#111b21] hover:bg-[#f5f6f6]"
                      onClick={() => {
                        setThreadMsgFilter((f) => (f === "pinned" ? "all" : "pinned"));
                        setHeaderMenuOpen(false);
                      }}
                    >
                      {threadMsgFilter === "pinned"
                        ? "Tous les messages"
                        : "Messages épinglés"}
                    </button>
                    <button
                      type="button"
                      className="block w-full px-3 py-2 text-left text-sm text-[#111b21] hover:bg-[#f5f6f6]"
                      onClick={() => {
                        setThreadMsgFilter((f) => (f === "important" ? "all" : "important"));
                        setHeaderMenuOpen(false);
                      }}
                    >
                      {threadMsgFilter === "important" ? "Tous les messages" : "Importants"}
                    </button>
                    {selectedMission.projectId ? (
                      <Link
                        href={withReturnTo(
                          `/dashboard/projets/${selectedMission.projectId}`,
                          messagerieReturnTo({ taskId: selectedTaskId }),
                        )}
                        className="block px-3 py-2 text-sm text-[#111b21] hover:bg-[#f5f6f6]"
                        onClick={() => setHeaderMenuOpen(false)}
                      >
                        Voir le chantier
                      </Link>
                    ) : null}
                    <div className="border-t border-[#f0f2f5] px-1 py-1">
                      <ConversationDossierPanel
                        taskId={selectedTaskId}
                        projectId={selectedMission.projectId}
                        returnTo={messagerieReturnTo({ taskId: selectedTaskId })}
                      />
                    </div>
                    <div className="border-t border-[#f0f2f5] px-1 py-1">
                      <DeleteTaskButton
                        taskId={selectedTaskId}
                        variant="menu"
                        confirmText="Supprimer cette mission ? Cette opération est irréversible."
                        onDeleted={() => {
                          setHeaderMenuOpen(false);
                          setSelectedTaskId("");
                          setMissions((prev) => prev.filter((m) => m.id !== selectedTaskId));
                        }}
                      />
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
                <div className="pointer-events-none absolute inset-4 z-10 flex items-center justify-center rounded-2xl border-2 border-dashed border-[#00a884] bg-[#e0f4fb]/70 text-sm font-semibold text-[#008069]">
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
                  <MessageSelectionBar
                    count={selectionMode ? selectedMsgIds.size : 0}
                    canDelete={selectedMsgIds.size > 0}
                    onImportant={() => {
                      setMessagesImportant(
                        [...selectedMsgIds].map((id) => ({ kind: "TASK", messageId: id })),
                        true,
                      );
                      setPersonalTick((t) => t + 1);
                      setSelectionMode(false);
                      setSelectedMsgIds(new Set());
                    }}
                    onForward={() => {
                      const first = [...selectedMsgIds][0];
                      if (!first) return;
                      const src = messages.find((x) => x.id === first);
                      setForwardSource({
                        kind: "TASK",
                        id: first,
                        scope: scopeFromTaskInternal(Boolean(src?.isInternal)),
                      });
                      setForwardOpen(true);
                    }}
                    onDelete={() => {
                      const ids = [...selectedMsgIds];
                      const selected = messages.filter((m) => ids.includes(m.id));
                      const allMine = selected.every((m) => m.sender.id === sessionUserId);
                      setDeleteError(null);
                      setDeleteDialog({
                        kind: "TASK",
                        ids,
                        isMine: allMine,
                        forceMeOnly: true,
                      });
                    }}
                    onCancel={() => {
                      setSelectionMode(false);
                      setSelectedMsgIds(new Set());
                    }}
                  />
                  {threadMsgFilter !== "all" ? (
                    <p className="px-1 text-[11px] font-semibold text-[#1e3a5f]">
                      Filtre : {threadMsgFilter === "pinned" ? "Messages épinglés" : "Importants"}{" "}
                      <button
                        type="button"
                        className="underline"
                        onClick={() => setThreadMsgFilter("all")}
                      >
                        Afficher tout
                      </button>
                    </p>
                  ) : null}
                  {visibleMessages.map((m) => {
                    const isMe = m.sender.id === sessionUserId;
                    const isSystem = m.kind === "SYSTEM";
                    const atts = Array.isArray(m.attachmentsJson) ? m.attachmentsJson : [];
                    const deletedIds = new Set(
                      visibleMessages.filter((x) => x.deletedAt).map((x) => x.id),
                    );
                    const reply = maybeRedactReplyExcerpt(
                      getReplyFromPayload(m.payloadJson),
                      deletedIds,
                    );
                    const reactions = getReactionsFromPayload(m.payloadJson);
                    const hasText = Boolean(
                      m.content && !atts.some((a) => a.name === m.content),
                    );
                    const deletedLabel = deletedMessageLabel(m, sessionUserId);
                    const party = selectedMission
                      ? partyForMission(selectedMission)
                      : resolveMessagingPartyType({});
                    if (isSystem) {
                      return (
                        <div key={m.id} id={`msg-${m.id}`} className="flex justify-center">
                          <div className="rounded-md bg-[#fff5c4] px-2.5 py-1.5 text-center text-[#54656f] shadow-sm">
                            <p className="text-[12px] font-medium">BeWork · {m.content}</p>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={m.id}
                        id={`msg-${m.id}`}
                        className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`flex max-w-[78%] flex-col ${isMe ? "items-end" : "items-start"}`}>
                          <MessageBubbleChrome
                            messageId={m.id}
                            isMe={isMe}
                            myUserId={sessionUserId}
                            capabilities={{
                              reply: !m.deletedAt,
                              react: !m.deletedAt,
                              bework: !m.deletedAt,
                              important: true,
                              pin: true,
                              forward: !m.deletedAt,
                              copy: hasText && !m.deletedAt,
                              infos: true,
                              delete: !m.deletedAt,
                              select: true,
                            }}
                            isImportant={isMessageImportant("TASK", m.id)}
                            isPinned={isMessagePinnedPersonal("TASK", m.id)}
                            selectionMode={selectionMode}
                            selected={selectedMsgIds.has(m.id)}
                            highlighted={flashMsgId === m.id}
                            reactions={m.deletedAt ? undefined : reactions}
                            onToggleSelect={() => {
                              setSelectedMsgIds((prev) => {
                                const next = new Set(prev);
                                if (next.has(m.id)) next.delete(m.id);
                                else next.add(m.id);
                                return next;
                              });
                            }}
                            onAction={(id) =>
                              handleMessageMenuAction("TASK", m, id, {
                                conversationLabel: selectedMission?.title ?? "Discussion",
                                partyLabel: m.isInternal
                                  ? "🔒 Interne"
                                  : formatPartyBadge(party),
                                isInternalScope: m.isInternal || !party.external,
                              })
                            }
                            onReact={(emoji) => void reactToMessage("TASK", m.id, emoji)}
                            footer={
                              deletedLabel ? null : (
                              <>
                                <div data-bework-for={m.id}>
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
                                </div>
                                {(m.linkedBadges?.length ?? 0) > 0 ? (
                                  <div
                                    className={`mt-0.5 flex flex-wrap gap-1 ${isMe ? "justify-end" : ""}`}
                                  >
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
                              </>
                              )
                            }
                          >
                            <div
                              className={`relative rounded-lg px-2.5 py-1.5 shadow-sm ${
                                isMe
                                  ? "rounded-tr-sm bg-[#e0f4fb] text-[#111b21]"
                                  : "rounded-tl-sm bg-white text-[#111b21]"
                              } ${m.isInternal ? "ring-1 ring-amber-400" : ""}`}
                            >
                              {deletedLabel ? (
                                <p className="italic text-[13px] text-[#667781]">{deletedLabel}</p>
                              ) : (
                                <>
                              {!isMe ? (
                                <p className="text-[12px] font-semibold text-[#00a884]">
                                  {m.sender.name}
                                </p>
                              ) : null}
                              {reply ? (
                                <MessageReplyQuote reply={reply} onJump={jumpToMessage} />
                              ) : null}
                              {hasText ? (
                                <MessageExpandableBody
                                  text={m.content}
                                  suffix={m.isInternal ? " (interne)" : undefined}
                                />
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
                                {isMe ? (
                                  m.kind === "pending" ? (
                                    <span className="text-[#8696a0]" title="Envoi…">
                                      Envoi…
                                    </span>
                                  ) : m.kind === "failed" ? (
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="font-medium text-red-600">Non envoyé</span>
                                      <button
                                        type="button"
                                        className="font-semibold text-[#00a884] underline"
                                        title="Réessayer"
                                        onClick={() => {
                                          const attsRetry = Array.isArray(m.attachmentsJson)
                                            ? m.attachmentsJson
                                            : [];
                                          const text = (m.content || "")
                                            .replace(/\s*—\s*Échec$/i, "")
                                            .trim();
                                          setMessages((prev) => prev.filter((x) => x.id !== m.id));
                                          void sendMissionMessage(
                                            text.startsWith("🎤") ||
                                              text.startsWith("📷") ||
                                              text.startsWith("📎")
                                              ? ""
                                              : text,
                                            attsRetry,
                                          );
                                        }}
                                      >
                                        Réessayer
                                      </button>
                                    </span>
                                  ) : (
                                    <span className="text-[#53bdeb]" title="Envoyé">
                                      ✓
                                    </span>
                                  )
                                ) : null}
                              </p>
                            </div>
                          </MessageBubbleChrome>
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

            <div className="z-20 shrink-0 border-t border-[#d1d7db] bg-[#f0f2f5] px-3 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] md:pb-2.5">
              {replyTarget ? (
                <MessageReplyComposerBanner
                  reply={replyTarget}
                  onClear={() => setReplyTarget(null)}
                />
              ) : null}
              <p
                className={`mb-1 hidden px-1 text-[10px] font-medium md:mb-1.5 md:block md:text-[11px] md:font-semibold ${messagingPartyToneClass(
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
                accept={MESSAGERIE_DOC_ACCEPT}
                className="sr-only"
                multiple
                onChange={(e) => {
                  const files = pickMessagerieDocFiles(e.target.files);
                  setAttachMenuOpen(false);
                  e.target.value = "";
                  if (files.length) {
                    void uploadFiles(files, setMissionAttachments).then(() => {
                      composerRef.current?.focus();
                    });
                  } else if (e.target.files?.length) {
                    alert("Impossible d’envoyer ce fichier.");
                  }
                }}
              />
              <input
                id={missionPhotoId}
                type="file"
                accept={MESSAGERIE_PHOTO_ACCEPT}
                className="sr-only"
                multiple
                onChange={(e) => {
                  const files = pickMessageriePhotoFiles(e.target.files);
                  setAttachMenuOpen(false);
                  e.target.value = "";
                  if (files.length) {
                    void uploadFiles(files, setMissionAttachments).then(() => {
                      composerRef.current?.focus();
                    });
                  } else if (e.target.files?.length) {
                    alert("Impossible d’envoyer ce fichier.");
                  }
                }}
              />
              {uploadProgress ? (
                <p className="mb-1.5 px-1 text-xs font-semibold text-[#008069]">{uploadProgress}</p>
              ) : null}
              <MessagerieComposerAttachments
                attachments={missionAttachments}
                previewUrls={previewUrls}
                onRemove={(i) => {
                  setMissionAttachments((p) => {
                    const removed = p[i];
                    if (removed) {
                      forgetPreview(removed.fileUrl);
                      forgetPreview(removed.name);
                    }
                    return p.filter((_, j) => j !== i);
                  });
                }}
              />
              <form id="mission-send-form" onSubmit={handleSend} className="flex items-end gap-2">
                <div className="mb-0.5">
                  <MessagerieAttachMenu
                    open={attachMenuOpen}
                    onOpenChange={setAttachMenuOpen}
                    photoInputId={missionPhotoId}
                    docInputId={missionFileId}
                  />
                </div>
                <div className="relative min-w-0 flex-1">
                  <textarea
                    ref={composerRef}
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
            <p className="text-base font-medium text-[#41525d]">
              Choisissez une conversation pour commencer.
            </p>
            <p className="mt-1 max-w-sm text-sm text-[#667781]">
              Sélectionnez une discussion à gauche.
            </p>
          </div>
        )}
      </div>
      </>
      )}

      <MessageInfosPanel
        open={infosOpen}
        onClose={() => setInfosOpen(false)}
        data={infosData}
      />
      <MessageDeleteDialog
        open={Boolean(deleteDialog)}
        isMine={Boolean(deleteDialog?.isMine)}
        forceMeOnly={Boolean(deleteDialog?.forceMeOnly)}
        count={deleteDialog?.ids.length ?? 1}
        pending={deletePending}
        error={deleteError}
        onCancel={() => {
          if (deletePending) return;
          setDeleteDialog(null);
          setDeleteError(null);
        }}
        onDeleteMe={() => void confirmDelete("me")}
        onDeleteEveryone={
          deleteDialog && !deleteDialog.forceMeOnly && deleteDialog.isMine
            ? () => void confirmDelete("everyone")
            : undefined
        }
      />
      <MessageForwardDialog
        open={forwardOpen}
        onClose={() => {
          setForwardOpen(false);
          setForwardSource(null);
        }}
        sourceScope={forwardSource?.scope ?? "INTERNAL"}
        destinations={forwardDestinations.filter(
          (d) =>
            !(
              forwardSource &&
              d.kind === forwardSource.kind &&
              ((d.kind === "TASK" && d.id === selectedTaskId) ||
                (d.kind === "DIRECT" && d.id === selectedDirectContactId))
            ),
        )}
        onConfirm={async (dest, confirmExternal) => {
          if (!forwardSource) throw new Error("Message source manquant");
          const res = await fetch("/api/messages/forward", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceKind: forwardSource.kind,
              sourceMessageId: forwardSource.id,
              destKind: dest.kind,
              destId: dest.id,
              confirmExternal,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.status === 409 && data?.needsConfirm) {
            throw new Error(data.error || "Confirmation requise");
          }
          if (!res.ok) throw new Error(data?.error || "Transfert impossible");
          if (data.attachmentsOmitted && data.omitReason) {
            alert(data.omitReason);
          }
        }}
      />
      {copiedHint ? (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white shadow-lg">
          Copié
        </div>
      ) : null}
    </div>
  );
}
