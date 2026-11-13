import Link from "next/link";
import {
  BTP_DELIVERABLE_LIST,
  BTP_DELIVERABLES,
} from "@/lib/bework-btp-services";

type Props = {
  compact?: boolean;
};

export function BtpDeliverables({ compact = false }: Props) {
  return (
    <section className="bw-btp-section" aria-labelledby="deliverables-title">
      <div className="bw-btp-container">
        <p className="bw-btp-eyebrow">Livrables</p>
        <h2 id="deliverables-title" className="mt-2 max-w-3xl font-bold">
          {compact
            ? "Vous savez ce qui se passe sur votre chantier."
            : "Nos outils rendent chaque intervention plus lisible."}
        </h2>
        <p className="mt-3 max-w-3xl text-base text-[var(--btp-muted)]">
          Exemples professionnels de ce qu’une mission peut produire. Les
          livrables exacts sont définis contractuellement.
        </p>

        <ul className="mt-8 flex flex-wrap gap-2">
          {BTP_DELIVERABLE_LIST.map((item) => (
            <li
              key={item}
              className="rounded-md border border-[var(--btp-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--btp-heading)]"
            >
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {BTP_DELIVERABLES.map((doc) => (
            <article key={doc.id} className="bw-btp-card overflow-hidden p-0">
              <div className="border-b border-[var(--btp-border)] bg-[var(--btp-soft)] px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--btp-steel)]">
                  Exemple fictif
                </p>
                <h3 className="mt-1 font-bold">{doc.title}</h3>
              </div>
              <div className="px-5 py-4">
                <ul className="grid gap-2 sm:grid-cols-2">
                  {doc.items.map((item) => (
                    <li key={item} className="text-base text-[var(--btp-muted)]">
                      {item}
                    </li>
                  ))}
                </ul>
                {doc.id === "financier" ? (
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {[
                      { k: "Budget", v: "100 %" },
                      { k: "Dépensé", v: "72 %" },
                      { k: "Écart", v: "+1,8 %" },
                    ].map((m) => (
                      <div key={m.k} className="bw-btp-metric">
                        <p className="bw-btp-metric-label">{m.k}</p>
                        <p className="bw-btp-metric-value text-lg">{m.v}</p>
                      </div>
                    ))}
                  </div>
                ) : null}
                {doc.id === "direction" ? (
                  <div className="mt-5 rounded-lg border border-[rgba(30,78,140,0.25)] bg-[rgba(30,78,140,0.08)] p-3 text-sm text-[var(--btp-steel)]">
                    Point bloquant : interface lots VRD / réseaux — décision
                    attendue sous 48 h (données fictives).
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 text-sm text-[var(--btp-muted)]">
          Données de démonstration — ne correspondent pas à un chantier client
          réel.
        </p>
        <div className="mt-6">
          <Link href="/plateforme-ia" className="bw-btp-btn bw-btp-btn-secondary-dark">
            Voir la plateforme &amp; l’IA
          </Link>
        </div>
      </div>
    </section>
  );
}
