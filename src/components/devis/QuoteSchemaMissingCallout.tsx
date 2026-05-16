/**
 * Affiché lorsque les tables Quote* manquent ou que des colonnes ne correspondent pas au schéma Prisma (P2022).
 */
export function QuoteSchemaMissingCallout() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950 shadow-sm">
      <p className="font-heading text-base font-bold text-amber-950">Base « devis » incomplète ou désynchronisée</p>
      <p className="mt-2 leading-relaxed">
        Soit les tables du module de chiffrage (
        <span className="font-mono">QuoteProject</span>, <span className="font-mono">QuoteDocument</span>,{" "}
        <span className="font-mono">QuoteLine</span>) ne sont pas encore créées, soit une table existe mais{" "}
        <strong>sans toutes les colonnes</strong> attendues par l&apos;application (ex.{" "}
        <span className="font-mono">projectName</span> sur <span className="font-mono">QuoteProject</span>). Dans ce
        cas, PostgreSQL ne met pas à jour une table déjà créée : il faut rejouer le script SQL de migration.
      </p>
      <p className="mt-3 font-semibold">À faire (une fois sur la base concernée) :</p>
      <ol className="mt-2 list-decimal space-y-1 pl-5 leading-relaxed">
        <li>
          Ouvrir le fichier{" "}
          <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">prisma/migrations/add-bework-quote-documents.sql</code>
        </li>
        <li>
          Exécuter <strong>tout</strong> le script (du début à la fin) dans l&apos;éditeur SQL Supabase — y compris les
          blocs <span className="font-mono">ALTER TABLE … ADD COLUMN IF NOT EXISTS</span> qui rattrapent les colonnes
          manquantes (ou <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">psql</code> avec{" "}
          <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">$DATABASE_URL</code>).
        </li>
      </ol>
      <p className="mt-3 text-xs text-amber-900/90">
        Si vous utilisez uniquement Prisma en local : <span className="font-mono">npm run db:push</span> après déploiement du schéma.
      </p>
    </div>
  );
}
