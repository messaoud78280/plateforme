import Link from "next/link";
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
    <section
      id="tarifs"
      className="relative scroll-mt-24 bg-white px-6 py-14 md:py-20 lg:py-24"
      style={{ scrollMarginTop: "6rem" }}
      aria-labelledby="home-pricing-heading"
    >
      <div className="container-site">
        <header className="mx-auto max-w-2xl text-center">
          <p className="font-heading text-xs font-bold uppercase tracking-[0.2em] text-[#1d4ed8] md:text-sm">
            Tarification
          </p>
          <h2
            id="home-pricing-heading"
            className="mt-2 text-balance text-[1.75rem] font-bold leading-tight tracking-tight text-[#0f172a] md:text-[2.125rem]"
          >
            Une plateforme dimensionnée selon votre entreprise
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-700 md:text-[1.05rem]">
            Le tarif dépend du nombre d&apos;utilisateurs, des modules, du niveau de personnalisation, des usages IA, des
            intégrations et du niveau d&apos;accompagnement souhaité.
          </p>
        </header>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-2">
          <article className="rounded-2xl border-2 border-[#1d4ed8]/25 bg-[#eff6ff]/40 p-6 md:p-8">
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

          <article className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-6 md:p-8">
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

        <p className="mx-auto mt-8 max-w-3xl rounded-xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-center text-sm leading-relaxed text-slate-800">
          Votre abonnement permet de maintenir, sécuriser et faire évoluer votre plateforme. Les adaptations courantes
          peuvent être intégrées selon votre formule. Les développements spécifiques importants font l&apos;objet d&apos;un
          cadrage et d&apos;une proposition distincte.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/contact#formulaire"
            className="inline-flex min-h-[3rem] items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-base font-semibold text-white shadow-md transition hover:bg-[#1e40af]"
            {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "home-pricing-study")}
          >
            Demander une étude personnalisée
          </Link>
          <Link
            href="/tarifs"
            className="inline-flex min-h-[3rem] items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-7 text-base font-semibold text-slate-800 transition hover:border-[#1d4ed8]/30 hover:bg-[#f8fafc]"
            {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_TARIFS, "home-pricing-method")}
          >
            Voir la méthode de tarification
          </Link>
        </div>
      </div>
    </section>
  );
}
