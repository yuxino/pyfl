import { ranges } from "./data/modern-full.json";
import { rules } from "./fixtures/phrases.json";
import { createInitials, type Range } from "./runtime";

export default createInitials(ranges as Range[], rules);
