/**
 * Parse rapide FR pour création agenda (ex. "réunion demain 10h Victor Hugo").
 */

export type ParsedQuickAgenda = {
  title: string;
  startAt: Date;
  endAt: Date;
  allDay: boolean;
  type?: string;
};

function atLocal(base: Date, hours: number, minutes = 0): Date {
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

const TYPE_PATTERNS: { re: RegExp; type: string }[] = [
  { re: /\b(livraison|livrer)\b/i, type: "LIVRAISON" },
  { re: /\b(intervention|travaux)\b/i, type: "INTERVENTION" },
  { re: /\b(r[ée]union\s+chantier|visite\s+chantier)\b/i, type: "REUNION_CHANTIER" },
  { re: /\b(visite)\b/i, type: "VISITE_CHANTIER" },
  { re: /\b(rdv\s+client|rendez[- ]?vous\s+client)\b/i, type: "RDV_CLIENT" },
  { re: /\b(fournisseur)\b/i, type: "RDV_FOURNISSEUR" },
  { re: /\b(commande|commander)\b/i, type: "COMMANDE" },
  { re: /\b(factur)/i, type: "FACTURATION" },
  { re: /\b([ée]ch[ée]ance|relance)\b/i, type: "ECHEANCE" },
  { re: /\b(r[ée]ception)\b/i, type: "RECEPTION" },
  { re: /\b(contr[oô]le)\b/i, type: "CONTROLE" },
  { re: /\b(formation)\b/i, type: "FORMATION" },
  { re: /\b(cong[ée]|absence)\b/i, type: "CONGE" },
];

export function detectAgendaTypeFromTitle(input: string): string | undefined {
  for (const p of TYPE_PATTERNS) {
    if (p.re.test(input)) return p.type;
  }
  return undefined;
}

export function parseFrenchAgendaQuick(input: string, now = new Date()): ParsedQuickAgenda | null {
  const raw = input.trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  let day = new Date(now);
  day.setHours(0, 0, 0, 0);

  if (/\baprès[- ]?demain\b/.test(lower)) {
    day.setDate(day.getDate() + 2);
  } else if (/\bdemain\b/.test(lower)) {
    day.setDate(day.getDate() + 1);
  } else if (/\baujourd['’]?hui\b/.test(lower)) {
    /* today */
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

  const type = detectAgendaTypeFromTitle(raw);

  const title =
    raw
      .replace(/\b(après[- ]?demain|demain|aujourd['’]?hui)\b/gi, "")
      .replace(/\b\d{1,2}\s*[h:]\s*\d{0,2}\b/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim() || "Nouvel événement";

  const startAt = allDay ? atLocal(day, 9, 0) : atLocal(day, hours, minutes);
  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);

  return { title, startAt, endAt, allDay, type };
}
