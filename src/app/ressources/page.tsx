import type { Metadata } from "next";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { absoluteUrl } from "@/lib/site";

const pageUrl = absoluteUrl("/ressources");
const ogImage = absoluteUrl("/opengraph-image");

export const metadata: Metadata = {
  title: "Ressources BTP | Guides pratiques chantier avec BeWork",
  description:
    "Guides pratiques, conseils et prompts IA pour aider les entreprises du BTP à préparer DOE, PPSPS, DCE, CCTP, comptes rendus, réserves, devis et documents travaux.",
  alternates: { canonical: pageUrl, languages: { fr: pageUrl, "x-default": pageUrl } },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: pageUrl,
    siteName: "BeWork",
    title: "Ressources BTP — guides et prompts (BeWork)",
    description:
      "Guides pratiques, conseils chantier et prompts IA pour mieux structurer vos dossiers travaux (BTP).",
    images: [{ url: ogImage, width: 1200, height: 630, alt: "Ressources BTP — BeWork" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ressources BTP — BeWork",
    description: "Guides pratiques, conseils chantier et prompts IA pour structurer vos dossiers travaux.",
  },
  robots: { index: true, follow: true },
};

type GuideStart = { title: string; desc: string; href: string };
type GuideAvail = { title: string; desc: string; href: string; icon: "folder" | "document" | "refresh" | "truck" | "invoice" | "grid" };
type GuideSoon = { title: string; desc: string };
type PromptCard = { title: string; desc: string };

const COMMENCER_ICI: readonly GuideStart[] = [
  {
    title: "Préparer un DOE",
    desc: "Pièces à rassembler et organisation progressive en fin de chantier.",
    href: "/ressources/doe-btp",
  },
  {
    title: "Faire un compte rendu de chantier",
    desc: "Décisions, actions et responsables : un CR clair après réunion.",
    href: "/ressources/compte-rendu-chantier",
  },
  {
    title: "Relancer un devis BTP",
    desc: "Calendrier et messages courts pour relancer sans harceler.",
    href: "/relance-devis-btp",
  },
  {
    title: "Organiser une DICT / DT",
    desc: "Checklist, délais et classement des pièces avant travaux.",
    href: "/dict-dt-travaux",
  },
] as const;

const GUIDES_DISPONIBLES: readonly GuideAvail[] = [
  {
    title: "Préparer un DOE",
    desc: "Dossier des ouvrages exécutés : checklist et méthode.",
    href: "/ressources/doe-btp",
    icon: "folder",
  },
  {
    title: "Faire un compte rendu de chantier",
    desc: "Structurez réunions et points chantier en quelques blocs.",
    href: "/ressources/compte-rendu-chantier",
    icon: "document",
  },
  {
    title: "Relancer un devis BTP",
    desc: "Statuts, calendrier et relances pro.",
    href: "/relance-devis-btp",
    icon: "refresh",
  },
  {
    title: "Suivre les fournisseurs chantier",
    desc: "Commandes, livraisons et preuves pour ne pas bloquer le site.",
    href: "/suivi-fournisseurs-chantier",
    icon: "truck",
  },
  {
    title: "Relancer une facture ou situation",
    desc: "Relances et suivi des paiements pour la trésorerie.",
    href: "/impayes-btp-relances",
    icon: "invoice",
  },
  {
    title: "Mettre en place un tableau de suivi chantier",
    desc: "Demandes, statuts et points bloquants sur une vue simple.",
    href: "/chantier-mal-suivi",
    icon: "grid",
  },
] as const;

const GUIDES_A_VENIR: readonly GuideSoon[] = [
  { title: "Structurer un DUERP", desc: "Organiser infos et pièces pour une version exploitable." },
  { title: "Préparer un PV de levée de réserve", desc: "Suivi des réserves et preuves pour clôturer." },
  { title: "Comprendre un CCTP", desc: "Lire les obligations et repérer les points sensibles." },
  { title: "Trier et analyser un DCE", desc: "Pièces, manquants et livrables attendus." },
] as const;

const PROMPTS_IA: readonly PromptCard[] = [
  { title: "Analyser un CCTP", desc: "Extraire obligations et points à valider (avec supervision)." },
  { title: "Trier un DCE", desc: "Lister pièces, manquants et questions utiles." },
  { title: "Structurer un DOE", desc: "Checklist et plan de classement progressif." },
  { title: "Relancer un devis travaux", desc: "Message court, professionnel et contextualisé." },
] as const;

const FAQ_ITEMS = [
  {
    q: "Les guides remplacent-ils un expert technique ou juridique ?",
    a: "Non. Les ressources sont pédagogiques. Elles ne remplacent pas un bureau d’études, un maître d’œuvre, un avocat ou un expert réglementaire.",
  },
  {
    q: "BeWork peut-elle préparer ces documents à ma place ?",
    a: "BeWork peut aider à préparer, structurer, classer et relancer (sur périmètre cadré). Vous gardez la validation finale sur ce qui engage votre entreprise.",
  },
  {
    q: "Comment utiliser ces ressources au quotidien ?",
    a: "Choisissez un guide ou un prompt, appliquez la méthode à votre dossier, puis adaptez à vos outils. Si vous manquez de temps, BeWork peut vous accompagner.",
  },
] as const;

function FaqJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function BadgeDisponible() {
  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
      Disponible
    </span>
  );
}

