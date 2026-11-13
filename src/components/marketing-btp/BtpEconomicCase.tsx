import Link from "next/link";
import { BTP_COST_RISKS } from "@/lib/bework-btp-services";

export function BtpEconomicCase() {
  return (
    <section className="bw-btp-section bw-btp-section-soft" aria-labelledby="eco-title">
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Argumentaire économique</p>
        <h2 id="eco-title" className="mt-2 max-w-3xl font-bold">
          Chaque imprévu peut coûter cher.
        </h2>
        <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
          Une bonne gestion de chantier n’est pas un luxe : c’est une condition
          de maîtrise des délais, des moyens et des coûts.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BTP_COST_RISKS.map((item) => (
            <div key={item} className="bw-btp-card">
              <p className="text-base font-medium text-[var(--btp-heading)]">{item}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-[var(--btp-border)] bg-white p-6 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--btp-steel)]">
            Exemple pédagogique — hypothèses explicites
          </p>
          <p className="mt-3 text-lg font-semibold text-[var(--btp-heading)]">
            Une équipe de cinq personnes immobilisée deux jours représente dix
            journées de travail mobilisées sans production correspondante.
          </p>
          <p className="mt-3 text-base text-[var(--btp-muted)]">
            Hypothèse illustrative uniquement. BeWork ne garantit pas la
            suppression de ces coûts. Notre rôle consiste à organiser et
            anticiper les opérations pour limiter les difficultés évitables et
            améliorer la visibilité sur les décisions.
          </p>
          <Link
            href="/demande-de-devis?besoin=audit_redressement"
            className="bw-btp-btn bw-btp-btn-primary mt-6"
          >
            Demander un audit de chantier
          </Link>
        </div>
      </div>
    </section>
  );
}
