import { ranges } from "./data/modern-full.json";
import { createInitials, type Range } from "./runtime";

export default createInitials(ranges as Range[]);
