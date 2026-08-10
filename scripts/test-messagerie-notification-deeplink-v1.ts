/**
 * Tests MESSAGERIE — resolve conversation + notification deep-link.
 * Run: npx tsx scripts/test-messagerie-notification-deeplink-v1.ts
 */
import {
  projectClientHref,
  projectSupplierHref,
  projectTeamHref,
  resolveConversationForContext,
  resolveConversationHref,
  resolveDirectPeerUserId,
  resolveMessageNotificationHref,
} from "../src/lib/messagerie/resolve-conversation";

let failed = 0;

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

const denis = "user-denis";
const julie = "user-julie";
const pid = "proj-vh";
const channelPointP = "ch-pointp";

// --- Peer Direct ---
assert(
  resolveDirectPeerUserId({
    senderId: julie,
    receiverId: denis,
    currentUserId: denis,
  }) === julie,
  "Julie → Denis : peer pour Denis = Julie",
);

assert(
  resolveDirectPeerUserId({
    senderId: denis,
    receiverId: julie,
    currentUserId: julie,
  }) === denis,
  "Denis → Julie : peer pour Julie = Denis",
);

assert(
  resolveDirectPeerUserId({
    senderId: julie,
    receiverId: denis,
    currentUserId: julie,
  }) === denis,
  "Julie (expéditrice) : peer = Denis",
);

assert(
  resolveDirectPeerUserId({
    senderId: denis,
    receiverId: denis,
    currentUserId: denis,
  }) === null,
  "self-message → null (pas soi-même)",
);

// --- Notification Direct ---
const notifJulieToDenis = resolveMessageNotificationHref({
  sourceType: "DIRECT",
  senderId: julie,
  receiverId: denis,
  notifyUserId: denis,
  messageId: "dm-1",
});
assert(
  notifJulieToDenis === `/dashboard/messagerie?with=${julie}&messageId=dm-1`,
  "notif Denis : ?with=Julie (+ messageId)",
);
assert(!notifJulieToDenis.includes("tab=messages-directs"), "plus de tab générique");
assert(!notifJulieToDenis.includes("task="), "pas de task parasite");

const notifDenisToJulie = resolveMessageNotificationHref({
  sourceType: "DIRECT",
  senderId: denis,
  receiverId: julie,
  notifyUserId: julie,
});
assert(
  notifDenisToJulie === `/dashboard/messagerie?with=${denis}`,
  "notif Julie : ?with=Denis",
);

assert(
  resolveMessageNotificationHref({
    sourceType: "DIRECT",
    senderId: denis,
    receiverId: denis,
    notifyUserId: denis,
  }) === "/dashboard/messagerie",
  "source inaccessible → inbox (pas d’autre fil)",
);

// --- Task ---
const taskHref = resolveMessageNotificationHref({
  sourceType: "TASK",
  taskId: "task-relance",
  messageId: "tm-1",
});
assert(
  taskHref === "/dashboard/messagerie?task=task-relance&messageId=tm-1",
  "TaskMessage → ?task=",
);

// --- Project channel ---
const channelHref = resolveMessageNotificationHref({
  sourceType: "PROJECT_CHANNEL",
  projectId: pid,
  channelId: channelPointP,
});
assert(
  channelHref ===
    `/dashboard/messagerie?view=chantiers&project=${pid}&channelId=${channelPointP}`,
  "Point.P → channelId exact",
);

assert(
  resolveMessageNotificationHref({
    sourceType: "PROJECT_CHANNEL",
    projectId: "",
    channelId: channelPointP,
  }) === "/dashboard/messagerie",
  "channel incomplet → inbox",
);

// --- Compat resolveConversationHref ---
assert(
  resolveConversationHref({ kind: "direct", userId: julie }).includes(`with=${julie}`),
  "direct href = ?with=",
);
assert(
  resolveConversationHref({ kind: "task", taskId: "t1", messageId: "m1" }).includes("task=t1"),
  "mission + messageId",
);

assert(
  projectTeamHref(pid) ===
    "/dashboard/messagerie?view=chantiers&project=proj-vh&channel=INTERNE",
  "équipe → canal INTERNE",
);
assert(
  projectClientHref(pid).includes("channel=CLIENT"),
  "client → CLIENT",
);
assert(
  projectSupplierHref(pid).includes("channel=FOURNISSEUR"),
  "fournisseur → FOURNISSEUR",
);

const po = resolveConversationForContext({
  kind: "purchase_order",
  projectId: pid,
  supplierName: "Point.P",
});
assert(po.includes("channel=FOURNISSEUR"), "commande → FOURNISSEUR");

if (failed > 0) {
  console.error(`\n${failed} test(s) échoué(s)`);
  process.exit(1);
}
console.log("\nTous les tests MESSAGERIE-NOTIFICATION-DEEPLINK-V1 OK");
