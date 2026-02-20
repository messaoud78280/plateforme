import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SLOT_DURATION_MIN = 30;
const SLOTS_START = 9;
const SLOTS_END = 18;

function generateSlotsForDate(date: Date): string[] {
  const slots: string[] = [];
  const d = new Date(date);
  d.setHours(SLOTS_START, 0, 0, 0);
  const end = new Date(date);
  end.setHours(SLOTS_END, 0, 0, 0);

  while (d < end) {
    slots.push(d.toTimeString().slice(0, 5));
    d.setMinutes(d.getMinutes() + SLOT_DURATION_MIN);
  }
  return slots;
}

/** GET /api/appointments/slots?date=YYYY-MM-DD */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get("date");

  if (!dateStr) {
    return NextResponse.json({ error: "Paramètre date requis (YYYY-MM-DD)" }, { status: 400 });
  }

  const date = new Date(dateStr + "T00:00:00.000Z");
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  }

  const dayStart = new Date(date);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setUTCHours(23, 59, 59, 999);

  try {
    const taken = await prisma.appointment.findMany({
      where: {
        status: { not: "ANNULE" },
        startAt: { gte: dayStart },
        endAt: { lte: dayEnd },
      },
      select: { startAt: true },
    });

    const takenTimes = new Set(
      taken.map((t) => t.startAt.toISOString().slice(11, 16))
    );

    const contactTaken = await prisma.contactRequest.findMany({
      where: {
        rdvDate: date,
        rdvTime: { not: null },
        status: { not: "ANNULE" },
      },
      select: { rdvTime: true },
    });
    contactTaken.forEach((r) => { if (r.rdvTime) takenTimes.add(r.rdvTime); });

    const allSlots = generateSlotsForDate(date);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const available = allSlots.filter((slot) => {
      if (takenTimes.has(slot)) return false;
      if (isToday) {
        const [h, m] = slot.split(":").map(Number);
        const slotTime = new Date(now);
        slotTime.setHours(h, m, 0, 0);
        if (slotTime <= now) return false;
      }
      return true;
    });

    return NextResponse.json({ date: dateStr, slots: available });
  } catch (error) {
    console.error("Erreur slots:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des créneaux." },
      { status: 500 }
    );
  }
}
