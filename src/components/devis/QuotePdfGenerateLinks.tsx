"use client";

import { validateOfficialPdfIssuer } from "@/lib/be-work-devis-pdf-presentation";
import type { QuoteProject } from "@prisma/client";

type Props = {
  documentId: string;
  project: QuoteProject;
};

export function QuotePdfGenerateLinks({ documentId, project }: Props) {
  const officialOk = validateOfficialPdfIssuer(project).ok;
  const base = `/dashboard/devis/documents/${documentId}/pdf`;

  return (
    <div className="flex flex-wrap gap-2">
      {officialOk ? (
        <a
          href={`${base}?mode=official`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#152a45]"
        >
          Devis officiel (PDF)
        </a>
      ) : (
        <span
          title="Complétez l'entreprise émettrice"
          className="inline-flex cursor-not-allowed rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-500"
        >
          Devis officiel (incomplet)
        </span>
      )}
      <a
        href={`${base}?mode=estimation`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex rounded-xl border border-[#1e3a5f] bg-white px-4 py-2 text-sm font-semibold text-[#1e3a5f] hover:bg-slate-50"
      >
        Estimation indicative (PDF)
      </a>
    </div>
  );
}
