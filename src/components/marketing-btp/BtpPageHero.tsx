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
    <section className="relative overflow-hidden bg-[var(--btp-night)] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 80% 20%, rgba(197,155,88,0.22), transparent 55%), radial-gradient(ellipse 50% 50% at 10% 80%, rgba(41,70,91,0.9), transparent 60%)",
        }}
        aria-hidden
      />
      <div className="bw-btp-container relative py-14 sm:py-18 md:py-22">
        <p className="bw-btp-eyebrow text-[var(--btp-copper)]">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          {subtitle}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={primaryHref} className="bw-btp-btn bw-btp-btn-copper">
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
