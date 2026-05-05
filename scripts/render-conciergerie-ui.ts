import { Resvg } from "@resvg/resvg-js";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Export PNG (fond transparent) d'une UI conciergerie “isolated elements”.
 * Pas de grand frame / pas de backdrop : uniquement des éléments flottants.
 */

const BLUE = "#2F5BFF";
const SLATE_900 = "#0F172A";
const SLATE_600 = "#475569";
const SLATE_500 = "#64748B";
const BORDER = "#E2E8F0";

// Canvas (transparent)
const W = 1200;
const H = 760;

function escapeXml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow-sm" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#0F172A" flood-opacity="0.18"/>
    </filter>
    <filter id="shadow-md" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="22" stdDeviation="22" flood-color="#0F172A" flood-opacity="0.18"/>
    </filter>
    <filter id="shadow-lg" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="28" stdDeviation="26" flood-color="#020617" flood-opacity="0.22"/>
    </filter>
  </defs>

  <!-- Left nav icons -->
  <g transform="translate(70,150)" filter="url(#shadow-sm)">
    ${[0, 64, 128, 192]
      .map(
        (y, i) => `
      <g transform="translate(0,${y})">
        <rect x="0" y="0" rx="18" ry="18" width="56" height="56" fill="#FFFFFF" stroke="${BORDER}" stroke-width="1"/>
        <circle cx="28" cy="28" r="9" fill="${i === 0 ? SLATE_900 : SLATE_600}" opacity="${i === 0 ? "1" : "0.55"}"/>
      </g>`
      )
      .join("")}
  </g>

  <!-- Header text -->
  <g transform="translate(160,135)">
    <text x="0" y="0" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto" font-size="22" font-weight="700" fill="${SLATE_900}">
      Votre conciergerie BeWork
    </text>
    <text x="0" y="34" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto" font-size="16" font-weight="500" fill="${SLATE_500}">
      Demandes en cours
    </text>
  </g>

  <!-- Request cards -->
  <g transform="translate(160,190)">
    ${[
      {
        title: "Réservation hôtel",
        sub: "Paris — 2 nuits",
        pill: "Confirmé",
        tone: "success",
      },
      {
        title: "Location véhicule",
        sub: "Break — 3 jours",
        pill: "En cours",
        tone: "progress",
      },
      {
        title: "Vol Paris → Marseille",
        sub: "12 mai — 08:15",
        pill: "Confirmé",
        tone: "success",
      },
    ].map((x) => ({
      ...x,
      title: escapeXml(x.title),
      sub: escapeXml(x.sub),
      pill: escapeXml(x.pill),
    }))
      .map((row, idx) => {
        const y = idx * 132;
        const pillBg = row.tone === "success" ? "#ECFDF5" : "#EFF6FF";
        const pillStroke = row.tone === "success" ? "#A7F3D0" : "#BFDBFE";
        const pillText = row.tone === "success" ? "#047857" : BLUE;
        const dot = row.tone === "success" ? "#10B981" : BLUE;
        return `
      <g transform="translate(0,${y})" filter="url(#shadow-md)">
        <rect x="0" y="0" rx="26" ry="26" width="640" height="104" fill="#FFFFFF" stroke="${BORDER}" stroke-width="1"/>

        <!-- thumb -->
        <rect x="20" y="20" rx="18" ry="18" width="64" height="64" fill="#F8FAFC" stroke="${BORDER}" stroke-width="1"/>
        <rect x="38" y="38" rx="10" ry="10" width="28" height="28" fill="#0F172A" opacity="0.10"/>

        <!-- texts -->
        <text x="104" y="50" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto" font-size="18" font-weight="700" fill="${SLATE_900}">
          ${row.title}
        </text>
        <text x="104" y="76" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto" font-size="16" font-weight="500" fill="${SLATE_500}">
          ${row.sub}
        </text>

        <!-- pill -->
        <g transform="translate(500,32)">
          <rect x="0" y="0" rx="999" ry="999" width="118" height="36" fill="${pillBg}" stroke="${pillStroke}" stroke-width="1"/>
          <circle cx="18" cy="18" r="5.5" fill="${dot}"/>
          <text x="32" y="23" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto" font-size="14" font-weight="700" fill="${pillText}">
            ${row.pill}
          </text>
        </g>
      </g>`;
      })
      .join("")}
  </g>

  <!-- Right floating mini cards -->
  <g transform="translate(860,190)">
    ${[
      { title: "Restaurant réservé", date: "Le 14/05 à 20h00", meta: "8 personnes" },
      { title: "Véhicule livré", date: "Le 13/05 à 09h00", meta: "Sur votre chantier" },
      { title: "Cadeaux envoyés", date: "Le 12/05", meta: "Clients & équipes" },
    ].map((x) => ({
      title: escapeXml(x.title),
      date: escapeXml(x.date),
      meta: escapeXml(x.meta),
    }))
      .map((c, idx) => {
        const y = idx * 150;
        return `
      <g transform="translate(0,${y})" filter="url(#shadow-md)">
        <rect x="0" y="0" rx="26" ry="26" width="300" height="112" fill="#FFFFFF" stroke="${BORDER}" stroke-width="1"/>
        <rect x="18" y="18" rx="18" ry="18" width="44" height="44" fill="#EFF6FF" stroke="#BFDBFE" stroke-width="1"/>
        <circle cx="40" cy="40" r="10" fill="${BLUE}" opacity="0.20"/>

        <text x="76" y="44" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto" font-size="16" font-weight="700" fill="${SLATE_900}">
          ${c.title}
        </text>
        <text x="76" y="70" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto" font-size="14" font-weight="500" fill="${SLATE_500}">
          ${c.date}
        </text>
        <text x="76" y="92" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto" font-size="14" font-weight="500" fill="${SLATE_500}">
          ${c.meta}
        </text>
      </g>`;
      })
      .join("")}
  </g>

  <!-- Bottom dark blue pill -->
  <g transform="translate(180,640)" filter="url(#shadow-lg)">
    <rect x="0" y="0" rx="999" ry="999" width="520" height="74" fill="#0B1B3A" stroke="#FFFFFF" stroke-opacity="0.10" stroke-width="1"/>
    <rect x="14" y="12" rx="20" ry="20" width="50" height="50" fill="#FFFFFF" fill-opacity="0.10" stroke="#FFFFFF" stroke-opacity="0.10" stroke-width="1"/>
    <circle cx="39" cy="37" r="10" fill="${BLUE}" opacity="0.35"/>
    <text x="78" y="44" font-family="Inter, system-ui, -apple-system, Segoe UI, Roboto" font-size="16" font-weight="700" fill="#FFFFFF">
      Un interlocuteur unique, réactif et discret
    </text>
  </g>
</svg>`;

const resvg = new Resvg(svg, {
  fitTo: { mode: "width", value: W },
  background: "transparent",
});

const pngData = resvg.render().asPng();
const outPath = join(process.cwd(), "public", "conciergerie-ui.png");
writeFileSync(outPath, pngData);

// eslint-disable-next-line no-console
console.log(`✅ PNG exporté : ${outPath}`);

