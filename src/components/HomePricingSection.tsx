import Link from "next/link";
import type { PublicPlanKey } from "@/lib/subscription-plans";
import {
  CREDIT_MINUTES,
  PLAN_KEYS,
  SUBSCRIPTION_PLANS,
  creditsToDisplayHours,
  formatPriceLabelFr,
} from "@/lib/subscription-plans";

const PLAN_CARD_COPY: Record<
  PublicPlanKey,
  {
    badge: string | null;
    usage: string;
    included: readonly [string, string, string];
  }
> = {
  DECOUVERTE: {
    badge: null,
    usage: "Pour tenir vos dossiers chantier et éviter les oublis.",
    included: ["Devis & relances", "Dossiers chantier", "Suivi simple des demandes"],
  },
  STANDARD: {
    badge: "LE PLUS CHOISI",
    usage: "Pour ne plus perdre d’opportunités et signer plus de chantiers.",
    included: ["Relances régulières", "Suivi complet des devis", "Coordination quotidienne"],
  },
  PREMIUM: {
    badge: null,
    usage: "Pour un relais travaux à forte capacité, sans recruter.",
    included: ["Priorité & urgences", "Suivi complet des dossiers", "Coordination élargie"],
  },
};

/** Coût horaire indicatif (nombre uniquement), pour affichage « ≈ x €/h » */
function hourlyEuroEstimate(priceLabel: string, hoursApprox: number): string {
  const price = Number(String(priceLabel).replace(/\s/g, ""));
  if (!Number.isFinite(price) || hoursApprox <= 0) return "—";
  const perHour = price / hoursApprox;
  return perHour.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function HomePricingSection() {
  const lowFr = formatPriceLabelFr(SUBSCRIPTION_PLANS.DECOUVERTE.priceLabel);
  const highFr = formatPriceLabelFr(SUBSCRIPTION_PLANS.PREMIUM.priceLabel);

  return (
    <section
      id="tarifs"
      className="relative scroll-mt-24 bg-transparent pb-14 pt-10 md:scroll-mt-28 md:pb-16 md:pt-12"
      style={{ scrollMarginTop: "6rem" }}
      aria-labelledby="home-pricing-heading"
    >
      <div className="container-site relative z-[1]">
        {/* En-tête — compact */}
        <header className="mx-auto mb-7 max-w-2xl text-center md:mb-8">
          <p className="font-heading text-[12px] font-semibold uppercase tracking-[0.2em] text-[#1d4ed8] md:text-[13px]">Tarifs</p>
          <h2
            id="home-pricing-heading"
            className="mt-2 text-balance text-[1.625rem] font-bold leading-tight tracking-tight text-[#0f172a] md:text-[2rem]"
          >
            Des tarifs clairs. <span className="text-[#1d4ed8]">Sans surprise.</span>
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-slate-600 md:text-[15px]">
            Un relais travaux sans recrutement, avec un cadre clair et des forfaits adaptés au volume de demandes.
          </p>
        </header>

        {/* Repère crédit — ligne compacte */}
        <div className="mx-auto mb-7 max-w-lg rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm shadow-slate-900/[0.03] md:mb-8 md:flex md:items-center md:justify-center md:gap-3 md:px-5 md:py-3">
          <span
            className="mx-auto mb-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eff6ff] text-[#1d4ed8] md:mx-0 md:mb-0"
            aria-hidden
          >
            <IconClock className="h-[16px] w-[16px]" />
          </span>
          <div className="text-center md:text-left">
            <p className="text-[14px] font-semibold leading-tight text-[#0f172a] md:text-[15px]">
              1 crédit = {CREDIT_MINUTES} minutes
            </p>
            <p className="mt-0.5 text-[12px] leading-snug text-slate-500 md:text-[13px]">
              Devis · Relance · Appel · Mail · Suivi chantier
            </p>
          </div>
        </div>

        {/* Cartes — grille égale, CTA en bas */}
        <div className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3 md:items-stretch md:gap-6">
          {PLAN_KEYS.map((planKey) => {
            const plan = SUBSCRIPTION_PLANS[planKey];
            const copy = PLAN_CARD_COPY[planKey];
            const featured = planKey === "STANDARD";
            const href = `/dashboard/abonnement/souscrire?plan=${plan.planKey}`;
            const hoursApprox = creditsToDisplayHours(plan.actionsIncluded);
            const creditsApprox = plan.actionsIncluded;
            const hourlyNum = hourlyEuroEstimate(plan.priceLabel, hoursApprox);

            const cardBase =
              "relative flex h-full flex-col overflow-hidden rounded-2xl p-4 transition-[box-shadow,transform,border-color] duration-300 motion-safe:md:group-hover:-translate-y-0.5 motion-safe:md:group-hover:shadow-lg motion-reduce:transition-none";
            const cardFeatured = `${cardBase} border-2 border-[#2563eb] bg-gradient-to-b from-white via-[#f8fbff] to-[#f0f7ff] shadow-[0_10px_40px_-14px_rgba(37,99,235,0.35)] ring-1 ring-blue-200/40`;
            const cardDefault = `${cardBase} border border-slate-200/90 bg-white shadow-[0_2px_20px_-8px_rgba(15,23,42,0.1)] hover:border-slate-300/90 hover:shadow-[0_12px_36px_-12px_rgba(15,23,42,0.12)]`;

            return (
              <article key={planKey} className={`group ${featured ? cardFeatured : cardDefault}`}>
                {featured ? (
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#1d4ed8] via-[#3b82f6] to-[#60a5fa]"
                    aria-hidden
                  />
                ) : null}

                <div className="mb-2 flex min-h-[1.375rem] items-center justify-center">
                  {copy.badge ? (
                    <span className="inline-flex rounded-full bg-gradient-to-r from-[#1d4ed8] to-[#2563eb] px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-sm shadow-blue-900/15">
                      {copy.badge}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-sm ${featured ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-blue-900/20" : "bg-[#eff6ff] text-[#1d4ed8] ring-1 ring-blue-100/90"}`}
                    aria-hidden
                  >
                    {planKey === "DECOUVERTE" ? (
                      <IconLayers className="h-[18px] w-[18px]" />
                    ) : planKey === "STANDARD" ? (
                      <IconTrending className="h-[18px] w-[18px]" />
                    ) : (
                      <IconCrown className="h-[18px] w-[18px]" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1 text-left">
                    <h3 className="text-base font-bold leading-tight tracking-tight text-[#0f172a] md:text-[1.05rem]">{plan.name}</h3>
                    <p className="mt-1 tabular-nums text-[1.5rem] font-bold leading-none tracking-tight text-[#1d4ed8] md:text-[1.75rem]">
                      {formatPriceLabelFr(plan.priceLabel)} €
                    </p>
                    <span className="mt-0.5 inline-block text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">TTC / mois</span>
                  </div>
                </div>

                <div
                  className={`mt-2.5 rounded-lg px-2.5 py-1.5 ${featured ? "bg-white/80 ring-1 ring-blue-100/80" : "bg-slate-50/95 ring-1 ring-slate-100"}`}
                >
                  <ul className="divide-y divide-slate-200/70 text-[11px] leading-tight text-slate-600 md:text-[12px]" aria-label="Repères de volume inclus">
                    <li className="flex justify-between gap-2 py-1 tabular-nums first:pt-0 last:pb-0">
                      <span className="text-slate-500">Heures estim.</span>
                      <span className="font-semibold text-slate-900">≈ {hoursApprox}&nbsp;h incluses</span>
                    </li>
                    <li className="flex justify-between gap-2 py-1 tabular-nums">
                      <span className="text-slate-500">Crédits estim.</span>
                      <span className="font-semibold text-slate-900">≈ {creditsApprox}</span>
                    </li>
                    <li className="flex justify-between gap-2 py-1 tabular-nums">
                      <span className="text-slate-500">Coût / h estim.</span>
                      <span className="font-semibold text-slate-900">≈ {hourlyNum}&nbsp;€/h</span>
                    </li>
                  </ul>
                </div>

                <p className="mt-2.5 text-left text-[11px] font-medium leading-snug text-slate-700 md:text-[12px]">{copy.usage}</p>

                <div className="mt-2.5 border-t border-dashed border-slate-200/90 pt-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Inclus</p>
                  <ul className="mt-1 space-y-1 text-left text-[11px] leading-snug text-slate-600 md:text-[12px]">
                    {copy.included.map((line) => (
                      <li key={line} className="flex gap-2">
                        <span className="mt-[0.35em] h-1 w-1 shrink-0 rounded-full bg-[#2563eb]" aria-hidden />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto pt-3">
                  <Link
                    href={href}
                    className={
                      featured
                        ? "inline-flex min-h-[2.375rem] w-full items-center justify-center rounded-lg bg-[#1d4ed8] px-3 py-2 text-[13px] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] hover:shadow-lg hover:shadow-[#1d4ed8]/30"
                        : "inline-flex min-h-[2.375rem] w-full items-center justify-center rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-[#0f172a] shadow-sm transition hover:border-blue-200 hover:bg-slate-50/90 hover:shadow-md"
                    }
                  >
                    Choisir cette offre
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-7 max-w-3xl text-center text-[12px] font-medium leading-relaxed text-slate-600 md:mt-8 md:text-[13px]">
          Sans recrutement <span className="text-slate-300">&nbsp;·&nbsp;</span> Cadre clair{" "}
          <span className="text-slate-300">&nbsp;·&nbsp;</span> Dossiers chantier suivis
        </p>

        <p className="mx-auto mt-4 max-w-2xl text-center text-[12px] leading-relaxed text-slate-600 md:text-[13px]">
          Besoin d’un repère de coût complet ?{" "}
          <Link href="/tarifs" className="font-semibold text-[#1d4ed8] hover:text-[#1e40af]">
            Voir le détail des forfaits
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLayers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M12 4 4 9l8 5 8-5-8-5Z" strokeLinejoin="round" />
      <path d="M4 13 12 18l8-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m4 17 8 5 8-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrending({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M4 17V7M10 17V4M16 17v-5M22 17V9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCrown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path d="M4 9.5 8 17h8l4-7.5-3 5-5-10-5 10-3-5Z" strokeLinejoin="round" />
      <path d="M8 17v3h8v-3M8 21h8" strokeLinecap="round" />
    </svg>
  );
}
