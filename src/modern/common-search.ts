import ranges from "./data/common-ranges.json";
import alternatives from "./data/common-alternatives.json";
import { createCandidateMatcher } from "./candidates";
import type { Range } from "./runtime";

export default createCandidateMatcher(ranges as Range[], alternatives);
