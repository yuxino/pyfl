<div align="center">
  <img src="https://raw.githubusercontent.com/yuxino/pyfl/main/docs/pyfl-logo.png" width="112" alt="pyfl 短发小魔女">
  <h1>pyfl</h1>
  <p>把中文变成好找的首字母。</p>
  <p><a href="https://pyfl.yuxino.cn">在线试一试</a> · <a href="https://www.npmjs.com/package/pyfl">npm</a> · <a href="https://github.com/yuxino/pyfl/issues">反馈问题</a></p>
  <p><strong>简体中文</strong> · <a href="https://github.com/yuxino/pyfl/blob/main/README_en.md">English</a></p>
</div>

轻量的拼音首字母工具，适合中文标题、通讯录和搜索索引。本地转换，无运行时依赖。`2.1.0` 新增可选的现代字表、词组规则和多读音搜索，原有入口保持兼容。

## 安装

```sh
npm install pyfl
```

## 使用

沿用旧字表，已有索引无需迁移：

```js
import pyfl from "pyfl";

pyfl("你好，世界"); // "NH，SJ"
pyfl("重庆");       // "ZQ"，保持原结果
```

现代入口使用 8,105 字的常用表和 36 条词组规则：

```js
import modern from "pyfl/modern";

modern("重庆 / 音乐 / 银行 / 行走"); // "CQ / YY / YH / XZ"
modern("周末去 Tokyo 🐈");          // "ZMQ Tokyo 🐈"
```

多读音搜索让不同读法的首字母都能匹配：

```js
import matches from "pyfl/modern/common-search";

matches("重庆", "cq"); // true
matches("重庆", "zq"); // true
```

支持 ESM、CommonJS 和 TypeScript；CommonJS 使用 `require("pyfl").default`，现代入口同样通过 `.default` 调用。需要 44,435 字的扩展表、不带词组的轻量入口或自定义读音，见[现代入口指南](https://github.com/yuxino/pyfl/blob/main/docs/modern.md)。

## 使用边界

- 默认 `pyfl` 保留原有 20,902 字表；现代字表读音和覆盖范围不同，切换后应重建索引。
- 未收录字符原样保留。英文大小写、数字、标点和 emoji 保留；纯半角空格转为空串。
- 词组规则处理收录的常用词，不推断任意语境或姓名。多读音搜索匹配连续首字母，可能包含罕见读法，不代表选中了正确读音。
- 输出每字拼音的第一个字母，不输出完整拼音或 `zh/ch/sh` 声母。

## 开发与许可

Node.js 22 / 24：`npm ci` 后运行 `npm run check`，完成类型、回归、构建和安装包检查。

旧字表来自 [pinyinjs](https://github.com/sxei/pinyinjs)，现代字表由固定版本的 [pinyin-data](https://github.com/mozillazg/pinyin-data/tree/923b108dc5d45dee061324c011b478fb649f8b73) 生成。数据来源与许可见 [THIRD_PARTY_NOTICES](https://github.com/yuxino/pyfl/blob/main/THIRD_PARTY_NOTICES)，版本变化见 [CHANGELOG](https://github.com/yuxino/pyfl/blob/main/CHANGELOG.md)。

[MIT](https://github.com/yuxino/pyfl/blob/main/LICENSE) © [yuxino](https://github.com/yuxino)
