import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";

const pagePath = "/ressources/tuto-tri-dce-claude-chrome-bework";

const pageUrl = absoluteUrl(pagePath);

const pdfPath = "/ressources/pdf/tuto-tri-dce-claude-chrome-bework.pdf";

const PROMPT_PREMIER_TRI_TEXT = `Je suis dirigeant d'une entreprise BTP en [TON MÉTIER],
basée en [VILLE].
Je veux que tu scannes les nouveaux DCE publiés sur cette
plateforme et que tu sélectionnes uniquement ceux qui
correspondent à mes critères :
- Zone géographique : [DÉPARTEMENTS]
- Lots métiers recherchés : [LISTE PRÉCISE]
- Montant minimum : [MONTANT] € HT
- Délai de remise minimum : [JOURS] jours
- Type de marché : [PUBLIC / PRIVÉ / MAPA]
À éliminer automatiquement :
- [TES CRITÈRES DE NO GO]
Pour chaque DCE retenu, donne-moi :
1. L'objet du marché
2. Le maître d'ouvrage
3. Le montant estimé si indiqué
4. La date limite de remise
5. Le lien direct vers la fiche
Présente le résultat sous forme de tableau. Si aucun DCE
ne correspond, dis-le simplement.`;

const PROMPT_MISE_A_JOUR_RACCOURCI_TEXT = `Modifie mon raccourci « Veille DCE matin » avec les ajustements
suivants :
- [AJUSTEMENT 1]
- [AJUSTEMENT 2]
- [AJUSTEMENT 3]
Ré-enregistre la nouvelle version sous le même nom.`;

const H1 = "Trie tes DCE avec Claude in Chrome";


