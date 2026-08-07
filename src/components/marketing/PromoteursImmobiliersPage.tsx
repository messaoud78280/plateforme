import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Camera,
  ClipboardList,
  FileText,
  MapPin,
  Monitor,
  ShieldCheck,
  Users,
} from "lucide-react";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingDisclosure } from "@/components/marketing/MarketingDisclosure";
import { SeoInternalLinks } from "@/components/seo/SeoInternalLinks";

const PAGE_PATH = "/promoteurs-immobiliers" as const;

const TRUST_ITEMS = [
  "Comptes rendus",
  "Relances entreprises",
  "Suivi DOE",
  "Réserves",
  "Tableaux de bord",
  "Reporting opération",
  "Présence terrain possible",
] as const;

const INTERVENTION_MODES = [
  {
    title: "Suivi à distance",
    text: "BeWork prend en charge le suivi administratif, les relances, les comptes rendus, les tableaux de bord, le suivi DOE, les réserves et le reporting opération depuis notre plateforme.",
    missions: [
      "Relances entreprises",
      "Suivi documentaire",
      "Comptes rendus",
      "Tableaux de bord",
      "DOE",
      "Réserves",
      "Reporting",
    ],
    icon: Monitor,
  },
  {
    title: "Suivi hybride",
    text: "BeWork combine le suivi à distance avec des visites ponctuelles sur chantier pour constater l’avancement, prendre des photos, remonter les points bloquants et actualiser les tableaux de suivi.",
    missions: [
      "Visites ponctuelles",
      "Photos chantier",
      "Remontées terrain",
      "Suivi des points bloquants",
      "Mise à jour des tableaux",
      "Appui aux réunions",
    ],
    icon: Camera,
  },
  {
    title: "Présence terrain outillée",
    text: "La plateforme centralise les remontées terrain : avancement, photos, points bloquants et coordination. Vos équipes ou interlocuteurs autorisés documentent sur place ; BeWork configure l’environnement.",
    missions: [
      "Remontées chantier",
      "Suivi visuel de l’avancement",
      "Appui aux réunions",
      "Comptes rendus structurés",
      "Suivi des réserves",
      "Prises de photos",
      "Alertes urgences",
      "Coordination documentaire",
      "Relances après visite",
    ],
    icon: MapPin,
  },
] as const;

const MISSIONS = [
  {
    title: "Suivi documentaire chantier",
    text: "Centralisation des documents, classement des pièces, suivi des documents manquants, relances entreprises, attestations, assurances, PPSPS, fiches techniques, DOE.",
    icon: FileText,
  },
  {
    title: "Comptes rendus et tableaux de suivi",
    text: "Mise en forme des comptes rendus, synthèse des décisions, suivi des actions, points bloquants, responsables, échéances, preuves, photos et historique.",
    icon: ClipboardList,
  },
  {
    title: "Relance des entreprises",
    text: "Relances structurées des entreprises, bureaux d’études, sous-traitants ou partenaires pour obtenir les documents, réponses, dates d’intervention ou éléments de suivi.",
    icon: Users,
  },
  {
    title: "Suivi des situations et pièces administratives",
    text: "Appui au suivi des situations, factures, avenants, OS, marchés, documents contractuels et échanges administratifs liés à l’opération.",
    icon: FileText,
  },
  {
    title: "Préparation des livraisons et réserves",
    text: "Suivi des OPR, tableaux de réserves, réserves par logement ou zone, relances de levée, suivi des PV et documents de livraison.",
    icon: Building2,
  },
  {
    title: "Présence terrain et remontées chantier",
    text: "Documenter l’avancement, photos, points bloquants et réunions dans la plateforme pour transmettre clairement les informations aux équipes du promoteur.",
    icon: MapPin,
  },
  {
    title: "Reporting opération",
    text: "Création de tableaux de bord clairs pour suivre l’avancement documentaire, les réserves, les urgences, les relances, les points en attente et les actions à mener.",
    icon: Monitor,
  },
] as const;

const ONSITE_MISSIONS = [
  "Passage régulier ou ponctuel sur chantier",
  "Prise de photos et remontée d’informations",
  "Suivi visuel de l’avancement",
  "Suivi des points bloquants",
  "Présence aux réunions de chantier",
  "Préparation ou rédaction des comptes rendus",
  "Mise à jour des tableaux de bord",
  "Suivi des réserves",
  "Relance des entreprises après visite",
  "Aide à la préparation des OPR et livraisons",
  "Contrôle de présence des intervenants si demandé",
  "Transmission des urgences au promoteur ou à la maîtrise d’œuvre",
] as const;

