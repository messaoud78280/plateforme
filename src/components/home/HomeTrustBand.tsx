import Link from "next/link";

/**
 * Bandeau confiance discret.
 * Affirmations alignées sur authz (rôles), isolation organisations, politique confidentialité / RGPD.
 * « Infrastructure européenne » : formulation historique produit — détail sous-traitants en politique.
 */
export function HomeTrustBand() {
  const items = [
    "Accès par rôles",
    "Environnements privés",
    "Infrastructure européenne",
    "RGPD",
  ] as const;

  return (
    <section
      id="confiance"
      className="border-y border-slate-100 bg-white py-10 sm:py-12"
      aria-labelledby="trust-heading"
    >
      <div className="container-site">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="trust-heading" className="font-display text-xl font-extrabold tracking-tight text-[#0a0a0a] sm:text-2xl">
            Vos données restent les vôtres.
          </h2>
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium text-slate-500">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-400">
            <Link href="/politique-confidentialite" className="underline-offset-2 hover:underline">
              Politique de confidentialité
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
