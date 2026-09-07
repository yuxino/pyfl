import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const temporary = mkdtempSync(path.join(tmpdir(), "pyfl-package-"));
const conversionNames = ["common", "common-phrases", "full", "full-phrases"];
const searchNames = ["common-search", "full-search"];
const modernNames = [...conversionNames, ...searchNames];
const conversionSpecifiers = ["pyfl/modern", ...conversionNames.map(name => `pyfl/modern/${name}`)];
const searchSpecifiers = searchNames.map(name => `pyfl/modern/${name}`);
const specifiers = ["pyfl", ...conversionSpecifiers, ...searchSpecifiers];
// Execute the CLI with Node: Windows cannot spawn npm.cmd without a shell.
const npmCli = process.env.npm_execpath;
assert(npmCli, "Run this check with npm run test:package");
const npm = (args, options) => execFileSync(process.execPath, [npmCli, ...args], options);
const [packed] = JSON.parse(npm(["pack", "--ignore-scripts", "--json", "--pack-destination", temporary], { encoding: "utf8" }));
const expectedFiles = [
  "CHANGELOG.md", "LICENSE", "README.md", "README_en.md", "README_zh-CN.md", "THIRD_PARTY_NOTICES",
  "dist/index.mjs", "dist/pyfl.min.js", "docs/modern.md", "package.json",
  "types/index.d.mts", "types/index.d.ts", "types/modern/runtime.d.mts", "types/modern/runtime.d.ts",
  ...modernNames.flatMap(name => [
    `dist/modern/${name}.mjs`, `dist/modern/${name}.cjs`,
    `types/modern/${name}.d.mts`, `types/modern/${name}.d.ts`,
  ]),
].sort();
assert.equal(expectedFiles.length, 38);
assert.deepEqual(packed.files.map(({ path: filename }) => filename).sort(), expectedFiles,
  "The tarball must contain only reviewed runtime files, declarations, docs and notices");
writeFileSync(path.join(temporary, "package.json"), '{"private":true}');
npm(["install", "--ignore-scripts", "--no-audit", "--no-fund", path.join(temporary, packed.filename)], { cwd: temporary, stdio: "pipe" });
const installed = path.join(temporary, "node_modules/pyfl");
const manifest = JSON.parse(readFileSync(path.join(installed, "package.json"), "utf8"));
assert.equal(manifest.name, "pyfl");
assert.equal(manifest.version, JSON.parse(readFileSync(path.join(root, "package.json"), "utf8")).version);
assert.equal(Object.keys(manifest.dependencies ?? {}).length, 0);
assert.deepEqual(manifest.exports["./modern"], manifest.exports["./modern/common-phrases"]);
const run = (code, esm = false) => execFileSync(process.execPath, [
  ...(esm ? ["--input-type=module"] : []), "-e", code,
], { cwd: temporary, stdio: "pipe" });

