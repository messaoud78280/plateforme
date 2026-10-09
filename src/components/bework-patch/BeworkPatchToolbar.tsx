"use client";

import { useState } from "react";
import type { BeworkPatchSection } from "@/lib/bework-patch/types";
import type { SectionPatchCapability } from "@/lib/bework-patch/capability";
import { BeworkPatchModal } from "@/components/bework-patch/BeworkPatchModal";
import { sectionMetierLabel } from "@/lib/bework-patch/ui-messages";

type ContextPurpose = "modify" | "enrich_tech_sheets" | "analyze_product_url";

type Props = {
  section: BeworkPatchSection;
  /** Facultatif pour VISIT autonome. */
  projectId?: string | null;
  entityId: string;
  version: number;
  capability: SectionPatchCapability;
  /** Identifiant métier (n° devis, titre…) pour messages. */
  entityLabel?: string;
  disabled?: boolean;
  disabledReason?: string | null;
  onApplied?: () => void;
  className?: string;
  /** Libellé du bouton principal (défaut : Modifier avec ChatGPT). */
  primaryActionLabel?: string;
  /** Aide courte sous la barre (documents chantier). */
  helpText?: string | null;
  compact?: boolean;
  /**
   * TAKEOFF : affiche « Enrichir avec ChatGPT » (contexte auto + fiches incomplètes).
   */
  showEnrichTechSheets?: boolean;
  /** SUPPLY — besoin ouvert dans l’étude d’approvisionnement. */
  focusRequirementId?: string | null;
  /** SUPPLY — URL produit à inclure dans le contexte. */
  productUrl?: string | null;
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
  primaryActionLabel,
  helpText = null,
  compact = false,
  showEnrichTechSheets = false,
  focusRequirementId = null,
  productUrl = null,
}: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"chatgpt" | "json">("chatgpt");
  const [contextPurpose, setContextPurpose] = useState<
    "modify" | "enrich_tech_sheets"
  >("modify");
  const [contextBusy, setContextBusy] = useState(false);
  const [contextCopied, setContextCopied] = useState(false);

  const blocked = disabled || capability.mode === "UNAVAILABLE";
  const blockTitle =
    disabledReason ??
    (capability.mode === "UNAVAILABLE" ? capability.label : null) ??
    undefined;
  const sectionLabel = sectionMetierLabel(section);
  const enrichEnabled = showEnrichTechSheets && section === "TAKEOFF";

  async function copyContext(purpose: ContextPurpose = "modify") {
    if (blocked) return;
    setContextBusy(true);
    try {
      const res = await fetch("/api/bework-patch/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          section,
          projectId,
          entityId,
          purpose,
          focusRequirementId: focusRequirementId || undefined,
          productUrl: productUrl || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Contexte indisponible");
      await navigator.clipboard.writeText(data.text);
      setContextCopied(true);
      setContextPurpose(purpose === "analyze_product_url" ? "modify" : purpose);
      setToast(
        purpose === "enrich_tech_sheets"
          ? "Contexte d’enrichissement copié"
          : purpose === "analyze_product_url"
            ? "Contexte d’analyse URL copié"
            : "Contexte copié",
      );
      window.setTimeout(() => setToast(null), 3500);
      return true;
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Copie impossible");
      window.setTimeout(() => setToast(null), 4500);
      return false;
    } finally {
      setContextBusy(false);
    }
  }

  function openChatgpt() {
    if (blocked) return;
    setContextPurpose("modify");
    setModalMode("chatgpt");
    setModalOpen(true);
  }

  async function openEnrich() {
    if (blocked) return;
    const ok = await copyContext("enrich_tech_sheets");
    if (!ok) return;
    setContextPurpose("enrich_tech_sheets");
    setModalMode("chatgpt");
    setModalOpen(true);
  }

  function openJson() {
    if (blocked) return;
    setContextPurpose("modify");
    setModalMode("json");
    setModalOpen(true);
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {enrichEnabled ? (
          <button
            type="button"
            disabled={blocked || contextBusy}
            title={
              blockTitle ??
              "Enrichir toutes les fiches techniques incomplètes avec ChatGPT"
            }
            onClick={() => void openEnrich()}
            className={
              compact
                ? "h-9 rounded-[10px] bg-[#1e3a5f] px-3.5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#152a45] disabled:cursor-not-allowed disabled:opacity-45"
                : `${btnBase} border-[#1e3a5f]/30 bg-[#1e3a5f] text-white hover:bg-[#152a45]`
            }
          >
            {contextBusy ? "Préparation…" : "Enrichir avec ChatGPT"}
          </button>
        ) : null}
        <button
          type="button"
          disabled={blocked}
          title={
            blockTitle ??
            primaryActionLabel ??
            `Modifier ${sectionLabel} avec ChatGPT`
          }
          onClick={openChatgpt}
          className={
            compact
              ? enrichEnabled
                ? "h-9 rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-45"
                : "h-9 rounded-[10px] bg-[#1e3a5f] px-3.5 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[#152a45] disabled:cursor-not-allowed disabled:opacity-45"
              : `${btnBase} border-indigo-200 bg-indigo-50/80 text-indigo-900 hover:bg-indigo-50`
          }
        >
          {primaryActionLabel ?? "Modifier avec ChatGPT"}
        </button>
        {!compact ? (
          <>
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
              onClick={() => void copyContext("modify")}
              className={`${btnBase} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
            >
              {contextBusy
                ? "Copie…"
                : contextCopied
                  ? "Contexte copié"
                  : "Copier le contexte pour ChatGPT"}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={blocked}
              title={blockTitle ?? `Modifier ${sectionLabel} par bloc`}
              onClick={openJson}
              className="h-9 rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-45"
            >
              Par bloc
            </button>
            <button
              type="button"
              disabled={blocked || contextBusy}
              title={blockTitle ?? `Copier le contexte ${sectionLabel} pour ChatGPT`}
              onClick={() => void copyContext("modify")}
              className="h-9 rounded-[10px] border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-45"
            >
              {contextCopied ? "Copié" : "Copier"}
            </button>
          </>
        )}
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
      {!blocked && helpText ? (
        <p className="max-w-xl text-[11px] leading-snug text-slate-500">
          {helpText}
        </p>
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
        contextPurpose={contextPurpose}
        onClose={() => setModalOpen(false)}
        onApplied={() => {
          onApplied?.();
        }}
      />
    </div>
  );
}
