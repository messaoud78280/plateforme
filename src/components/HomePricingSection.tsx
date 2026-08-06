import Link from "next/link";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

const CRITERIA = [
  "Nombre d’utilisateurs et d’agences",
  "Modules et workflows activés",
  "Niveau de personnalisation",
  "Outils IA et accompagnement",
] as const;

/**
 * Tarification sans prix publics — méthode uniquement (réversible).
 * La grille chiffrée reste disponible dans le code / historique, non affichée ici.
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
            Une solution adaptée à votre organisation
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-slate-700 md:text-[1.05rem]">
            Le tarif dépend du nombre d&apos;utilisateurs, des modules activés, du niveau de personnalisation, des outils
            IA et de l&apos;accompagnement souhaité.
          </p>
        </header>

        <ul className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
          {CRITERIA.map((c) => (
            <li key={c} className="rounded-xl border border-slate-200 bg-[#f8fafc] px-4 py-3 text-sm font-medium text-slate-800">
              {c}
            </li>
          ))}
        </ul>

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