const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Claude peut-il vraiment naviguer seul sur le BOAMP ?",
    answer:
      "Oui. L'extension fonctionne dans ton Chrome, avec ta session ouverte. Elle clique, scrolle, lit les fiches comme un humain — mais bien plus vite. Si une plateforme exige une connexion ou affiche un CAPTCHA, Claude s'arrête et te demande de gérer manuellement. Une fois fait, il reprend.",
  },
  {
    question: "Mes données BOAMP sont-elles confidentielles ?",
    answer:
      "Le BOAMP est une plateforme publique — toutes les fiches que Claude lit sont accessibles à n'importe qui. Aucun risque de confidentialité particulier. Pour les plateformes privées (extranet client), Claude lit ce que tu vois avec ta session, mais Anthropic ne réutilise pas ces données pour entraîner ses modèles sur les plans payants.",
  },
  {
    question: "Et si la plateforme change son interface ?",
    answer:
      "Les plateformes BOAMP, PLACE, AWS sont assez stables. Si l'interface change, Claude peut hésiter ou rater un filtre. Tu réenregistres simplement le raccourci avec la nouvelle interface. Comptez 5 minutes pour mettre à jour.",
  },
  {
    question: "Combien de plateformes je peux scanner par tour ?",
    answer:
      "Sans limite technique, mais en pratique : 3 à 5 plateformes par scan reste rapide (5-10 minutes au total). Au-delà, Claude met plus de temps et la fenêtre devient ingérable. Mieux vaut programmer 2 raccourcis : « Veille marchés publics » (BOAMP + PLACE) à 8h, et « Veille collectivités » (AWS + autres) à midi.",
  },
  {
    question: "Que se passe-t-il si je n'ouvre pas Chrome ?",
    answer:
      "La planification automatique nécessite que Chrome soit ouvert au moment programmé. Pour une veille matinale, le bon réflexe est de laisser Chrome ouvert toute la nuit (sur l'ordinateur de bureau, pas le portable). Quand tu arrives le matin, le scan est déjà fait.",
  },
  {
    question: "L'extension est-elle vraiment fiable pour décider Go / No Go ?",
    answer:
      "Non. Et elle ne doit pas. Claude in Chrome trie et filtre. Pour chaque DCE retenu, tu télécharges le dossier complet et tu utilises ton skill Analyse DCE pour produire la fiche standardisée. Les deux outils sont complémentaires : l'un sélectionne les bons dossiers, l'autre les analyse en profondeur.",
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

export default function TutoTriDceClaudeChromeBeworkPage() {
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
      { "@type": "HowToStep", name: "Installer l'extension Claude in Chrome" },
      { "@type": "HowToStep", name: "Définir tes critères de tri" },
      { "@type": "HowToStep", name: "Lancer ton premier tri avec Claude" },
      { "@type": "HowToStep", name: "Enregistrer le workflow comme raccourci" },
      { "@type": "HowToStep", name: "Affiner au fil des semaines" },
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
              Tuto PDF gratuit · Claude in Chrome · DCE · BeWork
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Tutoriel BeWork : faire pré-filtrer BOAMP et les plateformes (zone, métier, montant, délai), enregistrer un raccourci et programmer une veille matinale — PDF en ligne et prompts à copier.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer votre besoin (AO, tri DCE, relais administratif BTP) — sans engagement.
              </span>
            </div>
          </header>

          <section
            id="pdf-original"
            className="mb-14 scroll-mt-[calc(4.55rem+1rem)] rounded-3xl border border-slate-200 bg-slate-100/80 p-6 shadow-sm sm:p-10"
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
                title="Trie tes DCE avec Claude in Chrome — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Besoin d&apos;aide pour paramétrer la veille DCE avec vos critères réels&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                Parlez-en avec BeWork sur un créneau de 20&nbsp;minutes : définition filtres BOAMP et complément avec analyse de dossiers.
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
              <h3 className="mt-8 text-center text-2xl font-bold text-slate-900 md:text-[1.65rem]">Trie tes DCE</h3>
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">avec Claude in Chrome</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour faire scanner le BOAMP automatiquement chaque matin — 3 dossiers utiles sur 47 publiés.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ La différence entre Claude in Chrome et un skill classique</li>
                <li>▸ 5 étapes pour installer et paramétrer ton tri</li>
                <li>▸ Le prompt exact à donner à Claude</li>
                <li>▸ Comment programmer la veille automatique chaque matin</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi Claude in Chrome pour le tri DCE&nbsp;?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Sur le BOAMP, 50 à 80 nouveaux DCE sont publiés chaque jour en France. La majorité ne te concerne pas : mauvais métier, mauvaise région,
                mauvais montant, mauvais délai. Tu passes 4h par semaine à ouvrir des PDF un par un pour finalement n&apos;en garder que 3. C&apos;est un travail de
                filtrage que personne n&apos;aime faire — et qui pourtant décide ta pipeline commerciale.
              </p>

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Avec Claude in Chrome, voilà ce qui change</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ L&apos;extension scanne les plateformes pendant que tu prends ton café.</li>
                <li>▸ Elle applique tes critères : zone, métier, montant, délai.</li>
                <li>▸ Elle ouvre les fiches qui correspondent et te les liste.</li>
                <li>▸ Tu reçois 3 à 5 DCE pertinents au lieu de 50 à filtrer.</li>
                <li>▸ Tu gagnes 3 à 4 heures par semaine.</li>
              </ul>
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">C&apos;est l&apos;IA qui fait le tri. Pas toi.</p>

              <h3 className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Claude in Chrome, ça n&apos;est pas un skill classique</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                Un skill, c&apos;est un mode d&apos;emploi que Claude utilise pour produire un document (mémoire, DUERP, CR). Claude in Chrome, c&apos;est une extension
                qui agit dans ton navigateur — elle lit, clique, scrolle, comme si elle naviguait à ta place. Pour le tri de DCE, c&apos;est exactement ce qu&apos;il faut :
                aller sur les plateformes, filtrer, ouvrir les fiches utiles.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Installe l&apos;extension Claude in Chrome
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Claude in Chrome est en bêta, disponible sur tous les plans payants Claude (Pro 18 €/mois, Max, Team, Enterprise). L&apos;installation prend 5
                minutes.
              </p>
              <p className="mt-8 text-xl font-semibold uppercase tracking-wide text-slate-900">Activer le connecteur dans Claude</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Ouvre claude.ai et connecte-toi.</li>
                <li>▸ Clique sur tes initiales en bas à gauche.</li>
                <li>▸ Sélectionne « Paramètres ».</li>
                <li>▸ Va dans l&apos;onglet « Connecteurs ».</li>
                <li>▸ Trouve « Claude in Chrome » dans la liste et clique sur « Configurer ».</li>
                <li>▸ Active le connecteur.</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Installer l&apos;extension dans Chrome</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Clique sur « Ajouter à Chrome » depuis la page de configuration.</li>
                <li>▸ Connecte-toi avec ton compte Claude quand l&apos;extension le demande.</li>
                <li>▸ Épingle l&apos;extension : icône puzzle dans la barre Chrome → punaise à côté de Claude.</li>
                <li>▸ Accorde les permissions demandées (lecture des onglets, navigation).</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Mode de permission recommandé</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Au premier lancement, Claude te demande de choisir entre « demander avant d&apos;agir » et « agir sans demander ». Choisis « demander avant
                d&apos;agir » : Claude te montre son plan avant chaque action et tu valides. Tu basculeras en mode autonome plus tard, quand tu auras confiance.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Définis tes critères de tri
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Avant de demander à Claude de scanner les plateformes, tu dois préciser ce que tu cherches. Plus tes critères sont stricts, plus son tri sera
                utile.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Les 5 critères à définir</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Zone géographique : départements ou régions précis (75, 78, 91, 92, 93, 94, 95).</li>
                <li>▸ Lots métiers : exactement les libellés qu&apos;on trouve dans les CCTP (revêtements de sols, faïence, étanchéité, électricité…).</li>
                <li>▸ Montant : seuil minimum (50 000 € HT) et maximum si tu en as un.</li>
                <li>▸ Délai de remise : minimum (15 jours) pour avoir le temps de chiffrer.</li>
                <li>▸ Type de marché : public, privé, MAPA, accord-cadre, sous-traitance.</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Les plateformes à cibler</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">Liste les plateformes que tu veux que Claude consulte. Les plus utilisées en BTP :</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ BOAMP (boamp.fr) — marchés publics nationaux.</li>
                <li>▸ PLACE (place.economie.gouv.fr) — marchés publics État.</li>
                <li>▸ AWS (marches-securises.fr) — collectivités locales.</li>
                <li>▸ Klekoon, e-marchespublics.com, achat-public — selon tes habitudes.</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Tes critères Go / No Go avancés</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Optionnel mais utile : précise tes éliminations automatiques. Exemples : pas de marchés à bons de commande inférieurs à 100 k€, pas de chantiers en
                site occupé hospitalier, pas de DCE imposant une qualification que tu n&apos;as pas.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Lance ton premier tri avec Claude
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Ouvre Chrome. Va sur le BOAMP. Clique sur l&apos;icône Claude dans la barre Chrome — le panneau latéral s&apos;ouvre. Colle ce prompt :
              </p>
              <PromptBlock label="PROMPT À COLLER DANS CLAUDE" promptText={PROMPT_PREMIER_TRI_TEXT} />
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Le point clé</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Claude lit la page comme un humain. Si la plateforme demande une connexion, il s&apos;arrête et te demande de te connecter. Si elle a un CAPTCHA,
                pareil. C&apos;est normal — ça protège contre les abus. Une fois connecté, tu reprends Claude là où il s&apos;est arrêté.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Enregistre le workflow comme raccourci
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Le vrai pouvoir de Claude in Chrome, c&apos;est l&apos;enregistrement de raccourci. Une fois ton workflow validé, tu peux le rejouer en un clic — et même le
                programmer pour qu&apos;il s&apos;exécute tout seul chaque matin.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Enregistrer le workflow</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Dans le panneau Claude, clique sur l&apos;icône d&apos;enregistrement.</li>
                <li>▸ Refais le scan en suivant les étapes de l&apos;étape 3.</li>
                <li>▸ Arrête l&apos;enregistrement quand le tableau est généré.</li>
                <li>▸ Sauvegarde le raccourci avec un nom clair (« Veille DCE matin »).</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Programmer la veille automatique</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Clique sur l&apos;icône d&apos;horloge en haut à droite du panneau Claude.</li>
                <li>▸ Sélectionne ton raccourci « Veille DCE matin ».</li>
                <li>▸ Définis la fréquence : quotidienne, à 8h.</li>
                <li>▸ Active la programmation.</li>
              </ul>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Ce qui va se passer</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Chaque matin à 8h, Claude scanne automatiquement les plateformes. Quand tu ouvres Chrome avec ton café, le panneau Claude affiche déjà ta
                sélection du jour. Tu n&apos;as plus rien à lancer.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Affine au fil des semaines
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                La première semaine, Claude va te proposer trop de DCE — ou en oublier qui correspondent. C&apos;est normal. Tu affines au fur et à mesure.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Les ajustements types après quelques jours</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Élargir un libellé métier : « revêtements » au lieu de « carrelage » pour ne plus rater les marchés multi-lots.</li>
                <li>▸ Restreindre une zone : enlever un département où tu as trop de concurrence.</li>
                <li>▸ Ajouter un critère de qualification : si Qualibat 2152 est exigé et que tu ne l&apos;as pas, élimination automatique.</li>
                <li>▸ Ajouter une règle sur le maître d&apos;ouvrage : exclure une mairie qui ne paie jamais à temps.</li>
              </ul>
              <p className="mt-10 text-lg font-semibold text-slate-900">Le bon prompt pour les ajustements</p>
              <PromptBlock label="PROMPT — MISE À JOUR DU RACCOURCI" promptText={PROMPT_MISE_A_JOUR_RACCOURCI_TEXT} />

              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">La règle d&apos;or</p>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Garde le contrôle. Claude trie, mais ce sont tes critères qui décident. Si un DCE pertinent passe à travers le filtre, c&apos;est qu&apos;un critère est mal
                calibré. Vérifie un échantillon de DCE filtrés la première semaine pour t&apos;assurer que rien d&apos;important n&apos;est éliminé à tort.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">Questions fréquentes</h3>
              {FAQ_FOR_JSON_LD.map((item, i) => (
                <div key={item.question} className={i === 0 ? "mt-8" : "mt-10"}>
                  <h4 className="text-[1.05rem] font-semibold text-slate-900">{item.question}</h4>
                  <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">{item.answer}</p>
                </div>
              ))}

              <p className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Pas le temps de le faire vous-même ?</p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Faire appel à un Assistant Travaux BeWork</p>
              <p className="mt-3 text-[1.0625rem] font-medium text-slate-800">
                Assistant travaux BTP · Relais dossiers chantier · Augmenté par l&apos;IA
              </p>

              <p className="mt-10 text-2xl font-bold uppercase tracking-tight text-slate-900">ON TIENT LE BUREAU, VOUS TENEZ LE CHANTIER</p>
              <ul className="mt-6 list-none space-y-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Vous nous donnez vos critères (zone, métiers, montant, délai, qualifications)</li>
                <li>▸ On installe Claude in Chrome, on paramètre la veille, on programme le scan automatique</li>
                <li>▸ Vous recevez 3 à 5 DCE pertinents chaque matin, vous décidez sans rien filtrer</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">
                Réservez un appel de cadrage de 20 minutes sur{" "}
                <Link href={SITE_URL} className="text-[#1d4ed8] underline underline-offset-4 hover:no-underline">
                  bework.fr
                </Link>
              </p>

              <div className="mt-14 grid gap-10 border-t border-slate-100 pt-10 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <div className="text-3xl font-extrabold leading-tight text-[#1d4ed8] sm:text-4xl">3 À 5 JOURS</div>
                  <div className="mt-2 text-xl font-bold uppercase tracking-wide text-slate-900">OPÉRATIONNEL</div>
                </div>
                <div>
                  <div className="text-5xl font-extrabold text-[#1d4ed8]">0</div>
                  <div className="mt-2 text-xl font-bold uppercase tracking-wide text-slate-900">RECRUTEMENT À FAIRE</div>
                </div>
                <div>
                  <div className="text-5xl font-extrabold text-[#1d4ed8]">100 %</div>
                  <div className="mt-2 text-xl font-bold uppercase tracking-wide text-slate-900">PILOTÉ EN FRANCE</div>
                </div>
              </div>
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
