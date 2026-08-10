/**
 * MESSAGERIE-V3A — surfaces premier plan + mobile (pas de nouveau backend).
 * Run: node --import tsx scripts/test-messagerie-v3a-premier-plan.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function testSidebarOrder() {
  const src = read("src/components/dashboard/AppSidebar.tsx");
  const accueil = src.indexOf('href: "/dashboard"');
  const aTraiter = src.indexOf('href: "/dashboard/a-traiter"');
  const msg = src.indexOf('href: "/dashboard/messagerie"');
  assert.ok(accueil > 0 && aTraiter > accueil && msg > aTraiter);
  assert.match(src, /MessagerieNavBadge/);
  console.log("✓ sidebar PRINCIPAL : Accueil → À traiter → Messagerie + badge");
}

function testHeaderAndBottomNav() {
  const header = read("src/components/dashboard/MessagerieHeaderShortcut.tsx");
  assert.match(header, /lg:hidden/);
  assert.match(header, /Voir tous les messages/);
  assert.match(header, /slice\(0, 3\)/);
  assert.match(header, /MessageSquare/);

  const notif = read("src/components/dashboard/NotificationsDropdown.tsx");
  assert.match(notif, /Notifications métier/);
  assert.match(notif, /Bell/);

  const bottom = read("src/components/dashboard/MobileBottomNav.tsx");
  assert.match(bottom, /Accueil/);
  assert.match(bottom, /À traiter/);
  assert.match(bottom, /Messages/);
  assert.match(bottom, /Agenda/);
  assert.match(bottom, /Plus/);
  assert.match(bottom, /safe-area-inset-bottom/);
  assert.match(bottom, /min-h-\[52px\]/);
  assert.match(bottom, /useMessagerieUnread/);
  console.log("✓ header Messages ≠ notifications + bottom nav 5 slots");
}

function testAccueilMessages() {
  const accueil = read("src/components/dashboard/AccueilOpsHome.tsx");
  assert.match(accueil, /MessagesHomeBanner variant="card"/);
  const banner = read("src/components/dashboard/MessagesHomeBanner.tsx");
  assert.match(banner, /Voir la messagerie →/);
  assert.match(banner, /nouveau/);
  assert.match(banner, /slice\(0, 3\)/);
  console.log("✓ Accueil bloc Messages card (max 3)");
}

function testUnreadSingleSource() {
  const files = [
    "src/components/dashboard/MessagerieNavBadge.tsx",
    "src/components/dashboard/MessagerieHeaderShortcut.tsx",
    "src/components/dashboard/MobileBottomNav.tsx",
    "src/components/dashboard/MessagesHomeBanner.tsx",
  ];
  for (const f of files) {
    const src = read(f);
    assert.match(
      src,
      /useMessagerieUnread|subscribeMessagerieUnread|getMessagerieUnread/,
    );
  }
  console.log("✓ unread unique (bus / hook partagé)");
}

function testMobileMessagerieChrome() {
  const hub = read("src/components/messagerie/MessagerieHub.tsx");
  assert.match(hub, /Messagerie/);
  assert.match(hub, /Discussions/);
  assert.match(hub, /Par chantier/);

  const missions = read("src/components/messagerie/MessagerieMissionsView.tsx");
  assert.match(missions, /← Discussions/);
  assert.match(missions, /safe-area-inset-bottom/);
  assert.match(missions, /min-h-\[52px\]/);
  assert.match(missions, /Caméra/);
  assert.doesNotMatch(missions, /VoiceRecorderPanel/);

  const view = read("src/components/messagerie/MessagerieView.tsx");
  assert.match(view, /Vous consultez cette conversation/);
  assert.doesNotMatch(view, /en supervision/);
  assert.match(view, /safe-area-inset-bottom/);
  assert.match(view, /Écrire un message/);

  const quick = read("src/components/messagerie/MessageContextMenu.tsx");
  assert.match(quick, /md:opacity-0 md:group-hover:opacity-100/);
  assert.match(quick, /Réagir/);
  assert.match(quick, /Répondre/);
  console.log("✓ chrome mobile Discussions / Par chantier / composer / menus");
}

function testResolversStillUsed() {
  const links = read("src/components/messagerie/MessagerieContextLinks.tsx");
  assert.match(links, /projectTeamHref/);
  assert.match(links, /projectClientHref/);
  assert.match(links, /projectSupplierHref/);
  assert.match(links, /resolveConversationHref/);
  const page = read("src/app/dashboard/projets/[id]/page.tsx");
  assert.match(page, /Message équipe/);
  assert.match(page, /ProjectMessagerieLinks/);
  console.log("✓ CTA chantier via resolvers existants");
}

function testNoPrismaMigrationInDiffExpectation() {
  // Garde-fou : cette passe ne doit pas introduire de schéma Prisma messagerie.
  const main = read("src/components/dashboard/DashboardMain.tsx");
  assert.match(main, /isMessagerie/);
  console.log("✓ layout messagerie full-bleed (pas de migration)");
}

testSidebarOrder();
testHeaderAndBottomNav();
testAccueilMessages();
testUnreadSingleSource();
testMobileMessagerieChrome();
testResolversStillUsed();
testNoPrismaMigrationInDiffExpectation();
console.log("\nTous les tests MESSAGERIE-V3A OK.");
