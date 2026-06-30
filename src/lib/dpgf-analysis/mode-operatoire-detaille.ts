import type { DpgfAnalysisModeOperatoireDetaille } from "./types";

export const MODE_OPERATOIRE_DETAILLE_LIST_FIELDS = [
  { key: "preparationAvantDemarrage" as const, label: "Préparation avant démarrage", jsonKey: "preparation_avant_demarrage" },
  { key: "materielEtMoyens" as const, label: "Matériel et moyens", jsonKey: "materiel_et_moyens" },
  { key: "etapesExecution" as const, label: "Étapes d'exécution", jsonKey: "etapes_execution" },
  { key: "controlesEnCours" as const, label: "Contrôles en cours", jsonKey: "controles_en_cours" },
  { key: "controlesFinaux" as const, label: "Contrôles finaux", jsonKey: "controles_finaux" },
  { key: "livrablesOuPreuves" as const, label: "Livrables ou preuves", jsonKey: "livrables_ou_preuves" },
];

export function emptyModeOperatoireDetaille(): DpgfAnalysisModeOperatoireDetaille {
  return {
    objectif: "",
    preparationAvantDemarrage: [],
    materielEtMoyens: [],
    etapesExecution: [],
    controlesEnCours: [],
    controlesFinaux: [],
    livrablesOuPreuves: [],
  };
}

/** Normalise une liste depuis tableau, texte multiligne ou objet item. */
export function coerceStringList(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) {
    return v
      .map((x) => {
        if (typeof x === "string") return x.trim();
        if (x && typeof x === "object") {
          const o = x as Record<string, unknown>;
          const text = o.etape ?? o.texte ?? o.description ?? o.item ?? o.libelle ?? o.valeur;
          if (typeof text === "string") return text.trim();
        }
        return String(x).trim();
      })
      .filter(Boolean);
  }
  if (typeof v === "string") {
    const t = v.trim();
    if (!t) return [];
    if (t.includes("\n")) return t.split("\n").map((l) => l.trim()).filter(Boolean);
    return [t];
  }
  return [];
}

export function parseModeOperatoireDetailleFromJson(v: unknown): DpgfAnalysisModeOperatoireDetaille {
  const base = emptyModeOperatoireDetaille();
  if (!v || typeof v !== "object" || Array.isArray(v)) return base;
  const o = v as Record<string, unknown>;
  return {
    objectif: String(o.objectif_du_mode_operatoire ?? o.objectif ?? "").trim(),
    preparationAvantDemarrage: coerceStringList(o.preparation_avant_demarrage),
    materielEtMoyens: coerceStringList(o.materiel_et_moyens),
    etapesExecution: coerceStringList(o.etapes_execution),
    controlesEnCours: coerceStringList(o.controles_en_cours),
    controlesFinaux: coerceStringList(o.controles_finaux),
    livrablesOuPreuves: coerceStringList(o.livrables_ou_preuves),
  };
}

export function parseModeOperatoireDetailleFromStored(v: unknown): DpgfAnalysisModeOperatoireDetaille {
  const base = emptyModeOperatoireDetaille();
  if (!v || typeof v !== "object" || Array.isArray(v)) return base;
  const o = v as Record<string, unknown>;
  return {
    objectif: String(o.objectif ?? "").trim(),
    preparationAvantDemarrage: coerceStringList(o.preparationAvantDemarrage),
    materielEtMoyens: coerceStringList(o.materielEtMoyens),
    etapesExecution: coerceStringList(o.etapesExecution),
    controlesEnCours: coerceStringList(o.controlesEnCours),
    controlesFinaux: coerceStringList(o.controlesFinaux),
    livrablesOuPreuves: coerceStringList(o.livrablesOuPreuves),
  };
}

export function hasModeOperatoireDetailleContent(d: DpgfAnalysisModeOperatoireDetaille): boolean {
  if (d.objectif.trim()) return true;
  return MODE_OPERATOIRE_DETAILLE_LIST_FIELDS.some(({ key }) => d[key].length > 0);
}

export function modeOperatoireDetailleToJson(
  d: DpgfAnalysisModeOperatoireDetaille,
): Record<string, unknown> | undefined {
  if (!hasModeOperatoireDetailleContent(d)) return undefined;
  return {
    objectif_du_mode_operatoire: d.objectif,
    preparation_avant_demarrage: d.preparationAvantDemarrage,
    materiel_et_moyens: d.materielEtMoyens,
    etapes_execution: d.etapesExecution,
    controles_en_cours: d.controlesEnCours,
    controles_finaux: d.controlesFinaux,
    livrables_ou_preuves: d.livrablesOuPreuves,
  };
}

/** Validation souple à l'import — warnings uniquement. */
export function validateModeOperatoireDetailleJson(v: unknown): string[] {
  const warnings: string[] = [];
  if (v == null) return warnings;
  if (typeof v !== "object" || Array.isArray(v)) {
    warnings.push("mode_operatoire_detaille doit être un objet — conversion ignorée.");
    return warnings;
  }
  const o = v as Record<string, unknown>;
  for (const { jsonKey } of MODE_OPERATOIRE_DETAILLE_LIST_FIELDS) {
    const val = o[jsonKey];
    if (val != null && !Array.isArray(val) && typeof val !== "string") {
      warnings.push(`${jsonKey} devrait être un tableau — conversion tentée.`);
    }
  }
  return warnings;
}

export function parseModeOperatoireDetailleFromFormJson(raw: string): DpgfAnalysisModeOperatoireDetaille {
  if (!raw.trim()) return emptyModeOperatoireDetaille();
  try {
    return parseModeOperatoireDetailleFromStored(JSON.parse(raw));
  } catch {
    return emptyModeOperatoireDetaille();
  }
}
