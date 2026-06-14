import Link from "next/link";
import { CalendlyBookingLink } from "@/components/CalendlyBookingLink";

export const MARCHES_PUBLICS_ANCHOR = "marches-publics-accords-cadres" as const;

const CENTRAL_PHRASE =
  "BeWork ne fait pas les travaux : BeWork sécurise tout ce qui permet aux travaux d’être payés, réceptionnés et protégés contre les pénalités.";

const SENSITIVE_POINTS = [
  "Bons de commande à traiter dans les délais",
  "Plateformes client type ECF ou équivalent",
  "Interventions en logement occupé",
  "Visas maître d’œuvre sur pièces d’exécution",
  "Délais contractuels et période de préparation",
  "Diagnostics amiante et certificats SS4",
  "Situations mensuelles et Chorus Pro",
  "Réception et levée des réserves",
  "Facturation, avance et retenue de garantie",
  "Pénalités administratives ou contractuelles",
  "DOE et pièces de clôture",
  "Sous-traitance et demandes de paiement",
] as const;

const EXECUTION_SUMMARY = [
  "Démarrage administratif du marché",
  "Suivi des documents d’exécution et visas",
  "Planning administratif, relances et réunions",
  "Milieu occupé, amiante et SS4",
  "Situations mensuelles et Chorus Pro",
  "Réserves, pénalités et preuves chantier",
  "DOE et clôture du marché",
] as const;

type ExecutionBlock = {
  title: string;
  intro: string;
  items: readonly string[];
  highlight?: string;
};

const EXECUTION_BLOCKS: ExecutionBlock[] = [
  {
    title: "Démarrage administratif du marché",
    intro:
      "Dès la notification, BeWork structure un dossier marché avec les pièces contractuelles essentielles et les échéances à ne pas manquer.",
    highlight:
      "Le temps perdu au démarrage est souvent difficile à rattraper. BeWork structure le dossier dès la notification pour éviter que l’administratif bloque le chantier.",
    items: [
      "Classement AE, CCAP, CCTP, DPGF et pièces marché",
      "Synthèse des obligations principales du titulaire",
      "Suivi de l’ordre de service et du calendrier contractuel",
      "Suivi de la période de préparation",
      "Classement RC pro, décennale et biennale",
      "Suivi avance, retenue de garantie et pièces bancaires",
      "Suivi quotidien des bons de commande (accord-cadre)",
    ],
  },
  {
    title: "Documents d’exécution et visas",
    intro:
      "Avant et pendant les travaux, de nombreuses pièces doivent être produites, transmises ou validées. BeWork tient un tableau de bord documentaire avec statuts exploitables.",
    items: [
      "Statuts : à produire, envoyé, en attente visa, validé, refusé, à corriger",
      "Attestations d’assurance, programme d’exécution, planning détaillé",
      "Fiches techniques, plans d’exécution, notes et schémas courant faible",
      "Coordonnées des interlocuteurs MOA / MOE / MO",
      "Documents sous-traitants et pièces amiante / SS4 si concernés",
      "Suivi des envois, retours, corrections et relances visa MOE",
    ],
  },
  {
    title: "Planning, relances et réunions",
    intro:
      "BeWork transforme le planning chantier en planning administratif exploitable — pour éviter que le conducteur cherche l’information dans ses mails, WhatsApp et photos.",
    items: [
      "Commandes fournisseur, délais livraison, validations fiches techniques",
      "Interventions par hall ou cage, information locataires, accès confirmés",
      "Courant faible : dépose, raccordement, essais, remise en service",
      "Suivi des réserves et collecte DOE au fil de l’eau",
      "Convocations, ordres du jour, points bloquants, questions MOA / MOE",
      "Comptes rendus synthétiques, tableau des actions et relances responsables",
      "Archivage des décisions — certains CCAP prévoient des pénalités d’absence ou de retard de CR",
    ],
  },
  {
    title: "Milieu occupé, amiante et SS4",
    intro:
      "En logement occupé, la qualité du suivi administratif conditionne le bon déroulement des interventions et la preuve que les occupants ont été informés.",
    highlight:
      "Les délais de réponse liés à l’amiante et au milieu occupé sont typiquement des délais administratifs que BeWork peut surveiller.",
    items: [
      "Avis de passage, affichage hall, planning par cage / hall",
      "Suivi des accès, relances gardien, syndic, bailleur ou représentant site",
      "Centralisation des contraintes locataires et suivi des nuisances",
      "Signalement des coupures temporaires de contrôle d’accès",
      "Fiches de fin d’intervention par hall, photos avant / après",
      "Rapports amiante, DTA, DA-PP, RAT, modes opératoires, certificats SS4",
      "Courriers en cas de doute SS4, sujetions locataires, CAP et BSDA si concernés",
    ],
  },
  {
    title: "Situations mensuelles, facturation et Chorus Pro",
    intro:
      "BeWork accompagne la préparation administrative des paiements — situations, justificatifs, dépôt Chorus Pro et suivi du solde.",
    highlight: "Un chantier bien réalisé mais mal facturé reste un chantier mal rentabilisé.",
    items: [
      "Préparation des situations mensuelles et cohérence avec l’avancement",
      "Rassemblement des justificatifs et pièces de facturation",
      "Dépôt ou préparation du dépôt Chorus Pro",
      "Suivi du délai de paiement, relances en cas de blocage",
      "Suivi avance, retenue de garantie et solde",
      "Déclaration sous-traitance, attestations, situations et demandes de paiement ST",
      "Relances et validations sous-traitants — délais souvent sensibles au CCAP",
    ],
  },
  {
    title: "Réserves, pénalités et preuves chantier",
    intro:
      "BeWork trace les réserves, les preuves d’intervention et les risques de pénalité pour que rien ne se perde entre le terrain et le bureau.",
    items: [
      "Registre de réserves : responsable, date limite, statut, preuve de levée",
      "Photos avant / après, fiches d’autocontrôle, preuves d’intervention",
      "Suivi réception, date de fin de travaux, réclamations locataires",
      "Alertes sur échéances critiques et dossiers incomplets",
      "Lien avec le tableau anti-pénalités ci-dessous",
    ],
  },
  {
    title: "DOE et clôture du marché",
    intro:
      "BeWork prépare le DOE dès le début du marché — au lieu d’attendre la course de fin de chantier.",
    highlight: "Un DOE préparé au fil de l’eau évite la course de fin de chantier et sécurise la réception.",
    items: [
      "Fiches techniques validées, plans d’exécution et de récolement",
      "Schémas courant faible, notices d’entretien, garanties fournisseurs",
      "PV d’essais, fiches d’autocontrôle, photos avant / après",
      "Bordereaux déchets, BSDD / BSDA amiante, liste équipements par hall",
      "Référent déchets, preuves de tri et attestations de traitement si exigées",
      "Archivage dossier marché et pièces de clôture contractuelle",
    ],
  },
];

