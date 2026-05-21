"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { SKILL_CCTP_QUICK_PROMPTS } from "@/content/skill-cctp-quick-prompts";
import { SkillCctpDocumentsChecklist } from "@/components/skills/SkillCctpDocumentsChecklist";
import { SkillCctpExportButtons } from "@/components/skills/SkillCctpExportButtons";
import { SkillCctpMethodologyPanel } from "@/components/skills/SkillCctpMethodologyPanel";
import { SkillCctpFileUpload } from "@/components/skills/SkillCctpFileUpload";
import { SkillCctpLotTemplates } from "@/components/skills/SkillCctpLotTemplates";
import { SkillCctpMarketProfile } from "@/components/skills/SkillCctpMarketProfile";
import { SkillCctpModeSelector } from "@/components/skills/SkillCctpModeSelector";
import { SkillCctpNormPicker } from "@/components/skills/SkillCctpNormPicker";
import { SkillCctpRefinePanel } from "@/components/skills/SkillCctpRefinePanel";
import { SkillCctpSessionHistory } from "@/components/skills/SkillCctpSessionHistory";
import { SkillCctpAssistantPanel } from "@/components/skills/SkillCctpAssistantPanel";
import { SkillCctpWorkflowSteps } from "@/components/skills/SkillCctpWorkflowSteps";
import type { CctpAssistantInsights } from "@/lib/skills/cctp-assistant-intelligence";
import {
  getCctpModeLabel,
  getCctpModeRequestPlaceholder,
  type CctpGenerationMode,
  type CctpMarketProfile,
} from "@/lib/skills/cctp-generation-modes";
import { formatOuvrageTemplateMarkdown } from "@/content/cctp-methodology";
import { SkillCctpModeHint } from "@/components/skills/SkillCctpModeHint";
import { SkillMarkdownBody } from "@/components/skills/SkillMarkdownBody";
import type {
  CctpDetailLevel,
  CctpRedactionResponseBody,
  CctpSessionDetail,
  CctpSessionSummary,
} from "@/lib/skills/cctp-redaction-types";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#2563eb]/50 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/15";

const labelClass = "block text-xs font-bold uppercase tracking-wide text-slate-500";

const defaultContext = {
  projectType: "",
  lot: "",
  location: "",
  constraints: "",
  detailLevel: "standard" as CctpDetailLevel,
  availableDocuments: "",
};

type Props = {
  initialSessions?: CctpSessionSummary[];
};

