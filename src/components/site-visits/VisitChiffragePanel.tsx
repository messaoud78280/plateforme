"use client";

import { useState } from "react";
import Link from "next/link";
import {
  emptyFinding,
  emptyProposedWork,
  RELATED_WORK_CHECKLIST,
  SURVEY_STAGE_LABELS,
  ZONE_PRESETS,
  type SiteVisitCommercialInfo,
  type SiteVisitFinding,
  type SiteVisitProposedWork,
  type SurveyStage,
} from "@/lib/site-visits/survey-types";
import { SITE_VISIT_LOTS } from "@/lib/site-visits/types";
import { ClipboardList, Ruler, ShieldAlert, Sparkles, Wallet } from "lucide-react";
import {
  VisitSectionCard,
  visitFieldClass,
  visitLabelClass,
} from "@/components/site-visits/VisitSectionCard";
import {
  VisitLotSheetsPanel,
  type LotSheets,
} from "@/components/site-visits/VisitLotSheetsPanel";

type Quality = {
  items: Array<{ id: string; label: string; status: string; detail: string }>;
  readyForQuote: boolean;
  label: string;
  openConfirmCount: number;
};

type Props = {
  visitId: string;
  canCreateQuote: boolean;
  quoteHref: string | null;
  quoteNumber: string | null;
  quality: Quality | null;
  surveyStage: string | null;
  findings: SiteVisitFinding[];
  proposedWorks: SiteVisitProposedWork[];
  commercial: SiteVisitCommercialInfo;
  zones: string[];
  lots: string[];
  lotSheets: LotSheets;
  onChange: (patch: {
    findings?: SiteVisitFinding[];
    proposedWorks?: SiteVisitProposedWork[];
    commercial?: SiteVisitCommercialInfo;
    surveyStage?: SurveyStage;
    lotSheets?: LotSheets;
  }) => void;
  onSave: () => Promise<void>;
  onCreateQuote: () => Promise<void>;
  busy: boolean;
  autosaveHint?: string | null;
};

