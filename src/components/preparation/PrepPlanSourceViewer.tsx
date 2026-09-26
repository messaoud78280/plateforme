"use client";

import { useState } from "react";
import { DocumentPreviewModal } from "@/components/documents/DocumentPreviewModal";

export function PrepPlanSourceViewer({
  file,
}: {
  file: { id: string; name: string; mimeType: string | null };
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-full bg-[#1e3a5f] px-4 py-2 text-[13px] font-medium text-white"
        >
          Aperçu plein écran
        </button>
        <a
          href={`/api/chantier/files/${file.id}/preview?download=original`}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700"
        >
          Télécharger l’original
        </a>
      </div>
      <DocumentPreviewModal
        open={open}
        onClose={() => setOpen(false)}
        item={{
          name: file.name,
          url: null,
          mimeType: file.mimeType,
          chantierFileId: file.id,
        }}
      />
    </div>
  );
}
