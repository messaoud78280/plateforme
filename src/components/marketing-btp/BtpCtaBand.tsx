import Link from "next/link";
import { BTP_CTA_PRIMARY } from "@/lib/bework-btp-services";

type Props = {
  title?: string;
  subtitle?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export function BtpCtaBand({
  title = "Vous avez un chantier à organiser ou à piloter ?",
  subtitle = "Décrivez-nous votre opération. Nous étudierons votre besoin et vous proposerons une intervention adaptée.",
  ctaHref = BTP_CTA_PRIMARY.href,
  ctaLabel = "Demander un devis personnalisé",
}: Props) {
  return (
    <section className="bw-btp-section bw-btp-section-soft" aria-labelledby="btp-cta-band-title">
      <div className="bw-btp-container text-center">
        <h2 id="btp-cta-band-title" className="font-bold tracking-tight">
          {title}
        </h2>
        <p className="bw-btp-lead mx-auto mt-4 max-w-3xl">{subtitle}</p>
        <div className="mt-8">
          <Link href={ctaHref} className="bw-btp-btn bw-btp-btn-primary">
            {ctaLabel}
            <span aria-hidden>→</span>
          </Link>
        </div>
        <p className="mt-5 text-sm text-[var(--btp-muted)]">
          Interventions ponctuelles ou suivies · Marchés publics et privés · Prestations sur devis
        </p>
      </div>
    </section>
  );
}
