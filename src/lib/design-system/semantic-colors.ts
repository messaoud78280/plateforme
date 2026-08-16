/**
 * DESIGN-SYSTEM-2 — mappings sémantiques centralisés.
 * Couleur = langage produit (même statut = même teinte partout).
 * UI uniquement — aucun effet métier.
 */

export type BwTone =
  | "navy"
  | "accent"
  | "cyan"
  | "ok"
  | "watch"
  | "critical"
  | "violet"
  | "neutral";

export type ToneSurface = {
  tone: BwTone;
  /** Classes Tailwind / utilitaires pour cartes */
  surface: string;
  iconPill: string;
  text: string;
  border: string;
  /** CSS var pour bande latérale */
  cssTone: string;
};

const TONE: Record<BwTone, ToneSurface> = {
  navy: {
    tone: "navy",
    surface: "bw-surface-tinted-navy",
    iconPill: "bw-icon-pill bw-icon-pill-navy",
    text: "text-bework-navy",
    border: "border-bework-navy/15",
    cssTone: "var(--cc-navy)",
  },
  accent: {
    tone: "accent",
    surface: "bw-surface-tinted-accent",
    iconPill: "bw-icon-pill bw-icon-pill-accent",
    text: "text-bework-accent",
    border: "border-bework-accent/20",
    cssTone: "var(--cc-accent)",
  },
  cyan: {
    tone: "cyan",
    surface: "bw-surface-tinted-cyan",
    iconPill: "bw-icon-pill bw-icon-pill-cyan",
    text: "text-bework-cyan",
    border: "border-bework-cyan/20",
    cssTone: "var(--cc-cyan)",
  },
  ok: {
    tone: "ok",
    surface: "bw-surface-tinted-ok",
    iconPill: "bw-icon-pill bw-icon-pill-ok",
    text: "text-bework-ok",
    border: "border-bework-ok/20",
    cssTone: "var(--cc-ok)",
  },
  watch: {
    tone: "watch",
    surface: "bw-surface-tinted-watch",
    iconPill: "bw-icon-pill bw-icon-pill-watch",
    text: "text-bework-watch",
    border: "border-bework-watch/25",
    cssTone: "var(--cc-watch)",
  },
  critical: {
    tone: "critical",
    surface: "bw-surface-tinted-critical",
    iconPill: "bw-icon-pill bw-icon-pill-critical",
    text: "text-bework-critical",
    border: "border-bework-critical/20",
    cssTone: "var(--cc-critical)",
  },
  violet: {
    tone: "violet",
    surface: "bw-surface-tinted-violet",
    iconPill: "bw-icon-pill bw-icon-pill-violet",
    text: "text-bework-intel",
    border: "border-bework-intel/20",
    cssTone: "var(--cc-intel)",
  },
  neutral: {
    tone: "neutral",
    surface: "bw-section-card",
    iconPill: "bw-icon-pill bg-slate-100 text-slate-600",
    text: "text-slate-600",
    border: "border-slate-200",
    cssTone: "var(--cc-ink-muted)",
  },
};

export function toneSurface(tone: BwTone): ToneSurface {
  return TONE[tone];
}

/** Devis — statuts Commercial (clés Prisma + libellés) */
export const DEVIS_STATUS_TONE: Record<string, BwTone> = {
  DRAFT: "violet",
  brouillon: "violet",
  draft: "violet",
  TO_VALIDATE: "watch",
  VALIDATED: "accent",
  SENT: "accent",
  VIEWED: "cyan",
  envoye: "accent",
  envoyé: "accent",
  sent: "accent",
  ACCEPTED: "ok",
  accepte: "ok",
  accepté: "ok",
  accepted: "ok",
  REFUSED: "critical",
  refuse: "critical",
  refusé: "critical",
  rejected: "critical",
  EXPIRED: "watch",
  expire: "watch",
  expiré: "watch",
  expired: "watch",
  CANCELLED: "neutral",
  annule: "neutral",
  annulé: "neutral",
  cancelled: "neutral",
};

/** Factures — statuts Commercial */
export const FACTURE_STATUS_TONE: Record<string, BwTone> = {
  DRAFT: "neutral",
  brouillon: "neutral",
  draft: "neutral",
  a_emettre: "violet",
  "à_émettre": "violet",
  a_émettre: "violet",
  ISSUED: "cyan",
  emise: "cyan",
  émise: "cyan",
  issued: "cyan",
  PARTIALLY_PAID: "watch",
  partielle: "watch",
  partiellement_payee: "watch",
  "partiellement_payée": "watch",
  PAID: "ok",
  payee: "ok",
  payée: "ok",
  paid: "ok",
  OVERDUE: "critical",
  retard: "critical",
  overdue: "critical",
  CANCELLED: "neutral",
  annulee: "neutral",
  annulée: "neutral",
};

/** Contrats annuels — états */
export const ANNUAL_CONTRACT_STATUS_TONE: Record<string, BwTone> = {
  programmee: "accent",
  programmée: "accent",
  a_preparer: "cyan",
  "à_préparer": "cyan",
  en_retard: "critical",
  realisee: "ok",
  réalisée: "ok",
  a_facturer: "watch",
  "à_facturer": "watch",
  facture_en_preparation: "violet",
  facturee: "cyan",
  facturée: "cyan",
  payee: "ok",
  payée: "ok",
  resiliation: "critical",
  résiliation: "critical",
};

