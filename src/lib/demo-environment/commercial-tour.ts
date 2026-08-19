/**
 * DEMO-COMMERCIALE-V1 — parcours guidé commercial (config pure, hors runtime métier).
 * Aucune mutation. Deep-links résolus via le contexte live.
 */

import type { DemoPersonaKey } from "./personas";
import { DEMO_SCENARIO, DEMO_SCENARIO_ORDER_NUMBER } from "./scenario";

export const DEMO_COMMERCIAL_TOUR_STORAGE_KEY = "bework-demo-commercial-tour-v1";

export { DEMO_SCENARIO_ORDER_NUMBER };

export type DemoTourMode = "express" | "complete";

export type DemoTourSide = "right" | "left";

/** Contexte live résolu côté serveur (pas d’IDs hardcodés). */
export type DemoCommercialContext = {
  orderId: string | null;
  orderNumber: string | null;
  orderStatus: string | null;
  projectId: string | null;
  projectTitle: string | null;
  supplierName: string | null;
  agendaEventId: string | null;
  orderedQty: number | null;
  receivedQty: number | null;
  hasPartialReceipt: boolean;
  orderHref: string | null;
  receptionHref: string | null;
  messagerieHref: string | null;
  agendaHref: string | null;
  documentsHref: string | null;
  chantierHref: string | null;
};

export type DemoTourStepDef = {
  id: string;
  /** Titre court panneau */
  title: string;
  /** 1–2 phrases max */
  body: string;
  /** Zone « À EXPLIQUER » — 1 phrase max */
  tip?: string;
  /** Label du CTA principal (ouvre href) */
  actionLabel?: string;
  /** Clé de href dans le contexte, ou route fixe */
  hrefKey?: keyof Pick<
    DemoCommercialContext,
    | "orderHref"
    | "receptionHref"
    | "messagerieHref"
    | "agendaHref"
    | "documentsHref"
    | "chantierHref"
  >;
  /** Route fixe si pas de hrefKey */
  href?: string;
  /** Persona à activer avant affichage (switch réel) */
  persona?: DemoPersonaKey;
  /** data-demo-target optionnel */
  highlight?: string;
  /** Peut être passée sans avancer le narratif métier */
  optional?: boolean;
  /** Masquer si le contexte live ne le permet pas */
  require?: Array<"order" | "project" | "messagerie" | "agenda" | "partial">;
  /** Étape de clôture (slogan) */
  finale?: boolean;
  /** Instruction Cmd+K — pas de navigation auto */
  promptSearch?: boolean;
};

export type DemoTourPersistedState = {
  active: boolean;
  mode: DemoTourMode | null;
  stepIndex: number;
  side: DemoTourSide;
};

export const EMPTY_TOUR_STATE: DemoTourPersistedState = {
  active: false,
  mode: null,
  stepIndex: 0,
  side: "right",
};

export const EXPRESS_TOUR_STEPS: DemoTourStepDef[] = [
  {
    id: "express-accueil",
    title: "Accueil Direction",
    body: "BeWork vous montre immédiatement ce qui mérite votre attention.",
    tip: "Faire ressortir À traiter, Aujourd’hui et Chantiers à surveiller.",
    persona: "direction",
    href: "/dashboard",
    actionLabel: "Ouvrir l’accueil",
    highlight: "accueil-a-traiter",
  },
  {
    id: "express-a-traiter",
    title: "À traiter",
    body: `Une action manque sur la commande ${DEMO_SCENARIO.supplierName} (membrane bitume). BeWork l’a détectée automatiquement.`,
    tip: "L’alerte vient du moteur de commande, pas d’une saisie manuelle.",
    persona: "direction",
    href: "/dashboard/a-traiter",
    actionLabel: "Ouvrir À traiter",
    highlight: "a-traiter-board",
  },
  {
    id: "express-commande",
    title: "Commande fournisseur",
    body: "Le contexte est déjà là. Pas besoin de rechercher dans les mails ou les dossiers.",
    tip: "Chantier, fournisseur, date, responsable, réception — saisis une fois.",
    persona: "direction",
    hrefKey: "orderHref",
    actionLabel: "Ouvrir la commande",
    require: ["order"],
  },
  {
    id: "express-thomas",
    title: "Espace fournisseur",
    body: "Le fournisseur ne voit que ses commandes, livraisons, documents et échanges autorisés.",
    tip: "Le fournisseur n’accède pas à votre plateforme interne.",
    persona: "fournisseur",
    href: "/dashboard",
    actionLabel: "Voir l’accueil fournisseur",
  },
  {
    id: "express-resolution",
    title: "Quand c’est réglé",
    body: "Lorsque le problème est résolu, BeWork arrête automatiquement les rappels.",
    tip: "Revenir au profil Direction via le switch existant.",
    persona: "direction",
    href: "/dashboard",
    actionLabel: "Revenir à Direction",
  },
  {
    id: "express-fin",
    title: "BEWORK",
    body: "Une information. Les bonnes personnes. Au bon moment.\n\nVos post-it n’ont pas disparu. Ils sont devenus intelligents.",
    finale: true,
    persona: "direction",
  },
];

