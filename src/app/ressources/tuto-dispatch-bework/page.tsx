import { getTutoPageDescription, tutoPageMetadata } from "@/lib/seo-tuto-metadata";
import Link from "next/link";
import { BeWorkLogo } from "@/components/BeWorkLogo";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";
import { MarketingSiteHeader } from "@/components/layout/MarketingSiteHeader";
import { CopyPromptButton } from "@/components/ressources/CopyPromptButton";
import { buildWebPageAndBreadcrumbJsonLd } from "@/lib/seo-landing-json-ld";
import { absoluteUrl, SITE_URL } from "@/lib/site";
import { BeWorkStatsGrid } from "@/components/marketing/BeWorkStatsGrid";

const pagePath = "/ressources/tuto-dispatch-bework";

const pdfPath = "/ressources/pdf/tuto-dispatch-bework.pdf";

const pageUrl = absoluteUrl(pagePath);

const PROMPT_8_COMMANDES_VOIX = `Phase commerciale — à dicter depuis la voiture :

« Rédige le devis Dupont à partir des mails et des documents dans mon dossier Téléchargements. Utilise mes ratios habituels et ma trame standard. »

« Relance par mail les 12 devis en attente depuis plus de 15 jours. Ton ferme mais courtois. Mets ma comptable en copie. »

Suivi de chantier :

« Prépare le compte rendu de la visite Martin de lundi à partir de mes notes vocales et photos dans le dossier Visites. »

« Génère le PPSPS pour le chantier rue de la Paix. Tu trouveras le DCE dans mes Téléchargements de cette semaine. »

Administratif et facturation :

« Remplis ma feuille d'heures de la semaine selon les chantiers visités, en croisant mes mails et mon agenda. »

« Trie les factures fournisseurs reçues cette semaine dans Outlook et range-les par chantier dans le dossier Comptabilité. »

Veille et stratégie :

« Scanne le BOAMP ce matin et envoie-moi par mail les 5 DCE pertinents pour mon métier en Île-de-France. »

« Lis les 3 mails que m'a envoyés mon avocat hier et fais-moi une synthèse de 10 lignes des actions à mener cette semaine. »`;

const PROMPT_COMMANDE_SECURISEE = `Rédige les 12 mails de relance devis selon ma trame habituelle.

NE LES ENVOIE PAS — laisse-les en brouillon dans Outlook.

Préviens-moi quand c'est prêt, je les relirai et les enverrai moi-même ce soir au bureau.`;

const H1 = "Crée ton bureau depuis ton chantier";


const breadcrumbItems = [
  { name: "Accueil", href: "/" },
  { name: "Ressources", href: "/ressources" },
  { name: H1, href: pagePath },
] as const;

