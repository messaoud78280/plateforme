"use client";

import { useEffect, useState } from "react";
import { FileText, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { isImageAttachment, type MsgAttachment } from "@/lib/messagerie/media-preview";

function formatSize(bytes: number | undefined): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Aperçu compact des PJ dans le composer (avant envoi message).
 * Les miniatures images utilisent `previewUrl` local si fourni.
 */
export function MessagerieComposerAttachments({
  attachments,
  previewUrls,
  onRemove,
  tone = "missions",
}: {
  attachments: MsgAttachment[];
  /** Object URLs locales indexées par fileUrl ou name */
  previewUrls?: Record<string, string>;
  onRemove: (index: number) => void;
  tone?: "missions" | "chantier";
}) {
  if (!attachments.length) return null;

  return (
    <ul className="mb-2 flex flex-wrap gap-2 px-1" aria-label="Pièces jointes à envoyer">
      {attachments.map((a, i) => {
        const key = a.fileUrl || a.name;
        const preview = previewUrls?.[key] ?? previewUrls?.[a.name];
        const image = isImageAttachment(a);
        const size = formatSize(a.fileSize);
        return (
          <li
            key={`${key}-${i}`}
            className={cn(
              "flex max-w-[220px] items-center gap-2 rounded-xl border px-2 py-1.5 text-xs shadow-sm",
              tone === "chantier"
                ? "border-slate-200 bg-white text-slate-800"
                : "border-[#d1d7db] bg-white text-[#111b21]",
            )}
          >
            {image && preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt=""
                className="h-10 w-10 shrink-0 rounded-lg object-cover"
              />
            ) : image ? (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                📷
              </span>
            ) : (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <FileText className="h-4 w-4" aria-hidden />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{a.name}</span>
              {size ? (
                <span className="block text-[10px] text-slate-500">{size}</span>
              ) : null}
            </span>
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
              aria-label={`Retirer ${a.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Hook léger : conserve des object URLs pour miniatures composer. */
export function useAttachmentPreviewUrls() {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    return () => {
      Object.values(urls).forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {
          /* ignore */
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup on unmount only
  }, []);

  function rememberPreview(key: string, file: File) {
    if (!file.type.startsWith("image/")) return;
    const next = URL.createObjectURL(file);
    setUrls((prev) => {
      if (prev[key]) {
        try {
          URL.revokeObjectURL(prev[key]!);
        } catch {
          /* ignore */
        }
      }
      return { ...prev, [key]: next };
    });
  }

  function forgetPreview(key: string) {
    setUrls((prev) => {
      const cur = prev[key];
      if (cur) {
        try {
          URL.revokeObjectURL(cur);
        } catch {
          /* ignore */
        }
      }
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  }

  function clearPreviews() {
    setUrls((prev) => {
      Object.values(prev).forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {
          /* ignore */
        }
      });
      return {};
    });
  }

  return { previewUrls: urls, rememberPreview, forgetPreview, clearPreviews };
}
