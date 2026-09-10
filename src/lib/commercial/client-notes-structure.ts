/**
 * Structure des notes client devis — parsing robuste (legacy === et titres propres).
 * Les marqueurs === ne doivent jamais apparaître sur le PDF.
 */

export type ParsedWorkStage = {
  order: string;
  title: string;
  description: string | null;
  mediaKey: string | null;
};

export type ParsedClientNotes = {
  intro: string | null;
  adviceParagraphs: string[];
  stages: ParsedWorkStage[];
  reserves: string[];
  /** Texte résiduel non classé (rare). */
  leftover: string | null;
};

const SECTION_ALIASES: Record<
  "advice" | "stages" | "reserves",
  RegExp
> = {
  advice:
    /^(?:={2,}\s*)?(?:notre\s+)?pr[eé]conisation(?:\s+technique)?(?:\s*={2,})?$/i,
  stages:
    /^(?:={2,}\s*)?d[eé]roulement(?:\s+pr[eé]visionnel)?(?:\s+des\s+travaux)?(?:\s*={2,})?$/i,
  reserves:
    /^(?:={2,}\s*)?r[eé]serves(?:\s+techniques)?(?:\s*={2,})?$/i,
};

const STAGE_LINE =
  /^(\d{1,2})\s*[.\-—–)]\s*(.+)$/;

function normalizeHeading(line: string): string {
  return line
    .replace(/^=+\s*/g, "")
    .replace(/\s*=+$/g, "")
    .replace(/^#+\s*/g, "")
    .trim();
}

function detectSection(line: string): "advice" | "stages" | "reserves" | null {
  const h = normalizeHeading(line);
  if (!h) return null;
  for (const [key, re] of Object.entries(SECTION_ALIASES) as Array<
    ["advice" | "stages" | "reserves", RegExp]
  >) {
    if (re.test(h)) return key;
  }
  return null;
}

function isDuplicateTitle(sectionLabel: string, firstLine: string): boolean {
  const a = normalizeHeading(sectionLabel).toLowerCase().replace(/\s+/g, " ");
  const b = normalizeHeading(firstLine).toLowerCase().replace(/\s+/g, " ");
  if (!a || !b) return false;
  if (a === b) return true;
  if (b.includes(a) && b.length < a.length + 12) return true;
  if (a.includes(b) && a.length < b.length + 12) return true;
  return false;
}

/** Retire un titre répété en tête de contenu. */
export function stripLeadingDuplicateTitle(
  sectionTitle: string,
  content: string,
): string {
  const lines = content.split(/\r?\n/);
  let i = 0;
  while (i < lines.length && !lines[i].trim()) i += 1;
  if (i < lines.length && isDuplicateTitle(sectionTitle, lines[i])) {
    i += 1;
    while (i < lines.length && !lines[i].trim()) i += 1;
  }
  return lines.slice(i).join("\n").trim();
}

function flushBlock(buf: string[]): string {
  return buf.join("\n").trim();
}

/**
 * Parse les notes client (format legacy === ou titres propres).
 */
export function parseClientNotes(raw: string | null | undefined): ParsedClientNotes {
  const text = (raw ?? "").trim();
  if (!text) {
    return {
      intro: null,
      adviceParagraphs: [],
      stages: [],
      reserves: [],
      leftover: null,
    };
  }

  const lines = text.split(/\r?\n/);
  let mode: "intro" | "advice" | "stages" | "reserves" = "intro";
  const introBuf: string[] = [];
  const adviceBuf: string[] = [];
  const stagesBuf: string[] = [];
  const reservesBuf: string[] = [];

  for (const line of lines) {
    const section = detectSection(line.trim());
    if (section) {
      mode = section;
      continue;
    }
    if (mode === "intro") introBuf.push(line);
    else if (mode === "advice") adviceBuf.push(line);
    else if (mode === "stages") stagesBuf.push(line);
    else reservesBuf.push(line);
  }

  let intro = flushBlock(introBuf) || null;
  const adviceRaw = stripLeadingDuplicateTitle(
    "Notre préconisation",
    flushBlock(adviceBuf),
  );
  const adviceParagraphs = adviceRaw
    ? adviceRaw
        .split(/\n{2,}/)
        .map((p) => stripLeadingDuplicateTitle("Notre préconisation", p.trim()))
        .filter(Boolean)
    : [];

  const stages = parseStagesBlock(flushBlock(stagesBuf));
  const reservesRaw = stripLeadingDuplicateTitle(
    "Réserves techniques",
    flushBlock(reservesBuf),
  );
  const reserves = reservesRaw
    ? reservesRaw
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  // Si aucune section détectée : tout reste en intro (pas d’Observations brutes avec ===)
  if (
    !adviceParagraphs.length &&
    !stages.length &&
    !reserves.length &&
    intro?.includes("===")
  ) {
    intro = intro.replace(/={2,}[^=\n]*={2,}/g, "").replace(/\n{3,}/g, "\n\n").trim() || null;
  }

  return {
    intro,
    adviceParagraphs,
    stages,
    reserves,
    leftover: null,
  };
}

function parseStagesBlock(block: string): ParsedWorkStage[] {
  if (!block) return [];
  const parts = block.split(/\n(?=\d{1,2}\s*[.\-—–)])/);
  const out: ParsedWorkStage[] = [];
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const [first, ...rest] = trimmed.split(/\n/);
    const m = first.match(STAGE_LINE);
    if (!m) continue;
    const title = m[2].trim();
    const description = rest.join("\n").trim() || null;
    out.push({
      order: m[1].padStart(2, "0"),
      title,
      description,
      mediaKey: null,
    });
  }
  return out;
}

/** Construit des notes client propres (sans ===) pour imports futurs. */
export function buildCleanClientNotes(parts: {
  intro?: string | null;
  adviceParagraphs?: string[];
  stages?: Array<{ order: number | string; title: string; description?: string | null }>;
  reserves?: string[];
}): string {
  const chunks: string[] = [];
  if (parts.intro?.trim()) chunks.push(parts.intro.trim());

  const advice = (parts.adviceParagraphs ?? [])
    .map((p) => stripLeadingDuplicateTitle("Notre préconisation", p))
    .filter(Boolean);
  if (advice.length) {
    chunks.push(["NOTRE PRÉCONISATION", "", ...advice].join("\n"));
  }

  if (parts.stages?.length) {
    const lines = parts.stages.map((s) => {
      const ord = String(s.order).padStart(2, "0");
      const head = `${ord} — ${s.title}`;
      return s.description?.trim() ? `${head}\n${s.description.trim()}` : head;
    });
    chunks.push(
      ["DÉROULEMENT PRÉVISIONNEL DES TRAVAUX", "", ...lines].join("\n\n"),
    );
  }

  const reserves = (parts.reserves ?? []).map((r) => r.trim()).filter(Boolean);
  if (reserves.length) {
    chunks.push(["RÉSERVES TECHNIQUES", "", ...reserves].join("\n\n"));
  }

  return chunks.join("\n\n").trim();
}

export function hasProjectPresentation(parsed: ParsedClientNotes): boolean {
  return Boolean(
    parsed.adviceParagraphs.length ||
      parsed.stages.length ||
      parsed.reserves.length ||
      (parsed.intro && parsed.intro.length > 40),
  );
}
