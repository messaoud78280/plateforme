import Link from "next/link";
import { getRecodificationProposals } from "@/app/dashboard/devis/recodification-actions";
import { RecodificationClientTable } from "@/components/devis/RecodificationClientTable";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { getBeWorkFamilyLexiconSorted } from "@/lib/bework-devis-family-codes";

export default async function RecodificationBibliothequePage() {
  await requireBeWorkDevisSession();
  const proposals = await getRecodificationProposals();
  const lex = getBeWorkFamilyLexiconSorted();

  return (
    <div className="space-y-8 px-1">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1e3a5f]/80">Outils</p>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Recodification ouvrages</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
            Remplace les codes d&apos;import <span className="font-mono">BW-MARTIN-…</span> par des codes génériques{" "}
            <span className="font-mono">BW-XXX-001</span>. L&apos;ancien code est conservé dans{" "}
            <span className="font-mono">sourceCode</span>, la ligne source dans <span className="font-mono">sourceLine</span>
            . Les <span className="font-mono">PriceEntry</span> ne sont pas modifiés.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/devis/bibliotheque/codification"
            className="inline-flex w-fit rounded-xl border border-[#1e3a5f]/30 bg-[#1e3a5f]/5 px-4 py-2.5 text-sm font-semibold text-[#1e3a5f] shadow-sm hover:bg-[#1e3a5f]/10"
          >
            Nouvelle codification BW-LOT-FAM-OUV
          </Link>
          <Link
            href="/dashboard/devis/bibliotheque"
            className="inline-flex w-fit rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
          >
            ← Bibliothèque
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-bold text-slate-900">Lexique familles (référence)</h2>
        <ul className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {lex.map((f) => (
            <li key={f.code} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
              <span className="font-mono text-xs font-bold text-[#1e3a5f]">{f.code}</span>
              <span className="ml-2 font-semibold text-slate-900">{f.label}</span>
              <p className="mt-1 text-[11px] leading-snug text-slate-600">{f.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 font-heading text-lg font-bold text-slate-900">Propositions</h2>
        <RecodificationClientTable initialRows={proposals} />
      </section>
    </div>
  );
}
