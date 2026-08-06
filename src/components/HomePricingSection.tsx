import Link from "next/link";
import { HomeSectionHeader } from "@/components/home/HomeSectionHeader";
import {
  HOME_BG_MUTED,
  HOME_BTN_GROUP,
  HOME_BTN_PRIMARY,
  HOME_BTN_SECONDARY,
  HOME_CARD_SOFT,
  HOME_CONTENT,
  HOME_SECTION,
} from "@/components/home/homeSectionStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const SETUP = [
  "Diagnostic et cadrage fonctionnel",
  "Sélection et configuration des modules",
  "Rôles, permissions et workflows",
  "Outils IA, tests, formation et déploiement",
] as const;

const SUBSCRIPTION = [
  "Accès, hébergement et sauvegardes",
  "Maintenance corrective et mises à jour",
  "Sécurité et support",
  "Ajustements de configuration selon formule",
  "Amélioration progressive et nouveaux modules selon l’offre",
] as const;

/**
 * Mise en place + abonnement — sans prix publics.
 * Distingue évolutions courantes vs développements spécifiques.
 */
export function HomePricingSection() {
  return (
    <section id="tarifs" className={`${HOME_SECTION} ${HOME_BG_MUTED}`} aria-labelledby="home-pricing-heading">
      <div className="container-site">
        <HomeSectionHeader
          id="home-pricing-heading"
          eyebrow="Tarification"
          title="Une plateforme dimensionnée selon votre entreprise"
          lead="Le tarif dépend du nombre d'utilisateurs, des modules, du niveau de personnalisation, des usages IA, des intégrations et du niveau d'accompagnement souhaité."
        />

        <div className={`${HOME_CONTENT} mx-auto grid max-w-5xl gap-6 md:grid-cols-2`}>
          <article className={`${HOME_CARD_SOFT} border-[#1d4ed8]/25 bg-white p-6 md:p-8`}>
            <h3 className="text-lg font-bold text-[#0f172a]">Mise en place initiale</h3>
            <p className="mt-2 text-sm text-slate-600">
              Phase projet : du diagnostic au déploiement. Tarif selon le périmètre.
            </p>
            <ul className="mt-4 space-y-2">
              {SETUP.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-800">
                  <span className="text-[#1d4ed8]" aria-hidden>
                    •
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>

          <article className={`${HOME_CARD_SOFT} p-6 md:p-8`}>
            <h3 className="text-lg font-bold text-[#0f172a]">Abonnement mensuel</h3>
            <p className="mt-2 text-sm text-slate-600">
              Après déploiement : accès, maintenance, sécurité et évolution continue.
            </p>
            <ul className="mt-4 space-y-2">
              {SUBSCRIPTION.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-slate-800">
                  <span className="text-[#1d4ed8]" aria-hidden>
                    •
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </div>

        <p className="mx-auto mt-10 max-w-3xl rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-center text-sm leading-relaxed text-slate-800">
          Votre abonnement permet de maintenir, sécuriser et faire évoluer votre plateforme. Les adaptations courantes
          peuvent être intégrées selon votre formule. Les développements spécifiques importants font l&apos;objet
          d&apos;un cadrage et d&apos;une proposition distincte.
        </p>

        <div className={`mt-8 ${HOME_BTN_GROUP} justify-center`}>
          <Link
            href="/contact#formulaire"
            className={HOME_BTN_PRIMARY}
            {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-pricing-study")}
          >
            Demander une étude
          </Link>
          <Link
            href="/tarifs"
            className={HOME_BTN_SECONDARY}
            {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_TARIFS, "home-pricing-method")}
          >
            Voir la tarification
          </Link>
        </div>
      </div>
    </section>
  );
}