// Observe the installed legacy table through its public API, then validate its
// fixed checksum before using it as the oracle for a full BMP conversion.
const legacyChecks = String.raw`
function checkLegacy(pyfl) {
  assert.equal(typeof pyfl, "function");
  const supported = Array.from({ length: 20902 }, (_, i) => String.fromCharCode(0x4e00 + i)).join("");
  const initials = pyfl(supported);
  assert.equal(initials.length, 20902);
  assert.match(initials, /^[A-Z]+$/);
  assert.equal(createHash("sha256").update(initials).digest("hex"),
    "eaa2e2e7911b08c9c0334811ac80c5fc4637db8471802261e8842e55a8911547");
  let bmp = "";
  let expected = "";
  for (let code = 0; code <= 0xffff; code++) {
    const char = String.fromCharCode(code);
    bmp += char;
    expected += code >= 0x4e00 && code <= 0x9fa5 ? initials[code - 0x4e00] : char;
  }
  assert.equal(pyfl(bmp), expected);
  assert.equal(pyfl("你好，世界 / Hello 🐈"), "NH，SJ / Hello 🐈");
  assert.equal(pyfl("重庆 音乐 重阳 银行 曾乐"), "ZQ YL ZY YH CL");
  assert.equal(pyfl("𠮷野家 🐈‍⬛\ud800喵\udc00"), "𠮷YJ 🐈‍⬛\ud800M\udc00");
  assert.equal(pyfl("   "), "");
  assert.equal(pyfl("\t\n\u00a0\u3000"), "\t\n\u00a0\u3000");
  assert.equal(pyfl(undefined), "undefined");
  assert.equal(pyfl(null), "null");
  assert.equal(pyfl(123), "123");
  // Browser VM errors belong to a different realm.
  assert.throws(() => pyfl(Symbol("test")), error => error.name === "TypeError");
}
`;
const entryChecks = String.raw`
checkLegacy(modules["pyfl"].default);
assert.equal(modules["pyfl/modern"].default, modules["pyfl/modern/common-phrases"].default);
assert.equal(modules["pyfl/modern"].createConverter, modules["pyfl/modern/common-phrases"].createConverter);
for (const specifier of conversionSpecifiers) {
  const entry = modules[specifier];
  assert.deepEqual(Object.keys(entry).sort(), ["createConverter", "default"], specifier);
  const convert = entry.default;
  const phrases = specifier === "pyfl/modern" || specifier.endsWith("-phrases");
  const full = specifier.includes("/full");
  const readings = phrases ? "CQ YH YY CC" : "ZQ YX YL ZC";
  assert.equal(convert("重庆 银行 音乐 长城"), readings, specifier);
  assert.equal(convert("Hello，世界 2026"), "Hello，SJ 2026");
  assert.equal(convert("㴔𠙶"), "XO");
  assert.equal(convert("𠀀𠮷"), full ? "H𠮷" : "𠀀𠮷");
  assert.equal(convert("兙兡嗧桛烪瓧瓰瓱瓼甅"), "兙兡嗧桛烪瓧瓰瓱瓼甅");
  assert.equal(convert("🐈‍⬛\ud800喵\udc00e\u0301"), "🐈‍⬛\ud800M\udc00e\u0301");
  for (const raw of ["", " ", "   "]) assert.equal(convert(raw), "");
  for (const raw of ["\t\n\u00a0\u3000", undefined, null, 123, false])
    assert.equal(convert(raw), String(raw));
  assert.throws(() => convert(Symbol("test")), TypeError);
  const failure = new Error("coercion");
  assert.throws(() => convert({ toString() { throw failure; } }), error => error === failure);
  assert.equal(entry.createConverter()("重庆 银行 音乐 长城"), readings);
  const override = entry.createConverter([
    { word: "重庆", initials: "ZQ" }, { word: "重庆", initials: "QQ" },
    { word: "重庆市", initials: "CQS" }, { word: "𠮷甲", initials: "QR" },
  ]);
  assert.equal(override("重庆 重庆市 音乐 𠮷甲乙"), "QQ CQS " + (phrases ? "YY" : "YL") + " QRY");
  assert.equal(convert("重庆 银行 音乐 长城"), readings, "Overrides must not mutate the default converter");
  const guarded = entry.createConverter([
    { word: "甲乙", initials: "AX" }, { word: "乙丙", initials: "CD" },
    { word: "甲乙丙", initials: "JYB" },
  ]);
  assert.equal(guarded("甲乙丙 甲乙 甲，乙 甲🐈乙"), "JYB AX J，Y J🐈Y");
  for (const rule of [{ word: "", initials: "" }, { word: "甲乙", initials: "A" },
    { word: "𠮷", initials: "AB" }, { word: "甲", initials: "a" }])
    assert.throws(() => entry.createConverter([rule]), TypeError);
}
for (const specifier of searchSpecifiers) {
  const entry = modules[specifier];
  assert.deepEqual(Object.keys(entry), ["default"], specifier);
  const match = entry.default;
  assert.equal(typeof match, "function");
  for (const query of ["CQ", "zq"]) assert.equal(match("重庆", query), true);
  for (const query of ["YY", "yl"]) assert.equal(match("音乐", query), true);
  assert.equal(match("Hello 重庆", "lo cq"), true);
  assert.equal(match("重，庆", "cq"), false);
  assert.equal(match("重 庆", "cq"), false);
  assert.equal(match("重🐈庆", "c🐈q"), true);
  assert.equal(match("重\ud800庆", "c\ud800q"), true);
  assert.equal(match("重庆", "重庆"), false, "Candidate matching is not literal Chinese search");
  assert.equal(match("重庆", "chongqing"), false);
  assert.equal(match("重庆", ""), false);
  assert.equal(match("𠙶", "o"), true);
  assert.equal(match("𠀀", "h"), specifier.endsWith("full-search"));
  assert.equal(match("ß", "ss"), false);
  assert.equal(match("ß", "ß"), true);
  assert.equal(match(undefined, "UNDEFINED"), true);
  assert.throws(() => match(Symbol("test"), "a"), TypeError);
  // Materializing the Cartesian product would make this small input infeasible.
  assert.equal(match("重".repeat(64), "C".repeat(64)), true);
}
`;
const serializedSpecifiers = JSON.stringify(specifiers);
const checkInputs = `const conversionSpecifiers = ${JSON.stringify(conversionSpecifiers)};
const searchSpecifiers = ${JSON.stringify(searchSpecifiers)};`;
run(`const assert = require("node:assert/strict"); const { createHash } = require("node:crypto");
const modules = Object.fromEntries(${serializedSpecifiers}.map(name => [name, require(name)]));
${checkInputs}
${legacyChecks}
${entryChecks}
assert.equal(require("pyfl/dist/pyfl.min.js").default, modules.pyfl.default);
assert.equal(require("pyfl/dist/pyfl.min").default, modules.pyfl.default);
assert.equal(require("pyfl/package.json").name, "pyfl");`);
run(`import assert from "node:assert/strict"; import { createHash } from "node:crypto";
const modules = Object.fromEntries(await Promise.all(${serializedSpecifiers}.map(async name => [name, await import(name)])));
${checkInputs}
${legacyChecks}
${entryChecks}`, true);