const FAQ_FOR_JSON_LD = [
  {
    question: "Mon PC peut-il vraiment rester allumé 24 h / 24 ?",
    answer:
      "Oui sans problème dans l'usage courant. Surveillez toutefois la mise en veille : pour Dispatch, ce qui bloque l'exécution est la veille système, pas l'écran éteint — paramétrez l'alimentation pour que le poste reste éveille pendant vos plages d'utilisation prévues, et utilisez une alimentation secteur stable sur portable.",
  },
  {
    question: "Que se passe-t-il si la connexion internet coupe sur mon chantier ?",
    answer:
      "Les commandes peuvent être mises en file jusqu'au retour réseau. Le téléphone sert à envoyer l'instruction et à recevoir les notifications ; une coupure ponctuelle côté mobile n'empêche pas toujours le travail qui tourne déjà sur le bureau, selon l'étape de la tâche.",
  },
  {
    question: "Puis-je utiliser Dispatch pour gérer mon équipe ?",
    answer:
      "Indirectement, oui (plannings, feuilles de route, mails). Mais Dispatch reste pensé comme un flux individuel : chaque utilisateur doit disposer de son setup. Pour partager avec l'équipe, repassez ensuite par vos canaux habituels (mail, Drive, messagerie pro).",
  },
  {
    question: "Et si Claude se trompe pendant que je suis sur le chantier ?",
    answer:
      "Prévoir des garde-fous : demandes de confirmation, brouillons au lieu d'envoi, jalons avant actions sensibles. En cas d'erreur, une notification permet de corriger par message vocal ou de reprendre la main depuis le bureau.",
  },
  {
    question: "Quelle différence avec l'app Claude classique sur téléphone ?",
    answer:
      "L'application mobile permet de dialoguer avec Claude sans accéder aux fichiers et applications locales du PC. Avec Dispatch, le téléphone pilote une session où le travail peut s'exécuter sur le poste bureau : c'est ce décalage local / bureau qui change la donne.",
  },
  {
    question: "Et si je n'ai pas le temps de me former à tout ça ?",
    answer:
      "BeWork peut accompagner la mise en place : paramétrage, bonnes habitudes et commandes types adaptées au BTP, pour gagner du temps sans passer des semaines en autonomie irrégulière sur l'outil.",
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

export default function TutoDispatchBeworkPage() {
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
      { "@type": "HowToStep", name: "Vérifier les prérequis (abonnement, Claude Desktop, mobile, réseau)" },
      { "@type": "HowToStep", name: "Activer Dispatch en quelques minutes (Cowork + appairage QR)" },
      { "@type": "HowToStep", name: "Utiliser les commandes vocales BTP types" },
      { "@type": "HowToStep", name: "Sécuriser l'usage (confirmations, brouillons, données sensibles)" },
      { "@type": "HowToStep", name: "Intégrer la routine quotidienne bureau / chantier" },
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
              Tuto PDF gratuit · Claude Dispatch · BeWork
            </p>
            <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl md:text-[2.35rem] md:leading-tight">
              {H1}
            </h1>
            <p className="mt-4 max-w-none text-lg leading-relaxed text-slate-600 sm:text-[1.125rem] sm:leading-[1.7]">
              Installez Dispatch, pair smartphone et PC, dictez des tâches administratives depuis le terrain : le PDF BeWork reprend le pas à pas,
              les pièges à éviter et une routine type — ci-dessous la version en ligne et le texte intégral.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
              <CalendlyBookingLink className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-xl bg-[#1d4ed8] px-7 text-[0.9375rem] font-semibold text-white shadow-md shadow-[#1d4ed8]/25 transition hover:bg-[#1e40af] md:text-base">
                Réservez un appel
              </CalendlyBookingLink>
              <span className="text-sm leading-snug text-slate-600 sm:max-w-sm">
                20&nbsp;minutes pour cadrer votre besoin — sans engagement.
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
                title="Crée ton bureau depuis le chantier — PDF BeWork"
              />
            </div>
          </section>

          <aside
            className="mb-14 rounded-2xl border border-[#1d4ed8]/22 bg-gradient-to-br from-[#eff6ff] to-white p-6 shadow-sm shadow-[#1d4ed8]/06 sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:p-8"
            aria-label="Réserver un appel découverte"
          >
            <div className="min-w-0 sm:flex-1">
              <p className="text-base font-semibold text-slate-900 md:text-[1.05rem]">
                Besoin d&apos;aide pour paramétrer Dispatch sur votre poste&nbsp;?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 md:text-[0.9375rem]">
                En 20&nbsp;minutes, on cadre objectifs, contraintes et première marche suivante avec BeWork.
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
              <h3 className="mt-8 text-center text-2xl font-bold text-slate-900 md:text-[1.65rem]">Crée ton bureau</h3>
              <p className="mt-3 text-center text-xl font-semibold text-slate-900">depuis ton chantier</p>
              <p className="mt-2 text-center text-base text-slate-700 md:text-[1.05rem]">
                Le tutoriel pas à pas pour utiliser Dispatch — la fonctionnalité de Claude qui transforme ton téléphone en télécommande de ton PC.
              </p>

              <h4 className="mt-14 text-xs font-semibold uppercase tracking-[0.2em] text-slate-800">Ce que tu vas apprendre</h4>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Installer Dispatch en 5 minutes (1 fois pour toutes)</li>
                <li>▸ 8 commandes vocales BTP à dicter depuis ta voiture</li>
                <li>▸ Les pièges à éviter sur les chantiers</li>
                <li>▸ La routine pour économiser des heures de paperasse par jour</li>
              </ul>

              <h3 className="mt-14 text-xl font-semibold tracking-tight text-slate-900">Pourquoi Dispatch change tout pour le BTP ?</h3>
              <p className="mt-5 text-[1.0625rem] leading-relaxed text-slate-900">
                L&apos;IA imposait souvent d&apos;être assis devant un écran — alors qu&apos;en BTP une grande partie du temps se passe en chantier, en
                voiture ou en rendez-vous. Dispatch rapproche les deux : tu envoies un message ou un vocal depuis le téléphone, ton PC au bureau
                peut exécuter la tâche pendant que tu es sur le terrain, et tu retrouves le travail avancé à ton retour.
              </p>
              <p className="mt-6 text-xl font-semibold uppercase tracking-wide text-slate-900">Concrètement, voilà comment ça marche</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Tu pars en chantier le matin, ton PC reste allumé au bureau.</li>
                <li>▸ Depuis la voiture ou le chantier, tu dictes une instruction à Claude sur ton téléphone.</li>
                <li>▸ Claude exécute sur le PC ce que tu lui demandes (selon périmètre produit au moment où tu configures l&apos;outil).</li>
                <li>▸ Une notification sur ton téléphone peut te prévenir lorsque c&apos;est terminé ou qu&apos;une validation est nécessaire.</li>
                <li>▸ Tu rentres le soir : relis, valides ou ajustes avant envoi définitif.</li>
              </ul>

              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">Le concept en une phrase</p>
              <p className="mt-4 text-[1.0625rem] leading-relaxed text-slate-900">
                Le téléphone devient l&apos;interface de déclenchement ; le bureau reste la machine de production. Une même conversation peut se
                synchroniser entre tes appareils : tu démarres une tâche depuis le terrain et tu la termines au bureau sans tout réexpliquer.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">1 </span>
                Vérifie les prérequis
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Avant d&apos;installer Dispatch, vérifie les conditions d&apos;abonnement et d&apos;appareils indiquées par Anthropic au moment de ta lecture
                (évolution des offres). En pratique, il faut en général un abonnement compatible, Claude Desktop sur Windows ou Mac, l&apos;app mobile
                à jour, le même compte sur les deux appareils, et une connexion internet stable des deux côtés.
              </p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Mises à jour à faire avant de commencer</p>
              <ul className="mt-4 list-none space-y-2 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Installer ou mettre à jour Claude Desktop depuis le site officiel.</li>
                <li>▸ Mettre à jour l&apos;application mobile (App Store / Google Play).</li>
                <li>▸ Se connecter avec le même compte sur desktop et mobile pour l&apos;appairage.</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] leading-relaxed text-slate-900">
                <strong className="font-semibold">Piège fréquent :</strong> si tu n&apos;as utilisé que le navigateur (claude.ai) et pas l&apos;application
                desktop, installe et ouvre bien Claude Desktop au moment où tu envoies une commande Dispatch — c&apos;est souvent l&apos;étape oubliée.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">2 </span>
                Active Dispatch en quelques minutes
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Sur PC : Claude Desktop → onglet Cowork → Dispatch → démarrer l&apos;assistant de configuration selon les options affichées
                (accès fichiers locaux, maintien éveillé si proposé). Sur mobile : app Claude → Cowork → appairage avec le bureau en scannant le
                QR code affiché sur l&apos;écran du PC. Les chemins exacts peuvent être légèrement renommés selon les mises à jour produit — suis les
                libellés à l&apos;écran.
              </p>
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">
                <strong className="font-semibold">Paramétrage important :</strong> éviter que la machine se mette en veille système pendant les
                plages où tu comptes sur Dispatch ; l&apos;écran peut souvent rester éteint. Ajuste l&apos;alimentation sous macOS ou Windows pour ne pas
                couper l&apos;exécution en plein traitement.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">3 </span>
                Tes 8 commandes vocales BTP
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Voici 8 formulations prêtes à adapter : commercial, chantier, admin, veille. Modifie les noms de dossiers, outils mail et chantiers pour
                coller à ton organisation.
              </p>
              <PromptBlock label="8 COMMANDES — À COPIER / ADAPTER" promptText={PROMPT_8_COMMANDES_VOIX} />

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">4 </span>
                Sécurise ton usage
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Dispatch peut accéder à des fichiers et à des applications : impose des règles claires. Demande une confirmation avant toute action
                irréversible ; évite de faire circuler par ce canal des données ultra-sensibles (RIB, mots de passe, données salariées lourdes) ;
                désactive ou limite l&apos;usage quand tu n&apos;en as pas besoin ; surveille les demandes de validation sur le mobile.
              </p>
              <p className="mt-8 text-[1.0625rem] leading-relaxed text-slate-900">
                <strong className="font-semibold">Bon réflexe :</strong> pour les envois externes (mail, devis, facture), demande souvent le résultat en
                brouillon ; pour la production interne (CR, synthèses, rangement), tu peux être plus souple selon ton niveau de confiance et ton
                contrôle a posteriori.
              </p>
              <PromptBlock label="EXEMPLE — COMMANDE AVEC GARDE-FOU" promptText={PROMPT_COMMANDE_SECURISEE} />

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">
                <span className="text-[#1d4ed8]">5 </span>
                Ta routine quotidienne
              </h3>
              <p className="mt-6 text-[1.0625rem] leading-relaxed text-slate-900">
                Matin : PC prêt, desktop ouvert, Dispatch actif. Trajet : 2 minutes pour dicter 3 ou 4 tâches. Journée : validations courtes sur mobile
                si demandées. Soir : relecture et envoi après contrôle humain. C&apos;est la boucle — pas seulement la fonctionnalité — qui fait gagner du
                temps sur l&apos;administratif.
              </p>

              <h3 className="mt-14 text-2xl font-semibold tracking-tight text-slate-900">Questions fréquentes</h3>

              <h4 className="mt-8 text-[1.05rem] font-semibold text-slate-900">Mon PC peut-il vraiment rester allumé 24 h / 24 ?</h4>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Beaucoup d&apos;équipes laissent un poste de bureau éveillé en journée ou selon plages définies ; le coût énergétique d&apos;un usage raisonnable
                est en général faible par rapport au temps administratif récupéré. Branche un portable sur secteur si besoin et règle la veille pour ne pas
                interrompre Dispatch.
              </p>

              <h4 className="mt-10 text-[1.05rem] font-semibold text-slate-900">
                Que se passe-t-il si la connexion internet coupe sur mon chantier ?
              </h4>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Les commandes peuvent attendre le retour réseau. La connexion mobile sert surtout à envoyer l&apos;instruction et à recevoir les retours :
                une zone blanche prolongée retarde l&apos;envoi, pas forcément tout le travail déjà lancé sur le bureau.
              </p>

              <h4 className="mt-10 text-[1.05rem] font-semibold text-slate-900">Puis-je utiliser Dispatch pour gérer mon équipe ?</h4>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Tu peux produire des supports pour l&apos;équipe, mais le setup reste individuel. Partage ensuite par mail, Drive ou outils internes.
              </p>

              <h4 className="mt-10 text-[1.05rem] font-semibold text-slate-900">Et si Claude se trompe pendant que je suis sur le chantier ?</h4>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Corrige par vocal, ou reprends au bureau. Multiplie les étapes de validation pour les tâches sensibles tant que tu n&apos;es pas à l&apos;aise.
              </p>

              <h4 className="mt-10 text-[1.05rem] font-semibold text-slate-900">Quelle différence avec l&apos;app Claude classique sur téléphone ?</h4>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                Sans Dispatch, le mobile ne pilote pas ton environnement local sur le PC. Avec Dispatch, tu relies les deux mondes.
              </p>

              <h4 className="mt-10 text-[1.05rem] font-semibold text-slate-900">Et si je n&apos;ai pas le temps de me former à tout ça ?</h4>
              <p className="mt-3 text-[1.0625rem] leading-relaxed text-slate-900">
                BeWork peut t&apos;accompagner sur la mise en route et tes commandes types BTP, pour gagner rapidement sans rester bloqué sur les réglages.
              </p>

              <p className="mt-14 text-xl font-semibold uppercase tracking-wide text-slate-900">Pas le temps de le faire vous-même ?</p>
              <p className="mt-10 text-xl font-semibold uppercase tracking-wide text-slate-900">Faire appel à un Assistant Travaux BeWork</p>
              <p className="mt-3 text-[1.0625rem] font-medium text-slate-800">
                Assistants travaux BTP · Relais dossiers chantier · Augmentés par l&apos;IA
              </p>

              <p className="mt-10 text-2xl font-bold uppercase tracking-tight text-slate-900">
                ON TIENT LE BUREAU, VOUS TENEZ LE CHANTIER
              </p>
              <ul className="mt-6 list-none space-y-3 text-[1.0625rem] leading-relaxed text-slate-900">
                <li>▸ Accompagnement à la mise en place et aux bonnes pratiques.</li>
                <li>▸ Calibration de commandes vocales adaptées à votre métier.</li>
                <li>▸ Suite possible sur relais administratif chantier selon vos besoins.</li>
              </ul>
              <p className="mt-10 text-[1.0625rem] font-semibold text-slate-900">
                Réservez un appel de cadrage de 20 minutes sur{" "}
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
