import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryBadge, LevelBadge, LotBadge, StatusBadge } from "@/components/devis/dico/BtpDicoBadges";
import { BtpDicoDeleteButton } from "@/components/devis/dico/BtpDicoDeleteButton";
import { BtpDicoImagePanel } from "@/components/devis/dico/BtpDicoImagePanel";
import { BtpDicoNoteEditor } from "@/components/devis/dico/BtpDicoNoteEditor";
import { canManageBeWorkDico, requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { lotLabelFromCode } from "@/lib/btp-dico/lots";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DicoBtpTermPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireBeWorkDevisSession();
  const canManage = canManageBeWorkDico(session.user.role);
  const { id } = await params;

  const term = await prisma.btpDictionaryTerm.findUnique({ where: { id } });
  if (!term) notFound();

  const dateFmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/dashboard/devis/dico-btp" className="text-sm font-semibold text-[#1e3a5f] hover:underline">
            ← Dico BTP
          </Link>
          <h1 className="font-heading mt-2 text-3xl font-bold text-slate-900">{term.term}</h1>
          {term.acronym ? <p className="mt-1 text-base text-slate-600">{term.acronym}</p> : null}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <LotBadge lotCode={term.lotCode} />
            <CategoryBadge category={term.category} />
            <LevelBadge level={term.level} />
            <StatusBadge status={term.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/devis/dico-btp/${term.id}/modifier`}
            className="inline-flex items-center rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a]"
          >
            Modifier
          </Link>
          <BtpDicoDeleteButton id={term.id} redirectTo="/dashboard/devis/dico-btp" />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Section title="Définition courte">
            <p className="text-sm leading-relaxed text-slate-700">{term.shortDefinition}</p>
          </Section>

          {term.beginnerExplanation ? (
            <Section title="Explication pédagogique">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{term.beginnerExplanation}</p>
            </Section>
          ) : null}

          {term.usageExample ? (
            <Section title="Exemple d'utilisation">
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{term.usageExample}</p>
            </Section>
          ) : null}

          {term.vigilancePoints.length > 0 ? (
            <Section title="Points de vigilance" accent="amber">
              <BulletList items={term.vigilancePoints} />
            </Section>
          ) : null}

          <BtpDicoNoteEditor termId={term.id} note={term.personalNote} canManage={canManage} />
        </div>

        <aside className="space-y-6">
          <BtpDicoImagePanel termId={term.id} imageUrl={term.imageUrl} canManage={canManage} />

          <Section title="Classement">
            <dl className="space-y-2 text-sm">
              <Row label="Lot" value={term.lotCode ? lotLabelFromCode(term.lotCode) : "—"} />
              <Row label="Famille" value={term.family ?? "—"} />
              <Row label="Niveau" value={term.level} />
              <Row label="Source" value={term.source ?? "—"} />
              <Row label="Statut" value={term.status} />
              <Row label="Créé le" value={dateFmt.format(term.createdAt)} />
              <Row label="Mis à jour le" value={dateFmt.format(term.updatedAt)} />
            </dl>
          </Section>

          {term.keywords.length > 0 ? (
            <Section title="Mots-clés">
              <TagList items={term.keywords} />
            </Section>
          ) : null}

          {term.synonyms.length > 0 ? (
            <Section title="Synonymes">
              <TagList items={term.synonyms} />
            </Section>
          ) : null}

          {term.linkedDocuments.length > 0 ? (
            <Section title="Documents liés">
              <TagList items={term.linkedDocuments} />
            </Section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent?: "amber" }) {
  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm ${accent === "amber" ? "border-amber-200 bg-amber-50/50" : "border-slate-200/80 bg-white"}`}
    >
      <h2 className="font-heading mb-3 text-sm font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-700">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((it, i) => (
        <span
          key={i}
          className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
        >
          {it}
        </span>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-800">{value}</dd>
    </div>
  );
}
