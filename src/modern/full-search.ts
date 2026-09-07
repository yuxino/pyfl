import ranges from "./data/full-ranges.json";
import alternatives from "./data/full-alternatives.json";
import { createCandidateMatcher } from "./candidates";
import type { Range } from "./runtime";

export default createCandidateMatcher(ranges as Range[], alternatives);
