import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const temporary = mkdtempSync(path.join(tmpdir(), "pyfl-package-"));
// Execute the CLI with Node: Windows cannot spawn npm.cmd without a shell.
const npmCli = process.env.npm_execpath;
assert(npmCli, "Run this check with npm run test:package");
const npm = (args, options) => execFileSync(process.execPath, [npmCli, ...args], options);
const [packed] = JSON.parse(npm(["pack", "--ignore-scripts", "--json", "--pack-destination", temporary], { encoding: "utf8" }));
assert.deepEqual(packed.files.map(({ path }) => path).sort(), [
  "CHANGELOG.md", "LICENSE", "README.md", "THIRD_PARTY_NOTICES", "dist/index.mjs", "dist/pyfl.min.js",
  "package.json", "types/index.d.mts", "types/index.d.ts"
]);
writeFileSync(path.join(temporary, "package.json"), '{"private":true}');
npm(["install", "--ignore-scripts", "--no-audit", "--no-fund", path.join(temporary, packed.filename)], { cwd: temporary, stdio: "pipe" });
const run = (code, type) => execFileSync(process.execPath, [...(type ? ["--input-type=module"] : []), "-e", code], { cwd: temporary, stdio: "pipe" });
run(`const assert = require('node:assert/strict'); const pyfl = require('pyfl').default;
assert.equal(pyfl('你好，世界 / Hello 🐈'), 'NH，SJ / Hello 🐈');
assert.equal(require('pyfl/dist/pyfl.min.js').default, pyfl);
assert.equal(require('pyfl/dist/pyfl.min').default, pyfl);
assert.equal(require('pyfl/package.json').name, 'pyfl');`);
run(`import assert from 'node:assert/strict'; import pyfl from 'pyfl';
assert.equal(pyfl('你好，世界 / Hello 🐈'), 'NH，SJ / Hello 🐈');`, true);
const umd = readFileSync(path.join(temporary, "node_modules/pyfl/dist/pyfl.min.js"), "utf8");
const esm = readFileSync(path.join(temporary, "node_modules/pyfl/dist/index.mjs"), "utf8");
assert(!umd.includes("sourceMappingURL"));
assert(!esm.includes("sourceMappingURL"));
assert(umd.length < 23000 && esm.length < 23000, "runtime assets must remain compact");
const browser = {};
vm.runInNewContext(umd, browser);
assert.equal(browser.default("喵 🐈"), "M 🐈");
let amd;
const define = (_deps, factory) => { amd = factory(); };
define.amd = true;
vm.runInNewContext(umd, { define });
assert.equal(amd.default("喵"), "M");
// Resolve declarations from the actual installed package, in both Node modes.
writeFileSync(path.join(temporary, "consumer.mts"), `import pyfl from "pyfl"; const value: string = pyfl("喵"); pyfl(undefined); void value;`);
writeFileSync(path.join(temporary, "consumer.cts"), `import pyfl = require("pyfl"); const value: string = pyfl.default(123); void value;`);
execFileSync(process.execPath, [path.join(root, "node_modules/typescript/bin/tsc"), "--noEmit", "--strict", "--target", "ES2018", "--module", "NodeNext", "--moduleResolution", "NodeNext", "consumer.mts", "consumer.cts"], { cwd: temporary, stdio: "pipe" });
console.log(`Packed package verified: CJS, native ESM, browser UMD, AMD, TypeScript NodeNext; ${packed.size} B tgz / ${packed.unpackedSize} B unpacked.`);
console.log(`Package fixture retained at ${temporary}`);
