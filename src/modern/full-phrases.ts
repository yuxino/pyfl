import ranges from "./data/full-ranges.json";
import rules from "./data/phrases.json";
import { createInitials, type PhraseRule, type Range } from "./runtime";
export type { PhraseRule } from "./runtime";

export function createConverter(overrides: readonly PhraseRule[] = []) {
  return createInitials(ranges as Range[], [...rules, ...overrides]);
}

export default createConverter();
