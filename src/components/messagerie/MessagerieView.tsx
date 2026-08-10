"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { PhotoPreviewGrid } from "@/components/messagerie/PhotoPreviewGrid";
import { MessageBeworkActions } from "@/components/messagerie/MessageBeworkActions";
import { MessagerieAttachmentsBlock } from "@/components/messagerie/MessagerieSecureMedia";
import {
  formatMediaPreview,
  isAudioAttachment,
  isImageAttachment,
  type MsgAttachment,
} from "@/lib/messagerie/media-preview";
import { compressImageForMessagerie } from "@/lib/messagerie/compress-image";
import { MESSAGERIE_MEDIA_MAX_BYTES } from "@/lib/messagerie/media-storage";
import { subscribeMessagerieEvents } from "@/lib/perf/messagerie-unread-bus";
import { documentDownloadHref } from "@/lib/documents/download-url";
import {
  makeReplyExcerpt,
  parseContentWithReply,
  type MessageReplyMeta,
} from "@/lib/messagerie/message-reply";
import {
  isMessageImportant,
  isMessagePinnedPersonal,
  toggleMessageImportant,
  toggleMessagePinnedPersonal,
} from "@/lib/messagerie/message-personal-flags";
import { MessageExpandableBody } from "@/components/messagerie/MessageExpandableBody";
import {
  MessageReplyComposerBanner,
  MessageReplyQuote,
} from "@/components/messagerie/MessageReplyQuote";
import { MessageBubbleChrome } from "@/components/messagerie/MessageBubbleChrome";
import { MessageInfosPanel } from "@/components/messagerie/MessageInfosPanel";
import { MessageDeleteDialog } from "@/components/messagerie/MessageDeleteDialog";
import type { MessageMenuActionId } from "@/components/messagerie/MessageContextMenu";
import { scopeFromChannel } from "@/lib/messagerie/forward-safety";
import {
  MessageForwardDialog,
  type ForwardDestOption,
} from "@/components/messagerie/MessageForwardDialog";
import {
  messagerieReturnTo,
  withReturnTo,
} from "@/lib/navigation/safe-return-to";
import { ContextBackButton } from "@/components/ui/ContextBackButton";
import { resolveActiveChannelPresentation } from "@/lib/messagerie/resolve-active-channel-presentation";
import {
  deletedMessageLabel,
  maybeRedactReplyExcerpt,
  type MessageDeleteMode,
} from "@/lib/messagerie/message-delete";

type MessageChannel = "INTERNE" | "CLIENT" | "FOURNISSEUR" | "SOUS_TRAITANT";

type ProjectChannelItem = {
  id: string;
  type: string;
  externalOrganizationId: string | null;
  title: string;
  metaLabel: string;
  external: boolean;
  composerHint: string;
  participantCount: number;
  unreadCount: number;
  lastMessageAt: string | null;
  isParticipant?: boolean;
  accessMode?: "participant" | "supervision";
};

type MessageItem = {
  id: string;
  content: string;
  read: boolean;
  deletedAt?: string | null;
  deletedById?: string | null;
  channel?: string;
  channelId?: string | null;
  attachmentsJson?: MsgAttachment[] | null;
  createdAt: string;
  project: { id: string; title: string };
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
};

type ChannelParticipant = {
  id: string;
  name: string;
  personType?: string | null;
  permissionProfile?: string | null;
  company?: string | null;
  roleLabel?: string | null;
  subtitle?: string | null;
};

type ParticipantCandidate = {
  id: string;
  name: string;
  roleLabel: string;
  company: string | null;
};

