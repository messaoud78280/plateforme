import type { Metadata } from "next";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { ComparatifReveal } from "@/components/tarifs/ComparatifReveal";
import { StickyCtaMobile } from "@/components/tarifs/StickyCtaMobile";

export const metadata: Metadata = {
  title: "Tarifs BeWork – Assistants administratifs virtuels dès 215€/mois",
  description:
    "Offres Standard, Standard+, Premium et Full-time. Assistants francophones augmentés par l'IA. Pilotage en France, tarifs transparents.",
};

const plans = [
  {
    name: "Standard",
    price: "215",
    detail: "Tous services inclus",
    schedule: "Lundi au vendredi 1h par jour (env. 20h par mois)",
    actionsPerMonth: 120,
    idealFor: "TPE, tâches ponctuelles, test du service",
    badge: null as string | null,
  },
  {
    name: "Standard +",
    price: "415",
    detail: "Tous services inclus",
    schedule: "Lundi au vendredi 2h par jour (env. 40h par mois)",
    actionsPerMonth: 240,
    idealFor: "PME, charge administrative régulière",
    badge: "Le plus choisi" as string | null,
  },
  {
    name: "Premium",
    price: "630",
    detail: "Tous services inclus",
    schedule: "Lundi au vendredi 3h par jour (env. 60h par mois)",
    actionsPerMonth: 360,
    idealFor: "Dossiers multiples, suivi exigeant",
    badge: null as string | null,
  },
  {
    name: "Full-time",
    price: "1 230",
    detail: "Tous services inclus",
    schedule: "Lundi au vendredi 8h par jour (env. 160h par mois)",
    actionsPerMonth: 960,
    idealFor: "Volume important, équivalent poste dédié",
    badge: null as string | null,
  },
];

const reassurance = [
  { label: "Pilotage", desc: "Direction en France, suivi de qualité" },
  { label: "Confidentialité", desc: "Données sécurisées, process rigoureux" },
  { label: "Outils", desc: "Google, Microsoft, CRM selon vos usages" },
  { label: "Support", desc: "Équipe réactive, points de suivi réguliers" },
];

const inclus = [
  "Emails & organisation",
  "Devis, factures & relances",
  "Suivi dossiers / reporting",
  "Saisie / CRM",
  "Planning / RDV",
  "Compte-rendus / mise en forme",
];

const etapes = [
  {
    title: "RDV & découverte",
    desc: "Call pour comprendre vos activités, préférences, outils et volume. Proposition d’un profil sélectionné par notre équipe.",
  },
  {
    title: "Onboarding",
    desc: "Cadre de démarrage : rôles, objectifs, rituels de communication. Accès aux outils et prise en main.",
  },
  {
    title: "Exécution + suivi",
    desc: "Livraison des missions et points de suivi réguliers.",
  },
];

