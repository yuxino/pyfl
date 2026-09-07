/** A sorted list of code-point ranges; dots mark unsupported characters. */
export type Range = [start: number, initials: string];
export interface PhraseRule { word: string; initials: string }

export function createLookup(ranges: readonly Range[]) {
  return (codePoint: number): string | undefined => {
    let low = 0;
    let high = ranges.length - 1;
    while (low <= high) {
      const middle = (low + high) >>> 1;
      const [start, initials] = ranges[middle];
      if (codePoint < start) high = middle - 1;
      else if (codePoint >= start + initials.length) low = middle + 1;
      else {
        const initial = initials[codePoint - start];
        return initial === "." ? undefined : initial;
      }
    }
    return undefined;
  };
}

interface Node {
  children: Map<string, Node>;
  initials?: string;
}

/** Conversion with literal phrase rules. Later exact rules override; longest wins. */
export function createInitials(ranges: readonly Range[], rules: readonly PhraseRule[] = []) {
  const lookup = createLookup(ranges);
  const root: Node = { children: new Map() };
  for (const { word, initials } of rules) {
    if (!word || !/^[A-Z]+$/.test(initials) || Array.from(word).length !== initials.length)
      throw new TypeError("Each phrase needs one uppercase ASCII initial per code point");
    let node = root;
    for (const char of word) {
      let next = node.children.get(char);
      if (!next) node.children.set(char, next = { children: new Map() });
      node = next;
    }
    node.initials = initials;
  }

  return (raw: unknown): string => {
    const text = `${raw}`;
    if (!text || /^ +$/.test(text)) return "";
    let result = "";
    for (let offset = 0; offset < text.length;) {
      const codePoint = text.codePointAt(offset)!;
      const char = String.fromCodePoint(codePoint);
      let node = root.children.get(char);
      let cursor = offset + char.length;
      let end = offset;
      let matched: string | undefined;
      while (node) {
        if (node.initials !== undefined) {
          matched = node.initials;
          end = cursor;
        }
        if (cursor >= text.length) break;
        const next = String.fromCodePoint(text.codePointAt(cursor)!);
        node = node.children.get(next);
        cursor += next.length;
      }
      if (matched !== undefined) {
        result += matched;
        offset = end;
      } else {
        result += lookup(codePoint) ?? char;
        offset += char.length;
      }
    }
    return result;
  };
}
