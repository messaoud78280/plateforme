import type { DpgfAnalysisSheet } from "@prisma/client";
import {
  DPGF_ANALYSIS_LEVEL_LABELS,
  DPGF_ANALYSIS_SOURCE_LABELS,
  DPGF_ANALYSIS_STATUS_LABELS,
} from "@/lib/dpgf-analysis/labels";
import { parseDpgfAnalysisContent } from "@/lib/dpgf-analysis/content-utils";
import { manualPriceHtToNumber } from "@/lib/dpgf-analysis/manual-price";
import { isWhoDoesItLikelyMisassigned } from "@/lib/dpgf-analysis/resolve-who-does-it";
import type { DpgfAnalysisSheetLinks } from "@/lib/dpgf-analysis/types";
import { formatEurFrBpu } from "@/lib/be-work-devis-format";
import { getBeWorkFamilyLabel } from "@/lib/bework-devis-family-codes";

type Props = { sheet: DpgfAnalysisSheet };

export function DpgfAnalysisSheetView({ sheet }: Props) {
  const content = parseDpgfAnalysisContent(sheet.content);
  const links = (sheet.links ?? {}) as DpgfAnalysisSheetLinks;
  const tradeLabel = sheet.tradeCode ? getBeWorkFamilyLabel(sheet.tradeCode) ?? sheet.tradeCode : "";
  const whoDoesItRaw = content.realWorld.whoDoesIt;
  const whoDoesItMisassigned = isWhoDoesItLikelyMisassigned(
    whoDoesItRaw,
    content.realWorld.linkedLots,
    sheet.familyName ?? "",
    tradeLabel,
  );
  const whoDoesItDisplay = whoDoesItMisassigned ? "" : whoDoesItRaw;
  const manualPrice = manualPriceHtToNumber(sheet.manualPriceHt);

  return (
    <div className="space-y-6">
      <Section title="A. Identification">
        <MetaGrid
          items={[
            ["Code fiche", sheet.codeSheet],
            ["Lot", sheet.lot],
            ["Corps de métier", sheet.tradeCode ? getBeWorkFamilyLabel(sheet.tradeCode) ?? sheet.tradeCode : "—"],
            ["Famille d'ouvrage", sheet.familyName ?? "—"],
            ["Type d'ouvrage", sheet.ouvrageType ?? "—"],
            ["Unité", sheet.unit],
            ["Source", DPGF_ANALYSIS_SOURCE_LABELS[sheet.source]],
            ["Statut", DPGF_ANALYSIS_STATUS_LABELS[sheet.status]],
            ["Niveau", DPGF_ANALYSIS_LEVEL_LABELS[sheet.comprehensionLevel]],
            [
              "Prix manuel HT",
              manualPrice != null ? `${formatEurFrBpu(manualPrice)} HT` : "—",
            ],
          ]}
        />
        <Block label="Désignation DPGF d'origine" text={sheet.originalDesignation} />
        {sheet.simplifiedDesignation ? (
          <Block label="Désignation simplifiée" text={sheet.simplifiedDesignation} />
        ) : null}
      </Section>

      <Section title="B. Traduction simple">
        <Block label="Que veut dire cette ligne ?" text={content.translation.meaning} />
        <Block label="Traduction débutant" text={content.translation.beginnerLanguage} />
        <Block label="Mots techniques à expliquer" text={content.translation.technicalTerms} />
        <Block label="Exemple concret" text={content.translation.concreteExample} />
      </Section>

      <Section title="C. À quoi correspond réellement l'ouvrage ?">
        <Block label="C'est quoi ?" text={content.realWorld.whatIsIt} />
        <Block label="À quoi ça sert ?" text={content.realWorld.purpose} />
        <Block label="Où sur le chantier ?" text={content.realWorld.whereOnSite} />
        <Block label="Qui le réalise ?" text={whoDoesItDisplay} />
        {whoDoesItMisassigned ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            Acteur de réalisation à préciser (ne pas confondre avec le lot DPGF). Complétez le champ « Qui le réalise
            ? » ou ajoutez <code className="text-xs">comprehension.qui_le_realise</code> dans le JSON d&apos;import.
          </p>
        ) : null}
        <Block label="Quand dans le chantier ?" text={content.realWorld.whenInProject} />
        <Block label="Lots liés" text={content.realWorld.linkedLots} />
      </Section>

      <Section title="D. Ce que la ligne peut inclure">
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
        />
      </Section>

      <Section title="E. Ce qui peut ne pas être inclus">
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
        />
      </Section>

      <Section title="F. Documents à vérifier">
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

      <Section title="G. Points à vérifier dans le CCTP">
        <BulletList items={content.cctpChecks} />
      </Section>

      <Section title="H. Points à vérifier sur les plans">
        <BulletList items={content.planChecks} />
      </Section>

      <Section title="I. Mode opératoire simplifié">
        <div className="space-y-4">
          {content.modeOperatoire.map((step) => (
            <div key={step.order} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#1e3a5f]">
                {step.order}. {step.title}
              </p>
              <p className="mt-2 text-sm text-slate-800">{step.description || "—"}</p>
              <p className="mt-2 text-xs text-slate-600">
                <span className="font-semibold">Pourquoi :</span> {step.whyImportant || "—"}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="J. Points de vigilance">
        <BulletList items={content.vigilancePoints} />
      </Section>

      <Section title="K. Questions à poser">
        <BulletList items={content.questionsBeforeValidation} />
      </Section>

      <Section title="L. Erreurs fréquentes d'un novice">
        <BulletList items={content.noviceErrors} />
      </Section>

      <Section title="M. Résumé à retenir" highlight>
        <Block label="Ce que cette ligne veut dire" text={content.summary.meaning} />
        <Block label="Ce qu'il faut absolument vérifier" text={content.summary.mustVerify} />
        <Block label="Principal risque d'erreur" text={content.summary.mainRisk} />
        <Block label="Document prioritaire" text={content.summary.priorityDocument} />
        <Block label="Question la plus importante" text={content.summary.keyQuestion} />
      </Section>

      {(links.cctpReference || links.planReference || links.dcePieceNote || links.internalNote) && (
        <Section title="Liens marché">
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
  );
}

function Section({ title, children, highlight }: { title: string; children: React.ReactNode; highlight?: boolean }) {
  return (
    <section
      className={
        highlight
          ? "rounded-2xl border border-[#1e3a5f]/20 bg-[#eff6ff]/40 p-5 shadow-sm"
          : "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
      }
    >
      <h2 className="font-heading text-base font-bold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function Block({ label, text }: { label: string; text: string }) {
  if (!text?.trim()) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{text}</p>
    </div>
  );
}

function MetaGrid({ items }: { items: [string, string][] }) {
  return (
    <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([k, v]) => (
        <div key={k} className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k}</dt>
          <dd className="mt-0.5 text-sm font-medium text-slate-900">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function KeyValueGrid({ entries }: { entries: [string, string][] }) {
  const visible = entries.filter(([, v]) => v?.trim());
  if (visible.length === 0) return <p className="text-sm text-slate-500">—</p>;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {visible.map(([k, v]) => (
        <div key={k} className="rounded-lg border border-slate-100 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{k}</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{v}</p>
        </div>
      ))}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  const visible = items.filter((i) => i.trim());
  if (visible.length === 0) return <p className="text-sm text-slate-500">—</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-800">
      {visible.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
