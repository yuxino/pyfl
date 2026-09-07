import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { brotliCompressSync, gzipSync, constants } from "node:zlib";
import { build, version } from "../../benchmark/node_modules/esbuild/lib/main.js";

const root = fileURLToPath(new URL("./", import.meta.url));
const outputDirectory = fileURLToPath(new URL("./generated/", import.meta.url));
await mkdir(outputDirectory, { recursive: true });
assert.equal(version, "0.28.2", "Use npm ci --prefix benchmark for the pinned measurement tool");
const readJson = async name => JSON.parse(await readFile(new URL(name, import.meta.url), "utf8"));
const common = await readJson("../../src/modern/data/common.json");
const full = await readJson("../../src/modern/data/full.json");
const fixtures = await readJson("./fixtures/phrases.json");
const definitions = [
  ["legacy", "../../src/index.ts", 20902, "conversion"],
  ["common", "common.ts", common.entries, "conversion"],
  ["common-phrases", "common-phrases.ts", common.entries, "conversion + curated phrases"],
  ["full", "full.ts", full.entries, "conversion"],
  ["full-phrases", "full-phrases.ts", full.entries, "conversion + curated phrases"],
  ["common-search", "common-search.ts", common.entries, "candidate initial search"],
  ["full-search", "full-search.ts", full.entries, "candidate initial search"],
];
const converters = {};
const bundles = [];
for (const [name, entry, coverage, capability] of definitions) {
  const filename = `${outputDirectory}${name}.mjs`;
  const result = await build({
    absWorkingDir: root, entryPoints: [entry], outfile: filename,
    bundle: true, minify: true, platform: "browser", format: "esm", target: "es2018",
    charset: "utf8", legalComments: "none", write: false, metafile: true,
  });
  const bytes = result.outputFiles[0].contents;
  await writeFile(filename, bytes);
  const exported = (await import(pathToFileURL(filename).href)).default;
  if (!name.endsWith("-search")) converters[name] = exported;
  else {
    assert.equal(exported("重庆", "cq"), true);
    assert.equal(exported("重庆", "zq"), true);
  }
  bundles.push({
    name, capability, coverage,
    bytes: bytes.length,
    gzip: gzipSync(bytes, { level: 9 }).length,
    brotli: brotliCompressSync(bytes, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length,
    bundledInputs: Object.keys(result.metafile.inputs),
  });
}
const examples = ["重庆", "音乐", "银行", "行走", "行长", "长大", "长度", "朝阳", "𠀀𠮷"]
  .map(input => ({ input, ...Object.fromEntries(Object.entries(converters).map(([name, convert]) => [name, convert(input)])) }));
const regression = Object.fromEntries(Object.entries(converters).map(([name, convert]) => {
  const failures = fixtures.cases.filter(item => convert(item.input) !== item.expected)
    .map(item => ({ input: item.input, expected: item.expected, actual: convert(item.input) }));
  return [name, { total: fixtures.cases.length, passed: fixtures.cases.length - failures.length, failures }];
}));
const legacyRangeComparison = {};
for (const [name, convert] of [["common", converters.common], ["full", converters.full]]) {
  let preservedUnknown = 0;
  let differentInitial = 0;
  for (let code = 0x4e00; code <= 0x9fa5; code++) {
    const char = String.fromCodePoint(code);
    const modern = convert(char);
    if (modern === char) preservedUnknown++;
    else if (modern !== converters.legacy(char)) differentInitial++;
  }
  legacyRangeComparison[name] = { legacyEntries: 20902, preservedUnknown, differentInitial };
}
const report = {
  formatVersion: 1,
  sourceCommit: full.sourceCommit,
  runtime: { node: process.version, esbuild: version, zlib: process.versions.zlib },
  method: "Browser ESM, es2018, esbuild minified, UTF-8, gzip level 9, Brotli quality 11. Includes all reachable code/data; named JSON imports omit unused candidate readings and test cases. These are bundle bytes, not npm tarball bytes.",
  phraseRules: fixtures.rules.length,
  bundles, examples, regression, legacyRangeComparison,
  limitations: [
    "The common inventory has fewer covered characters than legacy; a smaller bundle is not equivalent coverage.",
    "The full inventory still has ten unsupported legacy characters. Unsupported code points pass through unchanged.",
    "The curated regression corpus is illustrative and overlaps phrase rules; its pass count is not an independent accuracy benchmark.",
    "Candidate search includes rare or historical readings and can create false positives; it does not resolve context.",
    "Phrase matching is greedy, left-to-right longest matching, not segmentation or sentence-level disambiguation.",
  ],
};
await writeFile(new URL("./measurements.json", import.meta.url), JSON.stringify(report, null, 2) + "\n");
console.table(bundles.map(({ name, coverage, bytes, gzip, brotli }) => ({ name, coverage, bytes, gzip, brotli })));
console.table(examples);
console.table(Object.entries(regression).map(([name, result]) => ({ name, total: result.total, passed: result.passed })));
console.log(JSON.stringify({ legacyRangeComparison, report: "experimental/initials/measurements.json" }, null, 2));
