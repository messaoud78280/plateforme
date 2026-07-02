import Link from "next/link";
import { BtpDicoAlphabetNav } from "@/components/devis/dico/BtpDicoAlphabetNav";
import { CategoryBadge, LevelBadge, LotBadge, StatusBadge } from "@/components/devis/dico/BtpDicoBadges";
import { BtpDicoExportButton } from "@/components/devis/dico/BtpDicoExportButton";
import { BtpDicoFacetsPanel } from "@/components/devis/dico/BtpDicoFacetsPanel";
import { BtpDicoJsonImportPanel } from "@/components/devis/dico/BtpDicoJsonImportPanel";
import { BtpDicoSearchBar } from "@/components/devis/dico/BtpDicoSearchBar";
import { requireBeWorkDevisSession } from "@/lib/be-work-devis-access";
import { BTP_DICO_LIST_LIMIT, buildBtpDicoWhere, fetchBtpDicoStats, parseBtpDicoFilters } from "@/lib/btp-dico/search";
import { categoryLabel } from "@/lib/btp-dico/labels";
import { lotLabelFromCode } from "@/lib/btp-dico/lots";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const LIST_PATH = "/dashboard/devis/dico-btp";
type SearchParams = Record<string, string | string[] | undefined>;

function firstLetter(term: string): string {
  const c = term.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : "#";
}

