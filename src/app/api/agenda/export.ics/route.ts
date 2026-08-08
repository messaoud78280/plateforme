import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { agendaEventAccessWhere } from "@/lib/agenda/access";
import { prisma } from "@/lib/prisma";

function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function toIcsDate(d: Date, allDay: boolean): string {
  if (allDay) {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}${m}${day}`;
  }
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** GET /api/agenda/export.ics — export ICS pour sync future Google/Outlook/Apple */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new NextResponse("Non authentifié", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(365, Math.max(7, Number(searchParams.get("days") ?? 90) || 90));
  const from = new Date();
  from.setDate(from.getDate() - 7);
  const to = new Date();
  to.setDate(to.getDate() + days);

  const accessWhere = await agendaEventAccessWhere(session.user);
  const events = await prisma.agendaEvent.findMany({
    where: {
      AND: [accessWhere, { startAt: { lte: to }, endAt: { gte: from } }],
    },
    include: { project: { select: { title: true } } },
    orderBy: { startAt: "asc" },
    take: 1000,
  });

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BeWork//Agenda//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:BeWork Agenda",
  ];

  for (const ev of events) {
    const uid = `${ev.externalUid || ev.id}@bework.fr`;
    const stamp = toIcsDate(new Date(), false);
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${stamp}`);
    if (ev.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${toIcsDate(ev.startAt, true)}`);
      const endDay = new Date(ev.endAt);
      endDay.setUTCDate(endDay.getUTCDate() + 1);
      lines.push(`DTEND;VALUE=DATE:${toIcsDate(endDay, true)}`);
    } else {
      lines.push(`DTSTART:${toIcsDate(ev.startAt, false)}`);
      lines.push(`DTEND:${toIcsDate(ev.endAt, false)}`);
    }
    lines.push(`SUMMARY:${icsEscape(ev.title)}`);
    if (ev.description) lines.push(`DESCRIPTION:${icsEscape(ev.description)}`);
    if (ev.location) lines.push(`LOCATION:${icsEscape(ev.location)}`);
    if (ev.project?.title) lines.push(`CATEGORIES:${icsEscape(ev.project.title)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  const body = `${lines.join("\r\n")}\r\n`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="bework-agenda.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
