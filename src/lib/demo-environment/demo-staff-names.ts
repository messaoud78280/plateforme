/**
 * DEMO-NAMES-CLEANUP — Staff @bework.internal distincts des personas démo.
 * Renommage / présentation uniquement — pas de suppression historique.
 */

import { prisma } from "@/lib/prisma";

/** Personas démo — ne jamais renommer ces comptes (@demo.bework.local). */
export const DEMO_PERSONA_CANONICAL_NAMES = [
  "Marc Dupont",
  "Karim Benali",
  "Julie Martin",
  "Sophie Martin",
  "Thomas Bernard",
] as const;

export type DemoStaffKey = "sophie" | "karim" | "laura";

export type DemoStaffContactDef = {
  key: DemoStaffKey;
  email: string;
  /** Nom affiché — distinct des personas */
  name: string;
  role: "AGENT" | "AGENCE";
  service: string;
  company: string;
  /**
   * false = masqué des listes Messagerie / Nouveau message en démo
   * (historique DM conservé).
   */
  showInDemoMessaging: boolean;
};

/**
 * Anciens homonymes :
 * - sophie.martin.demo → était « Sophie Martin » (conflit CLIENT_EXT)
 * - karim.benali.demo → était « Karim Benali » (conflit CONDUCTEUR)
 */
export const DEMO_STAFF_CONTACTS: DemoStaffContactDef[] = [
  {
    key: "sophie",
    email: "sophie.martin.demo@bework.internal",
    name: "Sophie Lefèvre",
    role: "AGENT",
    service: "Conductrice de travaux — Agence BeWork (démo)",
    company: "BeWork — Agence Démo",
    showInDemoMessaging: true,
  },
  {
    key: "karim",
    email: "karim.benali.demo@bework.internal",
    name: "Karim Adjaili",
    role: "AGENT",
    service: "Chef de chantier — Agence BeWork (démo)",
    company: "BeWork — Agence Démo",
    showInDemoMessaging: true,
  },
  {
    key: "laura",
    email: "laura.bernard.demo@bework.internal",
    name: "Laura Bernard",
    role: "AGENCE",
    service: "Support admin BeWork (legacy — Julie = Administratif ABC)",
    company: "BeWork — Agence Démo",
    /** Masquée des surfaces DEMO principales pour ne pas concurrencer Julie. */
    showInDemoMessaging: false,
  },
];

export function demoStaffByEmail(email: string | null | undefined): DemoStaffContactDef | null {
  if (!email) return null;
  const e = email.trim().toLowerCase();
  return DEMO_STAFF_CONTACTS.find((c) => c.email === e) ?? null;
}

export function isDemoStaffHiddenFromMessaging(email: string | null | undefined): boolean {
  const def = demoStaffByEmail(email);
  if (!def) return false;
  return !def.showInDemoMessaging;
}

/** Staff @bework.internal autorisés dans les listes Messagerie démo. */
export function isDemoStaffVisibleInMessaging(email: string | null | undefined): boolean {
  const def = demoStaffByEmail(email);
  return Boolean(def?.showInDemoMessaging);
}

/**
 * Aligne les noms visibles des comptes staff legacy (@bework.internal uniquement).
 * Ne touche jamais aux emails persona @demo.bework.local.
 */
export async function ensureDemoStaffDisplayNames(): Promise<{
  renamed: { email: string; from: string; to: string }[];
}> {
  const renamed: { email: string; from: string; to: string }[] = [];

  for (const contact of DEMO_STAFF_CONTACTS) {
    const existing = await prisma.user.findUnique({
      where: { email: contact.email },
      select: { id: true, name: true, service: true, company: true, email: true },
    });
    if (!existing) continue;
    if (!existing.email.endsWith("@bework.internal")) continue;

    const profile = contact.role === "AGENCE" ? "ADMINISTRATIF" : "CONDUCTEUR";
    const jobTitle =
      contact.key === "laura"
        ? "Support administratif"
        : contact.key === "sophie"
          ? "Conductrice de travaux"
          : "Conducteur de travaux";
    if (
      existing.name !== contact.name ||
      existing.service !== contact.service ||
      existing.company !== contact.company
    ) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: contact.name,
          service: contact.service,
          company: contact.company,
          personType: "INTERNAL",
          permissionProfile: profile,
          jobTitle,
        },
      });
      if (existing.name !== contact.name) {
        renamed.push({ email: contact.email, from: existing.name, to: contact.name });
      }
    } else {
      /** Même sans renommage : corriger profil métier legacy (Agent sans profil). */
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          personType: "INTERNAL",
          permissionProfile: profile,
          jobTitle,
        },
      });
    }
  }

  return { renamed };
}
