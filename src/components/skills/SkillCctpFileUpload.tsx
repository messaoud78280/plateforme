"use client";

import { FileUp, X } from "lucide-react";
import { useRef } from "react";

type Props = {
  existingCctp: File | null;
  referenceDocs: File[];
  onExistingChange: (file: File | null) => void;
  onReferencesChange: (files: File[]) => void;
};

const accept = ".pdf,.docx,.doc,.txt,.md,.csv";

export function SkillCctpFileUpload({
  existingCctp,
  referenceDocs,
  onExistingChange,
  onReferencesChange,
}: Props) {
  const existingRef = useRef<HTMLInputElement>(null);
  const refsRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4 rounded-xl border border-dashed border-slate-300/90 bg-slate-50/80 p-4">
      <p className="text-sm font-medium text-slate-700">Import CCTP & documents de référence</p>
      <p className="text-xs text-slate-500">PDF, DOCX, TXT ou MD — 10 Mo max par fichier, 5 références max.</p>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">CCTP existant (optionnel)</p>
        {existingCctp ? (
          <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <span className="truncate">{existingCctp.name}</span>
            <button
              type="button"
              className="shrink-0 text-slate-500 hover:text-red-600"
              onClick={() => {
                onExistingChange(null);
                if (existingRef.current) existingRef.current.value = "";
              }}
              aria-label="Retirer le CCTP"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => existingRef.current?.click()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#93c5fd]/70 hover:bg-[#eff6ff]/50"
          >
            <FileUp className="size-4" aria-hidden />
            Choisir un CCTP existant
          </button>
        )}
        <input
          ref={existingRef}
          type="file"
          accept={accept}
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            onExistingChange(f ?? null);
          }}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Documents de référence</p>
        {referenceDocs.length > 0 ? (
          <ul className="space-y-1.5">
            {referenceDocs.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  className="shrink-0 text-slate-500 hover:text-red-600"
                  onClick={() => onReferencesChange(referenceDocs.filter((_, j) => j !== i))}
                  aria-label={`Retirer ${f.name}`}
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <button
          type="button"
          disabled={referenceDocs.length >= 5}
          onClick={() => refsRef.current?.click()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:border-[#93c5fd]/70 hover:bg-[#eff6ff]/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileUp className="size-4" aria-hidden />
          Ajouter des références ({referenceDocs.length}/5)
        </button>
        <input
          ref={refsRef}
          type="file"
          accept={accept}
          multiple
          className="sr-only"
          onChange={(e) => {
            const added = Array.from(e.target.files ?? []);
            const merged = [...referenceDocs, ...added].slice(0, 5);
            onReferencesChange(merged);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
