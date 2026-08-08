import type { FollowUpSheet, FollowUpSheetStatus } from "@prisma/client";
import { createNotification } from "@/lib/notifications";
import { getFollowUpSettings } from "@/lib/follow-up/settings";
import { appendFollowUpTimeline } from "@/lib/follow-up/timeline";
import { computeUrgencyFromDue, urgencyRank } from "@/lib/follow-up/urgency";
import type { AlertRuleConfig, UrgencyLevel } from "@/lib/follow-up/types";
import { URGENCY_LABELS } from "@/lib/follow-up/types";
import { prisma } from "@/lib/prisma";

const STALE_HOURS = 20;

type SheetRow = FollowUpSheet & {
  agendaEvents?: { id: string; type: string; status: string; startAt: Date }[];
};

function hoursSince(d: Date, now: Date) {
  return (now.getTime() - d.getTime()) / (1000 * 60 * 60);
}

function hoursUntil(d: Date, now: Date) {
  return (d.getTime() - now.getTime()) / (1000 * 60 * 60);
}

async function recentlyNotified(actionUrl: string, type: string, since: Date) {
  const n = await prisma.notification.findFirst({
    where: { type, actionUrl, createdAt: { gte: since } },
    select: { id: true },
  });
  return Boolean(n);
}

async function notifySheet(params: {
  sheet: SheetRow;
  title: string;
  message: string;
  urgency: UrgencyLevel;
  rule: AlertRuleConfig;
  escalateOwner: boolean;
}) {
  const actionUrl = `/dashboard/fiches-suivi/${params.sheet.id}`;
  const type =
    urgencyRank(params.urgency) >= urgencyRank("CRITIQUE")
      ? "FOLLOWUP_CRITICAL"
      : urgencyRank(params.urgency) >= urgencyRank("URGENT")
        ? "FOLLOWUP_URGENT"
        : "FOLLOWUP_REMINDER";

  const since = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);
  if (await recentlyNotified(actionUrl, type, since)) return false;

  const targets = new Set<string>();
  if (params.rule.notifyAssignee && params.sheet.assigneeId) {
    targets.add(params.sheet.assigneeId);
  }
  if (params.rule.notifyOwner || params.escalateOwner) {
    targets.add(params.sheet.ownerUserId);
  }
  if (targets.size === 0) {
    targets.add(params.sheet.ownerUserId);
  }

  for (const userId of targets) {
    await createNotification({
      userId,
      type,
      title: params.title,
      message: params.message,
      actionUrl,
    });
  }

  await appendFollowUpTimeline({
    sheetId: params.sheet.id,
    kind: "alerte",
    label: `Alerte ${URGENCY_LABELS[params.urgency]}`,
    detail: params.message,
  });

  return true;
}

function hasAgendaType(sheet: SheetRow, types: string[]) {
  return (sheet.agendaEvents ?? []).some((e) => types.includes(e.type) && e.status !== "ANNULE");
}

function nextIntervention(sheet: SheetRow) {
  const now = Date.now();
  return (sheet.agendaEvents ?? [])
    .filter((e) => e.type === "INTERVENTION" && e.status !== "ANNULE" && e.startAt.getTime() >= now - 3600000)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0];
}

function pendingDeliveries(sheet: SheetRow) {
  return (sheet.agendaEvents ?? []).filter(
    (e) => e.type === "LIVRAISON" && e.status !== "ANNULE" && e.status !== "TERMINE",
  );
}

function nextDelivery(sheet: SheetRow) {
  const now = Date.now();
  return pendingDeliveries(sheet)
    .filter((e) => e.startAt.getTime() >= now - 3600000)
    .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0];
}

