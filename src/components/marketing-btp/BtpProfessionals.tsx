import Link from "next/link";
import { BTP_PROFESSIONAL_PROFILES } from "@/lib/bework-btp-services";

export function BtpProfessionals() {
  return (
    <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="pros-title">
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Nos professionnels</p>
        <h2 id="pros-title" className="mt-2 font-bold">
          Les professionnels BeWork au service de vos opérations.
        </h2>
        <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
          Prestations de mission contractualisées — pas du travail temporaire.
          Les profils proposés dépendent des compétences et disponibilités
          effectivement mobilisables. Aucun effectif ni disponibilité n’est
          inventé.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {BTP_PROFESSIONAL_PROFILES.map((p) => (
            <article key={p.title} className="bw-btp-card flex flex-col">
              <h3 className="font-bold">{p.title}</h3>
              <p className="mt-3 text-base leading-relaxed text-[var(--btp-muted)]">
                {p.mission}
              </p>
              <p className="mt-5 text-xs font-bold uppercase tracking-[0.1em] text-[var(--btp-steel)]">
                Prestations possibles
              </p>
              <ul className="mt-2 flex-1 space-y-1.5">
                {p.prestations.map((item) => (
                  <li key={item} className="flex gap-2 text-base text-[var(--btp-muted)]">
                    <span className="text-[var(--btp-accent)]" aria-hidden>
                      •
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={`/demande-de-devis?besoin=${p.besoin}`}
                className="bw-btp-btn bw-btp-btn-secondary-dark mt-6 self-start"
              >
                Demander cette compétence
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
