# 现代首字母入口

从 `2.1.0` 起，可以按覆盖范围选择现代字表、常用词组规则和多读音候选搜索。默认 `import pyfl from "pyfl"` 继续使用旧字表；现代入口需要主动导入。

## 选择入口

| 入口 | 字表覆盖 | 功能 |
| --- | ---: | --- |
| `pyfl/modern` | 8,105 字 | 等同 `common-phrases` |
| `pyfl/modern/common` | 8,105 字 | 单字首字母转换 |
| `pyfl/modern/common-phrases` | 8,105 字 | 转换，加 36 条常用词组规则 |
| `pyfl/modern/full` | 44,435 字 | 单字首字母转换 |
| `pyfl/modern/full-phrases` | 44,435 字 | 转换，加同样的词组规则 |
| `pyfl/modern/common-search` | 8,105 字 | 多读音候选搜索 |
| `pyfl/modern/full-search` | 44,435 字 | 多读音候选搜索 |

各入口独立，不使用的词组或候选数据无需导入应用。npm 安装包包含这些可选模块，安装包大小不等于应用实际使用的入口体积。转换和搜索均在本地完成，没有运行时依赖。

本版独立 ESM 产物在 gzip level 9 下，`pyfl/modern` 为 10,046 B（约 10 KB），`full-phrases` 为 36,390 B；旧入口为 12,128 B。常用版体积较小，但字表覆盖也更少。这些数值是入口文件压缩大小，不是整个 npm 安装包或应用最终构建大小。

## 转换与指定读音

```js
import modern, { createConverter } from "pyfl/modern";

modern("重庆 / 音乐 / 银行 / 行走"); // "CQ / YY / YH / XZ"

// 调用方已确认这里的“朝阳”指早晨的太阳。
const convert = createConverter([{ word: "朝阳", initials: "ZY" }]);
convert("朝阳"); // "ZY"
```

四个转换入口和 `pyfl/modern` 都导出默认转换函数 `(raw: unknown) => string`，以及 `createConverter(overrides?)`。无词组入口也可以添加自己的规则；带词组入口在内置规则之后应用自定义规则，不修改默认转换函数。

每条规则形如 `{ word: string, initials: string }`：`word` 不能为空，`initials` 必须为大写 `A–Z`，且每个 Unicode 码点对应一个字母，否则抛出 `TypeError`。同词后写的规则覆盖先写的规则；从左到右，在当前位置选择最长匹配，消费后不重叠匹配。规则按字面匹配，不跨过省略的空格或标点。

CommonJS 用法：

```js
const { default: modern, createConverter } = require("pyfl/modern");
```

词组规则仅对应列出的普通现代词义。例如“长大”按成长读 `ZD`；历史文本、地名和姓名可能需要自定义规则。没有匹配词组时使用字表默认值，未收录字符原样保留。非字符串沿用模板字符串转换，转换错误也保留；只有空串或纯半角空格变成空串，其余空白保留。

## 多读音搜索

```js
import matches from "pyfl/modern/common-search";

matches("重庆", "cq"); // true
matches("重庆", "zq"); // true
matches("音乐", "yy"); // true
matches("音乐", "yl"); // true

// 同时需要中文原文搜索时，由应用组合两种匹配。
const text = "重庆火锅";
const query = "火锅";
const found = text.includes(query) || matches(text, query); // true
```

搜索入口默认导出 `(raw: unknown, query: string) => boolean`，匹配任意连续一段首字母，忽略 ASCII 大小写。未收录字符按原文匹配，空查询返回 `false`。已收录汉字在此入口中按首字母匹配，不同时匹配汉字原文；也不支持完整拼音、跳字模糊匹配或声调。

候选搜索独立于词组规则，不进行语境消歧，也不枚举全部读音组合。候选包含来源中的罕见或历史读音，可能增加误匹配；不能把“搜得到”当成读音判断。

## 覆盖范围与迁移

常用表对应《通用规范汉字表》的 8,105 字，其中 196 字位于补充平面。扩展表取固定来源的 44,435 条记录，其中 17,652 字位于补充平面。两者都不覆盖全部汉字。

扩展表仍缺少旧字表中的 `兙兡嗧桛烪瓧瓰瓱瓼甅` 十字，也不收录 `𠮷`，这些字原样保留，不自动回退到旧表。常用表的覆盖范围更小。常用表优先读音取自 `kMandarin_8105.txt`，扩展表在其余字符上使用来源列出的首个读音；默认顺序不是语境或频率保证。

切换入口会改变部分首字母及覆盖范围。先核对业务词表与姓名读音，再重建已有索引；继续使用原 `pyfl` 入口无需迁移。

## 数据来源

现代字表由 [pinyin-data 固定提交](https://github.com/mozillazg/pinyin-data/tree/923b108dc5d45dee061324c011b478fb649f8b73) 的 `pinyin.txt` 与 `kMandarin_8105.txt` 生成，该快照使用 Unicode 17 数据。生成时去声调、只保留首字母并合并重复候选；词组规则由本项目维护，没有打包完整词组词典。

许可原文见 [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES)。来源锁、原始归属和再生成方式保留在[数据说明](https://github.com/yuxino/pyfl/blob/main/experimental/initials/data/ATTRIBUTION.md)；此前的[原型测量](https://github.com/yuxino/pyfl/blob/main/experimental/initials/README.md)属于实验构建，不能直接作为正式 npm 产物大小。