const PENALTY_RISKS = [
  "Retard global d’exécution",
  "Absence à une réunion de chantier",
  "Retard de transmission de documents",
  "Retard d’une tâche bloquant d’autres corps d’état",
  "Retard de levée des réserves",
  "Retard de documents après exécution",
  "Facture non déposée ou rejetée",
  "Justificatif manquant",
  "DOE incomplet ou tardif",
] as const;

const RESERVE_EXAMPLE_ROWS = [
  {
    reserve: "Ferme-porte à régler",
    site: "Hall A",
    responsable: "Équipe pose",
    echeance: "12/09",
    statut: "En cours",
    preuve: "Photo",
  },
  {
    reserve: "Digicode à reprogrammer",
    site: "Hall B",
    responsable: "Courant faible",
    echeance: "13/09",
    statut: "Fait",
    preuve: "PV essai",
  },
  {
    reserve: "Joint périphérique à reprendre",
    site: "Hall C",
    responsable: "Menuiserie",
    echeance: "14/09",
    statut: "Fait",
    preuve: "Photo",
  },
] as const;

const MARKET_TYPES = [
  "Accords-cadres logement occupé",
  "Marchés à bons de commande",
  "Entretien courant et remise en état",
  "Interventions multisites bailleurs sociaux",
  "Maintenance avec délais contractuels stricts",
  "Marchés exigeant traçabilité, preuves et reporting",
] as const;

const BENEFITS = [
  "Moins d’oublis administratifs",
  "Meilleure traçabilité des pièces et décisions",
  "Pénalités mieux anticipées",
  "Facturation et paiement accélérés",
  "Conducteurs de travaux moins saturés au bureau",
  "DOE et réception sécurisés",
] as const;

