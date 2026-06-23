import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { BeWorkStatsGrid } from "@/components/marketing/BeWorkStatsGrid";

const pagePath = "/ressources/tuto-skill-analyse-express-cctp-bework";

const pdfPath = "/ressources/pdf/tuto-skill-analyse-express-cctp-bework.pdf";

const pageUrl = absoluteUrl(pagePath);

const PROMPT_CALIBRATION_TEXT = `Je veux que tu m'aides à créer un skill Claude qui s'appelle "analyse-
express-cctp".

Mon métier : [tes lots — gros œuvre, cloisons, étanchéité,
électricité, etc.]

Ma zone : [Île-de-France, Grand Ouest, etc.]

Mon CA annuel : [X M€]

Type de marchés : [privé / public / les deux]

Ce que le skill doit faire à chaque CCTP que je lui soumettrai :

1. Extraire la liste exhaustive des prestations à chiffrer, organisée
par lot

2. Sortir les matériaux et produits imposés (marques, références,
certifications)

3. Lister toutes les normes, DTU et AQS cités, avec la référence et le
contexte

4. Identifier les clauses pénalisantes : pénalités de retard, retenue
de garantie, prestations à charge de l'entreprise, garanties spécifiques

5. Repérer les ambiguïtés et les transformer en questions à poser au MOE

6. Produire une fiche Go / No Go d'1 page : score de risque, points
durs, marge attendue

Voici les fichiers que je te transmets :

[joindre 2-3 CCTP déjà décortiqués + ta nomenclature + ton modèle de
synthèse]

Crée le skill, propose-moi la structure avant de coder, et explique-moi
en français comment je l'utiliserai au quotidien.`;

const PROMPT_USAGE_QUOTIDIEN_TEXT = `/analyse-express-cctp

Voici le CCTP du marché [nom du chantier], MOA [nom], MOE [nom].

Lot concerné : [ton lot].

Date limite remise offre : [date].

Mes priorités : [coût, délai, complexité technique, etc.]

[joindre le CCTP en PDF]

Donne-moi la sortie complète + la fiche Go / No Go.`;

const PROMPT_EXEMPLE_AJUSTEMENT_TEXT = `Modifie le skill : ajoute en sortie un tableau Excel avec une colonne
"poste DPGF" qui reprend exactement ma nomenclature interne (lots 01 à
12).

Pour chaque prestation extraite du CCTP, propose le poste DPGF correspondant.

Si une prestation n'a pas d'équivalent dans ma nomenclature, marque-la
"NOUVEAU POSTE — à arbitrer".`;

const H1 = "Crée ton skill — Analyse express · CCTP";


const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Combien de temps pour créer le skill complet ?",
    answer:
      "Compte 1h30 à 2h pour la première création : 30 min pour rassembler la matière (CCTP, nomenclature, modèle de sortie), 30 min pour la conversation de cadrage avec Claude, 30 min pour l'ajustement et un premier test. Les CCTP suivants sont analysés en 15-20 minutes chacun. Tu rentabilises ton investissement dès le deuxième CCTP traité.",
  },
  {
    question: "Le skill remplace-t-il le métreur ?",
    answer:
      "Non, et il n'a pas vocation à le faire. Le skill fait l'extraction et la synthèse — le métreur fait le chiffrage, la quantification précise, l'arbitrage technique et la connaissance des fournisseurs locaux. Le skill libère le métreur des heures de lecture pour qu'il puisse se concentrer sur la partie à forte valeur ajoutée.",
  },
  {
    question: "Et si le CCTP est mal écrit ou incomplet ?",
    answer:
      "C'est précisément là que le skill apporte le plus de valeur. Il liste systématiquement les ambiguïtés et les transforme en questions à poser au maître d'œuvre avant remise d'offre. Tu peux aussi lui demander un courrier formel de demande de précisions, prêt à envoyer.",
  },
  {
    question: "Est-ce que mes données sont confidentielles ?",
    answer:
      "Sur un compte Claude Pro, les conversations ne sont pas utilisées pour l'entraînement du modèle. Pour des marchés très sensibles (défense, données stratégiques), les offres Team et Enterprise peuvent prévoir des garanties renforcées. Pour un usage BTP standard, le compte Pro est en général largement adapté.",
  },
  {
    question: "Le skill fonctionne-t-il pour les marchés publics ?",
    answer:
      "Oui — il est encore plus utile quand le CCTP est dense, les délais courts et les pénalités élevées. Précise dans le prompt initial que tu travailles sur des marchés publics : le skill pourra prendre en compte les clauses spécifiques (BPU, DQE, sous-traitance, fournitures chantier selon tes consignes).",
  },
  {
    question: "Et si je n'ai pas le temps de tout mettre en place moi-même ?",
    answer:
      "C'est le rôle pouvant être joué par BeWork : transmission du dossier après réception, puis livraison d'une synthèse, liste des prestations à chiffrer et aide à la décision Go / No Go sous un créneau cadré — vous gardez la main sur le chiffrage final et le prix.",
  },
] as const;

