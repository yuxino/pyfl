# Modern initials experiment: design and decision

The approved investigation is whether Pyfl can offer a smaller modern initials
inventory with optional polyphonic-word handling. Preserve the published API and
existing indexes while obtaining runnable, comparable evidence for an opt-in path.

## Chosen design

- Generate source-locked common and full single-character inventories from
  pinyin-data, retaining only uppercase first letters and distinct alternatives.
  Keep originals of the upstream MIT and Unicode notices with the generated data.
- Store sorted code-point ranges with explicit holes. Lookup and phrase matching
  consume Unicode code points, including supplementary characters.
- Keep default conversion, curated longest-match phrases, and all-candidate
  initial search separate. Callers may add confirmed readings for names/ambiguities.
- Use manual ordinary-word rules for the experiment. Avoid importing a broad
  phrase dictionary before demonstrating its benefit and measuring its overhead.
- Leave production source, exports, version, and package file allowlist unchanged.
  The experiment is source-only; publication and website integration are separate.

## Alternatives considered

A collation-boundary implementation is small but delegates readings to the
environment and does not choose word context. A complete pinyin engine provides
broader capabilities but brings data that an initials-only use case may not need.
A modern single-character table alone improves traceability and coverage options,
but still cannot infer the correct reading of 音乐 or 银行.

## Measured decision

The common inventory with 36 rules is a viable optional compact mode for domains
that accept its 8,105-character coverage: 9,980 gzip bytes, 17.2% below the legacy
source entry measured identically. Full coverage of the selected 44,435-character
source needs 36,303 gzip bytes with the same rules. It is not smaller than legacy.
All-candidate search is useful for recall but costs more space and admits rare
readings. None of these findings warrants replacing the old default silently.

The fixture corpus and current algorithm prove the stated local matching rules,
not general-language accuracy. A future public entry should retain this opt-in
boundary, document index migration, and validate the target application's own
vocabulary before adding larger phrase inventories. See the
[prototype guide](../../experimental/initials/README.md) for runnable examples,
sizes, data provenance, known coverage gaps, and reproduction commands.
