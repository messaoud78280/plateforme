"use client";

import Image from "next/image";
import { useState } from "react";
import { QUALIOPI_CERTIFICATION } from "@/lib/formation-organism";
import styles from "./QualiopiMark.module.css";

type Props = {
  /** Compact = footer / capsule ; card = bloc institutionnel ; header = sous le logo BeWork. */
  variant?: "compact" | "card" | "inline" | "header";
  className?: string;
  showCategoryMention?: boolean;
};

const LOGO_SIZE = {
  card: { width: 220, height: 109 },
  compact: { width: 148, height: 74 },
  inline: { width: 132, height: 66 },
  header: { width: 118, height: 59 },
} as const;

/**
 * Signature Qualiopi conforme : logo officiel si fourni, sinon texte.
 * Ne fabrique jamais un faux symbole Qualiopi.
 */
export function QualiopiMark({
  variant = "compact",
  className,
  showCategoryMention = true,
}: Props) {
  const [failed, setFailed] = useState(false);
  const size = LOGO_SIZE[variant];

  return (
    <div
      className={[styles.root, styles[variant], className].filter(Boolean).join(" ")}
    >
      {!failed ? (
        <Image
          src={QUALIOPI_CERTIFICATION.logoHref}
          alt={QUALIOPI_CERTIFICATION.logoAlt}
          width={size.width}
          height={size.height}
          className={styles.logo}
          onError={() => setFailed(true)}
          priority={variant === "card"}
        />
      ) : (
        <p className={styles.textMark} aria-label="Certification Qualiopi">
          <span className={styles.textBrand}>Qualiopi</span>
          <span className={styles.textSub}>Processus certifié</span>
        </p>
      )}
      {showCategoryMention ? (
        <p className={styles.mention}>{QUALIOPI_CERTIFICATION.categoryMention}</p>
      ) : null}
    </div>
  );
}
