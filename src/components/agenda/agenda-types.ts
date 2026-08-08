export type AgendaEventDTO = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  type: string;
  status: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
  projectId: string | null;
  responsibleId: string | null;
  reminderMinutes: number | null;
  recurrence: string | null;
  /** Présent si l’item vient d’une tâche / jalon / RDV (non éditable dans l’agenda). */
  readOnly?: boolean;
  source?: "agenda" | "task" | "project_start" | "project_end" | "appointment";
  href?: string | null;
  project: { id: string; title: string; siteCity: string | null; siteAddress: string | null } | null;
  responsible: { id: string; name: string; email: string } | null;
  createdBy: { id: string; name: string; email: string };
  attendees: { id: string; status: string; user: { id: string; name: string; email: string } }[];
};

export type AgendaProjectOption = { id: string; title: string };
export type AgendaUserOption = { id: string; name: string; email: string };
export type AgendaView = "day" | "week" | "month" | "year";

export type AgendaQuickCreateDraft = {
  startAt: string;
  endAt: string;
  allDay?: boolean;
};
