import Link from "next/link";
import { BTP_USE_CASES } from "@/lib/bework-btp-services";

export function BtpUseCases() {
  return (
    <section className="bw-btp-section" aria-labelledby="use-cases-title">
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Scénarios types</p>
        <h2 id="use-cases-title" className="mt-2 font-bold">
          Des solutions adaptées aux situations réelles du BTP.
        </h2>
        <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
          Exemples fictifs destinés à illustrer des cas d’usage — ce ne sont pas
          des références clients BeWork.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {BTP_USE_CASES.map((item) => (
            <article key={item.title} className="bw-btp-card flex flex-col">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--btp-steel)]">
                Scénario type
              </p>
              <h3 className="mt-2 font-bold">{item.title}</h3>
              <p className="mt-3 text-base text-[var(--btp-muted)]">
                <span className="font-semibold text-[var(--btp-heading)]">Problème : </span>
                {item.context}
              </p>
              <p className="mt-2 text-base text-[var(--btp-muted)]">
                <span className="font-semibold text-[var(--btp-heading)]">Intervention : </span>
                {item.solution}
              </p>
              <p className="mt-2 text-base font-medium text-[var(--btp-heading)]">
                Livrables types : {item.livrables}
              </p>
              <Link
                href={`/demande-de-devis?besoin=${item.besoin}`}
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
