"use strict";

import test from "ava";
import pyfl from "../src/index";

test("should return M", t => t.is(pyfl("喵"), "M"));

test("should return HXMGSZYYZTJZDHHHHHHH", t =>
  t.is(
    pyfl("好笑吗跟傻子一样整天就知道哈哈哈哈哈哈哈"),
    "HXMGSZYYZTJZDHHHHHHH"
  ));

test("should return TBFZX", t => t.is(pyfl("罤夶繙着洗"), "TBFZX"));

test("should return Pure", t => t.is(pyfl("Pure"), "Pure"));

test("should return Made by ❤", t => t.is(pyfl("Made by ❤"), "Made by ❤"));

// Will return origin string
test("أشتون", t => t.is(pyfl("أشتون"), "أشتون"));

test("should return 123456", t => t.is(pyfl(123456), "123456"));

test("should return undefined", t => t.is(pyfl(undefined), "undefined"));

test("should return null", t => t.is(pyfl(null), "null"));