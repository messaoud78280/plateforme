/**
 * Timeline de simulation BelleVie - 30 jours
 * Événements à exécuter par jour pour simuler le projet Community Management
 */

export interface SimulationEvent {
  type: "message" | "task" | "activity" | "metric" | "invoice";
  time: string; // HH:mm
  data: Record<string, unknown>;
}

export interface DayEvents {
  day: number;
  date: string; // ISO date
  label: string;
  events: SimulationEvent[];
}

/** Base : 24 février 2026 */
const BASE_DATE = new Date("2026-02-24");

export function getSimulationDate(day: number): Date {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() + day);
  return d;
}

export function getSimulationDateISO(day: number): string {
  return getSimulationDate(day).toISOString().split("T")[0];
}

/** Timeline des événements par jour (jours 0 à 12 pour MVP) */
export const SIMULATION_TIMELINE: DayEvents[] = [
  {
    day: 0,
    date: "2026-02-24",
    label: "Début de mission",
    events: [
      {
        type: "message",
        time: "09:00",
        data: {
          from: "manager",
          to: "client",
          content:
            "Bonjour Sophie,\n\nAmina Benali est votre agent dédiée pour ce projet. Elle prend en main les accès aujourd'hui et commencera la publication dès demain.\n\nCordialement,\nLaure Olivie",
        },
      },
      {
        type: "task",
        time: "09:15",
        data: {
          title: "Traitement emails clients J1",
          status: "EN_COURS",
          assignedTo: "agent",
        },
      },
      {
        type: "activity",
        time: "12:00",
        data: {
          type: "MESSAGE_SENT",
          title: "Présentation agent - Sophie",
          detail: "Laure a présenté Amina à la cliente",
        },
      },
      {
        type: "metric",
        time: "18:00",
        data: {
          metricType: "social_media",
          metricData: {
            platform: "instagram",
            posts: 2,
            likes: 86,
            engagement: "4.2%",
          },
        },
      },
    ],
  },
  {
    day: 1,
    date: "2026-02-25",
    label: "J2 - Routine",
    events: [
      {
        type: "task",
        time: "09:00",
        data: {
          title: "Traitement emails clients J2",
          status: "EN_COURS",
          assignedTo: "agent",
        },
      },
      {
        type: "metric",
        time: "18:00",
        data: {
          metricType: "support_emails",
          metricData: { treated: 42, avgResponse: "120 min" },
        },
      },
    ],
  },
  {
    day: 2,
    date: "2026-02-26",
    label: "J3 - Avancement",
    events: [
      {
        type: "message",
        time: "17:30",
        data: {
          from: "client",
          to: "manager",
          content:
            "Bonjour Laure,\n\nLes premiers posts sont très bien ! Merci à Amina pour sa réactivité.\n\nSophie",
        },
      },
      {
        type: "task",
        time: "18:00",
        data: {
          title: "Prise en main des accès BelleVie",
          status: "COMPLETE",
          assignedTo: "agent",
        },
      },
    ],
  },
  {
    day: 5,
    date: "2026-03-01",
    label: "Fin semaine 1",
    events: [
      {
        type: "message",
        time: "16:00",
        data: {
          from: "agent",
          to: "client",
          content:
            "Bonjour Sophie,\n\nRapport hebdo S1 : 94 emails traités, 10 posts publiés, +87 followers Instagram. Engagement en hausse de 42%.\n\nBonne fin de semaine !\nAmina",
        },
      },
      {
        type: "invoice",
        time: "17:00",
        data: {
          invoiceNumber: "INV-2026-02-001",
          amount: 850,
          status: "SENT",
        },
      },
    ],
  },
  {
    day: 8,
    date: "2026-03-04",
    label: "Semaine 2 - Routine",
    events: [
      {
        type: "metric",
        time: "18:00",
        data: {
          metricType: "social_media",
          metricData: {
            platform: "instagram",
            posts: 6,
            followers: "+120",
            engagement: "5.1%",
          },
        },
      },
    ],
  },
];
