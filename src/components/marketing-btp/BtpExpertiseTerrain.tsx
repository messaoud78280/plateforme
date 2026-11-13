import Image from "next/image";
import Link from "next/link";
import {
  BTP_FOUNDER_COMPETENCES,
  BTP_TERRAIN_CONSTRAINTS,
} from "@/lib/bework-btp-services";

type Props = {
  compact?: boolean;
};

export function BtpExpertiseTerrain({ compact = false }: Props) {
  const competences = compact
    ? BTP_FOUNDER_COMPETENCES.slice(0, 10)
    : BTP_FOUNDER_COMPETENCES;

  return (
    <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="expertise-terrain-title">
      <div className="bw-btp-container-wide grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--btp-border)] bg-[var(--btp-soft)] lg:aspect-[5/4]">
          <Image
            src="/marketing/btp-hero-chantier.jpg"
            alt="Professionnel BTP consultant des plans sur un chantier — illustration d’ambiance, non présentée comme référence client BeWork"
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 640px"
          />
        </div>
        <div>
          <p className="bw-btp-eyebrow">Expertise terrain</p>
          <h2 id="expertise-terrain-title" className="mt-2 font-bold">
            Une expertise construite sur le terrain.
          </h2>
          <p className="bw-btp-lead mt-4">
            BeWork repose sur une expérience professionnelle de plus de 20 ans
            dans les métiers du BTP — conduite de chantier, VRD, gros œuvre,
            réseaux, marchés et organisation opérationnelle. Cette expérience
            personnelle du fondateur nourrit notre approche ; elle ne se confond
            pas automatiquement avec le portefeuille contractuel de l’entité
            BeWork.
          </p>
          <p className="mt-4 text-base text-[var(--btp-muted)]">
            Nous connaissons les contraintes réelles du terrain :
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {BTP_TERRAIN_CONSTRAINTS.map((item) => (
              <li key={item} className="flex gap-2 text-base text-[var(--btp-muted)]">
                <span className="text-[var(--btp-copper)]" aria-hidden>
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
          <h3 className="mt-8 text-xl font-bold">Domaines de compétence</h3>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {competences.map((item) => (
              <li key={item} className="flex gap-2 text-base text-[var(--btp-muted)]">
                <span className="text-[var(--btp-copper)]" aria-hidden>
                  •
                </span>
                {item}
              </li>
            ))}
          </ul>
          {compact ? (
            <p className="mt-3 text-base text-[var(--btp-steel)]">
              <Link href="/a-propos" className="font-semibold underline-offset-2 hover:underline">
                Voir l’ensemble des compétences →
              </Link>
            </p>
          ) : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/demande-de-devis?besoin=conducteur_travaux"
              className="bw-btp-btn bw-btp-btn-primary"
            >
              Demander un conducteur de travaux
            </Link>
            <Link href="/conduite-de-travaux" className="bw-btp-btn bw-btp-btn-secondary">
              Découvrir nos prestations
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
