import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlan } from "@/lib/subscription-plans";
import { creditActionsAfterPayment } from "@/lib/subscription-credit";

/**
 * POST /api/payment/confirm
 * Confirme un paiement (après succès Stripe ou simulation).
 * Marque le paiement PAID, crédite le compte (crédits), met à jour User et Subscription.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { paymentId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const paymentId = body.paymentId as string;
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId requis" }, { status: 400 });
  }

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, userId: session.user.id },
    include: { subscription: true },
  });

  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  }
  if (payment.status === "PAID") {
    return NextResponse.json({
      success: true,
      alreadyPaid: true,
      message: "Paiement déjà enregistré.",
    });
  }
  if (payment.status !== "PENDING") {
    return NextResponse.json(
      { error: "Ce paiement ne peut pas être confirmé." },
      { status: 400 }
    );
  }

  const result = await creditActionsAfterPayment(
    session.user.id,
    payment.planKey,
    payment.id,
    payment.subscriptionId ?? null
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error ?? "Erreur lors du crédit" },
      { status: 500 }
    );
  }

  const plan = getPlan(payment.planKey);
  const actionsCredited = plan?.actionsIncluded ?? 0;

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      actionsCredited,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    paymentId: payment.id,
    actionsCredited,
    message: "Paiement enregistré. Votre compte a été crédité.",
  });
}
