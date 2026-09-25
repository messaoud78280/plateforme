/**
 * Enrichissement professionnel des désignations / fiches techniques — scénario C-01.
 * Indépendant du moteur de calcul : ne contient ni formules ni quantités.
 */
import type { PrepTechnicalReference } from "@/lib/preparation/types";

export type PrepLineTextEnrichment = {
  designation: string;
  /** Ancienne désignation courte (mise à jour sûre si la ligne n'a pas été retouchée). */
  replacesDesignation?: string;
  technicalDescription: string;
  includedServices: string[];
  technicalReferences: PrepTechnicalReference[];
  executionNotes: string | null;
  qualityControls: string[];
  technicalReservations: string[];
};

const R = {
  dtu131: (note?: string): PrepTechnicalReference => ({
    label: "NF DTU 13.1",
    kind: "INDICATIVE",
    note: note ?? "Fondations superficielles — selon domaine d'application, à confirmer au CCTP / DOE.",
  }),
  dtu21: (note?: string): PrepTechnicalReference => ({
    label: "NF DTU 21",
    kind: "INDICATIVE",
    note: note ?? "Exécution des ouvrages en béton — selon domaine d'application, à confirmer.",
  }),
  en206: (note?: string): PrepTechnicalReference => ({
    label: "NF EN 206/CN",
    kind: "INDICATIVE",
    note: note ?? "Spécification des bétons — classe, exposition et version applicables à confirmer.",
  }),
  dtdict: (): PrepTechnicalReference => ({
    label: "DT-DICT",
    kind: "TO_VERIFY",
    note: "Travaux à proximité des réseaux — déclarations et réponses à vérifier selon localisation.",
  }),
  plan: (): PrepTechnicalReference => ({
    label: "Plan d'exécution C-01",
    kind: "DOSSIER",
    note: "Prescriptions du dossier d'exécution — cotes et sections à confirmer sur document original.",
  }),
};

