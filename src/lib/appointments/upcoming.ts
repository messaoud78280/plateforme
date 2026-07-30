import type { AppointmentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isBeworkStaff } from "@/lib/authz";

export type UpcomingAppointmentRow = {
  id: string;
  title: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  clientName: string | null;
  clientEmail: string | null;
  project: { id: string; title: string } | null;
};

function appointmentVisibilityWhere(user: {
  id: string;
  role?: string | null;
  email?: string | null;
}): Prisma.AppointmentWhereInput {
  if (isBeworkStaff(user)) {
    return { status: { not: "ANNULE" } };
  }
  return {
    status: { not: "ANNULE" },
    OR: [
      { clientId: user.id },
      ...(user.email ? [{ clientEmail: user.email }] : []),
    ],
  };
}

/** Prochains RDV confirmés / à venir (hors annulés), pour bandeaux et page RDV. */
export async function listUpcomingAppointments(
  user: { id: string; role?: string | null; email?: string | null },
  options?: { take?: number; from?: Date },
): Promise<UpcomingAppointmentRow[]> {
  const from = options?.from ?? new Date();
  const take = options?.take ?? 8;

  try {
    return await prisma.appointment.findMany({
      where: {
        AND: [
          appointmentVisibilityWhere(user),
          { startAt: { gte: from }, status: "CONFIRME" },
        ],
      },
      select: {
        id: true,
        title: true,
        startAt: true,
        endAt: true,
        status: true,
        clientName: true,
        clientEmail: true,
        project: { select: { id: true, title: true } },
      },
      orderBy: { startAt: "asc" },
      take,
    });
  } catch {
    return [];
  }
}

export function formatAppointmentSlot(startAt: Date, endAt?: Date | null): string {
  const day = startAt.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const start = startAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  if (!endAt) return `${day} · ${start}`;
  const end = endAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${day} · ${start}–${end}`;
}
