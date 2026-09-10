import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { generateCommercialQuotePdf } from "../src/lib/commercial/pdf-quote";
import { parseClientNotes } from "../src/lib/commercial/client-notes-structure";

const notes = readFileSync("tmp/client-notes-0148.txt", "utf8");
const p = parseClientNotes(notes);
const pdf = generateCommercialQuotePdf({
  number: "DEV-2026-0148",
  subject: "Réfection complète de l'accès extérieur en gravillon décoratif",
  status: "VALIDATED",
  issueDate: new Date("2026-09-08"),
  validityDate: new Date("2026-10-08"),
  clientNotes: notes,
  projectPresentation: {
    intro: p.intro,
    adviceParagraphs: p.adviceParagraphs,
    stages: p.stages.map((s) => ({
      ...s,
      mediaType: "ai_preview" as const,
      disclaimer:
        "Illustration non contractuelle — aperçu indicatif du principe d'intervention.",
      imageDataUrl: null,
      imageFormat: null,
    })),
    reserves: p.reserves,
  },
  issuer: {
    tradeName: "URBAN AMÉNAGEMENTS",
    activity: "Aménagements extérieurs • Maçonnerie • Terrassement",
    addressLine1: "Rue Henri Dunant",
    postalCode: "78280",
    city: "Guyancourt",
    email: "contact@amenagementexterieur78.fr",
    siret: "91225993400012",
    vatNumber: "FR86912259934",
  },
  client: {
    name: "Yohann Hautbois",
    address: "10 rue Lavoisier",
    postalCode: "78210",
    city: "Saint-Cyr-l'École",
    email: "yhautbois@gmail.com",
    phone: "+33608911793",
  },
  currency: "EUR",
  accentColor: "#1e3a5f",
  paymentSchedule: {
    basis: "TTC",
    lines: [
      { type: "DEPOSIT", percent: 30, label: "Acompte commande", sortOrder: 0 },
      { type: "PROGRESS", percent: 40, label: "Situation intermédiaire", sortOrder: 1 },
      { type: "FINAL", percent: 30, label: "Solde", sortOrder: 2 },
    ],
  },
  totals: { totalSellHt: 4600, totalVat: 460, totalTtc: 5060 },
  sections: [
    {
      title: "Travaux",
      lines: [
        {
          kind: "WORK",
          designation: "Fourniture et mise en œuvre de grave concassée 0/31,5",
          description:
            "Fourniture, répartition, réglage et compactage mécanique de grave concassée 0/31,5 sur une épaisseur moyenne d'environ 12 à 15 cm après compactage, afin de réaliser une assise stable pour le revêtement final.",
          quantity: 40,
          unit: "m²",
          unitSellHt: 20,
          vatRate: 10,
          lineSellHt: 800,
        },
        {
          kind: "WORK",
          designation:
            "Fourniture et mise en œuvre de gravillon décoratif calcaire blanc-beige",
          description:
            "Fourniture, répartition et réglage d'un gravillon décoratif calcaire blanc-beige sur une épaisseur moyenne d'environ 4 cm, dans des tonalités blanc, crème et beige clair, avec finition soignée adaptée à l'environnement de la maison.",
          quantity: 40,
          unit: "m²",
          unitSellHt: 12,
          vatRate: 10,
          lineSellHt: 480,
        },
      ],
    },
  ],
});

mkdirSync("tmp/devis-pdf-refonte", { recursive: true });
writeFileSync("tmp/devis-pdf-refonte/DEV-2026-0148-preview-local.pdf", pdf);
const latin = pdf.toString("latin1");
console.log({
  bytes: pdf.length,
  pages: (latin.match(/\/Type\s*\/Page(?!s)/g) || []).length,
  hasEquals: latin.includes("==="),
  hasChatGpt: /ChatGPT|TVA à confirmer/i.test(latin),
  stages: p.stages.length,
});
