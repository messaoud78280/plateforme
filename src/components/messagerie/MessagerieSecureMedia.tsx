"use client";

import { useEffect, useState } from "react";
import { AudioMessagePlayer } from "@/components/messagerie/AudioMessagePlayer";
import { SignedFileLink } from "@/components/files/SignedFileLink";
import {
  isAudioAttachment,
  isImageAttachment,
  type MsgAttachment,
} from "@/lib/messagerie/media-preview";
import type { MessagerieMessageKind } from "@/lib/messagerie/media-acl";

type Props = {
  messageKind: MessagerieMessageKind;
  messageId: string;
  attachment: MsgAttachment;
  isMe?: boolean;
};

async function resolveSignedUrl(
  messageKind: MessagerieMessageKind,
  messageId: string,
  fileUrl: string,
): Promise<string | null> {
  // Blob / object URL locaux (optimistic avant upload terminé)
  if (fileUrl.startsWith("blob:") || fileUrl.startsWith("data:")) return fileUrl;

  const res = await fetch("/api/messagerie/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messageKind, messageId, fileUrl }),
  });
  if (!res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { signedUrl?: string };
  return data.signedUrl || null;
}

/** Image messagerie : signed URL après ACL, lazy. */
export function MessagerieSecureImage({ messageKind, messageId, attachment }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setErr(false);
    setSrc(null);
    void resolveSignedUrl(messageKind, messageId, attachment.fileUrl).then((url) => {
      if (cancelled) return;
      if (!url) setErr(true);
      else setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [messageKind, messageId, attachment.fileUrl]);

  if (err) {
    return (
      <p className="rounded-lg bg-black/5 px-2 py-2 text-xs text-red-600">
        Accès photo refusé ou fichier indisponible.
      </p>
    );
  }
  if (!src) {
    return (
      <div className="flex h-28 w-full items-center justify-center rounded-lg bg-black/5 text-xs text-[#667781]">
        Chargement…
      </div>
    );
  }

  return (
    <a href={src} target="_blank" rel="noopener noreferrer" className="block">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={attachment.name}
        loading="lazy"
        decoding="async"
        className="max-h-56 w-full rounded-lg object-cover"
      />
    </a>
  );
}

/** Audio : résout l’URL au premier besoin (métadonnées / lecture). */
export function MessagerieSecureAudio({ messageKind, messageId, attachment }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void resolveSignedUrl(messageKind, messageId, attachment.fileUrl).then((url) => {
      if (cancelled) return;
      if (!url) setErr(true);
      else setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [messageKind, messageId, attachment.fileUrl]);

  if (err) {
    return <p className="text-xs text-red-600">Accès vocal refusé.</p>;
  }
  if (!src) {
    return <p className="text-xs text-[#667781]">Chargement vocal…</p>;
  }
  return <AudioMessagePlayer src={src} durationSec={attachment.durationSec} />;
}

export function MessagerieSecureFile({ messageKind, messageId, attachment, isMe }: Props) {
  const [busy, setBusy] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  async function open() {
    if (busy) return;
    setBusy(true);
    setFileError(null);
    try {
      const url = await resolveSignedUrl(messageKind, messageId, attachment.fileUrl);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      else setFileError("Accès document refusé.");
    } finally {
      setBusy(false);
    }
  }

  // Fichiers legacy encore en documents publics : SignedFileLink + ACL messagerie prioritaire
  if (!attachment.fileUrl.startsWith("storage://") && !attachment.fileUrl.includes("/dm/")) {
    return (
      <SignedFileLink
        url={attachment.fileUrl}
        className={`flex items-center gap-2 rounded-lg px-2 py-2 text-xs ${
          isMe ? "bg-black/5 text-[#111b21]" : "bg-black/5 text-[#111b21]"
        }`}
      >
        📄 {attachment.name}
      </SignedFileLink>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void open()}
        disabled={busy}
        className="flex w-full items-center gap-2 rounded-lg bg-black/5 px-2 py-2 text-left text-xs text-[#111b21] disabled:opacity-50"
      >
        📄 {attachment.name}
        <span className="text-[10px] text-[#667781]">{busy ? "…" : "Ouvrir"}</span>
      </button>
      {fileError ? <p className="mt-1 text-[11px] text-red-600">{fileError}</p> : null}
    </div>
  );
}

export function MessagerieAttachmentsBlock({
  messageKind,
  messageId,
  attachments,
  isMe,
}: {
  messageKind: MessagerieMessageKind;
  messageId: string;
  attachments: MsgAttachment[];
  isMe?: boolean;
}) {
  if (!attachments.length) return null;
  const images = attachments.filter(isImageAttachment);
  const audios = attachments.filter(isAudioAttachment);
  const files = attachments.filter((a) => !isAudioAttachment(a) && !isImageAttachment(a));

  return (
    <div className="mt-1.5 space-y-1.5">
      {audios.map((a, i) => (
        <MessagerieSecureAudio
          key={`a-${i}`}
          messageKind={messageKind}
          messageId={messageId}
          attachment={a}
          isMe={isMe}
        />
      ))}
      <div className={`grid gap-1.5 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {images.map((a, i) => (
          <MessagerieSecureImage
            key={`i-${i}`}
            messageKind={messageKind}
            messageId={messageId}
            attachment={a}
            isMe={isMe}
          />
        ))}
      </div>
      {files.map((a, i) => (
        <MessagerieSecureFile
          key={`f-${i}`}
          messageKind={messageKind}
          messageId={messageId}
          attachment={a}
          isMe={isMe}
        />
      ))}
    </div>
  );
}
