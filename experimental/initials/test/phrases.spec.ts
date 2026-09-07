import assert from "node:assert/strict";
import test from "node:test";
import fixtures from "../fixtures/phrases.json";
import { ranges } from "../../../src/modern/data/common.json";
import productionRules from "../../../src/modern/data/phrases.json";
import commonPhrases from "../common-phrases";
import fullPhrases from "../full-phrases";
import { createInitials, type Range } from "../runtime";

test("curated phrases and surrounding text work with both inventories", () => {
  assert.equal(fixtures.rules.length, 36);
  assert.deepEqual(productionRules, fixtures.rules);
  assert.equal(new Set(fixtures.rules.map(rule => rule.word)).size, fixtures.rules.length);
  for (const { id, input, expected, notes } of fixtures.cases) {
    assert.equal(commonPhrases(input), expected, `common ${id}: ${notes}`);
    assert.equal(fullPhrases(input), expected, `full ${id}: ${notes}`);
  }
});

test("ambiguous inputs can be resolved by caller-supplied confirmed readings", () => {
  for (const item of fixtures.needsOverride) {
    assert.equal("expected" in item, false);
    for (const { initials } of item.candidates) {
      const convert = createInitials(ranges as Range[], [
        ...fixtures.rules, { word: item.input, initials },
      ]);
      assert.equal(convert(item.input), initials, item.id);
    }
  }
  const names = createInitials(ranges as Range[], [...fixtures.rules, { word: "朝阳", initials: "ZY" }]);
  assert.equal(names("朝阳，音乐"), "ZY，YY");
});

test("independently authored synthetic matching fixtures", () => {
  for (const item of fixtures.synthetic) {
    const fallback: Range[] = Object.entries(item.fallback)
      .filter((entry): entry is [string, string] => entry[1] !== undefined)
      .map(([char, initial]) => [char.codePointAt(0)!, initial]);
    fallback.sort((left, right) => left[0] - right[0]);
    assert.equal(createInitials(fallback, item.rules)(item.input), item.expected, item.id);
    if (item.expectedIfLongRuleRemoved) {
      const withoutLongRule = item.rules.filter(rule => rule.word !== item.input);
      assert.equal(createInitials(fallback, withoutLongRule)(item.input), item.expectedIfLongRuleRemoved, item.id);
    }
  }
});
