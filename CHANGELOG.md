# Changelog

## 2.0.1 — 2026-09-07

- Preserve all existing conversion results, the original 20,902-entry dictionary, input coercion, whitespace rules, and Unicode boundaries.
- Copy unchanged text spans and append converted initials without allocating a per-character array.
- Add a native ESM build and matching declarations while preserving CommonJS `.default`, the existing UMD / AMD behavior, and the old distributed JavaScript path.
- Remove inline source maps from runtime files and declare the package free of import-time side effects.
- Include the pinyinjs dictionary's MIT attribution in the published file set.
- Add full UTF-16 compatibility checks, seeded mixed inputs, installed-package entry checks, and Node.js 22 / 24 CI on Linux and Windows.
- Update the development-only `fast-uri` lock entry to the patched version.

No data migration is needed for Pyfl-generated indexes. Native Node ESM callers can now use `import pyfl from "pyfl"`; CommonJS callers continue to use `require("pyfl").default`.
