/**
 * AGENDA-V2A.3 — panneau événement : RSVP, urgence, wording.
 * npx tsx scripts/test-agenda-v2a3-panel-actions.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AgendaEventDTO } from "../src/components/agenda/agenda-types";
import {
  canMarkAgendaEventComplete,
  canRespondToAgendaInvitation,
  isAgendaOrganizerOrResponsible,
  resolveAgendaPrimaryAction,
} from "../src/lib/agenda/panel-actions";
import { buildAgendaUrgency } from "../src/lib/agenda/serialize-event";
import { agendaTypeMeta } from "../src/lib/agenda/types";

const root = process.cwd();

function baseEvent(partial: Partial<AgendaEventDTO> = {}): AgendaEventDTO {
  return {
    id: "ev1",
    title: "Réunion chantier",
    description: null,
    location: null,
    type: "REUNION_CHANTIER",
    status: "PLANIFIE",
    startAt: new Date(Date.now() + 3 * 3600_000).toISOString(),
    endAt: new Date(Date.now() + 5 * 3600_000).toISOString(),
    allDay: false,
    projectId: null,
    responsibleId: "denis",
    reminderMinutes: 15,
    recurrence: null,
    project: null,
    responsible: { id: "denis", name: "Denis Buret", email: "d@demo" },
    createdBy: { id: "denis", name: "Denis Buret", email: "d@demo" },
    attendees: [
      {
        id: "a1",
        status: "EN_ATTENTE",
        user: { id: "karim", name: "Karim Benali", email: "k@demo" },
      },
    ],
    ...partial,
  };
}

function testOrganizerVsInvitee() {
  const ev = baseEvent();
  assert.equal(isAgendaOrganizerOrResponsible(ev, "denis"), true);
  assert.equal(canRespondToAgendaInvitation(ev, "denis"), false);
  assert.equal(canRespondToAgendaInvitation(ev, "karim"), true);
  assert.equal(canRespondToAgendaInvitation(ev, "stranger"), false);

  // Responsable ≠ créateur mais responsable → pas RSVP
  const asResp = baseEvent({
    createdBy: { id: "julie", name: "Julie", email: "j@demo" },
    responsibleId: "denis",
  });
  assert.equal(canRespondToAgendaInvitation(asResp, "denis"), false);

  // Attendee déjà accepté → plus de RSVP
  const accepted = baseEvent({
    attendees: [
      {
        id: "a1",
        status: "ACCEPTE",
        user: { id: "karim", name: "Karim", email: "k@demo" },
      },
    ],
  });
  assert.equal(canRespondToAgendaInvitation(accepted, "karim"), false);
}

function testPrimaryAction() {
  const denisEv = baseEvent();
  assert.equal(resolveAgendaPrimaryAction(denisEv, "denis")?.kind, "edit");
  assert.equal(resolveAgendaPrimaryAction(denisEv, "karim")?.kind, "rsvp_accept");
}

function testCompleteRule() {
  const futureMeeting = baseEvent({
    startAt: new Date(Date.now() + 86400_000).toISOString(),
  });
  assert.equal(canMarkAgendaEventComplete(futureMeeting), false);

  const pastMeeting = baseEvent({
    startAt: new Date(Date.now() - 3600_000).toISOString(),
  });
  assert.equal(canMarkAgendaEventComplete(pastMeeting), true);

  const intervention = baseEvent({
    type: "INTERVENTION",
    startAt: new Date(Date.now() + 86400_000).toISOString(),
  });
  assert.equal(canMarkAgendaEventComplete(intervention), true);
}

function testUrgencyNotFromMeetingProximity() {
  const soon = new Date(Date.now() + 30 * 60_000);
  const u = buildAgendaUrgency({
    startAt: soon,
    status: "PLANIFIE",
    type: "REUNION_CHANTIER",
  });
  assert.equal(u.urgency, "NORMAL");

  const echeance = buildAgendaUrgency({
    startAt: soon,
    status: "PLANIFIE",
    type: "ECHEANCE",
  });
  assert.ok(echeance.urgency === "URGENT" || echeance.urgency === "IMPORTANT");

  const withSheet = buildAgendaUrgency({
    startAt: soon,
    status: "PLANIFIE",
    type: "REUNION_CHANTIER",
    followUpSheet: {
      nextActionAt: soon,
      nextActionDone: false,
      urgencyOverride: "URGENT",
    },
  });
  assert.equal(withSheet.urgency, "URGENT");
}

function testWording() {
  assert.equal(agendaTypeMeta("REUNION_CHANTIER").label, "Réunion chantier");
  const types = readFileSync(join(root, "src/lib/agenda/types.ts"), "utf8");
  assert.ok(!types.includes('"Réunion de chantier"'));
  assert.ok(types.includes('"Réunion chantier"'));
}

function testRsvpApiGuard() {
  const rsvp = readFileSync(
    join(root, "src/app/api/agenda/events/[id]/rsvp/route.ts"),
    "utf8",
  );
  assert.ok(rsvp.includes("createdById === session.user.id"));
  assert.ok(rsvp.includes("responsibleId === session.user.id"));
  assert.ok(rsvp.includes("403"));
}

function testPanelUsesHelpers() {
  const panel = readFileSync(
    join(root, "src/components/agenda/AgendaSidePanel.tsx"),
    "utf8",
  );
  assert.ok(panel.includes("canRespondToAgendaInvitation"));
  assert.ok(panel.includes("resolveAgendaPrimaryAction"));
  assert.ok(panel.includes("MoreHorizontal"));
  assert.ok(panel.includes("Voir le chantier"));
  assert.ok(panel.includes("Participants ·"));
}

function testNoHourToggle() {
  const day = readFileSync(
    join(root, "src/components/agenda/AgendaDayWeekView.tsx"),
    "utf8",
  );
  assert.ok(!day.includes("Afficher 06:00"));
  assert.ok(!day.includes("Revenir à 07:00"));
  assert.ok(day.includes("EXTENDED_HOUR_START"));
}

function main() {
  testOrganizerVsInvitee();
  testPrimaryAction();
  testCompleteRule();
  testUrgencyNotFromMeetingProximity();
  testWording();
  testRsvpApiGuard();
  testPanelUsesHelpers();
  testNoHourToggle();
  console.log("OK — agenda v2a.3 panel actions");
}

main();
