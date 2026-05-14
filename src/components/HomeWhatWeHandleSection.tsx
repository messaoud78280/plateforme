import {
  BlueprintCotationMissionsFrame,
  BlueprintCotationWhatWeHandleAmbient,
} from "@/components/home/BlueprintCotationDecor";

/** Variantes uniquement dans la même teinte bleu BeWork (contraste léger carte 1 → 3). */
const SECONDARY_CARDS = [
  {
    title: "Dossiers & obligations",
    tagline: "Vous êtes carré. Sans y passer vos soirées.",
    items: ["DICT, autorisations", "Suivi administratif", "Échanges clients", "Documents centralisés"],
    wash: "from-blue-50/[0.72]",
    stripe: "from-[#1e40af] via-[#2563eb] to-[#3b82f6]",
    blob: "bg-blue-600",
    taglineBorder: "border-blue-700/35",
    checkClass: "text-blue-600",
    badgeTone: "bg-blue-50/90 text-blue-800 ring-1 ring-blue-200/60",
    iconWrap: "bg-blue-50 text-blue-700 ring-blue-200/70",
    icon: "dossier" as const,
  },
  {
    title: "Fournisseurs & logistique",
    tagline: "Moins d’imprévus. Plus de fluidité chantier.",
    items: ["Commandes suivies", "Livraisons coordonnées", "Locations gérées", "Besoins anticipés"],
    wash: "from-blue-50/[0.65]",
    stripe: "from-[#2563eb] via-[#3b82f6] to-[#60a5fa]",
    blob: "bg-blue-500",
    taglineBorder: "border-blue-600/40",
    checkClass: "text-blue-600",
    badgeTone: "bg-blue-50/95 text-blue-800 ring-1 ring-blue-200/65",
    iconWrap: "bg-blue-50/95 text-blue-600 ring-blue-100/85",
    icon: "logistique" as const,
  },
  {
    title: "Pilotage & visibilité",
    tagline: "Vous pilotez sans subir.",
    items: ["Planning organisé", "Suivi chantiers", "Coordination globale", "Vision claire"],
    wash: "from-blue-50/[0.58]",
    stripe: "from-[#3b82f6] via-[#60a5fa] to-[#93c5fd]",
    blob: "bg-blue-400",
    taglineBorder: "border-blue-500/45",
    checkClass: "text-blue-600",
    badgeTone: "bg-blue-50/90 text-blue-800 ring-1 ring-blue-200/55",
    iconWrap: "bg-blue-50 text-blue-600 ring-blue-100/75",
    icon: "pilotage" as const,
  },
] as const;

