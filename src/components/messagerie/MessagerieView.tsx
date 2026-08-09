"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { VoiceRecorderPanel } from "@/components/messagerie/VoiceRecorderPanel";
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

type MessageChannel = "INTERNE" | "CLIENT" | "FOURNISSEUR";

type MessageItem = {
  id: string;
  content: string;
  read: boolean;
  channel?: string;
  attachmentsJson?: MsgAttachment[] | null;
  createdAt: string;
  project: { id: string; title: string };
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
};

const CHANNEL_LABELS: Record<MessageChannel, string> = {
  INTERNE: "🔒 Interne",
  CLIENT: "Client · Externe",
  FOURNISSEUR: "Fournisseur · Externe",
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
  const [attachments, setAttachments] = useState<MsgAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<{ files: File[]; comment: string } | null>(
    null,
  );
  const sendLockRef = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (
      initialChannel === "INTERNE" ||
      initialChannel === "FOURNISSEUR" ||
      initialChannel === "CLIENT"
    ) {
      setChannel(initialChannel);
    }
  }, [initialChannel]);

  useEffect(() => {
    if (initialProjectId) setSelectedProjectId(initialProjectId);
  }, [initialProjectId]);

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

  useEffect(() => {
    return subscribeMessagerieEvents((ev) => {
      if (ev.kind !== "PROJECT") return;
      if (!selectedProjectId || !ev.href.includes(selectedProjectId)) return;
      void loadMessages(channel);
    });
  }, [selectedProjectId, channel]);

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
            `« ${file.name} » dépasse 15 Mo. Compressez la photo ou raccourcissez le vocal, puis réessayez.`,
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

  async function sendMessage(content: string, atts: MsgAttachment[]) {
    if ((!content && atts.length === 0) || !selectedProjectId || sending) return;
    if (sendLockRef.current) return;
    sendLockRef.current = true;
    setError("");
    const tempId = `temp-${Date.now()}`;
    const preview = formatMediaPreview(content, atts) || content || "Pièce jointe";
    const optimistic: MessageItem = {
      id: tempId,
      content: preview,
      read: false,
      channel,
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
    setSending(true);
    setSendContent("");
    setAttachments([]);
    setMessages((prev) => [optimistic, ...prev]);
    try {
      const body: {
        projectId: string;
        content: string;
        channel: MessageChannel;
        receiverId?: string;
        attachments?: MsgAttachment[];
      } = {
        projectId: selectedProjectId,
        content,
        channel,
        attachments: atts.length ? atts : undefined,
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
        setError(data.error ?? "Échec de l’envoi — réessayez.");
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
                        {lastMsg.sender.name} :{" "}
                        {formatMediaPreview(
                          lastMsg.content,
                          lastMsg.attachmentsJson ?? null,
                        ).slice(0, 40)}
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
                    ? "border-slate-300 bg-slate-100 text-slate-800"
                    : channel === "FOURNISSEUR"
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-sky-200 bg-sky-50 text-sky-900"
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
                  const atts = Array.isArray(m.attachmentsJson) ? m.attachmentsJson : [];
                  return (
                    <div
                      key={m.id}
                      className={`group flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}
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
                          {m.content && !atts.some((a) => a.name === m.content) ? (
                            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">
                              {m.content}
                            </p>
                          ) : null}
                          {atts.length > 0 ? (
                            <MessagerieAttachmentsBlock
                              messageKind="PROJECT"
                              messageId={m.id}
                              attachments={atts}
                              isMe={isMe}
                            />
                          ) : null}
                        </div>
                        <MessageBeworkActions
                          messageId={m.id}
                          messageKind="PROJECT"
                          content={m.content}
                          hasMedia={atts.some(
                            (a) => isAudioAttachment(a) || isImageAttachment(a),
                          )}
                          isMe={isMe}
                        />
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
              <p
                className={`mb-2 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  channel === "INTERNE"
                    ? "bg-slate-100 text-slate-700"
                    : channel === "FOURNISSEUR"
                      ? "bg-amber-50 text-amber-900"
                      : "bg-sky-50 text-sky-900"
                }`}
              >
                {channel === "INTERNE"
                  ? `Message INTERNE · ${selectedProject.title}`
                  : channel === "FOURNISSEUR"
                    ? `Message à Point.P / fournisseur · EXTERNE · ${selectedProject.title}`
                    : `Message client · EXTERNE · ${selectedProject.title}`}
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
              {voiceOpen ? (
                <div className="mb-2">
                  <VoiceRecorderPanel
                    sending={uploading || sending}
                    onCancel={() => setVoiceOpen(false)}
                    onSend={async (file, durationSec) => {
                      const uploaded = await uploadFiles([file], { durationSec });
                      setVoiceOpen(false);
                      if (uploaded.length) await sendMessage("", uploaded);
                    }}
                  />
                </div>
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
                        setVoiceOpen(false);
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
                    type="button"
                    onClick={() => {
                      setAttachMenuOpen(false);
                      setVoiceOpen((v) => !v);
                    }}
                    className={`mb-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                      voiceOpen ? "bg-[#1d4ed8] text-white" : "text-slate-600 hover:bg-slate-100"
                    }`}
                    title="Message vocal"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                    </svg>
                  </button>
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

      {/* Colonne droite : contexte chantier */}
      <aside className="flex w-72 shrink-0 flex-col border-l border-slate-200 bg-slate-50/40">
        <div className="border-b border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-800">Contexte chantier</h2>
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

              <div className="space-y-2 border-t border-slate-200 pt-4">
                <Link
                  href={`/dashboard/projets/${selectedProject.id}`}
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
    </div>
  );
}
