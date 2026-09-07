import legacy from "../../src/index";
import modern from "./common-phrases";
import match from "./common-search";
import { ranges } from "../../src/modern/data/common.json";
import { rules } from "./fixtures/phrases.json";
import { createInitials, type Range } from "./runtime";

for (const input of ["重庆", "音乐", "银行", "行走", "长大", "长度"])
  console.log(`${input}: legacy=${legacy(input)}, modern+phrases=${modern(input)}`);

// Both candidate readings can match; search does not decide the pronunciation.
console.log("重庆 matches cq / zq:", match("重庆", "cq"), match("重庆", "zq"));

// Use a reading confirmed by the caller, for this application/context.
const confirmed = createInitials(ranges as Range[], [...rules, { word: "朝阳", initials: "ZY" }]);
console.log("朝阳 with an explicit ZY override:", confirmed("朝阳"));
