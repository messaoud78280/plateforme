import Image from "next/image";
import { getResourceEditorialDescription, resourceEditorialMetadata } from "@/lib/seo-resource-metadata";
import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { TUTO_TITRE } from "@/components/seo/tuto-section-titles";
import { absoluteUrl } from "@/lib/site";

const PAGE_PATH = "/ressources/analyse-dce-chiffrage-btp";
const pagePath = PAGE_PATH;
const pageUrl = absoluteUrl(pagePath);
const HERO_IMAGE = "/ressources/analyse-dce-chiffrage-btp-hero.png";
const HERO_WIDTH = 1024;
const HERO_HEIGHT = 576;

export const metadata = resourceEditorialMetadata(PAGE_PATH);

const FAQ_ITEMS = [
  {
    q: "BeWork peut-il chiffrer un DCE complet ?",
    a: "BeWork peut préparer une base de chiffrage à partir des pièces transmises, mais l’entreprise doit valider les prix, quantités, marges et engagements avant remise officielle.",
  },
  {
    q: "BeWork remplace-t-il un économiste de la construction ?",
    a: "Non. BeWork intervient comme appui travaux et relais administratif pour structurer les informations, préparer les tableaux et repérer les points d’alerte.",
  },
  {
    q: "Quels documents faut-il transmettre ?",
    a: "CCTP, plans, DPGF, BPU, DQE, règlement de consultation, CCAP, notices et tout document utile au chiffrage.",
  },
  {
    q: "Peut-on commencer par une mission test ?",
    a: "Oui. Il est possible de commencer par un lot, un extrait de DCE ou une DPGF pour évaluer la méthode BeWork.",
  },
  {
    q: "Qui valide le chiffrage final ?",
    a: "L’entreprise valide toujours les prix, quantités, marges, méthodes d’exécution et engagements contractuels.",
  },
] as const;

function FaqJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    url: pageUrl,
    inLanguage: "fr-FR",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

