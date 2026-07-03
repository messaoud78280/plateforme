import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SOURCE = "CCTP Fondations - GO — révision BeWork v2";
const REMOVE = new Set([
  "VRD",
  "Bande podotactile",
  "Caillebottis",
  "PF1 / PF2",
  "Passage caméra",
  "Hydrocurage",
  "Plan de récolement",
  "Piquetage",
  "Compactage",
]);

const FAMILY = {
  "Accès de chantier": ["Installation chantier", "technique", "intermédiaire", ["accès", "clôture", "coactivité"], ["CCTP", "PGC SPS", "CCAG"]],
  ACERMI: ["Isolation / matériaux", "norme", "confirmé", ["isolant", "certification", "thermique"], ["CCTP", "ACERMI", "avis technique"]],
  "Acier HA - Haute adhérence": ["Béton armé", "materiau", "intermédiaire", ["acier", "armature", "HA"], ["CCTP", "NF EN 10080", "Eurocode 2"]],
  "Aciers en attente": ["Béton armé", "mise_en_oeuvre", "intermédiaire", ["attente", "ferraillage", "continuité"], ["CCTP", "plans d'exécution"]],
  Adjuvant: ["Béton", "materiau", "intermédiaire", ["béton", "adjuvant", "dosage"], ["CCTP", "NF EN 934", "fiche technique"]],
  Agglo: ["Maçonnerie", "materiau", "intermédiaire", ["bloc", "maçonnerie", "NF"], ["CCTP", "DTU 20.1", "NF EN 771"]],
  Aplomb: ["Métrologie", "technique", "intermédiaire", ["verticalité", "tolérance", "contrôle"], ["CCTP", "DTU 20.1"]],
  "Appareil d'appui en néoprène fretté": ["Structure", "materiau", "confirmé", ["appui", "néoprène", "linteau"], ["CCTP", "plans structure"]],
  "Appui de baie": ["Interfaces lots", "mise_en_oeuvre", "intermédiaire", ["menuiserie", "appui", "étanchéité"], ["CCTP", "DTU 36.5"]],
  Arase: ["Métrologie", "technique", "intermédiaire", ["niveau", "référence", "altimétrie"], ["CCTP", "DPGF"]],
  "Arase étanche": ["Maçonnerie / humidité", "mise_en_oeuvre", "confirmé", ["capillarité", "hydrofuge", "libage"], ["CCTP", "DTU 20.1"]],
  Armature: ["Béton armé", "technique", "confirmé", ["ferraillage", "enrobage", "acier"], ["CCTP", "Eurocode 2", "plans BA"]],
  "Armatures en chapeaux": ["Béton armé", "technique", "confirmé", ["dalle", "moment négatif", "chapeau"], ["CCTP", "note de calcul"]],
  Avaloir: ["Réseaux GO", "technique", "intermédiaire", ["EP", "balcon", "collecte"], ["CCTP", "DTU 60.1"]],
  "Avis technique": ["Contractuel / qualité", "document", "confirmé", ["CSTB", "procédé", "validation"], ["CCTP", "CCAP", "avis technique"]],
  BA: ["Béton armé", "technique", "intermédiaire", ["structure", "béton", "ferraillage"], ["CCTP", "Eurocode 2", "NF EN 206"]],
  "Balcon en porte à faux": ["Structure", "technique", "confirmé", ["console", "plancher", "ferraillage"], ["CCTP", "Eurocode 2"]],
  Balèvre: ["Béton / finition", "mise_en_oeuvre", "intermédiaire", ["décoffrage", "parement", "ragréage"], ["CCTP", "FD P 18-503"]],
  Banche: ["Béton banché", "materiel", "intermédiaire", ["coffrage", "voile", "parement"], ["CCTP", "FD P 18-503"]],
  Barbotine: ["Béton", "mise_en_oeuvre", "intermédiaire", ["reprise", "accrochage", "interdit"], ["CCTP", "DTU 23.1"]],
  Bouchardage: ["Béton / accrochage", "mise_en_oeuvre", "intermédiaire", ["rugosité", "enduit", "support"], ["CCTP", "DTU 26.1"]],
  BPS: ["Béton", "norme", "confirmé", ["NF", "classe", "exposition"], ["CCTP", "NF EN 206", "bon de livraison"]],
  Buton: ["Terrassement / soutènement", "mise_en_oeuvre", "confirmé", ["blindage", "fouille", "sécurité"], ["CCTP", "PGC SPS"]],
  Bâchage: ["Installation chantier", "securite", "intermédiaire", ["protection", "voie publique", "intempéries"], ["CCTP", "PGC SPS"]],
  "Béton banché": ["Béton banché", "technique", "confirmé", ["voile", "coffrage", "vibration"], ["CCTP", "DTU 23.1", "FD P 18-503"]],
  "Béton de propreté": ["Fondations", "mise_en_oeuvre", "intermédiaire", ["semelle", "assise", "non structurel"], ["CCTP", "DTU 13.3"]],
  "Béton précontraint": ["Structure", "technique", "confirmé", ["précontrainte", "longrine", "prédalle"], ["CCTP", "Eurocode 2", "DTU 23.3"]],
  "Canalisation CR4 / CR8": ["Réseaux GO", "norme", "confirmé", ["PVC", "assainissement", "rigidité"], ["CCTP", "DTU 64.1"]],
  "Caniveau à grille": ["Réseaux GO", "technique", "intermédiaire", ["EP", "terrasse", "pente"], ["CCTP", "DTU 60.1"]],
  Capillarité: ["Humidité / maçonnerie", "technique", "intermédiaire", ["remontée", "arase", "sol"], ["CCTP", "DTU 20.1"]],
  "Chaise d'implantation": ["Métrologie", "mise_en_oeuvre", "intermédiaire", ["implantation", "axes", "géomètre"], ["CCTP", "plan d'implantation"]],
  Chanfrein: ["Béton / finition", "mise_en_oeuvre", "intermédiaire", ["arête", "coffrage", "parement"], ["CCTP", "plans d'exécution"]],
  Chaperon: ["Maçonnerie / étanchéité", "mise_en_oeuvre", "intermédiaire", ["garde-corps", "goutte d'eau", "arase"], ["CCTP", "lot étanchéité"]],
  "Charges d'exploitation": ["Structure", "technique", "confirmé", ["Q", "Eurocode", "daN/m²"], ["CCTP", "Eurocode 0", "note de calcul"]],
  "Charges permanentes": ["Structure", "technique", "confirmé", ["G", "poids propre", "dimensionnement"], ["CCTP", "Eurocode 0"]],
  "Chaînage horizontal": ["Maçonnerie porteuse", "technique", "confirmé", ["ceinture", "BA", "stabilité"], ["CCTP", "DTU 20.1", "Eurocode 6"]],
  "Chaînage vertical": ["Maçonnerie porteuse", "technique", "confirmé", ["poteau", "refend", "rigidité"], ["CCTP", "DTU 20.1"]],
  Clavetage: ["Structure / préfabrication", "mise_en_oeuvre", "confirmé", ["liaison", "poutre", "broche"], ["CCTP", "plans d'exécution"]],
  Coffrage: ["Béton", "materiel", "confirmé", ["moule", "parement", "C1-C6"], ["CCTP", "FD P 18-503", "DTU 23.1"]],
  "Coffrage perdu biodégradable": ["Fondations / dalle portée", "mise_en_oeuvre", "confirmé", ["vide sanitaire", "BIOCOFRA", "étude de sol"], ["CCTP", "étude G2", "avis technique"]],
  "Compacité du béton": ["Béton", "technique", "confirmé", ["densité", "durabilité", "vibration"], ["CCTP", "NF EN 206"]],
  "Constat contradictoire": ["Contractuel", "document", "confirmé", ["huissier", "état des lieux", "litige"], ["CCTP", "CCAG", "CCAP"]],
  "Contrôleur technique": ["Contractuel / contrôle", "document", "confirmé", ["CT", "missions", "visa"], ["CCTP", "CCAP", "missions CT"]],
  DOE: ["Contractuel / réception", "document", "confirmé", ["réception", "plans EXE", "essais"], ["CCTP", "CCAG", "CCAP"]],
  DTU: ["Normes", "norme", "confirmé", ["règles de l'art", "référence", "mise en œuvre"], ["CCTP", "CCAG", "DTU applicables"]],
  MOE: ["Contractuel", "document", "confirmé", ["maître d'œuvre", "visa", "coordination"], ["CCTP", "CCAG", "marché public"]],
  NF: ["Normes", "norme", "intermédiaire", ["marquage", "conformité", "produit"], ["CCTP", "fiches techniques"]],
  Eurocodes: ["Structure", "norme", "confirmé", ["calcul", "EN 1990", "annexe nationale"], ["CCTP", "note de calcul"]],
  EP: ["Réseaux GO", "technique", "intermédiaire", ["pluvial", "pente", "exutoire"], ["CCTP", "DTU 60.1"]],
  EU: ["Réseaux GO", "technique", "intermédiaire", ["assainissement", "gravitaire", "regard"], ["CCTP", "DTU 64.1"]],
  EV: ["Réseaux GO", "technique", "intermédiaire", ["vannes", "WC", "PVC"], ["CCTP", "DTU 64.1"]],
  TN: ["Métrologie", "technique", "intermédiaire", ["terrain naturel", "NGF", "cote"], ["CCTP", "plan altimétrique"]],
  HQE: ["Contractuel / qualité", "document", "intermédiaire", ["certification", "environnement", "cible"], ["CCTP", "cahier des charges HQE"]],
  "Référé préventif": ["Contractuel / litige", "document", "confirmé", ["tribunal", "urgence", "marché public"], ["CCAG", "CCAP", "code de procédure"]],
};