export const COMPLETE_TOUR_STEPS: DemoTourStepDef[] = [
  {
    id: "complete-accueil",
    title: "Accueil Direction",
    body: "La direction n’a pas besoin d’ouvrir chaque chantier pour savoir où sont les problèmes.",
    tip: "À traiter · Aujourd’hui · Chantiers à surveiller.",
    persona: "direction",
    href: "/dashboard",
    actionLabel: "Ouvrir l’accueil",
    highlight: "accueil-a-traiter",
  },
  {
    id: "complete-a-traiter",
    title: "À traiter",
    body: "BeWork a détecté une action manquante sur la commande fournisseur — sans saisie manuelle.",
    tip: `Préférer la carte ${DEMO_SCENARIO_ORDER_NUMBER} si elle est présente sur le board.`,
    persona: "direction",
    href: "/dashboard/a-traiter",
    actionLabel: "Ouvrir À traiter",
    highlight: "a-traiter-board",
  },
  {
    id: "complete-commande",
    title: "Commande",
    body: "Une information a été saisie une fois. BeWork connaît déjà le chantier, le fournisseur, la date, le responsable et la réception.",
    persona: "direction",
    hrefKey: "orderHref",
    actionLabel: `Ouvrir ${DEMO_SCENARIO_ORDER_NUMBER}`,
    require: ["order"],
  },
  {
    id: "complete-messagerie",
    title: "Messagerie fournisseur",
    body: "Le fournisseur est accessible directement depuis le contexte de la commande.",
    tip: "Ne pas envoyer de message automatiquement.",
    persona: "direction",
    hrefKey: "messagerieHref",
    actionLabel: "Ouvrir la conversation",
    require: ["messagerie"],
  },
  {
    id: "complete-thomas",
    title: "Portail fournisseur",
    body: "Le fournisseur n’accède pas à votre plateforme interne. Il dispose uniquement de son espace de collaboration.",
    tip: "Montrer Accueil, Commandes, Livraisons, Documents, Messagerie.",
    persona: "fournisseur",
    href: "/dashboard",
    actionLabel: "Espace fournisseur",
  },
  {
    id: "complete-agenda",
    title: "Agenda",
    body: "Agenda répond à : qu’est-ce qui se passe et quand ?",
    persona: "direction",
    hrefKey: "agendaHref",
    href: "/dashboard/agenda",
    actionLabel: "Ouvrir Agenda",
  },
  {
    id: "complete-planning",
    title: "Planning",
    body: "Planning répond à : qui est où ? Qui est disponible ? Qui est en conflit ?",
    persona: "direction",
    href: "/dashboard/planning",
    actionLabel: "Ouvrir Planning",
  },
  {
    id: "complete-reception",
    title: "Réception",
    body: "La réception reste liée à la commande. Montrer le reliquat réel si l’état le permet.",
    tip: "Ne jamais falsifier les quantités si l’état seed ne le permet pas.",
    persona: "direction",
    hrefKey: "receptionHref",
    actionLabel: "Voir la réception",
    require: ["order", "partial"],
  },
  {
    id: "complete-reliquat",
    title: "Reliquat",
    body: "Une réception partielle n’est pas considérée comme terminée. BeWork sait qu’il reste quelque chose à faire.",
    tip: "Revenir sur À traiter si le board affiche encore le reliquat.",
    persona: "direction",
    href: "/dashboard/a-traiter",
    actionLabel: "Voir À traiter",
    require: ["partial"],
  },
  {
    id: "complete-documents",
    title: "Document / BL",
    body: "Le même document peut être retrouvé depuis plusieurs contextes, mais il n’est stocké qu’une seule fois.",
    persona: "direction",
    hrefKey: "documentsHref",
    href: "/dashboard/documents",
    actionLabel: "Ouvrir Documents",
  },
  {
    id: "complete-cmdk",
    title: "Recherche ⌘K",
    body: "Vous ne cherchez plus dans quel menu se trouve l’information.",
    tip: `Demander ⌘K / Ctrl+K puis suggérer « ${DEMO_SCENARIO.supplierName} ${DEMO_SCENARIO.projects.primary.title} ».`,
    persona: "direction",
    promptSearch: true,
    actionLabel: "Ouvrir la recherche",
  },
  {
    id: "complete-julie",
    title: "Profil administratif",
    body: "Le bureau voit documents, BL et actions administratives sur le même fil.",
    tip: "Passer si les données administratives ne sont pas parlantes.",
    persona: "administratif",
    href: "/dashboard/documents",
    actionLabel: "Documents administratif",
    optional: true,
  },
  {
    id: "complete-sophie",
    title: "Portail client",
    body: "Le client ne voit que ce que l’entreprise décide de partager.",
    tip: "Étape courte — passer si le prospect n’est pas intéressé.",
    persona: "client",
    href: "/dashboard",
    actionLabel: "Portail client",
    optional: true,
  },
  {
    id: "complete-synthese",
    title: "Une information, plusieurs vues",
    body: `${DEMO_SCENARIO_ORDER_NUMBER} circule dans Commande, Chantier, Agenda, À traiter, Recherche, portail fournisseur et Documents — sans doublon.`,
    tip: "BeWork fait circuler l’information et évite qu’une action soit oubliée.",
    persona: "direction",
    hrefKey: "orderHref",
    actionLabel: "Revoir la commande",
    require: ["order"],
  },
  {
    id: "complete-fin",
    title: "BEWORK",
    body: "Une information. Les bonnes personnes. Au bon moment.\n\nVos post-it n’ont pas disparu. Ils sont devenus intelligents.",
    finale: true,
    persona: "direction",
  },
];

