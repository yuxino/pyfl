const { copyFileSync, readFileSync, writeFileSync } = require("node:fs");
copyFileSync("types/index.d.ts", "types/index.d.mts");

for (const name of ["common", "common-phrases", "full", "full-phrases", "common-search", "full-search", "runtime"]) {
  const filename = `types/modern/${name}.d.ts`;
  const declaration = readFileSync(filename, "utf8");
  // NodeNext needs explicit, format-matching declaration references.
  writeFileSync(filename, declaration.replace(/from "\.\/runtime"/g, 'from "./runtime.js"'));
  writeFileSync(`types/modern/${name}.d.mts`, declaration.replace(/from "\.\/runtime"/g, 'from "./runtime.mjs"'));
}
