import { NextResponse } from "next/server";
import { approveClientAccount, verifyClientApprovalToken } from "@/lib/client-account-approval";
import { publicAppOriginForEmails } from "@/lib/site";

/**
 * GET /api/clients/approve-by-token?token=...
 * Lien d’approbation envoyé par email à l’équipe BeWork (sans connexion requise).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = (url.searchParams.get("token") ?? "").trim();
  // Redirections post-validation vers le domaine public (pas localhost même si l’URL d’appel l’était).
  const baseUrl = publicAppOriginForEmails(url.origin);

  if (!token) {
    return NextResponse.redirect(new URL("/dashboard/clients?approve=invalid", baseUrl));
  }

  let userId: string;
  try {
    const verified = verifyClientApprovalToken(token);
    if ("error" in verified) {
      return NextResponse.redirect(
        new URL(`/dashboard/clients?approve=error&message=${encodeURIComponent(verified.error)}`, baseUrl)
      );
    }
    userId = verified.userId;
  } catch {
    return NextResponse.redirect(new URL("/dashboard/clients?approve=invalid", baseUrl));
  }

  const result = await approveClientAccount(userId, null, { baseUrl });
  if (!result.ok) {
    return NextResponse.redirect(
      new URL(
        `/dashboard/clients?approve=error&message=${encodeURIComponent(result.error)}`,
        baseUrl
      )
    );
  }

  return NextResponse.redirect(
    new URL(`/dashboard/clients?approve=success&email=${encodeURIComponent(result.email)}`, baseUrl)
  );
}
