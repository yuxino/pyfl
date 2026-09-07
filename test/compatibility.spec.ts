import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import pyfl from "../src/index";
import firstletter from "../src/dict/firstletter";

// The released algorithm, retained as an independent compatibility oracle.
function legacy(raw: unknown): string {
  const str = `${raw}`;
  if (!str || /^ +$/g.test(str)) return "";
  const result = [];
  for (let i = 0; i < str.length; i++) {
    const unicode = str.charCodeAt(i);
    let char = str.charAt(i);
    if (unicode >= 19968 && unicode <= 40869)
      char = firstletter.charAt(unicode - 19968);
    result.push(char);
  }
  return result.join("");
}

test("keeps the complete original dictionary", () => {
  assert.equal(firstletter.length, 20902);
  assert.match(firstletter, /^[A-Z]+$/);
  assert.equal(createHash("sha256").update(firstletter).digest("hex"),
    "eaa2e2e7911b08c9c0334811ac80c5fc4637db8471802261e8842e55a8911547");
});

test("matches the released algorithm for every UTF-16 code unit and a full BMP string", () => {
  let bmp = "";
  for (let code = 0; code <= 0xffff; code++) {
    const char = String.fromCharCode(code);
    assert.equal(pyfl(char), legacy(char), `U+${code.toString(16)}`);
    bmp += char;
  }
  assert.equal(pyfl(bmp), legacy(bmp));
});

test("preserves exact whitespace and Unicode boundaries", () => {
  for (const value of ["", " ", "    ", "\t", "\n", " \n", "\r\n", "\u00a0", "\u3000",
    "中 文", "\u4dff\u4e00\u9fa5\u9fa6", "𠮷野家 🐈‍⬛", "\ud800喵\udc00", "e\u0301中\u200d"])
    assert.equal(pyfl(value), legacy(value), JSON.stringify(value));
  assert.equal(pyfl("  "), "");
  assert.equal(pyfl("\t\n\u00a0\u3000"), "\t\n\u00a0\u3000");
  assert.equal(pyfl("𠮷野家 🐈‍⬛"), "𠮷YJ 🐈‍⬛");
});

test("keeps fixed polyphonic readings, including their limitations", () => {
  assert.equal(pyfl("重庆 音乐 重阳 银行 曾乐"), "ZQ YL ZY YH CL");
});

test("preserves template-string coercion and exceptions", () => {
  for (const value of [undefined, null, false, true, 0, -0, NaN, Infinity, 123n, [], ["喵", 1],
    { toString: () => "喵" }, { [Symbol.toPrimitive]: (hint: string) => hint === "string" ? "喵" : "错" }])
    assert.equal(pyfl(value), legacy(value));
  for (const value of [Symbol("喵"), Object.create(null)]) {
    assert.throws(() => legacy(value), TypeError);
    assert.throws(() => pyfl(value), TypeError);
  }
  const failure = new Error("coercion");
  assert.throws(() => pyfl({ toString() { throw failure; } }), (error) => error === failure);
});

test("matches the released algorithm for seeded mixed text", () => {
  let seed = 0x5079666c;
  for (let sample = 0; sample < 1000; sample++) {
    let value = "";
    for (let i = 0; i < sample % 127; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      value += String.fromCharCode(seed & 0xffff);
    }
    assert.equal(pyfl(value), legacy(value));
  }
});
