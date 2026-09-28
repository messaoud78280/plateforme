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
          className="rounded-lg bg-[#1e3a5f] px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-[#16304f]"
        >
          Consulter le plan (plein écran)
        </button>
        <a
          href={`/api/chantier/files/${file.id}/preview?download=original`}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          Télécharger l’original
        </a>
      </div>
      <p className="text-[12.5px] text-slate-500">
        Zoom largeur / page, agrandir, plein écran navigateur — ESC pour fermer.
      </p>
      <DocumentPreviewModal
        open={open}
        onClose={() => setOpen(false)}
        defaultMaximized
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
