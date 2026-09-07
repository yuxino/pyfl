import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { gzipSync, brotliCompressSync } from "node:zlib";
import { build } from "esbuild";
import pyfl from "../dist/index.mjs";

const require = createRequire(import.meta.url);
const directory = fileURLToPath(new URL(".", import.meta.url));
process.chdir(directory);
const published = require("pyfl-published").default;
const pro = require("pinyin-pro").pinyin;
const pinyin = require("pinyin").pinyin;
const dict = readFileSync("../src/dict/firstletter.ts", "utf8").match(/"([^"]+)"/)[1];
const corpus = {
  name: "张小明",
  mixed: "你好，世界 / Hello, 世界! 123 🐈",
  chinese: "好笑吗跟傻子一样整天就知道哈哈哈哈哈哈哈".repeat(10),
  ascii: "Pure JavaScript 123 🐈".repeat(10)
};
const conversions = {
  "pyfl-2.0.0": published,
  "pyfl-2.0.1": pyfl,
  "pinyin-pro-3.29.3": text => pro(text, { pattern: "first", toneType: "none", type: "array" }).join(""),
  "pinyin-4.0.0": text => pinyin(text, { style: "first_letter", segment: false, heteronym: false }).flat().join("")
};
const median = values => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
let sink = 0;
function measure(fn, input, iterations) {
  for (let i = 0; i < Math.min(iterations, 2000); i++) sink += consume(fn(input));
  const samples = [];
  for (let sample = 0; sample < 9; sample++) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) sink += consume(fn(input));
    samples.push((performance.now() - start) * 1000 / iterations);
  }
  return { medianMicroseconds: median(samples), minMicroseconds: Math.min(...samples), maxMicroseconds: Math.max(...samples), samples, iterations };
}
// Reading the final code unit forces concatenated strings to be materialized.
function consume(value) { return value.length + (value.charCodeAt(value.length - 1) || 0); }
const throughput = {};
for (const [sample, input] of Object.entries(corpus)) {
  throughput[sample] = {};
  for (const [name, fn] of Object.entries(conversions)) {
    throughput[sample][name] = measure(fn, input, name.startsWith("pyfl") ? 50000 : 2000);
  }
}
const compress = data => ({ raw: Buffer.byteLength(data), gzip: gzipSync(data).length, brotli: brotliCompressSync(data).length });
const variants = {
  "pyfl-2.0.0": `import old from "pyfl-published"; export default old.default;`,
  "pyfl-2.0.1": `export { default } from "../dist/index.mjs";`,
  "pinyin-pro-3.29.3": `import {pinyin} from "pinyin-pro"; export default text => pinyin(text,{pattern:"first",toneType:"none",type:"array"}).join("");`,
  "pinyin-4.0.0": `import {pinyin} from "pinyin"; export default text => pinyin(text,{style:"first_letter",segment:false,heteronym:false}).flat().join("");`
};
const browserBundles = {};
mkdirSync("generated", { recursive: true });
for (const [name, code] of Object.entries(variants)) {
  const result = await build({ stdin: { contents: code, resolveDir: directory, sourcefile: name + ".js" }, bundle: true, minify: true, format: "esm", platform: "browser", target: "es2018", write: false, logLevel: "silent" });
  const buffer = result.outputFiles[0].contents;
  browserBundles[name] = compress(buffer);
  writeFileSync(`generated/${name}.mjs`, buffer);
}
const cold = {};
const coldTargets = {
  "pyfl-2.0.0": ['pyfl-published', '.default', 'fn("你好，世界")'],
  "pyfl-2.0.1": ['../dist/pyfl.min.js', '.default', 'fn("你好，世界")'],
  "pinyin-pro-3.29.3": ['pinyin-pro', '.pinyin', 'fn("你好，世界", {pattern:"first",toneType:"none",type:"array"}).join("")'],
  "pinyin-4.0.0": ['pinyin', '.pinyin', 'fn("你好，世界", {style:"first_letter",segment:false,heteronym:false}).flat().join("")']
};
for (const [name, [specifier, member, call]] of Object.entries(coldTargets)) {
  const samples = [];
  for (let i = 0; i < 15; i++) {
    const code = `const start=performance.now(); const fn=require(${JSON.stringify(specifier)})${member}; const output=${call}; const elapsed=performance.now()-start; process.stdout.write(JSON.stringify({elapsed,length:output.length}));`;
    samples.push(JSON.parse(execFileSync(process.execPath, ["-e", code], { encoding: "utf8", cwd: directory })).elapsed);
  }
  cold[name] = { medianMilliseconds: median(samples), minMilliseconds: Math.min(...samples), maxMilliseconds: Math.max(...samples), samples };
}
// Five-bit A=0..Z=25 packing, serialized as base64 for a JavaScript bundle.
const bytes = Buffer.alloc(Math.ceil(dict.length * 5 / 8));
for (let i = 0; i < dict.length; i++) {
  const value = dict.charCodeAt(i) - 65;
  const bit = i * 5, index = bit >>> 3, shift = bit & 7;
  bytes[index] |= value << shift;
  if (shift > 3) bytes[index + 1] |= value >>> (8 - shift);
}
const packed = bytes.toString("base64");
const packedAt = index => { const bit = index * 5, offset = bit >>> 3, shift = bit & 7; return String.fromCharCode(65 + (((bytes[offset] | (bytes[offset + 1] << 8)) >>> shift) & 31)); };
for (let i = 0; i < dict.length; i++) assert.equal(packedAt(i), dict[i]);
const rawTable = `export default ${JSON.stringify(dict)};`;
const packedTable = `const value=atob(${JSON.stringify(packed)});export default i=>{const bit=i*5,o=bit>>>3,s=bit&7;return String.fromCharCode(65+(((value.charCodeAt(o)|(value.charCodeAt(o+1)<<8))>>>s)&31))};`;
const encoding = {
  asciiTable: compress(rawTable),
  fiveBitBase64Table: compress(packedTable),
  randomAccess: {
    ascii: measure(text => { let out=""; for(let i=0;i<text.length;i++) out+=dict.charAt(text.charCodeAt(i)-0x4e00);return out; }, corpus.chinese, 50000),
    fiveBit: measure(text => { let out=""; for(let i=0;i<text.length;i++) out+=packedAt(text.charCodeAt(i)-0x4e00);return out; }, corpus.chinese, 50000)
  },
  note: "Packed random access uses an already decoded Buffer, excluding base64 decode cost; table sizes include a browser decoder."
};
const semanticInputs = ["喵", "重庆", "音乐", "重阳", "银行", "龥", "〇", "𠮷野家", "a中b国C", "  "];
const semantics = semanticInputs.map(input => ({ input, pyfl: pyfl(input), pinyinPro: pro(input, {type:"all",toneType:"none"}).map(item => item.isZh ? item.first.toUpperCase() : item.origin).join(""), pinyinRaw: conversions["pinyin-4.0.0"](input) }));
const packages = {};
for (const [name, specifier] of Object.entries({"pyfl-2.0.0":"pyfl-published", "pinyin-pro-3.29.3":"pinyin-pro", "pinyin-4.0.0":"pinyin"})) {
  const manifest = require(`${specifier}/package.json`);
  const file = readFileSync(require.resolve(specifier));
  packages[name] = { version: manifest.version, nodeEntry: compress(file) };
}
for (const [name, packageName] of Object.entries({"pyfl-2.0.0":"pyfl", "pinyin-pro-3.29.3":"pinyin-pro", "pinyin-4.0.0":"pinyin"})) {
  const response = await fetch(`https://registry.npmjs.org/${packageName}/${packages[name].version}`);
  assert(response.ok, `npm metadata for ${packageName}`);
  const metadata = await response.json();
  const tarball = await fetch(metadata.dist.tarball);
  assert(tarball.ok, `npm tarball for ${packageName}`);
  const bytes = Buffer.from(await tarball.arrayBuffer());
  assert.equal(createHash("sha1").update(bytes).digest("hex"), metadata.dist.shasum);
  packages[name].npmPackage = { unpackedBytes: metadata.dist.unpackedSize, tarballBytes: bytes.length, shasum: metadata.dist.shasum };
}
const report = {
  date: new Date().toISOString(), node: process.version, platform: `${os.platform()} ${os.arch()}`, cpu: os.cpus()[0].model,
  dictionarySha256: createHash("sha256").update(dict).digest("hex"), corpus,
  methodology: "Warm conversion median of 9 samples; 50,000 calls/sample for Pyfl, 2,000 for engines. Final output code unit consumed. Engines use native lowercase initial APIs, pinyin segment=false, no optional peers. Fresh Node process cold CJS require + first conversion, 15 samples; OS file cache warm and process startup excluded. Browser bundles use the same esbuild 0.28.2 minified ESM/browser/es2018 settings, including reachable imports; gzip and Brotli use Node defaults. These are local microbenchmarks, not browser latency or an accuracy corpus.",
  throughput, cold, browserBundles, packages, encoding, semantics,
  runtimeAssets: { umd: compress(readFileSync("../dist/pyfl.min.js")), esm: compress(readFileSync("../dist/index.mjs")) }, sink
};
writeFileSync("results.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ throughput: Object.fromEntries(Object.entries(throughput).map(([name, rows]) => [name, Object.fromEntries(Object.entries(rows).map(([candidate, result]) => [candidate, result.medianMicroseconds]))])), cold: Object.fromEntries(Object.entries(cold).map(([name,result])=>[name,result.medianMilliseconds])), browserBundles, runtimeAssets:report.runtimeAssets, encoding: {ascii:encoding.asciiTable,packed:encoding.fiveBitBase64Table}, semantics }, null, 2));
