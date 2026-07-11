import { YogaBirthPromise, YogaConflict } from "../types";

// A conflict rule: two detected yogas that interact negatively.
interface ConflictRule {
  yoga1: string;
  yoga2: string;
  description: string;
  netStrengthDelta: number;
}

const CONFLICT_RULES: ConflictRule[] = [
  {
    yoga1: "gajakesari",
    yoga2: "kemadrum",
    description: "Gajakesari partially cancels Kemadrum when Jupiter is in Kendra from Moon",
    netStrengthDelta: -20,  // net weakening of Kemadrum
  },
  {
    yoga1: "hamsa",
    yoga2: "kemadrum",
    description: "Hamsa Yoga (Jupiter strong in Kendra) partially offsets Kemadrum",
    netStrengthDelta: -15,
  },
  {
    yoga1: "raj-yoga",
    yoga2: "harsha-yoga",
    description: "Raj Yoga and Harsha Yoga reinforce each other — both relate to authority over adversaries",
    netStrengthDelta: +10,
  },
  {
    yoga1: "gajakesari",
    yoga2: "durudhara",
    description: "Gajakesari and Durudhara overlap when Moon has Jupiter on one side — compounding Chandra support",
    netStrengthDelta: +8,
  },
  {
    yoga1: "neecha-bhanga",
    yoga2: "raj-yoga",
    description: "Neecha Bhanga + Raj Yoga: rise after hardship amplified — late but powerful success",
    netStrengthDelta: +12,
  },
];

export function detectConflicts(detected: YogaBirthPromise[]): YogaConflict[] {
  const detectedIds = new Set(detected.map(y => y.id));
  const conflicts: YogaConflict[] = [];

  for (const rule of CONFLICT_RULES) {
    if (detectedIds.has(rule.yoga1) && detectedIds.has(rule.yoga2)) {
      conflicts.push({
        yoga1Id:          rule.yoga1,
        yoga2Id:          rule.yoga2,
        description:      rule.description,
        netStrengthDelta: rule.netStrengthDelta,
      });
    }
  }

  return conflicts;
}
