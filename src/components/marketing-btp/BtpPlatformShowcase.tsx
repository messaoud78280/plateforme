import Link from "next/link";
import { BTP_PLATFORM_MODULES } from "@/lib/bework-btp-services";

export function BtpPlatformShowcase() {
  return (
    <section className="bw-btp-section" aria-labelledby="platform-showcase-title">
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Plateforme collaborative</p>
        <h2 id="platform-showcase-title" className="mt-2 max-w-4xl font-bold">
          Nos conducteurs de travaux disposent de leurs propres outils de
          pilotage.
        </h2>
        <p className="bw-btp-lead mt-4 max-w-3xl">
          BeWork a conçu un environnement numérique dédié à la préparation, à
          la coordination et au suivi des chantiers. Une technologie développée
          pour répondre aux besoins concrets du terrain — associée à la mission
          humaine, pas en remplacement.
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
            Découvrir la plateforme &amp; l’IA
          </Link>
          <Link href="/dashboard" className="bw-btp-btn bw-btp-btn-secondary">
            Accès plateforme
          </Link>
        </div>
      </div>
    </section>
  );
}
