/**
 * Complétude visite — uniquement des éléments explicitement attendus.
 */
export type CompletenessItem = {
  id: string;
  label: string;
  done: boolean;
  required: boolean;
};

export type VisitCompleteness = {
  done: number;
  total: number;
  label: string;
  tone: "ok" | "watch" | "accent";
  items: CompletenessItem[];
  missingLabels: string[];
  readyChecks: CompletenessItem[];
};

function asStringList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

export function buildVisitCompleteness(opts: {
  clientName?: string | null;
  siteAddress?: string | null;
  siteName?: string | null;
  projectId?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  scheduledAt?: string | Date | null;
  subject?: string | null;
  lots?: unknown;
  measurementCount: number;
  measurementLots?: string[];
  hasConstraints: boolean;
  missingOpenCount: number;
  photoCount?: number;
  documentCount?: number;
}): VisitCompleteness {
  const lots = [
    ...asStringList(opts.lots),
    ...(opts.measurementLots ?? []).filter(Boolean),
  ];
  const uniqueLots = [...new Set(lots)];
  const items: CompletenessItem[] = [
    {
      id: "client",
      label: "Client identifié",
      done: Boolean(opts.clientName?.trim()),
      required: true,
    },
    {
      id: "site",
      label: "Chantier / adresse",
      done: Boolean(opts.siteAddress?.trim() || opts.siteName?.trim() || opts.projectId),
      required: true,
    },
    {
      id: "subject",
      label: "Objet de la visite",
      done: Boolean(opts.subject?.trim()),
      required: true,
    },
    {
      id: "contact",
      label: "Contact sur place",
      done: Boolean(opts.contactName?.trim() || opts.contactPhone?.trim()),
      required: false,
    },
    {
      id: "rdv",
      label: "Rendez-vous",
      done: Boolean(opts.scheduledAt),
      required: false,
    },
    {
      id: "lots",
      label: "Lots concernés",
      done: uniqueLots.length > 0,
      required: false,
    },
    {
      id: "metres",
      label: "Relevés / métrés",
      done: opts.measurementCount > 0,
      required: true,
    },
    {
      id: "constraints",
      label: "Contraintes examinées",
      done: opts.hasConstraints,
      required: false,
    },
    {
      id: "missing",
      label: "Points bloquants traités",
      done: opts.missingOpenCount === 0,
      required: true,
    },
  ];
  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const missingLabels = items.filter((i) => !i.done).map((i) => i.label);
  return {
    done,
    total,
    tone: (done === total ? "ok" : missingLabels.length >= 3 ? "watch" : "accent") as
      | "ok"
      | "watch"
      | "accent",
    label:
      done === total
        ? `${done} / ${total} préparé`
        : `${total - done} élément${total - done > 1 ? "s" : ""} à compléter`,
    items,
    missingLabels,
    readyChecks: items.filter((i) => i.required || i.id === "lots" || i.id === "constraints"),
  };
}

export function hasVisitConstraints(c: {
  accessLevel?: string | null;
  access?: string[];
  occupation?: string[];
  supportState?: string | null;
  supportObservations?: string[];
  asbestosStatus?: string | null;
  waste?: string[];
  means?: string[];
  estimatedDifficulty?: string | null;
  otherComment?: string | null;
} | null | undefined): boolean {
  if (!c) return false;
  return Boolean(
    c.accessLevel ||
      c.supportState ||
      c.asbestosStatus ||
      c.estimatedDifficulty ||
      c.otherComment?.trim() ||
      (c.access && c.access.length > 0) ||
      (c.occupation && c.occupation.length > 0) ||
      (c.supportObservations && c.supportObservations.length > 0) ||
      (c.waste && c.waste.length > 0) ||
      (c.means && c.means.length > 0),
  );
}