export default async function DicoBtpPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireBeWorkDevisSession();
  const spRaw = await searchParams;
  const sp: Record<string, string | undefined> = {};
  for (const [k, val] of Object.entries(spRaw)) sp[k] = Array.isArray(val) ? val[0] : val;

  const filters = parseBtpDicoFilters(sp);
  const where = buildBtpDicoWhere(filters);

  let rows: Awaited<ReturnType<typeof prisma.btpDictionaryTerm.findMany>> = [];
  let stats = { totalTerms: 0, lotsCovered: 0, acronyms: 0, toVerify: 0 };
  let lotCounts: Record<string, number> = {};
  let loadError = false;

  try {
    const [fetchedRows, fetchedStats, lotGroups] = await Promise.all([
      prisma.btpDictionaryTerm.findMany({
        where,
        orderBy: [{ term: "asc" }],
        take: BTP_DICO_LIST_LIMIT,
      }),
      fetchBtpDicoStats({}),
      prisma.btpDictionaryTerm.groupBy({ by: ["lotCode"], _count: { _all: true } }),
    ]);
    rows = fetchedRows;
    stats = fetchedStats;
    lotCounts = Object.fromEntries(
      lotGroups.filter((g) => g.lotCode).map((g) => [g.lotCode as string, g._count._all]),
    );
  } catch {
    loadError = true;
  }

  // Regroupement par première lettre pour l'affichage A-Z.
  const groups = new Map<string, typeof rows>();
  for (const r of rows) {
    const letter = firstLetter(r.term);
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter)!.push(r);
  }
  const sortedLetters = [...groups.keys()].sort((a, b) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)));
  const availableLetters = sortedLetters.filter((l) => l !== "#");

  const activeChips = buildActiveChips(sp);
  const hasFilters = activeChips.length > 0;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">Dico BTP</h1>
          <p className="mt-1 text-sm text-slate-600">
            Définitions, acronymes et explications techniques pour comprendre les lots travaux.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/devis/dico-btp/nouveau"
            className="inline-flex items-center rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a]"
          >
            + Nouveau terme
          </Link>
          <a
            href="#import-json"
            className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Importer JSON
          </a>
          <BtpDicoExportButton lotCode={filters.lot} />
        </div>
      </header>

      {/* Bandeau de statistiques compact */}
      <div className="flex flex-wrap items-stretch gap-px overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-200/60 shadow-sm">
        <StatCell label="Termes au total" value={stats.totalTerms} />
        <StatCell label="Lots couverts" value={`${stats.lotsCovered} / 16`} />
        <StatCell label="Acronymes" value={stats.acronyms} />
        <StatCell label="À vérifier" value={stats.toVerify} accent={stats.toVerify ? "amber" : undefined} />
      </div>

      {/* Recherche mise en avant */}
      <BtpDicoSearchBar />

      {/* Filtres mobile (repliés) */}
      <details className="group rounded-2xl border border-slate-200/80 bg-white shadow-sm lg:hidden">
        <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-4 py-3 marker:content-none hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
          <span className="text-sm font-bold text-slate-900">Filtres &amp; lots</span>
          <span className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-[#1e3a5f]">
            <span className="group-open:hidden">Afficher</span>
            <span className="hidden group-open:inline">Masquer</span>
          </span>
        </summary>
        <div className="border-t border-slate-100 p-4">
          <BtpDicoFacetsPanel lotCounts={lotCounts} totalCount={stats.totalTerms} />
        </div>
      </details>

      <div className="grid gap-5 lg:grid-cols-[248px_1fr]">
        {/* Barre latérale desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <BtpDicoFacetsPanel lotCounts={lotCounts} totalCount={stats.totalTerms} />
          </div>
        </aside>

        {/* Colonne résultats */}
        <div className="min-w-0 space-y-4">
          {/* Fil des filtres actifs + compteur */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">
              {rows.length} terme{rows.length > 1 ? "s" : ""}
              {rows.length >= BTP_DICO_LIST_LIMIT ? ` (limité à ${BTP_DICO_LIST_LIMIT})` : ""}
            </span>
            {activeChips.length ? <span className="text-slate-300">·</span> : null}
            {activeChips.map((chip) => (
              <Link
                key={chip.key}
                href={chip.href}
                className="group inline-flex items-center gap-1 rounded-full border border-[#1e3a5f]/20 bg-[#eef2f7] px-2.5 py-1 text-[11px] font-semibold text-[#1e3a5f] hover:bg-[#e2e8f2]"
              >
                <span className="text-[10px] uppercase tracking-wide text-[#1e3a5f]/60">{chip.facet}</span>
                {chip.label}
                <span className="text-[#1e3a5f]/50 group-hover:text-[#1e3a5f]">✕</span>
              </Link>
            ))}
            {hasFilters ? (
              <Link href={LIST_PATH} className="ml-auto text-xs font-semibold text-slate-500 hover:text-[#1e3a5f]">
                Tout réinitialiser
              </Link>
            ) : null}
          </div>

          {/* Navigation alphabétique */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm">
            <BtpDicoAlphabetNav availableLetters={availableLetters} />
          </div>

          {loadError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-800">
              Une erreur est survenue lors du chargement des termes. Réessayez plus tard.
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="text-sm font-semibold text-slate-700">Aucun terme trouvé.</p>
              <p className="mt-1 text-sm text-slate-500">
                {hasFilters
                  ? "Aucun terme ne correspond à ces filtres."
                  : "Commencez par créer un terme ou importez un lot en JSON."}
              </p>
              <div className="mt-4 flex justify-center gap-2">
                {hasFilters ? (
                  <Link
                    href={LIST_PATH}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Réinitialiser les filtres
                  </Link>
                ) : (
                  <Link
                    href="/dashboard/devis/dico-btp/nouveau"
                    className="rounded-xl bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#162d4a]"
                  >
                    + Nouveau terme
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedLetters.map((letter) => (
                <section key={letter} id={`letter-${letter}`} className="scroll-mt-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e3a5f] text-sm font-bold text-white">
                      {letter}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{groups.get(letter)!.length}</span>
                    <span className="h-px flex-1 bg-slate-100" />
                  </div>
                  <div className="grid gap-3 xl:grid-cols-2">
                    {groups.get(letter)!.map((t) => (
                      <Link
                        key={t.id}
                        href={`/dashboard/devis/dico-btp/${t.id}`}
                        className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-[#1e3a5f]/40 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-heading truncate text-base font-bold text-slate-900 group-hover:text-[#1e3a5f]">
                              {t.term}
                            </h3>
                            {t.acronym ? <p className="truncate text-xs text-slate-500">{t.acronym}</p> : null}
                          </div>
                          <LevelBadge level={t.level} />
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{t.shortDefinition}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <LotBadge lotCode={t.lotCode} />
                          <CategoryBadge category={t.category} />
                          {t.family ? (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200">
                              {t.family}
                            </span>
                          ) : null}
                          <StatusBadge status={t.status} />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Import JSON (replié) */}
      <details id="import-json" className="group scroll-mt-24 rounded-2xl border border-[#1e3a5f]/20 bg-white shadow-sm">
        <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-5 py-4 marker:content-none hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1e3a5f]">Import structuré</span>
            <span className="font-heading mt-0.5 block text-base font-bold text-slate-900">Importer des termes en JSON</span>
          </span>
          <span className="shrink-0 rounded-lg border border-[#1e3a5f]/30 bg-white px-3 py-1.5 text-xs font-semibold text-[#1e3a5f]">
            <span className="group-open:hidden">Ouvrir</span>
            <span className="hidden group-open:inline">Fermer</span>
          </span>
        </summary>
        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
          <BtpDicoJsonImportPanel />
        </div>
      </details>
    </div>
  );
}

type ActiveChip = { key: string; facet: string; label: string; href: string };

function buildActiveChips(sp: Record<string, string | undefined>): ActiveChip[] {
  const chips: ActiveChip[] = [];
  const hrefWithout = (omit: string) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (!v || k === omit) continue;
      p.set(k, v);
    }
    const qs = p.toString();
    return qs ? `${LIST_PATH}?${qs}` : LIST_PATH;
  };

  if (sp.q?.trim()) chips.push({ key: "q", facet: "Recherche", label: `« ${sp.q.trim()} »`, href: hrefWithout("q") });
  if (sp.lot?.trim()) chips.push({ key: "lot", facet: "Lot", label: lotLabelFromCode(sp.lot.trim()), href: hrefWithout("lot") });
  if (sp.category?.trim())
    chips.push({ key: "category", facet: "Catégorie", label: categoryLabel(sp.category.trim()) ?? sp.category.trim(), href: hrefWithout("category") });
  if (sp.acronyms === "1") chips.push({ key: "acronyms", facet: "Type", label: "Acronymes", href: hrefWithout("acronyms") });
  if (sp.level?.trim()) chips.push({ key: "level", facet: "Niveau", label: sp.level.trim(), href: hrefWithout("level") });
  if (sp.status?.trim()) chips.push({ key: "status", facet: "Statut", label: sp.status.trim(), href: hrefWithout("status") });
  if (sp.letter?.trim()) chips.push({ key: "letter", facet: "Lettre", label: sp.letter.trim().toUpperCase(), href: hrefWithout("letter") });
  if (sp.family?.trim()) chips.push({ key: "family", facet: "Famille", label: sp.family.trim(), href: hrefWithout("family") });

  return chips;
}

function StatCell({ label, value, accent }: { label: string; value: string | number; accent?: "amber" }) {
  return (
    <div className="flex min-w-[130px] flex-1 flex-col justify-center bg-white px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 text-xl font-bold ${accent === "amber" ? "text-amber-700" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}
