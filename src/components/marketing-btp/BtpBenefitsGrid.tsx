import { BTP_COMMERCIAL_BENEFITS } from "@/lib/bework-btp-services";

export function BtpBenefitsGrid() {
  return (
    <section className="bw-btp-section bw-btp-section-alt" aria-labelledby="benefits-grid-title">
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Objectifs de prestation</p>
        <h2 id="benefits-grid-title" className="mt-2 font-bold">
          Ce que nous cherchons à améliorer avec vous
        </h2>
        <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
          Objectifs recherchés — pas des résultats garantis, ni des pourcentages
          d’amélioration inventés.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BTP_COMMERCIAL_BENEFITS.map((item) => (
            <article key={item.title} className="bw-btp-card">
              <h3 className="font-bold">{item.title}</h3>
              <p className="mt-2 text-base text-[var(--btp-muted)]">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}