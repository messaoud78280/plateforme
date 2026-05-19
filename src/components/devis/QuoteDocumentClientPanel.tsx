"use client";

import { useState } from "react";
import type { QuoteProjectSelectOption } from "@/app/dashboard/devis/quote-actions";
import { QuoteClientCoordinatesModal } from "@/components/devis/QuoteClientCoordinatesModal";
import type { QuoteProject } from "@prisma/client";

type Props = {
  project: QuoteProject;
  onUpdated?: () => void;
};

export function QuoteDocumentClientPanel({ project, onUpdated }: Props) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(`${project.clientName} — ${project.projectName}`);

  return (
    <>
      <QuoteClientCoordinatesModal
        open={open}
        onClose={() => setOpen(false)}
        project={project}
        onApplied={(p: QuoteProjectSelectOption) => {
          setLabel(`${p.clientName} — ${p.projectName}`);
          onUpdated?.();
        }}
      />
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-left transition hover:border-[#1e3a5f]/40 hover:bg-amber-50/40"
      >
        <span className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Client sur le devis</span>
        <span className="mt-1 block text-sm font-semibold text-slate-800">{label}</span>
        <span className="mt-1 block text-xs text-[#2563eb]">Cliquez pour modifier les coordonnées client</span>
      </button>
    </>
  );
}
