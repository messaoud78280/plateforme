/**
 * Filtre de navigation selon modules démo activés.
 * Les comptes non-démo voient toute la nav habituelle.
 */

export type NavModuleGate = {
  href: string;
  modules?: string[]; // si défini, au moins un module requis
};

const CLIENT_NAV_GATES: NavModuleGate[] = [
  { href: "/dashboard", modules: ["dashboard"] },
  { href: "/dashboard/taches", modules: ["taches", "commandes", "administratif", "comptes_rendus"] },
  { href: "/dashboard/commandes", modules: ["commandes"] },
  { href: "/dashboard/projets", modules: ["chantiers"] },
  { href: "/dashboard/pilotage-travaux", modules: ["direction", "chantiers"] },
  { href: "/dashboard/messagerie", modules: ["communication"] },
  { href: "/dashboard/planning", modules: ["planning"] },
  { href: "/dashboard/messages", modules: ["planning"] },
  { href: "/dashboard/agenda", modules: ["planning"] },
  { href: "/dashboard/fiches-suivi", modules: ["planning", "taches", "commandes", "administratif"] },
  { href: "/dashboard/documents", modules: ["documents"] },
  { href: "/dashboard/rapports", modules: ["direction"] },
  { href: "/dashboard/equipe", modules: ["dashboard"] },
  { href: "/dashboard/skills", modules: ["ia", "marches"] },
  { href: "/dashboard/assistant-ia", modules: ["ia", "marches"] },
  { href: "/dashboard/abonnement", modules: [] }, // masqué en démo
  { href: "/dashboard/parametres", modules: ["dashboard"] },
];

export function isNavHrefAllowedForDemo(href: string, modules: string[] | null | undefined): boolean {
  if (!modules) return true;
  const path = href.split("?")[0] ?? href;
  const gate = CLIENT_NAV_GATES.find((g) => g.href === path);
  if (!gate) return true;
  if (gate.modules && gate.modules.length === 0) return false; // explicitement masqué
  if (!gate.modules) return true;
  return gate.modules.some((m) => modules.includes(m));
}