function metaFor(term) {
  if (FAMILY[term]) {
    const [famille, categorie, niveau, mots_cles, documents_lies] = FAMILY[term];
    return { famille, categorie, niveau, mots_cles, documents_lies };
  }
  const lower = term.toLowerCase();
  if (/béton|beton|dalle|voile|poteau|semelle|longrine|ferraill|coulage|décoffr|prédalle|précontraint|stabox|treillis|corbeau|linteau|raidisseur|garde-corps ba|plot béton|sommiers|reprise de bétonnage|ségrégation|malaxage|enrobage|gros béton|forme de propreté/.test(lower))
    return defaultMeta("Béton armé / structure", "technique", ["béton", "structure", "GO"]);
  if (/fouille|fond|semelle|longrine|remblai|talus|soutènement|portance|proctor|purge|épuisement|rabattement|plateforme|décaissé|g2|géomètre|implantation|ngf|cote|niveau|trait de niveau|vérification des cotes/.test(lower))
    return defaultMeta("Fondations / terrassement", "mise_en_oeuvre", ["fondation", "sol", "assise"]);
  if (/maçonner|agglo|libage|joint|chaînage|mur|parement|arase|capillarité|gobetis|enduit hydrofuge|mortier/.test(lower))
    return defaultMeta("Maçonnerie", "mise_en_oeuvre", ["maçonnerie", "mur", "DTU 20.1"]);
  if (/ep|eu|ev|canalisation|regard|siphon|fourreau|avaloir|caniveau|exutoire|pissette|hydrocurage|fil d'eau/.test(lower))
    return defaultMeta("Réseaux sous dallage", "technique", ["réseau", "assainissement", "EP"]);
  if (/échafaudage|pgc|sps|bâchage|accès/.test(lower))
    return defaultMeta("Installation chantier", "securite", ["chantier", "sécurité", "SPS"]);
  if (/do[ec]|dtu|moe|nf|eurocode|constat|contrôleur|hqe|référé|avis/.test(lower))
    return defaultMeta("Contractuel / normatif", "document", ["marché", "CCTP", "conformité"]);
  return defaultMeta("Gros œuvre", "technique", ["GO", "CCTP", "chantier"]);
}

function defaultMeta(famille, categorie, mots_cles) {
  return {
    famille,
    categorie,
    niveau: "intermédiaire",
    mots_cles,
    documents_lies: ["CCTP", "DPGF"],
  };
}

function expandDef(entry, meta) {
  const d = entry.definition_courte;
  const suffix = {
    document: " Référence contractuelle à identifier sur pièces marché (CCTP, CCAP, CCAG selon marché public ou privé).",
    norme: " Référence normative indicative — à confirmer selon CCTP, version applicable et avis du BET/CT.",
    materiau: " Caractéristiques et performances à valider sur fiches techniques et prescriptions du lot GO.",
  }[meta.categorie];
  return suffix && !d.includes("à confirmer") ? `${d}${suffix}` : d;
}

function expandExpl(entry, meta) {
  const base = entry.explication_pedagogique;
  const angle =
    meta.famille.includes("Contractuel")
      ? " Indispensable pour lire un DPGF/CCTP, cadrer les responsabilités et anticiper litiges ou réserves en marché public comme en privé."
      : " Permet de situer la prescription dans le lot GO, d'anticiper interfaces avec autres corps d'état et points de contrôle avant coulage ou réception.";
  return `${base}${angle}`;
}

function expandEx(entry) {
  const ex = entry.exemple_utilisation;
  if (/marché|CCAG|DPGF|privé|public|MOE|entreprise/i.test(ex)) return ex;
  if (/CCTP/i.test(ex))
    return `${ex} En marché public : vérifier cohérence avec DPGF, plans EXE et visas MOE/CT avant exécution.`;
  return ex;
}

function expandVig(entry, meta) {
  const v = [...(entry.points_vigilance ?? [])];
  if (meta.categorie === "norme" && !v.some((x) => /indicatif|confirmer/i.test(x)))
    v.push("Référence normative indicative — à confirmer selon CCTP et lot.");
  if (meta.famille.includes("Réseaux") && !v.some((x) => /interface|lot/i.test(x)))
    v.push("Coordonner implantation et essais avec le lot assainissement / VRD si séparé.");
  return v;
}

function enrich(entry) {
  const meta = metaFor(entry.terme);
  return {
    terme: entry.terme,
    ...(entry.acronyme ? { acronyme: entry.acronyme } : {}),
    definition_courte: expandDef(entry, meta),
    explication_pedagogique: expandExpl(entry, meta),
    exemple_utilisation: expandEx(entry),
    points_vigilance: expandVig(entry, meta),
    famille: meta.famille,
    categorie: meta.categorie,
    mots_cles: meta.mots_cles,
    documents_lies: meta.documents_lies,
    niveau: meta.niveau,
    source: SOURCE,
    statut: "à vérifier",
  };
}

const root = resolve(process.cwd());
const original = JSON.parse(readFileSync(resolve(root, "prisma/seed-data/dico-btp-lot-01.json"), "utf8"));
const batch4Path = resolve(root, "prisma/seed-data/_lot01-batch4.json");
let batch4 = [];
try {
  batch4 = JSON.parse(readFileSync(batch4Path, "utf8"));
} catch {
  /* optional */
}
const batch4ByTerm = new Map(batch4.map((e) => [e.terme, e]));

const kept = original.filter((e) => !REMOVE.has(e.terme));
const out = kept.map((e) => {
  const b4 = batch4ByTerm.get(e.terme);
  const base = b4 ? { ...e, ...b4 } : e;
  return enrich(base);
});

writeFileSync(resolve(root, "prisma/seed-data/dico-btp-lot-01.json"), `${JSON.stringify(out, null, 2)}\n`, "utf8");
console.log(`Lot 01 révisé : ${out.length} termes (${REMOVE.size} retirés), source : ${SOURCE}`);