/** Visites & métrés */
export const VISIT_STATUS_TONE: Record<string, BwTone> = {
  a_planifier: "neutral",
  "à_planifier": "neutral",
  prevue: "accent",
  prévue: "accent",
  en_cours: "cyan",
  incomplete: "watch",
  incomplète: "watch",
  prete_a_chiffrer: "ok",
  "prête_à_chiffrer": "ok",
  transmise_au_devis: "violet",
};

/** Agenda — types d’événements */
export const AGENDA_EVENT_TONE: Record<string, BwTone> = {
  livraison: "watch",
  intervention: "cyan",
  reunion: "violet",
  réunion: "violet",
  rendez_vous: "accent",
  "rendez-vous": "accent",
  echeance: "critical",
  échéance: "critical",
  visite_commerciale: "ok",
  admin: "navy",
};

/** GED — grandes catégories */
export const GED_CATEGORY_TONE: Record<string, BwTone> = {
  devis_avenants: "accent",
  devis: "accent",
  avenants: "violet",
  factures_situations: "ok",
  factures: "ok",
  situations: "cyan",
  fiches_techniques: "cyan",
  commandes_bl: "watch",
  commandes: "watch",
  fournisseurs: "violet",
  doe: "navy",
  photos: "violet",
  plans: "accent",
  pv: "watch",
  ppsps: "critical",
  cctp: "cyan",
};

/** À traiter / Attention — familles dashboard */
export const ATTENTION_CATEGORY_TONE: Record<string, BwTone> = {
  contrats_annuels: "cyan",
  taches_suivi: "violet",
  commandes_livraisons: "watch",
  facturation: "ok",
  documents: "accent",
  agenda: "cyan",
  chantiers: "navy",
  visites: "ok",
};

/** KPI finance Commercial */
export const FINANCE_KPI_TONE = {
  aEncaisser: "accent" as BwTone,
  encaisse: "ok" as BwTone,
  facture: "cyan" as BwTone,
  enRetard: "critical" as BwTone,
  devisAttente: "violet" as BwTone,
  margeOk: "ok" as BwTone,
  margeWatch: "watch" as BwTone,
  margeCritical: "critical" as BwTone,
};

/** Tâches — statuts / priorités */
export const TASK_STATUS_TONE: Record<string, BwTone> = {
  a_faire: "accent",
  "à_faire": "accent",
  en_cours: "cyan",
  a_valider: "violet",
  "à_valider": "violet",
  terminee: "ok",
  terminée: "ok",
  en_retard: "critical",
  critique: "critical",
  urgent: "critical",
  prioritaire: "watch",
  important: "watch",
  a_surveiller: "watch",
  "à_surveiller": "watch",
  standard: "neutral",
};

/** Bibliothèque — types d’éléments */
export const LIBRARY_KIND_TONE: Record<string, BwTone> = {
  ouvrage: "accent",
  ouvrages: "accent",
  materiau: "cyan",
  materiaux: "cyan",
  matériau: "cyan",
  matériaux: "cyan",
  main_oeuvre: "violet",
  "main-dœuvre": "violet",
  maindoeuvre: "violet",
  favori: "watch",
  favoris: "watch",
  prix_direct: "ok",
  prix_calcule: "cyan",
  prix_calculé: "cyan",
  a_verifier: "watch",
  "à_vérifier": "watch",
  archive: "neutral",
  archivé: "neutral",
};

/** Fournisseurs — badges opérationnels */
export const SUPPLIER_BADGE_TONE: Record<string, BwTone> = {
  actif: "ok",
  active: "ok",
  fiche_active: "ok",
  commande_en_cours: "accent",
  confirmation_attendue: "watch",
  archive: "neutral",
  archivé: "neutral",
};

/** Fiches suivi — urgences */
export const FOLLOW_UP_URGENCY_TONE: Record<string, BwTone> = {
  critique: "critical",
  urgent: "critical",
  important: "watch",
  a_surveiller: "cyan",
  "à_surveiller": "cyan",
  normal: "neutral",
};

export function resolveTone(
  map: Record<string, BwTone>,
  key: string | null | undefined,
  fallback: BwTone = "neutral"
): ToneSurface {
  if (!key) return toneSurface(fallback);
  const normalized = key.trim().toLowerCase().replace(/\s+/g, "_");
  const tone = map[normalized] ?? map[key] ?? fallback;
  return toneSurface(tone);
}

export function badgeClassForTone(tone: BwTone): string {
  switch (tone) {
    case "ok":
      return "badge-cc badge-cc-ok";
    case "watch":
      return "badge-cc badge-cc-watch";
    case "critical":
      return "badge-cc badge-cc-critical";
    case "violet":
      return "badge-cc badge-cc-intel";
    case "cyan":
      return "badge-cc badge-cc-cyan";
    case "accent":
    case "navy":
      return "badge-cc badge-cc-info";
    default:
      return "badge-cc badge-cc-neutral";
  }
}
