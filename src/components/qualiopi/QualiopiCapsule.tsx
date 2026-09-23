import Link from "next/link";
import { QUALIOPI_COPY } from "@/lib/formation-organism";
import { QualiopiMark } from "./QualiopiMark";
import styles from "./QualiopiCapsule.module.css";

/** Signature institutionnelle légère — hero / zones CTA. */
export function QualiopiCapsule({ className }: { className?: string }) {
  return (
    <aside
      className={[styles.capsule, className].filter(Boolean).join(" ")}
      aria-label="Organisme de formation"
    >
      <QualiopiMark variant="compact" showCategoryMention={false} />
      <div className={styles.copy}>
        <p className={styles.text}>{QUALIOPI_COPY.shortWithCategory}</p>
        <Link href={QUALIOPI_COPY.learnMoreHref} className={styles.link}>
          {QUALIOPI_COPY.learnMoreLabel}
          <span aria-hidden> →</span>
        </Link>
      </div>
    </aside>
  );
}
