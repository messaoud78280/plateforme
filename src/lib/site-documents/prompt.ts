import type { PpspsPayload, SiteReportPayload } from "@/lib/site-documents/types";
import {
  BEWORK_PPSPS_FORMAT,
  BEWORK_SITE_REPORT_FORMAT,
} from "@/lib/site-documents/types";

export type ProjectPromptContext = {
  projectTitle: string;
  projectId: string;
  siteAddress?: string | null;
  siteCity?: string | null;
  clientLabel?: string | null;
  companyLabel?: string | null;
  description?: string | null;
  quoteNumbers?: string[];
  manager?: string | null;
};

export function buildSiteReportPrompt(input: {
  project: ProjectPromptContext;
  draft: SiteReportPayload;
  quickNotes?: string | null;
}): string {
  const { project, draft, quickNotes } = input;
  const data = {
    chantier: {
      titre: project.projectTitle,
      adresse: [project.siteAddress, project.siteCity].filter(Boolean).join(", ") || null,
      client: project.clientLabel,
      entreprise: project.companyLabel,
      description: project.description,
      devis: project.quoteNumbers ?? [],
      responsable: project.manager,
    },
    saisie_rapide: quickNotes?.trim() || null,
    brouillon_actuel: draft,
  };

  return [
    "Tu es un assistant spécialisé dans les comptes rendus de chantier BTP.",
    "",
    "À partir des informations fournies, rédige un compte rendu professionnel, factuel, clair et concis.",
    "N'invente aucune information.",
    "Si une information manque, laisse-la vide (chaîne vide ou tableau vide).",
    "Distingue clairement : faits constatés, décisions, actions, responsables, échéances.",
    "",
    `Retourne UNIQUEMENT un bloc JSON valide au format ${BEWORK_SITE_REPORT_FORMAT}, sans markdown ni commentaire.`,
    "",
    "Structure attendue :",
    JSON.stringify(
      {
        format: BEWORK_SITE_REPORT_FORMAT,
        import_id: "import_unique_stable",
        report: {
          title: "",
          report_number: draft.reportNumber || "",
          date: draft.date || "",
          summary: "",
          participants: [{ name: "", company: "", role: "" }],
          work_completed: [],
          work_in_progress: [],
          observations: [],
          issues: [],
          decisions: [],
          client_requests: [],
          safety_observations: [],
          corrective_actions: [],
          next_steps: [{ action: "", responsible: "", due_date: "" }],
          reservations: [],
          next_meeting: "",
          additional_notes: "",
        },
      },
      null,
      2,
    ),
    "",
    "DONNÉES BEWORK :",
    JSON.stringify(data, null, 2),
  ].join("\n");
}

export function buildPpspsPrompt(input: {
  project: ProjectPromptContext;
  draft: PpspsPayload;
  quickNotes?: string | null;
}): string {
  const { project, draft, quickNotes } = input;
  const data = {
    chantier: {
      titre: project.projectTitle,
      adresse: [project.siteAddress, project.siteCity].filter(Boolean).join(", ") || null,
      client: project.clientLabel,
      entreprise: project.companyLabel,
      description: project.description,
      devis: project.quoteNumbers ?? [],
      responsable: project.manager,
    },
    notes_rapides: quickNotes?.trim() || null,
    brouillon_actuel: draft,
  };

  return [
    "Tu es un assistant de rédaction spécialisé dans les documents de chantier BTP.",
    "",
    "À partir des données fournies, aide à structurer et rédiger le PPSPS.",
    "N'invente aucune donnée propre au chantier.",
    "Ne présente jamais le document comme automatiquement conforme.",
    "Les mesures de prévention générées doivent rester modifiables et devront être vérifiées par le responsable du chantier avant diffusion.",
    "",
    `Retourne UNIQUEMENT un JSON valide au format ${BEWORK_PPSPS_FORMAT}, sans markdown ni commentaire.`,
    "",
    "Structure attendue :",
    JSON.stringify(
      {
        format: BEWORK_PPSPS_FORMAT,
        import_id: "import_unique_stable",
        ppsps: {
          title: "PPSPS",
          project: {},
          company: {},
          participants: [],
          work_description: [],
          work_phases: [],
          equipment: [],
          risks: [
            {
              activity: "",
              hazard: "",
              persons_exposed: "",
              prevention: "",
              category: "",
            },
          ],
          ppe: [],
          site_organization: {},
          emergency: {},
          coactivity: [],
          environment: [],
          additional_notes: [],
        },
      },
      null,
      2,
    ),
    "",
    "DONNÉES BEWORK :",
    JSON.stringify(data, null, 2),
  ].join("\n");
}
