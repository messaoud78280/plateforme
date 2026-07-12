/**
 * Onboarding court par rôle — ≤ 5 minutes, ignorable / reprenable.
 */

export type OnboardingRole =
  | "MANAGER"
  | "AGENCE"
  | "AGENT"
  | "CLIENT"
  | "PROSPECT_DEMO"
  | "CONDUCTEUR";

export type OnboardingStep = {
  title: string;
  body: string;
  href?: string;
};

export const ROLE_ONBOARDING: Record<OnboardingRole, { label: string; steps: OnboardingStep[] }> = {
  MANAGER: {
    label: "Gérant",
    steps: [
      {
        title: "Pilotage global",
        body: "Le tableau de bord montre urgences, missions à valider et chantiers à risque.",
        href: "/dashboard",
      },
      {
        title: "Clients et équipe",
        body: "Créez un client, assignez un agent, suivez les crédits.",
        href: "/dashboard/clients",
      },
      {
        title: "Démonstrations",
        body: "Générez un lien prospect pour présenter le Pilotage sans données réelles.",
        href: "/dashboard/demonstrations",
      },
    ],
  },
  AGENCE: {
    label: "Administrateur / Agence",
    steps: [
      {
        title: "Missions",
        body: "Assignez, suivez et validez les livrables de l’équipe.",
        href: "/dashboard/taches",
      },
      {
        title: "Chantiers",
        body: "Ouvrez le classeur numérique : pièces manquantes et DOE.",
        href: "/dashboard/projets",
      },
      {
        title: "Messagerie",
        body: "Échangez par mission — chaque message reste tracé.",
        href: "/dashboard/messagerie",
      },
    ],
  },
  AGENT: {
    label: "Assistant BeWork",
    steps: [
      {
        title: "Vos missions",
        body: "Traitez d’abord les urgences et les échéances du jour.",
        href: "/dashboard/taches",
      },
      {
        title: "Documents",
        body: "Déposez les livrables dans le classeur du chantier lié.",
        href: "/dashboard/documents",
      },
      {
        title: "Messagerie",
        body: "Répondez au client depuis la mission — pas d’email hors plateforme.",
        href: "/dashboard/messagerie",
      },
    ],
  },
  CLIENT: {
    label: "Utilisateur client",
    steps: [
      {
        title: "Nouvelle mission",
        body: "Décrivez le besoin, l’échéance et joignez les pièces utiles.",
        href: "/dashboard/nouvelle-demande",
      },
      {
        title: "Suivi",
        body: "Suivez l’avancement et échangez avec votre assistant.",
        href: "/dashboard/taches",
      },
      {
        title: "Chantiers",
        body: "Retrouvez vos dossiers et documents classés.",
        href: "/dashboard/projets",
      },
    ],
  },
  CONDUCTEUR: {
    label: "Conducteur de travaux",
    steps: [
      {
        title: "Portefeuille Pilotage",
        body: "Repérez en 10 secondes les retards, blocages et DOE à risque.",
        href: "/dashboard/pilotage-travaux",
      },
      {
        title: "Fiche chantier",
        body: "Obligations, visas, GED et sécurisation — validez avant engagement.",
        href: "/dashboard/pilotage-travaux",
      },
      {
        title: "À traiter",
        body: "Travaillez la file du jour : une action = un responsable + une date.",
        href: "/dashboard/pilotage-travaux/a-traiter",
      },
    ],
  },
  PROSPECT_DEMO: {
    label: "Prospect en démonstration",
    steps: [
      {
        title: "Données fictives",
        body: "Tout ce que vous voyez est une simulation commerciale BeWork.",
      },
      {
        title: "Visite guidée",
        body: "Utilisez le mode présentation et les onglets pour parcourir le Pilotage.",
      },
      {
        title: "Suite",
        body: "Indiquez vos centres d’intérêt en fin de parcours pour le compte-rendu commercial.",
      },
    ],
  },
};

export function mapSessionRoleToOnboarding(
  role: string | null | undefined,
  opts?: { isDemoProspect?: boolean; preferConducteur?: boolean },
): OnboardingRole {
  if (opts?.isDemoProspect) return "PROSPECT_DEMO";
  if (opts?.preferConducteur) return "CONDUCTEUR";
  if (role === "MANAGER") return "MANAGER";
  if (role === "AGENCE") return "AGENCE";
  if (role === "AGENT") return "AGENT";
  return "CLIENT";
}

export function onboardingStorageKey(userId: string, role: OnboardingRole): string {
  return `bework-onboarding-v1-${role}-${userId}`;
}
