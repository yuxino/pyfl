import firstletter from "./dict/firstletter";

export default function(raw: any) {
  const str = `${raw}`
  if (!str || /^ +$/g.test(str)) return "";
  let result = [];
  for (let i = 0; i < str.length; i++) {
    let unicode = str.charCodeAt(i);
    let char = str.charAt(i);
    if (unicode >= 19968 && unicode <= 40869)
      char = firstletter.charAt(unicode - 19968);
    result.push(char);
  }
  return result.join("");
}
