"use client";

import { FileUp, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import {
  CCTP_ACCEPTED_FORMATS_HINT,
  CCTP_MAX_REFERENCE_FILES,
  formatFileSize,
  getCctpFileCategory,
  isCctpFileAccepted,
} from "@/lib/skills/cctp-upload-config";

type Props = {
  existingCctp: File | null;
  referenceDocs: File[];
  onExistingChange: (file: File | null) => void;
  onReferencesChange: (files: File[]) => void;
  onReject?: (message: string) => void;
};

function FileRow({ name, size, onRemove }: { name: string; size: number; onRemove: () => void }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
      <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{name}</span>
      <span className="shrink-0 text-xs text-slate-500">{formatFileSize(size)}</span>
      <button
        type="button"
        className="shrink-0 rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"
        onClick={onRemove}
        aria-label={`Retirer ${name}`}
      >
        <X className="size-4" />
      </button>
    </li>
  );
}

export function SkillCctpFileUpload({
  existingCctp,
  referenceDocs,
  onExistingChange,
  onReferencesChange,
  onReject,
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const cctpInputRef = useRef<HTMLInputElement>(null);
  const multiInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: File[]) => {
      const valid: File[] = [];
      for (const f of incoming) {
        if (!isCctpFileAccepted(f)) {
          onReject?.(`${f.name} : taille max 20 Mo ou type interdit.`);
          continue;
        }
        valid.push(f);
      }
      if (!valid.length) return;

      if (!existingCctp && valid.length === 1) {
        onExistingChange(valid[0]!);
        return;
      }

      const merged = [...referenceDocs];
      if (!existingCctp && valid.length > 1) {
        onExistingChange(valid[0]!);
        merged.push(...valid.slice(1));
      } else {
        merged.push(...valid);
      }
      const capped = merged.slice(0, CCTP_MAX_REFERENCE_FILES);
      if (merged.length > CCTP_MAX_REFERENCE_FILES) {
        onReject?.(`Maximum ${CCTP_MAX_REFERENCE_FILES} documents en plus du CCTP principal.`);
      }
      onReferencesChange(capped);
    },
    [existingCctp, referenceDocs, onExistingChange, onReferencesChange, onReject],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) addFiles(files);
    },
    [addFiles],
  );

  const totalCount = (existingCctp ? 1 : 0) + referenceDocs.length;

  return (
    <section className="space-y-4 rounded-2xl border border-[#93c5fd]/40 bg-gradient-to-b from-[#eff6ff]/80 to-white p-4 ring-1 ring-[#2563eb]/10 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#2563eb]/10 text-[#2563eb]">
          <Upload className="size-5" aria-hidden />
        </span>
        <div>
          <h3 className="font-heading text-base font-bold text-[#0f172a]">Transmettre vos documents</h3>
          <p className="mt-1 text-sm text-slate-600">
            Tous supports BTP : déposez ou sélectionnez vos fichiers. Le premier peut servir de CCTP existant.
          </p>
          <p className="mt-1 text-xs text-slate-500">{CCTP_ACCEPTED_FORMATS_HINT}</p>
        </div>
      </div>

      <div
        ref={dropRef}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") multiInputRef.current?.click();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          if (!dropRef.current?.contains(e.relatedTarget as Node)) setDragOver(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
          dragOver
            ? "border-[#2563eb] bg-[#eff6ff]"
            : "border-slate-300/90 bg-slate-50/60 hover:border-[#93c5fd]/80 hover:bg-[#eff6ff]/40"
        }`}
      >
        <FileUp className="mx-auto size-8 text-[#2563eb]/70" aria-hidden />
        <p className="mt-2 text-sm font-medium text-slate-700">Glissez-déposez vos fichiers ici</p>
        <p className="mt-1 text-xs text-slate-500">ou</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => multiInputRef.current?.click()}
            className="rounded-full border border-[#2563eb]/50 bg-white px-4 py-2 text-sm font-semibold text-[#1d4ed8] shadow-sm transition hover:bg-[#eff6ff]"
          >
            Parcourir tous les formats
          </button>
          <button
            type="button"
            onClick={() => cctpInputRef.current?.click()}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
          >
            CCTP principal uniquement
          </button>
        </div>
        {totalCount > 0 ? (
          <p className="mt-3 text-xs font-medium text-emerald-700">{totalCount} fichier(s) prêt(s)</p>
        ) : null}
        <input
          ref={multiInputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) addFiles(files);
            e.target.value = "";
          }}
        />
        <input
          ref={cctpInputRef}
          type="file"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) {
              if (!isCctpFileAccepted(f)) {
                onReject?.(`${f.name} : fichier non accepté.`);
              } else {
                onExistingChange(f);
              }
            }
            e.target.value = "";
          }}
        />
      </div>

      {existingCctp ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[#1e3a5f]/80">CCTP principal</p>
          <ul>
            <FileRow
              name={existingCctp.name}
              size={existingCctp.size}
              onRemove={() => {
                onExistingChange(null);
                if (cctpInputRef.current) cctpInputRef.current.value = "";
              }}
            />
          </ul>
        </div>
      ) : null}

      {referenceDocs.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Autres documents ({referenceDocs.length}/{CCTP_MAX_REFERENCE_FILES})
          </p>
          <ul className="space-y-1.5">
            {referenceDocs.map((f, i) => (
              <li
                key={`${f.name}-${i}`}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-800">{f.name}</span>
                  <span className="text-xs text-slate-500">
                    {formatFileSize(f.size)} · {getCctpFileCategory(f.name, f.type)}
                  </span>
                </span>
                <button
                  type="button"
                  className="shrink-0 rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => onReferencesChange(referenceDocs.filter((_, j) => j !== i))}
                  aria-label={`Retirer ${f.name}`}
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
