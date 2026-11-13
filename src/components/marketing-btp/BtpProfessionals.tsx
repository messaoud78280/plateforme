import Link from "next/link";
import { BTP_PROFESSIONAL_PROFILES } from "@/lib/bework-btp-services";

export function BtpProfessionals() {
  return (
    <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="pros-title">
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Nos professionnels</p>
        <h2 id="pros-title" className="mt-2 font-bold">
          Les compétences nécessaires à vos opérations.
        </h2>
        <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
          Prestations de mission contractualisées — pas du travail temporaire.
          Les profils proposés dépendent des compétences et disponibilités
          effectivement mobilisables.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {BTP_PROFESSIONAL_PROFILES.map((p) => (
            <article key={p.title} className="bw-btp-card flex flex-col">
              <h3 className="font-bold">{p.title}</h3>
              <p className="mt-3 text-base text-[var(--btp-muted)]">
                <span className="font-semibold text-[var(--btp-heading)]">Quand : </span>
                {p.when}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--btp-steel)]">
                    Responsabilités possibles
                  </p>
                  <ul className="mt-2 space-y-1">
                    {p.responsibilities.map((r) => (
                      <li key={r} className="text-base text-[var(--btp-muted)]">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--btp-steel)]">
                    Livrables types
                  </p>
                  <ul className="mt-2 space-y-1">
                    {p.livrables.map((l) => (
                      <li key={l} className="text-base text-[var(--btp-muted)]">
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-sm text-[var(--btp-muted)]">
                Domaines : {p.domaines.join(" · ")}
              </p>
              <Link
                href={`/demande-de-devis?besoin=${p.besoin}`}
                className="mt-5 text-base font-semibold text-[var(--btp-steel)] hover:underline"
              >
                Demander cette mission →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
