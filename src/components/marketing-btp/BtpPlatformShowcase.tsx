import Link from "next/link";
import { BTP_PLATFORM_MODULES } from "@/lib/bework-btp-services";

export function BtpPlatformShowcase() {
  return (
    <section className="bw-btp-section" aria-labelledby="platform-showcase-title">
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Outils internes</p>
        <h2 id="platform-showcase-title" className="mt-2 max-w-4xl font-bold">
          Des outils utilisés par nos équipes sur le terrain.
        </h2>
        <p className="bw-btp-lead mt-4 max-w-3xl">
          Nos conducteurs de travaux et pilotes de chantier s’appuient sur un
          environnement de suivi interne pour préparer, documenter et
          coordonner les missions — avec une validation professionnelle à
          chaque étape.
        </p>

        <div className="mt-10 overflow-hidden rounded-xl border border-[var(--btp-border)] bg-white p-5 sm:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--btp-steel)]">
            Exemple fictif — tableau de bord d’opération
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { k: "Avancement", v: "68 %" },
              { k: "Actions prioritaires", v: "7" },
              { k: "Points bloquants", v: "2" },
              { k: "Écart budget", v: "+1,8 %" },
            ].map((m) => (
              <div key={m.k} className="bw-btp-metric">
                <p className="bw-btp-metric-label">{m.k}</p>
                <p className="bw-btp-metric-value">{m.v}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-base text-[var(--btp-muted)]">
            Données de démonstration — ne correspondent pas à un chantier client
            réel.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {BTP_PLATFORM_MODULES.map((mod) => (
            <article key={mod.id} className="bw-btp-card">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold">{mod.title}</h3>
                <span className="shrink-0 rounded-full bg-[var(--btp-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--btp-steel)]">
                  Utilisable en mission
                </span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {mod.items.map((item) => (
                  <li key={item} className="text-base text-[var(--btp-muted)]">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/plateforme-ia" className="bw-btp-btn bw-btp-btn-primary">
            Voir notre approche outils &amp; méthode
          </Link>
          <Link
            href="/demande-de-devis?besoin=conducteur_travaux"
            className="bw-btp-btn bw-btp-btn-secondary"
          >
            Demander un conducteur de travaux
          </Link>
        </div>
      </div>
    </section>
  );
}