const EXAMPLE_ROWS = [
  {
    bc: "BC-2847",
    immeuble: "Rés. Les Ormes",
    logement: "Log. 12",
    type: "Remise état SdB",
    statut: "En cours",
    urgence: "Non",
    amiante: "OK",
    ss4: "OK",
    rdv: "14/06",
    avant: "OK",
    apres: "—",
    fin: "—",
    reception: "—",
    facture: "—",
    paiement: "—",
    penalite: "Faible",
  },
  {
    bc: "BC-2851",
    immeuble: "Rés. Bellevue",
    logement: "Log. 04",
    type: "Mise en sécurité",
    statut: "Urgent",
    urgence: "Oui",
    amiante: "À vérifier",
    ss4: "Manquant",
    rdv: "Relance",
    avant: "—",
    apres: "—",
    fin: "—",
    reception: "—",
    facture: "—",
    paiement: "—",
    penalite: "Élevé",
  },
  {
    bc: "BC-2839",
    immeuble: "Rés. du Parc",
    logement: "Log. 08",
    type: "Menuiseries",
    statut: "À facturer",
    urgence: "Non",
    amiante: "OK",
    ss4: "OK",
    rdv: "05/06",
    avant: "OK",
    apres: "OK",
    fin: "10/06",
    reception: "Partielle",
    facture: "Émise",
    paiement: "Attente 30 j",
    penalite: "Modéré",
  },
] as const;

export const MARCHES_PUBLICS_FAQ = [
  {
    q: "BeWork remplace-t-il le conducteur de travaux sur le marché ?",
    a: "Non. BeWork sécurise le suivi administratif — documents, relances, planning bureau, facturation, réserves et DOE. Le conducteur de travaux garde la décision technique, la validation des interventions et l’engagement contractuel.",
  },
  {
    q: "BeWork peut-il structurer le dossier dès la notification du marché ?",
    a: "Oui : classement AE/CCAP/CCTP/DPGF, calendrier contractuel, ordre de service, assurances, avance et retenue de garantie — pour démarrer sans perdre de temps administratif.",
  },
  {
    q: "BeWork gère-t-il Chorus Pro et les situations mensuelles ?",
    a: "BeWork peut préparer les situations, rassembler les justificatifs, préparer le dépôt Chorus Pro et suivre les délais de paiement — avec validation humaine avant tout envoi engageant.",
  },
  {
    q: "BeWork peut-il suivre une plateforme client type ECF ?",
    a: "Oui, sur le volet suivi administratif : saisie des informations demandées, mise à jour des statuts, remontée des anomalies et traçabilité des échanges — selon périmètre défini avec vous.",
  },
  {
    q: "Comment BeWork aide-t-il à limiter les pénalités ?",
    a: "Par un tableau anti-pénalités, le suivi des délais sensibles, des pièces obligatoires (amiante, SS4, photos), de la facturation et des réunions — avec alertes pour anticiper les risques contractuels.",
  },
] as const;

const TABLE_COLUMNS = [
  "N° BC",
  "Immeuble",
  "Logement",
  "Intervention",
  "Statut",
  "Urgence",
  "Amiante",
  "SS4",
  "RDV locataire",
  "Photos avant",
  "Photos après",
  "Fin travaux",
  "Réception",
  "Facture",
  "Paiement",
  "Risque pénalité",
] as const;

