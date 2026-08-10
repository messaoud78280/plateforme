/**
 * MESSAGERIE-V2C.6B — Test P0 : header/composer ne divergent jamais de scope.
 * Run: npx tsx scripts/test-messagerie-channel-presentation.ts
 */
import assert from "node:assert/strict";
import {
  assertChannelPresentationConsistent,
  resolveActiveChannelPresentation,
} from "../src/lib/messagerie/resolve-active-channel-presentation";

function testInternal() {
  const p = resolveActiveChannelPresentation(
    {
      id: "ch1",
      type: "INTERNAL",
      title: "Équipe SETRIM",
      external: false,
      participantCount: 2,
    },
    { projectTitle: "Résidence Victor Hugo", participantCount: 2 },
  );
  assert.equal(p.scopeType, "INTERNAL");
  assert.equal(p.scopeBadge, "🔒 Interne");
  assert.match(p.composerLabel, /^🔒 À : Équipe SETRIM/);
  assert.doesNotMatch(p.composerLabel, /Client|Fournisseur/i);
  assert.equal(assertChannelPresentationConsistent(p), true);
  console.log("✓ INTERNAL → composer interne");
}

function testClient() {
  const p = resolveActiveChannelPresentation(
    {
      id: "ch2",
      type: "CLIENT",
      title: "ABC Promotion",
      external: true,
      participantCount: 3,
    },
    { projectTitle: "Résidence Victor Hugo", participantCount: 3 },
  );
  assert.equal(p.scopeType, "CLIENT");
  assert.match(p.composerLabel, /À : ABC Promotion · Client externe/);
  assert.doesNotMatch(p.composerLabel, /Point\.P|Fournisseur|🔒/);
  assert.equal(assertChannelPresentationConsistent(p), true);
  console.log("✓ CLIENT → composer client");
}

function testSupplier() {
  const p = resolveActiveChannelPresentation(
    {
      id: "ch3",
      type: "SUPPLIER",
      title: "Point.P",
      external: true,
      participantCount: 3,
    },
    { projectTitle: "Résidence Victor Hugo", participantCount: 3 },
  );
  assert.equal(p.scopeType, "SUPPLIER");
  assert.match(p.composerLabel, /À : Point\.P · Fournisseur externe/);
  assert.doesNotMatch(p.composerLabel, /Client|Équipe SETRIM/);
  assert.equal(assertChannelPresentationConsistent(p), true);
  console.log("✓ SUPPLIER → composer fournisseur");
}

function testNoStaleFallback() {
  // Sans channel : pas de faux "Message client · EXTERNE"
  const p = resolveActiveChannelPresentation(null, {
    projectTitle: "Résidence Victor Hugo",
  });
  assert.equal(p.channelId, null);
  assert.doesNotMatch(p.composerLabel, /Message client|EXTERNE/i);
  console.log("✓ null channel → pas de fallback CLIENT");
}

function testMismatchImpossible() {
  const internal = resolveActiveChannelPresentation({
    id: "a",
    type: "INTERNAL",
    title: "Équipe SETRIM",
  });
  // Simuler l’ancien bug : header INTERNAL + texte CLIENT
  const buggyComposer = "Message client · EXTERNE · Résidence Victor Hugo";
  assert.equal(internal.scopeType, "INTERNAL");
  assert.notEqual(internal.composerLabel, buggyComposer);
  assert.equal(
    /Client externe/i.test(internal.composerLabel) && internal.scopeType === "INTERNAL",
    false,
  );
  console.log("✓ impossible header INTERNAL + composer CLIENT");
}

testInternal();
testClient();
testSupplier();
testNoStaleFallback();
testMismatchImpossible();
console.log("\nTous les tests présentation canal OK.");