function BadgeAVenir() {
  return (
    <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200/90">
      À venir
    </span>
  );
}

function BadgePromptIa() {
  return (
    <span className="inline-flex rounded-full bg-[#eff6ff] px-2.5 py-1 text-[11px] font-semibold text-[#1d4ed8] ring-1 ring-blue-100">
      Prompt IA
    </span>
  );
}

function GuideIcon({ id, className }: { id: GuideAvail["icon"]; className?: string }) {
  const cn = className ?? "h-6 w-6 text-[#1d4ed8]";
  switch (id) {
    case "folder":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 18V8a2 2 0 012-2h4l2 3h10a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
          <path strokeLinecap="round" d="M3 13h18" />
        </svg>
      );
    case "document":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h10a2 2 0 002-2V9l-5-6H8a2 2 0 00-2 2v13a2 2 0 002 2z" />
          <path strokeLinecap="round" d="M13 4v7h7M10 17h9M10 13h9" />
        </svg>
      );
    case "refresh":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 12a8 8 0 01-13.657 5.657M4 12a8 8 0 0113.657-5.657M4 12H1m18 0h3" />
        </svg>
      );
    case "truck":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 17h-.75M7 15H19l-1.5-9H8.5M7 15L6 4H3M7 15H5.5M9 20a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
          <path strokeLinecap="round" d="M7 9h13" />
        </svg>
      );
    case "invoice":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 21V4h10l5 5v13H8zm5-16v6m4-6 4 4m-17 11h13" />
        </svg>
      );
    case "grid":
      return (
        <svg className={cn} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" aria-hidden>
          <path strokeLinecap="round" d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z" />
        </svg>
      );
    default:
      return null;
  }
}

