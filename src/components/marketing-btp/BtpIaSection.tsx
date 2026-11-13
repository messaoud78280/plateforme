import Link from "next/link";
import { BTP_IA_DOMAINS } from "@/lib/bework-btp-services";

export function BtpIaSection() {
  const flow = [
    "Données chantier",
    "Outils BeWork",
    "Analyse assistée par IA",
    "Validation professionnelle",
    "Suivi et décision",
  ];

  return (
    <section className="bw-btp-section bw-btp-section-soft" aria-labelledby="ia-title">
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Appui IA interne</p>
        <h2 id="ia-title" className="mt-2 max-w-4xl font-bold">
          Un pilotage renforcé par nos outils IA.
        </h2>
        <p className="bw-btp-lead mt-4 max-w-3xl">
          L’IA assiste nos équipes dans l’analyse documentaire, la
          préparation, l’organisation et le reporting. Elle n’est pas un
          produit vendu seul et n’autonomise pas les décisions techniques ou de
          sécurité.
        </p>

        <ol className="mt-10 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-stretch">
          {flow.map((step, i) => (
            <li
              key={step}
              className="flex flex-1 items-center gap-3 rounded-xl border border-[var(--btp-border)] bg-white px-4 py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--btp-ink)] text-sm font-bold text-white">
                {i + 1}
              </span>
              <span className="font-semibold text-[var(--btp-heading)]">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {BTP_IA_DOMAINS.map((item) => (
            <article key={item.title} className="bw-btp-card">
              <h3 className="font-bold">{item.title}</h3>
              <p className="mt-3 text-base text-[var(--btp-muted)]">{item.body}</p>
            </article>
          ))}
        </div>

        <p className="mt-6 max-w-3xl text-base text-[var(--btp-muted)]">
          Aucune promesse d’économies garanties, de détection exhaustive des
          risques ou de validation automatique de conformité d’ouvrage.
        </p>
        <div className="mt-6">
          <Link href="/plateforme-ia" className="bw-btp-btn bw-btp-btn-secondary-dark">
            Comprendre notre approche
          </Link>
        </div>
      </div>
    </section>
  );
}
