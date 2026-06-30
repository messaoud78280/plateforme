import type { DpgfAnalysisSheet, WorkItemStatus } from "@prisma/client";
import {
  DPGF_ANALYSIS_LEVEL_LABELS,
  DPGF_ANALYSIS_SOURCE_LABELS,
  DPGF_ANALYSIS_STATUS_LABELS,
} from "@/lib/dpgf-analysis/labels";
import { isSameTranslationText, parseDpgfAnalysisContent } from "@/lib/dpgf-analysis/content-utils";
import {
  hasModeOperatoireDetailleContent,
  MODE_OPERATOIRE_DETAILLE_LIST_FIELDS,
} from "@/lib/dpgf-analysis/mode-operatoire-detaille";
import {
  displayIntervenantConcerne,
  formatLotDpgfDisplay,
  formatLotLieDisplay,
  isIntervenantExplicitlySet,
} from "@/lib/dpgf-analysis/intervenant-concerne";
import { manualPriceHtToNumber } from "@/lib/dpgf-analysis/manual-price";
import { hasTechnicalTermsContent, parseTechnicalTermsDisplay } from "@/lib/dpgf-analysis/technical-terms";
import type { DpgfAnalysisModeOperatoireDetaille, DpgfAnalysisSheetLinks } from "@/lib/dpgf-analysis/types";
import { formatEurFrBpu } from "@/lib/be-work-devis-format";

type Props = { sheet: DpgfAnalysisSheet };

const SECTION_NAV = [
  { id: "identification", letter: "A", label: "Identification" },
  { id: "traduction", letter: "B", label: "Traduction" },
  { id: "ouvrage", letter: "C", label: "Ouvrage réel" },
  { id: "inclus", letter: "D", label: "Inclus" },
  { id: "exclus", letter: "E", label: "Exclus" },
  { id: "documents", letter: "F", label: "Documents" },
  { id: "cctp", letter: "G", label: "CCTP" },
  { id: "plans", letter: "H", label: "Plans" },
  { id: "mode-operatoire", letter: "I", label: "Mode op." },
  { id: "mode-operatoire-detaille", letter: "I+", label: "Mode op. dét." },
  { id: "vigilance", letter: "J", label: "Vigilance" },
  { id: "questions", letter: "K", label: "Questions" },
  { id: "novice", letter: "L", label: "Novice" },
  { id: "resume", letter: "M", label: "Résumé" },
] as const;