export function stepsForMode(mode: DemoTourMode): DemoTourStepDef[] {
  return mode === "express" ? EXPRESS_TOUR_STEPS : COMPLETE_TOUR_STEPS;
}

export function stepAvailable(
  step: DemoTourStepDef,
  ctx: DemoCommercialContext | null,
): boolean {
  if (!step.require?.length) return true;
  if (!ctx) return false;
  return step.require.every((r) => {
    if (r === "order") return Boolean(ctx.orderId && ctx.orderHref);
    if (r === "project") return Boolean(ctx.projectId);
    if (r === "messagerie") return Boolean(ctx.messagerieHref);
    if (r === "agenda") return Boolean(ctx.agendaHref);
    if (r === "partial") return ctx.hasPartialReceipt;
    return true;
  });
}

export function resolveStepHref(
  step: DemoTourStepDef,
  ctx: DemoCommercialContext | null,
): string | null {
  if (step.promptSearch) return null;
  if (step.hrefKey && ctx?.[step.hrefKey]) return ctx[step.hrefKey];
  if (step.href) return step.href;
  return null;
}

/** Corps adapté aux quantités réelles si réception partielle. */
export function stepBodyWithContext(
  step: DemoTourStepDef,
  ctx: DemoCommercialContext | null,
): string {
  if (step.id === "complete-reception" && ctx?.hasPartialReceipt && ctx.receivedQty != null && ctx.orderedQty != null) {
    return `${ctx.receivedQty} reçus sur ${ctx.orderedQty}. Une réception partielle reste ouverte jusqu’au reliquat.`;
  }
  return step.body;
}

export function readTourState(): DemoTourPersistedState {
  if (typeof window === "undefined") return { ...EMPTY_TOUR_STATE };
  try {
    const raw = sessionStorage.getItem(DEMO_COMMERCIAL_TOUR_STORAGE_KEY);
    if (!raw) return { ...EMPTY_TOUR_STATE };
    const parsed = JSON.parse(raw) as Partial<DemoTourPersistedState>;
    return {
      active: Boolean(parsed.active),
      mode: parsed.mode === "express" || parsed.mode === "complete" ? parsed.mode : null,
      stepIndex: typeof parsed.stepIndex === "number" && parsed.stepIndex >= 0 ? parsed.stepIndex : 0,
      side: parsed.side === "left" ? "left" : "right",
    };
  } catch {
    return { ...EMPTY_TOUR_STATE };
  }
}

export function writeTourState(state: DemoTourPersistedState) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(DEMO_COMMERCIAL_TOUR_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota */
  }
}

export function clearTourState() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(DEMO_COMMERCIAL_TOUR_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
