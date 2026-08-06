import Link from "next/link";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import {
  HOME_BG_MUTED,
  HOME_BTN_PRIMARY,
  HOME_CARD_SOFT,
  HOME_CONTENT,
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
        <HomeSectionHeader
          id="partner-heading"
          eyebrow="Rôle de BeWork"
          title="Un partenaire technologique spécialisé dans le BTP"
          lead="BeWork vous accompagne dans la conception, le déploiement et l'évolution de votre plateforme. Nos interventions concernent le fonctionnement de la solution, sa configuration, ses outils IA, sa sécurité et son adaptation à votre organisation — pas l'exécution de vos missions quotidiennes."
        />

        <div className={`${HOME_CONTENT} mx-auto max-w-3xl`}>
          <div className={`${HOME_CARD_SOFT} p-5 sm:p-8 md:p-10`}>
            <ul className="grid gap-2.5 sm:grid-cols-2">
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
            <div className="mt-7 flex justify-center">
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
      </div>
    </section>
  );
}
