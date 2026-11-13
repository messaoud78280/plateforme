import Link from "next/link";
import { BTP_COMMERCIAL_OFFERS } from "@/lib/bework-btp-services";

export function BtpCommercialOffers() {
  return (
    <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="offers-title">
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Offres commerciales</p>
        <h2 id="offers-title" className="mt-2 max-w-3xl font-bold">
          Trois niveaux d’intervention, une offre marchés dédiée.
        </h2>
        <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
          Identifiez rapidement le type de mission. Chaque prestation est établie
          sur devis — aucun tarif public.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {BTP_COMMERCIAL_OFFERS.map((offer) => (
            <article key={offer.id} className="bw-btp-card flex flex-col">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--btp-copper)]">
                {offer.level}
              </p>
              <h3 className="mt-2 font-bold">{offer.title}</h3>
              <p className="mt-2 text-base text-[var(--btp-muted)]">{offer.body}</p>
              <ul className="mt-4 flex-1 space-y-1.5">
                {offer.items.map((item) => (
                  <li key={item} className="flex gap-2 text-base text-[var(--btp-muted)]">
                    <span className="text-[var(--btp-copper)]" aria-hidden>
                      •
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={`/demande-de-devis?besoin=${offer.besoin}`}
                className="bw-btp-btn bw-btp-btn-secondary-dark mt-6 self-start"
              >
                {offer.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
