/** Thème visuel aligné WhatsApp Desktop / Web. */
export const WA = {
  green: "#00a884",
  greenDark: "#008069",
  bubbleOut: "#d9fdd3",
  bubbleIn: "#ffffff",
  panel: "#ffffff",
  panelAlt: "#f0f2f5",
  rail: "#f0f2f5",
  border: "#d1d7db",
  borderSoft: "#e9edef",
  text: "#111b21",
  textSecondary: "#667781",
  textMuted: "#8696a0",
  check: "#53bdeb",
  chatBg: "#efeae2",
  system: "#fff5c4",
} as const;

/** Fond chat façon WhatsApp (doodles discrets). */
export const WA_CHAT_BG = {
  backgroundColor: WA.chatBg,
  backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'>
      <g fill='none' stroke='#c9c3b8' stroke-width='1.2' opacity='0.45'>
        <path d='M20 30c8-4 16 4 12 12M50 80c6 0 10 6 6 12M120 40c0 8 10 10 14 4M160 100c-6 4-4 14 4 14M80 150c8-2 12 8 6 12M30 160c4-6 14-2 12 6'/>
        <circle cx='90' cy='50' r='6'/><circle cx='150' cy='160' r='5'/>
        <rect x='40' y='110' width='14' height='10' rx='2'/>
        <path d='M170 50l8 8-8 8M100 120l6-10 6 10z'/>
      </g>
    </svg>`,
  )}")`,
} as const;

export function waListTime(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMsg = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startToday.getTime() - startMsg.getTime()) / 86400000);
  if (dayDiff === 0) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  if (dayDiff === 1) return "Hier";
  if (dayDiff < 7) {
    return date.toLocaleDateString("fr-FR", { weekday: "long" });
  }
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function waBubbleTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
