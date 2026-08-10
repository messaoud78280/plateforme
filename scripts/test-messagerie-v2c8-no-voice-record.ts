/**
 * MESSAGERIE-V2C.8 — plus d’enregistrement vocal dans les composers.
 * Run: node --import tsx scripts/test-messagerie-v2c8-no-voice-record.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(rel: string) {
  return readFileSync(join(root, rel), "utf8");
}

function testDeletedCreationModules() {
  assert.equal(existsSync(join(root, "src/hooks/useVoiceRecorder.ts")), false);
  assert.equal(
    existsSync(join(root, "src/components/messagerie/VoiceRecorderPanel.tsx")),
    false,
  );
  assert.equal(existsSync(join(root, "src/lib/messagerie/voice-audit.ts")), false);
  console.log("✓ modules enregistrement vocal supprimés");
}

function testPlaybackKept() {
  assert.equal(
    existsSync(join(root, "src/components/messagerie/AudioMessagePlayer.tsx")),
    true,
  );
  const secure = read("src/components/messagerie/MessagerieSecureMedia.tsx");
  assert.match(secure, /AudioMessagePlayer/);
  assert.match(secure, /MessagerieSecureAudio/);
  const preview = read("src/lib/messagerie/media-preview.ts");
  assert.match(preview, /isAudioAttachment/);
  console.log("✓ lecture historique audio conservée");
}

function testComposersHaveNoMic() {
  const files = [
    "src/components/messagerie/MessagerieView.tsx",
    "src/components/messagerie/MessagerieMissionsView.tsx",
  ];
  for (const f of files) {
    const src = read(f);
    assert.doesNotMatch(src, /VoiceRecorderPanel/);
    assert.doesNotMatch(src, /useVoiceRecorder/);
    assert.doesNotMatch(src, /voiceOpen/);
    assert.doesNotMatch(src, /title="Message vocal"/);
    assert.doesNotMatch(src, /getUserMedia/);
    assert.doesNotMatch(src, /MediaRecorder/);
    assert.doesNotMatch(src, /navigator\.mediaDevices/);
  }
  console.log("✓ composers sans contrôle microphone");
}

function testNoMicPermissionCopy() {
  const view = read("src/components/messagerie/MessagerieView.tsx");
  const missions = read("src/components/messagerie/MessagerieMissionsView.tsx");
  for (const src of [view, missions]) {
    assert.doesNotMatch(src, /accès au microphone/i);
    assert.doesNotMatch(src, /NotAllowedError/);
    assert.doesNotMatch(src, /NotReadableError/);
  }
  console.log("✓ plus d’erreurs microphone dans l’UI messagerie");
}

testDeletedCreationModules();
testPlaybackKept();
testComposersHaveNoMic();
testNoMicPermissionCopy();
console.log("\nTous les tests V2C.8 no-voice-record OK.");
