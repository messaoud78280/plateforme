import Link from "next/link";
import { notFound } from "next/navigation";
import { BtpDicoTermEditor } from "@/components/devis/dico/BtpDicoTermEditor";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ModifierTermeDicoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireBeWorkDevisSession();
  const { id } = await params;

  const term = await prisma.btpDictionaryTerm.findUnique({ where: { id } });
  if (!term) notFound();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link href={`/dashboard/devis/dico-btp/${term.id}`} className="text-sm font-semibold text-[#1e3a5f] hover:underline">
          ← {term.term}
        </Link>
        <h1 className="font-heading text-2xl font-bold text-slate-900">Modifier le terme</h1>
      </header>
      <BtpDicoTermEditor
        mode="edit"
        initial={{
          id: term.id,
          term: term.term,
          acronym: term.acronym,
          lotCode: term.lotCode,
          family: term.family,
          category: term.category,
          shortDefinition: term.shortDefinition,
          beginnerExplanation: term.beginnerExplanation,
          usageExample: term.usageExample,
          keywords: term.keywords,
          synonyms: term.synonyms,
          vigilancePoints: term.vigilancePoints,
          linkedDocuments: term.linkedDocuments,
          level: term.level,
          source: term.source,
          status: term.status,
        }}
      />
    </div>
  );
}
