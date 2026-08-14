/**
 * Génère les PDF visuels de la refonte devis (non commité).
 * Run: npx tsx scripts/generate-devis-pdf-refonte-samples.ts
 */
import fs from "fs";
import path from "path";
import {
  generateCommercialQuotePdf,
  type QuotePdfInput,
} from "../src/lib/commercial/pdf-quote";

function pdfPageCount(buf: Buffer): number {
  return (buf.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) || []).length;
}

const smoke: QuotePdfInput = {
  number: "DEV-2026-SMOKE1",
  subject: "Réfection étanchéité toiture-terrasse",
  status: "DRAFT",
  issueDate: new Date("2026-08-12T00:00:00.000Z"),
  validityDate: new Date("2026-09-11T00:00:00.000Z"),
  paymentTerms: "Règlement par virement bancaire.",
  paymentSchedule: {
    basis: "TTC",
    lines: [
      { type: "DEPOSIT", percent: 30, label: "Acompte à la commande", sortOrder: 0 },
      { type: "PROGRESS", percent: 40, label: "Situation intermédiaire", sortOrder: 1 },
      { type: "FINAL", percent: 30, label: "Solde", sortOrder: 2 },
    ],
  },
  clientNotes: "Accès à confirmer.",
  siteAddressSnapshot: "Versailles",
  projectTitle: "Résidence Les Jardins",
  versionNumber: 1,
  issuer: {
    name: "SETRIM",
    tradeName: "SETRIM",
    siret: "12345678900012",
    vatNumber: "FR12345678900",
    email: "contact@setrim.fr",
    phone: "01 00 00 00 00",
    addressLine1: "10 rue de l’Industrie",
    city: "Versailles",
    postalCode: "78000",
  },
  client: { name: "Syndic Horizon Copro", city: "Versailles" },
  currency: "EUR",
  accentColor: "#1e3a5f",
  documentSettings: { paymentModeLabel: "Virement bancaire" },
  totals: { totalSellHt: 10_200, totalVat: 2_040, totalTtc: 12_240 },
  vatBreakdown: [{ rate: 20, baseHt: 10_200, vat: 2_040 }],
  sections: [
    {
      title: "Étanchéité",
      lines: [
        {
          kind: "WORK",
          reference: "ET-01",
          designation: "Étanchéité bicouche élastomère",
          description:
            "Fourniture et mise en œuvre comprenant préparation du support.\n\nAccès chantier à confirmer avec le syndic.",
          quantity: 120,
          unit: "m²",
          unitSellHt: 85,
          vatRate: 20,
          lineSellHt: 10_200,
        },
      ],
    },
    {
      title: "Options",
      lines: [
        {
          kind: "OPTION",
          reference: "OPT-1",
          designation: "Relevé d’acrotères",
          quantity: 1,
          unit: "U",
          unitSellHt: 1_500,
          vatRate: 20,
          lineSellHt: 1_500,
          isOptional: true,
        },
      ],
    },
  ],
};

const longDesc =
  "Fourniture et mise en œuvre comprenant préparation du support, primaire d’accrochage, membrane bicouche élastomère SBS, relevés, équerres de renfort, bande de solin, relevés d’acrotères, et toutes sujétions d’exécution selon DTU indicatif — à confirmer selon CCTP et lot. " +
  "Contrôle de pente, tests d’étanchéité et nettoyage de finition. ".repeat(8);

const lots = ["Gros œuvre", "Étanchéité", "Couverture", "Zinguerie"];

const long20: QuotePdfInput = {
  ...smoke,
  number: "DEV-2026-LONG20",
  status: "SENT",
  clientNotes: null,
  sections: lots.map((title, i) => ({
    title,
    lines: Array.from({ length: 5 }, (_, j) => ({
      kind: "WORK" as const,
      reference: `${title.slice(0, 2).toUpperCase()}-${i}${j}`,
      designation: `Ouvrage ${title} ${j + 1}`,
      description: j === 0 ? longDesc : "Fourniture et pose selon prescriptions du lot.",
      quantity: 12 + j,
      unit: j % 2 ? "m²" : "ml",
      unitSellHt: 85,
      vatRate: i === 0 ? 10 : 20,
      lineSellHt: (12 + j) * 85,
    })),
  })),
  vatBreakdown: [
    { rate: 10, baseHt: 5_000, vat: 500 },
    { rate: 20, baseHt: 12_000, vat: 2_400 },
  ],
  totals: { totalSellHt: 17_000, totalVat: 2_900, totalTtc: 19_900 },
};

const long50: QuotePdfInput = {
  ...smoke,
  number: "DEV-2026-LONG50",
  status: "SENT",
  clientNotes: null,
  sections: Array.from({ length: 5 }, (_, i) => ({
    title: `Lot ${i + 1}`,
    lines: Array.from({ length: 10 }, (_, j) => ({
      kind: "WORK" as const,
      reference: `L${i + 1}-${String(j + 1).padStart(2, "0")}`,
      designation: `Prestation ${i + 1}.${j + 1}`,
      description: "Fourniture et mise en œuvre, toutes sujétions comprises.",
      quantity: 1,
      unit: "U",
      unitSellHt: 125_840,
      vatRate: 20,
      lineSellHt: 125_840,
    })),
  })),
  totals: { totalSellHt: 6_292_000, totalVat: 1_258_400, totalTtc: 7_550_400 },
};

const out = path.join(process.cwd(), "tmp/devis-pdf-refonte");
fs.mkdirSync(out, { recursive: true });

const files: Array<[string, QuotePdfInput]> = [
  ["DEV-2026-SMOKE1-apres.pdf", smoke],
  ["DEV-2026-SMOKE1-envoye.pdf", { ...smoke, status: "SENT" }],
  ["DEV-2026-SMOKE1-sans-obs.pdf", { ...smoke, status: "VALIDATED", clientNotes: null }],
  ["DEV-2026-LONG20.pdf", long20],
  ["DEV-2026-LONG50.pdf", long50],
];

for (const [name, input] of files) {
  const buf = generateCommercialQuotePdf(input);
  fs.writeFileSync(path.join(out, name), buf);
  console.log(`${name}  pages=${pdfPageCount(buf)}  bytes=${buf.length}`);
}
