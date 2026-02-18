import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const { email, password, name, role = "CLIENT" } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, mot de passe et nom sont requis." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role === "AGENCE" ? UserRole.AGENCE : UserRole.CLIENT,
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (error) {
    console.error("Erreur inscription:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription." },
      { status: 500 }
    );
  }
}
