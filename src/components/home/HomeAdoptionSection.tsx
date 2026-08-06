import Link from "next/link";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import {
  HOME_BG_WHITE,
  HOME_BTN_GROUP,
  HOME_BTN_PRIMARY,
  HOME_BTN_SECONDARY,
  HOME_CARD,
  HOME_CONTENT,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const STEPS = [
  {
    title: "Configuration",
    text: "Nous adaptons les modules, les rôles et les workflows à votre organisation.",
    icon: "config" as const,
  },
  {
    title: "Formation par métier",
    text: "Chaque collaborateur apprend uniquement les fonctions utiles à son poste.",
    icon: "train" as const,
  },
  {
    title: "Déploiement progressif",
    text: "La plateforme est d’abord testée avec un groupe pilote ou sur quelques chantiers.",
    icon: "rollout" as const,
  },
  {
    title: "Suivi et amélioration",
    text: "Nous analysons les usages, simplifions les parcours et faisons évoluer la plateforme avec vos besoins.",
    icon: "improve" as const,
  },
] as const;

/**
 * Formation, déploiement et adoption — BeWork accompagne jusqu’à l’usage réel.
 * Les collaborateurs du client restent aux commandes au quotidien.
 */
export function HomeAdoptionSection() {
  return (
    <section id="adoption" className={`${HOME_SECTION} ${HOME_BG_WHITE}`} aria-labelledby="adoption-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="adoption-heading"
          eyebrow="Formation & déploiement"
          title="Une plateforme réellement adoptée par vos équipes"
          lead="BeWork vous accompagne à chaque étape : configuration de votre environnement, préparation des accès, formation des utilisateurs, lancement progressif et amélioration continue selon les retours de vos équipes."
        />

        <blockquote className={`${HOME_CONTENT} mx-auto max-w-3xl rounded-2xl border border-[#1d4ed8]/20 bg-[#eff6ff]/70 px-5 py-6 text-center sm:px-8 sm:py-8`}>
          <p className="font-display text-balance text-lg font-bold leading-snug tracking-tight text-[#0f172a] sm:text-xl md:text-[1.375rem] md:leading-snug">
            Nous ne vous livrons pas seulement une plateforme. Nous accompagnons vos équipes jusqu&apos;à son
            utilisation réelle au quotidien.
          </p>
        </blockquote>

        <ol className="mt-10 grid gap-4 sm:mt-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5" aria-label="Étapes d’adoption">
          {STEPS.map((step, i) => (
            <li key={step.title} className={`group relative ${HOME_CARD} p-5 sm:p-6`}>
              <div className="flex items-center justify-between gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#1d4ed8]/15 bg-[#eff6ff] text-[#1d4ed8] transition group-hover:bg-[#dbeafe]"
                  aria-hidden
                >
                  <StepIcon id={step.icon} />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 text-base font-bold tracking-tight text-[#0f172a]">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
              <div
                className="mt-5 h-0.5 w-10 rounded-full bg-[#1d4ed8]/30 transition group-hover:w-14 group-hover:bg-[#1d4ed8]/55"
                aria-hidden
              />
            </li>
          ))}
        </ol>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm font-medium leading-relaxed text-slate-700 sm:mt-12 sm:text-base">
          Une plateforme utile n&apos;est pas seulement bien conçue : elle doit être comprise, adoptée et utilisée
          chaque jour.
        </p>

        <div className={`mx-auto mt-7 max-w-md sm:mt-8 sm:max-w-none ${HOME_BTN_GROUP} sm:justify-center`}>
          <Link href="/#methode" className={HOME_BTN_SECONDARY}>
            Découvrir notre méthode de déploiement
          </Link>
          <Link
            href="/contact#formulaire"
            className={HOME_BTN_PRIMARY}
            {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-adoption-demo")}
          >
            <span className="sm:hidden">Demander une démo</span>
            <span className="hidden sm:inline">Demander une démonstration</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function StepIcon({ id }: { id: (typeof STEPS)[number]["icon"] }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" as const };
  switch (id) {
    case "config":
      return (
        <svg {...common} aria-hidden>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.55" />
          <path
            d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.9 5.9l1.6 1.6M16.5 16.5l1.6 1.6M5.9 18.1l1.6-1.6M16.5 7.5l1.6-1.6"
            stroke="currentColor"
            strokeWidth="1.45"
            strokeLinecap="round"
          />
        </svg>
      );
    case "train":
      return (
        <svg {...common} aria-hidden>
          <circle cx="9" cy="8" r="2.25" stroke="currentColor" strokeWidth="1.55" />
          <path
            d="M4.5 17.5c.4-2.6 2.2-4 4.5-4s4.1 1.4 4.5 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M15 7.5h4.5M17.25 5.25v4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M14.5 14.5h5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" opacity="0.7" />
        </svg>
      );
    case "rollout":
      return (
        <svg {...common} aria-hidden>
          <rect x="4" y="14" width="4" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.5" />
          <rect x="10" y="10" width="4" height="9" rx="0.8" stroke="currentColor" strokeWidth="1.5" />
          <rect x="16" y="6" width="4" height="13" rx="0.8" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "improve":
      return (
        <svg {...common} aria-hidden>
          <path
            d="M5 16.5 10 11.5 13.5 15 19 9.5"
            stroke="currentColor"
            strokeWidth="1.55"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M14.5 9.5H19v4.5" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
