"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDownToLine, ClipboardList, ChevronDown } from "lucide-react";
import { CCTP_DOCUMENT_CATEGORIES } from "@/content/cctp-methodology";

const STORAGE_KEY = "bework-cctp-docs-checklist-v1";

export type CctpDocsCheckState = Record<string, boolean>;

function loadState(): CctpDocsCheckState {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CctpDocsCheckState;
  } catch {
    return {};
  }
}

function saveState(state: CctpDocsCheckState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode */
  }
}

export function getCheckedDocumentIds(state: CctpDocsCheckState): string[] {
  return Object.entries(state)
    .filter(([, v]) => v)
    .map(([k]) => k);
}

export function formatCheckedDocumentsPlain(state: CctpDocsCheckState): string {
  const ids = getCheckedDocumentIds(state);
  if (!ids.length) return "";
  return ids
    .map((id) => (id.includes(":") ? id.split(":").slice(1).join(":") : id))
    .join(", ");
}

type Props = {
  availableDocumentsHint?: string;
  onSyncToForm?: (text: string) => void;
  onCheckedIdsChange?: (ids: string[]) => void;
};

export function SkillCctpDocumentsChecklist({ availableDocumentsHint, onSyncToForm, onCheckedIdsChange }: Props) {
  const [open, setOpen] = useState(false);
  const [checked, setChecked] = useState<CctpDocsCheckState>({});

  useEffect(() => {
    setChecked(loadState());
  }, []);

  const toggle = useCallback(
    (id: string) => {
      setChecked((prev) => {
        const next = { ...prev, [id]: !prev[id] };
        saveState(next);
        onCheckedIdsChange?.(getCheckedDocumentIds(next));
        return next;
      });
    },
    [onCheckedIdsChange],
  );

  useEffect(() => {
    onCheckedIdsChange?.(getCheckedDocumentIds(checked));
  }, [checked, onCheckedIdsChange]);

  const syncToForm = useCallback(() => {
    const plain = formatCheckedDocumentsPlain(checked);
    if (!plain || !onSyncToForm) return;
    onSyncToForm(plain);
  }, [checked, onSyncToForm]);

  const total = CCTP_DOCUMENT_CATEGORIES.reduce((n, c) => n + c.items.length, 0);
  const done = Object.values(checked).filter(Boolean).length;
  const canSync = done > 0 && Boolean(onSyncToForm);

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ClipboardList className="size-4 text-[#1d4ed8]" aria-hidden />
          Pièces à rassembler avant rédaction
        </span>
        <span className="flex items-center gap-2 text-xs text-slate-500">
          {done}/{total}
          <ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} aria-hidden />
        </span>
      </button>
      {open ? (
        <div className="max-h-[min(50vh,440px)] space-y-4 overflow-y-auto border-t border-slate-100 px-4 py-4">
          {availableDocumentsHint?.trim() ? (
            <p className="rounded-lg bg-[#eff6ff] px-3 py-2 text-xs text-[#1e40af]">
              <strong>Documents indiqués dans le formulaire :</strong> {availableDocumentsHint.trim()}
            </p>
          ) : null}
          {CCTP_DOCUMENT_CATEGORIES.map((cat) => (
            <div key={cat.id}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{cat.title}</h3>
              <ul className="mt-2 space-y-1.5">
                {cat.items.map((item) => {
                  const id = `${cat.id}:${item}`;
                  return (
                    <li key={id}>
                      <label className="flex cursor-pointer items-start gap-2 rounded-lg px-1 py-1 text-sm text-slate-700 hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={Boolean(checked[id])}
                          onChange={() => toggle(id)}
                          className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]/30"
                        />
                        <span className={checked[id] ? "text-slate-400 line-through" : ""}>{item}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-2">
            {canSync ? (
              <button
                type="button"
                onClick={syncToForm}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#2563eb]/40 bg-[#eff6ff] px-3 py-1.5 text-xs font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
              >
                <ArrowDownToLine className="size-3.5" aria-hidden />
                Reporter {done} pièce{done > 1 ? "s" : ""} dans le formulaire
              </button>
            ) : null}
            <p className="text-xs text-slate-500">
              Progression enregistrée sur cet appareil. Synchronisez avant une génération « checklist » ou « méthode ».
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}