const CHANNEL_LABELS: Record<MessageChannel, string> = {
  INTERNE: "🔒 Interne",
  CLIENT: "Client · Externe",
  FOURNISSEUR: "Fournisseur · Externe",
  SOUS_TRAITANT: "Sous-traitant · Externe",
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
  initialChannelId,
  initialExternalOrganizationId,
  hideNewDemande,
}: {
  sessionUserId: string;
  initialProjectId?: string | null;
  initialChannel?: string | null;
  initialChannelId?: string | null;
  initialExternalOrganizationId?: string | null;
  hideNewDemande?: boolean;
}) {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [allowedChannels, setAllowedChannels] = useState<MessageChannel[]>(["CLIENT"]);
  const [channel, setChannel] = useState<MessageChannel>(
    initialChannel === "INTERNE" ||
      initialChannel === "FOURNISSEUR" ||
      initialChannel === "CLIENT" ||
      initialChannel === "SOUS_TRAITANT"
      ? (initialChannel as MessageChannel)
      : "CLIENT",
  );
  const [projectChannels, setProjectChannels] = useState<ProjectChannelItem[]>([]);
  const [channelsByProject, setChannelsByProject] = useState<
    Record<string, ProjectChannelItem[]>
  >({});
  const [expandedProjectId, setExpandedProjectId] = useState<string>(initialProjectId ?? "");
  const [contextOpen, setContextOpen] = useState(false);
  const [mobileLevel, setMobileLevel] = useState<"projects" | "channels" | "thread">(
    initialChannelId ? "thread" : initialProjectId ? "channels" : "projects",
  );
  const [selectedChannelId, setSelectedChannelId] = useState<string>(initialChannelId ?? "");
  const [participants, setParticipants] = useState<ChannelParticipant[]>([]);
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [canManageParticipants, setCanManageParticipants] = useState(false);
  const [isChannelParticipant, setIsChannelParticipant] = useState(true);
  const [isChannelSupervisor, setIsChannelSupervisor] = useState(false);
  const [supervisorInfo, setSupervisorInfo] = useState<{
    id: string;
    name: string;
    roleLabel: string;
  } | null>(null);
  const [participateConfirm, setParticipateConfirm] = useState<{
    content: string;
    atts: MsgAttachment[];
  } | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [manageSaving, setManageSaving] = useState(false);
  const [manageSelected, setManageSelected] = useState<Set<string>>(new Set());
  const [manageCandidates, setManageCandidates] = useState<{
    internals: ParticipantCandidate[];
    externals: ParticipantCandidate[];
  }>({ internals: [], externals: [] });
  const [mobileShowThread, setMobileShowThread] = useState(Boolean(initialChannelId));
  const [projectDocuments, setProjectDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId ?? "");
  const [sendContent, setSendContent] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [attachments, setAttachments] = useState<MsgAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<{ files: File[]; comment: string } | null>(
    null,
  );
  const sendLockRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [replyTarget, setReplyTarget] = useState<MessageReplyMeta | null>(null);
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
  const [forwardSourceId, setForwardSourceId] = useState<string | null>(null);
  const [flashMsgId, setFlashMsgId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    ids: string[];
    isMine: boolean;
  } | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  void personalTick;
  void initialExternalOrganizationId;
  void allowedChannels;

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const selectedChannel =
    (selectedProjectId
      ? channelsByProject[selectedProjectId]?.find((c) => c.id === selectedChannelId)
      : undefined) ??
    projectChannels.find((c) => c.id === selectedChannelId) ??
    Object.values(channelsByProject)
      .flat()
      .find((c) => c.id === selectedChannelId) ??
    null;

  const presentation = useMemo(
    () =>
      resolveActiveChannelPresentation(selectedChannel, {
        projectTitle: selectedProject?.title ?? null,
        participantCount:
          participants.length > 0
            ? participants.length
            : (selectedChannel?.participantCount ?? 0),
      }),
    [selectedChannel, selectedProject?.title, participants.length],
  );

  // P0 — le legacy `channel` suit TOUJOURS le channel réellement sélectionné
  useEffect(() => {
    if (presentation.channelId) {
      setChannel(presentation.legacyChannel);
    }
  }, [presentation.channelId, presentation.legacyChannel]);

  useEffect(() => {
    if (
      initialChannel === "INTERNE" ||
      initialChannel === "FOURNISSEUR" ||
      initialChannel === "CLIENT" ||
      initialChannel === "SOUS_TRAITANT"
    ) {
      setChannel(initialChannel as MessageChannel);
    }
  }, [initialChannel]);

  useEffect(() => {
    if (initialChannelId) setSelectedChannelId(initialChannelId);
  }, [initialChannelId]);
  useEffect(() => {
    if (initialProjectId) setSelectedProjectId(initialProjectId);
  }, [initialProjectId]);

  async function loadProjectChannels(projectId: string) {
    const res = await fetch(`/api/messages/channels?projectId=${encodeURIComponent(projectId)}`);
    if (!res.ok) {
      setProjectChannels([]);
      setChannelsByProject((prev) => ({ ...prev, [projectId]: [] }));
      return [];
    }
    const data = await res.json();
    const list = Array.isArray(data.channels) ? (data.channels as ProjectChannelItem[]) : [];
    setProjectChannels(list);
    setChannelsByProject((prev) => ({ ...prev, [projectId]: list }));
    return list;
  }

  function selectChannel(projectId: string, ch: ProjectChannelItem) {
    setSelectedProjectId(projectId);
    setExpandedProjectId(projectId);
    setSelectedChannelId(ch.id);
    setChannel(
      ch.type === "INTERNAL"
        ? "INTERNE"
        : ch.type === "SUPPLIER"
          ? "FOURNISSEUR"
          : ch.type === "SUBCONTRACTOR"
            ? "SOUS_TRAITANT"
            : "CLIENT",
    );
    setMobileLevel("thread");
    setMobileShowThread(true);
    setParticipantsOpen(false);
  }

  async function expandProject(projectId: string) {
    setExpandedProjectId(projectId);
    setSelectedProjectId(projectId);
    setMobileLevel("channels");
    setMobileShowThread(false);
    if (!channelsByProject[projectId]) {
      await loadProjectChannels(projectId);
    }
  }

  async function loadMessagesForChannel(channelId: string) {
    const res = await fetch(
      `/api/messages?meta=1&channelId=${encodeURIComponent(channelId)}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    setMessages(Array.isArray(data.messages) ? data.messages : []);
  }

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
        const projRes = await fetch("/api/projets");
        if (projRes.ok) {
          const projs = await projRes.json();
          const list = Array.isArray(projs) ? projs : projs.projects ?? [];
          setProjects(list);
          const pid = selectedProjectId || initialProjectId || list[0]?.id || "";
          if (pid) {
            if (!selectedProjectId) setSelectedProjectId(pid);
            setExpandedProjectId(pid);
            const channels = await loadProjectChannels(pid);
            let chId = selectedChannelId || initialChannelId || "";
            if (!chId && channels.length) {
              const wantedType =
                channel === "INTERNE"
                  ? "INTERNAL"
                  : channel === "FOURNISSEUR"
                    ? "SUPPLIER"
                    : channel === "SOUS_TRAITANT"
                      ? "SUBCONTRACTOR"
                      : "CLIENT";
              const match =
                channels.find((c) => c.type === wantedType) ||
                (initialExternalOrganizationId
                  ? channels.find(
                      (c) => c.externalOrganizationId === initialExternalOrganizationId,
                    )
                  : null) ||
                channels[0];
              chId = match?.id ?? "";
            }
            if (chId) {
              setSelectedChannelId(chId);
              await loadMessagesForChannel(chId);
            } else {
              await loadMessages(channel);
            }
          } else {
            await loadMessages(channel);
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
    if (loading || !selectedProjectId) return;
    void (async () => {
      const channels = await loadProjectChannels(selectedProjectId);
      setExpandedProjectId(selectedProjectId);
      // Ne pas forcer un autre channel si déjà valide (évite stale composer)
      if (selectedChannelId && channels.some((c) => c.id === selectedChannelId)) {
        return;
      }
      // Deep-link / premier chargement uniquement
      if (!selectedChannelId && channels.length) {
        const wantedType =
          channel === "INTERNE"
            ? "INTERNAL"
            : channel === "FOURNISSEUR"
              ? "SUPPLIER"
              : channel === "SOUS_TRAITANT"
                ? "SUBCONTRACTOR"
                : null;
        const match =
          (wantedType ? channels.find((c) => c.type === wantedType) : null) ||
          (initialExternalOrganizationId
            ? channels.find((c) => c.externalOrganizationId === initialExternalOrganizationId)
            : null) ||
          channels[0];
        if (match) {
          setSelectedChannelId(match.id);
          await loadMessagesForChannel(match.id);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]);

  useEffect(() => {
    if (loading || !selectedChannelId) return;
    void loadMessagesForChannel(selectedChannelId);
  }, [selectedChannelId]);

  useEffect(() => {
    if (!selectedChannelId) {
      setParticipants([]);
      setCanManageParticipants(false);
      setIsChannelParticipant(true);
      setIsChannelSupervisor(false);
      setSupervisorInfo(null);
      setManageOpen(false);
      return;
    }
    fetch(`/api/messages/channels/${encodeURIComponent(selectedChannelId)}/participants`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setParticipants(Array.isArray(data?.participants) ? data.participants : []);
        setCanManageParticipants(Boolean(data?.canManage));
        setIsChannelParticipant(data?.isParticipant !== false);
        setIsChannelSupervisor(Boolean(data?.isSupervisor));
        setSupervisorInfo(data?.supervisor ?? null);
        if (data?.candidates) {
          setManageCandidates({
            internals: Array.isArray(data.candidates.internals) ? data.candidates.internals : [],
            externals: Array.isArray(data.candidates.externals) ? data.candidates.externals : [],
          });
        }
      })
      .catch(() => {
        setParticipants([]);
        setCanManageParticipants(false);
      });
  }, [selectedChannelId]);

  useEffect(() => {
    if (!selectedProjectId) {
      setProjectDocuments([]);
      return;
    }
    fetch(`/api/documents?projectId=${selectedProjectId}&page=1`)
      .then((r) => (r.ok ? r.json() : { documents: [] }))
      .then((data) => setProjectDocuments(data.documents ?? []))
      .catch(() => setProjectDocuments([]));
  }, [selectedProjectId]);

  const allMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const conversationsList = projects
    .slice()
    .sort((a, b) => a.title.localeCompare(b.title, "fr"));
  const conversationMessages = selectedChannelId
    ? allMessages.filter(
        (m) =>
          m.project.id === selectedProjectId &&
          (m.channelId === selectedChannelId || !m.channelId),
      )
    : allMessages.filter(
        (m) => m.project.id === selectedProjectId && (m.channel ?? "CLIENT") === channel,
      );

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

  useEffect(() => {
    return subscribeMessagerieEvents((ev) => {
      if (ev.kind !== "PROJECT") return;
      if (ev.op === "deleted_everyone" && ev.messageId) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === ev.messageId
              ? {
                  ...m,
                  content: "",
                  attachmentsJson: null,
                  deletedAt: ev.at,
                  deletedById: ev.senderId,
                }
              : m,
          ),
        );
        return;
      }
      if (!selectedProjectId || !ev.href.includes(selectedProjectId)) return;
      void loadMessages(channel);
    });
  }, [selectedProjectId, channel]);

  async function confirmProjectDelete(mode: MessageDeleteMode) {
    if (!deleteDialog) return;
    setDeletePending(true);
    setDeleteError(null);
    const ids = deleteDialog.ids;
    const snapshot = messages;
    if (mode === "me") {
      setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
    } else {
      setMessages((prev) =>
        prev.map((m) =>
          ids.includes(m.id)
            ? {
                ...m,
                content: "",
                attachmentsJson: null,
                deletedAt: new Date().toISOString(),
                deletedById: sessionUserId,
              }
            : m,
        ),
      );
    }
    try {
      const res = await fetch("/api/messages/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageKind: "PROJECT",
          messageIds: ids,
          mode,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Suppression impossible");
      setDeleteDialog(null);
    } catch (e) {
      setMessages(snapshot);
      setDeleteError(e instanceof Error ? e.message : "Erreur de suppression");
    } finally {
      setDeletePending(false);
    }
  }

  async function uploadFiles(
    files: FileList | File[],
    opts?: { durationSec?: number },
  ): Promise<MsgAttachment[]> {
    const list = Array.from(files);
    if (!list.length) return [];
    setUploading(true);
    setUploadProgress(`Envoi… 0/${list.length}`);
    const uploaded: MsgAttachment[] = [];
    try {
      let i = 0;
      for (const raw of list) {
        i += 1;
        if (!(raw instanceof File) || !raw.size) continue;
        setUploadProgress(`Envoi… ${i}/${list.length}`);
        let file = raw;
        if (file.size > MESSAGERIE_MEDIA_MAX_BYTES) {
          setError(
            `« ${file.name} » dépasse 15 Mo. Compressez la photo ou choisissez un fichier plus léger, puis réessayez.`,
          );
          continue;
        }
        if (file.type.startsWith("image/")) {
          file = await compressImageForMessagerie(file);
        }
        const fd = new FormData();
        fd.append("file", file);
        if (opts?.durationSec != null) fd.append("durationSec", String(opts.durationSec));
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
            setError(data?.error ?? `Échec de l’envoi de « ${file.name} »`);
          }
        } catch {
          setError(`Échec réseau pour « ${file.name} ». Réessayez.`);
        }
      }
      if (uploaded.length) setAttachments((prev) => [...prev, ...uploaded]);
      return uploaded;
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  async function sendMessage(content: string, atts: MsgAttachment[], opts?: { skipParticipateConfirm?: boolean }) {
    if ((!content && atts.length === 0) || !selectedProjectId || sending) return;
    if (sendLockRef.current) return;

    // RECETTE-V1 — superviseur non participant : dialogue BeWork avant join
    if (isChannelSupervisor && !opts?.skipParticipateConfirm) {
      setParticipateConfirm({ content, atts });
      return;
    }

    sendLockRef.current = true;
    setError("");
    const tempId = `temp-${Date.now()}`;
    const preview = formatMediaPreview(content, atts) || content || "Pièce jointe";
    const optimistic: MessageItem = {
      id: tempId,
      content: preview,
      read: false,
      channel,
      channelId: selectedChannelId || null,
      attachmentsJson: atts.length ? atts : null,
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
    const replySnapshot = replyTarget;
    setSending(true);
    setSendContent("");
    setAttachments([]);
    setReplyTarget(null);
    setMessages((prev) => [optimistic, ...prev]);
    try {
      const body: {
        projectId: string;
        content: string;
        channel: MessageChannel;
        channelId?: string;
        receiverId?: string;
        attachments?: MsgAttachment[];
        replyTo?: MessageReplyMeta;
      } = {
        projectId: selectedProjectId,
        content,
        channel,
        channelId: selectedChannelId || undefined,
        attachments: atts.length ? atts : undefined,
        ...(replySnapshot ? { replyTo: replySnapshot } : {}),
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
        setAttachments(atts);
        setError(
          data?.code === "CHANNEL_MEMBERSHIP_REQUIRED"
            ? data.error ?? "Impossible de rejoindre la conversation. Message non envoyé."
            : (data.error ?? "Échec de l’envoi — réessayez."),
        );
        return;
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                ...data,
                channel: data.channel ?? channel,
                attachmentsJson: data.attachmentsJson ?? atts,
              }
            : m,
        ),
      );
      // Après envoi réussi, l’auteur est participant (garanti serveur)
      if (isChannelSupervisor) {
        setIsChannelSupervisor(false);
        setIsChannelParticipant(true);
        setSupervisorInfo(null);
        if (selectedChannelId) {
          void fetch(
            `/api/messages/channels/${encodeURIComponent(selectedChannelId)}/participants`,
          )
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
              if (Array.isArray(d?.participants)) setParticipants(d.participants);
            });
        }
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setSendContent(content);
      setAttachments(atts);
      setError("Erreur de connexion — média conservé, réessayez.");
    } finally {
      setSending(false);
      sendLockRef.current = false;
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    await sendMessage(sendContent.trim(), attachments);
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
    <div className="relative flex h-[calc(100vh-12rem)] overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
      {/* Colonne gauche : chantiers → conversations imbriquées */}
      <aside
        className={`w-full shrink-0 flex-col border-r border-slate-200 bg-white md:flex md:w-[min(100%,340px)] ${
          mobileShowThread ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="border-b border-slate-100 px-4 py-3 md:hidden">
          {mobileLevel === "channels" && selectedProject ? (
            <ContextBackButton
              label="Chantiers"
              fallbackHref="/dashboard/messagerie?view=chantiers"
              onBack={() => {
                setMobileLevel("projects");
                setExpandedProjectId("");
              }}
            />
          ) : (
            <h2 className="text-base font-semibold text-slate-900">Par chantier</h2>
          )}
        </div>
        <div className="hidden border-b border-slate-100 px-4 py-3 md:block">
          <h2 className="text-sm font-semibold text-slate-900">Par chantier</h2>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {conversationsList.length === 0 ? (
            <p className="p-4 text-center text-sm text-slate-500">Aucun chantier.</p>
          ) : (
            conversationsList.map((p) => {
              const expanded = expandedProjectId === p.id;
              const channels = channelsByProject[p.id] ?? (p.id === selectedProjectId ? projectChannels : []);
              return (
                <div key={p.id} className={`${mobileLevel === "channels" && selectedProjectId !== p.id ? "hidden md:block" : ""}`}>
                  <button
                    type="button"
                    onClick={() => {
                      if (expanded && mobileLevel !== "channels") {
                        setExpandedProjectId("");
                      } else {
                        void expandProject(p.id);
                      }
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2.5 text-left transition motion-safe:duration-150 ${
                      selectedProjectId === p.id ? "bg-slate-50" : "hover:bg-slate-50/80"
                    }`}
                  >
                    <span className="w-4 shrink-0 text-xs text-slate-400">{expanded ? "▾" : "›"}</span>
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold uppercase tracking-wide text-slate-700">
                      {p.title}
                    </span>
                  </button>
                  {expanded ? (
                    <ul className="pb-2 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-150">
                      {channels.length === 0 ? (
                        <li className="px-8 py-2 text-xs text-slate-400">Chargement…</li>
                      ) : (
                        channels.map((ch) => {
                          const shortMeta =
                            ch.type === "INTERNAL"
                              ? "Interne"
                              : ch.type === "SUPPLIER"
                                ? "Fournisseur"
                                : ch.type === "CLIENT"
                                  ? "Client"
                                  : ch.metaLabel?.replace(" · Externe", "") || "";
                          const icon =
                            ch.type === "INTERNAL" ? "🔒" : ch.type === "SUPPLIER" ? "🏢" : "👤";
                          return (
                            <li key={ch.id}>
                              <button
                                type="button"
                                onClick={() => selectChannel(p.id, ch)}
                                className={`flex w-full items-start gap-2 py-2 pl-8 pr-3 text-left transition motion-safe:duration-150 ${
                                  selectedChannelId === ch.id
                                    ? "bg-[#1e3a5f]/[0.06] ring-1 ring-inset ring-[#1e3a5f]/10"
                                    : "hover:bg-slate-50"
                                }`}
                              >
                                <span className="mt-0.5 text-xs" aria-hidden>
                                  {icon}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium text-slate-900">
                                    {ch.title}
                                  </span>
                                  <span className="text-[11px] text-slate-500">{shortMeta}</span>
                                </span>
                                {ch.unreadCount > 0 ? (
                                  <span className="mt-0.5 inline-flex h-5 min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] px-1 text-[10px] font-bold text-white">
                                    {ch.unreadCount}
                                  </span>
                                ) : null}
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
        {!hideNewDemande ? (
          <div className="border-t border-slate-100 p-3">
            <Link
              href="/dashboard/nouvelle-demande"
              className="block w-full rounded-xl bg-[#1e3a5f] py-2.5 text-center text-sm font-medium text-white hover:bg-[#162d4a]"
            >
              Créer une demande
            </Link>
          </div>
        ) : null}
      </aside>

      {/* Zone centrale : chat */}
      <div
        className={`min-w-0 flex-1 flex-col ${
          mobileShowThread ? "flex" : "hidden md:flex"
        }`}
      >
        {selectedProjectId && selectedProject ? (
          <>
            <div className="shrink-0 border-b border-slate-100 px-4 py-3">
              <div className="mb-2 flex items-center gap-2 md:hidden">
                <ContextBackButton
                  label={selectedProject.title}
                  fallbackHref="/dashboard/messagerie?view=chantiers"
                  onBack={() => {
                    setMobileShowThread(false);
                    setMobileLevel("channels");
                  }}
                />
                <button
                  type="button"
                  onClick={() => setContextOpen(true)}
                  className="ml-auto rounded-full p-2 text-slate-500 hover:bg-slate-100"
                  title="Contexte"
                  aria-label="Contexte chantier"
                >
                  ⓘ
                </button>
              </div>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[17px] font-semibold text-slate-900">
                    {presentation.scopeType === "INTERNAL"
                      ? `🔒 ${presentation.displayName}`
                      : presentation.displayName}
                  </h3>
                  <p className="mt-0.5 truncate text-[12px] text-slate-500">
                    {[
                      presentation.scopeBadge,
                      presentation.projectTitle,
                      presentation.participantCount > 0
                        ? `${presentation.participantCount} participant${presentation.participantCount > 1 ? "s" : ""}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="relative hidden shrink-0 items-center gap-1 md:flex">
                  <button
                    type="button"
                    onClick={() => {
                      setContextOpen(false);
                      setParticipantsOpen((v) => !v);
                    }}
                    className="rounded-full px-2.5 py-1 text-xs font-semibold text-[#1e3a5f] hover:bg-slate-100"
                  >
                    {presentation.participantCount || "—"} participants
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setParticipantsOpen(false);
                      setContextOpen((v) => !v);
                    }}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      contextOpen ? "bg-slate-100 text-slate-800" : "text-slate-500 hover:bg-slate-100"
                    }`}
                    title="Contexte"
                  >
                    ⓘ
                  </button>
                  {participantsOpen ? (
                    <>
                      <button
                        type="button"
                        className="fixed inset-0 z-40 cursor-default bg-transparent"
                        aria-label="Fermer participants"
                        onClick={() => setParticipantsOpen(false)}
                      />
                      <div
                        role="dialog"
                        aria-label="Participants"
                        className="absolute right-0 top-9 z-50 max-h-64 w-72 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
                      >
                        <p className="px-1 pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Participants
                        </p>
                        <ul className="space-y-0.5">
                          {participants.map((p) => (
                            <li
                              key={p.id}
                              className="flex items-center gap-2 rounded-lg px-1 py-1.5 text-xs"
                            >
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-[10px] font-bold text-white">
                                {p.name
                                  .split(/\s+/)
                                  .slice(0, 2)
                                  .map((x) => x[0]?.toUpperCase() ?? "")
                                  .join("")}
                              </span>
                              <span className="min-w-0">
                                <span className="block font-semibold text-slate-800">{p.name}</span>
                                <span className="text-slate-500">
                                  {p.subtitle ||
                                    [p.company, p.roleLabel || p.permissionProfile]
                                      .filter(Boolean)
                                      .join(" · ")}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                        {isChannelSupervisor && supervisorInfo ? (
                          <>
                            <p className="px-1 pt-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                              Supervision
                            </p>
                            <div className="flex items-center gap-2 px-1 py-1.5 text-xs">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-600 text-[10px] font-bold text-white">
                                {supervisorInfo.name
                                  .split(/\s+/)
                                  .slice(0, 2)
                                  .map((x) => x[0]?.toUpperCase() ?? "")
                                  .join("")}
                              </span>
                              <span className="min-w-0">
                                <span className="block font-semibold text-slate-800">
                                  {supervisorInfo.name}
                                </span>
                                <span className="text-slate-500">{supervisorInfo.roleLabel}</span>
                              </span>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
              {isChannelSupervisor ? (
                <p className="mt-1 text-[11px] text-slate-500">
                  Vous consultez cette conversation en supervision. Si vous écrivez, vous
                  rejoindrez les participants.
                </p>
              ) : null}
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {conversationMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                    <p className="text-base font-semibold text-slate-800">{presentation.displayName}</p>
                    <p className="mt-2 max-w-sm text-sm text-slate-500">
                      Aucun message pour le moment.
                      {presentation.scopeType === "INTERNAL"
                        ? " Démarrez la conversation avec votre équipe."
                        : " Démarrez la conversation."}
                    </p>
                  </div>
                ) : null}
                {conversationMessages.map((m) => {
                  const isMe = m.sender.id === sessionUserId;
                  const atts = Array.isArray(m.attachmentsJson) ? m.attachmentsJson : [];
                  const parsed = parseContentWithReply(m.content || "");
                  const deletedIds = new Set(
                    conversationMessages.filter((x) => x.deletedAt).map((x) => x.id),
                  );
                  const reply = maybeRedactReplyExcerpt(parsed.reply, deletedIds);
                  const hasText =
                    Boolean(parsed.body) && !atts.some((a) => a.name === m.content);
                  const deletedLabel = deletedMessageLabel(m, sessionUserId);
                  const ch = (m.channel as MessageChannel) || channel;
                  return (
                    <div
                      key={m.id}
                      id={`msg-${m.id}`}
                      className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                    >
                      <Avatar name={m.sender.name} isMe={isMe} />
                      <div
                        className={`flex max-w-[75%] flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <MessageBubbleChrome
                          messageId={m.id}
                          isMe={isMe}
                          myUserId={sessionUserId}
                          capabilities={{
                            reply: !m.deletedAt,
                            react: false,
                            bework: !m.deletedAt,
                            important: true,
                            pin: true,
                            forward: !m.deletedAt,
                            copy: hasText && !m.deletedAt,
                            infos: true,
                            delete: !m.deletedAt,
                            select: false,
                          }}
                          isImportant={isMessageImportant("PROJECT", m.id)}
                          isPinned={isMessagePinnedPersonal("PROJECT", m.id)}
                          selectionMode={false}
                          selected={false}
                          highlighted={flashMsgId === m.id}
                          onToggleSelect={() => {}}
                          onAction={(action: MessageMenuActionId) => {
                            if (action === "reply") {
                              setReplyTarget({
                                id: m.id,
                                senderName: m.sender.name,
                                excerpt: makeReplyExcerpt(
                                  parsed.body || atts[0]?.name || "Pièce jointe",
                                ),
                              });
                              return;
                            }
                            if (action === "important") {
                              toggleMessageImportant("PROJECT", m.id);
                              setPersonalTick((t) => t + 1);
                              return;
                            }
                            if (action === "pin") {
                              toggleMessagePinnedPersonal("PROJECT", m.id);
                              setPersonalTick((t) => t + 1);
                              return;
                            }
                            if (action === "copy" && parsed.body) {
                              void navigator.clipboard?.writeText(parsed.body).then(() => {
                                setCopiedHint(true);
                                window.setTimeout(() => setCopiedHint(false), 1500);
                              });
                              return;
                            }
                            if (action === "forward") {
                              setForwardSourceId(m.id);
                              setForwardOpen(true);
                              return;
                            }
                            if (action === "delete") {
                              if (m.deletedAt) return;
                              setDeleteError(null);
                              setDeleteDialog({ ids: [m.id], isMine: isMe });
                              return;
                            }
                            if (action === "infos") {
                              setInfosData({
                                senderName: m.sender.name,
                                conversationLabel: m.project.title,
                                partyLabel: CHANNEL_LABELS[ch],
                                sentAt: new Date(m.createdAt).toLocaleString("fr-FR", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }),
                                attachmentSummary: m.deletedAt
                                  ? "Message supprimé"
                                  : atts.length
                                    ? `${atts.length} pièce(s) jointe(s)`
                                    : undefined,
                                replyToLabel: m.deletedAt
                                  ? deletedMessageLabel(m, sessionUserId)
                                  : reply
                                    ? `${reply.senderName} — ${reply.excerpt}`
                                    : null,
                              });
                              setInfosOpen(true);
                            }
                          }}
                          onReact={() => {}}
                          footer={
                            deletedLabel ? null : (
                            <MessageBeworkActions
                              messageId={m.id}
                              messageKind="PROJECT"
                              content={parsed.body || m.content}
                              hasMedia={atts.some(
                                (a) => isAudioAttachment(a) || isImageAttachment(a),
                              )}
                              isMe={isMe}
                            />
                            )
                          }
                        >
                          <div
                            className={`rounded-2xl px-4 py-2.5 ${
                              isMe
                                ? "rounded-tr-md bg-[#1d4ed8] text-white"
                                : "rounded-tl-md bg-slate-100 text-slate-800"
                            }`}
                          >
                            {deletedLabel ? (
                              <p className={`text-[13px] italic ${isMe ? "text-white/80" : "text-slate-500"}`}>
                                {deletedLabel}
                              </p>
                            ) : (
                              <>
                            <p className="text-xs font-medium opacity-90">{m.sender.name}</p>
                            {reply ? (
                              <div className={isMe ? "text-white/90" : ""}>
                                <MessageReplyQuote
                                  reply={reply}
                                  onJump={(id) => {
                                    setFlashMsgId(id);
                                    document
                                      .getElementById(`msg-${id}`)
                                      ?.scrollIntoView({ behavior: "smooth", block: "center" });
                                    window.setTimeout(() => setFlashMsgId(null), 1600);
                                  }}
                                />
                              </div>
                            ) : null}
                            {hasText ? (
                              <MessageExpandableBody
                                text={parsed.body}
                                className={isMe ? "text-white" : ""}
                              />
                            ) : null}
                            {atts.length > 0 ? (
                              <MessagerieAttachmentsBlock
                                messageKind="PROJECT"
                                messageId={m.id}
                                attachments={atts}
                                isMe={isMe}
                              />
                            ) : null}
                              </>
                            )}
                          </div>
                        </MessageBubbleChrome>
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
              {replyTarget ? (
                <MessageReplyComposerBanner
                  reply={replyTarget}
                  onClear={() => setReplyTarget(null)}
                />
              ) : null}
              <p
                className={`mb-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                  presentation.scopeType === "INTERNAL"
                    ? "bg-slate-100 text-slate-800"
                    : presentation.scopeType === "SUPPLIER"
                      ? "bg-amber-50/80 text-amber-950"
                      : presentation.scopeType === "CLIENT"
                        ? "bg-sky-50/80 text-sky-950"
                        : "bg-slate-50 text-slate-700"
                }`}
                data-channel-scope={presentation.scopeType}
                data-testid="channel-composer-scope"
              >
                {presentation.composerLabel}
              </p>
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
              <input
                id="chantier-camera-input"
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
              <input
                id="chantier-photo-input"
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
                id="chantier-doc-input"
                type="file"
                accept=".pdf,.docx,.xlsx,.xls,.csv,.txt,.doc"
                className="sr-only"
                multiple
                onChange={(e) => {
                  if (e.target.files?.length) void uploadFiles(e.target.files);
                  setAttachMenuOpen(false);
                  e.target.value = "";
                }}
              />
              {uploadProgress ? (
                <p className="mb-2 text-xs font-semibold text-[#1d4ed8]">{uploadProgress}</p>
              ) : null}
              {photoPreview ? (
                <div className="mb-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="mb-2 text-sm font-semibold text-slate-800">
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
                    className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={uploading || sending}
                      onClick={async () => {
                        if (!photoPreview) return;
                        const comment = photoPreview.comment.trim();
                        const uploaded = await uploadFiles(photoPreview.files);
                        setPhotoPreview(null);
                        if (uploaded.length) await sendMessage(comment, uploaded);
                      }}
                      className="rounded-full bg-[#1d4ed8] px-4 py-1.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      Envoyer
                    </button>
                  </div>
                </div>
              ) : null}
              {attachments.length > 0 ? (
                <div className="mb-2 flex flex-wrap gap-2">
                  {attachments.map((a, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs"
                    >
                      {isAudioAttachment(a) ? "🎤" : isImageAttachment(a) ? "📷" : "📄"} {a.name}
                      <button
                        type="button"
                        onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))}
                        className="text-slate-500 hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
              <form onSubmit={handleSend} className="flex gap-2">
                <div className="relative flex min-w-0 flex-1 items-end gap-2">
                  <div className="relative mb-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAttachMenuOpen((v) => !v);
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
                      title="Joindre"
                    >
                      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                      </svg>
                    </button>
                    {attachMenuOpen ? (
                      <div className="absolute bottom-12 left-0 z-30 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                        <label
                          htmlFor="chantier-camera-input"
                          className="block cursor-pointer px-3 py-2.5 text-sm hover:bg-slate-50"
                        >
                          Prendre une photo
                        </label>
                        <label
                          htmlFor="chantier-photo-input"
                          className="block cursor-pointer px-3 py-2.5 text-sm hover:bg-slate-50"
                        >
                          Choisir une photo
                        </label>
                        <label
                          htmlFor="chantier-doc-input"
                          className="block cursor-pointer px-3 py-2.5 text-sm hover:bg-slate-50"
                          onClick={() => setAttachMenuOpen(false)}
                        >
                          Document
                        </label>
                      </div>
                    ) : null}
                  </div>
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
                        if ((sendContent.trim() || attachments.length > 0) && !sending) {
                          void (e.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
                        }
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={sending || (!sendContent.trim() && attachments.length === 0)}
                    className="mb-0.5 shrink-0 rounded-xl bg-[#1d4ed8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1e40af] disabled:opacity-50"
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

      {/* Colonne droite : contexte (facultatif) */}
      {contextOpen ? (
      <aside className="absolute inset-y-0 right-0 z-30 flex w-[min(100%,288px)] shrink-0 flex-col border-l border-slate-200 bg-white shadow-xl md:static md:shadow-none">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-800">Contexte</h2>
          <button
            type="button"
            onClick={() => setContextOpen(false)}
            className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        {selectedProject ? (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Chantier</p>
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
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Responsable</p>
                  <p className="mt-0.5 text-sm font-medium text-slate-800">{selectedProject.assignedTo.name}</p>
                </div>
              )}

              {projectDocuments.length > 0 && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Documents récents</p>
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

              {selectedChannelId ? (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Participants du canal
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {participants.slice(0, 4).map((p) => (
                      <li key={p.id} className="text-xs">
                        <span className="font-semibold text-slate-800">{p.name}</span>
                        <span className="block text-slate-500">
                          {p.subtitle ||
                            [p.company, p.roleLabel].filter(Boolean).join(" · ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {participants.length > 4 ? (
                    <button
                      type="button"
                      onClick={() => setParticipantsOpen(true)}
                      className="mt-2 text-xs font-semibold text-[#1e3a5f] hover:underline"
                    >
                      Voir les participants
                    </button>
                  ) : participants.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setParticipantsOpen(true)}
                      className="mt-2 text-xs font-semibold text-[#1e3a5f] hover:underline"
                    >
                      Voir les participants
                    </button>
                  ) : null}
                  {canManageParticipants ? (
                    <button
                      type="button"
                      onClick={() => {
                        setManageSelected(new Set(participants.map((p) => p.id)));
                        setManageOpen(true);
                      }}
                      className="mt-2 block text-xs font-semibold text-[#1e3a5f] hover:underline"
                    >
                      Gérer les participants
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div className="space-y-2 border-t border-slate-200 pt-4">
                <Link
                  href={withReturnTo(
                    `/dashboard/projets/${selectedProject.id}`,
                    messagerieReturnTo({
                      projectId: selectedProject.id,
                      channelId: selectedChannelId || null,
                    }),
                  )}
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Voir le chantier
                </Link>
                <Link
                  href="/dashboard/documents"
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Documents
                </Link>
                <Link
                  href={`/dashboard/agenda?project=${selectedProject.id}`}
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Agenda
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-4 text-center text-sm text-slate-500">
            Sélectionnez une conversation pour voir le contexte chantier.
          </div>
        )}
      </aside>
      ) : null}

      <MessageInfosPanel
        open={infosOpen}
        onClose={() => setInfosOpen(false)}
        data={infosData}
      />
      <MessageDeleteDialog
        open={Boolean(deleteDialog)}
        isMine={Boolean(deleteDialog?.isMine)}
        count={deleteDialog?.ids.length ?? 1}
        pending={deletePending}
        error={deleteError}
        onCancel={() => {
          if (deletePending) return;
          setDeleteDialog(null);
          setDeleteError(null);
        }}
        onDeleteMe={() => void confirmProjectDelete("me")}
        onDeleteEveryone={
          deleteDialog?.isMine ? () => void confirmProjectDelete("everyone") : undefined
        }
      />
      <MessageForwardDialog
        open={forwardOpen}
        onClose={() => {
          setForwardOpen(false);
          setForwardSourceId(null);
        }}
        sourceScope={scopeFromChannel(channel)}
        destinations={
          projects
            .filter((p) => p.id !== selectedProjectId)
            .slice(0, 30)
            .map(
              (p): ForwardDestOption => ({
                id: p.id,
                kind: "PROJECT",
                label: p.title,
                sublabel: CHANNEL_LABELS[channel],
                scope: scopeFromChannel(channel),
              }),
            )
        }
        onConfirm={async (dest, confirmExternal) => {
          if (!forwardSourceId) throw new Error("Message source manquant");
          const res = await fetch("/api/messages/forward", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceKind: "PROJECT",
              sourceMessageId: forwardSourceId,
              destKind: dest.kind,
              destId: dest.id,
              channel,
              confirmExternal,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (res.status === 409 && data?.needsConfirm) {
            throw new Error(data.error || "Confirmation requise");
          }
          if (!res.ok) throw new Error(data?.error || "Transfert impossible");
        }}
      />
      {participateConfirm ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-sm font-semibold text-[#1e3a5f]">
              Participer à cette conversation ?
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-700">
              {(selectedChannel?.title || "Ce fil")} verra désormais{" "}
              {supervisorInfo?.name || "vous"} comme participant. Les autres sauront que vous
              faites partie du fil.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                onClick={() => setParticipateConfirm(null)}
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={sending}
                className="rounded-lg bg-[#1e3a5f] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                onClick={() => {
                  const pending = participateConfirm;
                  setParticipateConfirm(null);
                  if (pending) {
                    void sendMessage(pending.content, pending.atts, {
                      skipParticipateConfirm: true,
                    });
                  }
                }}
              >
                Participer et envoyer
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {manageOpen && selectedChannelId ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="max-h-[85vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Gérer les participants</h3>
                <p className="text-[11px] text-slate-500">
                  {selectedChannel?.title} · {selectedProject?.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManageOpen(false)}
                className="rounded-full px-2 py-1 text-slate-500 hover:bg-slate-100"
              >
                ×
              </button>
            </div>
            <div className="max-h-[55vh] space-y-4 overflow-y-auto px-4 py-3">
              {manageCandidates.internals.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Internes disponibles
                  </p>
                  <ul className="space-y-1">
                    {manageCandidates.internals.map((c) => (
                      <li key={c.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={manageSelected.has(c.id)}
                            onChange={() => {
                              setManageSelected((prev) => {
                                const next = new Set(prev);
                                if (next.has(c.id)) next.delete(c.id);
                                else next.add(c.id);
                                return next;
                              });
                            }}
                          />
                          <span className="min-w-0 text-sm">
                            <span className="font-medium text-slate-800">{c.name}</span>
                            <span className="block text-[11px] text-slate-500">
                              {[c.company, c.roleLabel].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {manageCandidates.externals.length > 0 ? (
                <div>
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {selectedChannel?.title ?? "Organisation externe"}
                  </p>
                  <ul className="space-y-1">
                    {manageCandidates.externals.map((c) => (
                      <li key={c.id}>
                        <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={manageSelected.has(c.id)}
                            onChange={() => {
                              setManageSelected((prev) => {
                                const next = new Set(prev);
                                if (next.has(c.id)) next.delete(c.id);
                                else next.add(c.id);
                                return next;
                              });
                            }}
                          />
                          <span className="min-w-0 text-sm">
                            <span className="font-medium text-slate-800">{c.name}</span>
                            <span className="block text-[11px] text-slate-500">
                              {[c.company, c.roleLabel].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3">
              <button
                type="button"
                onClick={() => setManageOpen(false)}
                className="rounded-full px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={manageSaving}
                onClick={async () => {
                  if (!selectedChannelId) return;
                  setManageSaving(true);
                  try {
                    const res = await fetch(
                      `/api/messages/channels/${encodeURIComponent(selectedChannelId)}/participants`,
                      {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ userIds: [...manageSelected] }),
                      },
                    );
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(data?.error || "Enregistrement impossible");
                    setParticipants(Array.isArray(data.participants) ? data.participants : []);
                    setIsChannelParticipant(manageSelected.has(sessionUserId));
                    setIsChannelSupervisor(false);
                    setManageOpen(false);
                    if (selectedProjectId) void loadProjectChannels(selectedProjectId);
                  } catch (e) {
                    setError(e instanceof Error ? e.message : "Erreur d’enregistrement");
                  } finally {
                    setManageSaving(false);
                  }
                }}
                className="rounded-full bg-[#1e3a5f] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-50"
              >
                {manageSaving ? "…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {copiedHint ? (
        <div className="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 rounded-full bg-[#1e3a5f] px-4 py-2 text-sm font-medium text-white shadow-lg">
          Copié
        </div>
      ) : null}
    </div>
  );
}
