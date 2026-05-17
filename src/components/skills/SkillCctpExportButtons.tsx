"use client";

import { Download, FileText } from "lucide-react";

type Props = {
  sessionId: string | null;
  disabled?: boolean;
};

export function SkillCctpExportButtons({ sessionId, disabled }: Props) {
  if (!sessionId) return null;

  const href = (format: "pdf" | "doc") =>
    `/api/skills/cctp/export?sessionId=${encodeURIComponent(sessionId)}&format=${format}`;

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={href("pdf")}
        className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-[#93c5fd]/70 hover:bg-[#eff6ff] ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
        download
      >
        <Download className="size-4" aria-hidden />
        PDF
      </a>
      <a
        href={href("doc")}
        className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-[#93c5fd]/70 hover:bg-[#eff6ff] ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
        download
      >
        <FileText className="size-4" aria-hidden />
        Word
      </a>
    </div>
  );
}
