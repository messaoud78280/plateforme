import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";

/** Bannière CTA premium — réservation d’appel, même courbe grise que la section crédibilité */
export function HomeCallCtaBanner() {
  return (
    <section
      id="reserver-appel"
      className="relative scroll-mt-28 overflow-hidden px-6 pb-14 pt-6 md:scroll-mt-32 md:pb-16 md:pt-10"
      aria-labelledby="cta-appel-heading"
    >
      {/* Courbe grise — alignée sur HomeCredibilitySection */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-0 w-[min(38%,18rem)] rounded-l-[88px] bg-gradient-to-l from-slate-200/30 via-slate-100/15 to-transparent opacity-[0.42] md:w-[min(36%,22rem)] md:rounded-l-[110px] md:opacity-35"
      />

      <div className="relative z-[1] mx-auto w-full max-w-6xl">
        <div className="flex flex-col items-stretch gap-5 rounded-2xl border border-slate-200/90 bg-white px-5 py-5 shadow-[0_10px_40px_-14px_rgba(15,23,42,0.1)] ring-1 ring-slate-100/85 md:min-h-[7.25rem] md:flex-row md:items-center md:justify-between md:gap-10 md:px-8 md:py-5 lg:min-h-[7.75rem] lg:py-6">
          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[#1d4ed8] ring-1 ring-blue-100/90 md:h-12 md:w-12"
              aria-hidden
            >
              <IconPhone className="h-[21px] w-[21px] md:h-[22px] md:w-[22px]" />
            </span>
            <div className="min-w-0">
              <h3
                id="cta-appel-heading"
                className="font-sans text-[17px] font-bold leading-snug tracking-tight text-[#0f172a] md:text-lg lg:text-xl"
              >
                Besoin d&apos;en parler ?
              </h3>
              <p className="mt-1 text-sm leading-snug text-slate-600 md:text-[15px] md:leading-snug">
                Réservez un appel avec un expert BeWork.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 sm:justify-end">
            <CalendlyBookingLink
              trackLocation="home-cta-banner"
              className="inline-flex h-12 min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl border border-[#2563eb]/70 bg-gradient-to-b from-[#3b82f6] via-[#2563eb] to-[#1d4ed8] px-6 text-base font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_4px_20px_rgba(29,78,216,0.32)] transition hover:border-[#3b82f6] hover:from-[#2563eb] hover:via-[#1d4ed8] hover:to-[#1e40af] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_6px_24px_rgba(29,78,216,0.38)] active:translate-y-px md:w-auto md:px-8"
            >
              <IconCalendar className="h-[18px] w-[18px] shrink-0 opacity-95" aria-hidden />
              Réserver un appel
            </CalendlyBookingLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function IconPhone({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.65}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="18" height="16" x="3" y="5" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
