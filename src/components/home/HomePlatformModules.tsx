"use client";

import { useState } from "react";
import { HOME_SECTION } from "@/components/home/homeSectionStyles";
import { cn } from "@/lib/cn";

const MODULES = [
  {
    id: "chantiers",
    label: "Chantiers",
    color: "blue",
    accent: "#2563eb",
    accentLight: "#eff6ff",
    accentBorder: "#bfdbfe",
    title: "Suivez chaque chantier de A à Z.",
    desc: "Affaires, avancement, événements, équipes et informations importantes réunies dans un seul espace. Plus de fichiers perdus, plus d'appels pour savoir où en est le dossier.",
    tags: ["Avancement", "Alertes", "Responsable", "Statut", "Historique"],
    preview: [
      { label: "Résidence Horizon", status: "En cours", pct: 68, color: "#2563eb" },
      { label: "Lot étanchéité — Bât. B", status: "À valider", pct: 100, color: "#ea580c" },
      { label: "Réhabilitation façade", status: "Planifié", pct: 12, color: "#059669" },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    color: "indigo",
    accent: "#4f46e5",
    accentLight: "#eef2ff",
    accentBorder: "#c7d2fe",
    title: "Plans, devis, contrats, DOE — tout classé.",
    desc: "Une GED pensée pour le chantier. Plans, CCTP, comptes rendus, pièces DOE classés, recherchables et liés à leur dossier. Ne plus jamais envoyer la mauvaise version.",
    tags: ["Plans EXE", "CCTP", "CR chantier", "DOE", "Contrats"],
    preview: [
      { label: "Plan façade v3.2", status: "Validé", pct: 100, color: "#4f46e5" },
      { label: "CCTP lot étanchéité", status: "En attente", pct: 0, color: "#ea580c" },
      { label: "Notices manquantes", status: "Relance", pct: 0, color: "#dc2626" },
    ],
  },
  {
    id: "planning",
    label: "Planning",
    color: "green",
    accent: "#059669",
    accentLight: "#ecfdf5",
    accentBorder: "#a7f3d0",
    title: "Qui fait quoi, sur quel chantier.",
    desc: "Équipes, interventions, rendez-vous, livraisons et échéances sur un planning unifié. Détectez les conflits avant qu'ils ne deviennent des problèmes.",
    tags: ["Équipe", "Interventions", "Livraisons", "Conflits", "RDV"],
    preview: [
      { label: "Équipe A — Chantier Horizon", status: "Affecté", pct: 100, color: "#059669" },
      { label: "Livraison membrane 14/08", status: "Confirmé", pct: 100, color: "#059669" },
      { label: "Contrôle étanchéité", status: "Sans date", pct: 0, color: "#ea580c" },
    ],
  },
  {
    id: "gestion",
    label: "Gestion comm.",
    color: "orange",
    accent: "#ea580c",
    accentLight: "#fff7ed",
    accentBorder: "#fed7aa",
    title: "Devis, situations, factures, encaissements.",
    desc: "Suivez votre gestion commerciale de bout en bout. Devis établis, marchés signés, situations envoyées, factures et encaissements dans un seul espace.",
    tags: ["Devis", "Marchés", "Situations", "Factures", "Encaissements"],
    preview: [
      { label: "Devis Bât. C — étanchéité", status: "Signé", pct: 100, color: "#059669" },
      { label: "Situation n°3 — juillet", status: "Envoyée", pct: 75, color: "#ea580c" },
      { label: "Facture F-2024-082", status: "Encaissée", pct: 100, color: "#059669" },
    ],
  },
  {
    id: "achats",
    label: "Achats",
    color: "amber",
    accent: "#d97706",
    accentLight: "#fffbeb",
    accentBorder: "#fde68a",
    title: "Commandes, livraisons, fournisseurs.",
    desc: "Commandes liées au chantier, livraisons suivies, réceptions confirmées. Vos achats sont traçables et vos fournisseurs correctement pilotés.",
    tags: ["Bons de commande", "Livraisons", "Réceptions", "Fournisseurs", "Dépenses"],
    preview: [
      { label: "BC membrane Point.P", status: "Confirmé", pct: 100, color: "#d97706" },
      { label: "Livraison prévue 11/08", status: "En attente", pct: 50, color: "#d97706" },
      { label: "Facture fournisseur", status: "À contrôler", pct: 0, color: "#ea580c" },
    ],
  },
  {
    id: "pilotage",
    label: "Pilotage",
    color: "teal",
    accent: "#0d9488",
    accentLight: "#f0fdfa",
    accentBorder: "#99f6e4",
    title: "Budgets, marges et rentabilité.",
    desc: "Suivez vos budgets, engagements et dépenses en temps réel. Connaissez votre marge et votre rentabilité sans attendre la clôture comptable.",
    tags: ["Budget", "Dépenses", "Marges", "Engagements", "Rentabilité"],
    preview: [
      { label: "Budget chantier Horizon", status: "756 k€ / 980 k€", pct: 77, color: "#0d9488" },
      { label: "Marge provisoire", status: "+12,4 %", pct: 100, color: "#059669" },
      { label: "Commandes engagées", status: "214 k€", pct: 55, color: "#d97706" },
    ],
  },
] as const;

export function HomePlatformModules() {
  const [active, setActive] = useState<(typeof MODULES)[number]["id"]>("chantiers");
  const current = MODULES.find((m) => m.id === active) ?? MODULES[0]!;

  return (
    <section id="plateforme" className={`${HOME_SECTION} bg-white`} aria-labelledby="platform-heading">
      <div className="container-site">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            La plateforme BeWork
          </p>
          <h2
            id="platform-heading"
            className="font-display mt-3 text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#0a0a0a] sm:text-[2.25rem] md:text-[2.75rem] lg:text-[3rem]"
          >
            Tout votre fonctionnement au même endroit.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Une entreprise du BTP utilise souvent plusieurs logiciels, fichiers, tableaux, emails et applications.{" "}
            Le problème n&apos;est pas forcément de manquer d&apos;outils.{" "}
            <strong className="font-semibold text-[#0a0a0a]">Le problème, c&apos;est qu&apos;ils ne travaillent pas ensemble.</strong>
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-12 sm:mt-14 md:mt-16">
          <div
            className="flex flex-wrap justify-center gap-x-1 gap-y-1"
            role="tablist"
            aria-label="Modules BeWork"
          >
            {MODULES.map((m) => {
              const selected = m.id === active;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(m.id)}
                  className={cn(
                    "relative rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200",
                    selected
                      ? "bg-white text-[#0a0a0a] shadow-sm ring-1 ring-slate-200"
                      : "text-slate-500 hover:text-[#0a0a0a]",
                  )}
                  style={selected ? { color: current.accent } : undefined}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Panneau actif */}
          <div
            role="tabpanel"
            aria-live="polite"
            className="mt-6"
            key={current.id}
          >
            <div
              className="rounded-2xl border p-6 sm:p-8 md:p-10"
              style={{ borderColor: current.accentBorder, background: current.accentLight }}
            >
              <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:gap-12">
                {/* Texte */}
                <div>
                  <h3
                    className="font-display text-xl font-extrabold tracking-tight sm:text-2xl"
                    style={{ color: current.accent }}
                  >
                    {current.title}
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-700">{current.desc}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {current.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{ background: `${current.accent}18`, color: current.accent }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div
                  className="rounded-xl border bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.08)]"
                  style={{ borderColor: current.accentBorder }}
                >
                  <p
                    className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em]"
                    style={{ color: current.accent }}
                  >
                    Aperçu
                  </p>
                  <ul className="space-y-4">
                    {current.preview.map((item) => (
                      <li key={item.label}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-xs font-semibold text-slate-800">
                            {item.label}
                          </span>
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: `${item.color}18`, color: item.color }}
                          >
                            {item.status}
                          </span>
                        </div>
                        {item.pct > 0 && (
                          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${item.pct}%`, background: item.color }}
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
