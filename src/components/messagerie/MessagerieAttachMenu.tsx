"use client";

import { useEffect, useRef } from "react";
import { FileText, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/** Formats images réellement acceptés par /api/messages/direct/upload. */
export const MESSAGERIE_PHOTO_ACCEPT =
  "image/jpeg,image/png,image/jpg,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp";

/** Formats document réellement acceptés par l’upload messagerie. */
export const MESSAGERIE_DOC_ACCEPT =
  ".pdf,.docx,.xlsx,.xls,.csv,.txt,.doc,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain";

export function pickMessageriePhotoFiles(list: FileList | File[] | null): File[] {
  if (!list) return [];
  return Array.from(list)
    .filter((f) => {
      if (!(f instanceof File) || !f.size) return false;
      const mime = (f.type || "").toLowerCase();
      if (mime.startsWith("video/")) return false;
      if (mime.startsWith("image/")) return true;
      return /\.(jpe?g|png|gif|webp)$/i.test(f.name);
    })
    .slice(0, 6);
}

export function pickMessagerieDocFiles(list: FileList | File[] | null): File[] {
  if (!list) return [];
  const ok = /\.(pdf|docx?|xlsx?|csv|txt)$/i;
  return Array.from(list)
    .filter((f) => {
      if (!(f instanceof File) || !f.size) return false;
      const mime = (f.type || "").toLowerCase();
      if (mime.startsWith("image/") || mime.startsWith("video/") || mime.startsWith("audio/")) {
        return false;
      }
      if (
        mime === "application/pdf" ||
        mime === "text/plain" ||
        mime === "text/csv" ||
        mime.includes("word") ||
        mime.includes("excel") ||
        mime.includes("spreadsheet")
      ) {
        return true;
      }
      return ok.test(f.name);
    })
    .slice(0, 6);
}

function triggerFileInput(inputId: string) {
  const input = document.getElementById(inputId);
  if (input instanceof HTMLInputElement) {
    input.value = "";
    input.click();
  }
}

export function MessagerieAttachMenu({
  open,
  onOpenChange,
  photoInputId,
  docInputId,
  tone = "missions",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoInputId: string;
  docInputId: string;
  tone?: "missions" | "chantier";
}) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) onOpenChange(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  function openPhotos() {
    // Fermer d’abord : le label ne doit pas être démonté pendant l’activation du picker.
    onOpenChange(false);
    // click() après fermeture — l’input reste monté hors du menu.
    window.setTimeout(() => triggerFileInput(photoInputId), 0);
  }

  function openDocs() {
    onOpenChange(false);
    window.setTimeout(() => triggerFileInput(docInputId), 0);
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/35",
          tone === "chantier"
            ? "text-slate-600 hover:bg-slate-100"
            : "text-[#54656f] hover:bg-[#e9edef]",
        )}
        title="Joindre"
        aria-label="Joindre une photo ou un document"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Pièces jointes"
          className="absolute bottom-12 left-0 z-30 w-56 overflow-hidden rounded-xl border border-slate-200/90 bg-white py-1 shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
        >
          <button
            type="button"
            role="menuitem"
            className="flex min-h-12 w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-left text-[14px] font-medium text-slate-800 transition-colors duration-150 hover:bg-slate-50"
            onClick={openPhotos}
          >
            <ImageIcon className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
            Photos
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex min-h-12 w-full cursor-pointer items-center gap-3 px-3.5 py-2.5 text-left text-[14px] font-medium text-slate-800 transition-colors duration-150 hover:bg-slate-50"
            onClick={openDocs}
          >
            <FileText className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
            Document
          </button>
        </div>
      ) : null}
    </div>
  );
}
