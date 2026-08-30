// Pundit Brain — Layer 0a: Event Extractor
//
// Turns user messages into structured life events.
//
//   "I got cold."         → Health • Illness Started
//   "My cough is improving." → Health • Recovery Started
//   "My appraisal got delayed." → Career • Appraisal Delayed
//   "I got promoted."     → Career • Promotion Confirmed
//
// These events are the raw material for story evolution and prediction validation.
// A real astrologer notices what changed before reasoning from the chart.

import type { LifeEvent, Correction } from "./types";

// ── Signal tables ─────────────────────────────────────────────────────────────
// [eventType, pattern, impliedStage | null]

type EventSignal = [string, RegExp, string | null];

const CAREER_SIGNALS: EventSignal[] = [
  ["Promotion Confirmed",    /got.*promot|promot.*confirm|finally.*promot|promot.*came.*through|got the promot|they.*promot/i,        "Peak"],
  ["Promotion Denied",       /didn.t.*promot|not.*promot|promot.*reject|no.*promot|didn.t get (it|the promot)/i,                      "Plateau"],
  ["Appraisal Delayed",      /appraisal.*delay|review.*postpone|delay.*appraisal|appraisal.*push|review.*push/i,                      null],
  ["Appraisal Completed",    /appraisal.*done|review.*happen|appraisal.*complet|appraisal.*over|review.*finish|appraisal.*went/i,     "Recognition Phase"],
  ["Offer Received",         /got.*offer|receiv.*offer|offer.*accept|offer.*in hand|job.*offer/i,                                     "New Beginning"],
  ["Job Change Made",        /resign|quit.*job|left.*company|join.*new.*compan|switched.*job/i,                                       "New Beginning"],
  ["Interview Completed",    /interview.*done|interview.*went|complet.*interview|interview.*happen|had.*interview/i,                   null],
  ["Salary Raised",          /salary.*increas|got.*raise|hike.*approv|increment.*approv|raise.*came/i,                               "Recognition Phase"],
  ["Role Expanded",          /new.*responsib|got.*team|promoted.*to|moved.*to.*role|lead.*role/i,                                    "Gaining Visibility"],
  ["Recognition Received",   /recogni|award|praised|appreciated|complimented.*by|appreciated.*by/i,                                  "Recognition Phase"],
];

const HEALTH_SIGNALS: EventSignal[] = [
  ["Illness Started",        /got.*sick|fell.*ill|not.*feeling.*well|fever.*start|cold.*start|cough.*start|fell.*unwell|got.*cold|got.*fever|feeling.*unwell|came.*down|sick.*now/i, "Active Concern"],
  ["Recovery Started",       /getting.*better|recovering|feel.*improv|started.*improv|slowly.*better/i,                              "Recovery"],
  ["Recovery Completed",     /fully.*recover|all.*good.*now|back.*normal|healthy.*again|feel.*fine.*now|completely.*well/i,          "Restored"],
  ["Medical Consultation",   /went.*doctor|visit.*hospital|doctor.*said|physician|got.*checked|saw.*specialist/i,                    null],
  ["Health Worsened",        /getting.*worse|not.*improv|still.*sick|wors.*condition|deterior|going.*downhill/i,                    "Active Concern"],
  ["Treatment Started",      /start.*medication|started.*treatment|started.*medicine|began.*medication/i,                            "Recovery"],
  ["Test Results Received",  /test.*came|result.*came|reports.*came|diagnosis.*confirm/i,                                            null],
];

