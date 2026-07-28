import assert from "node:assert/strict";
import test from "node:test";
import pyfl from "../src/index";

test("converts a Chinese character", () => {
  assert.equal(pyfl("喵"), "M");
});

test("converts a Chinese sentence", () => {
  assert.equal(
    pyfl("好笑吗跟傻子一样整天就知道哈哈哈哈哈哈哈"),
    "HXMGSZYYZTJZDHHHHHHH"
  );
});

test("converts uncommon supported characters", () => {
  assert.equal(pyfl("罤夶繙着洗"), "TBFZX");
});

test("preserves non-Chinese text", () => {
  assert.equal(pyfl("Pure"), "Pure");
  assert.equal(pyfl("Made by ❤"), "Made by ❤");
  assert.equal(pyfl("أشتون"), "أشتون");
});

test("stringifies non-string input", () => {
  assert.equal(pyfl(123456), "123456");
  assert.equal(pyfl(undefined), "undefined");
  assert.equal(pyfl(null), "null");
});
