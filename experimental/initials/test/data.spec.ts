import assert from "node:assert/strict";
import test from "node:test";
import commonData from "../../../src/modern/data/common.json";
import fullData from "../../../src/modern/data/full.json";
import common from "../common";
import full from "../full";
import matchCommon from "../common-search";
import { createLookup, type Range } from "../runtime";

for (const [data, expectedCount] of [[commonData, 8105], [fullData, 44435]] as const) {
  test(`${data.name}: validates every code point against the decoded inventory`, () => {
    const entries = new Map<number, string>();
    let previousEnd = -1;
    for (const [start, letters] of data.ranges as Range[]) {
      assert(Number.isInteger(start) && start > previousEnd);
      assert.match(letters, /^[A-Z.]+$/);
      previousEnd = start + letters.length - 1;
      assert(previousEnd <= 0x10ffff);
      Array.from(letters).forEach((letter, offset) => {
        if (letter !== ".") entries.set(start + offset, letter);
      });
    }
    assert.equal(entries.size, expectedCount);
    assert.equal(entries.size, data.entries);
    const lookup = createLookup(data.ranges as Range[]);
    for (let code = 0; code <= 0x10ffff; code++)
      assert.equal(lookup(code), entries.get(code), `U+${code.toString(16)}`);
    for (const [char, letters] of Object.entries(data.alternatives)) {
      assert.equal(Array.from(char).length, 1);
      assert.match(letters, /^[A-Z]{2,26}$/);
      assert.equal(letters.length, new Set(letters).size);
      assert.equal(letters[0], lookup(char.codePointAt(0)!));
    }
  });
}

test("common inventory is a subset of full with the same preferred initials", () => {
  const lookup = createLookup(fullData.ranges as Range[]);
  for (const [start, letters] of commonData.ranges as Range[])
    Array.from(letters).forEach((letter, offset) => {
      if (letter !== ".") assert.equal(lookup(start + offset), letter);
    });
});

test("the full inventory expands coverage but retains the ten known legacy gaps", () => {
  const lookup = createLookup(fullData.ranges as Range[]);
  let missing = "";
  for (let code = 0x4e00; code <= 0x9fa5; code++)
    if (lookup(code) === undefined) missing += String.fromCodePoint(code);
  assert.equal(missing, "兙兡嗧桛烪瓧瓰瓱瓼甅");
  assert.equal(full(missing), missing);
  assert.equal(full("𠀀𠮷 🐈"), "H𠮷 🐈");
  assert.equal(common("㴔"), "X");
  assert.equal(full("㴔"), "X");
});

test("candidate search accepts alternatives but is not a contextual reading", () => {
  for (const query of ["cq", "zq"]) assert.equal(matchCommon("重庆", query), true);
  for (const query of ["yy", "yl"]) assert.equal(matchCommon("音乐", query), true);
  assert.equal(matchCommon("重庆", "chongqing"), false);
});
