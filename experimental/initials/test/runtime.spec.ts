import assert from "node:assert/strict";
import test from "node:test";
import { createInitials, createLookup, type Range } from "../runtime";
import { createCandidateMatcher } from "../candidates";

const ranges: Range[] = [[0x4e00, "Y.D"], [0x20000, "H"]];

test("range boundaries, holes and supplementary code points", () => {
  const lookup = createLookup(ranges);
  for (const code of [0, 0x4dff, 0x4e01, 0x4e03, 0x1ffff, 0x20001])
    assert.equal(lookup(code), undefined);
  assert.equal(lookup(0x4e00), "Y");
  assert.equal(lookup(0x4e02), "D");
  assert.equal(lookup(0x20000), "H");
  assert.equal(createInitials(ranges)("一丁丂𠀀\ud800🐈‍⬛\udc00aZ"), "Y丁DH\ud800🐈‍⬛\udc00aZ");
});

test("conversion keeps legacy coercion, whitespace and errors", () => {
  const convert = createInitials([]);
  for (const raw of [null, undefined, false, true, 0, NaN, BigInt(123), [], ["一", 1],
    { toString: () => "一" }, " \t\n\u00a0\u3000", "\ud800\udc00\udc00"])
    assert.equal(convert(raw), `${raw}`);
  for (const raw of ["", " ", "   "]) assert.equal(convert(raw), "");
  for (const raw of [Symbol("一"), Object.create(null)]) assert.throws(() => convert(raw), TypeError);
  const error = new Error("coercion");
  assert.throws(() => convert({ toString() { throw error; } }), value => value === error);
});

test("longest phrase wins, later exact overrides win, and scanning is left to right", () => {
  const convert = createInitials([], [
    { word: "甲乙", initials: "AB" }, { word: "甲乙丙", initials: "CDE" },
    { word: "乙丙丁", initials: "FGH" }, { word: "甲乙", initials: "IJ" },
    { word: "𠀀甲", initials: "KL" },
  ]);
  assert.equal(convert("甲乙 甲乙丙丁 𠀀甲"), "IJ CDE丁 KL");
  assert.equal(convert("甲，乙 甲🐈乙"), "甲，乙 甲🐈乙");
});

test("retains a default-equivalent long phrase that shields a shorter exception", () => {
  const convert = createInitials([[0x4e00, "ABC"]], [
    { word: "一丁", initials: "XY" }, { word: "一丁丂", initials: "ABC" },
  ]);
  assert.equal(convert("一丁丂"), "ABC");
  assert.equal(convert("一丁"), "XY");
});

test("invalid phrase rules fail early", () => {
  for (const rule of [{ word: "", initials: "" }, { word: "甲乙", initials: "A" },
    { word: "甲", initials: "ab" }, { word: "甲", initials: "." }])
    assert.throws(() => createInitials([], [rule]), TypeError);
});

test("candidate search matches contiguous initials without guessing context", () => {
  const match = createCandidateMatcher(ranges, { "一": "YZ" });
  assert.equal(match("a一丂𠀀", "azdh"), true);
  assert.equal(match("a一丂𠀀", "aydh"), true);
  assert.equal(match("a一丂𠀀", "azh"), false);
  assert.equal(match("一 丂", "yd"), false);
  assert.equal(match("一🐈丂", "y🐈d"), true);
  assert.equal(match("一ß丂", "yssd"), false);
  assert.equal(match("一", ""), false);
  assert.equal(match("一", "一"), false);
  // 3^1000 possible readings never become 3^1000 allocated strings.
  assert.equal(createCandidateMatcher(ranges, { "一": "YZX" })("一".repeat(1000), "Z".repeat(999)), true);
});
