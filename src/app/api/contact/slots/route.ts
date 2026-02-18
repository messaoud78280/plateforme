import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/contact/slots — Créneaux déjà pris (date + heure) pour le formulaire public */
export async function GET() {
  try {
    const taken = await prisma.contactRequest.findMany({
      where: {
        rdvDate: { not: null },
        rdvTime: { not: null },
        status: { not: "ANNULE" },
      },
      select: { rdvDate: true, rdvTime: true },
    });

    const slots = taken
      .filter((r) => r.rdvDate != null && r.rdvTime != null)
      .map((r) => ({
        date: (r.rdvDate as Date).toISOString().slice(0, 10),
        time: r.rdvTime as string,
      }));

    return NextResponse.json({ slots });
  } catch (e) {
    console.error("Contact slots error:", e);
    return NextResponse.json({ slots: [] });
  }
}
