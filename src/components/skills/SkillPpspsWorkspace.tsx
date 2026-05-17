"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Copy, Loader2, RotateCcw, Shield, Sparkles } from "lucide-react";
import type { PpspsTradeTemplate } from "@/content/ppsps-trade-templates";
import { SKILL_PPSPS_QUICK_PROMPTS } from "@/content/skill-ppsps-quick-prompts";
import { SkillPpspsExportButtons } from "@/components/skills/SkillPpspsExportButtons";
import { SkillPpspsFileUpload } from "@/components/skills/SkillPpspsFileUpload";
import { SkillPpspsModeSelector } from "@/components/skills/SkillPpspsModeSelector";
import { SkillPpspsOppbtpSearch } from "@/components/skills/SkillPpspsOppbtpSearch";
import { SkillPpspsProjectPicker } from "@/components/skills/SkillPpspsProjectPicker";
import { SkillPpspsRefinePanel } from "@/components/skills/SkillPpspsRefinePanel";
import { SkillPpspsRiskChecklist } from "@/components/skills/SkillPpspsRiskChecklist";
import { SkillPpspsSessionHistory } from "@/components/skills/SkillPpspsSessionHistory";
import { SkillPpspsTradeTemplates } from "@/components/skills/SkillPpspsTradeTemplates";
import { SkillMarkdownBody } from "@/components/skills/SkillMarkdownBody";
import {
  PPSPS_COACTIVITY_OPTIONS,
  PPSPS_DETAIL_LEVELS,
  PPSPS_OPERATION_TYPES,
  PPSPS_TRADES,
} from "@/lib/skills/ppsps-labels";
import type { PpspsGenerationMode } from "@/lib/skills/ppsps-generation-modes";
import type { PpspsProjectOption } from "@/lib/skills/ppsps-projects";
import type {
  PpspsFormInput,
  PpspsGenerationResponse,
  PpspsSessionDetail,
  PpspsSessionSummary,
  PpspsSiteInfo,
} from "@/lib/skills/ppsps-types";
import Link from "next/link";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-[#2563eb]/50 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/15";

const labelClass = "block text-xs font-bold uppercase tracking-wide text-slate-500";

const defaultSite: PpspsSiteInfo = {
  siteName: "",
  siteAddress: "",
  operationType: "construction_neuve",
  operationTypeOther: "",
  startDate: "",
  estimatedDuration: "",
  maxWorkers: "",
  coactivity: "a_confirmer",
  spsCoordinator: "",
  projectOwner: "",
  projectManager: "",
  safetyManager: "",
};

const defaultForm: PpspsFormInput = {
  site: defaultSite,
  trades: [],
  tradeOther: "",
  selectedRiskTaskIds: [],
  detailLevel: "standard",
  constraints: "",
  projectId: null,
  generationMode: "analyse_risques",
  oppbtpSearchQuery: "",
};

/** Présélection de tâches pour les prompts rapides */
const QUICK_PROMPT_TASK_IDS: string[][] = [
  ["h-echafaudage", "h-toiture", "h-echelle", "h-nacelle", "h-rive", "h-tremie"],
  ["t-terrassement", "t-tranchee", "t-fond-fouille", "t-blindage", "t-reseaux-enterres"],
  ["d-manuelle", "d-mecanique", "d-decoupe-beton", "d-poussieres", "d-gravats"],
  ["m-manuelle", "m-engin-levage", "m-grue", "m-elingage", "m-dechargement"],
  ["o-site-occupe", "o-coactivite", "o-public", "e-circulation"],
  ["m-stockage", "m-dechargement", "t-fondations"],
];

type Props = {
  initialSessions?: PpspsSessionSummary[];
};

export function SkillPpspsWorkspace({ initialSessions = [] }: Props) {
  const [form, setForm] = useState<PpspsFormInput>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PpspsGenerationResponse | null>(null);
  const [copyDone, setCopyDone] = useState(false);
  const [sessions, setSessions] = useState<PpspsSessionSummary[]>(initialSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [existingPpsps, setExistingPpsps] = useState<File | null>(null);
  const [referenceDocs, setReferenceDocs] = useState<File[]>([]);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [includeOppbtpHints, setIncludeOppbtpHints] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [linkedDocumentId, setLinkedDocumentId] = useState<string | null>(null);

  const setSite = (patch: Partial<PpspsSiteInfo>) => {
    setForm((f) => ({ ...f, site: { ...f.site, ...patch } }));
  };

  const toggleTrade = (trade: string) => {
    setForm((f) => {
      const has = f.trades.includes(trade);
      return {
        ...f,
        trades: has ? f.trades.filter((t) => t !== trade) : [...f.trades, trade],
      };
    });
  };

  const refreshSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/skills/ppsps/sessions");
      if (!res.ok) return;
      const data = (await res.json()) as { sessions: PpspsSessionSummary[] };
      setSessions(data.sessions ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  const loadSession = useCallback(async (id: string) => {
    setHistoryLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/skills/ppsps/sessions?id=${encodeURIComponent(id)}`);
      const data = (await res.json()) as PpspsSessionDetail & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Session introuvable.");
      setActiveSessionId(data.id);
      setForm(data.form);
      setExistingPpsps(null);
      setReferenceDocs([]);
      if (data.resultMarkdown) {
        setResult({
          markdown: data.resultMarkdown,
          usedLlm: data.usedLlm,
          notice: data.notice ?? undefined,
          sessionId: data.id,
        });
      }
      setLinkedDocumentId(data.linkedDocumentId ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialSessions.length) void refreshSessions();
  }, [initialSessions.length, refreshSessions]);

  const reset = () => {
    setForm(defaultForm);
    setResult(null);
    setError(null);
    setCopyDone(false);
    setActiveSessionId(null);
    setExistingPpsps(null);
    setReferenceDocs([]);
    setUploadNotice(null);
    setSaveMessage(null);
    setLinkedDocumentId(null);
  };

  const applyTradeTemplate = (tpl: PpspsTradeTemplate) => {
    setForm((f) => ({
      ...f,
      trades: [...new Set([...f.trades, ...tpl.trades])],
      selectedRiskTaskIds: [...new Set([...f.selectedRiskTaskIds, ...tpl.suggestedTaskIds])],
      constraints: f.constraints.trim() ? `${f.constraints.trim()}\n${tpl.constraints}` : tpl.constraints,
      site: {
        ...f.site,
        operationType: tpl.operationType,
        coactivity: tpl.coactivity,
      },
    }));
  };

  const applyQuickPrompt = (index: number) => {
    const text = SKILL_PPSPS_QUICK_PROMPTS[index];
    const tasks = QUICK_PROMPT_TASK_IDS[index] ?? [];
    setForm((f) => ({
      ...f,
      constraints: f.constraints.trim() ? `${f.constraints.trim()}\n${text}` : text,
      selectedRiskTaskIds: tasks.length ? [...new Set([...f.selectedRiskTaskIds, ...tasks])] : f.selectedRiskTaskIds,
    }));
  };

  const submitGeneration = useCallback(
    async (opts?: { refineInstruction?: string }) => {
      if (!opts?.refineInstruction && !form.selectedRiskTaskIds.length) {
        setError("Sélectionnez au moins une tâche à risque avant de générer l'analyse.");
        return;
      }

      setLoading(true);
      setError(null);
      setCopyDone(false);
      setUploadNotice(null);

      try {
        const hasFiles = Boolean(existingPpsps) || referenceDocs.length > 0;
        let res: Response;

        if (hasFiles || opts?.refineInstruction) {
          const formData = new FormData();
          formData.append("form", JSON.stringify(form));
          formData.append("includeOppbtpHints", String(includeOppbtpHints));
          if (existingPpsps) formData.append("existingPpsps", existingPpsps);
          for (const f of referenceDocs) formData.append("referenceDocs", f);
          if (opts?.refineInstruction && activeSessionId) {
            formData.append("refineSessionId", activeSessionId);
            formData.append("refineInstruction", opts.refineInstruction);
          }
          res = await fetch("/api/skills/ppsps", { method: "POST", body: formData });
        } else {
          res = await fetch("/api/skills/ppsps", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...form,
              includeOppbtpHints,
              refineSessionId: opts?.refineInstruction ? activeSessionId : undefined,
              refineInstruction: opts?.refineInstruction,
            }),
          });
        }

        const data = (await res.json()) as PpspsGenerationResponse & { error?: string };
        if (!res.ok) throw new Error(data.error ?? "Erreur de génération.");
        setResult(data);
        if (data.sessionId) setActiveSessionId(data.sessionId);
        if (data.extractWarnings?.length) {
          setUploadNotice(data.extractWarnings.join(" · "));
        }
        void refreshSessions();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inattendue.");
      } finally {
        setLoading(false);
      }
    },
    [form, existingPpsps, referenceDocs, includeOppbtpHints, activeSessionId, refreshSessions],
  );

  const saveToProject = async () => {
    if (!sessionId || !form.projectId) {
      setError("Sélectionnez un projet chantier et générez une analyse avant d'enregistrer.");
      return;
    }
    setSaveLoading(true);
    setError(null);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/skills/ppsps/save-to-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, projectId: form.projectId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        documentId?: string;
        projectUrl?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Enregistrement impossible.");
      setLinkedDocumentId(data.documentId ?? null);
      setSaveMessage(data.projectUrl ?? "Enregistré dans le dossier projet.");
      void refreshSessions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur d'enregistrement.");
    } finally {
      setSaveLoading(false);
    }
  };

  const copyResult = async () => {
    if (!result?.markdown) return;
    try {
      await navigator.clipboard.writeText(result.markdown);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2500);
    } catch {
      setError("Impossible de copier dans le presse-papiers.");
    }
  };

  const sessionId = activeSessionId ?? result?.sessionId ?? null;

  return (
    <div className="space-y-6">
      <SkillPpspsSessionHistory
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={(id) => void loadSession(id)}
        loading={historyLoading}
      />

    <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
      {/* Colonne formulaire */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
          <p className="flex items-start gap-2">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
            <span>
              Outil d&apos;aide à la rédaction — ne constitue pas une validation réglementaire. Tout document doit être
              relu et validé par une personne compétente avant utilisation sur chantier.
            </span>
          </p>
        </div>

        <SkillPpspsModeSelector
          value={form.generationMode ?? "analyse_risques"}
          onChange={(generationMode: PpspsGenerationMode) => setForm((f) => ({ ...f, generationMode }))}
        />

        <SkillPpspsProjectPicker
          projectId={form.projectId ?? null}
          onChange={(projectId) => setForm((f) => ({ ...f, projectId }))}
          onPrefill={(p: PpspsProjectOption) => {
            if (!form.site.siteName.trim()) {
              setSite({ siteName: p.title });
            }
          }}
        />

        <SkillPpspsTradeTemplates onApply={applyTradeTemplate} />

        <SkillPpspsFileUpload
          existingPpsps={existingPpsps}
          referenceDocs={referenceDocs}
          onExistingChange={setExistingPpsps}
          onReferencesChange={setReferenceDocs}
          onReject={(msg) => setUploadNotice(msg)}
        />
        {uploadNotice ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{uploadNotice}</p>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-heading text-base font-bold text-slate-900">Prompts rapides</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {SKILL_PPSPS_QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={prompt}
                type="button"
                onClick={() => applyQuickPrompt(i)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-xs font-medium text-slate-700 transition hover:border-[#1e3a5f]/30 hover:bg-white"
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-heading text-base font-bold text-slate-900">A. Informations chantier</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelClass}>Nom du chantier</label>
              <input
                className={inputClass}
                value={form.site.siteName}
                onChange={(e) => setSite({ siteName: e.target.value })}
                placeholder="Ex. Réhabilitation immeuble R+4"
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Adresse du chantier</label>
              <input
                className={inputClass}
                value={form.site.siteAddress}
                onChange={(e) => setSite({ siteAddress: e.target.value })}
                placeholder="Adresse complète"
              />
            </div>
            <div>
              <label className={labelClass}>Type d&apos;opération</label>
              <select
                className={inputClass}
                value={form.site.operationType}
                onChange={(e) =>
                  setSite({ operationType: e.target.value as PpspsSiteInfo["operationType"] })
                }
              >
                {PPSPS_OPERATION_TYPES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            {form.site.operationType === "autre" ? (
              <div>
                <label className={labelClass}>Précision (autre)</label>
                <input
                  className={inputClass}
                  value={form.site.operationTypeOther}
                  onChange={(e) => setSite({ operationTypeOther: e.target.value })}
                />
              </div>
            ) : (
              <div />
            )}
            <div>
              <label className={labelClass}>Date prévisionnelle de démarrage</label>
              <input
                type="date"
                className={inputClass}
                value={form.site.startDate}
                onChange={(e) => setSite({ startDate: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Durée estimée d&apos;intervention</label>
              <input
                className={inputClass}
                value={form.site.estimatedDuration}
                onChange={(e) => setSite({ estimatedDuration: e.target.value })}
                placeholder="Ex. 12 semaines"
              />
            </div>
            <div>
              <label className={labelClass}>Nombre maximum de compagnons</label>
              <input
                className={inputClass}
                value={form.site.maxWorkers}
                onChange={(e) => setSite({ maxWorkers: e.target.value })}
                placeholder="Ex. 8"
              />
            </div>
            <div>
              <label className={labelClass}>Présence de coactivité</label>
              <select
                className={inputClass}
                value={form.site.coactivity}
                onChange={(e) => setSite({ coactivity: e.target.value as PpspsSiteInfo["coactivity"] })}
              >
                {PPSPS_COACTIVITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Coordonnateur SPS</label>
              <input
                className={inputClass}
                value={form.site.spsCoordinator}
                onChange={(e) => setSite({ spsCoordinator: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Maître d&apos;ouvrage</label>
              <input
                className={inputClass}
                value={form.site.projectOwner}
                onChange={(e) => setSite({ projectOwner: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Maître d&apos;œuvre</label>
              <input
                className={inputClass}
                value={form.site.projectManager}
                onChange={(e) => setSite({ projectManager: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>Responsable sécurité / chef de chantier</label>
              <input
                className={inputClass}
                value={form.site.safetyManager}
                onChange={(e) => setSite({ safetyManager: e.target.value })}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-heading text-base font-bold text-slate-900">B. Corps d&apos;état concerné</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {PPSPS_TRADES.map((trade) => (
              <label
                key={trade}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.trades.includes(trade)}
                  onChange={() => toggleTrade(trade)}
                  className="h-4 w-4 rounded border-slate-300 text-[#1e3a5f]"
                />
                {trade}
              </label>
            ))}
          </div>
          {form.trades.includes("Autre") ? (
            <div className="mt-3">
              <label className={labelClass}>Précision corps d&apos;état</label>
              <input
                className={inputClass}
                value={form.tradeOther}
                onChange={(e) => setForm((f) => ({ ...f, tradeOther: e.target.value }))}
              />
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-heading text-base font-bold text-slate-900">C. Tâches à risques</h2>
          <p className="mt-1 text-sm text-slate-600">
            Cochez toutes les phases concernées par votre intervention ({form.selectedRiskTaskIds.length} sélectionnée
            {form.selectedRiskTaskIds.length > 1 ? "s" : ""}).
          </p>
          <div className="mt-4">
            <SkillPpspsRiskChecklist
              selectedIds={form.selectedRiskTaskIds}
              onChange={(selectedRiskTaskIds) => setForm((f) => ({ ...f, selectedRiskTaskIds }))}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-heading text-base font-bold text-slate-900">D. Niveau de sortie</h2>
          <div className="mt-3 space-y-2">
            {PPSPS_DETAIL_LEVELS.map((lvl) => (
              <label key={lvl.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
                <input
                  type="radio"
                  name="detailLevel"
                  checked={form.detailLevel === lvl.value}
                  onChange={() => setForm((f) => ({ ...f, detailLevel: lvl.value }))}
                  className="h-4 w-4 border-slate-300 text-[#1e3a5f]"
                />
                <span className="text-sm font-medium text-slate-800">{lvl.label}</span>
              </label>
            ))}
          </div>
        </section>

        <SkillPpspsOppbtpSearch
          query={form.oppbtpSearchQuery ?? ""}
          taskIds={form.selectedRiskTaskIds}
          onQueryChange={(oppbtpSearchQuery) => setForm((f) => ({ ...f, oppbtpSearchQuery }))}
          enabled={includeOppbtpHints}
          onEnabledChange={setIncludeOppbtpHints}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-heading text-base font-bold text-slate-900">E. Contraintes particulières</h2>
          <textarea
            className={`${inputClass} min-h-[100px]`}
            value={form.constraints}
            onChange={(e) => setForm((f) => ({ ...f, constraints: e.target.value }))}
            placeholder="site occupé, ERP, voirie ouverte, accès difficile, réseaux existants…"
          />
          <p className="mt-2 text-xs text-slate-500">
            Ex. site occupé, école / ERP, voirie ouverte, accès difficile, voisinage proche, délai court.
          </p>
        </section>

        {error ? (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void submitGeneration()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#152a45] disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Générer l&apos;analyse PPSPS
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw className="h-4 w-4" />
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Colonne résultat */}
      <div className="lg:sticky lg:top-6">
        <section className="flex min-h-[320px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="font-heading text-base font-bold text-slate-900">Résultat — analyse PPSPS</h2>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void copyResult()}
                disabled={!result?.markdown}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <Copy className="h-3.5 w-3.5" />
                {copyDone ? "Copié" : "Copier le résultat"}
              </button>
            </div>
          </div>
          <div className="space-y-3 border-b border-slate-100 px-5 pb-4">
            <SkillPpspsExportButtons sessionId={sessionId} disabled={loading} />
            {form.projectId && sessionId ? (
              <button
                type="button"
                onClick={() => void saveToProject()}
                disabled={saveLoading || loading || !result?.markdown}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50 sm:w-auto"
              >
                {saveLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Enregistrer dans le dossier chantier
              </button>
            ) : null}
            {saveMessage ? (
              <p className="text-xs text-emerald-800">
                {linkedDocumentId ? "Document ajouté au projet. " : ""}
                {saveMessage.startsWith("/") ? (
                  <Link href={saveMessage} className="font-semibold underline">
                    Voir le dossier projet
                  </Link>
                ) : (
                  saveMessage
                )}
              </p>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
                <p className="text-sm">Génération de l&apos;analyse en cours…</p>
              </div>
            ) : result?.markdown ? (
              <div className="space-y-4">
                {result.notice ? (
                  <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">{result.notice}</p>
                ) : null}
                {!result.usedLlm ? (
                  <p className="text-xs text-slate-500">Mode assisté — relire chaque phase avant validation.</p>
                ) : null}
                <SkillMarkdownBody markdown={result.markdown} />
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-slate-500">
                <p>Renseignez le formulaire et sélectionnez au moins une tâche à risque.</p>
                <p className="mt-2">L&apos;analyse structurée s&apos;affichera ici en Markdown.</p>
              </div>
            )}
          </div>
        </section>

        <SkillPpspsRefinePanel
          sessionId={sessionId}
          disabled={loading}
          loading={loading}
          onRefine={(instruction) => void submitGeneration({ refineInstruction: instruction })}
        />

        {form.generationMode === "ppsps_complet" ? (
          <p className="mt-3 text-xs text-amber-800">
            Mode PPSPS complet : trame étendue (organisation, installations, secours, environnement).
          </p>
        ) : null}
      </div>
    </div>
    </div>
  );
}

