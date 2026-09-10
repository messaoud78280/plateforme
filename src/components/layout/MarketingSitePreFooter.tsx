import Link from "next/link";
import { BEWORK_FORMATION_TAGLINE, BEWORK_SESSION_PRICE_EUR } from "@/lib/bework-formation";
import { CTA_PRIMARY, CTA_SECONDARY } from "@/components/marketing/marketingCtaStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

/** Bandeau clair au-dessus du footer marketing — CTA formation. */
export function MarketingSitePreFooter() {
  return (
    <section
      className="relative z-10 isolate border-t border-slate-200/80 bg-[#f9fafb] text-slate-900"
      aria-labelledby="prefooter-formation"
    >
      <div className="mx-auto max-w-site px-5 py-12 sm:px-6 sm:py-14 lg:py-16">
        <div className="max-w-3xl">
          <h2 id="prefooter-formation" className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[1.65rem]">
            Prêt à créer avec l&apos;intelligence artificielle&nbsp;?
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-[1.05rem]">
            {BEWORK_FORMATION_TAGLINE} Une journée pratique, en petit groupe — {BEWORK_SESSION_PRICE_EUR}&nbsp;€ la
            session.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact#participer"
              className={CTA_PRIMARY}
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "prefooter-participer")}
            >
              Participer
            </Link>
            <Link href="/formation" className={CTA_SECONDARY}>
              Voir la formation
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
            Voyez d&apos;abord ce qu&apos;il est possible de créer
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Explorez des démonstrations concrètes — messagerie, agenda, réservation, CRM, tableau de bord… — puis
            rejoignez une session pour apprendre la méthode.
          </p>
          <Link
            href="/demonstrations"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
          >
            Voir les démonstrations
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