const umd = readFileSync(path.join(installed, "dist/pyfl.min.js"), "utf8");
const esm = readFileSync(path.join(installed, "dist/index.mjs"), "utf8");
assert(umd.length < 23000 && esm.length < 23000, "Legacy assets must remain compact");
for (const filename of expectedFiles.filter(filename => /^dist\/.*\.(?:js|mjs|cjs)$/.test(filename)))
  assert(!readFileSync(path.join(installed, filename), "utf8").includes("sourceMappingURL"), filename);
const browser = {};
vm.runInNewContext(umd, browser);
vm.runInNewContext(`${legacyChecks}; checkLegacy(pyfl);`, { assert, createHash, pyfl: browser.default });
let amd;
const define = (_dependencies, factory) => { amd = factory(); };
define.amd = true;
vm.runInNewContext(umd, { define });
vm.runInNewContext(`${legacyChecks}; checkLegacy(pyfl);`, { assert, createHash, pyfl: amd.default });

// Resolve every declaration from the installed tarball, never source paths.
const esmConsumer = [
  'import legacy from "pyfl"; const original: string = legacy(undefined); void original;',
  ...conversionSpecifiers.map((specifier, i) => `
import convert${i}, { createConverter as create${i}, type PhraseRule as Rule${i} } from ${JSON.stringify(specifier)};
const rules${i}: readonly Rule${i}[] = [{ word: "重庆", initials: "CQ" }];
const value${i}: string = convert${i}({ input: "anything" });
const customized${i}: (raw: unknown) => string = create${i}(rules${i});
customized${i}(null); void value${i};
// @ts-expect-error Conversion returns a string, not a boolean.
const wrongResult${i}: boolean = convert${i}("重庆");
// @ts-expect-error Phrase initials must be a string.
create${i}([{ word: "重庆", initials: 1 }]);`),
  ...searchSpecifiers.map((specifier, i) => `
import match${i} from ${JSON.stringify(specifier)};
const found${i}: boolean = match${i}(undefined, "cq"); void found${i};
// @ts-expect-error Candidate search requires a query.
match${i}("重庆");
// @ts-expect-error Query must be a string.
match${i}("重庆", 123);`),
].join("\n");
const cjsConsumer = [
  'import legacy = require("pyfl"); const original: string = legacy.default(123); void original;',
  ...conversionSpecifiers.map((specifier, i) => `
import convert${i} = require(${JSON.stringify(specifier)});
const rules${i}: readonly convert${i}.PhraseRule[] = [{ word: "重庆", initials: "CQ" }];
const value${i}: string = convert${i}.default(undefined);
const customized${i}: (raw: unknown) => string = convert${i}.createConverter(rules${i});
customized${i}(null); void value${i};
// @ts-expect-error Conversion returns a string, not a boolean.
const wrongResult${i}: boolean = convert${i}.default("重庆");
// @ts-expect-error Phrase initials must be a string.
convert${i}.createConverter([{ word: "重庆", initials: 1 }]);`),
  ...searchSpecifiers.map((specifier, i) => `
import match${i} = require(${JSON.stringify(specifier)});
const found${i}: boolean = match${i}.default(undefined, "cq"); void found${i};
// @ts-expect-error Candidate search requires a query.
match${i}.default("重庆");
// @ts-expect-error Query must be a string.
match${i}.default("重庆", 123);`),
].join("\n");
writeFileSync(path.join(temporary, "consumer.mts"), esmConsumer);
writeFileSync(path.join(temporary, "consumer.cts"), cjsConsumer);
const tsc = path.join(root, "node_modules/typescript/bin/tsc");
for (const [module, resolution] of [["NodeNext", "NodeNext"], ["Preserve", "Bundler"]])
  execFileSync(process.execPath, [tsc, "--noEmit", "--strict", "--target", "ES2018",
    "--module", module, "--moduleResolution", resolution, "consumer.mts", "consumer.cts"], { cwd: temporary, stdio: "pipe" });
console.log(`Packed package verified: all modern ESM/CJS entries and alias, overrides, candidates, legacy checksum/BMP, browser UMD/AMD, TypeScript NodeNext and bundler; ${packed.files.length} files, ${packed.size} B tgz / ${packed.unpackedSize} B unpacked.`);
console.log(`Package fixture retained at ${temporary}`);
