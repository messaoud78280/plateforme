/**
 * Suggestions d’actions BeWork à partir du contenu d’un message.
 * Propose — jamais d’exécution automatique.
 */

export type BeworkActionId =
  | "agenda"
  | "livraison"
  | "intervention"
  | "tache"
  | "commande"
  | "avenant"
  | "travaux_termines"
  | "facturer"
  | "rappel"
  | "assigner"
  | "fiche";

export type BeworkActionSuggestion = {
  id: BeworkActionId;
  label: string;
  preferred?: boolean;
  agendaType?: string;
  followUpStatus?: string;
};

const RULES: { re: RegExp; actions: BeworkActionSuggestion[] }[] = [
  {
    re: /\b(livr(e|aison|er)|rouleaux?|matériaux|materiaux)\b/i,
    actions: [
      { id: "livraison", label: "Créer une livraison", preferred: true, agendaType: "LIVRAISON" },
      { id: "agenda", label: "Ajouter à l’agenda", agendaType: "LIVRAISON" },
      { id: "commande", label: "Associer / créer une commande" },
    ],
  },
  {
    re: /\b(intervention|terminer les reprises|on revient|rdv chantier|réunion chantier|reunion chantier)\b/i,
    actions: [
      { id: "intervention", label: "Programmer une intervention", preferred: true, agendaType: "INTERVENTION" },
      { id: "agenda", label: "Ajouter à l’agenda", agendaType: "REUNION_CHANTIER" },
    ],
  },
  {
    re: /\b(travaux (sont )?termin[ée]s?|tout est ok|chantier termin[ée])\b/i,
    actions: [
      { id: "travaux_termines", label: "Marquer travaux terminés", preferred: true, followUpStatus: "TRAVAUX_TERMINES" },
      { id: "facturer", label: "Préparer la facturation", followUpStatus: "A_FACTURER" },
    ],
  },
  {
    re: /\b(avenant|m[²2]|suppl[ée]mentaires?|c[oô]t[ée] cour)\b/i,
    actions: [
      { id: "avenant", label: "Créer un avenant", preferred: true, followUpStatus: "AVENANT" },
      { id: "tache", label: "Créer une tâche" },
    ],
  },
  {
    re: /\b(nacelle|location|commander|commande|prix|devis)\b/i,
    actions: [
      { id: "commande", label: "Créer une commande / location", preferred: true },
      { id: "tache", label: "Créer une tâche" },
    ],
  },
  {
    re: /\b(factur)/i,
    actions: [{ id: "facturer", label: "À facturer", preferred: true, followUpStatus: "A_FACTURER" }],
  },
];

const DEFAULT_ACTIONS: BeworkActionSuggestion[] = [
  { id: "agenda", label: "Ajouter à l’agenda", agendaType: "AUTRE" },
  { id: "tache", label: "Créer une tâche" },
  { id: "intervention", label: "Programmer une intervention", agendaType: "INTERVENTION" },
  { id: "livraison", label: "Créer une livraison", agendaType: "LIVRAISON" },
  { id: "commande", label: "Créer une commande" },
  { id: "avenant", label: "Créer un avenant", followUpStatus: "AVENANT" },
  { id: "fiche", label: "Ajouter à une fiche" },
  { id: "rappel", label: "Me rappeler ce message" },
  { id: "assigner", label: "Assigner à…" },
  { id: "facturer", label: "À facturer", followUpStatus: "A_FACTURER" },
];

/** Parse dates FR simples dans le message (demain, mardi, 11 août, 7h30…). */
export function parseMessageSchedule(content: string, now = new Date()): {
  title: string;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
} {
  const lower = content.toLowerCase();
  const day = new Date(now);
  day.setHours(0, 0, 0, 0);

  if (/\baprès[- ]?demain\b/.test(lower)) day.setDate(day.getDate() + 2);
  else if (/\bdemain\b/.test(lower)) day.setDate(day.getDate() + 1);
  else if (/\blundi\b/.test(lower)) day.setDate(day.getDate() + ((1 - day.getDay() + 7) % 7 || 7));
  else if (/\bmardi\b/.test(lower)) day.setDate(day.getDate() + ((2 - day.getDay() + 7) % 7 || 7));
  else if (/\bmercredi\b/.test(lower)) day.setDate(day.getDate() + ((3 - day.getDay() + 7) % 7 || 7));
  else if (/\bjeudi\b/.test(lower)) day.setDate(day.getDate() + ((4 - day.getDay() + 7) % 7 || 7));
  else if (/\bvendredi\b/.test(lower)) day.setDate(day.getDate() + ((5 - day.getDay() + 7) % 7 || 7));

  const frDate = lower.match(/\b(\d{1,2})\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\b/);
  if (frDate) {
    const months: Record<string, number> = {
      janvier: 0,
      février: 1,
      fevrier: 1,
      mars: 2,
      avril: 3,
      mai: 4,
      juin: 5,
      juillet: 6,
      août: 7,
      aout: 7,
      septembre: 8,
      octobre: 9,
      novembre: 10,
      décembre: 11,
      decembre: 11,
    };
    const m = months[frDate[2]!];
    if (m != null) {
      day.setMonth(m, Number(frDate[1]));
      if (day < now) day.setFullYear(day.getFullYear() + 1);
    }
  }

  const timeMatch = lower.match(/\b(\d{1,2})\s*[h:]\s*(\d{2})?\b/);
  let hours = 9;
  let minutes = 0;
  let allDay = true;
  if (timeMatch) {
    hours = Math.min(23, Number(timeMatch[1]));
    minutes = timeMatch[2] ? Math.min(59, Number(timeMatch[2])) : 0;
    allDay = false;
  }

  const startAt = new Date(day);
  startAt.setHours(allDay ? 9 : hours, allDay ? 0 : minutes, 0, 0);
  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
  const title = content.trim().slice(0, 120) || "Événement";

  return { title, startAt, endAt, allDay };
}

export function suggestBeworkActions(content: string): BeworkActionSuggestion[] {
  const preferred: BeworkActionSuggestion[] = [];
  const seen = new Set<BeworkActionId>();

  for (const rule of RULES) {
    if (!rule.re.test(content)) continue;
    for (const a of rule.actions) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      preferred.push(a);
    }
  }

  const rest = DEFAULT_ACTIONS.filter((a) => !seen.has(a.id));
  return [...preferred, ...rest];
}

export function messagerieDeepLink(kind: string, messageId: string, ctx?: { taskId?: string | null }) {
  if (kind === "TASK" && ctx?.taskId) {
    return `/dashboard/messagerie?task=${ctx.taskId}&messageId=${messageId}`;
  }
  if (kind === "DIRECT") {
    return `/dashboard/messagerie?tab=messages-directs&messageId=${messageId}`;
  }
  return `/dashboard/messagerie?messageId=${messageId}`;
}
