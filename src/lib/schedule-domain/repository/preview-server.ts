/**
 * Preview serveur V2 — charge le SourceContext BDD puis previewAiSchedule.
 */
import { previewAiSchedule, type PreviewAiScheduleResult } from "../preview";
import { loadSourceContextFromDb } from "./load-source-context";

export async function previewScheduleV2(input: {
  orgId: string;
  projectId: string;
  studyId?: string | null;
  raw: unknown;
  /** Si fourni et divergent → SOURCE_STALE (client a un fingerprint obsolète). */
  expectedSourceFingerprint?: string | null;
}): Promise<
  | (Extract<PreviewAiScheduleResult, { ok: true }> & {
      studyId: string;
    })
  | (Extract<PreviewAiScheduleResult, { ok: false }> & {
      code?: string;
      status?: number;
      studyId?: string;
    })
> {
  const loaded = await loadSourceContextFromDb({
    orgId: input.orgId,
    projectId: input.projectId,
    studyId: input.studyId,
  });

  if (
    input.expectedSourceFingerprint &&
    input.expectedSourceFingerprint !== loaded.sourceContext.takeoffFingerprint
  ) {
    return {
      ok: false,
      code: "SOURCE_STALE",
      status: 409,
      studyId: loaded.studyId,
      issues: [
        {
          code: "SOURCE_STALE",
          path: "sourceFingerprint",
          value: input.expectedSourceFingerprint,
          message: "Les sources du chantier ont changé.",
          severity: "ERROR",
        },
      ],
      stats: { inputActivities: 0 },
    };
  }

  let raw: unknown = input.raw;
  if (typeof raw === "string") {
    const rawStr = raw;
    try {
      raw = JSON.parse(rawStr);
    } catch {
      const t = rawStr.trim();
      const start = t.indexOf("{");
      const end = t.lastIndexOf("}");
      if (start >= 0 && end > start) {
        try {
          raw = JSON.parse(t.slice(start, end + 1));
        } catch {
          return {
            ok: false,
            studyId: loaded.studyId,
            issues: [
              {
                code: "PARSE_ERROR",
                path: "",
                value: null,
                message: "JSON illisible",
                severity: "ERROR",
              },
            ],
            stats: { inputActivities: 0 },
          };
        }
      } else {
        return {
          ok: false,
          studyId: loaded.studyId,
          issues: [
            {
              code: "PARSE_ERROR",
              path: "",
              value: null,
              message: "JSON illisible",
              severity: "ERROR",
            },
          ],
          stats: { inputActivities: 0 },
        };
      }
    }
  }

  const preview = previewAiSchedule({
    raw,
    sourceContext: loaded.sourceContext,
    calendar: {
      workingDays: [1, 2, 3, 4, 5],
      holidays: "FR_METROPOLE",
      granularityDays: 0.5,
      startDate: null,
    },
  });

  if (!preview.ok) {
    return { ...preview, studyId: loaded.studyId };
  }
  return { ...preview, studyId: loaded.studyId };
}
