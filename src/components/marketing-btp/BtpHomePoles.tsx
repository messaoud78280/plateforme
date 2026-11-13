import Image from "next/image";
import Link from "next/link";
import { BTP_HOME_POLES } from "@/lib/bework-btp-services";

export function BtpHomePoles() {
  return (
    <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="poles-title">
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Quatre pôles de compétences</p>
        <h2 id="poles-title" className="mt-2 max-w-3xl font-bold">
          Des compétences adaptées à chaque étape de vos travaux.
        </h2>
        <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
          Conducteurs de travaux, équipes TP/VRD, accompagnement technique et
          études de marchés — chaque prestation est définie et contractualisée
          sur devis.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {BTP_HOME_POLES.map((pole) => (
            <article key={pole.id} className="bw-btp-card bw-btp-card-media flex flex-col">
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-[var(--btp-soft)]">
                <Image
                  src={pole.imageSrc}
                  alt={pole.imageAlt}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="bw-btp-card-media-body flex flex-1 flex-col">
                <h3 className="font-bold">{pole.title}</h3>
                <p className="mt-3 flex-1 text-base leading-relaxed text-[var(--btp-muted)]">
                  {pole.body}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href={pole.href} className="bw-btp-btn bw-btp-btn-primary">
                    {pole.cta}
                  </Link>
                  <Link
                    href={pole.pageHref}
                    className="bw-btp-btn bw-btp-btn-secondary"
                  >
                    En savoir plus
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-5 text-xs text-[var(--btp-muted)]">
          Photos d’ambiance illustratives — elles ne représentent pas des
          références clients ni des effectifs BeWork.
        </p>
      </div>
    </section>
  );
}
