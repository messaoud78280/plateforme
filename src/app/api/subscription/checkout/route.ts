import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlan, PLAN_KEYS, type PlanKey } from "@/lib/subscription-plans";

const VALID_PLANS: PlanKey[] = PLAN_KEYS;

/**
 * POST /api/subscription/checkout
 * Crée un paiement PENDING et une souscription PENDING pour le plan choisi.
 * Vérifie que le contrat est accepté.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: { planKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const planKey = body.planKey as string;
  if (!planKey || !VALID_PLANS.includes(planKey as PlanKey)) {
    return NextResponse.json(
      { error: "Formule invalide. Choisissez Structure, Suivi ou Pilotage." },
      { status: 400 }
    );
  }

  const plan = getPlan(planKey);
  if (!plan) {
    return NextResponse.json({ error: "Formule introuvable" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, contractStatus: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
  }
  if (user.contractStatus !== "SIGNED") {
    return NextResponse.json(
      { error: "Vous devez accepter le contrat avant de payer.", requireContract: true },
      { status: 403 }
    );
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      planKey,
      status: "PENDING",
      startedAt: new Date(),
    },
  });

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      subscriptionId: subscription.id,
      planKey,
      amount: plan.priceCents / 100,
      currency: "EUR",
      status: "PENDING",
      actionsCredited: 0,
    },
  });

  return NextResponse.json({
    paymentId: payment.id,
    subscriptionId: subscription.id,
    plan: {
      planKey: plan.planKey,
      name: plan.name,
      price: plan.priceCents / 100,
      priceLabel: plan.priceLabel,
      billing: plan.billing,
      actionsIncluded: plan.actionsIncluded,
      actionsLabel: plan.actionsLabel,
    },
    amount: plan.priceCents / 100,
    currency: "EUR",
  });
}
