"use client";

import { useState } from "react";
import type { BeworkPatchSection } from "@/lib/bework-patch/types";
import type { SectionPatchCapability } from "@/lib/bework-patch/capability";
import { BeworkPatchModal } from "@/components/bework-patch/BeworkPatchModal";
import { sectionMetierLabel } from "@/lib/bework-patch/ui-messages";

type Props = {
  section: BeworkPatchSection;
  projectId: string;
  entityId: string;
  version: number;
  capability: SectionPatchCapability;
  /** Identifiant métier (n° devis, titre…) pour messages. */
  entityLabel?: string;
  disabled?: boolean;
  disabledReason?: string | null;
  onApplied?: () => void;
  className?: string;
};

const btnBase =
  "rounded-lg border px-2.5 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-45";

/**
 * Barre d’actions universelle — même design sur toutes les sections.
 */
export function BeworkPatchToolbar({
  section,
  projectId,
  entityId,
  version,
  capability,
  entityLabel,
  disabled = false,
  disabledReason = null,
  onApplied,
  className = "",
}: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"chatgpt" | "json">("chatgpt");
  const [contextBusy, setContextBusy] = useState(false);
  const [contextCopied, setContextCopied] = useState(false);

  const blocked = disabled || capability.mode === "UNAVAILABLE";
  const blockTitle =
    disabledReason ??
    (capability.mode === "UNAVAILABLE" ? capability.label : null) ??
    undefined;
  const sectionLabel = sectionMetierLabel(section);

  async function copyContext() {
    if (blocked) return;
    setContextBusy(true);
    try {
      const res = await fetch("/api/bework-patch/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section, projectId, entityId }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Contexte indisponible");
      await navigator.clipboard.writeText(data.text);
      setContextCopied(true);
      setToast("Contexte copié");
      window.setTimeout(() => setToast(null), 3500);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Copie impossible");
      window.setTimeout(() => setToast(null), 4500);
    } finally {
      setContextBusy(false);
    }
  }

  function openChatgpt() {
    if (blocked) return;
    setModalMode("chatgpt");
    setModalOpen(true);
  }

  function openJson() {
    if (blocked) return;
    setModalMode("json");
    setModalOpen(true);
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={blocked}
          title={blockTitle ?? `Modifier ${sectionLabel} avec ChatGPT`}
          onClick={openChatgpt}
          className={`${btnBase} border-indigo-200 bg-indigo-50/80 text-indigo-900 hover:bg-indigo-50`}
        >
          ✨ Modifier avec ChatGPT
        </button>
        <button
          type="button"
          disabled={blocked}
          title={blockTitle ?? `Modifier ${sectionLabel} par bloc`}
          onClick={openJson}
          className={`${btnBase} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
        >
          {"{ }"} Modifier par bloc
        </button>
        <button
          type="button"
          disabled={blocked || contextBusy}
          title={blockTitle ?? `Copier le contexte ${sectionLabel} pour ChatGPT`}
          onClick={() => void copyContext()}
          className={`${btnBase} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
        >
          {contextBusy
            ? "Copie…"
            : contextCopied
              ? "Contexte copié"
              : "Copier le contexte pour ChatGPT"}
        </button>
        {capability.mode === "PREVIEW_ONLY" && capability.label ? (
          <span className="text-[11px] font-medium text-amber-800">
            Prévisualisation uniquement
          </span>
        ) : null}
      </div>
      {toast ? (
        <p className="text-[12px] font-medium text-emerald-800">{toast}</p>
      ) : null}
      {blocked && blockTitle ? (
        <p className="text-[11px] text-slate-500">{blockTitle}</p>
      ) : null}

      <BeworkPatchModal
        open={modalOpen}
        mode={modalMode}
        section={section}
        projectId={projectId}
        entityId={entityId}
        version={version}
        capability={capability}
        entityLabel={entityLabel}
        contextAlreadyCopied={contextCopied}
        onClose={() => setModalOpen(false)}
        onApplied={() => {
          onApplied?.();
        }}
      />
    </div>
  );
}
