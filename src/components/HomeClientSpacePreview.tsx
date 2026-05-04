"use client";

import { useState } from "react";

const BLUE = "#2563eb";

const TABS = ["Demandes", "Échanges", "Documents"] as const;
export type HomeClientSpaceTab = (typeof TABS)[number];

const TAB_INTRO: Record<HomeClientSpaceTab, string> = {
  Demandes:
    "Une seule file pour tout déposer : devis, dossiers chantier, relances. Chaque mission est qualifiée, attribuée à un Beworker et suivie par étapes jusqu’à livraison.",
  Échanges:
    "Messagerie intégrée avec votre équipe dédiée : consignes, validations devis, reprises — tout est horodaté et conserve l’historique du dossier.",
  Documents:
    "Pièces centralisées par mission et par chantier : versions, classement, relecture avant envoi sur les courriers ou livrables sensibles.",
};

const MESSAGES: { from: string; msg: string; time: string }[] = [
  {
    from: "Équipe BeWork",
    msg: "Le devis est validé côté chiffrage, je vous l'envoie pour relecture.",
    time: "10:24",
  },
  {
    from: "Vous",
    msg: "Parfait — ajoutez la mention garantie décennale sur la dernière page.",
    time: "09:52",
  },
  {
    from: "Équipe BeWork",
    msg: "Reçu. Je mets à jour et je relance le client pour signature.",
    time: "Hier 16:30",
  },
];

const DOCS: { name: string; tag: string; tagClass: string }[] = [
  { name: "Devis gros œuvre — v3_signé.pdf", tag: "À valider", tagClass: "border-amber-200 text-amber-800 bg-amber-50/80" },
  { name: "Mémoire technique — brouillon.docx", tag: "En relecture", tagClass: "border-blue-200 text-blue-800 bg-blue-50/80" },
  { name: "Plans réseaux — annexe.zip", tag: "Archivé", tagClass: "border-emerald-200 text-emerald-800 bg-emerald-50/80" },
];

type HomeClientSpacePreviewProps = {
  className?: string;
  defaultTab?: HomeClientSpaceTab;
  showCaption?: boolean;
};

export function HomeClientSpacePreview({
  className = "max-w-lg",
  defaultTab = "Demandes",
  showCaption = true,
}: HomeClientSpacePreviewProps) {
  const [tab, setTab] = useState<HomeClientSpaceTab>(defaultTab);

  return (
    <div className={`mx-auto w-full ${className}`.trim()}>
      <div className="rounded-[14px] border border-slate-200/90 bg-white/95 p-4 shadow-[0_18px_48px_-12px_rgba(15,23,42,0.1)] ring-1 ring-slate-100 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <span className="text-lg font-bold tracking-[-0.04em] text-[#0f172a] md:text-xl lg:text-[1.35rem] lg:tracking-[-0.045em]">
            Be<span style={{ color: BLUE }}>Work</span>
          </span>
          <nav className="flex flex-wrap justify-end gap-1.5" aria-label="Zones de l’espace client">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors md:text-[12px] ${
                  tab === t
                    ? "border-2 border-[#2563eb] bg-white text-[#0f172a] shadow-sm shadow-blue-900/8"
                    : "border border-transparent bg-slate-50/90 text-slate-600 hover:border-slate-200 hover:text-slate-900"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-slate-600 md:text-[13px]">{TAB_INTRO[tab]}</p>

        {tab === "Demandes" && <PanelDemandes />}
        {tab === "Échanges" && <PanelEchanges />}
        {tab === "Documents" && <PanelDocuments />}

        {showCaption ? (
          <p className="mt-3 text-center text-[11px] text-slate-400 md:text-[12px]">Aperçu illustratif de l’espace client</p>
        ) : null}
      </div>
    </div>
  );
}

function PanelDemandes() {
  return (
    <>
      <div className="mt-3.5 rounded-xl border border-slate-100 bg-slate-50/80 p-3 md:p-3.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[13px] font-semibold leading-snug text-slate-900 md:text-sm">Mémoire technique — AO Mairie</p>
            <p className="mt-0.5 text-[11px] leading-snug text-slate-500 md:text-[12px]">
              Dossier ouvert le 12 avr. · Réf. MT-2026-084
            </p>
          </div>
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide md:text-[11px]"
            style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}
          >
            En cours
          </span>
        </div>

        <div className="mt-2.5 flex flex-wrap gap-1.5" aria-hidden>
          <span className="rounded-md border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-medium text-emerald-800 md:text-[11px]">
            Validé
          </span>
          <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 md:text-[11px]">
            Terminé
          </span>
        </div>
      </div>

      <ul className="mt-3.5 space-y-1.5 text-[12px] md:text-[13px] [&_svg]:h-4 [&_svg]:w-4">
        <li className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-2.5 py-2">
          <span className="text-slate-700">Demande créée</span>
          <span className="text-emerald-600" aria-label="Fait">
            <IconCheckSmall />
          </span>
        </li>
        <li className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-2.5 py-2">
          <span className="text-slate-700">Attribuée au Beworker</span>
          <span className="text-emerald-600" aria-label="Fait">
            <IconCheckSmall />
          </span>
        </li>
        <li className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/50 px-2.5 py-2">
          <span className="font-medium text-slate-800">Rédaction & relecture</span>
          <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" aria-label="En cours" />
        </li>
      </ul>

      <div className="mt-4 rounded-[10px] border border-slate-100 bg-white p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 md:text-[11px]">Avancement forfait</p>
        <div className="mt-1.5 flex items-baseline justify-between gap-2">
          <span className="text-xl font-bold tabular-nums text-slate-900 md:text-2xl">42</span>
          <span className="text-[11px] text-slate-500 md:text-xs">/ 185 crédits utilisés</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-[22.7%] rounded-full" style={{ backgroundColor: BLUE }} />
        </div>
      </div>
    </>
  );
}

function PanelEchanges() {
  return (
    <div className="mt-3.5 space-y-2.5">
      <p className="text-[12px] font-semibold text-slate-900 md:text-sm">Échanges</p>
      <div className="space-y-2.5">
        {MESSAGES.map((m, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 px-3 py-2.5 text-left shadow-sm shadow-slate-900/[0.04]"
          >
            <p className="text-xs font-semibold text-[#1d4ed8]">{m.from}</p>
            <p className="mt-0.5 text-[12px] leading-snug text-slate-800 md:text-[13px]">{m.msg}</p>
            <p className="mt-1 text-[10px] text-slate-400">{m.time}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PanelDocuments() {
  return (
    <div className="mt-3.5">
      <p className="text-[12px] font-semibold text-slate-900 md:text-sm">Documents du dossier</p>
      <ul className="mt-2.5 space-y-2">
        {DOCS.map((d) => (
          <li
            key={d.name}
            className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2.5 shadow-sm"
          >
            <span className="min-w-0 text-[12px] font-medium leading-snug text-slate-800 md:text-[13px]">{d.name}</span>
            <span
              className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold md:text-[11px] ${d.tagClass}`}
            >
              {d.tag}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IconCheckSmall() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
    </svg>
  );
}
