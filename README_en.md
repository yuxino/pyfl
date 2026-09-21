<div align="center">
  <img src="https://raw.githubusercontent.com/yuxino/pyfl/main/docs/pyfl-logo.png" width="112" alt="pyfl short-haired witch">
  <h1>pyfl</h1>
  <p>Convert Chinese text to pinyin initials for search.</p>
  <p><a href="https://pyfl.yuxino.cn">Try it online</a> · <a href="https://www.npmjs.com/package/pyfl">npm</a> · <a href="https://github.com/yuxino/pyfl/issues">Report an issue</a></p>
  <p><a href="https://github.com/yuxino/pyfl/blob/main/README.md">简体中文</a> · <strong>English</strong></p>
</div>

Pyfl is a JavaScript / TypeScript library that converts Chinese text such as 你好 to pinyin initials such as `NH`, for use in titles, contact lists, and search indexes. Conversion runs locally with no runtime dependencies. Modern entries support phrase rules and searches across alternative pronunciations. The default entry keeps the original dictionary for existing projects.

## Install

```sh
npm install pyfl
```

## Use

Keep the original dictionary and existing indexes:

```js
import pyfl from "pyfl";

pyfl("你好，世界"); // "NH，SJ"
pyfl("重庆");       // "ZQ", unchanged
```

Available since 2.1.0, the modern entry uses an 8,105-character inventory with 36 phrase rules:

```js
import modern from "pyfl/modern";

modern("重庆 / 音乐 / 银行 / 行走"); // "CQ / YY / YH / XZ"
modern("周末去 Tokyo 🐈");          // "ZMQ Tokyo 🐈"
```

Match initials across alternative readings:

```js
import matches from "pyfl/modern/common-search";

matches("重庆", "cq"); // true
matches("重庆", "zq"); // true
```

ESM, CommonJS, and TypeScript are supported. CommonJS uses `require("pyfl").default`; modern entries also expose `.default`. For the 44,435-character inventory, entries without phrase rules, and custom readings, see the [modern entry guide (Chinese)](https://github.com/yuxino/pyfl/blob/main/docs/modern.md).

## Limits

- The default `pyfl` entry retains its original 20,902-character table. Modern entries have different readings and coverage; rebuild indexes when switching.
- Unsupported characters pass through unchanged. Latin case, numbers, punctuation, and emoji are preserved; input containing only ASCII spaces becomes an empty string.
- Phrase rules handle their listed common meanings, not arbitrary context or names. Candidate search matches contiguous initials and may include rare readings; it does not choose the correct pronunciation.
- Output is the first letter of each pinyin syllable, not full pinyin or full initials such as `zh/ch/sh`.

## Development and license

With Node.js 22 / 24, run `npm ci` and `npm run check` for types, regressions, builds, and installed-package checks.

The original table comes from [pinyinjs](https://github.com/sxei/pinyinjs). Modern tables are generated from a pinned [pinyin-data](https://github.com/mozillazg/pinyin-data/tree/923b108dc5d45dee061324c011b478fb649f8b73) snapshot. See [THIRD_PARTY_NOTICES](https://github.com/yuxino/pyfl/blob/main/THIRD_PARTY_NOTICES) for data provenance and licenses, and [CHANGELOG](https://github.com/yuxino/pyfl/blob/main/CHANGELOG.md) for changes.

[MIT](https://github.com/yuxino/pyfl/blob/main/LICENSE) © [yuxino](https://github.com/yuxino)