export function DpgfAnalysisSheetView({ sheet }: Props) {
  const content = parseDpgfAnalysisContent(sheet.content);
  const links = (sheet.links ?? {}) as DpgfAnalysisSheetLinks;
  const lotDpgf = formatLotDpgfDisplay(sheet.lot, links.lotNote);
  const lotLie = formatLotLieDisplay(links.lotNote, content.realWorld.linkedLots, sheet.lot);
  const intervenantContext = {
    linkedLots: content.realWorld.linkedLots,
    familyName: sheet.familyName ?? "",
    lotLabel: links.lotNote ?? lotDpgf,
  };
  const intervenantDisplay = displayIntervenantConcerne(
    sheet.intervenantConcerne,
    content.realWorld.whoDoesIt,
    intervenantContext,
  );
  const intervenantExplicit = isIntervenantExplicitlySet(
    sheet.intervenantConcerne,
    content.realWorld.whoDoesIt,
    intervenantContext,
  );
  const manualPrice = manualPriceHtToNumber(sheet.manualPriceHt);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-[#1e3a5f]/15 bg-gradient-to-br from-[#f8fafc] via-white to-[#eff6ff]/40 p-5 shadow-sm lg:p-6">
        <div className="flex flex-wrap gap-2">
          <StatusPill status={sheet.status} />
          <MetaPill label={DPGF_ANALYSIS_LEVEL_LABELS[sheet.comprehensionLevel]} />
          <MetaPill label={`Lot ${sheet.lot}`} />
          <MetaPill label={sheet.unit} mono />
          {manualPrice != null ? <MetaPill label={`${formatEurFrBpu(manualPrice)} HT`} accent /> : null}
        </div>
        {content.summary.meaning?.trim() ? (
          <p className="mt-4 text-base leading-relaxed text-slate-800">{content.summary.meaning}</p>
        ) : null}
        {content.summary.mustVerify?.trim() ? (
          <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            <span className="font-semibold">À vérifier en priorité : </span>
            {content.summary.mustVerify}
          </p>
        ) : null}
      </div>

      <nav
        aria-label="Sections de la fiche"
        className="sticky top-16 z-10 -mx-1 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/95 px-2 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80"
      >
        <ul className="flex min-w-max gap-1.5">
          {SECTION_NAV.map((s) => (
            <li key={s.id}>
              <a
                href={`#dpgf-${s.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-[#1e3a5f]/8 hover:text-[#1e3a5f]"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-md bg-[#1e3a5f] text-[10px] font-bold text-white">
                  {s.letter}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <Section id="identification" letter="A" title="Identification">
            <MetaGrid
              items={[
                ["Code fiche", sheet.codeSheet],
                ["Lot DPGF", lotDpgf],
                ["Famille d'ouvrage", sheet.familyName ?? "—"],
                ["Type d'ouvrage", sheet.ouvrageType ?? "—"],
                ["Unité", sheet.unit],
                ["Source", DPGF_ANALYSIS_SOURCE_LABELS[sheet.source]],
                ["Statut", DPGF_ANALYSIS_STATUS_LABELS[sheet.status]],
                ["Niveau", DPGF_ANALYSIS_LEVEL_LABELS[sheet.comprehensionLevel]],
                ["Prix manuel HT", manualPrice != null ? `${formatEurFrBpu(manualPrice)} HT` : "—"],
                [
                  "Intervenant concerné",
                  <span key="intervenant" className={intervenantExplicit ? "" : "text-slate-500 italic"}>
                    {intervenantDisplay}
                  </span>,
                ],
              ]}
            />
            {lotLie !== "—" && lotLie !== lotDpgf ? (
              <Callout label="Lot lié">{lotLie}</Callout>
            ) : null}
            <ProseBlock label="Désignation DPGF d'origine" text={sheet.originalDesignation} prominent />
            {sheet.simplifiedDesignation ? (
              <ProseBlock label="Désignation simplifiée" text={sheet.simplifiedDesignation} />
            ) : null}
          </Section>

          <Section id="traduction" letter="B" title="Traduction simple">
            <ProseBlock label="Que veut dire cette ligne ?" text={content.translation.meaning} prominent />
            {!isSameTranslationText(content.translation.meaning, content.translation.beginnerLanguage) ? (
              <ProseBlock label="Traduction débutant" text={content.translation.beginnerLanguage} />
            ) : null}
            <TechnicalTermsBlock text={content.translation.technicalTerms} />
            <ProseBlock label="Exemple concret" text={content.translation.concreteExample} />
          </Section>

          <Section id="ouvrage" letter="C" title="À quoi correspond réellement l'ouvrage ?">
            <div className="grid gap-3 sm:grid-cols-2">
              <ProseBlock label="C'est quoi ?" text={content.realWorld.whatIsIt} />
              <ProseBlock label="À quoi ça sert ?" text={content.realWorld.purpose} />
              <ProseBlock label="Où sur le chantier ?" text={content.realWorld.whereOnSite} />
              <ProseBlock label="Quand dans le chantier ?" text={content.realWorld.whenInProject} />
            </div>
            <ProseBlock label="Qui le réalise ?" text={intervenantExplicit ? intervenantDisplay : ""} />
            {!intervenantExplicit ? (
              <AlertBox>
                Intervenant à préciser dans « Intervenant concerné » ou via{" "}
                <code className="rounded bg-amber-100 px-1 text-xs">comprehension.qui_le_realise</code> — ne pas
                confondre avec le lot DPGF.
              </AlertBox>
            ) : null}
            <ProseBlock label="Lot lié" text={lotLie !== "—" ? lotLie : content.realWorld.linkedLots} />
          </Section>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section id="inclus" letter="D" title="Ce que la ligne peut inclure" compact>
              <KeyValueGrid
                entries={[
                  ["Fourniture", content.included.supply],
                  ["Pose", content.included.installation],
                  ["Accessoires", content.included.accessories],
                  ["Fixations", content.included.fixings],
                  ["Préparation", content.included.preparation],
                  ["Découpes", content.included.cuts],
                  ["Réglages", content.included.adjustments],
                  ["Nettoyage", content.included.cleaning],
                  ["Protection", content.included.protection],
                  ["Petites sujétions", content.included.minorItems],
                ]}
                tone="inclus"
              />
            </Section>

            <Section id="exclus" letter="E" title="Ce qui peut ne pas être inclus" compact>
              <KeyValueGrid
                entries={[
                  ["Dépose existante", content.excluded.demolition],
                  ["Évacuation déchets", content.excluded.wasteEvacuation],
                  ["Reprise support", content.excluded.substrateRepair],
                  ["Traitement particulier", content.excluded.specialTreatment],
                  ["Finition", content.excluded.finishing],
                  ["Peinture", content.excluded.painting],
                  ["Études", content.excluded.studies],
                  ["Plans d'exécution", content.excluded.executionPlans],
                  ["Moyens d'accès", content.excluded.accessMeans],
                  ["Manutention difficile", content.excluded.difficultHandling],
                  ["Percements / réservations", content.excluded.penetrations],
                  ["Coordination lots", content.excluded.lotCoordination],
                ]}
                tone="exclus"
              />
            </Section>
          </div>

          <Section id="documents" letter="F" title="Documents à vérifier">
            <KeyValueGrid
              entries={[
                ["CCTP", content.documentsToCheck.cctp],
                ["DPGF", content.documentsToCheck.dpgf],
                ["BPU", content.documentsToCheck.bpu],
                ["Plans architecte", content.documentsToCheck.architectPlans],
                ["Plans techniques", content.documentsToCheck.technicalPlans],
                ["Détails de coupe", content.documentsToCheck.sectionDetails],
                ["Carnet menuiseries", content.documentsToCheck.joineryBook],
                ["Fiches fabricant", content.documentsToCheck.manufacturerSheets],
                ["Notices", content.documentsToCheck.notices],
                ["DTU / règles pro", content.documentsToCheck.dtuRules],
                ["Photos / visite", content.documentsToCheck.sitePhotos],
              ]}
            />
          </Section>

          <Section id="cctp" letter="G" title="Points à vérifier dans le CCTP">
            <BulletList items={content.cctpChecks} variant="check" />
          </Section>

          <Section id="plans" letter="H" title="Points à vérifier sur les plans">
            <BulletList items={content.planChecks} variant="check" />
          </Section>

          <Section id="mode-operatoire" letter="I" title="Mode opératoire simplifié">
            <div className="space-y-3">
              {content.modeOperatoire.map((step) => (
                <div
                  key={step.order}
                  className="relative rounded-xl border border-slate-200/80 bg-white p-4 pl-12 shadow-sm"
                >
                  <span className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[#1e3a5f] text-xs font-bold text-white">
                    {step.order}
                  </span>
                  <p className="font-semibold text-slate-900">{step.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700">{step.description || "—"}</p>
                  {step.whyImportant?.trim() ? (
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      <span className="font-semibold text-[#1e3a5f]">Pourquoi : </span>
                      {step.whyImportant}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </Section>

          {hasModeOperatoireDetailleContent(content.modeOperatoireDetaille) ? (
            <Section id="mode-operatoire-detaille" letter="I+" title="Mode opératoire détaillé">
              <ModeOperatoireDetailleView detail={content.modeOperatoireDetaille} />
            </Section>
          ) : null}

          <Section id="vigilance" letter="J" title="Points de vigilance">
            <BulletList items={content.vigilancePoints} variant="warning" />
          </Section>

          <Section id="questions" letter="K" title="Questions à poser">
            <BulletList items={content.questionsBeforeValidation} variant="question" />
          </Section>

          <Section id="novice" letter="L" title="Erreurs fréquentes d'un novice">
            <BulletList items={content.noviceErrors} variant="error" />
          </Section>

          <Section id="resume" letter="M" title="Résumé à retenir" highlight>
            <ProseBlock label="Ce que cette ligne veut dire" text={content.summary.meaning} prominent />
            <ProseBlock label="Ce qu'il faut absolument vérifier" text={content.summary.mustVerify} />
            <ProseBlock label="Principal risque d'erreur" text={content.summary.mainRisk} />
            <ProseBlock label="Document prioritaire" text={content.summary.priorityDocument} />
            <ProseBlock label="Question la plus importante" text={content.summary.keyQuestion} />
          </Section>

          {(links.cctpReference || links.planReference || links.dcePieceNote || links.internalNote) && (
            <Section id="liens" letter="·" title="Liens marché">
              <KeyValueGrid
                entries={[
                  ["Réf. CCTP", links.cctpReference ?? ""],
                  ["Réf. plan", links.planReference ?? ""],
                  ["Pièce DCE", links.dcePieceNote ?? ""],
                  ["Note interne", links.internalNote ?? ""],
                ]}
              />
            </Section>
          )}
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-36 space-y-4">
            <SidebarCard title="Synthèse rapide">
              <SidebarRow label="Code" value={sheet.codeSheet} mono />
              <SidebarRow label="Lot" value={lotDpgf} />
              <SidebarRow label="Famille" value={sheet.familyName ?? "—"} />
              <SidebarRow label="Intervenant" value={intervenantDisplay} />
            </SidebarCard>
            {content.summary.mainRisk?.trim() ? (
              <SidebarCard title="Risque principal" tone="warning">
                <p className="text-sm leading-relaxed text-amber-950">{content.summary.mainRisk}</p>
              </SidebarCard>
            ) : null}
            {content.summary.keyQuestion?.trim() ? (
              <SidebarCard title="Question clé">
                <p className="text-sm leading-relaxed text-slate-800">{content.summary.keyQuestion}</p>
              </SidebarCard>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({
  id,
  letter,
  title,
  children,
  highlight,
  compact,
}: {
  id: string;
  letter: string;
  title: string;
  children: React.ReactNode;
  highlight?: boolean;
  compact?: boolean;
}) {
  return (
    <section
      id={`dpgf-${id}`}
      className={`scroll-mt-28 rounded-2xl border shadow-sm ${
        highlight
          ? "border-[#1e3a5f]/20 bg-gradient-to-br from-[#eff6ff]/60 to-white p-5 lg:p-6"
          : "border-slate-200/80 bg-white p-5 lg:p-6"
      }`}
    >
      <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1e3a5f] text-sm font-bold text-white shadow-sm">
          {letter}
        </span>
        <h2 className="font-heading pt-1 text-lg font-bold leading-snug text-slate-900">{title}</h2>
      </div>
      <div className={`${compact ? "mt-3" : "mt-5"} space-y-4`}>{children}</div>
    </section>
  );
}

function ModeOperatoireDetailleView({ detail }: { detail: DpgfAnalysisModeOperatoireDetaille }) {
  return (
    <div className="space-y-5">
      {detail.objectif.trim() ? (
        <ProseBlock label="Objectif du mode opératoire" text={detail.objectif} prominent />
      ) : null}
      {MODE_OPERATOIRE_DETAILLE_LIST_FIELDS.map(({ key, label }) => {
        const items = detail[key];
        if (!items.length) return null;
        return (
          <div key={key} className="rounded-xl border border-[#1e3a5f]/10 bg-[#1e3a5f]/[0.03] px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e3a5f]">{label}</p>
            <BulletList items={items} variant="check" />
          </div>
        );
      })}
    </div>
  );
}

function TechnicalTermsBlock({ text }: { text: string }) {
  if (!hasTechnicalTermsContent(text)) return null;

  const lines = parseTechnicalTermsDisplay(text);

  return (
    <div className="rounded-xl border border-[#1e3a5f]/15 bg-[#1e3a5f]/[0.04] px-4 py-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#1e3a5f]">Mots techniques à expliquer</p>
      <ul className="mt-3 space-y-2">
        {lines.map((line, i) => (
          <li
            key={`${line.term}-${i}`}
            className="rounded-lg border border-white/80 bg-white px-3 py-2.5 shadow-sm"
          >
            <p className="text-sm font-bold tracking-wide text-[#1e3a5f]">{line.term}</p>
            {line.definition ? (
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{line.definition}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ProseBlock({ label, text, prominent }: { label: string; text: string; prominent?: boolean }) {
  if (!text?.trim()) return null;
  return (
    <div className={prominent ? "rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3" : ""}>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={`mt-2 whitespace-pre-wrap leading-relaxed text-slate-800 ${
          prominent ? "text-[15px] font-medium" : "text-sm"
        }`}
      >
        {text}
      </p>
    </div>
  );
}

function MetaGrid({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k}</dt>
          <dd className="mt-1 text-sm font-medium leading-snug text-slate-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function KeyValueGrid({
  entries,
  tone,
}: {
  entries: [string, string][];
  tone?: "inclus" | "exclus";
}) {
  const visible = entries.filter(([, v]) => v?.trim());
  if (visible.length === 0) return <p className="text-sm text-slate-500">—</p>;
  const border =
    tone === "inclus"
      ? "border-emerald-100 bg-emerald-50/30"
      : tone === "exclus"
        ? "border-orange-100 bg-orange-50/20"
        : "border-slate-100 bg-white";
  return (
    <div className="grid gap-2">
      {visible.map(([k, v]) => (
        <div key={k} className={`rounded-xl border px-3 py-2.5 ${border}`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{v}</p>
        </div>
      ))}
    </div>
  );
}

function BulletList({
  items,
  variant = "check",
}: {
  items: string[];
  variant?: "check" | "warning" | "question" | "error";
}) {
  const visible = items.filter((i) => i.trim());
  if (visible.length === 0) return <p className="text-sm text-slate-500">—</p>;
  const styles = {
    check: "border-slate-200 bg-slate-50/50 before:content-['✓'] before:text-emerald-600",
    warning: "border-amber-200 bg-amber-50/50 before:content-['!'] before:text-amber-700",
    question: "border-sky-200 bg-sky-50/40 before:content-['?'] before:text-sky-700",
    error: "border-red-200 bg-red-50/40 before:content-['×'] before:text-red-600",
  }[variant];
  return (
    <ul className="space-y-2">
      {visible.map((item) => (
        <li
          key={item}
          className={`relative rounded-xl border py-2.5 pl-10 pr-3 text-sm leading-relaxed text-slate-800 before:absolute before:left-3.5 before:top-2.5 before:flex before:h-5 before:w-5 before:items-center before:justify-center before:rounded-full before:bg-white before:text-xs before:font-bold before:shadow-sm ${styles}`}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function AlertBox({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
      {children}
    </p>
  );
}

function Callout({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#1e3a5f]/15 bg-[#eff6ff]/40 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#1e3a5f]/70">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{children}</p>
    </div>
  );
}

function StatusPill({ status }: { status: WorkItemStatus }) {
  const label = DPGF_ANALYSIS_STATUS_LABELS[status];
  const cls =
    status === "valide"
      ? "bg-emerald-100 text-emerald-800"
      : status === "a_verifier"
        ? "bg-amber-100 text-amber-900"
        : status === "a_completer"
          ? "bg-orange-100 text-orange-900"
          : "bg-slate-100 text-slate-700";
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

function MetaPill({ label, mono, accent }: { label: string; mono?: boolean; accent?: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        accent ? "bg-[#1e3a5f] text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
      } ${mono ? "font-mono" : ""}`}
    >
      {label}
    </span>
  );
}

function SidebarCard({
  title,
  children,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  tone?: "warning";
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        tone === "warning" ? "border-amber-200 bg-amber-50/60" : "border-slate-200/80 bg-white"
      }`}
    >
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function SidebarRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-0.5 text-sm leading-snug text-slate-800 ${mono ? "font-mono text-xs font-semibold text-[#1e3a5f]" : ""}`}>
        {value}
      </p>
    </div>
  );
}