function evaluateBusinessRules(sheet: SheetRow, rules: AlertRuleConfig[], now: Date) {
  const hits: { rule: AlertRuleConfig; title: string; message: string }[] = [];
  const site = sheet.title;
  const byId = (id: string) => rules.find((r) => r.id === id && r.enabled);

  const osRule = byId("os_sans_intervention");
  if (osRule && (sheet.osNumber || sheet.orderNumber) && sheet.receivedAt) {
    if (hoursSince(sheet.receivedAt, now) >= osRule.delayHours && !hasAgendaType(sheet, ["INTERVENTION"])) {
      hits.push({
        rule: osRule,
        title: `${site} — intervention non programmée`,
        message: `OS / commande reçu depuis plus de ${osRule.delayHours} h sans intervention planifiée.`,
      });
    }
  }

  const cmdRule = byId("intervention_sans_commande");
  const intervention = nextIntervention(sheet);
  if (cmdRule && intervention) {
    const h = hoursUntil(intervention.startAt, now);
    if (h >= 0 && h <= cmdRule.delayHours) {
      const hasOrderEvent = hasAgendaType(sheet, ["COMMANDE"]);
      const orderDone = ["COMMANDE_PASSEE", "ATTENTE_FOURNISSEUR", "EN_COURS"].includes(
        sheet.status as FollowUpSheetStatus,
      );
      if (!hasOrderEvent && !orderDone) {
        hits.push({
          rule: cmdRule,
          title: `${site} — commande fournisseur manquante`,
          message: `Intervention dans ${Math.max(1, Math.round(h))} h sans commande fournisseur enregistrée.`,
        });
      }
    }
  }

  const livRule = byId("livraison_non_confirmee");
  const delivery = nextDelivery(sheet);
  if (livRule && delivery) {
    const h = hoursUntil(delivery.startAt, now);
    if (h >= 0 && h <= livRule.delayHours && delivery.status !== "CONFIRME" && delivery.status !== "TERMINE") {
      hits.push({
        rule: livRule,
        title: `${site} — livraison non confirmée`,
        message: `Livraison prévue sous ${Math.max(1, Math.round(h))} h, non confirmée.`,
      });
    }
  }

  // Livraison passée non reçue (complète processDeliveryAlerts côté agenda)
  if (livRule) {
    const overdue = pendingDeliveries(sheet)
      .filter((e) => e.startAt < now && e.status !== "TERMINE")
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())[0];
    if (overdue && hoursSince(overdue.startAt, now) >= 1.5) {
      const late = hoursSince(overdue.startAt, now);
      hits.push({
        rule: {
          ...livRule,
          urgency: late >= 4 ? "CRITIQUE" : "URGENT",
        },
        title: `${site} — livraison à vérifier`,
        message:
          late >= 4
            ? `Livraison non confirmée depuis ${Math.round(late)} h.`
            : `Livraison prévue non marquée reçue (${Math.round(late)} h).`,
      });
    }
  }

  const avRule = byId("avenant_sans_reponse");
  if (avRule && sheet.status === "AVENANT" && sheet.updatedAt) {
    if (hoursSince(sheet.updatedAt, now) >= avRule.delayHours) {
      hits.push({
        rule: avRule,
        title: `${site} — avenant sans réponse`,
        message: `Avenant en attente depuis plus de ${Math.round(avRule.delayHours / 24)} jours.`,
      });
    }
  }

  const factRule = byId("travaux_sans_facturation");
  if (
    factRule &&
    (sheet.status === "TRAVAUX_TERMINES" || sheet.status === "CR_A_RECUPERER") &&
    hoursSince(sheet.updatedAt, now) >= factRule.delayHours
  ) {
    hits.push({
      rule: factRule,
      title: `${site} — à facturer`,
      message: `Travaux terminés depuis plus de ${Math.round(factRule.delayHours / 24)} j sans facturation.`,
    });
  }

  const payRule = byId("facture_echeance");
  if (payRule && sheet.status === "ATTENTE_REGLEMENT") {
    hits.push({
      rule: payRule,
      title: `${site} — règlement en attente`,
      message: "Facture arrivée à échéance / non réglée.",
    });
  }

  const actRule = byId("action_depassee");
  if (
    actRule &&
    sheet.nextAction &&
    !sheet.nextActionDone &&
    sheet.nextActionAt &&
    sheet.nextActionAt < now
  ) {
    hits.push({
      rule: actRule,
      title: `${site} — action dépassée`,
      message: `« ${sheet.nextAction} » — échéance dépassée.`,
    });
  }

  const reportRule = byId("trop_de_reports");
  if (reportRule && sheet.postponeCount >= Math.max(1, reportRule.delayHours)) {
    hits.push({
      rule: reportRule,
      title: `${site} — trop de reports`,
      message: `Action reportée ${sheet.postponeCount} fois. Risque d’oubli / retard — à traiter.`,
    });
  }

  const docRule = byId("document_manquant");
  if (
    docRule &&
    ["NOUVEAU", "A_ANALYSER", "A_PLANIFIER"].includes(sheet.status) &&
    sheet.receivedAt &&
    hoursSince(sheet.receivedAt, now) >= docRule.delayHours
  ) {
    const notes = (sheet.notes ?? "").toLowerCase();
    const hasDocFlag =
      notes.includes("#ok") ||
      notes.includes("pièce reçue") ||
      notes.includes("document reçu") ||
      notes.includes("plans reçus");
    if (!hasDocFlag) {
      hits.push({
        rule: docRule,
        title: `${site} — document à vérifier`,
        message:
          "Dossier récent sans confirmation de pièce reçue (plans, OS, attestation…). Ajoutez « pièce reçue » dans les notes ou #ok pour lever l’alerte.",
      });
    }
  }

  return hits;
}

