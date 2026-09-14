import Link from "next/link";
import {
  BEWORK_EXTENSION_PRICE_EUR,
  TRAINING_OFFERS,
  type TrainingOffer,
  type TrainingOfferId,
} from "@/lib/bework-formation";
import { PLAUSIBLE_EVENTS, plausibleTrackProps } from "@/lib/plausible";
import styles from "./TrainingOffersSection.module.css";

type Props = {
  /** Ancre section (défaut #tarif). */
  id?: string;
  /** Source analytics Plausible. */
  analyticsPrefix?: string;
  /** Lien CTA cartes (défaut /contact#participer). */
  ctaHref?: string;
  /** Niveau du titre principal selon le contexte de page. */
  headingLevel?: "h1" | "h2";
};

function withOfferSelection(href: string, offerId: TrainingOfferId): string {
  const [pathAndQuery, hash] = href.split("#");
  const separator = pathAndQuery?.includes("?") ? "&" : "?";
  return `${pathAndQuery ?? href}${separator}parcours=${offerId}${hash ? `#${hash}` : ""}`;
}

function OfferCard({
  offer,
  featured,
  href,
  analyticsPrefix,
  headingLevel,
}: {
  offer: TrainingOffer;
  featured?: boolean;
  href: string;
  analyticsPrefix: string;
  headingLevel: "h2" | "h3";
}) {
  const offerId: TrainingOfferId = offer.id;
  const Heading = headingLevel;
  return (
    <article
      className={`${styles.card}${featured ? ` ${styles.cardFeatured}` : ""}`}
      aria-labelledby={`offer-${offerId}-title`}
    >
      {"badge" in offer && offer.badge ? (
        <p className={styles.badge}>{offer.badge}</p>
      ) : null}

      <p className={styles.cardLabel}>{offer.label}</p>
      <Heading id={`offer-${offerId}-title`} className={styles.cardTitle}>
        {offer.title}
      </Heading>

      <div className={styles.meta}>
        <p className={styles.hours}>
          <span className={styles.hoursNum}>{offer.hours}</span>
          <span className={styles.hoursUnit}>h</span>
        </p>
        <p className={styles.days}>
          {offer.days} {offer.days === 1 ? "journée" : "journées"}
        </p>
      </div>

      <p className={styles.price}>
        {offer.price}&nbsp;€
        <span className={styles.priceLabel}>par participant</span>
      </p>

      <p className={styles.desc}>{offer.description}</p>

      <ul className={styles.benefits}>
        {offer.benefits.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>

      <p className={styles.promise}>{offer.promise}</p>

      <Link
        href={href}
        className={featured ? styles.ctaPrimary : styles.ctaSecondary}
        {...plausibleTrackProps(
          PLAUSIBLE_EVENTS.CTA_CONTACT,
          `${analyticsPrefix}-offer-${offerId}`,
        )}
      >
        {offer.ctaLabel}
        <span aria-hidden>→</span>
      </Link>
    </article>
  );
}

/** Section parcours 7 h / 14 h — homepage & /formation. */
export function TrainingOffersSection({
  id = "tarif",
  analyticsPrefix = "tarif",
  ctaHref = "/contact#participer",
  headingLevel = "h2",
}: Props) {
  const Heading = headingLevel;
  const cardHeadingLevel = headingLevel === "h1" ? "h2" : "h3";

  return (
    <section id={id} className={styles.section} aria-labelledby="parcours-heading">
      <div className={styles.haloA} aria-hidden />
      <div className={styles.haloB} aria-hidden />

      <div className={styles.shell}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>Choisissez votre parcours</p>
          <Heading id="parcours-heading" className={styles.title}>
            <span className={styles.titleLine}>Un même point de départ.</span>
            <span className={`${styles.titleLine} ${styles.titleAccent}`}>
              À vous de choisir jusqu’où aller.
            </span>
          </Heading>
          <p className={styles.lead}>
            Commencez tous par la même première journée, puis poursuivez si vous souhaitez
            approfondir et construire davantage.
          </p>
        </header>

        <div className={styles.grid}>
          <OfferCard
            offer={TRAINING_OFFERS.essential}
            href={withOfferSelection(ctaHref, "essential")}
            analyticsPrefix={analyticsPrefix}
            headingLevel={cardHeadingLevel}
          />
          <OfferCard
            offer={TRAINING_OFFERS.complete}
            featured
            href={withOfferSelection(ctaHref, "complete")}
            analyticsPrefix={analyticsPrefix}
            headingLevel={cardHeadingLevel}
          />
        </div>

        <aside className={styles.reassure} aria-labelledby="prolong-heading">
          <h3 id="prolong-heading" className={styles.reassureTitle}>
            Pas encore sûr de vouloir faire 2 jours&nbsp;?
          </h3>
          <p className={styles.reassureText}>
            Commencez par la première journée à {TRAINING_OFFERS.essential.price}&nbsp;€.
            Si vous souhaitez continuer, ajoutez simplement le deuxième jour pour{" "}
            {BEWORK_EXTENSION_PRICE_EUR}&nbsp;€ supplémentaires.
          </p>
          <p className={styles.reassureNote}>Vous ne perdez rien à commencer par 1 journée.</p>
        </aside>
      </div>
    </section>
  );
}