const BENEFITS = [
  "Moins de temps perdu dans les relances",
  "Meilleure traçabilité des échanges",
  "Documents chantier mieux centralisés",
  "Meilleur suivi des réserves",
  "Vision claire des points bloquants",
  "Présence terrain possible sans recrutement immédiat",
  "Appui flexible selon les phases de l’opération",
  "Soulagement des chargés d’opérations et équipes travaux",
  "Reporting plus clair pour la direction",
  "Meilleure préparation des livraisons",
] as const;

const USE_CASES = [
  "Une opération avec plusieurs entreprises à relancer",
  "Une livraison avec de nombreuses réserves à suivre",
  "Un DOE incomplet à reconstituer",
  "Des comptes rendus à structurer après chaque réunion",
  "Un chargé d’opération débordé par le suivi administratif",
  "Des tableaux de bord à produire pour la direction",
  "Des documents entreprises à réclamer avant réception",
  "Un chantier nécessitant une présence terrain ponctuelle",
  "Une phase OPR/livraison à mieux structurer",
  "Des photos chantier à centraliser et commenter",
  "Des points bloquants à suivre entre deux réunions",
] as const;

const OFFERS = [
  {
    title: "Mission ponctuelle",
    text: "Pour une livraison, un DOE, une phase de réserves, une remise en ordre documentaire ou un besoin urgent.",
    ideal: ["Réserves", "DOE", "OPR", "Relances urgentes", "Mise à jour documentaire"],
  },
  {
    title: "Suivi mensuel",
    text: "Pour accompagner une opération en cours avec relances, comptes rendus, tableaux de bord, suivi documentaire et reporting.",
    ideal: ["Opération en cours", "Chargé d’opération débordé", "Suivi régulier", "Reporting direction"],
  },
  {
    title: "Remontées terrain",
    text: "Pour outiller la présence chantier : documentation, photos, points bloquants et coordination dans la plateforme — par vos équipes ou interlocuteurs autorisés.",
    ideal: [
      "Chantier sensible",
      "Livraison proche",
      "Plusieurs entreprises à coordonner",
      "Besoin de présence terrain",
      "Suivi des réserves",
      "Remontées photos",
    ],
  },
] as const;

function SectionHeading({ kicker, title, intro }: { kicker?: string; title: string; intro?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {kicker ? (
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1d4ed8]">{kicker}</p>
      ) : null}
      <h2 className={`font-heading text-2xl font-bold tracking-tight text-[#0f172a] md:text-3xl ${kicker ? "mt-2" : ""}`}>
        {title}
      </h2>
      {intro ? <p className="mt-4 text-lg leading-relaxed text-slate-700">{intro}</p> : null}
    </div>
  );
}

function MissionCard({ title, text, icon: Icon }: { title: string; text: string; icon: LucideIcon }) {
  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]"
          aria-hidden
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </span>
        <h3 className="pt-1 text-base font-bold text-[#0f172a] md:text-lg">{title}</h3>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-700 md:text-base">{text}</p>
    </article>
  );
}

function MissionList({ items }: { items: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm text-slate-800">
      {items.map((m) => (
        <li key={m} className="flex gap-2">
          <span className="shrink-0 font-semibold text-[#1d4ed8]" aria-hidden>
            ✓
          </span>
          <span>{m}</span>
        </li>
      ))}
    </ul>
  );
}

function ModeCardContent({
  title,
  text,
  missions,
  icon: Icon,
}: {
  title: string;
  text: string;
  missions: readonly string[];
  icon: LucideIcon;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        <span
          className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#1d4ed8] text-white"
          aria-hidden
        >
          <Icon className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <h3 className="text-lg font-bold text-[#0f172a]">{title}</h3>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-700 md:text-base">{text}</p>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">Missions</p>
      <div className="mt-3 flex-1">
        <MissionList items={missions} />
      </div>
    </>
  );
}