function CardIcon({ id }: { id: (typeof SECONDARY_CARDS)[number]["icon"] }) {
  const cn = "h-[22px] w-[22px] shrink-0";
  switch (id) {
    case "dossier":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path d="M4 18V6a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 11h6M12 15h6" strokeLinecap="round" />
        </svg>
      );
    case "logistique":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path d="M3 17h13v-9H10l-3-3H3v12Z" strokeLinejoin="round" />
          <path d="M16 17h5l2-6h-4M16 17v-9" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="7.5" cy="19.5" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="18.5" cy="19.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case "pilotage":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6l4 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * Section « Ce qu’on gère pour vous » — sous « Process BeWork », même esprit premium SaaS.
 */
export function HomeWhatWeHandleSection() {
  return (
    <section
      id="ce-quon-gere"
      className="relative bg-transparent pt-10 pb-12 md:pt-12 md:pb-14"
      style={{ scrollMarginTop: "6rem" }}
      aria-labelledby="what-we-handle-heading"
    >
      <BlueprintCotationWhatWeHandleAmbient />
      {/* Même fond que « Process BeWork » : pas de dégradé vers le blanc (laisser la courbe grise du parent) */}
      <div className="container-site relative z-10">
        {/* 1 — En-tête (centré) */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-heading text-[13px] font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">
            Ce qu’on gère pour vous
          </p>
          <h2
            id="what-we-handle-heading"
            className="mt-4 text-balance text-3xl font-bold leading-[1.12] tracking-tight text-[#0f172a] md:text-4xl"
          >
            Votre bureau tourne.
            <br />
            <span className="text-[#1d4ed8]">Même quand vous êtes sur le chantier.</span>
          </h2>
          <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-blue-200/70 bg-gradient-to-b from-blue-50/90 to-blue-50/55 px-5 py-3.5 shadow-sm shadow-blue-900/[0.06] ring-1 ring-blue-100/80 md:mt-6 md:px-7 md:py-4">
            <p className="text-pretty text-center text-[15px] font-semibold leading-snug text-slate-800 md:text-[1.0625rem] md:leading-relaxed">
              <span className="font-bold text-[#1d4ed8]">+20 ans d’expérience terrain</span>
              <span className="text-slate-800">
                {" "}
                dans le BTP au service de votre organisation
              </span>
            </p>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-relaxed text-slate-600 max-xl:text-pretty md:mt-7 xl:max-w-none xl:whitespace-nowrap">
            On tient ce qui doit avancer côté bureau pour ne pas faire dérailler le chantier.
          </p>
        </div>

        <div className="mx-auto mt-7 max-w-3xl">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100/85">
              <p className="font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-[#1d4ed8]">Tâches répétitives</p>
              <p className="mt-2 text-[14px] font-semibold leading-snug text-slate-800">
                Relances, suivi, demandes fournisseurs : tenir le rythme, sans y laisser vos soirées.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100/85">
              <p className="font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-[#1d4ed8]">Missions avancées BTP</p>
              <p className="mt-2 text-[14px] font-semibold leading-snug text-slate-800">
                DOE, PPSPS, DUERP, DCE/CCTP : structurer des livrables chantier propres, au bon moment.
              </p>
            </div>
          </div>
        </div>

        {/* 2 — Trois cartes */}
        <div className="relative mt-14 md:mt-16">
          <BlueprintCotationMissionsFrame />
          <div className="relative z-10 grid gap-7 md:grid-cols-3">
          {SECONDARY_CARDS.map((card, index) => {
            const num = String(index + 1).padStart(2, "0");
            return (
              <div
                key={card.title}
                className="bework-what-handle-card group/card relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-6 shadow-md shadow-slate-900/[0.06] ring-1 ring-black/[0.03] transition-[transform,box-shadow,border-color,ring-color] duration-300 ease-out will-change-transform motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-xl motion-safe:hover:shadow-slate-900/[0.12] motion-safe:hover:border-slate-300/90 motion-safe:hover:ring-slate-200/80 motion-reduce:transition-none md:p-7"
              >
                <span
                  className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${card.wash} to-transparent`}
                  aria-hidden
                />
                {/* Halo coin — varie selon la carte */}
                <div
                  className={`pointer-events-none absolute -right-10 -top-10 h-[7.5rem] w-[7.5rem] rounded-full ${card.blob} opacity-[0.11] blur-3xl transition-opacity duration-300 group-hover/card:opacity-[0.18]`}
                  aria-hidden
                />
                {/* Second halo plus discret — coin bas gauche */}
                <div
                  className={`pointer-events-none absolute -bottom-12 -left-8 h-[5.25rem] w-[5.25rem] rounded-full ${card.blob} opacity-[0.07] blur-3xl transition-opacity duration-300 group-hover/card:opacity-[0.12]`}
                  aria-hidden
                />
                {/* Fine barre dégradée en tête */}
                <div
                  className={`absolute left-6 right-6 top-0 h-[3px] rounded-b-full bg-gradient-to-r opacity-95 ${card.stripe}`}
                  aria-hidden
                />
                {/* Ligne d’accent en bas — révélée au survol */}
                <div
                  className={`pointer-events-none absolute inset-x-6 bottom-0 h-[2px] rounded-t-full bg-gradient-to-r opacity-0 transition-opacity duration-300 motion-safe:group-hover/card:opacity-[0.92] ${card.stripe}`}
                  aria-hidden
                />

                <div className="relative pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3.5">
                      <span
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-2 ${card.iconWrap} shadow-sm shadow-slate-900/[0.04] transition-transform duration-300 motion-safe:group-hover/card:scale-105`}
                        aria-hidden
                      >
                        <CardIcon id={card.icon} />
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <h4 className="text-[1.05rem] font-semibold tracking-tight text-[#0f172a] md:text-lg">{card.title}</h4>
                        <p
                          className={`mt-3 border-l-[3px] pl-3 text-[15px] font-semibold leading-snug text-slate-800 ${card.taglineBorder}`}
                        >
                          {card.tagline}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-lg px-2 py-0.5 text-[11px] font-bold tabular-nums tracking-wide ${card.badgeTone}`}
                    >
                      {num}
                    </span>
                  </div>

                  <ul className="mt-5 space-y-1 text-sm leading-snug text-slate-600">
                    {card.items.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2.5 rounded-lg px-1.5 py-1.5 transition-colors duration-200 motion-safe:hover:bg-slate-50/95 motion-safe:hover:ring-1 motion-safe:hover:ring-slate-100/80"
                      >
                        <span className={`mt-px shrink-0 font-semibold ${card.checkClass}`} aria-hidden>
                          ✓
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* 3 — Urgences chantier (bloc court, sans doubler le catalogue de missions) */}
        <div className="mt-10 md:mt-12">
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_10px_40px_-16px_rgba(15,23,42,0.1)] ring-1 ring-slate-100/85 md:p-8">
            <p className="font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-[#1d4ed8] md:text-[12px]">
              Urgences chantier
            </p>
            <h3 className="mt-2.5 text-balance font-sans text-xl font-bold tracking-tight text-[#0f172a] md:text-2xl">
              Quand le chantier bloque, BeWork prend le relais.
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600 md:text-base">
              Engin en panne, matériel manquant, livraison à confirmer, fournisseur à relancer, rendez-vous client à caler : votre Beworker traite les
              urgences opérationnelles à distance, contacte les bons interlocuteurs, compare les solutions et vous fait valider avant engagement.
            </p>
            <ul className="mt-5 grid gap-2 text-[14px] font-semibold text-slate-700 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Engins & locations",
                "Commandes fournisseurs",
                "Livraisons chantier",
                "RDV clients",
                "Relances urgentes",
                "Coordination planning",
              ].map((i) => (
                <li key={i} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2">
                  <span className="mt-[2px] text-[#1d4ed8]" aria-hidden>
                    ✓
                  </span>
                  <span>{i}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4 — Conducteur de travaux / Chargé d’affaires */}
        <div className="mt-10 md:mt-12">
          <div className="mx-auto max-w-5xl">
            <h3 className="text-balance text-xl font-bold tracking-tight text-[#0f172a] md:text-2xl">
              Un relais pour vos conducteurs de travaux et vos chargés d’affaires.
            </h3>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-100/85 md:p-7">
                <p className="font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-[#1d4ed8] md:text-[12px]">
                  Pour vos conducteurs de travaux
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600 md:text-base">
                  Situations de travaux, bons de commande, suivi sous-traitants, PV de réception, levées de réserves, factures clients, relances et
                  coordination quotidienne.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-slate-100/85 md:p-7">
                <p className="font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-[#1d4ed8] md:text-[12px]">
                  Pour vos chargés d’affaires
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-slate-600 md:text-base">
                  Dossiers de candidature, DC1/DC2/DC4, mémoire technique, références chantier, relances devis, suivi commercial et réponses
                  administratives clients.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 5 — Missions avancées (4 cartes) */}
        <div className="mt-10 md:mt-12">
          <div className="mx-auto max-w-5xl">
            <p className="font-heading text-[11px] font-bold uppercase tracking-[0.22em] text-[#1d4ed8] md:text-[12px]">
              Missions avancées BTP
            </p>
            <h3 className="mt-2.5 text-balance text-xl font-bold tracking-tight text-[#0f172a] md:text-2xl">
              Au‑delà du “bureau” : des livrables chantier concrets.
            </h3>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  t: "Sécurité & réglementaire",
                  b: "DUERP, PPSPS, plans de prévention, documents obligatoires.",
                },
                {
                  t: "Appels d’offres & dossiers techniques",
                  b: "DCE, mémoire technique, DC1/DC2/DC4, références chantier.",
                },
                { t: "Chiffrage & contractuel", b: "DPGF, devis, avenants, BPU, suivi financier." },
                { t: "Réception & clôture chantier", b: "PV, OPR, levée de réserves, DOE, synthèse finale." },
              ].map((c) => (
                <div
                  key={c.t}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm ring-1 ring-slate-100/85"
                >
                  <p className="text-[14px] font-bold leading-snug text-slate-900">{c.t}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-600">{c.b}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
