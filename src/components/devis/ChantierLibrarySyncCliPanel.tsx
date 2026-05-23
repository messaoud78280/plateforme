"use client";

import { useState } from "react";

const SYNC_CMD = "npm run db:sync-chantier-from-library";

export function ChantierLibrarySyncCliPanel() {
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(SYNC_CMD);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-2xl border-2 border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 to-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Méthode recommandée</p>
      <h2 className="mt-1 text-lg font-bold text-slate-900">Extraction en ligne de commande (ne plante pas)</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-700">
        La synchro dans le navigateur peut être interrompue par un délai serveur (~5 min par requête). Le script
        ci-dessous tourne sur votre machine, se connecte directement à Supabase et affiche la progression dans le
        terminal — sans limite HTTP.
      </p>

      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-slate-700">
        <li>Ouvrez un terminal à la racine du projet plateforme.</li>
        <li>
          Vérifiez que <code className="rounded bg-slate-100 px-1">.env.local</code> contient{" "}
          <code className="rounded bg-slate-100 px-1">DATABASE_URL</code> (Supabase, comme en prod). Le script teste
          automatiquement la meilleure connexion (pooler session port 5432).
        </li>
        <li>
          Exécutez la commande ci-dessous et attendez la fin (souvent 15–45 min selon le nombre d&apos;ouvrages visibles
          dans la bibliothèque, ex. ~1400).
        </li>
        <li>Rafraîchissez cette page pour voir les fiches mises à jour.</li>
      </ol>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="flex-1 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 font-mono text-sm text-emerald-300">
          {SYNC_CMD}
        </code>
        <button
          type="button"
          onClick={() => void copyCommand()}
          className="shrink-0 rounded-xl border border-emerald-300 bg-white px-4 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
        >
          {copied ? "Copié ✓" : "Copier la commande"}
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Options : <code className="rounded bg-slate-100 px-1">--batch-size=20</code> · reprise finalisation seule{" "}
        <code className="rounded bg-slate-100 px-1">--finalize-only=&lt;runId&gt;</code>
      </p>
    </section>
  );
}
