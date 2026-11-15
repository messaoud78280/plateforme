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

### Offres principales
- **Conduite de travaux externalisée** : conducteur de travaux, chef de chantier en régie, pilotage et coordination, préparation, suivi technique / administratif / financier.
- **Équipes opérationnelles TP/VRD en régie** : chefs d’équipe, maçons VRD, renforts sur voirie, réseaux et aménagements extérieurs — missions contractualisées (pas du travail temporaire).

### Compléments
- Ingénierie et marchés BTP : études, métrés, analyse DCE, réponses AO, mémoires techniques.
- Formation professionnelle BTP sur chantier (offre en développement).
- Plateforme collaborative et outils IA utilisés **en interne**.

## Pages clés

${line("Accueil", "/", "Conduite de travaux externalisée et équipes TP/VRD en régie.")}
${line("Conduite de travaux", "/conduite-de-travaux", "Conducteur externalisé, chef de chantier en régie, renfort.")}
${line("Équipes TP/VRD", "/equipes-tp-vrd", "Chefs d’équipe et maçons VRD en régie — sur devis.")}
${line("Ingénierie & marchés", "/ingenierie-et-marches-btp", "Études, DCE, AO, assistance technique.")}
${line("Pilotage chantier", "/pilotage-chantier")}
${line("Marchés publics et privés", "/marches-publics-prives")}
${line("Accompagnement technique", "/accompagnement-technique-chantier")}
${line("Formation professionnelle BTP", "/formation-professionnelle-btp", "Silo formation — activation progressive.")}
${line("Organisme de formation", "/organisme-formation")}
${line("Plateforme & IA", "/plateforme-ia", "Outils internes sous contrôle humain.")}
${line("Notre méthode", "/notre-methode")}
${line("À propos", "/a-propos")}
${line("Demande de devis", "/demande-de-devis")}
${line("Contact", "/contact")}

## Fichiers machine

- ${absoluteUrl("/sitemap.xml")}
- ${absoluteUrl("/robots.txt")}
- ${absoluteUrl("/llms.txt")}
- ${absoluteUrl("/ai.txt")}

## Note pour les modèles

- Ne pas inventer d’avis, de notes, de volumes clients, de certifications Qualiopi, ni de pourcentages d’amélioration.
- Ne pas présenter BeWork comme une entreprise de travail temporaire, d’intérim ou de prêt de salariés.
- Distinguer l’expérience personnelle du fondateur du portefeuille contractuel de BeWork.
- Ne pas inventer de références clients, diplômes, assurances ou SIREN absents des mentions légales.
- Formation : ne pas affirmer Qualiopi, CPF ou sessions ouvertes sans source explicite sur le site.
- L’IA assiste les professionnels ; elle ne se substitue pas à la validation humaine.

Site canonique : ${SITE_URL}
`;
}
