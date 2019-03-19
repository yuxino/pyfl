"use strict";

import firstletter from "./dict/firstletter";

export default function(str: string) {
  try {
    if (!str || /^ +$/g.test(str)) return "";
    var result = [];
    for (let i = 0; i < str.length; i++) {
      var unicode = str.charCodeAt(i);
      let char = str.charAt(i);
      if (unicode >= 19968 && unicode <= 40869)
        char = firstletter.charAt(unicode - 19968);
      result.push(char);
    }
    return result.join("");
  } catch (e) {
    console.error(`[pyfl] something went wrong ... ${e}`);
    console.error(`[pylf] params: ${firstletter}`);
    return str;
  }
}
