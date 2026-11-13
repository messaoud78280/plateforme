import Image from "next/image";
import Link from "next/link";
import { BTP_CTA_PRIMARY } from "@/lib/bework-btp-services";

type Props = {
  eyebrow?: string;
  title: string;
  subtitle: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  note?: string;
  imageSrc?: string;
  imageAlt?: string;
  showUiPreview?: boolean;
};

export function BtpPageHero({
  eyebrow = "BEWORK",
  title,
  subtitle,
  primaryHref = BTP_CTA_PRIMARY.href,
  primaryLabel = BTP_CTA_PRIMARY.label,
  secondaryHref,
  secondaryLabel,
  note,
  imageSrc,
  imageAlt = "Conducteur de travaux sur un chantier BTP",
  showUiPreview = false,
}: Props) {
  const hasVisual = Boolean(imageSrc);

  return (
    <section className="bw-btp-hero">
      <div
        className={
          hasVisual
            ? "bw-btp-container-wide bw-btp-hero-split"
            : "bw-btp-container py-12 sm:py-16 md:py-20"
        }
      >
        <div className={hasVisual ? "bw-btp-hero-copy" : undefined}>
          <p className="bw-btp-eyebrow">{eyebrow}</p>
          <h1 className="mt-3 font-bold tracking-tight">{title}</h1>
          <p className="bw-btp-lead mt-5">{subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={primaryHref} className="bw-btp-btn bw-btp-btn-primary">
              {primaryLabel}
            </Link>
            {secondaryHref && secondaryLabel ? (
              <Link href={secondaryHref} className="bw-btp-btn bw-btp-btn-secondary">
                {secondaryLabel}
              </Link>
            ) : null}
          </div>
          {note ? (
            <p className="mt-5 text-base text-[var(--btp-muted)]">{note}</p>
          ) : null}
        </div>

        {hasVisual && imageSrc ? (
          <div className="bw-btp-hero-visual">
            <div className="bw-btp-hero-photo">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                priority
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
            </div>
            {showUiPreview ? (
              <aside className="bw-btp-hero-ui" aria-hidden>
                <p className="bw-btp-hero-ui-label">Suivi chantier — aperçu interne</p>
                <div className="bw-btp-hero-ui-row">
                  <span>Avancement</span>
                  <strong>72 %</strong>
                </div>
                <div className="bw-btp-hero-ui-row">
                  <span>Actions ouvertes</span>
                  <strong>5</strong>
                </div>
                <div className="bw-btp-hero-ui-row">
                  <span>Points bloquants</span>
                  <strong>1</strong>
                </div>
              </aside>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
