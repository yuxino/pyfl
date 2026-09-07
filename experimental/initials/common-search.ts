import { ranges, alternatives } from "./data/modern-common.json";
import { createCandidateMatcher } from "./candidates";
import type { Range } from "./runtime";

export default createCandidateMatcher(ranges as Range[], alternatives);
