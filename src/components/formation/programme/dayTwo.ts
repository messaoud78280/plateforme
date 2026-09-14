/** Programme Jour 2 — pratique & approfondissement (sans détail technique propriétaire). */

export type DayTwoStep = {
  id: string;
  time: string;
  title: string;
  subtitle: string;
  variant?: "default" | "pause" | "close";
};

export const DAY_TWO_STEPS: readonly DayTwoStep[] = [
  {
    id: "reprendre",
    time: "09:00",
    title: "Reprendre son projet",
    subtitle:
      "Faire le point sur la première version et définir les priorités de la journée.",
  },
  {
    id: "structurer",
    time: "09:45",
    title: "Mieux structurer",
    subtitle:
      "Organiser les écrans, les fonctions et les différentes parties du projet.",
  },
  {
    id: "fonctionnalite",
    time: "10:30",
    title: "Ajouter une fonctionnalité",
    subtitle: "Passer d’une interface à quelque chose de réellement utilisable.",
  },
  {
    id: "circuler",
    time: "11:30",
    title: "Faire circuler les informations",
    subtitle:
      "Comprendre comment différentes parties d’un projet communiquent entre elles.",
  },
  {
    id: "pause",
    time: "12:30",
    title: "Pause",
    subtitle: "Temps de respiration avant la suite de la journée.",
    variant: "pause",
  },
  {
    id: "projet",
    time: "13:30",
    title: "Votre projet",
    subtitle:
      "Travailler davantage sur votre propre idée avec un accompagnement guidé.",
  },
  {
    id: "tester",
    time: "14:30",
    title: "Tester comme un utilisateur",
    subtitle:
      "Parcourir le projet, repérer les incohérences et identifier ce qui doit être amélioré.",
  },
  {
    id: "corriger",
    time: "15:15",
    title: "Corriger & améliorer",
    subtitle:
      "Utiliser l’IA pour diagnostiquer, corriger et améliorer progressivement le projet.",
  },
  {
    id: "plus-loin",
    time: "16:00",
    title: "Aller plus loin",
    subtitle:
      "Ajouter une fonction, améliorer l’interface ou approfondir une partie importante du projet.",
  },
  {
    id: "autonomie",
    time: "16:40",
    title: "Devenir plus autonome",
    subtitle:
      "Organiser la suite : savoir quoi demander, quoi tester et comment progresser.",
  },
  {
    id: "bilan",
    time: "17:00",
    title: "Bilan & suite",
    subtitle:
      "Présenter ce qui a été réalisé et définir les prochaines étapes du projet.",
    variant: "close",
  },
] as const;
