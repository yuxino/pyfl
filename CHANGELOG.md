# Changelog

## 2.1.0 — 2026-09-08

- 新增可选的 `pyfl/modern`：8,105 字常用表与 36 条词组规则，处理“重庆”“音乐”“银行”等常用词。
- 提供常用表、44,435 字扩展表、各自的词组版和多读音候选搜索入口；支持 ESM、CommonJS 与 TypeScript。
- 转换入口提供 `createConverter()`，可按已确认的读音覆盖词组；候选搜索匹配连续首字母，不推断语境。
- 保持默认 `pyfl` 入口、旧字表和转换结果兼容；选择现代入口时需核对词表并重建索引。
- 保留现代字表的固定来源、MIT 与 Unicode 许可；README 默认中文，并提供简洁英文版。

## 2.0.1 — 2026-09-07

- Preserve all existing conversion results, the original 20,902-entry dictionary, input coercion, whitespace rules, and Unicode boundaries.
- Copy unchanged text spans and append converted initials without allocating a per-character array.
- Add a native ESM build and matching declarations while preserving CommonJS `.default`, the existing UMD / AMD behavior, and the old distributed JavaScript path.
- Remove inline source maps from runtime files and declare the package free of import-time side effects.
- Include the pinyinjs dictionary's MIT attribution in the published file set.
- Add full UTF-16 compatibility checks, seeded mixed inputs, installed-package entry checks, and Node.js 22 / 24 CI on Linux and Windows.
- Update the development-only `fast-uri` lock entry to the patched version.

No data migration is needed for Pyfl-generated indexes. Native Node ESM callers can now use `import pyfl from "pyfl"`; CommonJS callers continue to use `require("pyfl").default`.
