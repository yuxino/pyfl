import firstletter from "./dict/firstletter";

/** Convert supported Chinese characters to fixed uppercase pinyin initials. */
export default function pyfl(raw: unknown): string {
  // Preserve template-string coercion, including its errors (for example Symbol).
  const str = `${raw}`;
  if (!str || /^ +$/.test(str)) return "";

  let result = "";
  let start = 0;
  for (let i = 0; i < str.length; i++) {
    const unicode = str.charCodeAt(i);
    if (unicode >= 0x4e00 && unicode <= 0x9fa5) {
      if (start < i) result += str.slice(start, i);
      result += firstletter.charAt(unicode - 0x4e00);
      start = i + 1;
    }
  }

  // Copy untouched spans verbatim, including surrogate pairs and lone surrogates.
  return start === 0 ? str : result + str.slice(start);
}
