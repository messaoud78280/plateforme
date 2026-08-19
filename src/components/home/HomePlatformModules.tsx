"use client";

import { useState } from "react";
import { HOME_SECTION } from "@/components/home/homeSectionStyles";
import { cn } from "@/lib/cn";

const MODULES = [
  {
    id: "chantiers",
    label: "Chantiers",
    accent: "#2563eb",
    accentLight: "#eff6ff",
    accentBorder: "#bfdbfe",
    title: "Suivez chaque chantier de A à Z.",
    desc: "Affaires, avancement, événements, équipes et informations importantes réunies dans un seul espace. Plus de fichiers perdus, plus d'appels pour savoir où en est le dossier.",
    tags: ["Avancement", "Alertes", "Responsable", "Statut", "Historique"],
    kpis: [
      { value: "12", label: "Chantiers actifs" },
      { value: "94%", label: "Documents classés" },
      { value: "3", label: "Alertes ouvertes" },
    ],
    preview: [
      { label: "Résidence Horizon", status: "En cours", pct: 68, color: "#2563eb" },
      { label: "Lot étanchéité — Bât. B", status: "À valider", pct: 100, color: "#ea580c" },
      { label: "Réhabilitation façade", status: "Planifié", pct: 12, color: "#059669" },
    ],
  },
  {
    id: "documents",
    label: "Documents",
    accent: "#4f46e5",
    accentLight: "#eef2ff",
    accentBorder: "#c7d2fe",
    title: "Plans, devis, contrats, DOE — tout classé.",
    desc: "Une GED pensée pour le chantier. Plans, CCTP, comptes rendus, pièces DOE classés, recherchables et liés à leur dossier. Ne plus jamais envoyer la mauvaise version.",
    tags: ["Plans EXE", "CCTP", "CR chantier", "DOE", "Contrats"],
    kpis: [
      { value: "847", label: "Documents indexés" },
      { value: "v3.2", label: "Dernière version plan" },
      { value: "4", label: "Pièces manquantes" },
    ],
    preview: [
      { label: "Plan façade v3.2", status: "Validé", pct: 100, color: "#4f46e5" },
      { label: "CCTP lot étanchéité", status: "En attente", pct: 0, color: "#ea580c" },
      { label: "Notices manquantes", status: "Relance", pct: 0, color: "#dc2626" },
    ],
  },
  {
    id: "planning",
    label: "Planning",
    accent: "#059669",
    accentLight: "#ecfdf5",
    accentBorder: "#a7f3d0",
    title: "Qui fait quoi, sur quel chantier.",
    desc: "Équipes, interventions, rendez-vous, livraisons et échéances sur un planning unifié. Détectez les conflits avant qu'ils ne deviennent des problèmes.",
    tags: ["Équipe", "Interventions", "Livraisons", "Conflits", "RDV"],
    kpis: [
      { value: "8", label: "Équipes planifiées" },
      { value: "2", label: "Conflits détectés" },
      { value: "14/08", label: "Prochaine livraison" },
    ],
    preview: [
      { label: "Équipe A — Chantier Horizon", status: "Affecté", pct: 100, color: "#059669" },
      { label: "Livraison membrane 14/08", status: "Confirmé", pct: 100, color: "#059669" },
      { label: "Contrôle étanchéité", status: "Sans date", pct: 0, color: "#ea580c" },
    ],
  },
  {
    id: "gestion",
    label: "Gestion",
    accent: "#ea580c",
    accentLight: "#fff7ed",
    accentBorder: "#fed7aa",
    title: "Devis, situations, factures, encaissements.",
    desc: "Suivez votre gestion commerciale de bout en bout. Devis établis, marchés signés, situations envoyées, factures et encaissements dans un seul espace.",
    tags: ["Devis", "Marchés", "Situations", "Factures", "Encaissements"],
    kpis: [
      { value: "1,2 M€", label: "CA en cours" },
      { value: "87%", label: "Factures encaissées" },
      { value: "3", label: "Devis en attente" },
    ],
    preview: [
      { label: "Devis Bât. C — étanchéité", status: "Signé", pct: 100, color: "#059669" },
      { label: "Situation n°3 — juillet", status: "Envoyée", pct: 75, color: "#ea580c" },
      { label: "Facture F-2024-082", status: "Encaissée", pct: 100, color: "#059669" },
    ],
  },
  {
    id: "achats",
    label: "Achats",
    accent: "#d97706",
    accentLight: "#fffbeb",
    accentBorder: "#fde68a",
    title: "Commandes, livraisons, fournisseurs.",
    desc: "Commandes liées au chantier, livraisons suivies, réceptions confirmées. Vos achats sont traçables et vos fournisseurs correctement pilotés.",
    tags: ["Bons de commande", "Livraisons", "Réceptions", "Fournisseurs", "Dépenses"],
    kpis: [
      { value: "34", label: "Commandes actives" },
      { value: "214 k€", label: "Engagements en cours" },
      { value: "1", label: "Livraison en retard" },
    ],
    preview: [
      { label: "BC membrane fournisseur", status: "Confirmé", pct: 100, color: "#d97706" },
      { label: "Livraison prévue 11/08", status: "En attente", pct: 50, color: "#d97706" },
      { label: "Facture fournisseur", status: "À contrôler", pct: 0, color: "#ea580c" },
    ],
  },
  {
    id: "pilotage",
    label: "Pilotage",
    accent: "#0d9488",
    accentLight: "#f0fdfa",
    accentBorder: "#99f6e4",
    title: "Budgets, marges et rentabilité.",
    desc: "Suivez vos budgets, engagements et dépenses en temps réel. Connaissez votre marge et votre rentabilité sans attendre la clôture comptable.",
    tags: ["Budget", "Dépenses", "Marges", "Engagements", "Rentabilité"],
    kpis: [
      { value: "+12,4%", label: "Marge provisoire" },
      { value: "756 k€", label: "Dépenses / 980 k€" },
      { value: "77%", label: "Budget consommé" },
    ],
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2563eb]">
            La plateforme BeWork
          </p>
          <h2
            id="platform-heading"
            className="font-display mt-3 text-balance text-[1.75rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#0a0a0a] sm:text-[2.25rem] md:text-[2.75rem] lg:text-[3rem]"
          >
            Tout votre fonctionnement au même endroit.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Le problème n&apos;est pas de manquer d&apos;outils.{" "}
            <strong className="font-semibold text-[#0a0a0a]">C&apos;est qu&apos;ils ne travaillent pas ensemble.</strong>
          </p>
        </div>

        {/* Pills de navigation colorées */}
        <div className="mt-10 flex flex-wrap justify-center gap-2 sm:mt-12" role="tablist" aria-label="Modules BeWork">
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
                  "rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200",
                  selected
                    ? "shadow-sm scale-105"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-800",
                )}
                style={selected ? { background: m.accentLight, borderColor: m.accentBorder, color: m.accent } : undefined}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Panneau actif */}
        <div role="tabpanel" aria-live="polite" className="mt-6" key={current.id}>
          <div
            className="bework-sheen overflow-hidden rounded-3xl border shadow-[0_4px_24px_rgba(15,23,42,0.08)]"
            style={{ borderColor: current.accentBorder }}
          >
            {/* Bande top colorée */}
            <div
              className="h-1 w-full"
              style={{ background: `linear-gradient(to right, ${current.accent}, ${current.accent}80)` }}
              aria-hidden
            />

            <div className="grid md:grid-cols-[1fr_320px]">
              {/* Gauche — texte + KPIs */}
              <div className="p-7 sm:p-9" style={{ background: current.accentLight }}>
                <h3
                  className="font-display text-xl font-extrabold tracking-tight sm:text-2xl"
                  style={{ color: current.accent }}
                >
                  {current.title}
                </h3>
                <p className="mt-3 max-w-lg text-base leading-relaxed text-slate-700">{current.desc}</p>

                {/* KPIs */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {current.kpis.map((kpi) => (
                    <div
                      key={kpi.label}
                      className="bework-sheen rounded-xl border bg-white/80 px-3 py-3 text-center shadow-sm"
                      style={{ borderColor: current.accentBorder }}
                    >
                      <p className="font-display text-xl font-extrabold tracking-tight" style={{ color: current.accent }}>
                        {kpi.value}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium leading-snug text-slate-500">{kpi.label}</p>
                    </div>
                  ))}
                </div>

                {/* Tags */}
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {current.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border px-3 py-1 text-xs font-semibold"
                      style={{ borderColor: `${current.accent}30`, background: `${current.accent}10`, color: current.accent }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Droite — preview produit */}
              <div className="border-t bg-white p-5 md:border-l md:border-t-0" style={{ borderColor: current.accentBorder }}>
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: current.accent }}>
                  Dans BeWork
                </p>
                <ul className="space-y-3">
                  {current.preview.map((item) => (
                    <li key={item.label} className="bework-sheen rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-xs font-semibold text-slate-800">{item.label}</span>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{ background: `${item.color}15`, color: item.color }}
                        >
                          {item.status}
                        </span>
                      </div>
                      {item.pct > 0 && (
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${item.pct}%`, background: item.color }}
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {/* Indicateur module actif */}
                <div className="mt-5 flex items-center gap-2 rounded-lg border px-3 py-2" style={{ borderColor: current.accentBorder, background: `${current.accent}08` }}>
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: current.accent }} aria-hidden />
                  <span className="text-[10px] font-semibold" style={{ color: current.accent }}>
                    Module {current.label} — actif
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
