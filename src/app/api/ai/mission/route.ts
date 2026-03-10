import { NextRequest, NextResponse } from "next/server";
import { analyzeMissionFromText } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json(
        { error: "Le texte à analyser est requis." },
        { status: 400 }
      );
    }

    const suggestion = await analyzeMissionFromText(text);
    return NextResponse.json(suggestion);
  } catch (e) {
    const err = e as { message?: string };
    console.error("Erreur analyse mission IA:", err);
    const msg = err?.message ?? "Erreur interne IA.";
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? msg
            : "L'assistance IA est momentanément indisponible. Vous pouvez remplir le formulaire manuellement.",
      },
      { status: 500 }
    );
  }
}

