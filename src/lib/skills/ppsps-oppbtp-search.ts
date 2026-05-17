import { PPSPS_OPPBTP_KNOWLEDGE, type OppbtpKnowledgeEntry } from "@/content/ppsps-oppbtp-knowledge";

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function taskThemes(taskIds: string[]): string[] {
  const themes = new Set<string>();
  for (const id of taskIds) {
    if (id.startsWith("el-")) themes.add("electricite");
    const p = id.split("-")[0];
    const map: Record<string, string> = {
      h: "hauteur",
      t: "terrassement",
      m: "manutention",
      e: "engins",
      d: "demolition",
      c: "chimique",
      o: "organisation",
    };
    if (map[p]) themes.add(map[p]);
  }
  return [...themes];
}

function scoreEntry(entry: OppbtpKnowledgeEntry, queryNorm: string, themes: string[]): number {
  let score = 0;
  if (themes.some((t) => entry.themes.includes(t))) score += 3;
  if (queryNorm) {
    const blob = normalize(`${entry.title} ${entry.keywords.join(" ")} ${entry.content}`);
    for (const word of queryNorm.split(/\s+/).filter((w) => w.length > 2)) {
      if (blob.includes(word)) score += 2;
    }
  }
  return score;
}

export type OppbtpSearchResult = OppbtpKnowledgeEntry & { score: number };

/** Recherche dans la base OPPBTP (mots-clés + thèmes liés aux tâches). */
export function searchOppbtpKnowledge(opts: {
  query?: string;
  taskIds?: string[];
  limit?: number;
}): OppbtpSearchResult[] {
  const queryNorm = normalize((opts.query ?? "").trim());
  const themes = taskThemes(opts.taskIds ?? []);
  const limit = opts.limit ?? 8;

  const scored = PPSPS_OPPBTP_KNOWLEDGE.map((entry) => ({
    ...entry,
    score: scoreEntry(entry, queryNorm, themes),
  })).filter((e) => e.score > 0);

  scored.sort((a, b) => b.score - a.score);

  if (scored.length) return scored.slice(0, limit);

  if (themes.length) {
    return PPSPS_OPPBTP_KNOWLEDGE.filter((e) => e.themes.some((t) => themes.includes(t)))
      .slice(0, limit)
      .map((e) => ({ ...e, score: 1 }));
  }

  return PPSPS_OPPBTP_KNOWLEDGE.slice(0, Math.min(4, limit)).map((e) => ({ ...e, score: 0 }));
}

export function formatOppbtpKnowledgeForPrompt(entries: OppbtpKnowledgeEntry[]): string {
  if (!entries.length) return "";
  return entries
    .map((e) => `### ${e.title} (${e.sourceLabel})\n${e.content}`)
    .join("\n\n");
}

/** Compat V2 — repères par familles de tâches */
export function getOppbtpHintsForTaskIds(taskIds: string[]): string[] {
  return searchOppbtpKnowledge({ taskIds, limit: 6 }).map((e) => `${e.title} : ${e.content}`);
}
