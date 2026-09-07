# Modern initials prototype

An opt-in source experiment with a generated modern character table, a small
phrase layer, and a separate candidate-search entry. The published `pyfl@2.0.1`
API and its original dictionary are unchanged. These files are **not exported
or included in the npm package**, and the website still uses the published API.

The useful compact option is **8,105 common characters plus 36 curated phrase
rules**: 9,980 bytes gzip in the measurement below, 17.2% less than the legacy
entry under the same settings. This is a smaller inventory, not an equivalent
replacement for the old 20,902-character table. The full source inventory covers
44,435 characters and needs 36,303 bytes gzip with those rules.

## Try from a checkout

Use Node.js 22 or 24. From the repository root:

```sh
npm ci
npm run test:experimental
npm exec -- tsx experimental/initials/example.ts
```

The [example](example.ts) compares old and new conversion, demonstrates candidate
search, and supplies a confirmed reading for an ambiguous word. Import a source
entry into a TypeScript/bundler project only when opting into this experiment:

| Source entry | Behavior |
| --- | --- |
| `common.ts` | 8,105-character preferred-initial table |
| `common-phrases.ts` | Common table plus the 36 curated phrase rules |
| `full.ts` | 44,435-character preferred-initial table |
| `full-phrases.ts` | Full table plus the same phrase rules |
| `common-search.ts` | Contiguous initial queries across common-character candidate readings |
| `full-search.ts` | Contiguous initial queries across full-inventory candidate readings |

Conversion and search are separate capabilities. Conversion yields one string;
candidate search returns a boolean and never enumerates combinations of readings.
All conversion and search operate locally, with no runtime dependencies or
network requests. Only regeneration of missing source inputs needs a network.

## Reading behavior

| Input | Existing API | Modern table alone | Modern table + phrases |
| --- | --- | --- | --- |
| 重庆 | ZQ | ZQ | CQ |
| 音乐 | YL | YL | YY |
| 银行 | YH | YX | YH |
| 行走 | HZ | XZ | XZ |
| 长大 | ZD | ZD | ZD |
| 长度 | ZD | ZD | CD |

A newer table alone does not resolve context. The common inventory uses the
upstream `kMandarin_8105` preferred readings; outside it, the full table uses the
first `pinyin.txt` reading. Neither ordering is a contextual or frequency guarantee.
The phrase rules select the listed ordinary modern meanings, such as the city
重庆 and music in 音乐. They are manually curated, not a general pronunciation engine.

Matching consumes the longest literal phrase at the current position, then
continues left to right without overlapping. It does not segment sentences,
look ahead for meaning, or match across omitted spaces or punctuation. Longer
rules whose output equals the default are retained because they can shield
shorter exceptions. Explicit rules take priority even for otherwise unsupported
characters. Without a matching rule, unsupported characters pass through unchanged.

To supply a caller-confirmed reading, pass rules to `createInitials`, as in
[example.ts](example.ts). Later rules for the **same word** replace earlier ones;
a longer matching phrase still wins. A rule must have exactly one uppercase
ASCII initial per Unicode code point. The returned converter preserves template
string coercion, exceptions, non-Chinese case, punctuation, and whitespace; like
the existing API, an empty input or only ASCII spaces becomes an empty string.

`朝阳`, `同行`, historical uses of `长大`, and names can require caller knowledge.
The [fixtures](fixtures/phrases.json) record these as explicit-override cases,
without claiming a unique context-free answer. For example, the general table
outputs `CY` for 朝阳; that does not prove it is the intended pronunciation.

Candidate search accepts lowercase or uppercase ASCII initials. Both `cq` and
`zq` match 重庆, and both `yy` and `yl` match 音乐. It searches **contiguous initials**,
not full pinyin, fuzzy subsequences, or direct Chinese text for covered characters.
If your application also needs literal Chinese search, combine it with
`text.includes(query)`. Unsupported characters match literally, and ASCII case
is folded. An empty query returns false. Candidates may include rare or historical
readings and can create false positives. This mode ignores phrase context.

## Size and coverage

Measured using esbuild 0.28.2, browser ESM, ES2018, minification, UTF-8 output,
gzip level 9, and Brotli quality 11. These are complete reachable bundle sizes,
not npm tarball sizes. Unused candidate data and fixture descriptions are removed
through named JSON imports. Different compression versions or settings can change
the bytes. See the complete [machine-readable results](measurements.json).

| Bundle | Covered characters | Raw bytes | Gzip bytes | Brotli bytes |
| --- | ---: | ---: | ---: | ---: |
| Legacy source entry | 20,902 | 21,154 | 12,055 | 11,457 |
| Common conversion | 8,105 | 23,436 | 9,571 | 7,882 |
| Common + phrases | 8,105 | 24,526 | 9,980 | 8,149 |
| Full conversion | 44,435 | 90,190 | 35,916 | 32,227 |
| Full + phrases | 44,435 | 91,280 | 36,303 | 32,461 |
| Common candidate search | 8,105 | 38,567 | 17,933 | 12,724 |
| Full candidate search | 44,435 | 145,017 | 62,358 | 48,096 |

Adding 36 rules costs 409 gzip bytes on the common entry. Candidate search carries
1,673 or 5,724 sets of distinct initials, so its size cannot be quoted as the
conversion-only size. These measurements do not establish a throughput claim.

The full inventory includes 17,652 supplementary-plane code points; the common
inventory includes 196. Neither is all Unicode Han characters. The full inventory
still lacks ten characters in the legacy range: `兙兡嗧桛烪瓧瓰瓱瓼甅`. It also lacks
`𠮷`. They pass through unchanged; there is no silent legacy fallback.

Within the old range, common leaves 13,073 characters unsupported and changes
239 supported initials; full leaves ten unsupported and changes 1,841 supported
initials. A changed initial is **not** counted as a correctness improvement. Any
application adopting these entries must choose its inventory and rules explicitly
and rebuild existing indexes. Staying on the published API needs no migration.

## Verification and reproduction

`npm run test:experimental` checks the prototype's types and 14 test groups:
every Unicode code point against both decoded inventories, subset/default
consistency, known gaps, Unicode boundaries, coercion, candidate matching, 50
curated phrase examples, caller overrides, and nine independent synthetic
matching cases. The phrase examples overlap the included rules; passing all 50
is a regression result, **not an independent accuracy benchmark**. The existing
`npm run check` now includes this experimental suite alongside checks of the
unchanged production API and tarball. CI runs that combined command on Node.js
22/24 and Linux/Windows.

Regenerate the character data from content-locked sources:

```sh
node experimental/initials/scripts/generate-data.mjs
node experimental/initials/scripts/generate-data.mjs --offline --check
```

The first command verifies and caches missing upstream inputs. The second uses
that cache and compares generated bytes without network access or data changes.
Normal tests use committed data and do not need upstream downloads.

Reproduce the bundle comparison using the existing isolated benchmark workspace:

```sh
npm ci --prefix benchmark
npm run measure:experimental
```

This writes ignored runnable bundles to `generated/` and refreshes
`measurements.json`. The benchmark dependencies remain development-only and
outside the production package.

Data comes from the fixed pinyin-data snapshot
[`923b108`](https://github.com/mozillazg/pinyin-data/tree/923b108dc5d45dee061324c011b478fb649f8b73),
updated for Unicode 17. See [source attribution and original licenses](data/ATTRIBUTION.md),
[locked inputs](data/source-lock.json), and the [generation report](data/generation-report.json).
This experiment extracts the first Latin letter only, discarding tones, the rest
of each syllable, and duplicate initials. It is not full shengmu extraction.
