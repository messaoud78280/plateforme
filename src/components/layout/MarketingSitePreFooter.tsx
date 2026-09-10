import Link from "next/link";
import { BwAtmosphere } from "@/components/home/BwAtmosphere";
import { BEWORK_FORMATION_TAGLINE, BEWORK_SESSION_PRICE_EUR } from "@/lib/bework-formation";
import { CTA_PRIMARY, CTA_SECONDARY } from "@/components/marketing/marketingCtaStyles";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";

/** Bandeau conclusion marketing — ambiance CTA. */
export function MarketingSitePreFooter() {
  return (
    <section
      className="relative z-10 isolate overflow-hidden border-t border-[rgba(45,75,130,0.08)] text-slate-900"
      aria-labelledby="prefooter-formation"
    >
      <BwAtmosphere variant="cta" />
      <div className="relative z-[1] mx-auto max-w-site px-5 py-12 sm:px-6 sm:py-14 lg:py-16">
        <div className="max-w-3xl">
          <h2
            id="prefooter-formation"
            className="font-display text-2xl font-extrabold tracking-tight text-[#0B0D12] sm:text-[1.85rem]"
          >
            Vous avez une idée&nbsp;?
            <br />
            <span className="text-[#275BE8]">Commencez par la construire.</span>
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#42526B] sm:text-[1.05rem]">
            {BEWORK_FORMATION_TAGLINE} Une journée pratique, en petit groupe —{" "}
            {BEWORK_SESSION_PRICE_EUR}&nbsp;€ la session.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/contact#participer"
              className={CTA_PRIMARY}
              {...plausibleTrackProps(PLAUSIBLE_EVENTS.CTA_CONTACT, "prefooter-participer")}
            >
              Découvrir la journée
            </Link>
            <Link href="/formation" className={CTA_SECONDARY}>
              Voir la formation
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-[rgba(45,75,130,0.10)] bg-[rgba(255,255,255,0.82)] p-6 shadow-[0_12px_40px_rgba(30,50,90,0.06)] backdrop-blur-[14px] sm:p-8">
          <h3 className="text-lg font-bold tracking-tight text-[#0B0D12] sm:text-xl">
            Voyez d&apos;abord ce qu&apos;il est possible de créer
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-[#42526B]">
            Messagerie, agenda, CRM, réservation… des démonstrations interactives, données fictives.
          </p>
          <Link
            href="/demonstrations"
            className="mt-4 inline-flex text-sm font-semibold text-[#275BE8] hover:underline"
          >
            Explorer les démonstrations →
          </Link>
        </div>
      </div>
    </section>
  );
}
