/**
 * Contrat canonique crewJson (PrepScheduleTask) — sans migration.
 *
 * Formats acceptés en lecture :
 * 1) Legacy : [{ labor_id, count }]
 * 2) Objet : { crew_id?, crew_size?, parallelizable?, workload_person_days?, members? }
 *
 * Effectif = crew_size explicite, sinon somme des count des members.
 */

export type CrewMember = {
  labor_id: string;
  count: number;
  /** Libellé optionnel (affichage / patch) — non requis à la persistance. */
  label?: string;
};

export type CrewJsonObject = {
  crew_id?: string | null;
  crew_size?: number | null;
  parallelizable?: boolean;
  /** Charge hommes-jours fournie (h.j) — distincte de durationDays. */
  workload_person_days?: number | null;
  /**
   * DERIVED = calculé duration×effectif (indicatif).
   * PROVIDED = saisie / patch métier.
   */
  workload_source?: "DERIVED" | "PROVIDED" | null;
  members?: CrewMember[];
};

export type ParsedCrew = {
  crewId: string | null;
  crewSize: number | null;
  parallelizable: boolean;
  workloadPersonDays: number | null;
  workloadSource: "DERIVED" | "PROVIDED" | null;
  members: CrewMember[];
};

function asPositiveInt(n: unknown): number | null {
  if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

function asNonNegNumber(n: unknown): number | null {
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return null;
  return n;
}

export function parseCrewMembers(raw: unknown): CrewMember[] {
  if (Array.isArray(raw)) {
    const out: CrewMember[] = [];
    for (const c of raw) {
      if (!c || typeof c !== "object") continue;
      const o = c as { labor_id?: string; count?: number; label?: string };
      if (!o.labor_id || typeof o.labor_id !== "string") continue;
      const member: CrewMember = {
        labor_id: o.labor_id,
        count: typeof o.count === "number" && o.count > 0 ? o.count : 1,
      };
      if (typeof o.label === "string") member.label = o.label;
      out.push(member);
    }
    return out;
  }
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return parseCrewMembers((raw as CrewJsonObject).members);
  }
  return [];
}

export function parseCrewJson(raw: unknown): ParsedCrew {
  const members = parseCrewMembers(raw);
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const o = raw as CrewJsonObject;
    const crewSizeExplicit = asPositiveInt(o.crew_size ?? null);
    const membersSum = members.reduce((s, m) => s + m.count, 0);
    const workloadSource =
      o.workload_source === "DERIVED" || o.workload_source === "PROVIDED"
        ? o.workload_source
        : o.workload_person_days != null
          ? ("PROVIDED" as const)
          : null;
    return {
      crewId: typeof o.crew_id === "string" && o.crew_id.trim() ? o.crew_id.trim() : null,
      crewSize: crewSizeExplicit ?? (membersSum > 0 ? membersSum : null),
      parallelizable: o.parallelizable === true,
      workloadPersonDays: asNonNegNumber(o.workload_person_days ?? null),
      workloadSource,
      members,
    };
  }
  const membersSum = members.reduce((s, m) => s + m.count, 0);
  return {
    crewId: null,
    crewSize: membersSum > 0 ? membersSum : null,
    parallelizable: false,
    workloadPersonDays: null,
    workloadSource: null,
    members,
  };
}

/** Effectif total — source unique UI / contexte / calculs. */
export function getTaskCrewSize(crewJson: unknown): number | null {
  return parseCrewJson(crewJson).crewSize;
}

export function serializeCrewJson(input: {
  crewId?: string | null;
  crewSize?: number | null;
  parallelizable?: boolean;
  workloadPersonDays?: number | null;
  workloadSource?: "DERIVED" | "PROVIDED" | null;
  members?: CrewMember[];
}): CrewJsonObject | CrewMember[] {
  const members = input.members ?? [];
  const hasMeta =
    input.crewId ||
    input.crewSize != null ||
    input.parallelizable ||
    input.workloadPersonDays != null ||
    input.workloadSource;
  if (!hasMeta) return members;
  return {
    crew_id: input.crewId ?? null,
    crew_size: input.crewSize ?? null,
    parallelizable: input.parallelizable || undefined,
    workload_person_days: input.workloadPersonDays ?? null,
    workload_source: input.workloadSource ?? null,
    members,
  };
}

/**
 * Charge h.j affichable.
 * PROVIDED / stockée > DERIVED (duration × effectif) > null.
 */
export function resolveWorkloadPersonDays(input: {
  crewJson: unknown;
  durationDays: number | null;
}): {
  value: number | null;
  source: "PROVIDED" | "DERIVED" | null;
} {
  const parsed = parseCrewJson(input.crewJson);
  if (parsed.workloadPersonDays != null) {
    return {
      value: parsed.workloadPersonDays,
      source: parsed.workloadSource === "DERIVED" ? "DERIVED" : "PROVIDED",
    };
  }
  const size = parsed.crewSize;
  const dur = input.durationDays;
  if (size != null && size > 0 && dur != null && dur > 0) {
    return {
      value: Math.round(dur * size * 100) / 100,
      source: "DERIVED",
    };
  }
  return { value: null, source: null };
}

/** Fusionne un patch update_crew sur un crewJson existant. */
export function applyCrewPatch(
  existing: unknown,
  changes: {
    crew_id?: string | null;
    crew_size?: number | null;
    parallelizable?: boolean;
    members?: CrewMember[];
  },
): CrewJsonObject {
  const cur = parseCrewJson(existing);
  const nextSize =
    changes.crew_size !== undefined
      ? asPositiveInt(changes.crew_size)
      : cur.crewSize;
  const nextMembers = changes.members ?? cur.members;
  // Si crew_size fourni sans members et members vides → garder members.
  // Si crew_size et un seul rôle générique manquant → OK (effectif seul).
  return {
    crew_id:
      changes.crew_id !== undefined
        ? changes.crew_id && changes.crew_id.trim()
          ? changes.crew_id.trim()
          : null
        : cur.crewId,
    crew_size: nextSize,
    parallelizable:
      changes.parallelizable !== undefined
        ? changes.parallelizable === true
        : cur.parallelizable,
    workload_person_days: cur.workloadPersonDays,
    workload_source: cur.workloadSource,
    members: nextMembers,
  };
}

export function applyWorkloadPatch(
  existing: unknown,
  workloadPersonDays: number | null,
): CrewJsonObject {
  const cur = parseCrewJson(existing);
  return {
    crew_id: cur.crewId,
    crew_size: cur.crewSize,
    parallelizable: cur.parallelizable,
    workload_person_days: workloadPersonDays,
    workload_source: workloadPersonDays != null ? "PROVIDED" : null,
    members: cur.members,
  };
}
