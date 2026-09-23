import Link from "next/link";
import { QUALIOPI_COPY } from "@/lib/formation-organism";
import { QualiopiMark } from "./QualiopiMark";
import styles from "./QualiopiInlineNote.module.css";

/** Note courte réutilisable (formation, tarifs, contact). */
export function QualiopiInlineNote({
  className,
  showLogo = true,
}: {
  className?: string;
  showLogo?: boolean;
}) {
  return (
    <aside
      className={[styles.note, className].filter(Boolean).join(" ")}
      aria-label="Certification Qualiopi"
    >
      {showLogo ? <QualiopiMark variant="inline" showCategoryMention={false} /> : null}
      <div>
        <p className={styles.text}>{QUALIOPI_COPY.shortWithCategory}</p>
        <Link href={QUALIOPI_COPY.learnMoreHref} className={styles.link}>
          {QUALIOPI_COPY.learnMoreLabel} →
        </Link>
      </div>
    </aside>
  );
}