export function SkillCctpWorkspace({ initialSessions = [] }: Props) {
  const [request, setRequest] = useState("");
  const [context, setContext] = useState(defaultContext);
  const [normReferences, setNormReferences] = useState<string[]>([]);
  const [existingCctp, setExistingCctp] = useState<File | null>(null);
  const [referenceDocs, setReferenceDocs] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CctpRedactionResponseBody | null>(null);
  const [sessions, setSessions] = useState<CctpSessionSummary[]>(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<CctpGenerationMode>("redaction");
  const [marketProfile, setMarketProfile] = useState<CctpMarketProfile | null>(null);
  const [checkedDocumentIds, setCheckedDocumentIds] = useState<string[]>([]);

  const refreshSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/skills/cctp/sessions");
      if (!res.ok) return;
      const data = (await res.json()) as { sessions: CctpSessionSummary[] };
      setSessions(data.sessions ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadSession = useCallback(async (id: string) => {
    setHistoryLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/skills/cctp/sessions?id=${encodeURIComponent(id)}`);
      const data = (await res.json()) as CctpSessionDetail & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Session introuvable.");
      setActiveSessionId(data.id);
      setRequest(data.requestText);
      setContext({
        projectType: data.projectType ?? "",
        lot: data.lot ?? "",
        location: data.location ?? "",
        constraints: data.constraints ?? "",
        detailLevel: data.detailLevel,
        availableDocuments: data.availableDocuments ?? "",
      });
      setNormReferences(data.normReferences ?? []);
      if (data.generationMode) {
        setGenerationMode(data.generationMode as CctpGenerationMode);
      }
      setMarketProfile((data.marketProfile as CctpMarketProfile | null) ?? null);
      setExistingCctp(null);
      setReferenceDocs([]);
      if (data.resultMarkdown) {
        setResult({
          markdown: data.resultMarkdown,
          usedLlm: data.usedLlm,
          notice: data.notice ?? undefined,
          sessionId: data.id,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialSessions.length) {
      void refreshSessions();
    }
  }, [initialSessions.length, refreshSessions]);

  const runGeneration = useCallback(
    async (opts?: { refineInstruction?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append("request", request);
        formData.append("context", JSON.stringify(context));
        formData.append("normReferences", JSON.stringify(normReferences));
        formData.append("generationMode", generationMode);
        if (marketProfile) formData.append("marketProfile", marketProfile);
        formData.append("checkedDocumentIds", JSON.stringify(checkedDocumentIds));

        if (opts?.refineInstruction && activeSessionId) {
          formData.append("refineSessionId", activeSessionId);
          formData.append("refineInstruction", opts.refineInstruction);
        } else {
          if (existingCctp) formData.append("existingCctp", existingCctp);
          for (const f of referenceDocs) {
            formData.append("referenceDocs", f);
          }
        }

        const res = await fetch("/api/skills/cctp", { method: "POST", body: formData });
        const data = (await res.json()) as CctpRedactionResponseBody & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Erreur de génération.");
        setResult(data);
        if (data.sessionId) setActiveSessionId(data.sessionId);
        await refreshSessions();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue.");
        if (!opts?.refineInstruction) setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [
      request,
      context,
      normReferences,
      generationMode,
      marketProfile,
      existingCctp,
      referenceDocs,
      activeSessionId,
      refreshSessions,
    ],
  );

  const generate = useCallback(() => void runGeneration(), [runGeneration]);

  const applyQuickPrompt = (text: string, mode: CctpGenerationMode) => {
    setRequest(text);
    setGenerationMode(mode);
    setResult(null);
    setError(null);
    setActiveSessionId(null);
  };

  const syncDocumentsToForm = (text: string) => {
    setContext((c) => ({
      ...c,
      availableDocuments: c.availableDocuments?.trim()
        ? `${c.availableDocuments.trim()}, ${text}`
        : text,
    }));
  };

  const insertOuvrageTemplate = () => {
    const tpl = formatOuvrageTemplateMarkdown();
    setRequest((r) => (r.trim() ? `${r.trim()}\n\n${tpl}` : tpl));
    setGenerationMode("fiche_ouvrage");
  };

  return (
    <div className="space-y-6">
      <SkillCctpWorkflowSteps activeStep={result ? 5 : context.lot ? 3 : 2} />
      <SkillCctpMethodologyPanel />
      <SkillCctpDocumentsChecklist
        availableDocumentsHint={context.availableDocuments}
        onSyncToForm={syncDocumentsToForm}
        onCheckedIdsChange={setCheckedDocumentIds}
      />
      <SkillCctpAssistantPanel
        context={context}
        checkedDocumentIds={checkedDocumentIds}
        insightsFromResult={
          result?.assistantInsights
            ? ({
                ...result.assistantInsights,
                documentClassifications:
                  result.documentClassifications ?? result.assistantInsights.documentClassifications,
              } as CctpAssistantInsights)
            : undefined
        }
        compact={Boolean(result)}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
        <section className="space-y-6 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6">
          <div>
            <h2 className="font-heading text-lg font-bold text-[#0f172a]">Votre demande</h2>
            <p className="mt-1 text-sm text-slate-600">
              Précisez lot, réservations, interfaces et contraintes chantier — l&apos;assistant structure un CCTP
              exploitable et chiffrable.
            </p>
          </div>

          <SkillCctpModeSelector value={generationMode} onChange={setGenerationMode} />
          <SkillCctpModeHint mode={generationMode} />
          <SkillCctpMarketProfile value={marketProfile} onChange={setMarketProfile} />
          <SkillCctpLotTemplates
            onApply={({ context: ctx, normReferences: norms, request: req, generationMode: mode }) => {
              setContext((c) => ({ ...c, ...ctx }));
              setNormReferences(norms);
              setRequest(req);
              if (mode) setGenerationMode(mode);
              setResult(null);
              setError(null);
            }}
          />

          <div className="flex flex-wrap gap-2">
            {SKILL_CCTP_QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt.text}
                type="button"
                onClick={() => applyQuickPrompt(prompt.text, prompt.mode)}
                className={`rounded-full border px-3 py-1.5 text-left text-xs font-medium transition sm:text-[0.8125rem] ${
                  generationMode === prompt.mode
                    ? "border-[#2563eb]/50 bg-[#eff6ff] text-[#1d4ed8]"
                    : "border-slate-200/90 bg-slate-50 text-slate-700 hover:border-[#93c5fd]/70 hover:bg-[#eff6ff] hover:text-[#1d4ed8]"
                }`}
              >
                {prompt.text}
              </button>
            ))}
          </div>

          <SkillCctpFileUpload
            existingCctp={existingCctp}
            referenceDocs={referenceDocs}
            onExistingChange={(f) => {
              setExistingCctp(f);
              setUploadNotice(null);
            }}
            onReferencesChange={(files) => {
              setReferenceDocs(files);
              setUploadNotice(null);
            }}
            onReject={(msg) => setUploadNotice(msg)}
          />

          {uploadNotice ? (
            <p className="rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-2 text-xs text-amber-950" role="status">
              {uploadNotice}
            </p>
          ) : null}

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className={labelClass} htmlFor="cctp-request">
                Demande *
              </label>
              {generationMode === "fiche_ouvrage" ? (
                <button
                  type="button"
                  onClick={insertOuvrageTemplate}
                  className="text-xs font-semibold text-[#2563eb] hover:underline"
                >
                  Insérer le modèle 14 rubriques
                </button>
              ) : null}
            </div>
            <textarea
              id="cctp-request"
              rows={6}
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder={getCctpModeRequestPlaceholder(generationMode)}
              className={`${inputClass} min-h-[140px] resize-y`}
              required
            />
          </div>

          <fieldset className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <legend className="px-1 text-sm font-semibold text-slate-800">Contexte projet (recommandé)</legend>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="cctp-project-type">
                  Type de projet
                </label>
                <input
                  id="cctp-project-type"
                  type="text"
                  value={context.projectType}
                  onChange={(e) => setContext((c) => ({ ...c, projectType: e.target.value }))}
                  placeholder="Maison individuelle, local commercial…"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="cctp-lot">
                  Lot concerné
                </label>
                <input
                  id="cctp-lot"
                  type="text"
                  value={context.lot}
                  onChange={(e) => setContext((c) => ({ ...c, lot: e.target.value }))}
                  placeholder="Gros œuvre, plâtrerie, VRD…"
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor="cctp-location">
                Localisation du chantier
              </label>
              <input
                id="cctp-location"
                type="text"
                value={context.location}
                onChange={(e) => setContext((c) => ({ ...c, location: e.target.value }))}
                placeholder="Ville, contraintes d'accès…"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="cctp-constraints">
                Contraintes particulières
              </label>
              <textarea
                id="cctp-constraints"
                rows={2}
                value={context.constraints}
                onChange={(e) => setContext((c) => ({ ...c, constraints: e.target.value }))}
                placeholder="Site occupé, délais, coactivité, accès…"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass} htmlFor="cctp-detail">
                Niveau de détail souhaité
              </label>
              <select
                id="cctp-detail"
                value={context.detailLevel}
                onChange={(e) =>
                  setContext((c) => ({ ...c, detailLevel: e.target.value as CctpDetailLevel }))
                }
                className={inputClass}
              >
                <option value="synthese">Synthèse</option>
                <option value="standard">Standard</option>
                <option value="detaille">Détaillé</option>
              </select>
            </div>

            <div>
              <label className={labelClass} htmlFor="cctp-docs">
                Documents disponibles (texte libre)
              </label>
              <textarea
                id="cctp-docs"
                rows={2}
                value={context.availableDocuments}
                onChange={(e) => setContext((c) => ({ ...c, availableDocuments: e.target.value }))}
                placeholder="Plans, notes MOA, références internes…"
                className={inputClass}
              />
            </div>
          </fieldset>

          <SkillCctpNormPicker selected={normReferences} onChange={setNormReferences} />

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void generate()}
            disabled={loading || !request.trim()}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-[#2563eb]/70 bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] px-6 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(29,78,216,0.28)] transition hover:from-[#2563eb] hover:to-[#1e40af] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Sparkles className="size-4" aria-hidden />}
            {loading ? "Génération en cours…" : "Générer le CCTP"}
          </button>
        </section>

        <section
          className="min-h-[320px] space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100/80 sm:p-6 lg:sticky lg:top-24"
          aria-live="polite"
        >
          <h2 className="font-heading text-lg font-bold text-[#0f172a]">Résultat</h2>
          <p className="text-sm text-slate-600">Contenu Markdown — export PDF ou Word après génération.</p>

          {!result && !loading ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-12 text-center text-sm text-slate-500">
              Renseignez votre demande et cliquez sur « Générer le CCTP » pour afficher la proposition ici.
            </div>
          ) : null}

          {loading ? (
            <div className="mt-4 flex flex-col items-center gap-3 py-12 text-sm text-slate-600">
              <Loader2 className="size-8 animate-spin text-[#2563eb]" aria-hidden />
              Rédaction en cours…
            </div>
          ) : null}

          {result && !loading ? (
            <div className="mt-2 space-y-4">
              {result.notice ? (
                <p className="rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  {result.notice}
                </p>
              ) : null}
              {result.extractWarnings?.length ? (
                <ul className="rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                  {result.extractWarnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {result.usedLlm ? (
                  <span className="font-medium text-emerald-700">Génération IA</span>
                ) : (
                  <span className="text-slate-500">Mode assisté</span>
                )}
                {result.refined ? <span className="text-[#1d4ed8]">· Affiné</span> : null}
                {result.generationMode ? (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                    {getCctpModeLabel(result.generationMode as CctpGenerationMode)}
                  </span>
                ) : null}
              </div>
              <SkillCctpExportButtons sessionId={result.sessionId ?? activeSessionId} />
              <SkillCctpRefinePanel
                sessionId={result.sessionId ?? activeSessionId}
                loading={loading}
                onRefine={(instruction) => void runGeneration({ refineInstruction: instruction })}
              />
              <div className="max-h-[min(70vh,720px)] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-4 sm:p-5">
                <SkillMarkdownBody markdown={result.markdown} />
              </div>
              <button
                type="button"
                className="text-sm font-semibold text-[#2563eb] hover:underline"
                onClick={() => {
                  void navigator.clipboard.writeText(result.markdown);
                }}
              >
                Copier le Markdown
              </button>
            </div>
          ) : null}
        </section>
      </div>

      <SkillCctpSessionHistory
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={(id) => void loadSession(id)}
        loading={historyLoading}
      />
    </div>
  );
}
