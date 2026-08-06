import Link from "next/link";
import {
  HOME_BG_MUTED,
  HOME_BTN_PRIMARY,
  HOME_CARD_SOFT,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const DOMAINS = [
  "Diagnostic des besoins",
  "Conception fonctionnelle",
  "Paramétrage et personnalisation",
  "Formation des utilisateurs",
  "Support et maintenance",
  "Évolution continue",
  "Amélioration des outils IA",
  "Intégrations avec vos outils",
] as const;

/**
 * Partenaire technologique — remplace la section « assistants travaux ».
 * BeWork n’exécute pas les missions quotidiennes du client.
 */
export function HomeTechPartner() {
  return (
    <section id="partenaire" className={`${HOME_SECTION} ${HOME_BG_MUTED}`} aria-labelledby="partner-heading">
      <div className="container-site">
        <div className={`mx-auto max-w-3xl ${HOME_CARD_SOFT} p-8 md:p-10`}>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1d4ed8]">Rôle de BeWork</p>
          <h2
            id="partner-heading"
            className="mt-3 font-display text-[1.875rem] font-extrabold tracking-tight text-[#0f172a] md:text-[2.25rem]"
          >
            Un partenaire technologique spécialisé dans le BTP
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-600 md:text-lg">
            BeWork vous accompagne dans la conception, le déploiement et l&apos;évolution de votre plateforme. Nos
            interventions concernent le fonctionnement de la solution, sa configuration, ses outils IA, sa sécurité et
            son adaptation à votre organisation — pas l&apos;exécution de vos missions quotidiennes.
          </p>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {DOMAINS.map((d) => (
              <li key={d} className="flex gap-2 text-sm text-slate-800">
                <span className="text-[#1d4ed8]" aria-hidden>
                  ✓
                </span>
                {d}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-slate-600">
            BeWork ne se substitue pas à vos salariés dans l&apos;analyse finale, la conduite des travaux ou les
            décisions contractuelles.
          </p>
          <div className="mt-7 w-full sm:w-auto">
            <Link
              href="/contact#formulaire"
              className={HOME_BTN_PRIMARY}
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-tech-partner")}
            >
              Parler de votre projet
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
