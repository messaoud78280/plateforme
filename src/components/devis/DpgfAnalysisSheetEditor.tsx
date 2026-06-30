"use client";

import type { DpgfAnalysisSheet } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createDpgfAnalysisSheet, updateDpgfAnalysisSheet } from "@/app/dashboard/devis/analyse-dpgf-actions";
import {
  DPGF_ANALYSIS_LEVEL_LABELS,
  DPGF_ANALYSIS_SOURCE_LABELS,
  DPGF_ANALYSIS_STATUS_LABELS,
} from "@/lib/dpgf-analysis/labels";
import { joinLinesField, parseDpgfAnalysisContent, emptyDpgfAnalysisContent } from "@/lib/dpgf-analysis/content-utils";
import { DpgfAnalysisModeOperatoireDetailleFields } from "@/components/devis/DpgfAnalysisModeOperatoireDetailleFields";
import { readIntervenantConcerneRaw } from "@/lib/dpgf-analysis/intervenant-concerne";
import { formatManualPriceHtForInput } from "@/lib/dpgf-analysis/manual-price";
import type { DpgfAnalysisModeOperatoireDetaille, DpgfAnalysisSheetLinks } from "@/lib/dpgf-analysis/types";
import { WORK_ITEM_UNITS } from "@/lib/be-work-devis-labels";
import { getBeWorkFamilyLexiconSorted } from "@/lib/bework-devis-family-codes";

const FAMILY_LEX = getBeWorkFamilyLexiconSorted();

type Props = {
  mode: "create" | "edit";
  sheet?: DpgfAnalysisSheet;
};

