import { createLookup, type Range } from "./runtime";

const foldAscii = (value: string) => value.replace(/[a-z]/g, char => char.toUpperCase());

/** Contiguous initial search across possible single-character readings, without
 * enumerating their Cartesian product. This does not disambiguate phrases. */
export function createCandidateMatcher(
  ranges: readonly Range[], alternatives: Readonly<Record<string, string>>,
) {
  const lookup = createLookup(ranges);
  return (raw: unknown, query: string): boolean => {
    const text = Array.from(`${raw}`);
    const wanted = Array.from(foldAscii(query));
    if (!wanted.length || wanted.length > text.length) return false;
    const choices = text.map(char => {
      const initial = lookup(char.codePointAt(0)!);
      return initial ? alternatives[char] ?? initial : undefined;
    });
    for (let start = 0; start <= text.length - wanted.length; start++) {
      let index = 0;
      for (; index < wanted.length; index++) {
        const position = start + index;
        const matched = choices[position]
          ? choices[position]!.includes(wanted[index])
          : foldAscii(text[position]) === wanted[index];
        if (!matched) break;
      }
      if (index === wanted.length) return true;
    }
    return false;
  };
}