/** Rappels horaires multiples + règles métier + escalation dirigeant. */
export async function processFollowUpAlerts(now = new Date()): Promise<{ notified: number }> {
  let notified = 0;

  const sheets = await prisma.followUpSheet.findMany({
    where: {
      status: { notIn: ["TERMINE", "ARCHIVE"] },
    },
    include: {
      agendaEvents: {
        where: { status: { not: "ANNULE" } },
        select: { id: true, type: true, status: true, startAt: true },
      },
    },
    take: 400,
    orderBy: { updatedAt: "desc" },
  });

  const settingsCache = new Map<string, Awaited<ReturnType<typeof getFollowUpSettings>>>();

  for (const sheet of sheets) {
    let settings = settingsCache.get(sheet.ownerUserId);
    if (!settings) {
      settings = await getFollowUpSettings(sheet.ownerUserId);
      settingsCache.set(sheet.ownerUserId, settings);
    }

    const urgency = computeUrgencyFromDue(sheet.nextActionAt, {
      now,
      nextActionDone: sheet.nextActionDone,
      override: sheet.urgencyOverride,
      thresholds: settings.thresholds,
    });

    // Rappels multiples avant échéance
    if (sheet.nextAction && !sheet.nextActionDone && sheet.nextActionAt && sheet.nextActionAt > now) {
      const offsets = Array.isArray(sheet.reminderOffsets)
        ? (sheet.reminderOffsets as number[])
        : [168, 72, 24, 2];
      const hoursLeft = hoursUntil(sheet.nextActionAt, now);
      for (const offset of offsets) {
        if (hoursLeft <= offset && hoursLeft > offset - 1.5) {
          const ok = await notifySheet({
            sheet,
            title: `${sheet.title} — rappel`,
            message: `« ${sheet.nextAction} » dans ${Math.max(1, Math.round(hoursLeft))} h (${URGENCY_LABELS[urgency]}).`,
            urgency,
            rule: {
              id: "action_depassee",
              label: "Rappel",
              description: "",
              enabled: true,
              delayHours: offset,
              urgency,
              notifyAssignee: true,
              notifyOwner: false,
            },
            escalateOwner: false,
          });
          if (ok) notified += 1;
          break;
        }
      }
    }

    const hits = evaluateBusinessRules(sheet, settings.rules, now);
    for (const hit of hits) {
      const overdueHours =
        sheet.nextActionAt && sheet.nextActionAt < now ? hoursSince(sheet.nextActionAt, now) : 0;
      const escalateOwner =
        overdueHours >= settings.escalate.escalateToOwnerAfterHours ||
        (urgencyRank(hit.rule.urgency) >= urgencyRank("URGENT") &&
          settings.escalate.notifyOwnerOnUrgent) ||
        (urgencyRank(hit.rule.urgency) >= urgencyRank("CRITIQUE") &&
          settings.escalate.notifyOwnerOnCritical);

      const ok = await notifySheet({
        sheet,
        title: hit.title,
        message: hit.message,
        urgency: hit.rule.urgency,
        rule: hit.rule,
        escalateOwner,
      });
      if (ok) notified += 1;
    }

    // Escalade dirigeant si retard important
    if (
      sheet.nextAction &&
      !sheet.nextActionDone &&
      sheet.nextActionAt &&
      sheet.nextActionAt < now
    ) {
      const overdue = hoursSince(sheet.nextActionAt, now);
      if (overdue >= settings.escalate.escalateCriticalAfterHours) {
        const ok = await notifySheet({
          sheet,
          title: `${sheet.title} — retard critique`,
          message: `Action « ${sheet.nextAction} » en retard de ${Math.round(overdue)} h.`,
          urgency: "CRITIQUE",
          rule: {
            id: "action_depassee",
            label: "Escalade",
            description: "",
            enabled: true,
            delayHours: 0,
            urgency: "CRITIQUE",
            notifyAssignee: true,
            notifyOwner: true,
          },
          escalateOwner: true,
        });
        if (ok) notified += 1;
      }
    }
  }

  return { notified };
}