const faq = [
  { q: "Qu'est-ce qu'un périmètre ?", a: "Un périmètre correspond à un domaine de mission (ex. commercial, comptabilité, RH). Les tarifs indiqués couvrent jusqu'à 2 périmètres. Au-delà, un devis personnalisé est établi." },
  { q: "Comment sont protégées mes données ?", a: "Nous appliquons des mesures de confidentialité et de sécurité adaptées. Les données sont traitées dans un cadre strict ; nous restons à votre disposition pour toute précision sur nos engagements." },
  { q: "Quels sont les horaires et délais ?", a: "Les assistants travaillent du lundi au vendredi, alignés sur le fuseau français. Les délais de traitement dépendent du volume et de la complexité ; nous les cadrons ensemble lors du démarrage." },
  { q: "Avec quels outils travaillez-vous ?", a: "Nous nous adaptons à vos outils : Google Workspace, Microsoft 365, CRM, messageries… Nos assistants utilisent votre environnement et la plateforme BeWork pour le suivi des dossiers." },
  { q: "Y a-t-il un engagement ou une durée minimale ?", a: "Les conditions d'engagement et de résiliation sont précisées dans notre contrat. Contactez-nous pour en prendre connaissance." },
  { q: "Peut-on monter en charge progressivement ?", a: "Oui. Nous pouvons démarrer sur un volume limité et ajuster selon vos besoins, en cohérence avec nos offres." },
  { q: "Que se passe-t-il en cas d'absence de l'assistant ?", a: "Nous prévoyons une continuité de service et un remplacement si nécessaire. Les modalités sont détaillées dans le contrat." },
  { q: "Comment communiquer avec mon assistant ?", a: "Email, messagerie interne, téléphone selon vos préférences. Les canaux sont définis lors de l'onboarding." },
];

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f9fb] via-[#eef0f4] to-[#e0e4ea] pb-24 md:pb-16">
      <header className="sticky top-0 z-20 border-b border-[#c8cdd6] bg-[#f8f9fb]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="shrink-0" aria-label="BeWork - Retour à l'accueil">
            <BeWorkLogo size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="hidden rounded-lg border border-[#c8cdd6] bg-white px-4 py-2 text-sm font-medium text-[#1e293b] transition hover:bg-[#f8f9fb] sm:inline-flex"
              aria-label="Contact"
            >
              Contact
            </Link>
            <Link
              href="/connexion"
              className="rounded-lg bg-[#1d4ed8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2"
              aria-label="Accéder à mon espace"
            >
              Accéder
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {/* Hero */}
        <section className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[#0f172a] md:text-4xl">
            Les tarifs BeWork
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg leading-relaxed text-[#334155]">
            Assistants administratifs francophones, pilotés, augmentés par l&apos;IA — gagnez du temps et maîtrisez vos coûts.
          </p>
          {/* Réassurance */}
          <ul className="mt-8 flex flex-wrap justify-center gap-4 md:gap-6" role="list">
            {reassurance.map(({ label, desc }) => (
              <li
                key={label}
                className="rounded-lg border border-[#e0e4ea] bg-white px-4 py-3 text-center shadow-sm"
              >
                <span className="block font-semibold text-[#0f172a]">{label}</span>
                <span className="block text-sm text-[#64748b]">{desc}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Cartes pricing */}
        <section className="mt-14" aria-labelledby="offres-heading">
          <h2 id="offres-heading" className="sr-only">
            Nos offres
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative rounded-xl border-2 bg-white p-6 shadow-sm transition-all hover:shadow-md ${
                  plan.badge ? "border-[#1d4ed8] shadow-[#1d4ed8]/10" : "border-[#c8cdd6] hover:border-[#9ca3af]"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#1d4ed8] px-3 py-0.5 text-xs font-semibold text-white">
                    {plan.badge}
                  </span>
                )}
                <h3 className="border-b-2 border-[#1e293b] pb-2 font-semibold text-[#0f172a]">
                  {plan.name}
                </h3>
                <p className="mt-4 text-2xl font-bold text-[#1d4ed8] md:text-3xl">
                  {plan.price}€/mois*
                </p>
                <p className="mt-2 text-sm text-[#334155]">{plan.detail}</p>
                <div className="mt-4 flex items-start gap-2 text-sm text-[#334155]">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{plan.schedule}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-[#0f172a]">
                  {plan.actionsPerMonth} actions / mois
                </p>
                <p className="mt-3 text-xs text-[#64748b] italic">
                  Idéal pour : {plan.idealFor}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-6 max-w-2xl mx-auto text-center text-sm text-[#334155]">
            *Tarifs valables pour 2 périmètres maximum. Pour 3 périmètres ou plus, contactez-nous en France pour un tarif personnalisé.
          </p>
          <p className="mt-2 max-w-2xl mx-auto text-center text-sm text-[#334155]">
            Minimum facturé : 1 action par demande.
          </p>
        </section>

        {/* Ce qui est inclus */}
        <section className="mt-14 rounded-2xl border border-[#e0e4ea] bg-white p-8 shadow-sm" aria-labelledby="inclus-heading">
          <h2 id="inclus-heading" className="text-xl font-bold text-[#0f172a] md:text-2xl">
            Ce qui est inclus
          </h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-3" role="list">
            {inclus.map((item) => (
              <li key={item} className="flex items-center gap-2 text-[#334155]">
                <span className="text-[#1d4ed8]" aria-hidden>✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4">
            <Link
              href="/assistants-administratifs-taches"
              className="text-sm font-medium text-[#1d4ed8] transition hover:underline"
            >
              Voir les tâches prises en charge →
            </Link>
          </p>
        </section>

        {/* Comment ça marche */}
        <section className="mt-14" aria-labelledby="process-heading">
          <h2 id="process-heading" className="text-xl font-bold text-[#0f172a] md:text-2xl">
            Comment ça marche
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {etapes.map((e, i) => (
              <div key={i} className="rounded-xl border border-[#e0e4ea] bg-white p-6 shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1d4ed8] text-lg font-bold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold text-[#0f172a]">{e.title}</h3>
                <p className="mt-2 text-sm text-[#334155]">{e.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA principal */}
        <div className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/contact"
            className="w-full rounded-lg bg-[#1d4ed8] px-8 py-4 text-center font-semibold text-white shadow-md transition hover:bg-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2 sm:w-auto"
            aria-label="Demande de contact et rendez-vous"
          >
            Demande de contact et RDV
          </Link>
          <Link
            href="/connexion"
            className="w-full rounded-lg border border-[#c8cdd6] bg-white px-8 py-4 text-center font-semibold text-[#1e293b] transition hover:bg-[#f8f9fb] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2 sm:w-auto"
            aria-label="Déjà client ? Accéder à mon espace"
          >
            Déjà client ? Accéder
          </Link>
        </div>

        {/* Tableau comparatif (révélé au clic) */}
        <ComparatifReveal>
          {/* Tableau des offres Standard / Standard+ / Premium / Full-time */}
          <div className="overflow-x-auto rounded-xl border border-[#c8cdd6] bg-white">
            <table className="w-full min-w-[500px] text-left text-sm" role="grid">
              <caption className="sr-only">Comparatif des offres BeWork</caption>
              <thead>
                <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]">
                  <th className="px-4 py-3 font-semibold text-[#0f172a]">Critère</th>
                  <th className="px-4 py-3 font-semibold text-[#0f172a]">Standard</th>
                  <th className="px-4 py-3 font-semibold text-[#0f172a]">Standard +</th>
                  <th className="px-4 py-3 font-semibold text-[#0f172a]">Premium</th>
                  <th className="px-4 py-3 font-semibold text-[#0f172a]">Full-time</th>
                </tr>
              </thead>
              <tbody className="text-[#334155]">
                <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-3">Prix/mois</td><td className="px-4 py-3">215 €</td><td className="px-4 py-3">415 €</td><td className="px-4 py-3">630 €</td><td className="px-4 py-3">1 230 €</td></tr>
                <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-3">Heures/jour</td><td className="px-4 py-3">1h</td><td className="px-4 py-3">2h</td><td className="px-4 py-3">3h</td><td className="px-4 py-3">8h</td></tr>
                <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-3">Heures/mois</td><td className="px-4 py-3">~20h</td><td className="px-4 py-3">~40h</td><td className="px-4 py-3">~60h</td><td className="px-4 py-3">~160h</td></tr>
                <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-3">Périmètres inclus</td><td colSpan={4} className="px-4 py-3">Max 2 (au-delà : devis sur mesure)</td></tr>
                <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-3">Support / pilotage</td><td colSpan={4} className="px-4 py-3">Pilotage en France, points de suivi réguliers</td></tr>
                <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-3">Canaux</td><td colSpan={4} className="px-4 py-3">Email, messagerie, téléphone selon vos besoins</td></tr>
              </tbody>
            </table>
          </div>

          {/* Bloc comparatif coût réel (existant) */}
          <section className="mt-10 rounded-2xl border-2 border-[#1d4ed8]/20 bg-white p-6 shadow-lg md:p-10">
            <h3 className="text-center text-xl font-bold text-[#0f172a] md:text-2xl">
              Comparatif : coût réel d&apos;un assistant vs nos assistants virtuels
            </h3>
            <p className="mt-3 text-center text-sm text-[#64748b]">
              Référence : salaire brut 2 200 €/mois (région parisienne). Coût réel = salaire + charges + avantages + bureau + RH.
            </p>
            <div className="mt-10 overflow-x-auto rounded-xl border border-[#c8cdd6] bg-white">
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
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50"><td colSpan={4} className="px-4 py-2 font-semibold text-[#0f172a]">1. Salaire & charges sociales</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Salaire brut mensuel</td><td className="px-4 py-2 text-right">2 200</td><td className="px-4 py-2 text-right">2 200</td><td className="px-4 py-2 text-right">2 200</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">13ème mois (proratisé/mois)</td><td className="px-4 py-2 text-right">183</td><td className="px-4 py-2 text-right">183</td><td className="px-4 py-2 text-right">183</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Charges patronales (~42 %)</td><td className="px-4 py-2 text-right">1 009</td><td className="px-4 py-2 text-right">1 009</td><td className="px-4 py-2 text-right">1 009</td></tr>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50"><td colSpan={4} className="px-4 py-2 font-semibold text-[#0f172a]">2. Avantages sociaux</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Tickets restaurant, mutuelle, transport, RTT…</td><td className="px-4 py-2 text-right">317</td><td className="px-4 py-2 text-right">384</td><td className="px-4 py-2 text-right">350</td></tr>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50"><td colSpan={4} className="px-4 py-2 font-semibold text-[#0f172a]">3. Matériel & bureau</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Loyer bureau, poste, logiciels…</td><td className="px-4 py-2 text-right">434</td><td className="px-4 py-2 text-right">788</td><td className="px-4 py-2 text-right">611</td></tr>
                  <tr className="border-b border-[#e0e4ea] bg-[#f8f9fb]/50"><td colSpan={4} className="px-4 py-2 font-semibold text-[#0f172a]">4. RH & indirects</td></tr>
                  <tr className="border-b border-[#e0e4ea]"><td className="px-4 py-2">Recrutement, formation, management…</td><td className="px-4 py-2 text-right">341</td><td className="px-4 py-2 text-right">712</td><td className="px-4 py-2 text-right">527</td></tr>
                  <tr className="border-b-2 border-[#0f172a] bg-[#0f172a] font-bold text-white">
                    <td className="px-4 py-3">Coût total mensuel réel</td><td className="px-4 py-3 text-right">4 638 €</td><td className="px-4 py-3 text-right">5 467 €</td><td className="px-4 py-3 text-right">5 053 €</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div className="rounded-xl border border-[#c8cdd6] bg-[#f8f9fb] p-6">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-[#64748b]">Assistant en CDI</h4>
                <p className="mt-4 text-3xl font-bold text-[#0f172a]">~5 050 € <span className="text-lg font-normal text-[#64748b]">/mois</span></p>
                <p className="mt-1 text-[#334155]">soit ~60 600 € / an</p>
              </div>
              <div className="rounded-xl border-2 border-[#1d4ed8] bg-[#eff6ff] p-6">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-[#1d4ed8]">BeWork</h4>
                <p className="mt-4 text-3xl font-bold text-[#1d4ed8]">215 € à 1 230 € <span className="text-lg font-normal text-[#64748b]">/mois</span></p>
                <p className="mt-1 text-[#334155]">tout compris</p>
              </div>
            </div>
            <div className="mt-8 rounded-xl bg-[#0f172a] px-6 py-5 text-center text-white">
              <p className="text-lg font-bold md:text-xl">
                Économie possible : jusqu&apos;à <span className="text-[#60a5fa]">~75 %</span> par rapport au coût réel d&apos;un assistant en CDI.
              </p>
            </div>
          </section>
        </ComparatifReveal>

        {/* FAQ */}
        <section className="mt-14" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-bold text-[#0f172a] md:text-2xl">
            Questions fréquentes
          </h2>
          <ul className="mt-6 space-y-4">
            {faq.map(({ q, a }, i) => (
              <li key={i} className="rounded-xl border border-[#e0e4ea] bg-white shadow-sm">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 font-medium text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-inset [&::-webkit-details-marker]:hidden">
                    <span>{q}</span>
                    <span className="shrink-0 pl-2 text-[#64748b] group-open:rotate-180">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </summary>
                  <div className="border-t border-[#e0e4ea] px-4 py-3 text-[#334155]">{a}</div>
                </details>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA bas de page */}
        <section className="mt-14 rounded-2xl border-2 border-[#1d4ed8]/30 bg-[#eff6ff] p-8 text-center md:p-10">
          <h2 className="text-xl font-bold text-[#0f172a] md:text-2xl">
            Prêt à démarrer ?
          </h2>
          <p className="mt-2 text-[#334155]">
            Demandez un rendez-vous pour un cadrage personnalisé.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="w-full rounded-lg bg-[#1d4ed8] px-8 py-4 text-center font-semibold text-white shadow-md transition hover:bg-[#1e40af] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2 sm:w-auto"
              aria-label="Demande de contact et rendez-vous"
            >
              Demande de contact et RDV
            </Link>
            <Link
              href="/connexion"
              className="w-full rounded-lg border border-[#c8cdd6] bg-white px-8 py-4 text-center font-semibold text-[#1e293b] transition hover:bg-[#f8f9fb] sm:w-auto"
              aria-label="Déjà client ? Accéder"
            >
              Déjà client ? Accéder
            </Link>
          </div>
        </section>

        <div className="mt-10 flex justify-center">
          <Link
            href="/"
            className="text-sm font-medium text-[#64748b] underline transition hover:text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:ring-offset-2"
            aria-label="Retour à l'accueil"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>

      <StickyCtaMobile />
    </div>
  );
}
