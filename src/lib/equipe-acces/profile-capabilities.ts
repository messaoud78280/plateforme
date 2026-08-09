/**
 * Capacités humaines par profil — affichage Équipe V2A.
 * Ne remplace pas les ACL serveur : pure présentation.
 */
import type { PermissionProfileKey } from "./types";

export type ProfileCapability = {
  label: string;
  allowed: boolean;
};

export const PROFILE_CAPABILITIES: Record<PermissionProfileKey, ProfileCapability[]> = {
  DIRECTION: [
    { label: "Tous les chantiers", allowed: true },
    { label: "Gérer les équipes", allowed: true },
    { label: "Commandes", allowed: true },
    { label: "Documents", allowed: true },
    { label: "Planning", allowed: true },
    { label: "Agenda", allowed: true },
    { label: "Messagerie", allowed: true },
    { label: "Alertes / À traiter", allowed: true },
  ],
  ADMINISTRATIF: [
    { label: "Documents", allowed: true },
    { label: "Commandes & BL", allowed: true },
    { label: "Administratif", allowed: true },
    { label: "Tâches attribuées", allowed: true },
    { label: "Agenda", allowed: true },
    { label: "Messagerie", allowed: true },
    { label: "Gérer les équipes", allowed: true },
    { label: "Pilotage interne avancé", allowed: false },
  ],
  CONDUCTEUR: [
    { label: "Ses chantiers", allowed: true },
    { label: "Planning", allowed: true },
    { label: "Agenda", allowed: true },
    { label: "Tâches", allowed: true },
    { label: "Commandes", allowed: true },
    { label: "Documents", allowed: true },
    { label: "Messagerie", allowed: true },
    { label: "Gérer toute l’équipe", allowed: false },
  ],
  CHEF_CHANTIER: [
    { label: "Ses chantiers", allowed: true },
    { label: "Planning / interventions", allowed: true },
    { label: "Tâches terrain", allowed: true },
    { label: "Documents partagés", allowed: true },
    { label: "Messagerie chantier", allowed: true },
    { label: "Commandes internes", allowed: false },
  ],
  CLIENT: [
    { label: "Portail client", allowed: true },
    { label: "Documents partagés", allowed: true },
    { label: "Messages client", allowed: true },
    { label: "Agenda partagé", allowed: true },
    { label: "À traiter interne", allowed: false },
    { label: "Commandes internes", allowed: false },
  ],
  FOURNISSEUR: [
    { label: "Commandes partagées", allowed: true },
    { label: "Livraisons concernées", allowed: true },
    { label: "Documents explicitement partagés", allowed: true },
    { label: "Messages fournisseur", allowed: true },
    { label: "Planning interne", allowed: false },
    { label: "Tous les chantiers", allowed: false },
  ],
  SOUS_TRAITANT: [
    { label: "Documents partagés", allowed: true },
    { label: "Interventions attribuées", allowed: true },
    { label: "Messagerie chantier", allowed: true },
    { label: "Commandes internes", allowed: false },
    { label: "Documents confidentiels", allowed: false },
  ],
  PARTENAIRE: [
    { label: "Documents partagés", allowed: true },
    { label: "Messagerie autorisée", allowed: true },
    { label: "Agenda partagé", allowed: true },
    { label: "Pilotage interne", allowed: false },
  ],
};

/** Fonctions UI collaborateur → profil + libellé métier. */
export const INTERNAL_JOB_OPTIONS = [
  { key: "DIRECTION", label: "Direction", profile: "DIRECTION" as const },
  { key: "CONDUCTEUR", label: "Conducteur de travaux", profile: "CONDUCTEUR" as const },
  { key: "ADMINISTRATIF", label: "Administratif", profile: "ADMINISTRATIF" as const },
  { key: "CHEF_CHANTIER", label: "Chef de chantier", profile: "CHEF_CHANTIER" as const },
  { key: "CHARGE_AFFAIRES", label: "Chargé d’affaires", profile: "CONDUCTEUR" as const },
  { key: "AUTRE", label: "Autre", profile: "CONDUCTEUR" as const },
] as const;

export type AddPersonKind =
  | "collaborateur"
  | "client"
  | "fournisseur"
  | "sous-traitant"
  | "partenaire";

export const ADD_PERSON_KINDS: {
  key: AddPersonKind;
  label: string;
  hint: string;
  personType: import("./types").PersonType;
}[] = [
  {
    key: "collaborateur",
    label: "Collaborateur",
    hint: "Salarié ou membre de votre entreprise",
    personType: "INTERNAL",
  },
  {
    key: "client",
    label: "Client",
    hint: "Maître d’ouvrage / promoteur — accès partagé uniquement",
    personType: "CLIENT_EXT",
  },
  {
    key: "fournisseur",
    label: "Fournisseur",
    hint: "Ex. Point.P — commandes et livraisons partagées",
    personType: "SUPPLIER",
  },
  {
    key: "sous-traitant",
    label: "Sous-traitant",
    hint: "Intervention chantier limitée",
    personType: "SUBCONTRACTOR",
  },
  {
    key: "partenaire",
    label: "Partenaire",
    hint: "MOE, bureau de contrôle, autre",
    personType: "PARTNER",
  },
];