function AnchorNav() {
  const links = [
    { href: "#guides-disponibles", label: "Guides disponibles" },
    { href: "#guides-a-venir", label: "Guides à venir" },
    { href: "#prompts-ia", label: "Prompts IA" },
  ] as const;
  return (
    <nav className="flex flex-wrap justify-center gap-2" aria-label="Accès rapide aux sections">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export default function RessourcesPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <FaqJsonLd />
      <MarketingSiteHeader plainBg />

      <main className="mx-auto max-w-site px-6 pb-20 pt-14 md:pb-28 md:pt-16">
        {/* Hero */}
        <header className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_minmax(0,0.75fr)] lg:items-start lg:gap-14">
          <div className="text-center lg:text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#1d4ed8]">Ressources</p>
            <h1 className="mt-3 text-balance text-3xl font-bold tracking-tight text-black md:text-4xl lg:text-[2.35rem] lg:leading-tight">
              Ressources BTP pour vos dossiers chantier
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-snug text-slate-600 lg:mx-0 lg:max-w-lg">
              Guides pratiques, documents travaux, devis, relances et prompts IA pour mieux organiser votre suivi chantier.
            </p>
            <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center lg:justify-start">
              <Link
                href="#guides-disponibles"
                className="inline-flex min-h-[2.875rem] w-full items-center justify-center rounded-xl bg-[#1d4ed8] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1e40af] sm:w-auto"
              >
                Voir les guides
              </Link>
              <Link
                href="#prompts-ia"
                className="inline-flex min-h-[2.875rem] w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-900 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 sm:w-auto"
              >
                Voir les prompts IA
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold text-slate-900">Ce que vous trouverez ici</p>
            <ul className="mt-4 space-y-3 text-sm font-medium text-slate-700">
              <li className="flex items-center gap-2.5">
                <span className="size-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                Documents chantier
              </li>
              <li className="flex items-center gap-2.5">
                <span className="size-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                Devis &amp; relances
              </li>
              <li className="flex items-center gap-2.5">
                <span className="size-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                Organisation chantier
              </li>
              <li className="flex items-center gap-2.5">
                <span className="size-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                Prompts IA BTP
              </li>
            </ul>
          </div>
        </header>

        <div className="mx-auto mt-12 max-w-3xl">
          <AnchorNav />
        </div>

        {/* Commencer ici */}
        <section id="commencer-ici" className="mx-auto mt-16 max-w-6xl scroll-mt-28" aria-labelledby="titre-commencer">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h2 id="titre-commencer" className="text-xl font-bold tracking-tight text-black md:text-2xl">
              Commencer ici
            </h2>
            <p className="text-sm text-slate-500">Quatre entrées courtes pour avancer vite.</p>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {COMMENCER_ICI.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold leading-snug tracking-tight text-slate-900">{g.title}</h3>
                  <BadgeDisponible />
                </div>
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-snug text-slate-600">{g.desc}</p>
                <span className="mt-5 text-sm font-semibold text-[#1d4ed8] group-hover:underline">
                  Lire le guide <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Guides disponibles */}
        <section id="guides-disponibles" className="mx-auto mt-20 max-w-6xl scroll-mt-28" aria-labelledby="titre-guides-disponibles">
          <div className="max-w-2xl">
            <h2 id="titre-guides-disponibles" className="text-xl font-bold tracking-tight text-black md:text-2xl">
              Guides disponibles
            </h2>
            <p className="mt-2 text-sm text-slate-600">Une sélection courte — le reste est listé ci-dessous en un clic.</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {GUIDES_DISPONIBLES.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                className="group flex gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8] focus-visible:ring-offset-2"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eff6ff] ring-1 ring-blue-100" aria-hidden>
                  <GuideIcon id={g.icon} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-lg font-bold leading-snug tracking-tight text-slate-900">{g.title}</h3>
                    <BadgeDisponible />
                  </div>
                  <p className="mt-2 text-sm leading-snug text-slate-600">{g.desc}</p>
                  <span className="mt-4 inline-flex text-sm font-semibold text-[#1d4ed8] group-hover:underline">
                    Lire le guide <span aria-hidden>→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-10 text-center text-sm text-slate-600">
            <span className="font-medium text-slate-700">Autres guides déjà disponibles :</span>{" "}
            <Link href="/ressources/ppsps-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
              Préparer un PPSPS
            </Link>
            {" · "}
            <Link href="/devis-retard-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
              Sortir vos devis plus vite
            </Link>
          </p>
        </section>

        {/* Guides à venir */}
        <section id="guides-a-venir" className="mx-auto mt-20 max-w-6xl scroll-mt-28" aria-labelledby="titre-guides-a-venir">
          <h2 id="titre-guides-a-venir" className="text-xl font-bold tracking-tight text-black md:text-2xl">
            Guides à venir
          </h2>
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/80 p-5 md:p-6">
            <ul className="grid gap-3 sm:grid-cols-2">
              {GUIDES_A_VENIR.map((g) => (
                <li
                  key={g.title}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/90 px-4 py-3.5 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold leading-snug text-slate-900">{g.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-500">{g.desc}</p>
                  </div>
                  <BadgeAVenir />
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Prompts IA */}
        <section id="prompts-ia" className="mx-auto mt-20 max-w-6xl scroll-mt-28" aria-labelledby="titre-prompts">
          <h2 id="titre-prompts" className="text-xl font-bold tracking-tight text-black md:text-2xl">
            Prompts IA pour le BTP
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {PROMPTS_IA.map((p) => (
              <div key={p.title} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-bold leading-snug tracking-tight text-slate-900">{p.title}</h3>
                  <BadgePromptIa />
                </div>
                <p className="mt-2 flex-1 text-sm leading-snug text-slate-600">{p.desc}</p>
                <p className="mt-5 text-sm font-semibold text-slate-400" aria-live="polite">
                  Bientôt disponible
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Comment utiliser */}
        <section className="mx-auto mt-20 max-w-3xl" aria-labelledby="titre-utiliser">
          <h2 id="titre-utiliser" className="text-center text-xl font-bold tracking-tight text-black md:text-2xl">
            Comment utiliser ces ressources ?
          </h2>
          <ol className="mt-8 space-y-4">
            {[
              { n: "1", t: "Choisissez le bon guide ou prompt", d: "Prenez le sujet qui bloque aujourd’hui (DOE, relance, suivi…)." },
              { n: "2", t: "Appliquez la méthode à votre dossier", d: "Checklist courte, puis adaptez à votre chantier et vos outils." },
              { n: "3", t: "Manque de temps ?", d: "BeWork peut préparer et structurer avec vous — vous validez la suite." },
            ].map((step) => (
              <li key={step.n} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-sm font-bold text-[#1d4ed8]"
                  aria-hidden
                >
                  {step.n}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{step.t}</p>
                  <p className="mt-1 text-sm leading-snug text-slate-600">{step.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA final */}
        <section className="mx-auto mt-20 max-w-3xl" aria-label="Découvrir BeWork">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm md:p-10">
            <h2 className="text-xl font-bold tracking-tight text-black md:text-2xl">
              Vous préférez déléguer plutôt que tout préparer seul ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-600">
              BeWork vous aide à structurer vos dossiers chantier, vos relances et vos documents travaux avec un relais bureau-chantier clair et
              opérationnel.
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
              <Link href="/assistants-administratifs-taches" className="inline-flex justify-center rounded-xl bg-[#1d4ed8] px-7 py-3.5 font-semibold text-white shadow-sm hover:bg-[#1e40af]">
                Découvrir les missions
              </Link>
              <Link href="/contact" className="inline-flex justify-center rounded-xl border border-slate-200 bg-white px-7 py-3.5 font-semibold text-slate-900 shadow-sm hover:bg-slate-50">
                Réserver un appel
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ compacte */}
        <section aria-label="FAQ" className="mx-auto mt-16 max-w-3xl">
          <h2 className="text-lg font-bold text-black">Questions fréquentes</h2>
          <ul className="mt-5 space-y-3">
            {FAQ_ITEMS.map((item) => (
              <li key={item.q} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold text-black [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <span className="shrink-0 text-slate-500 group-open:rotate-180" aria-hidden>
                      ▾
                    </span>
                  </summary>
                  <div className="border-t border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-600">{item.a}</div>
                </details>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-12">
        <div className="mx-auto flex max-w-site flex-col gap-6 text-sm text-black md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <BeWorkLogo size="sm" />
            <span className="text-black">© {new Date().getFullYear()} BeWork</span>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/" className="font-medium hover:text-black">
              Accueil
            </Link>
            <Link href="/assistants-administratifs-taches" className="font-medium hover:text-black">
              Missions
            </Link>
            <Link href="/notre-facon-de-travailler" className="font-medium hover:text-black">
              Méthode
            </Link>
            <Link href="/tarifs" className="font-medium hover:text-black">
              Tarifs
            </Link>
            <Link href="/contact" className="font-medium hover:text-black">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
