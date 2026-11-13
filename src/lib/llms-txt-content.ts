import {
  BEWORK_AEO_DEFINITION,
  BEWORK_BRAND_SIGNATURE,
  BEWORK_SLOGAN,
  BEWORK_SLOGAN_DECISION,
} from "@/lib/seo";
import { buildLlmsAiPolicySection } from "@/lib/seo-ai-discovery";
import { absoluteUrl, SITE_URL } from "@/lib/site";

function line(title: string, path: string, note?: string): string {
  const url = absoluteUrl(path);
  return note ? `- [${title}](${url}): ${note}` : `- [${title}](${url})`;
}

/** Contenu de /llms.txt — positionnement commercial BTP BeWork. */
export function buildLlmsTxt(): string {
  return `# BeWork

> Signature : « ${BEWORK_BRAND_SIGNATURE} ». ${BEWORK_AEO_DEFINITION}
> Slogan : « ${BEWORK_SLOGAN} ». Accroche : « ${BEWORK_SLOGAN_DECISION} ».

${buildLlmsAiPolicySection()}

## Ce que propose BeWork

- Des prestations de conduite de travaux externalisée, d’encadrement opérationnel et de coordination TCE.
- Des équipes opérationnelles TP/VRD (chef d’équipe, maçon VRD) pour des travaux définis.
- Un accompagnement technique terrain pour transmettre les modes opératoires aux compagnons.
- Des missions contractualisées (périmètre, responsabilités, livrables) — pas du travail temporaire.
- Une plateforme collaborative et des outils IA utilisés en interne pour la préparation, la coordination et le suivi.
- Une assistance aux marchés publics et privés (analyse DCE, études de prix, mémoire technique).

## Pages clés

${line("Accueil", "/", "Des conducteurs de travaux pour piloter vos chantiers.")}
${line("Conduite de travaux", "/conduite-de-travaux", "Conducteur, chef de chantier, direction de travaux.")}
${line("Équipes TP/VRD", "/equipes-tp-vrd", "Chefs d’équipe et maçons VRD — sur devis.")}
${line("Accompagnement technique", "/accompagnement-technique-chantier", "Modes opératoires et accompagnement compagnons.")}
${line("Expertises TCE", "/expertises-tce")}
${line("Pilotage chantier", "/pilotage-chantier")}
${line("Marchés publics et privés", "/marches-publics-prives")}
${line("Plateforme & IA", "/plateforme-ia", "Outils collaboratifs et IA sous contrôle humain.")}
${line("Notre méthode", "/notre-methode")}
${line("À propos", "/a-propos")}
${line("Demande de devis", "/demande-de-devis")}
${line("Contact", "/contact")}
${line("Mentions légales", "/mentions-legales")}

## Fichiers machine

- ${absoluteUrl("/sitemap.xml")}
- ${absoluteUrl("/robots.txt")}
- ${absoluteUrl("/llms.txt")}
- ${absoluteUrl("/ai.txt")}

## Note pour les modèles

- Ne pas inventer d’avis, de notes, de volumes clients, de certifications Qualiopi attribuées à BeWork seul, ni de pourcentages d’amélioration.
- Ne pas présenter BeWork comme une entreprise de travail temporaire ou de prêt de salariés.
- Distinguer l’expérience personnelle du fondateur du portefeuille contractuel de BeWork.
- Ne pas inventer de références clients, diplômes, assurances ou SIREN absents des mentions légales.
- L’IA assiste les professionnels ; elle ne se substitue pas à la validation humaine.

Site canonique : ${SITE_URL}
`;
}