function ChecklistCard({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold tracking-tight text-slate-900">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2">
            <span className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AnalyseDceChiffrageBtpPage() {
  return (
    <>
      <FaqJsonLd />
      <SeoLandingPage
        description={getResourceEditorialDescription(PAGE_PATH)}
        h1="Analyse DCE et appui chiffrage BTP : gagner du temps sans perdre le contrôle"
        intro={
          <>
            Répondre à un DCE ou préparer un chiffrage BTP demande du temps, de la méthode et une vraie rigueur documentaire.
            Entre CCTP, plans, DPGF, BPU, DQE, notices et limites de prestations, les entreprises du bâtiment perdent souvent de
            nombreuses heures avant même de remettre une offre claire. BeWork intervient comme{" "}
            <strong>relais administratif</strong> et <strong>assistant travaux externalisé</strong> : nous préparons, structurons,
            alertons — l&apos;entreprise valide et engage son offre.
          </>
        }
        breadcrumbItems={[
          { name: "Accueil", href: "/" },
          { name: "Ressources", href: "/ressources" },
          { name: "Analyse DCE & chiffrage", href: pagePath },
        ]}
        cover={
          <figure className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.2)]">
            <Image
              src={HERO_IMAGE}
              alt="BeWork — relais administratif BTP pour l’analyse DCE et l’appui chiffrage des devis travaux"
              width={HERO_WIDTH}
              height={HERO_HEIGHT}
              className="h-auto w-full"
              priority
              sizes="(max-width: 768px) 100vw, 768px"
            />
          </figure>
        }
      >
        <section className="not-prose mb-10">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-[13px] leading-relaxed text-slate-600 shadow-sm">
            Compléments utiles :{" "}
            <Link href="/ressources/analyse-dce-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
              guide analyse DCE
            </Link>
            ,{" "}
            <Link href="/ressources/chiffrage-devis-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
              méthode chiffrage devis
            </Link>
            ,{" "}
            <Link href="/devis-retard-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
              devis en retard
            </Link>
            ,{" "}
            <Link href="/services/chiffrage-devis-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
              service chiffrage BeWork
            </Link>
            .
          </div>
        </section>

        <h2>À quoi sert l&apos;analyse DCE avant chiffrage ?</h2>
        <p>
          Un DCE regroupe les pièces nécessaires pour comprendre le marché ou le projet à chiffrer : CCTP, plans, DPGF, BPU, DQE,
          règlement de consultation, CCAP, notices, contraintes de chantier, exigences administratives, délais et pièces à fournir.
        </p>
        <p>
          Le problème, c&apos;est que ces informations sont dispersées. Une entreprise peut perdre du temps à chercher ce qu&apos;elle
          doit réellement chiffrer, ce qui est compris dans son lot, ce qui est exclu, ce qui manque ou ce qui doit être demandé en
          clarification. L&apos;analyse DCE transforme un dossier dense en une base claire pour préparer le devis.
        </p>

        <h2>Ce que BeWork peut faire sur un DCE</h2>
        <div className="not-prose my-6 grid gap-4 sm:grid-cols-2">
          <ChecklistCard
            title="Lecture et structuration"
            items={[
              "Lecture et tri des pièces du DCE",
              "Repérage des lots concernés",
              "Extraction des prestations à chiffrer",
              "Identification des unités (forfait, m², ml, m³, u, ens)",
            ]}
          />
          <ChecklistCard
            title="Contrôles et alertes"
            items={[
              "Comparaison CCTP, plans et bordereaux",
              "Repérage des postes oubliés ou ambigus",
              "Signalement des incohérences",
              "Préparation des questions MOE / client",
            ]}
          />
        </div>
        <p>
          L&apos;objectif n&apos;est pas de remplacer le savoir-faire de l&apos;entreprise. C&apos;est d&apos;éviter de perdre du temps
          dans la lecture, le tri, la mise en forme et les tâches répétitives qui ralentissent la sortie du devis.
        </p>

        <h2>Ce que BeWork peut faire sur le chiffrage</h2>
        <ul>
          <li>Création d&apos;un tableau de prix structuré</li>
          <li>Proposition de prix estimatifs à partir des informations disponibles</li>
          <li>Intégration de prix issus d&apos;une bibliothèque interne, d&apos;un BPU ou de prix transmis par l&apos;entreprise</li>
          <li>Distinction fourniture / pose / fourniture + pose</li>
          <li>Hypothèses de chiffrage et postes sensibles</li>
          <li>Préparation d&apos;un devis lisible et d&apos;une synthèse avant validation</li>
        </ul>
        <p>
          Cette base doit ensuite être relue, ajustée et validée par l&apos;entreprise — seule elle connaît ses coûts réels, ses
          équipes, ses fournisseurs, ses marges et son niveau d&apos;engagement.
        </p>

        <h2>Ce que BeWork ne remplace pas</h2>
        <div className="not-prose my-6 rounded-2xl border border-amber-200 bg-amber-50/80 p-6">
          <p className="text-sm font-semibold text-amber-900">BeWork n&apos;est pas là pour se substituer à l&apos;entreprise</p>
          <ul className="mt-3 space-y-1.5 text-sm text-amber-900">
            <li>— Le dirigeant, le chargé d&apos;affaires, le conducteur de travaux</li>
            <li>— L&apos;économiste de la construction mandaté ou le bureau d&apos;études</li>
            <li>— La validation technique, la politique de prix et la marge commerciale</li>
            <li>— L&apos;engagement final de l&apos;entreprise</li>
          </ul>
          <p className="mt-4 text-sm text-amber-800">
            Notre intervention est un appui : nous préparons, structurons, vérifions, alertons et mettons en forme. L&apos;entreprise
            décide, corrige, valide et engage son offre.
          </p>
        </div>

        <h2>Pourquoi les entreprises perdent du temps sur leurs devis BTP</h2>
        <p>
          Dans beaucoup d&apos;entreprises du bâtiment, le devis arrive en plus du reste : chantiers en cours, clients, matériaux,
          sous-traitants, fournisseurs, urgences et futures affaires. Résultat : devis qui sortent trop tard, DCE non analysés
          jusqu&apos;au bout, postes repris dans l&apos;urgence, hypothèses non écrites, documents dispersés, dirigeant ou chargé
          d&apos;affaires seul face à la charge.
        </p>
        <p>
          BeWork intervient sur cette zone de surcharge pour transformer un dossier complexe en support de travail clair,
          exploitable et plus rapide à valider.
        </p>

        <h2>Les points d&apos;alerte à repérer avant de chiffrer</h2>
        <ul>
          <li>Prestations mal définies ou quantités incohérentes</li>
          <li>Unités absentes ou contradictoires</li>
          <li>Limites de prestations floues, plans manquants, variantes non précisées</li>
          <li>Contraintes de délai, mémoire technique, documents administratifs</li>
          <li>Garanties, assurances, clauses pénalisantes</li>
          <li>Pièces à demander avant de finaliser l&apos;offre</li>
        </ul>
        <p>Ces alertes permettent de ne pas chiffrer à l&apos;aveugle et de préparer des questions utiles avant remise.</p>

        <h2>Exemple de livrable BeWork</h2>
        <div className="not-prose my-6 grid gap-4 sm:grid-cols-2">
          <ChecklistCard
            title="1. Synthèse du DCE"
            items={["Résumé projet, nature des travaux", "Pièces analysées, lot concerné", "Contraintes principales"]}
          />
          <ChecklistCard
            title="2. Tableau des prestations"
            items={["Postes à reprendre dans le devis ou la DPGF", "Unités et quantités repérées"]}
          />
          <ChecklistCard
            title="3. Base de chiffrage"
            items={["Prix unitaires, totaux, hypothèses", "Niveau de confiance par poste"]}
          />
          <ChecklistCard
            title="4. Points à vérifier & questions"
            items={["Incohérences, documents manquants", "Questions MOE / client avant finalisation"]}
          />
        </div>
        <p>
          Une <strong>synthèse pour validation</strong> récapitule les arbitrages à faire par l&apos;entreprise avant remise officielle.
        </p>

        <h2>Dans quels cas demander un appui chiffrage ?</h2>
        <ul>
          <li>DCE dense ou délai court de réponse</li>
          <li>Devis en retard ou manque de temps pour tout lire</li>
          <li>Besoin de structurer une DPGF ou un tableau clair avant validation</li>
          <li>Repérage d&apos;oublis, incohérences ou questions à poser</li>
          <li>Soulager le dirigeant, le chargé d&apos;affaires ou le conducteur de travaux</li>
        </ul>
        <p>
          BeWork peut intervenir ponctuellement sur un dossier, ou régulièrement comme{" "}
          <Link href="/services/assistant-travaux">renfort administratif travaux</Link>.
        </p>

        <h2>Une mission test possible</h2>
        <p>Pour découvrir la méthode, il est possible de commencer par :</p>
        <ul>
          <li>l&apos;analyse d&apos;un lot ou d&apos;un extrait de DCE ;</li>
          <li>la préparation d&apos;une DPGF ;</li>
          <li>la structuration d&apos;un tableau de chiffrage ;</li>
          <li>le repérage des points d&apos;alerte et des questions à poser.</li>
        </ul>

        <h2>Notre cadre d&apos;intervention</h2>
        <p>
          BeWork intervient comme assistant travaux externalisé. Nos livrables sont des bases de travail professionnelles ; la
          validation finale reste toujours du côté de l&apos;entreprise. Prix, quantités, méthodes, marges, fournisseurs, délais et
          engagements contractuels doivent être vérifiés avant remise officielle.
        </p>

        <h2>Conclusion</h2>
        <p>
          L&apos;analyse DCE et le chiffrage BTP demandent rigueur, expérience et temps. BeWork aide les entreprises du bâtiment à
          gagner du temps en structurant les pièces, en préparant les tableaux et en repérant les points sensibles — sans remplacer
          la responsabilité technique et commerciale de l&apos;entreprise.
        </p>

        <section className="not-prose" id="faq" style={{ scrollMarginTop: "6rem" }}>
          <h2 className="mt-12 border-b border-slate-200 pb-3 text-xl font-bold">{TUTO_TITRE.faq}</h2>
          <dl className="mt-5 space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <dt className="font-semibold text-black">{item.q}</dt>
                <dd className="mt-2 text-sm text-slate-700">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="not-prose" aria-label="CTA appui chiffrage">
          <div className="mt-10 rounded-2xl border border-[#1d4ed8]/20 bg-gradient-to-br from-[#eff6ff] to-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Vous avez un DCE à analyser ou un devis à préparer ?</h2>
            <p className="mt-3 text-base leading-relaxed text-slate-700">
              BeWork peut vous aider à structurer une base claire avant validation — analyse des pièces, tableau de chiffrage,
              points d&apos;alerte et questions à poser.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <CalendlyBookingLink className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-semibold text-white hover:bg-[#1e40af]">
                Demander un appui chiffrage
              </CalendlyBookingLink>
              <Link
                href="/services/analyse-dce-btp"
                className="inline-flex rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50"
              >
                Voir le service analyse DCE
              </Link>
              <Link href="/contact" className="inline-flex rounded-lg border border-slate-200 px-6 py-3 font-semibold text-slate-900 hover:bg-slate-50">
                Nous contacter
              </Link>
            </div>
          </div>
        </section>
      </SeoLandingPage>
    </>
  );
}
