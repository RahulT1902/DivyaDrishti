const HEALTH_SUPPORT_POOL = [
  "Physical energy is holding steady. This is a reasonable period to sustain existing routines without pushing for dramatic lifestyle changes.",
  "The body is in a relatively cooperative state — not a peak performance window, but a stable one. Maintaining consistency will preserve the gains made.",
  "Vitality feels accessible with normal effort. Focus on quality over quantity in physical activity, and sleep becomes especially regenerative during this window.",
  "Recovery capacity is good. If the user has been managing a health challenge, this period offers a natural window for gradual improvement.",
];

const HEALTH_FRICTION_POOL = [
  "Physical stamina may feel less predictable than usual. The body is asking for more careful management of energy — rest carries more value than pushing through.",
  "This is a period where minor ailments can escalate quickly if ignored. Small symptoms deserve attention earlier rather than later.",
  "Digestive and nervous systems may be more sensitive than usual. Irregular meals, sleep disruptions, or high stress will have a more noticeable effect on the body right now.",
  "Energy output is likely to feel lower than expected. The chart suggests conservation rather than exertion — a good period for restorative practices rather than intensive ones.",
];

export function getHealthTranslation(evidence: any[]): string {
  const restrictive = evidence.some(e => e.impact === "restrictive");
  const pool = restrictive ? HEALTH_FRICTION_POOL : HEALTH_SUPPORT_POOL;
  const idx = Math.floor(Date.now() / (1000 * 3600)) % pool.length;
  return pool[idx];
}

export const healthVocabulary = {
  support: ["stable vitality", "recovery window", "physical consistency", "restorative capacity"],
  friction: ["energy variability", "stamina management", "systemic sensitivity", "recovery lag"],
  synthesis: "Resilience deepens through attentive, consistent self-care rather than peak effort.",
};