/** Bloc intégré — marchés publics, accords-cadres & exécution de marché (logement occupé). */
export function MarchesPublicsAccordsCadresSection() {
  return (
    <section
      id={MARCHES_PUBLICS_ANCHOR}
      className="scroll-mt-28 border-y border-[#1d4ed8]/15 bg-gradient-to-b from-[#eff6ff]/60 via-white to-[#f8fafc] px-6 py-14 md:scroll-mt-32 md:py-20"
      aria-labelledby="marches-publics-heading"
    >
      <div className="mx-auto max-w-site">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#1d4ed8] md:text-sm">
          Marchés publics &amp; accords-cadres
        </p>
        <h2
          id="marches-publics-heading"
          className="mt-3 text-balance text-2xl font-bold tracking-tight text-black md:text-3xl lg:text-4xl"
        >
          Marchés publics &amp; accords-cadres : sécurisez votre suivi administratif
        </h2>
        <p className="mt-5 max-w-4xl text-lg leading-relaxed text-black">
          Dans un marché à bons de commande ou un accord-cadre travaux, la rentabilité dépend autant du suivi
          administratif que du prix. BeWork accompagne les titulaires après attribution — bons de commande, plateformes
          client, documents d&apos;exécution, amiante SS4, Chorus Pro, réserves et DOE — en relais augmenté par
          l&apos;IA, sans remplacer le conducteur de travaux.
        </p>

        <div className="mt-8 card-frame rounded-xl border-[#1d4ed8]/25 bg-[#eff6ff]/50 p-6 md:p-8">
          <p className="text-base font-semibold leading-relaxed text-black md:text-lg">{CENTRAL_PHRASE}</p>
        </div>

        <div className="mt-8 card-frame rounded-xl border-[#1d4ed8]/20 bg-white p-6 md:p-8">
          <h3 className="text-lg font-semibold text-black">Pourquoi ces marchés sont sensibles</h3>
          <p className="mt-3 text-black leading-relaxed">
            Les marchés publics, accords-cadres et marchés à bons de commande exigent une organisation rigoureuse. Un
            document transmis trop tard, une réserve non levée, une réunion oubliée ou un DOE incomplet peuvent générer
            des pénalités, des retards de paiement ou une perte de marge.
          </p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {SENSITIVE_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2.5 text-sm text-black"
              >
                <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 card-frame rounded-xl p-6 md:p-8">
          <h3 className="text-xl font-bold text-black md:text-2xl">
            Gestion administrative d&apos;exécution de marché public
          </h3>
          <p className="mt-4 max-w-4xl text-black leading-relaxed">
            BeWork accompagne l&apos;entreprise titulaire dans le suivi administratif du marché : calendrier contractuel,
            documents d&apos;exécution, relances maître d&apos;œuvre, suivi amiante, fiches techniques, réunions,
            situations mensuelles, Chorus Pro, réserves, déchets et DOE — pour que vos équipes se concentrent sur les
            travaux tout en sécurisant délais, preuves, obligations contractuelles, facturation et réception.
          </p>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-[#1d4ed8]">
            Une fois le marché obtenu, 7 blocs principaux
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {EXECUTION_SUMMARY.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-black">
                <span className="shrink-0 text-[#1d4ed8]" aria-hidden>
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <h3 className="mt-12 text-xl font-bold text-black md:text-2xl">
          Après attribution : les 7 blocs d&apos;exécution BeWork
        </h3>
        <p className="mt-3 max-w-3xl text-black leading-relaxed">
          Relais administratif et opérationnel — pas entreprise de travaux ni bureau d&apos;études. Chaque bloc couvre
          un volet du marché sans doublon avec le suivi chantier classique.
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {EXECUTION_BLOCKS.map((block) => (
            <article key={block.title} className="card-frame rounded-xl p-6">
              <h4 className="text-lg font-semibold text-black">{block.title}</h4>
              <p className="mt-3 text-sm text-black leading-relaxed">{block.intro}</p>
              <ul className="mt-4 space-y-2" role="list">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-black">
                    <span className="shrink-0 text-[#1d4ed8]" aria-hidden>
                      ✓
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              {block.highlight ? (
                <p className="mt-4 rounded-lg border border-[#1d4ed8]/15 bg-[#eff6ff]/60 px-3 py-2.5 text-sm font-medium text-black">
                  {block.highlight}
                </p>
              ) : null}
            </article>
          ))}
        </div>

        <div className="mt-10 card-frame rounded-xl border-[#1d4ed8]/25 bg-white p-6 md:p-8">
          <h3 className="text-xl font-bold text-black md:text-2xl">Tableau anti-pénalités</h3>
          <p className="mt-4 max-w-4xl text-black leading-relaxed">
            Les pénalités de marché public ne viennent pas toujours d&apos;un problème technique. Elles peuvent venir
            d&apos;un document transmis trop tard, d&apos;une réserve non levée, d&apos;une réunion oubliée, d&apos;un
            DOE incomplet ou d&apos;une facture mal suivie. Selon les CCAP, ces retards peuvent générer des pénalités
            journalières ou forfaitaires.
          </p>
          <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PENALTY_RISKS.map((risk) => (
              <li
                key={risk}
                className="flex items-start gap-2 rounded-lg border border-slate-200/90 bg-slate-50/80 px-3 py-2.5 text-sm text-black"
              >
                <span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-[#1d4ed8]" aria-hidden />
                {risk}
              </li>
            ))}
          </ul>
        </div>

        <h3 className="mt-12 text-xl font-bold text-black md:text-2xl">Exemple de registre de réserves</h3>
        <p className="mt-3 max-w-3xl text-black leading-relaxed">
          Les petites réserves non suivies peuvent devenir coûteuses. BeWork aide à les tracer et à relancer les
          responsables — maquette illustrative.
        </p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[40rem] w-full border-collapse text-left text-sm">
            <caption className="sr-only">Exemple de registre de réserves BeWork</caption>
            <thead>
              <tr className="border-b border-slate-200 bg-[#0f172a] text-white">
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Réserve
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Site
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Responsable
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Date limite
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Statut
                </th>
                <th scope="col" className="px-3 py-2.5 font-semibold">
                  Preuve
                </th>
              </tr>
            </thead>
            <tbody>
              {RESERVE_EXAMPLE_ROWS.map((row, i) => (
                <tr key={row.reserve} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/80"}>
                  <td className="px-3 py-2 font-medium text-black">{row.reserve}</td>
                  <td className="px-3 py-2">{row.site}</td>
                  <td className="px-3 py-2">{row.responsable}</td>
                  <td className="whitespace-nowrap px-3 py-2">{row.echeance}</td>
                  <td className="px-3 py-2">{row.statut}</td>
                  <td className="px-3 py-2">{row.preuve}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-12 text-xl font-bold text-black md:text-2xl">Exemple de suivi bons de commande</h3>
        <p className="mt-3 max-w-3xl text-black leading-relaxed">
          Maquette illustrative pour un accord-cadre logement occupé — BeWork structure le suivi ; vous validez les
          points qui engagent votre entreprise.
        </p>
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-[64rem] w-full border-collapse text-left text-xs md:text-sm">
            <caption className="sr-only">Exemple de tableau de suivi administratif BeWork pour bons de commande</caption>
            <thead>
              <tr className="border-b border-slate-200 bg-[#0f172a] text-white">
                {TABLE_COLUMNS.map((col) => (
                  <th key={col} scope="col" className="whitespace-nowrap px-2.5 py-2.5 font-semibold md:px-3">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {EXAMPLE_ROWS.map((row, i) => (
                <tr key={row.bc} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/80"}>
                  <td className="whitespace-nowrap px-2.5 py-2 font-semibold text-[#1d4ed8] md:px-3">{row.bc}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.immeuble}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.logement}</td>
                  <td className="px-2.5 py-2 md:px-3">{row.type}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.statut}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.urgence}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.amiante}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.ss4}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.rdv}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.avant}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.apres}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.fin}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.reception}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.facture}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 md:px-3">{row.paiement}</td>
                  <td className="whitespace-nowrap px-2.5 py-2 font-medium md:px-3">{row.penalite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-600">
          Aperçu statique — périmètre cadré selon votre marché (ECF, Chorus Pro, portail bailleur, etc.).
        </p>

        <h3 className="mt-12 text-xl font-bold text-black md:text-2xl">Pour quels types de marchés ?</h3>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MARKET_TYPES.map((label) => (
            <li
              key={label}
              className="rounded-xl border border-[#1d4ed8]/20 bg-[#eff6ff]/50 px-4 py-3 text-sm font-medium text-black"
            >
              {label}
            </li>
          ))}
        </ul>

        <h3 className="mt-12 text-xl font-bold text-black md:text-2xl">Les bénéfices pour l&apos;entreprise titulaire</h3>
        <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit) => (
            <li key={benefit} className="flex gap-2 text-black">
              <span className="shrink-0 text-[#1d4ed8]" aria-hidden>
                ✓
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        <div className="mt-10 rounded-2xl border border-[#1d4ed8]/25 bg-gradient-to-br from-[#eff6ff] via-white to-[#eff6ff] p-8 text-center md:p-10">
          <h3 className="text-xl font-bold text-black md:text-2xl">Vous venez d&apos;obtenir un marché public ?</h3>
          <p className="mx-auto mt-4 max-w-2xl text-black leading-relaxed">
            BeWork peut vous aider à structurer le dossier dès la notification, suivre les documents d&apos;exécution,
            préparer les situations, surveiller les pénalités et constituer le DOE au fil de l&apos;eau.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <CalendlyBookingLink
              className="w-full rounded-lg bg-[#1d4ed8] px-8 py-4 text-center font-semibold text-white shadow-md transition hover:bg-[#1e40af] sm:w-auto"
              trackLocation="missions-marches-publics-cta"
            >
              Structurer mon marché avec BeWork
            </CalendlyBookingLink>
            <Link
              href="/gestion-marche-public-btp"
              className="text-base font-semibold text-[#1d4ed8] underline-offset-2 hover:underline"
            >
              Gestion marché public après attribution
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
