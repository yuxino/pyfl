const { copyFileSync } = require("node:fs");
copyFileSync("types/index.d.ts", "types/index.d.mts");