const FINANCE_SIGNALS: EventSignal[] = [
  ["Income Increased",       /salary.*hike|bonus.*receiv|income.*increas|got.*bonus|raise.*approv|extra.*income/i,                  "Growth Phase"],
  ["Investment Made",        /invest.*in|put.*money.*in|bought.*stocks|allocat|bought.*mutual|SIP.*start/i,                        null],
  ["Financial Loss",         /lost.*money|invest.*fail|portfolio.*down|loss.*happen|lost.*in.*market|capital.*loss/i,              "Financial Pressure"],
  ["Debt Resolved",          /paid.*off|clear.*debt|emi.*done|loan.*clear|debt.*gone|settled.*loan/i,                              "Stable"],
  ["Financial Gain",         /earned.*extra|extra.*income|profit.*made|returns.*came|great.*returns/i,                             "Growth Phase"],
  ["Expense Burden",         /expense.*increas|spending.*too.*much|burden.*financ|debt.*increas|unexpected.*expense/i,             "Financial Pressure"],
  ["Big Purchase Made",      /bought.*house|bought.*car|made.*big.*purchase|property.*bought/i,                                    null],
];

const RELATIONSHIP_SIGNALS: EventSignal[] = [
  ["Conflict Occurred",      /had.*fight|argument.*happen|big.*disagree|conflict.*happen|major.*fight|we.*fought/i,               "Friction"],
  ["Reconciliation",         /made.*up|sorted.*out|things.*better.*now|talk.*it.*out|reconcil|we.*patched/i,                      "Healing"],
  ["Engagement",             /got.*engaged|said.*yes|proposal.*accept|getting.*married|fixed.*wedding/i,                          "Commitment"],
  ["Communication Opened",   /start.*talk|open.*communic|finally.*spoke|broke.*silence|we.*talked/i,                              "Communication Opening"],
  ["Distance Growing",       /growing.*apart|not.*talking|communication.*less|distant.*now|barely.*talking/i,                     "Distance"],
  ["Separation",             /broke.*up|separated|ended.*relation|she.*left|he.*left|called.*off/i,                              "Distance"],
  ["Marriage Discussion",    /talk.*about.*marriage|parents.*discuss|fixing.*date|wedding.*plan/i,                                "Commitment"],
];

const DOMAIN_SIGNALS: Record<string, EventSignal[]> = {
  career:       CAREER_SIGNALS,
  health:       HEALTH_SIGNALS,
  finance:      FINANCE_SIGNALS,
  relationship: RELATIONSHIP_SIGNALS,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const OUTCOME_WORDS = /it happened|came true|confirm|actually.*happen|did.*happen|you were right|that.*right|exactly.*happen|just.*happen/i;

function inferTimeRef(message: string): "today" | "recently" | "past" {
  if (/today|just now|this morning|tonight|just got|right now|happened now/i.test(message)) return "today";
  if (/yesterday|last night|a few days|couple.*days|this week/i.test(message)) return "recently";
  return "recently";
}

// ── Main exports ──────────────────────────────────────────────────────────────

export function extractEvents(message: string, domain: string): LifeEvent[] {
  const signals = DOMAIN_SIGNALS[domain] ?? [];
  const events: LifeEvent[] = [];

  for (const [eventType, pattern, impliedStage] of signals) {
    if (pattern.test(message)) {
      events.push({
        domain,
        eventType,
        description:  message.slice(0, 120),
        timeRef:      inferTimeRef(message),
        impliedStage: impliedStage ?? null,
        isOutcome:    OUTCOME_WORDS.test(message),
      });
    }
  }

  return events;
}

export function detectCorrection(
  message: string,
  history: Array<{ role: string; content: string }>,
): Correction | null {
  const CORRECTION_SIGNALS = [
    /actually[,.]?\s*(that.?s?\s*(not right|wrong|incorrect))?/i,
    /no[,.]\s*(that.?s?\s*(not|wrong)|i didn.t say)/i,
    /you were wrong|that.?s? incorrect|not what (i|we) said/i,
    /it already happened|that already passed|that.?s? done already|already over/i,
    /(it|that) didn.t happen|nothing happened|was wrong about|didn.t come true/i,
  ];

  if (!CORRECTION_SIGNALS.some(p => p.test(message))) return null;

  const lastAI = history.filter(m => m.role === "assistant").slice(-1)[0];
  const oldBelief = lastAI?.content.replace(/\n/g, " ").slice(0, 150) ?? "previous assessment";

  return {
    field:     "prediction",
    oldBelief: oldBelief.trim(),
    newFact:   message.slice(0, 200),
  };
}
