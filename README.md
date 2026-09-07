<div align="center">
  <img src="docs/pyfl-avatar.png" width="112" alt="pyfl">
  <h1>pyfl</h1>
  <p>Turn Chinese text into searchable initials.</p>
  <p>
    <a href="https://pyfl.yuxino.cn"><strong>Try it online</strong></a>
    · <a href="https://www.npmjs.com/package/pyfl">npm</a>
    · <a href="https://github.com/yuxino/pyfl/issues">Report an issue</a>
  </p>
  <p><strong>English</strong> · <a href="README_zh-CN.md">简体中文</a></p>
</div>

pyfl converts supported Chinese characters to uppercase pinyin initials, one character at a time. It preserves English text, numbers, spaces, and symbols. Use it for Chinese title searches, contact abbreviations, or search indexes. Conversion uses a built-in dictionary, makes no network requests, and has no runtime dependencies.

Version `2.0.1` keeps the `2.0.0` dictionary and conversion rules while improving string concatenation, reducing package size, and adding a native ESM entry point. Existing initials indexes need no migration. **`2.0.1` is published on npm and available with `npm install pyfl`.**

## Install and use

Install the published npm version:

```bash
npm install pyfl
```

In frontend projects using Vite, Webpack, or similar bundlers:

```js
import pyfl from "pyfl";

pyfl("喵");             // "M"
pyfl("你好，世界");      // "NH，SJ"
pyfl("周末去 Tokyo 🐈"); // "ZMQ Tokyo 🐈"
pyfl("Made by ❤");     // "Made by ❤"
```

The CommonJS entry keeps the existing `.default` usage:

```js
const pyfl = require("pyfl").default;
```

The `2.0.1` npm package includes native ESM and CommonJS/UMD builds. Node ESM, browser modules, and bundlers that support `exports` can use its default export directly. The TypeScript declaration is `pyfl(raw: unknown): string`. To build the library locally, see [Build from source](#build-from-source).

## Use initials in search

Generate indexes when the data changes, then reuse them for each query:

```js
const items = ["张小明", "李小雨", "上海笔记"].map((title) => ({
  title,
  initials: pyfl(title).toLowerCase(),
}));

const query = "zxm".toLowerCase();
const matches = items.filter(({ title, initials }) =>
  title.toLowerCase().includes(query) || initials.includes(query)
);
// [{ title: "张小明", initials: "zxm" }]
```

Pyfl only generates initials. Your application decides how to sort, match, normalize case, and update its indexes.

## Conversion rules and limits

- The built-in table contains 20,902 fixed initials for `U+4E00–U+9FA5`, preserving the original dictionary.
- Characters outside that range stay unchanged, including extended Chinese characters, emoji, combining characters, and lone UTF-16 surrogates.
- Only an empty string or a string consisting entirely of ASCII spaces becomes an empty string. Tabs, line breaks, nonbreaking spaces, and fullwidth spaces are preserved.
- Non-string inputs use JavaScript template-string coercion. Any errors raised by that conversion are preserved.
- Pyfl does not segment words, recognize surnames, infer context-dependent pronunciations, or produce full pinyin.

```js
pyfl(123456);     // "123456"
pyfl(undefined);  // "undefined"
pyfl(null);       // "null"
pyfl("   ");      // ""
pyfl("\t\n");     // "\t\n"
pyfl(Symbol());   // TypeError, matching template-string coercion
pyfl("𠮷野家");    // "𠮷YJ"

pyfl("重庆");     // "ZQ"; does not infer chóng for 重 in this place name
pyfl("音乐");     // "YL"; does not infer yuè for 乐 in this word
```

If you need contextual pronunciation, full pinyin, or surname rules, use an engine with those capabilities, such as [pinyin-pro](https://pinyin-pro.cn/use/pinyin.html). Switching engines changes existing indexes, so rebuild your data and check your application's vocabulary.

## Build from source

Development and CI use Node.js 22 or 24, npm, and the committed `package-lock.json`:

```bash
git clone https://github.com/yuxino/pyfl.git
cd pyfl
git checkout main
npm ci
npm run check
npm pack
```

`npm run check` covers type checking, regression checks across the full UTF-16 range and mixed text, a production build, and ESM, CommonJS, UMD, AMD, and TypeScript entry points installed from a real tarball. The automated UMD/AMD checks run in isolated JavaScript contexts; the website's browser interactions are verified separately.

Build outputs are `dist/index.mjs` and `dist/pyfl.min.js`, with declarations in `types/`. The legacy `require("pyfl/dist/pyfl.min.js").default` deep import remains available. Runtime files no longer contain inline source maps.

See the [optimization notes](docs/optimization.md) for the compared approaches, measurement conditions, and reproducible commands, and the [CHANGELOG](CHANGELOG.md) for changes. Candidate engines used for benchmarking live separately in `benchmark/`; they are not runtime dependencies and are not included in the published package.

## Origins and license

pyfl was originally written for [WeChat](https://github.com/Nbsaw/WeChat). Its initials dictionary is adapted from [pinyinjs](https://github.com/sxei/pinyinjs) and is unchanged in this update. The upstream license is included in [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES).

[MIT](LICENSE) © [yuxino](https://github.com/yuxino)
