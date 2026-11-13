"use client";

import { useState } from "react";
import { BTP_PLATFORM_JOURNEY } from "@/lib/bework-btp-services";

export function BtpPlatformJourney() {
  const [active, setActive] = useState(0);
  const step = BTP_PLATFORM_JOURNEY[active] ?? BTP_PLATFORM_JOURNEY[0];

  return (
    <section className="bw-btp-section" aria-labelledby="journey-title">
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Parcours plateforme</p>
        <h2 id="journey-title" className="mt-2 max-w-3xl font-bold">
          De la visite chantier au reporting.
        </h2>
        <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
          Modules réellement présents dans l’environnement BeWork. L’accès et
          le périmètre dépendent du contrat. Démonstration avec données
          fictives.
        </p>

        <div
          className="mt-8 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Étapes du parcours plateforme"
        >
          {BTP_PLATFORM_JOURNEY.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              id={`journey-tab-${item.id}`}
              aria-controls={`journey-panel-${item.id}`}
              className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                i === active
                  ? "border-[var(--btp-ink)] bg-[var(--btp-ink)] text-white"
                  : "border-[var(--btp-border)] bg-white text-[var(--btp-heading)] hover:border-[var(--btp-border-strong)]"
              }`}
              onClick={() => setActive(i)}
            >
              {item.title}
            </button>
          ))}
        </div>

        <div
          id={`journey-panel-${step.id}`}
          role="tabpanel"
          aria-labelledby={`journey-tab-${step.id}`}
          className="mt-6 rounded-xl border border-[var(--btp-border)] bg-white p-6 sm:p-8"
        >
          <h3 className="text-xl font-bold">{step.title}</h3>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--btp-steel)]">
                Donnée entrante
              </dt>
              <dd className="mt-1 text-base text-[var(--btp-muted)]">{step.input}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--btp-steel)]">
                Action
              </dt>
              <dd className="mt-1 text-base text-[var(--btp-muted)]">{step.action}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--btp-steel)]">
                Résultat
              </dt>
              <dd className="mt-1 text-base text-[var(--btp-muted)]">{step.result}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--btp-steel)]">
                Assistance IA
              </dt>
              <dd className="mt-1 text-base text-[var(--btp-muted)]">{step.ia}</dd>
            </div>
          </dl>
          <p className="mt-5 text-sm text-[var(--btp-muted)]">
            Validation humaine obligatoire — l’IA n’autonomise pas les décisions
            techniques ou de sécurité.
          </p>
        </div>
      </div>
    </section>
  );
}