export function PromoteursImmobiliersPage() {
  return (
    <main>
      {/* Hero */}
      <section className="px-4 pt-8 pb-12 sm:px-6 md:pt-16 md:pb-14 lg:pt-20 lg:pb-16" style={{ scrollMarginTop: "6rem" }}>
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1d4ed8]">Promoteurs immobiliers</p>
          <h1 className="font-heading mt-3 text-balance text-2xl font-bold tracking-tight text-[#0f172a] sm:text-3xl md:text-4xl lg:text-[2.65rem] lg:leading-tight">
            Plateforme chantier pour promoteurs immobiliers
          </h1>
          <p className="mt-5 text-balance text-lg font-semibold leading-snug text-[#1e3a5f] sm:text-xl md:text-2xl">
            Suivi documentaire et opérationnel de vos opérations immobilières
          </p>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-700">
            BeWork déploie une plateforme interne pour le suivi administratif, documentaire et opérationnel de vos
            chantiers — utilisée par vos équipes et interlocuteurs autorisés.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-base leading-relaxed text-slate-600">
            Nous configurons l&apos;environnement pour structurer le suivi, fluidifier les échanges, documenter les
            points bloquants et renforcer la traçabilité de vos opérations.
          </p>
          <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
            <CalendlyBookingLink
              trackLocation="promoteurs-hero"
              className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-lg bg-[#1d4ed8] px-6 text-base font-semibold text-white shadow-sm bework-cta-primary-glow hover:bg-[#1e40af] sm:w-auto"
            >
              Demander une démonstration
            </CalendlyBookingLink>
            <Link
              href="/#modules"
              className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-base font-semibold text-slate-900 shadow-sm hover:bg-slate-50 sm:w-auto"
            >
              Découvrir la plateforme
            </Link>
          </div>
          <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-slate-200/80 bg-white/90 px-4 py-4 shadow-sm sm:mt-10 sm:px-5">
            <p className="text-sm font-semibold text-slate-800">Ce que la plateforme couvre</p>
            <ul className="mt-3 flex flex-wrap justify-center gap-2">
              {TRUST_ITEMS.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 sm:text-sm"
                >
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Problème */}
      <section className="border-t border-slate-200/80 bg-white px-4 py-12 sm:px-6 md:py-16 lg:py-20">
        <div className="mx-auto max-w-site">
          <SectionHeading
            title="Quand les opérations s’accumulent, le suivi devient chronophage"
            intro="Entre les réunions de chantier, les relances d’entreprises, les documents manquants, les situations, les DOE, les réserves, les livraisons et les urgences terrain, les équipes de promotion immobilière perdent un temps précieux sur des tâches de suivi, de coordination et de traçabilité."
          />
          <p className="mx-auto mt-6 max-w-3xl text-center text-base leading-relaxed text-slate-700">
            BeWork intervient pour structurer, suivre, relancer, documenter et remonter les informations utiles, sans se
            substituer à la maîtrise d’œuvre ni aux responsabilités techniques des intervenants.
          </p>
        </div>
      </section>

      {/* Modes d'intervention */}
      <section className="px-4 py-12 sm:px-6 md:py-16 lg:py-20">
        <div className="mx-auto max-w-site">
          <SectionHeading title="À distance, en hybride ou avec remontées terrain" />

          {/* Mobile : accordéons */}
          <div className="mt-8 flex flex-col gap-3 lg:hidden">
            {INTERVENTION_MODES.map((mode, index) => {
              const Icon = mode.icon;
              return (
                <MarketingDisclosure
                  key={mode.title}
                  title={mode.title}
                  defaultOpen={index === 0}
                  leading={
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1d4ed8] text-white">
                      <Icon className="h-4 w-4" strokeWidth={2.25} />
                    </span>
                  }
                  panelClassName="px-4 pb-4 sm:px-5 sm:pb-5"
                >
                  <p className="text-sm leading-relaxed text-slate-700">{mode.text}</p>
                  <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">Missions</p>
                  <div className="mt-2">
                    <MissionList items={mode.missions} />
                  </div>
                </MarketingDisclosure>
              );
            })}
          </div>

          {/* Desktop : cartes */}
          <div className="mt-12 hidden gap-6 lg:grid lg:grid-cols-3">
            {INTERVENTION_MODES.map((mode) => (
              <article
                key={mode.title}
                className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-md shadow-slate-900/[0.04]"
              >
                <ModeCardContent {...mode} />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Missions */}
      <section className="border-t border-slate-200/80 bg-white px-4 py-12 sm:px-6 md:py-16 lg:py-20">
        <div className="mx-auto max-w-site">
          <SectionHeading title="Ce que BeWork peut prendre en charge pour un promoteur" />

          <div className="mt-8 flex flex-col gap-3 md:hidden">
            {MISSIONS.map((mission) => {
              const Icon = mission.icon;
              return (
                <MarketingDisclosure
                  key={mission.title}
                  title={mission.title}
                  leading={
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8]">
                      <Icon className="h-4 w-4" strokeWidth={2} />
                    </span>
                  }
                  panelClassName="px-4 pb-4 text-sm leading-relaxed text-slate-700 sm:px-5 sm:pb-5"
                >
                  {mission.text}
                </MarketingDisclosure>
              );
            })}
          </div>

          <div className="mt-12 hidden gap-5 md:grid sm:grid-cols-2 xl:grid-cols-3">
            {MISSIONS.map((mission) => (
              <MissionCard key={mission.title} {...mission} />
            ))}
          </div>
        </div>
      </section>

      {/* Assistant sur site */}
      <section className="px-4 py-12 sm:px-6 md:py-16 lg:py-20">
        <div className="mx-auto max-w-site">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-start lg:gap-10">
            <div>
              <SectionHeading title="Des remontées terrain structurées dans votre plateforme" />
              <p className="mt-6 text-base leading-relaxed text-slate-700 md:text-lg">
                Pour les promoteurs qui veulent plus de visibilité sans alourdir l&apos;organisation, BeWork configure
                un environnement où vos équipes et interlocuteurs autorisés documentent l&apos;avancement, les photos et
                les points bloquants — avec traçabilité et validation côté promoteur.
              </p>
              <div className="mt-6 rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 sm:p-5">
                <p className="text-sm leading-relaxed text-slate-800 md:text-base">
                  <strong>À préciser :</strong> la plateforme apporte de la visibilité, de la méthode et de la
                  traçabilité. Elle ne prend pas la direction technique du chantier et ne remplace pas les intervenants
                  désignés.
                </p>
              </div>
            </div>

            <MarketingDisclosure
              title="Usages terrain couverts"
              defaultOpen
              className="lg:hidden"
              panelClassName="px-4 pb-4 sm:px-5 sm:pb-5"
            >
              <MissionList items={ONSITE_MISSIONS} />
            </MarketingDisclosure>

            <div className="hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 lg:block">
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">Usages terrain</p>
              <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                {ONSITE_MISSIONS.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-snug text-slate-800">
                    <span className="shrink-0 font-semibold text-[#1d4ed8]" aria-hidden>
                      ✓
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Bénéfices */}
      <section className="border-t border-slate-200/80 bg-[#f1f5f9]/50 px-4 py-12 sm:px-6 md:py-16 lg:py-20">
        <div className="mx-auto max-w-site">
          <SectionHeading title="Pourquoi les promoteurs utilisent BeWork" />

          <div className="mt-8 md:hidden">
            <MarketingDisclosure title="Voir les 10 bénéfices" defaultOpen panelClassName="px-4 pb-4 sm:px-5 sm:pb-5">
              <ul className="flex flex-col gap-2.5">
                {BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex gap-2 text-sm text-slate-800">
                    <span className="shrink-0 font-bold text-[#1d4ed8]" aria-hidden>
                      ✓
                    </span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </MarketingDisclosure>
          </div>

          <ul className="mx-auto mt-10 hidden max-w-4xl gap-3 md:grid sm:grid-cols-2">
            {BENEFITS.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-3 rounded-lg border border-slate-200/70 bg-white px-4 py-3.5 text-sm text-slate-800 shadow-sm md:text-base"
              >
                <span className="mt-0.5 shrink-0 font-bold text-[#1d4ed8]" aria-hidden>
                  ✓
                </span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Positionnement / protection */}
      <section className="px-4 py-12 sm:px-6 md:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border-2 border-[#1e3a5f]/20 bg-white p-5 shadow-sm sm:p-8 md:p-10">
            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1e3a5f] text-white"
                aria-hidden
              >
                <ShieldCheck className="h-6 w-6" strokeWidth={2.25} />
              </span>
              <div>
                <h2 className="font-heading text-xl font-bold text-[#0f172a] md:text-2xl">
                  Un appui opérationnel, pas une substitution aux acteurs du chantier
                </h2>
                <p className="mt-4 text-base leading-relaxed text-slate-700">
                  BeWork équipe les équipes du promoteur, de la maîtrise d’œuvre et des entreprises via une plateforme
                  de suivi. Vos collaborateurs organisent, relancent, documentent et remontent les informations terrain.
                </p>
                <p className="mt-4 text-base leading-relaxed text-slate-700">
                  BeWork ne se substitue pas au maître d’œuvre, au bureau de contrôle, au coordonnateur SPS, à l’OPC,
                  aux entreprises ou aux responsables techniques désignés. Les responsabilités techniques,
                  réglementaires, contractuelles et décisionnelles restent portées par les acteurs compétents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cas d'usage */}
      <section className="border-t border-slate-200/80 bg-white px-4 py-12 sm:px-6 md:py-16 lg:py-20">
        <div className="mx-auto max-w-site">
          <SectionHeading title="Exemples d’interventions" />

          <div className="mt-8 md:hidden">
            <MarketingDisclosure title="Voir les exemples d’intervention" panelClassName="px-4 pb-4 sm:px-5 sm:pb-5">
              <ul className="flex flex-col gap-2.5">
                {USE_CASES.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-800">
                    <span className="shrink-0 text-[#1d4ed8]" aria-hidden>
                      →
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </MarketingDisclosure>
          </div>

          <ul className="mx-auto mt-10 hidden max-w-4xl gap-3 md:grid sm:grid-cols-2">
            {USE_CASES.map((item) => (
              <li key={item} className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-800 md:text-base">
                <span className="shrink-0 text-[#1d4ed8]" aria-hidden>
                  →
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Offres */}
      <section className="px-4 py-12 sm:px-6 md:py-16 lg:py-20">
        <div className="mx-auto max-w-site">
          <SectionHeading
            title="Une plateforme adaptable à vos opérations"
            intro="Composez votre plateforme selon les opérations : modules documentaires, remontées terrain, reporting. Déploiement progressif, à distance, avec formation des équipes du promoteur."
          />

          <div className="mt-8 flex flex-col gap-3 lg:hidden">
            {OFFERS.map((offer, index) => (
              <MarketingDisclosure
                key={offer.title}
                title={offer.title}
                defaultOpen={index === 0}
                panelClassName="px-4 pb-4 sm:px-5 sm:pb-5"
              >
                <p className="text-sm leading-relaxed text-slate-700">{offer.text}</p>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Idéal pour</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {offer.ideal.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </MarketingDisclosure>
            ))}
          </div>

          <div className="mt-12 hidden gap-6 lg:grid lg:grid-cols-3">
            {OFFERS.map((offer) => (
              <article
                key={offer.title}
                className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold text-[#1d4ed8]">{offer.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-700 md:text-base">{offer.text}</p>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Idéal pour</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {offer.ideal.map((tag) => (
                    <li
                      key={tag}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-slate-600">
            Voir les{" "}
            <Link href="/tarifs" className="font-semibold text-[#1d4ed8] hover:underline">
              tarifs BeWork
            </Link>{" "}
            et notre{" "}
            <Link href="/notre-facon-de-travailler" className="font-semibold text-[#1d4ed8] hover:underline">
              méthode de travail
            </Link>
            .
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section className="border-t border-slate-200/80 bg-[#1e3a5f] px-4 py-12 text-white sm:px-6 md:py-16 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">
            Vous gérez plusieurs opérations immobilières ? BeWork peut vous faire gagner du temps.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-blue-100">
            Parlons de vos opérations, de vos points bloquants et des modules utiles : suivi documentaire, remontées
            terrain et reporting dans une plateforme dédiée.
          </p>
          <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            <CalendlyBookingLink
              trackLocation="promoteurs-cta-final"
              className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-lg bg-white px-6 text-base font-semibold text-[#1e3a5f] shadow-sm hover:bg-slate-100 sm:w-auto"
            >
              Demander un échange
            </CalendlyBookingLink>
            <Link
              href="/contact"
              className="inline-flex min-h-[3rem] w-full items-center justify-center rounded-lg border border-white/30 px-6 text-base font-semibold text-white hover:bg-white/10 sm:w-auto"
            >
              Nous écrire
            </Link>
          </div>
        </div>
      </section>

      {/* Maillage interne */}
      <section className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-site">
          <SeoInternalLinks path={PAGE_PATH} />
        </div>
      </section>
    </main>
  );
}