export function VisitChiffragePanel({
  visitId,
  canCreateQuote,
  quoteHref,
  quoteNumber,
  quality,
  surveyStage,
  findings,
  proposedWorks,
  commercial,
  zones,
  lots,
  lotSheets,
  onChange,
  onSave,
  onCreateQuote,
  busy,
  autosaveHint,
}: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [promptPreview, setPromptPreview] = useState<string | null>(null);

  async function exportSurvey(format: "json" | "pdf" | "prompt") {
    setError(null);
    try {
      await onSave();
      const res = await fetch(
        `/api/site-visits/${visitId}/export-survey?format=${format}`,
      );
      if (format === "pdf") {
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "Export PDF impossible");
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `compte-rendu-visite.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        setToast("PDF téléchargé");
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export impossible");
      if (format === "prompt") {
        setPromptPreview(data.prompt);
        await navigator.clipboard.writeText(data.prompt);
        setToast("Instructions ChatGPT copiées");
        onChange({ surveyStage: "EXPORTED" });
        return;
      }
      await navigator.clipboard.writeText(JSON.stringify(data.survey, null, 2));
      setToast("JSON bework_site_survey_v1 copié");
      onChange({ surveyStage: "EXPORTED" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur export");
    }
  }

  return (
    <div className="space-y-4">
      {autosaveHint ? (
        <p className="text-[12px] font-medium text-slate-500">{autosaveHint}</p>
      ) : null}
      {toast ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {toast}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <VisitSectionCard
        tone="navy"
        icon={ClipboardList}
        title="Qualité du dossier de chiffrage"
        hint="Indicateur métier — ne force pas le remplissage de tous les champs."
      >
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              quality?.readyForQuote
                ? "bg-emerald-100 text-emerald-900"
                : "bg-amber-100 text-amber-950"
            }`}
          >
            {quality?.label ?? "DOSSIER À COMPLÉTER"}
          </span>
          {surveyStage ? (
            <span className="text-xs text-slate-500">
              Étape :{" "}
              {SURVEY_STAGE_LABELS[surveyStage as SurveyStage] ?? surveyStage}
            </span>
          ) : null}
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {(quality?.items ?? []).map((item) => (
            <li
              key={item.id}
              className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 text-sm"
            >
              <p className="font-semibold text-slate-800">{item.label}</p>
              <p
                className={
                  item.status === "ok"
                    ? "text-xs text-emerald-700"
                    : item.status === "missing"
                      ? "text-xs text-red-700"
                      : "text-xs text-amber-800"
                }
              >
                {item.detail}
              </p>
            </li>
          ))}
        </ul>
      </VisitSectionCard>

      <VisitSectionCard
        tone="watch"
        icon={ShieldAlert}
        title="Demande client vs proposition"
        hint="Distinguer clairement ce qui est demandé et ce qui est proposé."
      >
        <div className="space-y-3">
          {(findings.length ? findings : [emptyFinding()]).map((f, idx) => (
            <div key={f.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
              <label className="block">
                <span className={visitLabelClass}>Observation factuelle</span>
                <textarea
                  className={visitFieldClass}
                  rows={2}
                  value={f.fact}
                  onChange={(e) => {
                    const next = [...findings];
                    if (!next[idx]) next[idx] = { ...emptyFinding(), ...f };
                    next[idx] = { ...next[idx]!, fact: e.target.value };
                    onChange({ findings: next });
                  }}
                />
              </label>
              <label className="block">
                <span className={visitLabelClass}>Hypothèse technique à confirmer</span>
                <textarea
                  className={visitFieldClass}
                  rows={2}
                  value={f.hypothesis ?? ""}
                  onChange={(e) => {
                    const next = [...(findings.length ? findings : [f])];
                    next[idx] = { ...next[idx]!, hypothesis: e.target.value };
                    onChange({ findings: next });
                  }}
                />
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className={visitLabelClass}>Zone</span>
                  <select
                    className={visitFieldClass}
                    value={f.zone ?? ""}
                    onChange={(e) => {
                      const next = [...(findings.length ? findings : [f])];
                      next[idx] = { ...next[idx]!, zone: e.target.value || null };
                      onChange({ findings: next });
                    }}
                  >
                    <option value="">—</option>
                    {[...new Set([...zones, ...ZONE_PRESETS])].map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={visitLabelClass}>À vérifier</span>
                  <input
                    className={visitFieldClass}
                    value={f.toVerify ?? ""}
                    onChange={(e) => {
                      const next = [...(findings.length ? findings : [f])];
                      next[idx] = { ...next[idx]!, toVerify: e.target.value };
                      onChange({ findings: next });
                    }}
                  />
                </label>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-semibold text-[#1d4ed8]"
            onClick={() => onChange({ findings: [...findings, emptyFinding()] })}
          >
            + Ajouter un constat
          </button>
        </div>
      </VisitSectionCard>

      <VisitSectionCard
        tone="accent"
        icon={Ruler}
        title="Travaux à chiffrer"
        hint="Chaque poste pourra nourrir une ligne de devis. Aucune prestation annexe n’est ajoutée automatiquement."
      >
        <div className="space-y-3">
          {proposedWorks.map((w, idx) => (
            <div key={w.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className={visitLabelClass}>Lot</span>
                  <select
                    className={visitFieldClass}
                    value={w.lot}
                    onChange={(e) => {
                      const next = [...proposedWorks];
                      next[idx] = { ...w, lot: e.target.value };
                      onChange({ proposedWorks: next });
                    }}
                  >
                    <option value="">—</option>
                    {SITE_VISIT_LOTS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={visitLabelClass}>Zone</span>
                  <input
                    className={visitFieldClass}
                    value={w.zone ?? ""}
                    onChange={(e) => {
                      const next = [...proposedWorks];
                      next[idx] = { ...w, zone: e.target.value };
                      onChange({ proposedWorks: next });
                    }}
                  />
                </label>
              </div>
              <label className="block">
                <span className={visitLabelClass}>Désignation</span>
                <input
                  className={visitFieldClass}
                  value={w.designation}
                  onChange={(e) => {
                    const next = [...proposedWorks];
                    next[idx] = { ...w, designation: e.target.value };
                    onChange({ proposedWorks: next });
                  }}
                />
              </label>
              <label className="block">
                <span className={visitLabelClass}>Description technique</span>
                <textarea
                  className={visitFieldClass}
                  rows={2}
                  value={w.description ?? ""}
                  onChange={(e) => {
                    const next = [...proposedWorks];
                    next[idx] = { ...w, description: e.target.value };
                    onChange({ proposedWorks: next });
                  }}
                />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className={visitLabelClass}>Quantité</span>
                  <input
                    type="number"
                    className={visitFieldClass}
                    value={w.quantity ?? ""}
                    onChange={(e) => {
                      const next = [...proposedWorks];
                      next[idx] = {
                        ...w,
                        quantity: e.target.value === "" ? null : Number(e.target.value),
                      };
                      onChange({ proposedWorks: next });
                    }}
                  />
                </label>
                <label className="block">
                  <span className={visitLabelClass}>Unité</span>
                  <input
                    className={visitFieldClass}
                    value={w.unit ?? ""}
                    onChange={(e) => {
                      const next = [...proposedWorks];
                      next[idx] = { ...w, unit: e.target.value };
                      onChange({ proposedWorks: next });
                    }}
                  />
                </label>
                <label className="block">
                  <span className={visitLabelClass}>Source</span>
                  <select
                    className={visitFieldClass}
                    value={w.quantitySource ?? "to_confirm"}
                    onChange={(e) => {
                      const next = [...proposedWorks];
                      next[idx] = {
                        ...w,
                        quantitySource: e.target.value as SiteVisitProposedWork["quantitySource"],
                      };
                      onChange({ proposedWorks: next });
                    }}
                  >
                    <option value="measured">Mesuré</option>
                    <option value="calculated">Calculé</option>
                    <option value="declared">Déclaré</option>
                    <option value="estimated">Estimé</option>
                    <option value="proposed">Proposé</option>
                    <option value="to_confirm">À confirmer</option>
                  </select>
                </label>
              </div>
              <label className="block">
                <span className={visitLabelClass}>Matériau / mise en œuvre</span>
                <input
                  className={visitFieldClass}
                  value={[w.material, w.method].filter(Boolean).join(" — ")}
                  onChange={(e) => {
                    const next = [...proposedWorks];
                    next[idx] = { ...w, material: e.target.value, method: w.method };
                    onChange({ proposedWorks: next });
                  }}
                />
              </label>
              <div>
                <p className={visitLabelClass}>Prestations annexes possibles (à cocher)</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {(RELATED_WORK_CHECKLIST[w.lot] ?? RELATED_WORK_CHECKLIST.default).map((item) => {
                    const checked = w.relatedChecklist?.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          const set = new Set(w.relatedChecklist ?? []);
                          if (checked) set.delete(item);
                          else set.add(item);
                          const next = [...proposedWorks];
                          next[idx] = { ...w, relatedChecklist: [...set] };
                          onChange({ proposedWorks: next });
                        }}
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                          checked
                            ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                            : "border-slate-200 bg-white text-slate-700"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="text-sm font-semibold text-[#1d4ed8]"
            onClick={() =>
              onChange({
                proposedWorks: [...proposedWorks, emptyProposedWork(lots[0] || "")],
              })
            }
          >
            + Ajouter une prestation
          </button>
        </div>
      </VisitSectionCard>

      <VisitLotSheetsPanel
        lots={lots}
        values={lotSheets}
        onChange={(next) => onChange({ lotSheets: next })}
      />

      <VisitSectionCard
        tone="violet"
        icon={Wallet}
        title="Informations commerciales"
        hint="Contexte uniquement — ne détermine pas automatiquement les prix du devis."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["budgetAnnounced", "Budget annoncé"],
              ["budgetMax", "Budget max"],
              ["desiredDelay", "Délai souhaité"],
              ["desiredStart", "Démarrage souhaité"],
              ["urgency", "Urgence"],
              ["variants", "Variantes"],
              ["optionals", "Options"],
              ["supplyByClient", "Fournitures client"],
              ["supplyByCompany", "Fournitures entreprise"],
              ["specialExpectations", "Attentes particulières"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block">
              <span className={visitLabelClass}>{label}</span>
              <input
                className={visitFieldClass}
                value={commercial[key] ?? ""}
                onChange={(e) =>
                  onChange({ commercial: { ...commercial, [key]: e.target.value } })
                }
              />
            </label>
          ))}
        </div>
      </VisitSectionCard>

      <VisitSectionCard
        tone="ok"
        icon={Sparkles}
        title="Compte rendu & export ChatGPT"
        hint="Aucune API IA dans BeWork. Vous copiez le dossier, ChatGPT produit le devis JSON."
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void exportSurvey("prompt")}
            className="rounded-xl bg-[#1e3a5f] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            ✨ Préparer le dossier pour ChatGPT
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void exportSurvey("json")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800"
          >
            Copier le JSON survey
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void exportSurvey("pdf")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800"
          >
            Générer le PDF
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void (async () => {
                try {
                  await onSave();
                  window.location.href = `/api/site-visits/${visitId}/export-survey?format=zip`;
                  setToast("Téléchargement ZIP lancé");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Erreur ZIP");
                }
              })();
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800"
          >
            Exporter ZIP (PDF + JSON + photos)
          </button>
          {canCreateQuote ? (
            quoteHref ? (
              <Link
                href={quoteHref}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-900"
              >
                Ouvrir le devis {quoteNumber}
              </Link>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => void onCreateQuote()}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-900"
              >
                Créer un devis depuis cette visite
              </button>
            )
          ) : null}
        </div>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-slate-600">
          <li>Copiez les instructions + données (bouton violet)</li>
          <li>Collez-les dans ChatGPT</li>
          <li>Récupérez un JSON <code>bework_quote_bundle_v1</code></li>
          <li>Importez-le dans Devis & Facturation</li>
        </ol>
        {promptPreview ? (
          <textarea
            readOnly
            rows={8}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-[11px]"
            value={promptPreview.slice(0, 4000) + (promptPreview.length > 4000 ? "\n…" : "")}
          />
        ) : null}
      </VisitSectionCard>
    </div>
  );
}
