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
};

export function BtpPageHero({
  eyebrow = "BEWORK",
  title,
  subtitle,
  primaryHref = BTP_CTA_PRIMARY.href,
  primaryLabel = BTP_CTA_PRIMARY.label,
  secondaryHref,
  secondaryLabel,
}: Props) {
  return (
    <section className="bw-btp-hero">
      <div className="bw-btp-container py-12 sm:py-16 md:py-20">
        <p className="bw-btp-eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl font-bold tracking-tight">{title}</h1>
        <p className="bw-btp-lead mt-5 max-w-3xl">{subtitle}</p>
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
      </div>
    </section>
  );
}