/** Enrichissements indexés par code de ligne (scénario fondations C-01). */
export const C01_LINE_TEXT_ENRICHMENTS: Record<string, PrepLineTextEnrichment> = {
  "IM-01": {
    designation: "Installation générale de chantier et mise en place des moyens nécessaires aux travaux de fondations",
    replacesDesignation: "Installation et préparation du chantier",
    technicalDescription:
      "Mise en place de l'organisation générale du chantier pour la phase fondations superficielles : balisage, accès engins, zone de stockage des matériaux et des déblais, signalisation, et préparation des moyens communs avant terrassement et bétonnage. Prestations de nature forfaitaire de démonstration — contenu exact à adapter au plan d'installation de chantier du dossier réel.",
    includedServices: [
      "Balisage et signalisation de la zone de travaux",
      "Organisation des accès engins et piétons",
      "Aménagement d'une zone de stockage temporaire",
      "Repérage indicatif des réseaux avant ouverture des fouilles",
      "Mise en place des moyens communs de la phase fondations",
    ],
    technicalReferences: [R.dtdict(), R.plan()],
    executionNotes:
      "Adapter l'installation aux contraintes d'accès, de coactivité et de stockage. Ne pas engager le terrassement sans clarification des réseaux.",
    qualityControls: [
      "Vérifier l'emprise balisée et la libre circulation des engins",
      "Contrôler la présence des réponses DT-DICT avant ouverture des fouilles",
    ],
    technicalReservations: [
      "Hypothèse forfaitaire de démonstration — non contractuelle",
      "Contenu exact de l'installation à valider sur le plan d'installation de chantier",
      "Présence et nature des réseaux : à vérifier (DT-DICT)",
    ],
  },
  "IM-02": {
    designation: "Implantation générale du chantier et matérialisation des repères altimétriques",
    replacesDesignation: "Implantation générale et repères altimétriques",
    technicalDescription:
      "Implantation générale des axes et niveaux de référence nécessaires à la réalisation des fondations superficielles suivant le plan d'exécution C-01. Matérialisation des repères altimétriques stables pour le contrôle des fonds de fouille et des niveaux d'assise des semelles.",
    includedServices: [
      "Reprise des axes principaux à partir des repères de chantier",
      "Matérialisation des repères altimétriques de référence",
      "Contrôle de cohérence avec le plan C-01",
      "Report des niveaux utiles à la phase terrassement",
    ],
    technicalReferences: [R.plan(), R.dtu131("Implantation et niveaux d'assise — à confirmer selon dossier.")],
    executionNotes:
      "Conserver des repères stables pendant toute la phase fondations. Toute divergence avec le plan doit être signalée avant terrassement.",
    qualityControls: [
      "Vérifier la cohérence des axes avec le plan C-01",
      "Contrôler la stabilité et la lisibilité des repères altimétriques",
    ],
    technicalReservations: [
      "Hypothèse forfaitaire de démonstration",
      "Tolérances d'implantation à confirmer au CCTP / DOE",
      "Décalage éventuel entre plan raster et réalité terrain : à vérifier",
    ],
  },
  "IM-03": {
    designation: "Fourniture et mise en place des chaises d'implantation avec matérialisation des axes et alignements",
    replacesDesignation: "Chaises d'implantation et cordeaux",
    technicalDescription:
      "Fourniture et pose de chaises d'implantation destinées à matérialiser durablement les axes, alignements et limites d'ouvrages de fondations. Les cordeaux et supports permettent le report des traçages au sol et le contrôle pendant le terrassement.",
    includedServices: [
      "Fourniture des chaises et supports",
      "Mise en place hors emprise des fouilles",
      "Tendage des cordeaux d'axes et d'alignements",
      "Repérage lisible des ouvrages SF1, S1 et S2",
    ],
    technicalReferences: [R.plan()],
    executionNotes:
      "Positionner les chaises hors zone d'évolution des engins. Remettre en tension les cordeaux après chaque déplacement significatif.",
    qualityControls: [
      "Contrôler l'équerrage et l'alignement des axes",
      "Vérifier que les chaises ne sont pas dans l'emprise des fouilles",
    ],
    technicalReservations: [
      "Nombre de chaises issu d'une hypothèse de démonstration",
      "Dispositif exact à adapter à la géométrie réelle du chantier",
    ],
  },
  "IM-04": {
    designation: "Implantation et traçage au sol des semelles filantes en béton armé SF1 suivant plan d'exécution C-01",
    replacesDesignation: "Traçage des semelles filantes SF1",
    technicalDescription:
      "Traçage au sol de l'emprise des semelles filantes SF1 à partir des axes implantés, conformément au plan d'exécution C-01. Le traçage matérialise la longueur développée et la largeur utile avant ouverture des fouilles en rigoles.",
    includedServices: [
      "Report des axes SF1 au sol",
      "Traçage de l'emprise de fouille et/ou de semelle",
      "Repérage des changements de direction",
      "Contrôle de longueur développée avant terrassement",
    ],
    technicalReferences: [R.plan(), R.dtu131()],
    executionNotes:
      "Distinguer clairement l'emprise de fouille (surlargeur éventuelle) de la section de la semelle bétonnée.",
    qualityControls: [
      "Vérifier la longueur développée avant ouverture",
      "Contrôler les alignements et angles au niveau des changements de direction",
    ],
    technicalReservations: [
      "Longueur développée issue d'une hypothèse de démonstration (H-01)",
      "Cotes à confirmer sur plan original lisible",
    ],
  },
  "IM-05": {
    designation: "Implantation et traçage au sol des semelles isolées S1 et S2 suivant plan d'exécution C-01",
    replacesDesignation: "Traçage des semelles isolées S1 et S2",
    technicalDescription:
      "Implantation et traçage au sol de l'emplacement de chaque semelle isolée S1 et S2, avec report des axes et de l'emprise de fouille associée, suivant le plan d'exécution C-01.",
    includedServices: [
      "Repérage individuel de chaque semelle isolée",
      "Traçage de l'emprise de fouille S1 et S2",
      "Contrôle d'implantation par rapport aux axes principaux",
      "Marquage distinctif S1 / S2",
    ],
    technicalReferences: [R.plan(), R.dtu131()],
    executionNotes:
      "Vérifier le nombre et la position de chaque semelle avant terrassement. Toute absence ou doublon sur plan raster doit être clarifié.",
    qualityControls: [
      "Contrôler le nombre de semelles S1 et S2",
      "Vérifier les entraxes et l'alignement avec la structure portée",
    ],
    technicalReservations: [
      "Nombre de semelles issu d'hypothèses de démonstration (H-02)",
      "Dimensions lues sur plan raster : à vérifier (RELEVE_A_VERIFIER)",
    ],
  },
  "TE-01": {
    designation: "Terrassement mécanique en rigoles pour fondations superficielles de type SF1",
    replacesDesignation: "Fouilles en rigoles SF1",
    technicalDescription:
      "Exécution des fouilles en rigoles destinées à recevoir les semelles filantes SF1 suivant les implantations du plan d'exécution C-01. Terrassement mécanique avec finitions manuelles des fonds et des joues dans la mesure nécessaire à l'assise des ouvrages.",
    includedServices: [
      "Terrassement mécanique en rigoles",
      "Finitions manuelles des fonds et joues",
      "Réglage indicatif des fonds de fouille",
      "Contrôle des profondeurs d'assise",
      "Gestion des déblais jusqu'à la zone de stockage ou d'évacuation",
    ],
    technicalReferences: [R.dtu131(), R.dtdict(), R.plan()],
    executionNotes:
      "Respecter la largeur de fouille retenue (hypothèse de surlargeur). Adapter le mode opératoire à la nature du terrain — à confirmer sur chantier. En présence de réseaux, arrêter et faire constater.",
    qualityControls: [
      "Contrôler largeur, profondeur et linéarité des rigoles",
      "Vérifier l'absence de remblais non portants en fond de fouille",
      "Contrôler le niveau d'assise par rapport aux repères altimétriques",
    ],
    technicalReservations: [
      "Largeur et profondeur de fouille : hypothèses de démonstration (H-03, H-04)",
      "Nature du terrain et présence d'eau : à vérifier",
      "Aptitude des déblais au réemploi : à confirmer",
      "Références DTU indiquées à titre indicatif — non vérifiées sur dossier réel",
    ],
  },
  "TE-02": {
    designation: "Terrassement mécanique en puits pour semelles isolées S1",
    replacesDesignation: "Fouilles en puits semelles isolées S1",
    technicalDescription:
      "Ouverture des fouilles en puits destinées aux semelles isolées S1, aux dimensions d'emprise retenues pour le scénario, avec contrôle des niveaux d'assise et évacuation ou stockage des déblais.",
    includedServices: [
      "Terrassement mécanique des puits S1",
      "Finitions manuelles en fond de fouille",
      "Contrôle des dimensions et profondeurs",
      "Gestion des déblais associés",
    ],
    technicalReferences: [R.dtu131(), R.dtdict(), R.plan()],
    executionNotes:
      "Éviter le débordement excessif des joues. Adapter la méthode si le terrain se dérobe ou si un réseau est rencontré.",
    qualityControls: [
      "Contrôler longueur, largeur et profondeur de chaque puits",
      "Vérifier la position par rapport au traçage S1",
    ],
    technicalReservations: [
      "Dimensions de fouille S1 : hypothèses de démonstration",
      "Portance et nature du fond de fouille : à vérifier sur chantier",
    ],
  },
  "TE-03": {
    designation: "Terrassement mécanique en puits pour semelles isolées S2",
    replacesDesignation: "Fouilles en puits semelles isolées S2",
    technicalDescription:
      "Ouverture des fouilles en puits destinées aux semelles isolées S2, selon les emprises retenues pour le scénario de démonstration et le plan d'exécution C-01.",
    includedServices: [
      "Terrassement mécanique des puits S2",
      "Finitions manuelles en fond de fouille",
      "Contrôle des dimensions et profondeurs",
      "Gestion des déblais associés",
    ],
    technicalReferences: [R.dtu131(), R.dtdict(), R.plan()],
    executionNotes: "Même logique d'exécution que les puits S1, avec repérage distinct des ouvrages S2.",
    qualityControls: [
      "Contrôler dimensions et profondeur de chaque puits S2",
      "Vérifier l'implantation par rapport aux axes",
    ],
    technicalReservations: [
      "Dimensions de fouille S2 : hypothèses de démonstration",
      "Conditions de terrain à confirmer avant exécution réelle",
    ],
  },
  "TE-04": {
    designation: "Réglage et reprise des fonds de fouille avant mise en œuvre du béton de propreté",
    replacesDesignation: "Réglage des fonds de fouille (surface brute)",
    technicalDescription:
      "Réglage des fonds de fouille des semelles filantes et isolées, y compris purge locale des parties décomprimées et préparation de l'assise avant coulage du béton de propreté. La quantité correspond à une surface brute théorique sans correction d'intersections.",
    includedServices: [
      "Réglage manuel ou mécanisé des fonds",
      "Purge locale des zones décomprimées",
      "Mise à niveau d'assise",
      "Préparation avant béton de propreté",
    ],
    technicalReferences: [R.dtu131(), R.plan()],
    executionNotes:
      "Ne pas confondre cette surface (m²) avec les volumes de déblais (m³). Toute zone trop décomprimée doit être purgée et reprise selon prescription à confirmer.",
    qualityControls: [
      "Contrôler le niveau d'assise sur l'ensemble des ouvrages",
      "Vérifier la propreté et la portance apparente du fond",
    ],
    technicalReservations: [
      "Surface brute théorique sans correction d'intersections",
      "Mode de reprise des fonds décomprimés : à confirmer au CCTP",
    ],
  },
  "EV-01": {
    designation: "Volume des déblais en place issus des fouilles de fondations (indicateur)",
    replacesDesignation: "Déblais en place (avant décision de réemploi)",
    technicalDescription:
      "Indicateur technique du volume de déblais en place produit par l'ensemble des fouilles (rigoles SF1 et puits S1/S2). Cette grandeur ne constitue pas automatiquement la quantité à évacuer : elle dépend du scénario de réemploi.",
    includedServices: ["Calcul de synthèse des volumes excavés en place"],
    technicalReferences: [R.plan()],
    executionNotes: "Utiliser cet indicateur pour piloter le bilan terres / évacuation / remblai.",
    qualityControls: ["Recouper le volume avec TE-01 + TE-02 + TE-03"],
    technicalReservations: [
      "Volume théorique de démonstration",
      "Foisonnement et réemploi non inclus dans cet indicateur",
    ],
  },
  "EV-02": {
    designation: "Volume théorique des déblais foisonnés (indicateur de transport)",
    replacesDesignation: "Déblais foisonnés théoriques (si tout transporté)",
    technicalDescription:
      "Indicateur de capacité de transport obtenu en appliquant un coefficient de foisonnement aux déblais en place. Sert au dimensionnement logistique ; n'est pas une quantité de prestation de terrassement en place.",
    includedServices: ["Application du coefficient de foisonnement retenu au scénario"],
    technicalReferences: [],
    executionNotes: "Le coefficient de foisonnement est une hypothèse — à adapter à la nature réelle des terres.",
    qualityControls: ["Vérifier la cohérence avec EV-01 et le paramètre de foisonnement"],
    technicalReservations: [
      "Coefficient de foisonnement : hypothèse de démonstration",
      "Ne pas utiliser comme métré contractuel d'excavation",
    ],
  },
  "EV-03": {
    designation: "Chargement, transport et évacuation des déblais excédentaires (volume foisonné)",
    replacesDesignation: "Chargement, transport et évacuation des déblais excédentaires (foisonnés)",
    technicalDescription:
      "Chargement, transport et évacuation hors site des déblais non réemployés, exprimés en volume foisonné. La quantité dépend du taux de réemploi retenu et du coefficient de foisonnement. Lieu de dépôt, distance et conditions d'acceptation à confirmer.",
    includedServices: [
      "Chargement des déblais excédentaires",
      "Transport vers le lieu de dépôt",
      "Évacuation hors site selon filières à confirmer",
    ],
    technicalReferences: [
      {
        label: "Filière d'évacuation des terres",
        kind: "TO_VERIFY",
        note: "Installation de stockage / valorisation / mise en dépôt — à confirmer.",
      },
    ],
    executionNotes:
      "Anticiper les rotations de camions, les accès et les éventuelles analyses de terres exigées par le lieu de dépôt.",
    qualityControls: [
      "Suivre les bons d'évacuation",
      "Contrôler la cohérence des volumes chargés avec le scénario de réemploi",
    ],
    technicalReservations: [
      "Taux de réemploi et foisonnement : hypothèses de démonstration",
      "Lieu de dépôt, distance et coûts : à confirmer",
      "Caractérisation des terres (inertes / autres) : à vérifier",
    ],
  },
  "EV-04": {
    designation: "Terres conservées sur site en vue de réemploi au remblaiement (volume en place)",
    replacesDesignation: "Terres conservées sur site pour réemploi (volume en place)",
    technicalDescription:
      "Indicateur du volume de déblais conservés sur site pour un éventuel réemploi au remblaiement. L'aptitude des terres, l'emprise de stockage et la protection contre les intempéries restent à vérifier.",
    includedServices: ["Stockage temporaire sur site selon scénario de réemploi"],
    technicalReferences: [],
    executionNotes: "Séparer clairement les terres réemployables des déblais à évacuer.",
    qualityControls: ["Contrôler le volume stocké et l'état des terres avant réemploi"],
    technicalReservations: [
      "Aptitude au réemploi non démontrée dans ce scénario",
      "Emprise et protection du stockage : à confirmer",
    ],
  },
  "EV-05": {
    designation: "Bilan terre / remblai (indicateur — négatif = apport à prévoir)",
    replacesDesignation: "Bilan des terres pour remblaiement (négatif = apport à prévoir)",
    technicalDescription:
      "Indicateur de pilotage comparant les terres réemployables disponibles au volume théorique à remblayer. Un résultat négatif signale un besoin d'apport de matériaux — à confirmer après choix de niveau fini et de compactage.",
    includedServices: ["Synthèse du bilan terres pour aide à la décision"],
    technicalReferences: [],
    executionNotes: "Ne pas transformer cet indicateur en commande de remblai sans validation conducteur.",
    qualityControls: ["Recouper avec EV-04 et RE-01"],
    technicalReservations: [
      "Bilan brut sans prise en compte du compactage",
      "Niveau fini et nature du remblai : à confirmer",
    ],
  },
  "BP-01": {
    designation: "Fourniture et mise en œuvre de béton de propreté sous semelles filantes SF1",
    replacesDesignation: "Béton de propreté SF1",
    technicalDescription:
      "Fourniture et coulage d'un béton de propreté en fond de fouille des semelles filantes SF1, destiné à assurer une assise propre et réglée avant pose des armatures. Épaisseur et largeur selon paramètres du scénario — classe de béton à confirmer.",
    includedServices: [
      "Fourniture du béton de propreté",
      "Coulage en fond de fouille SF1",
      "Réglage de surface avant ferraillage",
    ],
    technicalReferences: [R.dtu21(), R.en206("Classe et exposition du béton de propreté à confirmer."), R.plan()],
    executionNotes:
      "Couler sur fond propre et réglé. Respecter l'épaisseur retenue. Ne pas confondre avec le béton structurel des semelles.",
    qualityControls: [
      "Contrôler l'épaisseur et la planéité",
      "Vérifier la propreté du fond avant coulage",
    ],
    technicalReservations: [
      "Épaisseur et largeur : hypothèses / formules du scénario",
      "Classe de béton non prescrite dans la démonstration — à confirmer",
      "Références NF EN 206/CN et DTU 21 indiquées à titre indicatif",
    ],
  },
  "BP-02": {
    designation: "Fourniture et mise en œuvre de béton de propreté sous semelles isolées S1",
    replacesDesignation: "Béton de propreté S1",
    technicalDescription:
      "Fourniture et coulage du béton de propreté en fond des puits des semelles isolées S1, avant pose des armatures et bétonnage structurel.",
    includedServices: [
      "Fourniture du béton de propreté",
      "Coulage en fond de fouille S1",
      "Réglage de surface",
    ],
    technicalReferences: [R.dtu21(), R.en206(), R.plan()],
    executionNotes: "Assurer un fond propre sur toute l'emprise de chaque semelle S1.",
    qualityControls: ["Contrôler épaisseur et couverture de chaque semelle S1"],
    technicalReservations: [
      "Classe de béton à confirmer",
      "Dimensions issues du scénario de démonstration",
    ],
  },
  "BP-03": {
    designation: "Fourniture et mise en œuvre de béton de propreté sous semelles isolées S2",
    replacesDesignation: "Béton de propreté S2",
    technicalDescription:
      "Fourniture et coulage du béton de propreté en fond des puits des semelles isolées S2, avant ferraillage et bétonnage des semelles.",
    includedServices: [
      "Fourniture du béton de propreté",
      "Coulage en fond de fouille S2",
      "Réglage de surface",
    ],
    technicalReferences: [R.dtu21(), R.en206(), R.plan()],
    executionNotes: "Même exigence de propreté et d'épaisseur que pour S1.",
    qualityControls: ["Contrôler épaisseur et couverture de chaque semelle S2"],
    technicalReservations: [
      "Classe de béton à confirmer",
      "Dimensions issues du scénario de démonstration",
    ],
  },
  "TOT-01": {
    designation: "Synthèse — volume total de béton de propreté (indicateur)",
    replacesDesignation: "Total béton de propreté",
    technicalDescription:
      "Indicateur de synthèse du volume total de béton de propreté (SF1 + S1 + S2). Sert au pilotage des approvisionnements ; n'ajoute pas de prestation autonome.",
    includedServices: ["Agrégation des postes BP-01, BP-02 et BP-03"],
    technicalReferences: [],
    executionNotes: "Utiliser pour estimer les rotations de toupie (voir LOG-02).",
    qualityControls: ["Recouper avec BP-01 + BP-02 + BP-03"],
    technicalReservations: ["Indicateur de démonstration — non contractuel en tant que poste autonome"],
  },
  "AR-01": {
    designation:
      "Fourniture, façonnage et pose des armatures HA pour semelles filantes et isolées (quantité forfaitaire de test)",
    replacesDesignation: "Fourniture, façonnage et pose des aciers HA (quantité de test)",
    technicalDescription:
      "Poste groupé de démonstration couvrant la fourniture, le façonnage et la pose des armatures en acier HA destinées aux semelles filantes SF1 et aux semelles isolées S1/S2. La masse est forfaitaire et ne constitue pas un dimensionnement structurel. Calage, enrobage et attentes éventuelles pour soubassement restent à préciser sur plans de ferraillage.",
    includedServices: [
      "Fourniture des armatures HA",
      "Façonnage selon nomenclature à confirmer",
      "Pose, ligature et calage",
      "Mise en place des distanciers d'enrobage",
      "Attentes éventuelles pour ouvrages de soubassement (si prescrit)",
    ],
    technicalReferences: [
      R.dtu21("Enrobage et mise en œuvre des armatures — à confirmer."),
      {
        label: "Plans de ferraillage",
        kind: "TO_VERIFY",
        note: "Nomenclature, diamètres et dispositions : absents ou incomplets dans la démonstration.",
      },
      R.plan(),
    ],
    executionNotes:
      "Ne pas traiter cette masse comme un calcul d'ingénierie. Avant bétonnage : contrôler implantations, enrobages et réservations.",
    qualityControls: [
      "Contrôler la conformité visuelle de pose et d'enrobage",
      "Vérifier l'absence de contact terre / acier",
      "Point d'arrêt avant bétonnage (voir CO-01)",
    ],
    technicalReservations: [
      "Masse forfaitaire de test — NON issue d'un dimensionnement",
      "Plans de ferraillage et nuances d'acier : à confirmer",
      "Ne pas présenter comme conforme à une norme sans vérification",
    ],
  },
  "BE-01": {
    designation: "Fourniture et mise en œuvre de béton pour semelles filantes en béton armé SF1 — section 50 × 25 cm",
    replacesDesignation: "Béton des semelles filantes SF1",
    technicalDescription:
      "Fourniture et coulage du béton des semelles filantes SF1, section relevée 50 × 25 cm sur plan C-01, sur béton de propreté et armatures en place. Vibration, finition et protection immédiate du béton frais font partie de la mise en œuvre courante — classe d'exposition et résistance à confirmer.",
    includedServices: [
      "Fourniture du béton structurel des semelles SF1",
      "Coulage sur armatures en place",
      "Vibration et finition",
      "Protection immédiate du béton frais",
    ],
    technicalReferences: [R.dtu21(), R.en206(), R.dtu131(), R.plan()],
    executionNotes:
      "Ne couler qu'après validation du ferraillage et des fonds (CO-01). Anticiper les accès toupie et le phasage de coulage.",
    qualityControls: [
      "Contrôler les dimensions de section avant / pendant coulage",
      "Vérifier la continuité du coulage et la vibration",
      "Assurer la protection / cure dès la fin de coulage",
    ],
    technicalReservations: [
      "Section 50 × 25 cm lue sur plan — à confirmer sur document original",
      "Classe de béton, exposition et formulation : non prescrites dans la démonstration",
      "Références normatives indiquées à titre indicatif",
    ],
  },
  "BE-02": {
    designation: "Fourniture et mise en œuvre de béton pour semelles isolées S1 — section 80 × 80 × 25 cm",
    replacesDesignation: "Béton des semelles isolées S1",
    technicalDescription:
      "Fourniture et coulage du béton des semelles isolées S1 (section indicative 80 × 80 × 25 cm, lecture incertaine sur plan raster), sur propreté et armatures en place.",
    includedServices: [
      "Fourniture du béton des semelles S1",
      "Coulage, vibration et finition",
      "Protection du béton frais",
    ],
    technicalReferences: [R.dtu21(), R.en206(), R.dtu131(), R.plan()],
    executionNotes: "Confirmer les cotes S1 avant coffrage / coulage : lecture raster incertaine.",
    qualityControls: [
      "Contrôler dimensions et niveau de chaque semelle S1",
      "Vérifier l'enrobage pendant le coulage",
    ],
    technicalReservations: [
      "Cotes S1 en RELEVE_A_VERIFIER",
      "Classe de béton à confirmer",
    ],
  },
  "BE-03": {
    designation: "Fourniture et mise en œuvre de béton pour semelles isolées S2",
    replacesDesignation: "Béton des semelles isolées S2",
    technicalDescription:
      "Fourniture et coulage du béton des semelles isolées S2 suivant les dimensions retenues au scénario et le plan d'exécution C-01, sur béton de propreté et armatures en place.",
    includedServices: [
      "Fourniture du béton des semelles S2",
      "Coulage, vibration et finition",
      "Protection du béton frais",
    ],
    technicalReferences: [R.dtu21(), R.en206(), R.dtu131(), R.plan()],
    executionNotes: "Phaser le coulage avec les semelles SF1/S1 selon accès et disponibilité des toupies.",
    qualityControls: [
      "Contrôler dimensions et niveau de chaque semelle S2",
      "Vérifier la continuité du coulage",
    ],
    technicalReservations: [
      "Dimensions S2 issues du scénario — à confirmer",
      "Classe de béton à confirmer",
    ],
  },
  "TOT-02": {
    designation: "Synthèse — volume total de béton des semelles (indicateur)",
    replacesDesignation: "Total béton des semelles",
    technicalDescription:
      "Indicateur de synthèse du béton structurel des semelles (SF1 + S1 + S2), hors béton de propreté.",
    includedServices: ["Agrégation des postes BE-01, BE-02 et BE-03"],
    technicalReferences: [],
    executionNotes: "Sert notamment au ratio aciers/béton (TOT-04) et à la logistique toupies (LOG-03).",
    qualityControls: ["Recouper avec BE-01 + BE-02 + BE-03"],
    technicalReservations: ["Indicateur de démonstration"],
  },
  "TOT-03": {
    designation: "Synthèse — volume total de béton (propreté + semelles) (indicateur)",
    replacesDesignation: "Total béton (propreté + semelles)",
    technicalDescription:
      "Indicateur global du béton mis en œuvre sur la phase fondations (propreté et semelles).",
    includedServices: ["Agrégation TOT-01 + TOT-02"],
    technicalReferences: [],
    executionNotes: "Utile au pilotage des approvisionnements globaux.",
    qualityControls: ["Recouper avec TOT-01 et TOT-02"],
    technicalReservations: ["Indicateur de démonstration"],
  },
  "TOT-04": {
    designation: "Contrôle de vraisemblance — ratio aciers / béton des semelles (indicateur)",
    replacesDesignation: "Ratio aciers / béton des semelles (contrôle de vraisemblance)",
    technicalDescription:
      "Indicateur de cohérence masse d'aciers / volume de béton des semelles. Sert uniquement au contrôle de vraisemblance du scénario ; ne valide aucun ferraillage ni aucune conformité structurelle.",
    includedServices: ["Calcul de ratio AR-01 / TOT-02"],
    technicalReferences: [],
    executionNotes: "Toute valeur hors fourchette habituelle doit conduire à vérifier la masse d'aciers et les volumes béton — sans conclure à une conformité.",
    qualityControls: ["Signaler tout écart manifeste de cohérence"],
    technicalReservations: [
      "Ne valide aucun dimensionnement",
      "Masse d'aciers forfaitaire de test",
    ],
  },
  "CO-01": {
    designation: "Contrôle d'implantation, des armatures et des fonds de fouille avant bétonnage",
    replacesDesignation: "Vérification de l'implantation, des armatures et des fonds de fouille avant bétonnage",
    technicalDescription:
      "Point d'arrêt de contrôle avant coulage des semelles : vérification de l'implantation, des dimensions, de la propreté des fonds, de la pose des armatures, des enrobages et des réservations éventuelles. Aucun bétonnage structurel ne doit démarrer sans cette validation.",
    includedServices: [
      "Contrôle d'implantation des ouvrages",
      "Contrôle des fonds et de la propreté",
      "Contrôle visuel du ferraillage et des enrobages",
      "Autorisation de coulage ou levée des réserves",
    ],
    technicalReferences: [R.dtu21("Contrôles avant bétonnage — selon CCTP."), R.plan()],
    executionNotes:
      "Formaliser le point d'arrêt (photos, observations, responsable). En cas de non-conformité, différer le coulage.",
    qualityControls: [
      "Check-list implantation / dimensions / armatures / enrobages",
      "Enregistrement des réserves éventuelles",
    ],
    technicalReservations: [
      "Hypothèse forfaitaire de démonstration",
      "Procédure exacte de validation MOE/MOA : à confirmer",
    ],
  },
  "CO-02": {
    designation: "Cure et protection du béton des semelles après coulage",
    replacesDesignation: "Cure et protection du béton",
    technicalDescription:
      "Mise en œuvre des dispositions de cure et de protection du béton frais des semelles (humidification, bâchage ou produit de cure selon choix à confirmer), afin de limiter la dessiccation précoce. La durée calendaire retenue dans le scénario est une hypothèse de démonstration, non un délai réglementaire affirmé.",
    includedServices: [
      "Mise en place de la protection immédiate après coulage",
      "Maintien de la cure pendant la durée retenue au scénario",
      "Surveillance visuelle pendant la période de protection",
    ],
    technicalReferences: [
      R.dtu21("Dispositions de cure — modalités à confirmer selon exposition et saison."),
    ],
    executionNotes:
      "Adapter la méthode à la saison et à l'exposition. Ne pas présenter la durée du scénario comme une exigence normative certaine.",
    qualityControls: [
      "Vérifier la mise en place immédiate de la protection",
      "Contrôler le maintien pendant la période retenue",
    ],
    technicalReservations: [
      "Durée et méthode de cure : hypothèses de démonstration",
      "Ne pas affirmer une conformité DTU sans vérification du dossier réel",
    ],
  },
  "RE-01": {
    designation: "Volume théorique résiduel à remblayer après réalisation des semelles (indicateur)",
    replacesDesignation: "Vide théorique résiduel à remblayer (si remise au niveau initial)",
    technicalDescription:
      "Indicateur du volume théorique restant à remblayer pour une remise approximative au niveau initial après déduction des bétons de propreté et des semelles. Omet intersections, compactage, soubassements et niveau fini réel. Le remblaiement proprement dit (apport, compactage par couches) reste à préciser au dossier d'exécution.",
    includedServices: [
      "Évaluation du volume théorique à remblayer",
      "Aide au dimensionnement du remblaiement (hors exécution détaillée)",
    ],
    technicalReferences: [R.dtu131("Remblaiement au droit des fondations — modalités à confirmer.")],
    executionNotes:
      "Le remblaiement ne doit pas endommager les ouvrages fraîchement coulés. Compactage par couches et nature des matériaux : à confirmer.",
    qualityControls: [
      "Recouper avec EV-01, TOT-01 et TOT-02",
      "Avant remblai réel : vérifier le niveau fini et la nature des matériaux",
    ],
    technicalReservations: [
      "Indicateur théorique de démonstration",
      "Compactage, intersections et soubassements non modélisés",
      "Nature du remblai (réemploi / apport) : à confirmer",
    ],
  },
  "RE-02": {
    designation: "Nettoyage des abords et repli des moyens de la phase fondations",
    replacesDesignation: "Nettoyage et repli du chantier",
    technicalDescription:
      "Nettoyage des abords de la zone de fondations et repli des moyens spécifiques à la phase (matériel d'implantation, protections, stockages temporaires), en vue de la poursuite du chantier ou de la réception de phase.",
    includedServices: [
      "Nettoyage des abords et zones de travail",
      "Repli du matériel de la phase fondations",
      "Évacuation des déchets de chantier de la phase",
      "Remise en état sommaire des zones d'installation temporaire",
    ],
    technicalReferences: [],
    executionNotes:
      "Anticiper le phasage avec les lots suivants (soubassements, gros œuvre). Conserver les preuves photos utiles au DOE / CR.",
    qualityControls: [
      "Vérifier l'absence de déchets et d'obstacles pour la suite du chantier",
      "Contrôler le repli complet du matériel de phase",
    ],
    technicalReservations: [
      "Hypothèse forfaitaire de démonstration",
      "Périmètre exact de nettoyage / repli à adapter au plan d'installation",
    ],
  },
  "LOG-01": {
    designation: "Estimation du nombre de rotations de camion benne pour évacuation des déblais",
    replacesDesignation: "Rotations de camion benne estimées",
    technicalDescription:
      "Indicateur logistique estimant le nombre de rotations de camion benne nécessaires à l'évacuation des déblais excédentaires foisonnés. Capacité de benne et conditions d'accès à confirmer.",
    includedServices: ["Estimation logistique des rotations"],
    technicalReferences: [],
    executionNotes: "Recaler selon capacité réelle des bennes et contraintes d'accès / horaires.",
    qualityControls: ["Recouper avec EV-03 et la capacité paramétrée"],
    technicalReservations: [
      "Capacité de benne : hypothèse de démonstration",
      "Ne constitue pas une commande de transport",
    ],
  },
  "LOG-02": {
    designation: "Estimation du nombre de camions toupie — béton de propreté",
    replacesDesignation: "Camions toupies estimés — béton de propreté",
    technicalDescription:
      "Indicateur logistique du nombre de toupies estimé pour le béton de propreté, selon la capacité retenue au scénario.",
    includedServices: ["Estimation logistique des toupies de propreté"],
    technicalReferences: [],
    executionNotes: "Adapter à la capacité réelle du fournisseur et au phasage de coulage.",
    qualityControls: ["Recouper avec TOT-01"],
    technicalReservations: ["Capacité toupie : hypothèse de démonstration"],
  },
  "LOG-03": {
    designation: "Estimation du nombre de camions toupie — béton des semelles",
    replacesDesignation: "Camions toupies estimés — béton des semelles",
    technicalDescription:
      "Indicateur logistique du nombre de toupies estimé pour le béton structurel des semelles, selon la capacité retenue au scénario.",
    includedServices: ["Estimation logistique des toupies de béton des semelles"],
    technicalReferences: [],
    executionNotes: "Coordonner avec le point d'arrêt CO-01 et les accès chantier.",
    qualityControls: ["Recouper avec TOT-02"],
    technicalReservations: ["Capacité toupie : hypothèse de démonstration"],
  },
};

export const C01_ENRICHMENT_BUNDLE_ID = "c01-fondations-demo-v1";

/** Indique si une étude C-01 peut recevoir l'enrichissement des fiches. */
export function studyNeedsC01TextEnrichment(study: {
  bundleId: string | null;
  lines: { code: string; designation: string; description: string | null; includedServices?: string[] }[];
}): boolean {
  if (study.bundleId !== C01_ENRICHMENT_BUNDLE_ID) return false;
  return study.lines.some((l) => {
    const e = C01_LINE_TEXT_ENRICHMENTS[l.code];
    if (!e) return false;
    if (l.designation === e.replacesDesignation) return true;
    if (!l.description && e.technicalDescription) return true;
    if (!(l.includedServices?.length) && e.includedServices.length) return true;
    return false;
  });
}
