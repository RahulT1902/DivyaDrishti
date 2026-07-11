import { RuleSetMeta } from "../types";

// Bump version whenever inference rules change so predictions remain traceable.
// Every InferenceConclusion carries this version — regression testing can
// compare outputs before and after a version bump to confirm no silent drift.

export const CORE_RULESET: RuleSetMeta = {
  id:            "divyadrishti-core-inference",
  version:       "1.0.0",
  effectiveDate: "2026-07-11",
  author:        "DivyaDrishti Core Engine",
};
