import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";

const plans = [
  {
    name: "Standard",
    price: "215",
    detail: "Tous services inclus",
    schedule: "Lundi au vendredi 1h par jour (env. 20h par mois)",
  },
  {
    name: "Standard +",
    price: "415",
    detail: "Tous services inclus",
    schedule: "Lundi au vendredi 2h par jour (env. 40h par mois)",
  },
  {
    name: "Premium",
    price: "630",
    detail: "Tous services inclus",
    schedule: "Lundi au vendredi 3h par jour (env. 60h par mois)",
  },
  {
    name: "Full-time",
    price: "1 230",
    detail: "Tous services inclus",
    schedule: "Lundi au vendredi 8h par jour (env. 160h par mois)",
  },
];

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea] py-16 px-4">
      <div className="mx-auto max-w-6xl">
        <header className="mb-12 flex justify-center">
          <BeWorkLogo size="lg" />
        </header>

        <h1 className="text-center text-3xl font-bold text-[#0f172a] md:text-4xl">
          Les tarifs BeWork.
        </h1>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className="rounded-lg border border-[#c8cdd6] bg-white p-6 shadow-sm transition-all hover:border-[#9ca3af] hover:shadow-md"
            >
              <h2 className="border-b-2 border-[#1e293b] pb-2 font-semibold text-[#0f172a]">
                {plan.name}
              </h2>
              <p className="mt-4 text-2xl font-bold text-[#1d4ed8] md:text-3xl">
                {plan.price}€/mois*
              </p>
              <p className="mt-2 text-sm text-[#334155]">{plan.detail}</p>
              <div className="mt-4 flex items-start gap-2 text-sm text-[#334155]">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#64748b]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{plan.schedule}</span>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 max-w-2xl mx-auto text-center text-sm text-[#334155]">
          *Tarifs valables pour 2 périmètres maximum. Pour bénéficier
          d&apos;assistants virtuels sur 3 périmètres ou plus, contactez-nous
          en France pour un tarif personnalisé.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/contact"
            className="rounded-lg bg-[#1d4ed8] px-8 py-4 font-semibold text-white shadow-md transition-all hover:bg-[#1e40af] hover:shadow-lg"
          >
            Demande de contact et RDV
          </Link>
          <Link
            href="/connexion"
            className="rounded-lg border border-[#c8cdd6] bg-white px-8 py-4 font-semibold text-[#1e293b] shadow-sm hover:bg-[#f8f9fb]"
          >
            Déjà client ? Accéder
          </Link>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="text-sm text-[#64748b] underline hover:text-[#0f172a]"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