export const metadata = tutoPageMetadata(pagePath);

function PromptBlock({ label, promptText }: { label: string; promptText: string }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-300 bg-slate-100 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
        <CopyPromptButton text={promptText} />
      </div>
      <pre className="max-h-[min(70vh,520px)] overflow-auto whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-slate-800">
        {promptText}
      </pre>
    </div>
  );
}

export default function TutoSkillAnalyseExpressCctpBeworkPage() {
  const webPageBread = buildWebPageAndBreadcrumbJsonLd({
    pagePath,
    h1: H1,
    description: getTutoPageDescription(pagePath),
    breadcrumbItems: [...breadcrumbItems],
  });

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: H1,
    description: getTutoPageDescription(pagePath),
    url: pageUrl,
    author: { "@type": "Organization" as const, name: "BeWork", url: SITE_URL },
    publisher: {
      "@type": "Organization" as const,
      name: "BeWork",
      url: SITE_URL,
      logo: { "@type": "ImageObject" as const, url: absoluteUrl("/opengraph-image") },
    },
    inLanguage: "fr-FR",
    image: absoluteUrl("/opengraph-image"),
    isAccessibleForFree: true,
    numberOfPages: 9,
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_FOR_JSON_LD.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: H1,
    description: getTutoPageDescription(pagePath),
    step: [
      { "@type": "HowToStep", name: "Activer la fonction Skills dans Claude" },
      { "@type": "HowToStep", name: "Rassembler ta matière" },
      { "@type": "HowToStep", name: "Lancer la conversation avec Claude" },
      { "@type": "HowToStep", name: "Affiner et activer ton skill" },
      { "@type": "HowToStep", name: "Tester sur un vrai CCTP" },
    ],
  };

  const graphJson = {
    "@context": "https://schema.org",
    "@graph": [...((webPageBread as { "@graph": unknown[] })["@graph"] ?? []), articleLd, faqLd, howToLd],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(graphJson) }} />

      <div className="min-h-dvh bg-slate-50 text-slate-900">
        <MarketingSiteHeader plainBg />

        <main className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-20 pt-[calc(4.55rem+0.375rem)] sm:pb-28 sm:pt-[calc(4.55rem+0.5rem)] md:pt-[calc(4.55rem+0.625rem)]">
          <nav className="mb-6 text-sm text-slate-600 md:mb-8" aria-label="Fil d’Ariane">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {breadcrumbItems.map((crumb, idx) => (
                <li key={`${crumb.href}-${idx}`} className="flex items-center gap-2">
                  {idx ? <span className="select-none text-slate-400">&nbsp;/ </span> : null}
                  {idx === breadcrumbItems.length - 1 ? (
                    <span className="font-medium text-slate-900">{crumb.name}</span>
                  ) : (
                    <Link href={crumb.href} className="font-medium text-[#1d4ed8] hover:underline">
                      {crumb.name}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <header className="mb-12 w-full">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">
              Tuto PDF gratuit · Analyse express CCTP · BeWork
            </p>
            <h1 className="font-heading mt-3 text-balance text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Tutoriel pour décortiquer un CCTP long en une session courte avec Claude : liste des prestations, normes, clauses pénalisantes,
              questions MOE et fiche Go / No Go — PDF et transcription inclus.
            </p>
            <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-slate-600">
              Complément méthodo sur lecture de pièces : voir aussi{" "}
              <Link href="/ressources/analyse-dce-btp" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
                analyse de DCE
              </Link>{" "}
              et le{" "}
              <Link href="/ressources/tuto-skill-analyse-dce-bework" className="font-semibold text-[#1d4ed8] underline-offset-4 hover:underline">
                tuto PDF skill analyse de DCE
              </Link>{" "}
              — ici nous ciblons spécifiquement le <strong className="font-semibold text-slate-800">CCTP</strong>.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer DCE/CCTP ou assistance travaux chantier — sans engagement.
              </span>
            </div>
          </header>

          <section
            id="pdf-original"
            className="scroll-mt-[calc(4.55rem+1rem)] mb-14 rounded-3xl border border-slate-200 bg-slate-100/80 p-6 shadow-sm sm:p-10"
            aria-labelledby="pdf-heading"
          >
            <h2 id="pdf-heading" className="text-xl font-semibold tracking-tight text-slate-900">
              Voir le PDF original
            </h2>
            <p className="mt-3 w-full leading-relaxed text-slate-600">
              Consultez le guide dans sa mise en page originale. Vous pouvez l&apos;agrandir ou le télécharger. PDF · 9 pages
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 border-b border-slate-200/80 pb-6">
              <a
                href={pdfPath}
                download
                className="rounded-full bg-[#1f6fe0] px-6 py-[0.6875rem] text-xs font-semibold uppercase tracking-[0.18em] text-white hover:opacity-[0.96]"
              >
                Télécharger ce PDF
              </a>
              <a
                href={pdfPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex max-w-[min(100%,24rem)] items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold leading-snug text-[#475569] transition hover:bg-slate-50"
              >
                Ouvrir en plein écran avec le pdf complet
              </a>
            </div>
            <div className="mx-auto mt-8 w-full max-w-none">
              <iframe
                src={`${pdfPath}#toolbar=1&navpanes=0&scrollbar=1`}
                className="h-[650px] w-full rounded-2xl border border-slate-200 bg-white shadow-sm md:h-[900px]"
                title="Crée ton skill — Analyse express · CCTP — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                CCTP de 80 pages à digérer avant la date limite d&apos;offre&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                BeWork peut aider au déblayage documentaire (synthèse, risques, questions MOE), selon cadrage — vous gardez le chiffrage et les
                décisions Go / No Go.
              </p>
            </div>
            <div className="mt-5 shrink-0 sm:mt-0">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] w-full min-w-[12.5rem] items-center justify-center rounded-xl bg-[#1d4ed8] px-6 text-sm font-semibold text-white shadow-md shadow-[#1d4ed8]/22 transition hover:bg-[#1e40af] sm:w-auto md:px-8 md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
            </div>
          </aside>

          <section className="mb-14" aria-labelledby="tuto-heading">
            <h2 id="tuto-heading" className="mb-6 text-xl font-semibold tracking-tight text-slate-900">
              Texte intégral du tuto
            </h2>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
              <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-900">TUTO OFFERT PAR BEWORK</p>
              <h3 className="mt-8 text-center text-2xl font-bold text-slate-900 md:text-[1.65rem]">Crée ton skill</h3>
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">Analyse express · CCTP</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour décortiquer un CCTP de 80 pages — 20&nbsp;minutes au lieu de 3&nbsp;heures.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Faire ressortir les 100 prestations à chiffrer en 1 prompt</li>
                <li>▸ Détecter les clauses pénalisantes avant de signer</li>
                <li>▸ Lister les normes, DTU, certifications imposées</li>
                <li>▸ Générer une fiche Go / No Go en 1 page</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi un skill analyse express CCTP&nbsp;?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Le CCTP (Cahier des Clauses Techniques Particulières) fixe les matériaux, normes, méthodes, garanties, délais et pénalités. Une lecture
                incomplète conduit à sous-chiffrer ou prendre des risques contractuels. Sur un dossier courant le CCTP peut représenter plusieurs dizaines
                à plus d&apos;une centaine de pages — soit des heures de lecture pour une lecture sérieuse avant offre.
              </p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Une analyse structurée par skill ne remplace pas l&apos;expert métier&nbsp;: elle accélère l&apos;extraction et organise la liste de ce qui doit être
                chiffré, questionné ou arbitré avant envoi du prix.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Avec un skill bien construit, voilà ce qui change</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>
                  ▸ Tu obtiens vite une liste de prestations à chiffrer, organisée par lot, alignée sur ta nomenclature quand elle est fournie.
                </li>
                <li>▸ Normes, DTU, AQS et certifications citées peuvent être recensées avec leurs références et le contexte utile au chiffreur.</li>
                <li>▸ Les clauses à risque (pénalités, retenues, prestations sans contrepartie explicite) peuvent être mises en évidence.</li>
                <li>
                  ▸ Les formulations floues se transforment en questions à envoyer au maître d&apos;œuvre avant remise — ce qui limite les mauvaises surprises après
                  signature.
                </li>
                <li>▸ Une synthèse Go / No Go d&apos;une page aide la réunion d&apos;équipe (priorisation, niveau de risque perçu, points durs).</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] leading-relaxed text-slate-900">
                Ce skill ne remplace pas ton expertise métier. Il prend en charge une partie du déblayage documentaire la plus chronophage.
              </p>

              <h3 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Les 8 éléments à extraire d&apos;un CCTP</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                (1) Description des ouvrages par lot&nbsp;· (2) Matériaux et produits imposés (marques, références)&nbsp;· (3) Normes, DTU, AQS, avis techniques
                &nbsp;· (4) Méthodologies d&apos;exécution imposées&nbsp;· (5) Garanties (parfait achèvement, biennale, décennale)&nbsp;· (6) Pénalités et retenues&nbsp;· (7)
                Prestations annexes (échafaudages, nettoyage, repli…)&nbsp;· (8) Limites de prestation (interfaces avec les autres lots).
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Active la fonction Skills dans Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Claude Pro environ 18&nbsp;€/mois est en pratique requis pour exécuter des skills utilisateur. Active les fonctionnalités attendues depuis{" "}
                <strong className="font-semibold text-slate-800">Settings → Capabilities</strong> selon ta version&nbsp;: au minimum{" "}
                <strong className="font-semibold text-slate-800">Code execution</strong>, <strong className="font-semibold text-slate-800">Skills</strong> et{" "}
                <strong className="font-semibold text-slate-800">File creation</strong> lorsque tu veux des sorties téléchargeables.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Si tu ne vois pas Skills</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Vérifie le modèle sélectionné (ex.&nbsp;line-up Sonnet récent préférable aux versions trop limitées) et reconnecte ta session après mise à jour
                des préférences&nbsp;: l&apos;interface évolue.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Rassemble ta matière
              </h3>

              <p className="mt-6 text-[1.0625rem] font-semibold text-slate-900">1. Deux ou trois CCTP récents que tu as déjà décortiqués</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Avec synthèses internes si possible&nbsp;: Claude calera tes regroupements, ton niveau de détail et ton langage métier.
              </p>

              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">2. Ta nomenclature interne par lot</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Units (m², ml, ensemble, unité…) et rattachements DPGF pour que les sorties soient copier-coller en passation prix.
              </p>

              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">3. Tes références normatives récurrentes</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                DTU ou marques qui reviennent souvent dans ton métier&nbsp;: aide à mieux faire ressortir tout ce qui est imposé ou recommandé.
              </p>

              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">4. Liste de clauses qui t&apos;ont déjà coûté cher</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Pénalités, retenue de garantie, charge locative, équipements de chantier, nettoyage final — ce que tu veux systématiquement flaguer.
              </p>

              <p className="mt-8 text-[1.0625rem] font-semibold text-slate-900">5. Ton format de synthèse CCTP société</p>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Word ou Excel utilisé avec ton équipe chiffrage&nbsp;: Claude pourra mieux refléter la structure exacte avant diffusion interne.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance la conversation avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Nouvelle conversation, pièces jointes, puis le prompt suivant&nbsp;— adapte les crochets. Demande bien une{" "}
                <strong className="font-semibold text-slate-800">proposition de structure avant figement</strong> du skill (cf. tutoriel papier complet).
              </p>
              <PromptBlock label="PROMPT À COLLER DANS CLAUDE" promptText={PROMPT_CALIBRATION_TEXT} />

              <p className="mt-8 text-xl font-semibold uppercase tracking-wide text-slate-900">Le point clé</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Valider la logique métier avant de «&nbsp;coder&nbsp;» le skill évite de tout réécrire. Réserve quelques dizaines de minutes avec Claude durant cette phase
                de cadrage.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Affine et active ton skill
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Contrôle que la structure colle à votre DPGF, que les unités et références normatives sont utiles aux chiffreurs, que les clauses pénalisantes ne
                se perdent pas dans du texte, et que la fiche Go / No Go synthétique est réellement actionnable pour la direction ou le terrain.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Liste de contrôle indicative</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Organisation par lots comme vos tableaux prix.</li>
                <li>▸ Unités visibles ligne à ligne où c&apos;est pertinent.</li>
                <li>▸ Produits prescrits cités précisément plutôt qu&apos;en flux libre dispersé.</li>
                <li>▸ Normes et DTU repérées avec lien vers paragraphe ou page lorsque disponible dans le fichier.</li>
                <li>▸ Zones de risques distinctes ou surlignement logique pour relecture rapide.</li>
                <li>▸ Fiche décision courte avec niveau ou score de risque explicite, pas seulement un commentaire littéraire générique.</li>
              </ul>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Exemple d&apos;ajustement à demander</p>
              <PromptBlock label="EXEMPLE D&apos;AJUSTEMENT" promptText={PROMPT_EXEMPLE_AJUSTEMENT_TEXT} />

              <p className="mt-10 text-[1.0625rem] leading-relaxed text-slate-900">
                Une fois la structure bonne&nbsp;: invite Claude à produire/activer ton skill («&nbsp;active maintenant le skill analyse-express-cctp&nbsp;» puis sauvegarde).
                Invocation possible via slash command ou équivalent selon l&apos;interface où tu travailles&nbsp;: le PDF détaille l&apos;
                <strong className="font-semibold text-slate-800">/analyse-express-cctp</strong>.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Teste sur un vrai CCTP
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Démarrez par un dossier où vous savez déjà ce que contenait votre lecture humaine précédente &mdash; vous comparerez point par point où le skill
                est précis ou où encore affiner vos consignes. Joignez typiquement le PDF (Claude peut traiter des documents très longs), précise le lot concerné et
                la deadline d&apos;offre.
              </p>
              <p className="mt-10 text-lg font-semibold text-slate-900">Prompt pour l&apos;usage courant</p>
              <PromptBlock label="PROMPT — UTILISATION QUOTIDIENNE" promptText={PROMPT_USAGE_QUOTIDIEN_TEXT} />

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ton skill doit vivre avec ton entreprise&nbsp;: quelques minutes tous les trois mois pour ajouter une consigne (nouveau type de clauses, mise à jour
                de nomenclature, format de tableau demandé aux chiffreurs) suffit souvent à transformer un correctif ponctuel en avantage régulier.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">FAQ — les six questions récurrentes</h3>

              {FAQ_FOR_JSON_LD.map((q) => (
                <div key={q.question} className="mt-10 border-t border-slate-100 pt-10 first:mt-8 first:border-t-0 first:pt-0">
                  <h4 className="text-[1.05rem] font-semibold text-slate-900">{q.question}</h4>
                  <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">{q.answer}</p>
                </div>
              ))}

              <p className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Pas le temps de le faire vous-même&nbsp;?</p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Faire appel à un Assistant Travaux BeWork</p>
              <p className="mt-3 text-[1.0625rem] font-medium text-slate-800">
                Assistant travaux BTP · Relais dossiers chantier · Augmenté par l&apos;IA
              </p>

              <p className="mt-10 text-2xl font-bold uppercase tracking-tight text-slate-900">ON TIENT LE BUREAU, VOUS TENEZ LE CHANTIER</p>
              <ul className="mt-6 list-none space-y-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Vous nous transmettez le DCE dès réception, photos et notes vocales bienvenues.</li>
                <li>▸ On extrait, on synthétise, on flague les risques en 24&nbsp;à 48&nbsp;h selon complexité.</li>
                <li>▸ Vous décidez Go / No Go en réunion d&apos;équipe, sans tout relire ligne à ligne tout seul après les heures de bureau.</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">
                Réservez un appel de cadrage de 20&nbsp;minutes sur{" "}
                <Link href={SITE_URL} className="text-[#1d4ed8] underline underline-offset-4 hover:no-underline">
                  bework.fr
                </Link>
              </p>

              <BeWorkStatsGrid />
            </div>
          </section>

          <div className="mt-28 flex justify-center pb-14">
            <BeWorkLogo className="opacity-95" aria-label="Logo BeWork" />
          </div>
        </main>
      </div>
    </>
  );
}
