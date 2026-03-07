import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

async function wrappedHandler(
  req: Request,
  context: { params: Promise<{ nextauth: string[] }> }
): Promise<Response> {
  try {
    return await (handler as (req: Request, ctx: unknown) => Promise<Response>)(req, context);
  } catch (err) {
    console.error("[NextAuth]", err);
    return new Response(
      JSON.stringify({ error: "Erreur d'authentification. Vérifiez NEXTAUTH_SECRET et DATABASE_URL." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export { wrappedHandler as GET, wrappedHandler as POST };