export function DpgfAnalysisSheetEditor({ mode, sheet }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const content = sheet ? parseDpgfAnalysisContent(sheet.content) : emptyDpgfAnalysisContent();
  const links = (sheet?.links ?? {}) as DpgfAnalysisSheetLinks;
  const [modeOperatoireDetaille, setModeOperatoireDetaille] = useState<DpgfAnalysisModeOperatoireDetaille>(
    content.modeOperatoireDetaille,
  );
  const intervenantDefault = sheet
    ? readIntervenantConcerneRaw(sheet.intervenantConcerne, content.realWorld.whoDoesIt)
    : "";

  return (
    <form
      className="space-y-6"
      action={(fd) => {
        setError(null);
        startTransition(async () => {
          const res = mode === "create" ? await createDpgfAnalysisSheet(fd) : await updateDpgfAnalysisSheet(fd);
          if (res.ok) {
            router.push(mode === "create" && "id" in res ? `/dashboard/devis/analyse-dpgf/${res.id}` : `/dashboard/devis/analyse-dpgf/${sheet!.id}`);
            router.refresh();
          } else setError(res.error);
        });
      }}
    >
      {mode === "edit" && sheet ? <input type="hidden" name="id" value={sheet.id} /> : null}

      <EditorSection title="A. Identification">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mode === "edit" && sheet ? (
            <ReadOnlyField label="Code fiche" value={sheet.codeSheet} />
          ) : null}
          <Input name="lot" label="Lot DPGF *" required defaultValue={sheet?.lot} placeholder="Ex. 01" />
          <Input name="linkLotNote" label="Lot lié (libellé marché)" defaultValue={links.lotNote ?? content.realWorld.linkedLots ?? ""} placeholder="Ex. Lot 01 — Fondations / Gros œuvre" />
          <Input name="familyName" label="Famille d'ouvrage" defaultValue={sheet?.familyName ?? ""} />
          <Input name="ouvrageType" label="Type d'ouvrage" defaultValue={sheet?.ouvrageType ?? ""} />
          <Select
            name="unit"
            label="Unité *"
            required
            defaultValue={sheet?.unit ?? "m²"}
            options={WORK_ITEM_UNITS.map((u) => ({ value: u, label: u }))}
          />
          <Select
            name="source"
            label="Source"
            defaultValue={sheet?.source ?? "manuel"}
            options={Object.entries(DPGF_ANALYSIS_SOURCE_LABELS).map(([k, v]) => ({ value: k, label: v }))}
          />
          <Select
            name="status"
            label="Statut"
            defaultValue={sheet?.status ?? "brouillon"}
            options={Object.entries(DPGF_ANALYSIS_STATUS_LABELS)
              .filter(([k]) => k !== "archive")
              .map(([k, v]) => ({ value: k, label: v }))}
          />
          <Select
            name="comprehensionLevel"
            label="Niveau de compréhension"
            defaultValue={sheet?.comprehensionLevel ?? "intermediaire"}
            options={Object.entries(DPGF_ANALYSIS_LEVEL_LABELS).map(([k, v]) => ({ value: k, label: v }))}
          />
        </div>
        <Textarea name="originalDesignation" label="Désignation DPGF d'origine *" required rows={3} defaultValue={sheet?.originalDesignation} />
        <Input name="simplifiedDesignation" label="Désignation simplifiée" defaultValue={sheet?.simplifiedDesignation ?? ""} />
        <ManualPriceField defaultValue={formatManualPriceHtForInput(sheet?.manualPriceHt)} />
        <Textarea
          name="intervenantConcerne"
          label="Intervenant concerné"
          rows={3}
          defaultValue={intervenantDefault}
          className="sm:col-span-2"
        />
        <p className="text-xs text-slate-500 sm:col-span-2">
          Qui réalise ou pilote réellement la prestation — distinct du lot DPGF. Laissez vide pour afficher « À définir
          selon le marché ».
        </p>
      </EditorSection>

      <EditorSection title="Référencement interne (optionnel)">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            name="tradeCode"
            label="Code corps métier BeWork (filtre)"
            defaultValue={sheet?.tradeCode ?? ""}
            options={[{ value: "", label: "— Non renseigné —" }, ...FAMILY_LEX.map((f) => ({ value: f.code, label: `${f.code} — ${f.label}` }))]}
          />
        </div>
      </EditorSection>

      <EditorSection title="Liens marché (sans prix)">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="linkCctp" label="Réf. CCTP" defaultValue={links.cctpReference ?? ""} />
          <Input name="linkPlan" label="Réf. plan" defaultValue={links.planReference ?? ""} />
          <Input name="linkDcePiece" label="Pièce DCE" defaultValue={links.dcePieceNote ?? ""} />
          <Input name="dceFillSessionId" label="ID session DCE" defaultValue={sheet?.dceFillSessionId ?? ""} />
          <Input name="dceLineIndex" label="Index ligne DCE" defaultValue={sheet?.dceLineIndex?.toString() ?? ""} />
          <Input name="workItemId" label="ID ouvrage bibliothèque (lien optionnel)" defaultValue={sheet?.workItemId ?? ""} />
          <Input name="quoteDocumentId" label="ID document devis/DPGF" defaultValue={sheet?.quoteDocumentId ?? ""} />
          <Textarea name="linkInternalNote" label="Note interne" rows={2} defaultValue={links.internalNote ?? ""} className="sm:col-span-2" />
        </div>
      </EditorSection>

      <EditorSection title="B. Traduction simple">
        <Textarea name="trMeaning" label="Que veut dire cette ligne ?" rows={2} defaultValue={content.translation.meaning} />
        <Textarea name="trBeginner" label="Traduction débutant" rows={2} defaultValue={content.translation.beginnerLanguage} />
        <Textarea name="trTerms" label="Mots techniques à expliquer" rows={2} defaultValue={content.translation.technicalTerms} />
        <Textarea name="trExample" label="Exemple concret" rows={2} defaultValue={content.translation.concreteExample} />
      </EditorSection>

      <EditorSection title="C. À quoi correspond réellement l'ouvrage ?">
        <FieldGrid prefix="rw" fields={[
          ["What", "C'est quoi ?"],
          ["Purpose", "À quoi ça sert ?"],
          ["Where", "Où sur le chantier ?"],
          ["When", "Quand dans le chantier ?"],
          ["LinkedLots", "Lot lié (rappel)"],
        ]} content={content.realWorld} keyMap={{
          What: "whatIsIt", Purpose: "purpose", Where: "whereOnSite", When: "whenInProject", LinkedLots: "linkedLots",
        }} />
      </EditorSection>

      <EditorSection title="D. Ce que la ligne peut inclure">
            <FieldGrid prefix="inc" fields={[
              ["Supply", "Fourniture"],
              ["Install", "Pose"],
              ["Accessories", "Accessoires"],
              ["Fixings", "Fixations"],
              ["Prep", "Préparation"],
              ["Cuts", "Découpes"],
              ["Adjust", "Réglages"],
              ["Clean", "Nettoyage"],
              ["Protect", "Protection"],
              ["Minor", "Petites sujétions"],
            ]} content={content.included} keyMap={{
              Supply: "supply", Install: "installation", Accessories: "accessories", Fixings: "fixings",
              Prep: "preparation", Cuts: "cuts", Adjust: "adjustments", Clean: "cleaning", Protect: "protection", Minor: "minorItems",
            }} />
      </EditorSection>

      <EditorSection title="E. Ce qui peut ne pas être inclus">
            <FieldGrid prefix="exc" fields={[
              ["Demo", "Dépose existante"],
              ["Waste", "Évacuation déchets"],
              ["Substrate", "Reprise support"],
              ["Treatment", "Traitement particulier"],
              ["Finish", "Finition"],
              ["Paint", "Peinture"],
              ["Studies", "Études"],
              ["Plans", "Plans d'exécution"],
              ["Access", "Moyens d'accès"],
              ["Handling", "Manutention difficile"],
              ["Penetrations", "Percements / réservations"],
              ["Coord", "Coordination lots"],
            ]} content={content.excluded} keyMap={{
              Demo: "demolition", Waste: "wasteEvacuation", Substrate: "substrateRepair", Treatment: "specialTreatment",
              Finish: "finishing", Paint: "painting", Studies: "studies", Plans: "executionPlans", Access: "accessMeans",
              Handling: "difficultHandling", Penetrations: "penetrations", Coord: "lotCoordination",
            }} />
      </EditorSection>

      <EditorSection title="F. Documents à vérifier">
            <FieldGrid prefix="doc" fields={[
              ["Cctp", "CCTP"], ["Dpgf", "DPGF"], ["Bpu", "BPU"], ["Arch", "Plans architecte"],
              ["Tech", "Plans techniques"], ["Sections", "Détails de coupe"], ["Joinery", "Carnet menuiseries"],
              ["Manufacturer", "Fiches fabricant"], ["Notices", "Notices"], ["Dtu", "DTU / règles pro"], ["Photos", "Photos / visite"],
            ]} content={content.documentsToCheck} keyMap={{
              Cctp: "cctp", Dpgf: "dpgf", Bpu: "bpu", Arch: "architectPlans", Tech: "technicalPlans",
              Sections: "sectionDetails", Joinery: "joineryBook", Manufacturer: "manufacturerSheets",
              Notices: "notices", Dtu: "dtuRules", Photos: "sitePhotos",
            }} />
      </EditorSection>

      <EditorSection title="G. & H. Listes de vérification">
        <Textarea name="listCctpChecks" label="Points CCTP (une ligne = un point)" rows={5} defaultValue={joinLinesField(content.cctpChecks)} />
        <Textarea name="listPlanChecks" label="Points plans (une ligne = un point)" rows={5} defaultValue={joinLinesField(content.planChecks)} />
      </EditorSection>

      <EditorSection title="I. Mode opératoire simplifié">
            {content.modeOperatoire.map((step, i) => (
              <div key={step.order} className="rounded-xl border border-slate-100 p-4">
                <input type="hidden" name={`moTitle${i + 1}`} value={step.title} />
                <p className="text-xs font-bold text-[#1e3a5f]">{i + 1}. {step.title}</p>
                <Textarea name={`moDesc${i + 1}`} label="Description" rows={2} defaultValue={step.description} />
                <Textarea name={`moWhy${i + 1}`} label="Pourquoi c'est important" rows={2} defaultValue={step.whyImportant} />
              </div>
        ))}
      </EditorSection>

      <EditorSection title="I+. Mode opératoire détaillé">
        <p className="text-xs text-slate-500">
          Étapes concrètes pour former un novice — distinct du mode opératoire simplifié ci-dessus.
        </p>
        <DpgfAnalysisModeOperatoireDetailleFields
          value={modeOperatoireDetaille}
          onChange={setModeOperatoireDetaille}
          hiddenInputName="modeOperatoireDetailleJson"
        />
      </EditorSection>

      <EditorSection title="J. à L. Vigilance, questions, erreurs novice">
        <Textarea name="listVigilance" label="Points de vigilance" rows={5} defaultValue={joinLinesField(content.vigilancePoints)} />
        <Textarea name="listQuestions" label="Questions à poser" rows={5} defaultValue={joinLinesField(content.questionsBeforeValidation)} />
        <Textarea name="listNoviceErrors" label="Erreurs fréquentes d'un novice" rows={4} defaultValue={joinLinesField(content.noviceErrors)} />
      </EditorSection>

      <EditorSection title="M. Résumé à retenir" highlight>
        <Textarea name="sumMeaning" label="Ce que cette ligne veut dire" rows={2} defaultValue={content.summary.meaning} />
        <Textarea name="sumMustVerify" label="Ce qu'il faut absolument vérifier" rows={2} defaultValue={content.summary.mustVerify} />
        <Textarea name="sumMainRisk" label="Principal risque d'erreur" rows={2} defaultValue={content.summary.mainRisk} />
        <Textarea name="sumPriorityDoc" label="Document à consulter en priorité" rows={2} defaultValue={content.summary.priorityDocument} />
        <Textarea name="sumKeyQuestion" label="Question la plus importante" rows={2} defaultValue={content.summary.keyQuestion} />
      </EditorSection>

      {error ? <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#162d4a] disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : mode === "create" ? "Créer la fiche" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

function EditorSection({ title, children, highlight }: { title: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <section className={highlight ? "rounded-2xl border border-[#1e3a5f]/20 bg-[#eff6ff]/30 p-5" : "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"}>
      <h2 className="font-heading text-base font-bold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Input({ name, label, required, defaultValue, placeholder }: {
  name: string; label: string; required?: boolean; defaultValue?: string; placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-xs font-semibold text-slate-700">{label}</label>
      <input id={name} name={name} required={required} defaultValue={defaultValue} placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
    </div>
  );
}

function Select({ name, label, required, defaultValue, options }: {
  name: string; label: string; required?: boolean; defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label htmlFor={name} className="text-xs font-semibold text-slate-700">{label}</label>
      <select id={name} name={name} required={required} defaultValue={defaultValue}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
        {options.map((o) => (
          <option key={o.value || "empty"} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Textarea({ name, label, required, rows, defaultValue, className }: {
  name: string; label: string; required?: boolean; rows?: number; defaultValue?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="text-xs font-semibold text-slate-700">{label}</label>
      <textarea id={name} name={name} required={required} rows={rows ?? 3} defaultValue={defaultValue}
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-700">{label}</p>
      <p className="mt-1 rounded-xl bg-slate-50 px-3 py-2 font-mono text-sm">{value}</p>
    </div>
  );
}

function ManualPriceField({ defaultValue }: { defaultValue: string }) {
  return (
    <div className="max-w-xs">
      <label htmlFor="manualPriceHt" className="text-xs font-semibold text-slate-700">
        Prix manuel HT
      </label>
      <div className="mt-1 flex items-center gap-2">
        <input
          id="manualPriceHt"
          name="manualPriceHt"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="Ex. 250,00"
          defaultValue={defaultValue}
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <span className="shrink-0 text-sm font-medium text-slate-600">€ HT</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">Saisie manuelle uniquement — laissez vide si non renseigné.</p>
    </div>
  );
}

function FieldGrid({
  prefix,
  fields,
  content,
  keyMap,
}: {
  prefix: string;
  fields: [string, string][];
  content: Record<string, string>;
  keyMap?: Record<string, string>;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map(([suffix, label]) => {
        const key = keyMap?.[suffix] ?? suffix.charAt(0).toLowerCase() + suffix.slice(1);
        const name = `${prefix}${suffix}`;
        return (
          <Textarea key={name} name={name} label={label} rows={2} defaultValue={content[key] ?? ""} />
        );
      })}
    </div>
  );
}
