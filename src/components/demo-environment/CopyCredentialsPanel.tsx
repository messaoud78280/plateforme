"use client";

import { useState } from "react";

export function CopyCredentialsPanel({
  companyName,
  loginIdentifier,
  passwordOnce,
  expiresAt,
  demoId,
}: {
  companyName: string;
  loginIdentifier: string;
  passwordOnce: string;
  expiresAt?: string;
  demoId?: string;
}) {
  const [copied, setCopied] = useState<"id" | "pwd" | "all" | null>(null);

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const message = [
    `Démonstration BeWork — ${companyName}`,
    `Connexion : https://www.bework.fr/connexion/demo`,
    `Identifiant : ${loginIdentifier}`,
    `Mot de passe : ${passwordOnce}`,
    expiryLabel ? `Valide jusqu’au ${expiryLabel}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  async function copy(kind: "id" | "pwd" | "all", text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-emerald-950">Démonstration créée</h2>
      <p className="mt-1 text-sm text-emerald-900/80">
        Communiquez ces accès au prospect maintenant. Le mot de passe ne sera plus affiché en clair.
      </p>

      <dl className="mt-5 space-y-3 text-sm text-emerald-950">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200/80 bg-white/70 px-3 py-2">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-emerald-800/70">Entreprise</dt>
            <dd className="font-semibold">{companyName}</dd>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200/80 bg-white/70 px-3 py-2">
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-wide text-emerald-800/70">Identifiant</dt>
            <dd className="font-mono font-semibold">{loginIdentifier}</dd>
          </div>
          <button
            type="button"
            onClick={() => copy("id", loginIdentifier)}
            className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-900"
          >
            {copied === "id" ? "Copié" : "Copier"}
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2">
          <div className="min-w-0">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-amber-900/70">Mot de passe</dt>
            <dd className="break-all font-mono font-semibold">{passwordOnce}</dd>
          </div>
          <button
            type="button"
            onClick={() => copy("pwd", passwordOnce)}
            className="rounded-lg border border-amber-400 bg-white px-2.5 py-1 text-xs font-semibold text-amber-950"
          >
            {copied === "pwd" ? "Copié" : "Copier"}
          </button>
        </div>
        {expiryLabel ? (
          <div className="rounded-xl border border-emerald-200/80 bg-white/70 px-3 py-2">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-emerald-800/70">Expiration</dt>
            <dd className="font-semibold">{expiryLabel}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy("all", message)}
          className="btn-cc-primary"
        >
          {copied === "all" ? "Message copié" : "Copier le message prospect"}
        </button>
        <a href="/connexion/demo" className="btn-cc-secondary" target="_blank" rel="noreferrer">
          Ouvrir la connexion démo
        </a>
        {demoId ? (
          <a href={`/dashboard/demonstrations/plateformes/${demoId}`} className="btn-cc-secondary">
            Fiche démo
          </a>
        ) : null}
      </div>
    </div>
  );
}
