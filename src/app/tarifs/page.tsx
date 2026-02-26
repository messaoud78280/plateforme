import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { ComparatifReveal } from "@/components/tarifs/ComparatifReveal";

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

        {/* Nos offres — en premier */}
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

        <p className="mt-6 max-w-2xl mx-auto text-center text-sm text-[#334155]">
          *Tarifs valables pour 2 périmètres maximum. Pour bénéficier
          d&apos;assistants virtuels sur 3 périmètres ou plus, contactez-nous
          en France pour un tarif personnalisé.
        </p>

        <ComparatifReveal>
        {/* Comparatif coût réel assistant classique vs BeWork */}
        <section className="rounded-2xl border-2 border-[#1d4ed8]/20 bg-white p-6 shadow-lg md:p-10">
          <h2 className="text-center text-xl font-bold text-[#0f172a] md:text-2xl">
            Comparatif : coût réel d&apos;un assistant vs nos assistants virtuels
          </h2>
          <p className="mt-3 text-center text-sm text-[#64748b]">
            Référence : salaire brut 2 200 €/mois (région parisienne). Coût réel = salaire + charges + avantages + bureau + RH.
          </p>

          {/* Tableau détaillé du coût réel */}
          <div className="mt-10">
            <h3 className="mb-4 text-lg font-semibold text-[#0f172a]">
              Coût réel d&apos;un assistant administratif en France (détail)
            </h3>
            <div className="overflow-x-auto rounded-xl border border-[#c8cdd6] bg-white">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]">
                    <th className="px-4 py-3 font-semibold text-[#0f172a]">Poste / Base de calcul</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#0f172a]">Coût min (€/mois)</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#0f172a]">Coût max (€/mois)</th>
                    <th className="px-4 py-3 text-right font-semibold text-[#0f172a]">Coût moyen (€/mois)</th>
                  </tr>
                </thead>
                <tbody className="text-[#334155]">
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50">
                    <td colSpan={4} className="px-4 py-2 font-semibold text-[#0f172a]">1. Salaire & charges sociales</td>
                  </tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Salaire brut mensuel</td><td className="px-4 py-2 text-right">2 200</td><td className="px-4 py-2 text-right">2 200</td><td className="px-4 py-2 text-right">2 200</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">13ème mois (proratisé/mois)</td><td className="px-4 py-2 text-right">183</td><td className="px-4 py-2 text-right">183</td><td className="px-4 py-2 text-right">183</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Charges patronales (~42 %)</td><td className="px-4 py-2 text-right">1 009</td><td className="px-4 py-2 text-right">1 009</td><td className="px-4 py-2 text-right">1 009</td></tr>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50">
                    <td colSpan={4} className="px-4 py-2 font-semibold text-[#0f172a]">2. Avantages sociaux obligatoires</td>
                  </tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Tickets restaurant (9 € × ~20 j × 60 %)</td><td className="px-4 py-2 text-right">99</td><td className="px-4 py-2 text-right">99</td><td className="px-4 py-2 text-right">99</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Mutuelle santé (part patronale)</td><td className="px-4 py-2 text-right">50</td><td className="px-4 py-2 text-right">75</td><td className="px-4 py-2 text-right">63</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Remboursement transport (50 % Navigo)</td><td className="px-4 py-2 text-right">43</td><td className="px-4 py-2 text-right">43</td><td className="px-4 py-2 text-right">43</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">RTT (si 39 h), ~10 j/an</td><td className="px-4 py-2 text-right">142</td><td className="px-4 py-2 text-right">167</td><td className="px-4 py-2 text-right">155</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Prévoyance</td><td className="px-4 py-2 text-right">25</td><td className="px-4 py-2 text-right">42</td><td className="px-4 py-2 text-right">34</td></tr>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50">
                    <td colSpan={4} className="px-4 py-2 font-semibold text-[#0f172a]">3. Matériel & espace de travail</td>
                  </tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Loyer bureau (8–12 m², Paris)</td><td className="px-4 py-2 text-right">333</td><td className="px-4 py-2 text-right">600</td><td className="px-4 py-2 text-right">467</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Poste informatique (amorti 3 ans)</td><td className="px-4 py-2 text-right">42</td><td className="px-4 py-2 text-right">67</td><td className="px-4 py-2 text-right">55</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Téléphonie (fixe/mobile)</td><td className="px-4 py-2 text-right">25</td><td className="px-4 py-2 text-right">42</td><td className="px-4 py-2 text-right">34</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Logiciels (Microsoft 365, etc.)</td><td className="px-4 py-2 text-right">17</td><td className="px-4 py-2 text-right">33</td><td className="px-4 py-2 text-right">25</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Fournitures & consommables</td><td className="px-4 py-2 text-right">17</td><td className="px-4 py-2 text-right">25</td><td className="px-4 py-2 text-right">21</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Mobilier (amorti 5 ans)</td><td className="px-4 py-2 text-right">13</td><td className="px-4 py-2 text-right">21</td><td className="px-4 py-2 text-right">17</td></tr>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50">
                    <td colSpan={4} className="px-4 py-2 font-semibold text-[#0f172a]">4. RH & obligations légales</td>
                  </tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Médecine du travail</td><td className="px-4 py-2 text-right">8</td><td className="px-4 py-2 text-right">13</td><td className="px-4 py-2 text-right">11</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Formation professionnelle (~1 % masse salariale)</td><td className="px-4 py-2 text-right">24</td><td className="px-4 py-2 text-right">24</td><td className="px-4 py-2 text-right">24</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Arrêts maladie (provision)</td><td className="px-4 py-2 text-right">42</td><td className="px-4 py-2 text-right">125</td><td className="px-4 py-2 text-right">84</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Recrutement (amorti 2 ans)</td><td className="px-4 py-2 text-right">42</td><td className="px-4 py-2 text-right">83</td><td className="px-4 py-2 text-right">63</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">CSE / œuvres sociales (~1 %)</td><td className="px-4 py-2 text-right">24</td><td className="px-4 py-2 text-right">24</td><td className="px-4 py-2 text-right">24</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Onboarding / intégration</td><td className="px-4 py-2 text-right">25</td><td className="px-4 py-2 text-right">50</td><td className="px-4 py-2 text-right">38</td></tr>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50">
                    <td colSpan={4} className="px-4 py-2 font-semibold text-[#0f172a]">5. Coûts indirects</td>
                  </tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Management & encadrement</td><td className="px-4 py-2 text-right">125</td><td className="px-4 py-2 text-right">250</td><td className="px-4 py-2 text-right">188</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Charges générales (énergie, ménage…)</td><td className="px-4 py-2 text-right">67</td><td className="px-4 py-2 text-right">125</td><td className="px-4 py-2 text-right">96</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Absentéisme & baisse productivité</td><td className="px-4 py-2 text-right">83</td><td className="px-4 py-2 text-right">167</td><td className="px-4 py-2 text-right">125</td></tr>
                  <tr className="border-b-2 border-[#0f172a] bg-[#0f172a] font-bold text-white">
                    <td className="px-4 py-3">Coût total mensuel réel</td>
                    <td className="px-4 py-3 text-right">4 638 €</td>
                    <td className="px-4 py-3 text-right">5 467 €</td>
                    <td className="px-4 py-3 text-right">5 053 €</td>
                  </tr>
                  <tr className="bg-[#0f172a] font-bold text-white">
                    <td className="px-4 py-2">Coût total annuel (× 12)</td>
                    <td className="px-4 py-2 text-right">55 656 €</td>
                    <td className="px-4 py-2 text-right">65 604 €</td>
                    <td className="px-4 py-2 text-right">60 636 €</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-[#64748b]">
              Chiffres estimatifs pour la région parisienne. Les coûts varient selon la convention collective, la taille de l&apos;entreprise et la localisation.
            </p>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border border-[#c8cdd6] bg-[#f8f9fb] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#64748b]">
                Assistant en CDI (coût réel employeur)
              </h3>
              <p className="mt-4 text-3xl font-bold text-[#0f172a] md:text-4xl">
                ~5 050 € <span className="text-lg font-normal text-[#64748b]">/mois</span>
              </p>
              <p className="mt-1 text-[#334155]">soit ~60 600 € / an</p>
              <ul className="mt-4 space-y-2 text-sm text-[#334155]">
                <li>Salaire brut + charges (~42 %)</li>
                <li>Avantages (tickets resto, mutuelle, transport, RTT…)</li>
                <li>Bureau, poste, logiciels, mobilier</li>
                <li>RH : recrutement, formation, arrêts maladie</li>
                <li>Management et charges indirectes</li>
              </ul>
            </div>
            <div className="rounded-xl border-2 border-[#1d4ed8] bg-[#eff6ff] p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#1d4ed8]">
                BeWork — assistant virtuel dédié
              </h3>
              <p className="mt-4 text-3xl font-bold text-[#1d4ed8] md:text-4xl">
                215 € à 1 230 € <span className="text-lg font-normal text-[#64748b]">/mois</span>
              </p>
              <p className="mt-1 text-[#334155]">selon le volume (tout compris)</p>
              <ul className="mt-4 space-y-2 text-sm text-[#334155]">
                <li>Tout inclus : pas de charges, ni bureau, ni recrutement</li>
                <li>Opérationnel après onboarding</li>
                <li>Qualité pro, équipe encadrée en France</li>
                <li>Formation IA et process incluses</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 rounded-xl bg-[#0f172a] px-6 py-5 text-center text-white">
            <p className="text-lg font-bold md:text-xl">
              Économie possible : jusqu&apos;à <span className="text-[#60a5fa]">~75 %</span> par rapport au coût réel d&apos;un assistant en CDI.
            </p>
            <p className="mt-2 text-sm text-[#94a3b8]">
              Ex. équivalent full-time : 1 230 €/mois BeWork vs ~5 050 €/mois coût réel employeur.
            </p>
          </div>
        </section>
        </ComparatifReveal>

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
