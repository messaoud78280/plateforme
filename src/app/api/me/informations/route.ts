import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function str(val: unknown): string | null {
  if (typeof val !== "string") return null;
  const t = val.trim();
  return t === "" ? null : t;
}

/** PATCH /api/me/informations – Mettre à jour les informations personnelles */
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data: {
      civilite?: string | null;
      name?: string;
      phone?: string | null;
      billingAddressLine1?: string | null;
      billingAddressLine2?: string | null;
      billingCity?: string | null;
      billingPostalCode?: string | null;
      billingCountry?: string | null;
    } = {};

    if (Object.prototype.hasOwnProperty.call(body, "civilite")) data.civilite = str(body.civilite);
    if (Object.prototype.hasOwnProperty.call(body, "name")) {
      const name = str(body.name);
      if (name && name.length >= 2) data.name = name;
    }
    if (Object.prototype.hasOwnProperty.call(body, "phone")) data.phone = str(body.phone);
    if (Object.prototype.hasOwnProperty.call(body, "billingAddressLine1"))
      data.billingAddressLine1 = str(body.billingAddressLine1);
    if (Object.prototype.hasOwnProperty.call(body, "billingAddressLine2"))
      data.billingAddressLine2 = str(body.billingAddressLine2);
    if (Object.prototype.hasOwnProperty.call(body, "billingCity"))
      data.billingCity = str(body.billingCity);
    if (Object.prototype.hasOwnProperty.call(body, "billingPostalCode"))
      data.billingPostalCode = str(body.billingPostalCode);
    if (Object.prototype.hasOwnProperty.call(body, "billingCountry"))
      data.billingCountry = str(body.billingCountry);

    await prisma.user.update({
      where: { id: session.user.id },
      data,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des informations" },
      { status: 500 }
    );
  }
}
