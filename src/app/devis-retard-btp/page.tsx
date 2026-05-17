import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { BtpPainLandingMaillage } from "@/components/seo/BtpPainLandingMaillage";
import { SeoLandingPage } from "@/components/seo/SeoLandingPage";
import { BTP_PAIN_PAGE_PATHS } from "@/lib/btp-pain-pages";
import { landingPageMetadataFromPath } from "@/lib/seo-landing-metadata";

const PAGE_PATH = BTP_PAIN_PAGE_PATHS.devisRetard;

export const metadata = landingPageMetadataFromPath(PAGE_PATH);

export default function Page() {
  const faq = [
    {
      q: "Pourquoi mes devis BTP prennent-ils du retard ?",
      a: "Souvent, ce n’est pas le chiffrage en lui-même : ce sont les infos manquantes, les demandes dispersées, les prix à récupérer, et les urgences chantier qui interrompent le devis commencé. Sans suivi, le brouillon reste en suspens.",
    },
    {
      q: "Comment sortir mes devis travaux plus rapidement ?",
      a: "Centralisez les demandes, vérifiez les pièces manquantes, utilisez une checklist, fixez une date d’envoi, et tenez un tableau de suivi. La méthode compte autant que le temps de chiffrage.",
    },
    {
      q: "BeWork peut-elle préparer un devis à ma place ?",
      a: "BeWork peut organiser la demande, rassembler les pièces, préparer la mise en forme et le mail d’envoi. Le chiffrage technique, le prix et la marge restent chez vous, avec validation finale.",
    },
    {
      q: "Qui valide le prix et la marge ?",
      a: "Vous. BeWork prépare et structure, mais ne fixe pas vos prix ni vos marges et ne prend pas d’engagement à votre place.",
    },
    {
      q: "Que faire si des informations manquent pour établir le devis ?",
      a: "Lister ce qui manque, le demander immédiatement (client/fournisseur), et bloquer le devis avec une prochaine action datée. BeWork peut préparer la liste, relancer et suivre jusqu’à obtention des éléments.",
    },
    {
      q: "Quelle différence entre devis en retard et devis non relancé ?",
      a: "Le devis en retard n’est pas (ou pas encore) envoyé. Le devis non relancé a été envoyé mais n’est pas suivi. Les deux se traitent avec une méthode et des statuts ; la relance vient ensuite.",
    },
  ] as const;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <SeoLandingPage
      description="Devis travaux en retard : pourquoi ça bloque, ce que ça coûte, et une méthode simple pour sortir vos devis plus vite sans perdre le contrôle."
      breadcrumbItems={[
        { name: "Accueil", href: "/" },
        { name: "Devis en retard — BTP", href: PAGE_PATH },
      ]}
      h1="Devis BTP en retard : ne laissez pas vos opportunités refroidir"
      intro={
        <>
          Un devis qui tarde à sortir fait douter le client. Dans le BTP, la rapidité de réponse peut faire la différence
          entre rester dans la short list et être oublié — même à prix équivalent. BeWork aide à structurer la{" "}
          <strong>préparation</strong>, le <strong>suivi</strong> et l’<strong>envoi</strong> des devis travaux, sans remplacer le
          chiffrage technique ni la validation finale.
        </>
      }
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <h2>Pourquoi les devis BTP prennent du retard</h2>
      <ul>
        <li>Le chef d’entreprise est sur chantier : le devis passe après l’urgence terrain.</li>
        <li>Demandes dispersées entre téléphone, mails et WhatsApp.</li>
        <li>Photos, métrés ou détails techniques manquants.</li>
        <li>Prix fournisseurs à demander / délais à confirmer.</li>
        <li>Devis commencé mais non finalisé (interruptions, priorités qui changent).</li>
        <li>Absence de tableau de suivi et de dates d’envoi.</li>
      </ul>

      <h2>Ce que le retard provoque</h2>
      <ul>
        <li>Le client doute et compare ailleurs.</li>
        <li>Un concurrent répond avant : chantier perdu.</li>
        <li>Image moins professionnelle et commercial irrégulier.</li>
        <li>Devis fait dans l’urgence : risque d’oublis et de marge qui baisse.</li>
      </ul>

      <h2>Une méthode simple pour sortir les devis plus vite</h2>
      <ul>
        <li>Centraliser les demandes (une “file unique”).</li>
        <li>Vérifier les pièces manquantes et les demander tout de suite.</li>
        <li>Utiliser une checklist devis (infos, pièces, options).</li>
        <li>Classer les priorités (impact, urgence, valeur).</li>
        <li>Fixer une date limite d’envoi et la tenir.</li>
        <li>Une fois envoyé : passer au suivi et à la relance.</li>
      </ul>

      <h2>Ce que BeWork peut prendre en charge (devis en retard)</h2>
      <ul>
        <li>Organiser les demandes de devis et centraliser les pièces (photos, infos, échanges)</li>
        <li>Préparer la liste des informations manquantes</li>
        <li>Mettre en forme le devis (sur votre modèle) et préparer le mail d’envoi</li>
        <li>Préparer les relances fournisseurs (prix, disponibilités, délais)</li>
        <li>Tenir un tableau de suivi (statuts, dates, prochaines actions)</li>
        <li>Alerter sur les devis en retard et prioriser</li>
        <li>
          Préparer la suite après envoi :{" "}
          <Link href="/relance-devis-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
            relance devis BTP
          </Link>
        </li>
      </ul>

      <h2>Ce que vous gardez</h2>
      <ul>
        <li>Chiffrage technique</li>
        <li>Prix, marge, choix des matériaux et méthode</li>
        <li>Validation finale, signature et engagements contractuels</li>
      </ul>

      <h2>Exemple concret</h2>
      <p>
        Un client demande un devis après une visite chantier. BeWork peut centraliser les photos, noter les informations manquantes, préparer le
        brouillon, demander les prix fournisseurs et vous rappeler la date d’envoi prévue. Vous gardez la main sur le prix et la validation.
      </p>

      <h2>Questions fréquentes</h2>
      <dl className="space-y-6">
        {faq.map((item) => (
          <div key={item.q}>
            <dt className="font-semibold text-black">{item.q}</dt>
            <dd className="mt-2 text-black leading-relaxed">{item.a}</dd>
          </div>
        ))}
      </dl>

      <div className="not-prose my-10 flex flex-wrap gap-4">
        <CalendlyBookingLink className="inline-flex rounded-lg bg-[#1d4ed8] px-6 py-3 font-bold text-white hover:bg-[#1e40af]">
          Réserver un appel
        </CalendlyBookingLink>
        <Link
          href="/assistants-administratifs-taches"
          className="inline-flex rounded-lg border border-slate-200 bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-50"
        >
          Voir les missions
        </Link>
        <Link href="/notre-facon-de-travailler" className="inline-flex rounded-lg border border-slate-200 bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-50">
          Voir la méthode
        </Link>
        <Link href="/tarifs" className="inline-flex rounded-lg border border-slate-200 bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-50">
          Voir les forfaits
        </Link>
      </div>

      <BtpPainLandingMaillage currentHref={PAGE_PATH} />
    </SeoLandingPage>
  );
}
